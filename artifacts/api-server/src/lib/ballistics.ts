// ============================================================
// ATLAN-REFACTORED: artifacts/api-server/src/lib/ballistics.ts
// Версія: 2.0 | Аудит: Test_Atlan v1.0 | Дата: 2026-03-30
//
// ВИПРАВЛЕНІ ПОМИЛКИ:
//   BUG-001: Умова конвергенції zero-finding (Math.abs(0) → Math.abs(prevError))
//   BUG-002: Формула inchesToMOA/MRAD виправлена (~57x похибка → точна)
//   BUG-003: Подвійна модель вітру замінена єдиним lag-time методом
//   BUG-004: Drag рівняння — додано DRAG_UNIT_FACTOR = 1/144
//   BUG-005: Headwind не модифікує MV, тепер відносна швидкість в повітрі
//   WARN-003: Додано трансзвукові точки drag-таблиці (Mach ~1.05)
//   WARN-004: pointBlankRange — зберігається максимальне значення
// ============================================================

export interface BallisticInput {
  muzzleVelocity: number;          // fps
  ballisticCoefficient: number;    // G1 або G7 BC
  bcModel: "G1" | "G7";
  bulletWeight: number;            // grains
  bulletDiameter: number;          // inches
  zeroRange: number;               // yards
  scopeHeight: number;             // inches above bore
  maxRange: number;                // yards (max 3000)
  rangeStep: number;               // yards
  windSpeed: number;               // mph
  windAngle: number;               // degrees (0=headwind, 90=full right crosswind)
  temperature: number;             // °F
  altitude: number;                // feet ASL ≥ 0
  humidity: number;                // 0-100
  pressure: number;                // inHg barometric
  targetAngle: number;             // degrees (-90..+90)
  unitSystem: "imperial" | "metric";
}

export interface TrajectoryPoint {
  range: number;
  drop: number;
  windDrift: number;
  velocity: number;
  energy: number;
  timeOfFlight: number;
  dropMOA: number;
  dropMRAD: number;
  windMOA: number;
  windMRAD: number;
}

export interface BallisticResult {
  trajectory: TrajectoryPoint[];
  maxRange: number;
  zeroRange: number;
  pointBlankRange: number;
  supersonicLimit: number;
}

// ── Фізичні константи (foot-pound-second система) ────────────
const GRAVITY = 32.174;                   // ft/s²
const SPEED_OF_SOUND_SEA_LEVEL = 1116.45; // fps при 59°F та MSL
const DRAG_UNIT_FACTOR = 1.0 / 144.0;    // ВИПРАВЛЕНО BUG-004: один SD (lb/in²) = 144 * (lb/ft²)
const MOA_PER_100YD = 1.04719755;        // дюймів на 100 ярдів = 1 MOA (точне значення)
const MRAD_PER_100YD = 3.6;             // дюймів на 100 ярдів = 1 mrad

// ── Відносна густина повітря ─────────────────────────────────
// WARN-001: якщо pressure введено — не дублюємо altitude корекцію
function airDensityRatio(
  _altitude: number, // резерв для ISA-only режиму (якщо pressure не задано)
  temperature: number,
  pressure: number,
  humidity: number
): number {
  const standardPressure = 29.921; // inHg
  const standardTemp = 59.0;       // °F

  const tempRankine         = temperature + 459.67;
  const standardTempRankine = standardTemp + 459.67;

  const pressureRatio = pressure / standardPressure;
  const tempRatio     = standardTempRankine / tempRankine;

  // Magnus formula для парціального тиску водяної пари
  const tempCelsius             = (temperature - 32) / 1.8;
  const saturatedVaporPressure  = 0.01 * Math.exp(17.625 * tempCelsius / (243.04 + tempCelsius));
  const vaporPressure           = (humidity / 100) * saturatedVaporPressure;

  // H₂O (18 г/моль) < N₂ (28 г/моль) → вологе повітря легше → вища швидкість звуку
  return pressureRatio * tempRatio * (1.0 - 0.378 * vaporPressure / pressure);
}

// ── G1 Drag Table ─────────────────────────────────────────────
// WARN-003: додано трансзвукову точку Mach 1.05 для коректного піку опору
function g1DragCoefficient(mach: number): number {
  if (mach > 1.6)  return 0.4795;
  if (mach > 1.4)  return 0.4399 + (0.4795 - 0.4399) * (mach - 1.4) / 0.2;
  if (mach > 1.2)  return 0.4128 + (0.4399 - 0.4128) * (mach - 1.2) / 0.2;
  if (mach > 1.05) return 0.3850 + (0.4128 - 0.3850) * (mach - 1.05) / 0.15;
  if (mach > 1.0)  return 0.3478 + (0.3850 - 0.3478) * (mach - 1.0)  / 0.05;
  if (mach > 0.9)  return 0.2897 + (0.3478 - 0.2897) * (mach - 0.9)  / 0.1;
  if (mach > 0.8)  return 0.2306 + (0.2897 - 0.2306) * (mach - 0.8)  / 0.1;
  if (mach > 0.7)  return 0.1768 + (0.2306 - 0.1768) * (mach - 0.7)  / 0.1;
  if (mach > 0.6)  return 0.1295 + (0.1768 - 0.1295) * (mach - 0.6)  / 0.1;
  if (mach > 0.5)  return 0.1000 + (0.1295 - 0.1000) * (mach - 0.5)  / 0.1;
  return 0.1000;
}

// ── G7 Drag Table ─────────────────────────────────────────────
function g7DragCoefficient(mach: number): number {
  if (mach > 1.6)  return 0.2257;
  if (mach > 1.4)  return 0.2101 + (0.2257 - 0.2101) * (mach - 1.4) / 0.2;
  if (mach > 1.2)  return 0.1867 + (0.2101 - 0.1867) * (mach - 1.2) / 0.2;
  if (mach > 1.05) return 0.1720 + (0.1867 - 0.1720) * (mach - 1.05) / 0.15;
  if (mach > 1.0)  return 0.1654 + (0.1720 - 0.1654) * (mach - 1.0)  / 0.05;
  if (mach > 0.9)  return 0.1387 + (0.1654 - 0.1387) * (mach - 0.9)  / 0.1;
  if (mach > 0.8)  return 0.1049 + (0.1387 - 0.1049) * (mach - 0.8)  / 0.1;
  if (mach > 0.7)  return 0.0816 + (0.1049 - 0.0816) * (mach - 0.7)  / 0.1;
  if (mach > 0.6)  return 0.0680 + (0.0816 - 0.0680) * (mach - 0.6)  / 0.1;
  if (mach > 0.5)  return 0.0590 + (0.0680 - 0.0590) * (mach - 0.5)  / 0.1;
  return 0.0590;
}

// ── Кутові конвертації — ВИПРАВЛЕНО BUG-002 ─────────────────
function inchesToMOA(inches: number, rangeYards: number): number {
  if (rangeYards === 0) return 0;
  // 1 MOA = MOA_PER_100YD дюймів на 100 ярдів
  return (inches / rangeYards) * (100 / MOA_PER_100YD);
}

function inchesToMRAD(inches: number, rangeYards: number): number {
  if (rangeYards === 0) return 0;
  // 1 mrad = 3.6 дюйми на 100 ярдів
  return (inches / rangeYards) * (100 / MRAD_PER_100YD);
}

// ── Головна функція розрахунку ────────────────────────────────
export function calculateBallistics(input: BallisticInput): BallisticResult {
  const {
    muzzleVelocity,
    ballisticCoefficient,
    bcModel,
    bulletWeight,
    zeroRange,
    scopeHeight,
    maxRange,
    rangeStep,
    windSpeed,
    windAngle,
    temperature,
    altitude,
    humidity,
    pressure,
    targetAngle,
  } = input;

  // Захист від граничних значень
  if (muzzleVelocity <= 0)          throw new Error("muzzleVelocity must be > 0");
  if (ballisticCoefficient <= 0)    throw new Error("ballisticCoefficient must be > 0");
  if (zeroRange <= 0)               throw new Error("zeroRange must be > 0");
  if (altitude < 0)                 throw new Error("altitude must be >= 0");

  const densityRatio = airDensityRatio(altitude, temperature, pressure, humidity);

  // Швидкість звуку: ISA-корекція по температурі (сухе повітря)
  const speedOfSound = SPEED_OF_SOUND_SEA_LEVEL * Math.sqrt((temperature + 459.67) / (59.0 + 459.67));

  // Ефективний BC, скоригований по густині повітря
  const effectiveBC = ballisticCoefficient / densityRatio;

  // ── Вітровий вектор — ВИПРАВЛЕНО BUG-005 ────────────────────
  // Вітер — зовнішній течієвий вектор, НЕ змінює початкову швидкість кулі
  const windAngleRad  = (windAngle * Math.PI) / 180;
  const crossWindFps  = windSpeed * Math.sin(windAngleRad) * 1.46667; // mph → fps, бічний
  const headWindFps   = windSpeed * Math.cos(windAngleRad) * 1.46667; // mph → fps, зустрічний

  const targetAngleRad = (targetAngle * Math.PI) / 180;
  const cosAngle       = Math.cos(targetAngleRad);

  const getDrag = bcModel === "G7" ? g7DragCoefficient : g1DragCoefficient;

  // Часовий крок чисельного інтегрування (метод Ейлера)
  const dt = 0.001; // с

  // ────────────────────────────────────────────────────────────
  // КРОК 1: Zero-Finding — ВИПРАВЛЕНО BUG-001
  // Знаходимо кут пристрілювання через ітеративну конвергенцію
  // ────────────────────────────────────────────────────────────
  let zeroElevationAngle = 0.0;
  let prevError          = Infinity;

  for (let iter = 0; iter < 100; iter++) {
    let tx  = 0, ty = 0;
    let tvx = muzzleVelocity * Math.cos(zeroElevationAngle);
    let tvy = muzzleVelocity * Math.sin(zeroElevationAngle);

    for (let step = 0; step < 30000; step++) {
      const tv = Math.sqrt(tvx * tvx + tvy * tvy);
      if (tv < 100) break;

      // Відносна швидкість кулі відносно повітряної маси (з headwind)
      const tvxRel    = tvx - headWindFps;
      const tvRelMag  = Math.sqrt(tvxRel * tvxRel + tvy * tvy);
      const mach      = tvRelMag / speedOfSound;

      const cd        = getDrag(mach);
      // ВИПРАВЛЕНО BUG-004: DRAG_UNIT_FACTOR = 1/144
      const dragAccel = cd * tvRelMag * tvRelMag * DRAG_UNIT_FACTOR / effectiveBC;

      tvx += (-dragAccel * tvxRel / tvRelMag) * dt;
      tvy += ((-dragAccel * tvy  / tvRelMag) - GRAVITY) * dt;
      tx  += tvx * dt;
      ty  += tvy * dt;

      const txYards = tx / 3;
      if (txYards >= zeroRange) {
        // Помилка вертикального положення відносно нуля (в дюймах)
        const yAtZero        = ty * 12 + scopeHeight;
        // ВИПРАВЛЕНО BUG-001: корекція кута та реальна умова конвергенції
        zeroElevationAngle  -= (yAtZero / (zeroRange * 36)) * 0.5;
        prevError            = yAtZero;
        break;
      }
    }

    // ВИПРАВЛЕНО BUG-001: перевіряємо реальну похибку, а не літерал 0
    if (Math.abs(prevError) < 0.005) break;
  }

  // ────────────────────────────────────────────────────────────
  // КРОК 2: Траєкторна симуляція
  // ────────────────────────────────────────────────────────────
  let vx = muzzleVelocity * Math.cos(zeroElevationAngle);
  let vy = muzzleVelocity * Math.sin(zeroElevationAngle);
  let x  = 0.0; // футів
  let y  = 0.0; // футів
  let t  = 0.0; // секунд

  const points: TrajectoryPoint[] = [];
  let nextRangeYards    = 0;
  let supersonicLimit   = 0;
  let pointBlankRangeMax = 0; // ВИПРАВЛЕНО WARN-004: зберігаємо максимальне значення

  for (let step = 0; step < 3_000_000; step++) {
    const v = Math.sqrt(vx * vx + vy * vy);
    if (v < 100) break;

    // Відносна швидкість в повітряній масі — ВИПРАВЛЕНО BUG-005
    const vxRel   = vx - headWindFps;
    const vRel    = Math.sqrt(vxRel * vxRel + vy * vy);
    const mach    = vRel / speedOfSound;

    const cd      = getDrag(mach);
    // ВИПРАВЛЕНО BUG-004: drag = Cd * v_rel² / (BC * 144)
    const dragAccel = cd * vRel * vRel * DRAG_UNIT_FACTOR / effectiveBC;
    const dragAx    = -dragAccel * (vxRel / vRel);
    const dragAy    = -dragAccel * (vy    / vRel);

    vx += dragAx * dt;
    vy += (dragAy - GRAVITY) * dt;
    x  += vx * dt;
    y  += vy * dt;
    t  += dt;

    if (mach >= 1.0) supersonicLimit = x / 3;

    const xYards = x / 3;
    if (xYards > maxRange + rangeStep || v < 100) break;

    if (xYards >= nextRangeYards) {
      // Вертикальне зміщення (drop) — від'ємне означає падіння нижче нуля
      const dropInches = y * 12 + scopeHeight;
      const angledDrop = dropInches * cosAngle; // WARN-005: точний для кутів < 20°

      // Бічний дрейф від вітру — ВИПРАВЛЕНО BUG-003: ОДИН метод — lag-time
      // lag_time = t_flight - t_vacuum = реальний час - час у вакуумі
      const vacuumTime  = x / muzzleVelocity; // сек, якби не було опору
      const lagTime     = Math.max(0, t - vacuumTime);
      const windDriftIn = crossWindFps * lagTime * 12; // дюйми

      // ВИПРАВЛЕНО WARN-004: pointBlankRange = максимальна дистанція в межах ±3"
      if (Math.abs(dropInches) <= 3.0) {
        pointBlankRangeMax = xYards;
      }

      points.push({
        range:        Math.round(xYards),
        drop:         parseFloat(angledDrop.toFixed(2)),
        windDrift:    parseFloat(windDriftIn.toFixed(2)),
        velocity:     parseFloat(v.toFixed(0)),
        energy:       parseFloat((bulletWeight * v * v / 450400).toFixed(0)),
        timeOfFlight: parseFloat(t.toFixed(3)),
        // ВИПРАВЛЕНО BUG-002: правильні формули MOA та MRAD
        dropMOA:  parseFloat(inchesToMOA(-angledDrop, xYards).toFixed(2)),
        dropMRAD: parseFloat(inchesToMRAD(-angledDrop, xYards).toFixed(2)),
        windMOA:  parseFloat(inchesToMOA(windDriftIn, xYards).toFixed(2)),
        windMRAD: parseFloat(inchesToMRAD(windDriftIn, xYards).toFixed(2)),
      });

      nextRangeYards += rangeStep;
      if (nextRangeYards > maxRange) break;
    }
  }

  return {
    trajectory:      points,
    maxRange,
    zeroRange,
    pointBlankRange: parseFloat(pointBlankRangeMax.toFixed(0)),
    supersonicLimit: parseFloat(supersonicLimit.toFixed(0)),
  };
}

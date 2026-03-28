export interface BallisticInput {
  muzzleVelocity: number;
  ballisticCoefficient: number;
  bcModel: "G1" | "G7";
  bulletWeight: number;
  bulletDiameter: number;
  zeroRange: number;
  scopeHeight: number;
  maxRange: number;
  rangeStep: number;
  windSpeed: number;
  windAngle: number;
  temperature: number;
  altitude: number;
  humidity: number;
  pressure: number;
  targetAngle: number;
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

const GRAVITY = 32.174;
const SPEED_OF_SOUND_SEA_LEVEL = 1116.45;

function airDensityRatio(
  altitude: number,
  temperature: number,
  pressure: number,
  humidity: number
): number {
  const standardTemp = 59.0;
  const standardPressure = 29.921;
  const standardAltitude = 0;

  const tempRankine = temperature + 459.67;
  const standardTempRankine = standardTemp + 459.67;

  const pressureRatio = pressure / standardPressure;
  const tempRatio = standardTempRankine / tempRankine;

  const altitudeFactor = Math.exp(-altitude / 30000);

  const vaporPressure = humidity * 0.01 * 0.01 * Math.exp(17.625 * ((temperature - 32) / 1.8) / (243.04 + (temperature - 32) / 1.8));

  const dryAirRatio = pressureRatio * tempRatio * (altitudeFactor / Math.exp(-standardAltitude / 30000));

  return dryAirRatio * (1 - 0.378 * vaporPressure / pressure);
}

function g1DragCoefficient(mach: number): number {
  if (mach > 1.6) return 0.4795;
  if (mach > 1.4) return 0.4399 + (0.4795 - 0.4399) * (mach - 1.4) / 0.2;
  if (mach > 1.2) return 0.4128 + (0.4399 - 0.4128) * (mach - 1.2) / 0.2;
  if (mach > 1.0) return 0.3478 + (0.4128 - 0.3478) * (mach - 1.0) / 0.2;
  if (mach > 0.9) return 0.2897 + (0.3478 - 0.2897) * (mach - 0.9) / 0.1;
  if (mach > 0.8) return 0.2306 + (0.2897 - 0.2306) * (mach - 0.8) / 0.1;
  if (mach > 0.7) return 0.1768 + (0.2306 - 0.1768) * (mach - 0.7) / 0.1;
  if (mach > 0.6) return 0.1295 + (0.1768 - 0.1295) * (mach - 0.6) / 0.1;
  if (mach > 0.5) return 0.1000 + (0.1295 - 0.1000) * (mach - 0.5) / 0.1;
  return 0.1000;
}

function g7DragCoefficient(mach: number): number {
  if (mach > 1.6) return 0.2257;
  if (mach > 1.4) return 0.2101 + (0.2257 - 0.2101) * (mach - 1.4) / 0.2;
  if (mach > 1.2) return 0.1867 + (0.2101 - 0.1867) * (mach - 1.2) / 0.2;
  if (mach > 1.0) return 0.1654 + (0.1867 - 0.1654) * (mach - 1.0) / 0.2;
  if (mach > 0.9) return 0.1387 + (0.1654 - 0.1387) * (mach - 0.9) / 0.1;
  if (mach > 0.8) return 0.1049 + (0.1387 - 0.1049) * (mach - 0.8) / 0.1;
  if (mach > 0.7) return 0.0816 + (0.1049 - 0.0816) * (mach - 0.7) / 0.1;
  if (mach > 0.6) return 0.0680 + (0.0816 - 0.0680) * (mach - 0.6) / 0.1;
  if (mach > 0.5) return 0.0590 + (0.0680 - 0.0590) * (mach - 0.5) / 0.1;
  return 0.0590;
}

function inchesToMOA(inches: number, rangeYards: number): number {
  if (rangeYards === 0) return 0;
  return (inches / rangeYards) * (180 / Math.PI) * (60 / 1.047197551);
}

function inchesToMRAD(inches: number, rangeYards: number): number {
  if (rangeYards === 0) return 0;
  return (inches / (rangeYards * 36)) * 1000;
}

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

  const densityRatio = airDensityRatio(altitude, temperature, pressure, humidity);

  const speedOfSound = SPEED_OF_SOUND_SEA_LEVEL * Math.sqrt((temperature + 459.67) / (59 + 459.67));

  const effectiveBC = ballisticCoefficient / densityRatio;

  const windAngleRad = (windAngle * Math.PI) / 180;
  const crossWindMph = windSpeed * Math.sin(windAngleRad);
  const headWindMph = windSpeed * Math.cos(windAngleRad);
  const crossWindFps = crossWindMph * 1.46667;

  const adjustedMV = muzzleVelocity * (1 - headWindMph / 15000);

  const targetAngleRad = (targetAngle * Math.PI) / 180;
  const cosAngle = Math.cos(targetAngleRad);

  const dt = 0.001;
  let t = 0;
  let vx = adjustedMV;
  let vy = 0;
  let x = 0;
  let y = 0;
  let windY = 0;

  const getDrag = bcModel === "G7" ? g7DragCoefficient : g1DragCoefficient;

  let zeroElevationAngle = 0;
  for (let iter = 0; iter < 50; iter++) {
    let tx = 0, ty = 0, tvx = adjustedMV * Math.cos(zeroElevationAngle), tvy = adjustedMV * Math.sin(zeroElevationAngle);
    let found = false;
    for (let step = 0; step < 10000; step++) {
      const tv = Math.sqrt(tvx * tvx + tvy * tvy);
      const mach = tv / speedOfSound;
      const cd = getDrag(mach);
      const dragAccel = (cd * tv * tv) / (effectiveBC * 1.0);
      const dragAx = -dragAccel * (tvx / tv);
      const dragAy = -dragAccel * (tvy / tv);
      tvx += dragAx * dt;
      tvy += (dragAy - GRAVITY) * dt;
      tx += tvx * dt;
      ty += tvy * dt;
      const txYards = tx / 3;
      if (txYards >= zeroRange) {
        const yAtZero = ty * 12 + scopeHeight;
        zeroElevationAngle -= yAtZero / (zeroRange * 36) * 0.5;
        found = true;
        break;
      }
    }
    if (!found) break;
    if (Math.abs(0) < 0.01) break;
  }

  for (let iter = 0; iter < 100; iter++) {
    let tx = 0, ty = 0, tvx = adjustedMV * Math.cos(zeroElevationAngle), tvy = adjustedMV * Math.sin(zeroElevationAngle);
    for (let step = 0; step < 20000; step++) {
      const tv = Math.sqrt(tvx * tvx + tvy * tvy);
      const mach = tv / speedOfSound;
      const cd = getDrag(mach);
      const dragAccel = (cd * tv * tv) / (effectiveBC * 1.0);
      const dragAx = -dragAccel * (tvx / tv);
      const dragAy = -dragAccel * (tvy / tv);
      tvx += dragAx * dt;
      tvy += (dragAy - GRAVITY) * dt;
      tx += tvx * dt;
      ty += tvy * dt;
      const txYards = tx / 3;
      if (txYards >= zeroRange) {
        const yAtZero = ty * 12 + scopeHeight;
        if (Math.abs(yAtZero) < 0.01) break;
        zeroElevationAngle -= yAtZero / (zeroRange * 36) * 0.3;
        break;
      }
    }
  }

  vx = adjustedMV * Math.cos(zeroElevationAngle);
  vy = adjustedMV * Math.sin(zeroElevationAngle);
  x = 0;
  y = 0;
  windY = 0;
  t = 0;

  const points: TrajectoryPoint[] = [];
  let nextRange = 0;
  let supersonicLimit = 0;
  let pointBlankRange = 0;

  const maxSteps = Math.ceil((maxRange * 3 + 100) / (vx > 0 ? vx * dt : 1));

  for (let step = 0; step < 2000000; step++) {
    const v = Math.sqrt(vx * vx + vy * vy);
    const mach = v / speedOfSound;
    const cd = getDrag(mach);
    const dragAccel = (cd * v * v) / (effectiveBC * 1.0);
    const dragAx = vx > 0 ? -dragAccel * (vx / v) : 0;
    const dragAy = -dragAccel * (vy / v);

    const windLagTime = t > 0 ? (windY - crossWindFps * t) : 0;
    const windDriftAccel = crossWindFps > 0 ? (crossWindFps - windY / (t + 0.001)) * 0.01 : 0;

    vx += dragAx * dt;
    vy += (dragAy - GRAVITY) * dt;
    x += vx * dt;
    y += vy * dt;
    windY += windDriftAccel * dt;
    t += dt;

    const xYards = x / 3;

    if (mach >= 1.0) {
      supersonicLimit = xYards;
    }

    const dropInches = y * 12 + scopeHeight;
    if (Math.abs(dropInches) <= 3) {
      pointBlankRange = xYards;
    }

    if (xYards >= nextRange) {
      const actualWindDrift = crossWindFps > 0 ? (t - x / (adjustedMV)) * crossWindFps * 12 : 0;

      const angledDrop = dropInches * cosAngle;

      points.push({
        range: Math.round(xYards),
        drop: parseFloat(angledDrop.toFixed(2)),
        windDrift: parseFloat(actualWindDrift.toFixed(2)),
        velocity: parseFloat(v.toFixed(0)),
        energy: parseFloat((bulletWeight * v * v / 450400).toFixed(0)),
        timeOfFlight: parseFloat(t.toFixed(3)),
        dropMOA: parseFloat(inchesToMOA(-angledDrop, xYards).toFixed(2)),
        dropMRAD: parseFloat(inchesToMRAD(-angledDrop, xYards).toFixed(2)),
        windMOA: parseFloat(inchesToMOA(actualWindDrift, xYards).toFixed(2)),
        windMRAD: parseFloat(inchesToMRAD(actualWindDrift, xYards).toFixed(2)),
      });

      nextRange += rangeStep;
      if (nextRange > maxRange) break;
    }

    if (xYards > maxRange + rangeStep || v < 100) break;
  }

  return {
    trajectory: points,
    maxRange,
    zeroRange,
    pointBlankRange: parseFloat(pointBlankRange.toFixed(0)),
    supersonicLimit: parseFloat(supersonicLimit.toFixed(0)),
  };
}

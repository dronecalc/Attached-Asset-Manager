/**
 * Drone Database — ТТХ (Тактико-Технічні Характеристики)
 * Sources:
 *  - Appendix 1 & 3: "Памятка по применению FPV-дронов" (RF Military Manual, 2024)
 *  - CSD Drone Databook, Bard College (Dan Gettinger, 2020)
 */

export type DroneCategory =
  | "fpv-attack"
  | "isr-multirotor"
  | "isr-fixed"
  | "male";

export interface DroneSpec {
  id: string;
  name: string;
  manufacturer: string;
  country: string;
  category: DroneCategory;
  /** kg */
  massKg: number;
  /** kg */
  payloadKg?: number;
  /** minutes */
  flightTimeMin?: number;
  /** km */
  rangeKm?: number;
  /** km/h */
  maxSpeedKmh?: number;
  /** meters */
  maxAltM?: number;
  /** e.g. "GPS, GLONASS, Galileo" */
  gnss?: string;
  /** MHz, e.g. "868/915" */
  controlFreqMhz?: string;
  /** GHz */
  videoFreqGhz?: number;
  /** mAh */
  batteryMah?: number;
  /** m/s */
  maxWindMs?: number;
  /** e.g. "−10…+40" */
  tempRangeCelsius?: string;
  /** camera description */
  camera?: string;
  /** meters */
  wingspanM?: number;
  notes?: string;
  source: string;
}

// ---------------------------------------------------------------------------
// FPV Attack Drones — RF military FPV platforms (source: Appendix 1, RF Manual 2024)
// ---------------------------------------------------------------------------
export const FPV_ATTACK: DroneSpec[] = [
  {
    id: "bumerang",
    name: "Бумеранг",
    manufacturer: "—",
    country: "RU",
    category: "fpv-attack",
    massKg: 1.2,
    payloadKg: 3.5,
    flightTimeMin: 15,
    rangeKm: 10,
    maxSpeedKmh: 180,
    controlFreqMhz: "433/868/915",
    videoFreqGhz: 5.8,
    source: "RF FPV Manual 2024, App. 1",
  },
  {
    id: "skvorets",
    name: "Скворець",
    manufacturer: "—",
    country: "RU",
    category: "fpv-attack",
    massKg: 1.3,
    payloadKg: 2.2,
    flightTimeMin: 11,
    rangeKm: 10,
    maxSpeedKmh: 100,
    controlFreqMhz: "433/868/915",
    videoFreqGhz: 5.8,
    source: "RF FPV Manual 2024, App. 1",
  },
  {
    id: "xl-10",
    name: "XL-10",
    manufacturer: "—",
    country: "RU",
    category: "fpv-attack",
    massKg: 1.2,
    payloadKg: 3.5,
    flightTimeMin: 12,
    rangeKm: 10,
    maxSpeedKmh: 140,
    controlFreqMhz: "868/915/2400",
    videoFreqGhz: 5.8,
    source: "RF FPV Manual 2024, App. 1",
  },
  {
    id: "kuryer",
    name: "Курьер",
    manufacturer: "—",
    country: "RU",
    category: "fpv-attack",
    massKg: 1.3,
    payloadKg: 3.5,
    flightTimeMin: 13,
    rangeKm: 10,
    maxSpeedKmh: 60,
    controlFreqMhz: "868/915/2400",
    videoFreqGhz: 5.8,
    source: "RF FPV Manual 2024, App. 1",
  },
  {
    id: "piranya-7",
    name: "Піранья-7",
    manufacturer: "—",
    country: "RU",
    category: "fpv-attack",
    massKg: 1.36,
    payloadKg: 2.5,
    flightTimeMin: 13,
    rangeKm: 7,
    maxSpeedKmh: 125,
    controlFreqMhz: "868/915",
    videoFreqGhz: 5.8,
    source: "RF FPV Manual 2024, App. 1",
  },
  {
    id: "piranya-10",
    name: "Піранья-10",
    manufacturer: "—",
    country: "RU",
    category: "fpv-attack",
    massKg: 1.49,
    payloadKg: 4.5,
    flightTimeMin: 11,
    rangeKm: 13.3,
    maxSpeedKmh: 140,
    controlFreqMhz: "868/915",
    videoFreqGhz: 5.8,
    source: "RF FPV Manual 2024, App. 1",
  },
  {
    id: "khimera-7",
    name: "Химера-7",
    manufacturer: "—",
    country: "RU",
    category: "fpv-attack",
    massKg: 1.2,
    payloadKg: 3.0,
    flightTimeMin: 15,
    rangeKm: 10,
    maxSpeedKmh: 180,
    controlFreqMhz: "433/868/915",
    videoFreqGhz: 5.8,
    source: "RF FPV Manual 2024, App. 1",
  },
  {
    id: "pvkh-1",
    name: "ПВХ-1",
    manufacturer: "—",
    country: "RU",
    category: "fpv-attack",
    massKg: 1.2,
    payloadKg: 3.0,
    flightTimeMin: 15,
    rangeKm: 10,
    maxSpeedKmh: 180,
    controlFreqMhz: "868/915",
    videoFreqGhz: 5.8,
    source: "RF FPV Manual 2024, App. 1",
  },
];

// ---------------------------------------------------------------------------
// ISR / Recon Multirotors — commercial drones used on battlefield (App. 3)
// ---------------------------------------------------------------------------
export const ISR_MULTIROTOR: DroneSpec[] = [
  {
    id: "dji-mavic3",
    name: "DJI Mavic 3",
    manufacturer: "DJI",
    country: "CN",
    category: "isr-multirotor",
    massKg: 0.895,
    flightTimeMin: 46,
    rangeKm: 15,
    maxSpeedKmh: 68.4,
    maxAltM: 6000,
    batteryMah: 5000,
    maxWindMs: 12,
    gnss: "GPS, Galileo, BeiDou",
    tempRangeCelsius: "−10…+40",
    camera: "ЦВК ×28",
    source: "RF FPV Manual 2024, App. 3",
  },
  {
    id: "dji-mavic3t",
    name: "DJI Mavic 3T",
    manufacturer: "DJI",
    country: "CN",
    category: "isr-multirotor",
    massKg: 0.920,
    flightTimeMin: 45,
    rangeKm: 15,
    maxSpeedKmh: 75.6,
    maxAltM: 6000,
    batteryMah: 5000,
    maxWindMs: 12,
    gnss: "GPS, Galileo, BeiDou, GLONASS",
    tempRangeCelsius: "−10…+40",
    camera: "ЦВК ×28 + тепловізор",
    notes: "Thermal imaging variant",
    source: "RF FPV Manual 2024, App. 3",
  },
  {
    id: "dji-phantom3",
    name: "DJI Phantom 3",
    manufacturer: "DJI",
    country: "CN",
    category: "isr-multirotor",
    massKg: 1.216,
    flightTimeMin: 25,
    rangeKm: 8,
    maxSpeedKmh: 57.6,
    maxAltM: 6000,
    batteryMah: 4480,
    maxWindMs: 10,
    gnss: "GPS",
    tempRangeCelsius: "0…+40",
    camera: "ЦВК ×8",
    source: "RF FPV Manual 2024, App. 3",
  },
  {
    id: "dji-air2s",
    name: "DJI Air 2S",
    manufacturer: "DJI",
    country: "CN",
    category: "isr-multirotor",
    massKg: 0.595,
    flightTimeMin: 31,
    rangeKm: 12,
    maxSpeedKmh: 68.4,
    maxAltM: 5000,
    batteryMah: 3500,
    maxWindMs: 10.7,
    gnss: "GPS, GLONASS, Galileo",
    tempRangeCelsius: "0…+40",
    camera: "ЦВК ×8",
    source: "RF FPV Manual 2024, App. 3",
  },
  {
    id: "dji-mavic-pro-platinum",
    name: "DJI Mavic Pro Platinum",
    manufacturer: "DJI",
    country: "CN",
    category: "isr-multirotor",
    massKg: 0.734,
    flightTimeMin: 30,
    rangeKm: 7,
    maxSpeedKmh: 65.0,
    maxAltM: 5000,
    batteryMah: 3830,
    maxWindMs: 10,
    gnss: "GPS, GLONASS",
    tempRangeCelsius: "0…+40",
    camera: "ЦВК ×8",
    source: "RF FPV Manual 2024, App. 3",
  },
  {
    id: "autel-evo",
    name: "Autel EVO",
    manufacturer: "Autel Robotics",
    country: "US",
    category: "isr-multirotor",
    massKg: 0.595,
    flightTimeMin: 31,
    rangeKm: 12,
    maxSpeedKmh: 68.4,
    maxAltM: 5000,
    batteryMah: 3500,
    maxWindMs: 10.7,
    gnss: "GPS, GLONASS, Galileo",
    tempRangeCelsius: "0…+40",
    camera: "ЦВК ×8",
    source: "RF FPV Manual 2024, App. 3",
  },
];

// ---------------------------------------------------------------------------
// Military MALE/Fixed-wing ISR — CSD Drone Databook (Bard College, 2020)
// ---------------------------------------------------------------------------
export const MILITARY_UAV: DroneSpec[] = [
  {
    id: "wing-loong-i",
    name: "Wing Loong I",
    manufacturer: "AVIC",
    country: "CN",
    category: "male",
    massKg: 1250,
    payloadKg: 200,
    flightTimeMin: 20 * 60,
    rangeKm: 4000,
    maxSpeedKmh: 180,
    wingspanM: 14,
    source: "CSD Drone Databook 2020",
  },
  {
    id: "ch-4",
    name: "CH-4",
    manufacturer: "CASC",
    country: "CN",
    category: "male",
    massKg: 1330,
    payloadKg: 345,
    flightTimeMin: 40 * 60,
    rangeKm: 3500,
    maxSpeedKmh: 180,
    wingspanM: 18,
    source: "CSD Drone Databook 2020",
  },
  {
    id: "shahed-129",
    name: "Shahed-129",
    manufacturer: "HESA",
    country: "IR",
    category: "male",
    massKg: 0, // MTOW not listed precisely
    flightTimeMin: 24 * 60,
    rangeKm: 1700,
    wingspanM: 15,
    source: "CSD Drone Databook 2020",
  },
  {
    id: "mohajer-6",
    name: "Mohajer-6",
    manufacturer: "Qods Aviation",
    country: "IR",
    category: "male",
    massKg: 600,
    flightTimeMin: 12 * 60,
    rangeKm: 200,
    maxSpeedKmh: 200,
    wingspanM: 10,
    source: "CSD Drone Databook 2020",
  },
  {
    id: "harop",
    name: "Harop (loitering munition)",
    manufacturer: "IAI",
    country: "IL",
    category: "isr-fixed",
    massKg: 135,
    payloadKg: 23,
    flightTimeMin: 9 * 60,
    rangeKm: 200,
    wingspanM: 3,
    notes: "Loitering munition / kamikaze drone",
    source: "CSD Drone Databook 2020",
  },
  {
    id: "tb2",
    name: "Bayraktar TB2",
    manufacturer: "Baykar",
    country: "TR",
    category: "male",
    massKg: 650,
    payloadKg: 55,
    flightTimeMin: 27 * 60,
    rangeKm: 300,
    maxSpeedKmh: 222,
    maxAltM: 8200,
    wingspanM: 12,
    source: "Baykar official specs",
  },
  {
    id: "leleka-100",
    name: "Лелека-100",
    manufacturer: "DeViRo",
    country: "UA",
    category: "isr-fixed",
    massKg: 2.5,
    flightTimeMin: 60,
    rangeKm: 30,
    maxSpeedKmh: 120,
    maxAltM: 1000,
    source: "DeViRo official specs",
  },
  {
    id: "furia",
    name: "Фурія",
    manufacturer: "UA Dynamics",
    country: "UA",
    category: "isr-fixed",
    massKg: 5.5,
    flightTimeMin: 180,
    rangeKm: 50,
    maxSpeedKmh: 100,
    source: "UA Dynamics official specs",
  },
  {
    id: "valkyria-ua",
    name: "Валькірія-UA",
    manufacturer: "Warbirds",
    country: "UA",
    category: "isr-fixed",
    massKg: 18,
    payloadKg: 5,
    flightTimeMin: 240,
    rangeKm: 100,
    maxSpeedKmh: 120,
    source: "Warbirds official specs",
  },
];

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export const ALL_DRONES: DroneSpec[] = [
  ...FPV_ATTACK,
  ...ISR_MULTIROTOR,
  ...MILITARY_UAV,
];

export const CATEGORY_LABELS: Record<DroneCategory, { en: string; ua: string }> = {
  "fpv-attack": { en: "FPV Attack", ua: "FPV Ударні" },
  "isr-multirotor": { en: "ISR Multirotor", ua: "РЕБ/Розвідка (Мультиротор)" },
  "isr-fixed": { en: "ISR Fixed-wing", ua: "Розвідка (Літак)" },
  male: { en: "MALE / Strike", ua: "MALE / Ударні" },
};

export const COUNTRY_FLAGS: Record<string, string> = {
  RU: "🇷🇺",
  CN: "🇨🇳",
  US: "🇺🇸",
  UA: "🇺🇦",
  TR: "🇹🇷",
  IR: "🇮🇷",
  IL: "🇮🇱",
};

/**
 * Calculation conventions and Asr juristic methods.
 */

import { timeZenith, timeAltitude, timeShadowFactor } from "./calculations.ts";

export type CalculationMethod =
  | "MWL"
  | "ISNA"
  | "EGYPT"
  | "MAKKAH"
  | "KARACHI"
  | "TEHRAN"
  | "JAFARI";

export type AsrMethod = "STANDARD" | "HANAFI";

export interface MethodConfig {
  fajrDeg: number;
  ishaDeg: number;
  maghribDeg?: number;
  ishaOffsetMinutes?: number;
  ishaOffsetRamadanMinutes?: number;
}

export const METHOD_CONFIGS: Record<CalculationMethod, MethodConfig> = {
  MWL: { fajrDeg: 18.0, ishaDeg: 17.0 },
  ISNA: { fajrDeg: 15.0, ishaDeg: 15.0 },
  EGYPT: { fajrDeg: 19.5, ishaDeg: 17.5 },
  KARACHI: { fajrDeg: 18.0, ishaDeg: 18.0 },
  MAKKAH: {
    fajrDeg: 18.5,
    ishaDeg: 18.5,
    ishaOffsetMinutes: 90,
    ishaOffsetRamadanMinutes: 120,
  },
  TEHRAN: { fajrDeg: 17.7, ishaDeg: 14.0, maghribDeg: 4.5 },
  JAFARI: { fajrDeg: 16.0, ishaDeg: 14.0, maghribDeg: 4.0 },
};

export interface RawPrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export function computeSolarTimes(
  date: Date,
  latitude: number,
  longitude: number,
  method: CalculationMethod = "EGYPT",
  asr: AsrMethod = "STANDARD",
  isRamadan: boolean = false
): RawPrayerTimes {
  const config = METHOD_CONFIGS[method] || METHOD_CONFIGS.EGYPT;
  const shadowFactor = asr === "HANAFI" ? 2.0 : 1.0;
  const sunsetAlt = (-0.833 * Math.PI) / 180.0;
  const fajrAlt = (-config.fajrDeg * Math.PI) / 180.0;
  const ishaAlt = (-config.ishaDeg * Math.PI) / 180.0;

  const zenith = timeZenith(date, longitude);
  const fajr = timeAltitude(zenith, fajrAlt, latitude, true);
  const sunrise = timeAltitude(zenith, sunsetAlt, latitude, true);
  const asrTime = timeShadowFactor(zenith, shadowFactor, latitude);

  let maghrib: Date;
  if (config.maghribDeg !== undefined) {
    maghrib = timeAltitude(zenith, (-config.maghribDeg * Math.PI) / 180.0, latitude, false);
  } else {
    maghrib = timeAltitude(zenith, sunsetAlt, latitude, false);
  }

  let isha: Date;
  if (config.ishaOffsetMinutes !== undefined) {
    const offsetMin = isRamadan
      ? (config.ishaOffsetRamadanMinutes ?? 120)
      : config.ishaOffsetMinutes;
    isha = new Date(maghrib.getTime() + offsetMin * 60 * 1000);
  } else {
    isha = timeAltitude(zenith, ishaAlt, latitude, false);
  }

  return {
    fajr,
    sunrise,
    dhuhr: zenith,
    asr: asrTime,
    maghrib,
    isha,
  };
}

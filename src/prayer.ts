/**
 * High-level prayer times calculations and formatting.
 */

import {
  type CalculationMethod,
  type AsrMethod,
  computeSolarTimes,
  type RawPrayerTimes,
} from "./methods.ts";

export interface PrayerItem {
  key: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
  nameEn: string;
  nameAr: string;
  timeDate: Date;
  timeString: string; // HH:mm in specified or local timezone
}

export interface PrayerTimesResult {
  date: string; // YYYY-MM-DD
  sunrise: string;
  sunriseDate: Date;
  prayers: PrayerItem[];
  raw: RawPrayerTimes;
}

export interface NextPrayerResult {
  key: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
  nameEn: string;
  nameAr: string;
  timeDate: Date;
  timeString: string;
  remainingMinutes: number;
  remainingSeconds: number;
  isTomorrow: boolean;
}

export const PRAYER_NAMES = {
  fajr: { en: "Fajr", ar: "الفجر" },
  sunrise: { en: "Sunrise", ar: "الشروق" },
  dhuhr: { en: "Dhuhr", ar: "الظهر" },
  asr: { en: "Asr", ar: "العصر" },
  maghrib: { en: "Maghrib", ar: "المغرب" },
  isha: { en: "Isha", ar: "العشاء" },
};

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatDateToTimeString(date: Date, timeZone?: string): string {
  if (timeZone) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return formatter.format(date);
  }
  return `${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
}

export function calculatePrayerTimes(options: {
  latitude: number;
  longitude: number;
  date?: Date;
  method?: CalculationMethod;
  asr?: AsrMethod;
  timeZone?: string;
  isRamadan?: boolean;
}): PrayerTimesResult {
  const targetDate = options.date ?? new Date();
  const method = options.method ?? "EGYPT";
  const asr = options.asr ?? "STANDARD";

  const raw = computeSolarTimes(
    targetDate,
    options.latitude,
    options.longitude,
    method,
    asr,
    options.isRamadan ?? false
  );

  const format = (d: Date) => formatDateToTimeString(d, options.timeZone);

  const prayers: PrayerItem[] = [
    {
      key: "fajr",
      nameEn: PRAYER_NAMES.fajr.en,
      nameAr: PRAYER_NAMES.fajr.ar,
      timeDate: raw.fajr,
      timeString: format(raw.fajr),
    },
    {
      key: "dhuhr",
      nameEn: PRAYER_NAMES.dhuhr.en,
      nameAr: PRAYER_NAMES.dhuhr.ar,
      timeDate: raw.dhuhr,
      timeString: format(raw.dhuhr),
    },
    {
      key: "asr",
      nameEn: PRAYER_NAMES.asr.en,
      nameAr: PRAYER_NAMES.asr.ar,
      timeDate: raw.asr,
      timeString: format(raw.asr),
    },
    {
      key: "maghrib",
      nameEn: PRAYER_NAMES.maghrib.en,
      nameAr: PRAYER_NAMES.maghrib.ar,
      timeDate: raw.maghrib,
      timeString: format(raw.maghrib),
    },
    {
      key: "isha",
      nameEn: PRAYER_NAMES.isha.en,
      nameAr: PRAYER_NAMES.isha.ar,
      timeDate: raw.isha,
      timeString: format(raw.isha),
    },
  ];

  const y = targetDate.getFullYear();
  const m = padZero(targetDate.getMonth() + 1);
  const d = padZero(targetDate.getDate());

  return {
    date: `${y}-${m}-${d}`,
    sunrise: format(raw.sunrise),
    sunriseDate: raw.sunrise,
    prayers,
    raw,
  };
}

export function getNextPrayer(options: {
  latitude: number;
  longitude: number;
  now?: Date;
  method?: CalculationMethod;
  asr?: AsrMethod;
  timeZone?: string;
}): NextPrayerResult {
  const now = options.now ?? new Date();
  const todayTimes = calculatePrayerTimes({ ...options, date: now });

  for (const prayer of todayTimes.prayers) {
    if (prayer.timeDate.getTime() > now.getTime()) {
      const remainingSeconds = Math.floor(
        (prayer.timeDate.getTime() - now.getTime()) / 1000
      );
      return {
        key: prayer.key,
        nameEn: prayer.nameEn,
        nameAr: prayer.nameAr,
        timeDate: prayer.timeDate,
        timeString: prayer.timeString,
        remainingMinutes: Math.floor(remainingSeconds / 60),
        remainingSeconds,
        isTomorrow: false,
      };
    }
  }

  // Next prayer is tomorrow's Fajr
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const tomorrowTimes = calculatePrayerTimes({ ...options, date: tomorrow });
  const fajrTomorrow = tomorrowTimes.prayers[0];
  const remainingSeconds = Math.floor(
    (fajrTomorrow.timeDate.getTime() - now.getTime()) / 1000
  );

  return {
    key: "fajr",
    nameEn: fajrTomorrow.nameEn,
    nameAr: fajrTomorrow.nameAr,
    timeDate: fajrTomorrow.timeDate,
    timeString: fajrTomorrow.timeString,
    remainingMinutes: Math.floor(remainingSeconds / 60),
    remainingSeconds,
    isTomorrow: true,
  };
}

import test from "node:test";
import assert from "node:assert";
import {
  calculatePrayerTimes,
  getNextPrayer,
  calculateQibla,
  computeSolarTimes,
} from "../src/index.ts";

test("calculatePrayerTimes - Cairo", () => {
  const result = calculatePrayerTimes({
    latitude: 30.0444,
    longitude: 31.2357,
    date: new Date(Date.UTC(2026, 0, 15)),
    method: "EGYPT",
    timeZone: "Africa/Cairo",
  });

  assert.strictEqual(result.prayers.length, 5);
  assert.ok(result.sunrise.length > 0);

  const raw = result.raw;
  assert.ok(raw.fajr < raw.sunrise);
  assert.ok(raw.sunrise < raw.dhuhr);
  assert.ok(raw.dhuhr < raw.asr);
  assert.ok(raw.asr < raw.maghrib);
  assert.ok(raw.maghrib < raw.isha);
});

test("calculateQibla - Cairo", () => {
  const qibla = calculateQibla(30.0444, 31.2357);
  assert.ok(qibla.bearing >= 130 && qibla.bearing <= 140);
  assert.strictEqual(qibla.direction, "SE");
  assert.ok(qibla.distanceKm >= 1200 && qibla.distanceKm <= 1400);
});

test("getNextPrayer", () => {
  const next = getNextPrayer({
    latitude: 30.0444,
    longitude: 31.2357,
    timeZone: "Africa/Cairo",
  });
  assert.ok(["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(next.key));
  assert.ok(next.remainingSeconds >= 0);
});

# islamic-astro (TypeScript / JavaScript) 🕌

**Zero-dependency TypeScript astronomical engine for Islamic prayer times, Qibla direction, and solar positions.**

Designed for **React, Next.js, Node.js, Express, NestJS, Vue, Nuxt, and React Native**.

---

## ✨ Features
- ⚡ **Zero Dependencies**: Pure mathematical TypeScript, runs in browsers, Node.js, Bun, Deno, and Cloudflare Workers.
- 📐 **7 Calculation Conventions**: MWL, ISNA, Egypt, Umm al-Qura, Karachi, Tehran, Jafari.
- 🧭 **High-Precision Qibla**: Forward azimuth bearing and Haversine distance to Holy Kaaba.
- ⏳ **Upcoming Prayer Tracker**: Remaining minutes & seconds with next-day rollover.
- 🌐 **First-Class Localization**: Arabic & English prayer names built-in.

---

## 📦 Installation
```bash
npm install islamic-astro
# or
yarn add islamic-astro
# or
pnpm add islamic-astro
```

---

## 🚀 Usage

### 1. Calculate Daily Prayer Times
```typescript
import { calculatePrayerTimes } from "islamic-astro";

const times = calculatePrayerTimes({
  latitude: 30.0444,
  longitude: 31.2357,
  method: "EGYPT",
  timeZone: "Africa/Cairo"
});

console.log(times.sunrise); // "06:55"
times.prayers.forEach((p) => {
  console.log(`${p.nameEn} (${p.nameAr}): ${p.timeString}`);
});
```

### 2. Calculate Qibla Bearing & Distance
```typescript
import { calculateQibla } from "islamic-astro";

const qibla = calculateQibla(30.0444, 31.2357);

console.log(`Bearing: ${qibla.bearing}°`);         // 136.1° from True North
console.log(`Direction: ${qibla.direction}`);       // "SE"
console.log(`Distance: ${qibla.distanceKm} km`);   // 1287 km
```

### 3. Get Next Prayer (Great for React / Next.js Widgets)
```typescript
import { getNextPrayer } from "islamic-astro";

const next = getNextPrayer({
  latitude: 30.0444,
  longitude: 31.2357,
  timeZone: "Africa/Cairo"
});

console.log(`Next prayer is ${next.nameEn} in ${next.remainingMinutes} minutes.`);
```

---

## 📄 License
MIT License.

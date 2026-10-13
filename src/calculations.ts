/**
 * High-precision solar position and astronomical calculations.
 * Pure TypeScript, zero external dependencies.
 */

export interface EotDeclResult {
  eotMs: number; // Equation of time in milliseconds
  declinationRad: number; // Solar declination in radians
}

/**
 * Solve Kepler's equation M = E - e * sin(E) using Newton-Raphson iteration.
 */
export function keplerSolve(M: number, e: number): number {
  if (e <= 0 || e >= 1) {
    throw new Error("Eccentricity of elliptical orbit must be in range (0, 1)");
  }
  let E = M;
  for (let i = 0; i < 100; i++) {
    const delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= delta;
    if (Math.abs(delta) < 1e-9) break;
  }
  return E;
}

/**
 * Calculate Equation of Time (EoT) and Solar Declination for a given Date.
 */
export function eotDecl(time: Date): EotDeclResult {
  // Epoch: 2000-01-01 12:00:00 UTC
  const epoch = Date.UTC(2000, 0, 1, 12, 0, 0, 0);
  const daysSinceEpoch = (time.getTime() - epoch) / (1000 * 60 * 60 * 24);
  const y100 = daysSinceEpoch / 36525.0;

  const e = 1.6709e-2 - 4.193e-5 * y100 - 1.26e-7 * Math.pow(y100, 2);
  const lamP = ((282.93807 + 1.7195 * y100 + 3.025e-4 * Math.pow(y100, 2)) * Math.PI) / 180.0;
  const epsilon = ((23.4393 - 0.013 * y100 - 2e-7 * Math.pow(y100, 2) + 5e-7 * Math.pow(y100, 3)) * Math.PI) / 180.0;

  const MD = 6.24004077;
  const TY = 365.2596358;
  const D = daysSinceEpoch % TY;
  let M = (MD + (2 * Math.PI * D) / TY) % (2 * Math.PI);
  if (M < 0) M += 2 * Math.PI;

  const E = keplerSolve(M, e);
  let nu = Math.acos((Math.cos(E) - e) / (1 - e * Math.cos(E)));
  if (E > Math.PI) {
    nu = 2 * Math.PI - nu;
  }

  let lam = (nu + lamP) % (2 * Math.PI);
  if (lam < 0) lam += 2 * Math.PI;

  let alpha: number;
  if (Math.abs(Math.cos(lam)) < 1e-9) {
    alpha = lam;
  } else {
    alpha = Math.atan(Math.cos(epsilon) * Math.tan(lam));
    if (lam < Math.PI / 2) {
      // Quadrant 1
    } else if (lam < (Math.PI * 3) / 2) {
      alpha += Math.PI;
    } else {
      alpha += 2 * Math.PI;
    }
  }

  let eotRad = M + lamP - alpha;
  if (eotRad > Math.PI) {
    eotRad -= 2 * Math.PI;
  } else if (eotRad < -Math.PI) {
    eotRad += 2 * Math.PI;
  }

  const eotMin = (eotRad / (2 * Math.PI)) * 1440.0;
  const eotMs = eotMin * 60 * 1000;
  const decl = Math.asin(Math.sin(epsilon) * Math.sin(lam));

  return { eotMs, declinationRad: decl };
}

/**
 * Calculate solar altitude for shadow factor (used for Asr).
 */
export function calcAltitude(shadowFactor: number, declination: number, latitude: number): number {
  const phi = (latitude * Math.PI) / 180.0;
  const delta = declination;
  const shadowFactorZenith = Math.abs(Math.tan(phi - delta));
  return Math.atan(1.0 / (shadowFactor + shadowFactorZenith));
}

/**
 * Hour angle duration in milliseconds for a specific solar altitude.
 */
export function durationAtAltitude(altitude: number, declination: number, latitude: number): number {
  const phi = (latitude * Math.PI) / 180.0;
  const delta = declination;

  const numerator = Math.sin(altitude) - Math.sin(phi) * Math.sin(delta);
  const denominator = Math.cos(phi) * Math.cos(delta);

  if (Math.abs(denominator) < 1e-9) {
    throw new Error("Sun does not reach altitude at this latitude");
  }

  const cosHourRad = numerator / denominator;
  if (cosHourRad < -1.0 || cosHourRad > 1.0) {
    throw new Error("Sun does not reach the specified altitude on this date and latitude");
  }

  const hourRad = Math.acos(cosHourRad);
  const hours = (hourRad / (2 * Math.PI)) * 24.0;
  return hours * 60 * 60 * 1000;
}

/**
 * Secant numerical method for root finding.
 */
export function secantInterpolate(
  diffFunc: (guess: Date) => number,
  guess1: Date,
  guess2: Date,
  toleranceMs: number = 500
): Date {
  let g1 = guess1.getTime();
  let g2 = guess2.getTime();
  if (g2 < g1) {
    const tmp = g1;
    g1 = g2;
    g2 = tmp;
  }

  let d1 = diffFunc(new Date(g1));
  let d2 = diffFunc(new Date(g2));

  for (let i = 0; i < 50; i++) {
    const diff = d2 - d1;
    if (Math.abs(diff) < 1e-6) break;
    const g3 = g1 - d1 * ((g2 - g1) / diff);
    const d3 = diffFunc(new Date(g3));

    if (Math.abs(g3 - g2) < toleranceMs) {
      return new Date(g3);
    }
    g1 = g2;
    d1 = d2;
    g2 = g3;
    d2 = d3;
  }
  return new Date(g2);
}

/**
 * Calculate solar zenith (solar noon / Dhuhr base) in UTC.
 */
export function timeZenith(date: Date, longitude: number): Date {
  const utcNoon = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0, 0);
  const zenithApprox = utcNoon - (longitude / 15.0) * 3600 * 1000;

  const calcDiff = (guess: Date) => {
    const { eotMs } = eotDecl(guess);
    const actual = utcNoon - (longitude / 15.0) * 3600 * 1000 - eotMs;
    return actual - guess.getTime();
  };

  const g1 = new Date(zenithApprox - 20 * 60 * 1000);
  const g2 = new Date(zenithApprox + 20 * 60 * 1000);
  return secantInterpolate(calcDiff, g1, g2);
}

/**
 * Calculate time when Sun reaches a specific altitude.
 */
export function timeAltitude(zenith: Date, altitude: number, latitude: number, rising: boolean): Date {
  const calcDiff = (guess: Date) => {
    const { declinationRad } = eotDecl(guess);
    const durMs = durationAtAltitude(altitude, declinationRad, latitude);
    const actual = rising ? zenith.getTime() - durMs : zenith.getTime() + durMs;
    return actual - guess.getTime();
  };

  const g1 = rising ? new Date(zenith.getTime() - 12 * 3600 * 1000) : zenith;
  const g2 = rising ? zenith : new Date(zenith.getTime() + 12 * 3600 * 1000);
  return secantInterpolate(calcDiff, g1, g2);
}

/**
 * Calculate time for a shadow factor (used for Asr).
 */
export function timeShadowFactor(zenith: Date, shadowFactor: number, latitude: number): Date {
  const calcDiff = (guess: Date) => {
    const { declinationRad } = eotDecl(guess);
    const alt = calcAltitude(shadowFactor, declinationRad, latitude);
    const durMs = durationAtAltitude(alt, declinationRad, latitude);
    const actual = zenith.getTime() + durMs;
    return actual - guess.getTime();
  };

  const g1 = zenith;
  const g2 = new Date(zenith.getTime() + 12 * 3600 * 1000);
  return secantInterpolate(calcDiff, g1, g2);
}

/**
 * Qibla bearing, distance, and cardinal direction calculations.
 */

export const KAABA_LATITUDE = 21.4225;
export const KAABA_LONGITUDE = 39.8262;
export const EARTH_RADIUS_KM = 6371.0;

export interface QiblaResult {
  latitude: number;
  longitude: number;
  bearing: number; // Azimuth angle in degrees from North (0° - 360°)
  direction: string; // "N", "NE", "E", "SE", "S", "SW", "W", "NW"
  distanceKm: number; // Great-circle distance to Kaaba in kilometers
}

/**
 * Calculate the forward azimuth bearing to the Holy Kaaba.
 */
export function calculateBearing(lat: number, lng: number): number {
  const lat1 = (lat * Math.PI) / 180.0;
  const lat2 = (KAABA_LATITUDE * Math.PI) / 180.0;
  const deltaLng = ((KAABA_LONGITUDE - lng) * Math.PI) / 180.0;

  const x = Math.sin(deltaLng) * Math.cos(lat2);
  const y =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  const bearingDeg = (Math.atan2(x, y) * 180.0) / Math.PI;
  return (bearingDeg + 360.0) % 360.0;
}

/**
 * Calculate great-circle distance to the Kaaba using Haversine formula.
 */
export function calculateDistance(lat: number, lng: number): number {
  const lat1 = (lat * Math.PI) / 180.0;
  const lat2 = (KAABA_LATITUDE * Math.PI) / 180.0;
  const deltaLat = ((KAABA_LATITUDE - lat) * Math.PI) / 180.0;
  const deltaLng = ((KAABA_LONGITUDE - lng) * Math.PI) / 180.0;

  const a =
    Math.sin(deltaLat / 2.0) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2.0) ** 2;
  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1.0 - a)));
  return EARTH_RADIUS_KM * c;
}

/**
 * Convert bearing angle to 8 cardinal directions.
 */
export function bearingToDirection(bearing: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(bearing / 45.0) % 8;
  return directions[index];
}

/**
 * Calculate complete Qibla parameters for given coordinates.
 */
export function calculateQibla(latitude: number, longitude: number): QiblaResult {
  if (latitude < -90 || latitude > 90) {
    throw new Error(`Latitude ${latitude} must be between -90 and 90`);
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error(`Longitude ${longitude} must be between -180 and 180`);
  }

  const bearing = calculateBearing(latitude, longitude);
  const distanceKm = calculateDistance(latitude, longitude);
  const direction = bearingToDirection(bearing);

  return {
    latitude,
    longitude,
    bearing: Number(bearing.toFixed(2)),
    direction,
    distanceKm: Number(distanceKm.toFixed(2)),
  };
}

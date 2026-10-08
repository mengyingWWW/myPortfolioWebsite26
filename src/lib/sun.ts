const DEG = Math.PI / 180;

export type SunPosition = {
  /** Degrees above the horizon (negative at night). */
  altitude: number;
  /** Degrees clockwise from north. */
  azimuth: number;
};

/**
 * Approximate sun position for a place and time, using the low-precision
 * formulas from the Astronomical Almanac (accurate to well under a degree).
 */
export function sunPosition(date: Date, latitude: number, longitude: number): SunPosition {
  const d = date.getTime() / 86400000 - 10957.5; // days since J2000.0
  const g = (357.529 + 0.98560028 * d) * DEG;
  const q = 280.459 + 0.98564736 * d;
  const eclipticLon = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG;
  const obliquity = (23.439 - 0.00000036 * d) * DEG;
  const rightAscension = Math.atan2(Math.cos(obliquity) * Math.sin(eclipticLon), Math.cos(eclipticLon));
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLon));
  const gmstHours = (18.697374558 + 24.06570982441908 * d) % 24;
  const hourAngle = (gmstHours * 15 + longitude) * DEG - rightAscension;
  const lat = latitude * DEG;

  const altitude = Math.asin(
    Math.sin(lat) * Math.sin(declination) + Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle),
  );
  const fromSouth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(lat) - Math.tan(declination) * Math.cos(lat),
  );

  return {
    altitude: altitude / DEG,
    azimuth: (((fromSouth / DEG + 180) % 360) + 360) % 360,
  };
}

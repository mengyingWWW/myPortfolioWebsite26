export type City = {
  label: string;
  name: string;
  latitude: number;
  /** Degrees east (negative = west). */
  longitude: number;
};

/** Places I've lived, shown as hero annotations in this order. */
export const CITIES: City[] = [
  { label: '41.3°N', name: 'Benxi', latitude: 41.29, longitude: 123.77 },
  { label: '39.9°N', name: 'Beijing', latitude: 39.9, longitude: 116.41 },
  { label: '1.3°N', name: 'Singapore', latitude: 1.35, longitude: 103.82 },
  { label: '47.6°N', name: 'Seattle', latitude: 47.61, longitude: -122.33 },
];

/** Before a city is chosen, shadows follow today's real sun here. */
export const DEFAULT_CITY = 'Seattle';

/** A chosen city shows its sunlight on this day (current year, current time of day). */
export const CHOSEN_DATE = { month: 7, day: 12 };

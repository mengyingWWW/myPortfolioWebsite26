/** Seattle's sun, for the live footer logo. */
import { CITIES } from '@/data/sunlight';
import { sunPosition } from './sun';

const city = CITIES.find((c) => c.name === 'Seattle')!;

export const seattleSun = (date: Date | number) => sunPosition(new Date(date), city.latitude, city.longitude);

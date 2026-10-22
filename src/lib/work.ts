import { getCollection, type CollectionEntry } from 'astro:content';

export type WorkEntry = CollectionEntry<'work'>;

export async function getSortedWork(): Promise<WorkEntry[]> {
  const entries = await getCollection('work');
  return entries.sort((a, b) => a.data.order - b.data.order);
}

/** The homepage's Selected Work grid. */
export async function getFeaturedWork(): Promise<WorkEntry[]> {
  return (await getSortedWork()).filter((entry) => entry.data.featured);
}

/** The homepage's More Projects list: everything that isn't featured. */
export async function getMoreWork(): Promise<WorkEntry[]> {
  return (await getSortedWork()).filter((entry) => !entry.data.featured);
}

export function workUrl(entry: WorkEntry): string {
  return `/work/${entry.id}`;
}

/** "2024 — 2026", or a single year when they're all the same. */
export function yearRange(entries: WorkEntry[]): string {
  const years = entries.map((entry) => Number(entry.data.year));
  const first = Math.min(...years);
  const last = Math.max(...years);
  return first === last ? `${first}` : `${first} — ${last}`;
}

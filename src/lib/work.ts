import { getCollection, type CollectionEntry } from 'astro:content';

export type WorkEntry = CollectionEntry<'work'>;

export async function getSortedWork(): Promise<WorkEntry[]> {
  const entries = await getCollection('work');
  return entries.sort((a, b) => a.data.order - b.data.order);
}

export function workUrl(entry: WorkEntry): string {
  return `/work/${entry.id}`;
}

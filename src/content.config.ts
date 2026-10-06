import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const work = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    year: z.union([z.number(), z.string()]),
    status: z.string(),
    category: z.string(),
    medium: z.string(),
    /** Path to an image in /public, e.g. "/images/work/my-project/cover.svg" */
    cover: z.string(),
    role: z.string(),
    skills: z.array(z.string()),
    timeline: z.string(),
    tools: z.array(z.string()),
    team: z.array(z.string()),
    summary: z.string(),
    order: z.number(),
  }),
});

export const collections = { work };

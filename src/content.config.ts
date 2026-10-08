import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const work = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/work' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string(),
      year: z.union([z.number(), z.string()]),
      /** e.g. "Case Study", "Shipped", "Concept" */
      type: z.string(),
      /** e.g. "UX Research", "Product Design" */
      method: z.string(),
      /** Platform, e.g. "Mobile App", "Web" */
      medium: z.string(),
      /**
       * Path relative to this MDX file, e.g. "../../assets/work/my-project/cover.jpg".
       * Optional: cards show a gray placeholder until it's added.
       */
      cover: image().optional(),
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

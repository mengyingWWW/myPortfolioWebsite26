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
      /** Short label for the project page tag, e.g. "0→1 UI/UX Design" */
      type: z.string(),
      /** e.g. "UX Research", "Product Design" */
      method: z.string(),
      /** e.g. "Shipped", "Concept", "Design Delivered" */
      status: z.string(),
      /** e.g. ["B2B SaaS", "AI Startup"] */
      domains: z.array(z.string()),
      /** e.g. "Mobile", "Web", "PC" */
      platform: z.string(),
      /**
       * Path relative to this MDX file, e.g. "../../assets/work/my-project/cover.jpg".
       * Optional: cards show a gray placeholder until it's added.
       */
      cover: image().optional(),
      /**
       * Card-only framing. coverScale zooms the cover (below 1 shrinks it); coverFocusX / coverFocusY
       * are the point of the image, in % from its left / top, that lands at the card's center.
       * coverBackground fills any part of the card the image no longer covers; match the image's
       * own background so the edge doesn't show.
       */
      coverScale: z.number().positive().default(1),
      coverFocusX: z.number().min(0).max(100).default(50),
      coverFocusY: z.number().min(0).max(100).default(50),
      coverBackground: z.string().optional(),
      /** "multiply" tints a white-background cover with coverBackground (white turns into it). */
      coverBlend: z.literal('multiply').optional(),
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

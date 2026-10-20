// @ts-check
import fs from 'node:fs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

/** Case studies with `noindex: true` in their frontmatter, as sitemap paths ("/work/{file name}/"). */
const workDir = new URL('./src/content/work/', import.meta.url);
const noindexPaths = new Set(
  fs
    .readdirSync(workDir)
    .filter((file) => file.endsWith('.mdx'))
    .filter((file) => {
      const frontmatter = fs.readFileSync(new URL(file, workDir), 'utf8').split(/^---\s*$/m)[1] ?? '';
      return /^noindex:\s*true\s*$/m.test(frontmatter);
    })
    .map((file) => `/work/${file.replace(/\.mdx$/, '')}/`),
);

export default defineConfig({
  site: 'https://www.mengyingwang.com',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        return !/\/404\/?$/.test(path) && !noindexPaths.has(path);
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

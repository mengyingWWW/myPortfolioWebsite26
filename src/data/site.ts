export const site = {
  name: 'Mengying',
  /** Used in page titles: "{page title} — Mengying Wang". */
  fullName: 'Mengying Wang',
  title: 'Mengying Wang — UX/Product Designer & Researcher',
  description:
    'Product designer who uses AI to build what it can’t build alone. 2+ years in AI, B2B and B2C products. M.S. HCDE @ UW · B.Eng Architecture @ Tsinghua.',
  /** Default social share card (Open Graph / Twitter); regenerate with `npm run og`. */
  shareImage: { src: '/og/home.png', width: 1200, height: 627, alt: 'Mengying Wang’s homepage: “Hello, I am Mengying. A product designer who uses AI to build what it can’t build alone.” over soft leaf shadows' },
  email: 'mengyingwww712@gmail.com',
  /** Put the file at public/resume.pdf. */
  resume: '/resume.pdf',
  linkedin: 'https://www.linkedin.com/in/mengying-www/',
  github: 'https://github.com/mengyingWWW',
};

// newTab links open outside the site: they get a ↗ and target="_blank" wherever they're rendered.
export const navLinks: { label: string; href: string; newTab?: boolean }[] = [
  { label: 'Work', href: '/work' },
  { label: 'About', href: '/about' },
  { label: 'Resume', href: site.resume, newTab: true },
];

export const footerLinks: { label: string; href: string; newTab?: boolean }[] = [
  { label: 'Email', href: `mailto:${site.email}` },
  { label: 'Resume', href: site.resume, newTab: true },
  { label: 'LinkedIn', href: site.linkedin, newTab: true },
  { label: 'GitHub', href: site.github, newTab: true },
];

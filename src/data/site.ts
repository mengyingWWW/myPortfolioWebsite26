export const site = {
  name: 'Mengying',
  fullName: 'Mengying',
  title: 'Mengying — UX/Product Designer & Researcher',
  description:
    'UX/Product Designer & Researcher. MS in Human Centered Design & Engineering at the University of Washington, based in Seattle.',
  email: 'mengyingwww712@gmail.com',
  /** Put the file at public/resume.pdf. */
  resume: '/resume.pdf',
  linkedin: 'https://www.linkedin.com/in/mengying-www/',
  github: 'https://github.com/mengyingWWW',
};

// newTab links open outside the site: they get a ↗ and target="_blank" wherever they're rendered.
export const navLinks: { label: string; href: string; newTab?: boolean }[] = [
  { label: 'Work', href: '/#work' },
  { label: 'About', href: '/about' },
  { label: 'Resume', href: site.resume, newTab: true },
];

export const footerLinks: { label: string; href: string; newTab?: boolean }[] = [
  { label: 'Email', href: `mailto:${site.email}` },
  { label: 'Resume', href: site.resume, newTab: true },
  { label: 'LinkedIn', href: site.linkedin, newTab: true },
  { label: 'GitHub', href: site.github, newTab: true },
];

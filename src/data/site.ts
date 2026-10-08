export const site = {
  name: 'Mengying',
  fullName: 'Mengying',
  title: 'Mengying — UX/Product Designer & Researcher',
  description:
    'UX/Product Designer & Researcher. MS in Human Centered Design & Engineering at the University of Washington, based in Seattle.',
  email: 'mengyingwww712@gmail.com',
};

export const navLinks: { label: string; href: string; newTab?: boolean }[] = [
  { label: 'Work', href: '/#work' },
  { label: 'About', href: '/about' },
  // Put the file at public/resume.pdf. newTab links get a ↗ in the nav.
  { label: 'Resume', href: '/resume.pdf', newTab: true },
];

export const socialLinks = [
  { label: 'Email', href: `mailto:${site.email}` },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/mengying-www/' },
  { label: 'GitHub', href: 'https://github.com/mengyingWWW' },
];

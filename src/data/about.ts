export const about = {
  heading: 'Hi, I’m Mengying.',
  bio: [
    'I’m a UX/Product Designer & Researcher pursuing an MS in Human Centered Design & Engineering at the University of Washington in Seattle.',
    'I care about grounding design decisions in real evidence — pairing qualitative research with fast prototyping to ship experiences that are clear, useful, and kind. This is placeholder copy; replace it with your own story.',
  ],
  portrait: '/images/about/portrait.svg',
  portraitAlt: 'Portrait of Mengying',
};

export type Experience = {
  role: string;
  org: string;
  period: string;
  location?: string;
  details: string[];
};

export const experience: Experience[] = [
  {
    role: 'UX Research Intern',
    org: 'Placeholder Company',
    period: 'Jun 2026 — Sep 2026',
    location: 'Seattle, WA',
    details: [
      'Led a mixed-methods study with 20+ participants to identify friction in the onboarding flow.',
      'Synthesized findings into a prioritized opportunity map adopted by the product team.',
    ],
  },
  {
    role: 'Product Designer',
    org: 'Placeholder Studio',
    period: 'Jan 2025 — Dec 2025',
    location: 'Remote',
    details: [
      'Designed end-to-end flows for a B2B dashboard used by 5k+ weekly users.',
      'Built and maintained a component library in Figma shared across three squads.',
    ],
  },
  {
    role: 'MS, Human Centered Design & Engineering',
    org: 'University of Washington',
    period: '2025 — 2027',
    location: 'Seattle, WA',
    details: [
      'Coursework in user research, interaction design, prototyping, and data visualization.',
    ],
  },
];

export const skillGroups: { label: string; items: string[] }[] = [
  {
    label: 'Research',
    items: ['User Interviews', 'Usability Testing', 'Surveys', 'Diary Studies', 'Affinity Mapping', 'Journey Mapping'],
  },
  {
    label: 'Design',
    items: ['Interaction Design', 'Prototyping', 'Wireframing', 'Design Systems', 'Information Architecture'],
  },
  {
    label: 'Tools',
    items: ['Figma', 'FigJam', 'Framer', 'Dovetail', 'Miro', 'HTML/CSS'],
  },
];

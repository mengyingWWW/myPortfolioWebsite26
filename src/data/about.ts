import type { CityKey } from './citySketches';

/**
 * All copy for the About page. Wrap words in *asterisks* to set them in italic serif.
 */

export const aboutHero = {
  /** Put the photo at public/images/avatar.jpg; a gray circle shows until it exists. */
  portrait: { src: '/images/avatar.jpg', alt: 'Portrait of Mengying' },
  /** One entry per line. */
  headline: [
    'A UX designer & researcher',
    "who *starts with people* and *learns by making*, an architect's habit I now bring to AI products.",
  ],
  /** One entry per line. */
  bio: [
    'I used to design how people interact with *space*.',
    'Now I design how they interact with *interfaces*.',
  ],
  scrollHint: 'More about me',
  /** Bottom hint once the sundial has played (or been used). */
  nextHint: 'Education · Experience · Skills',
};

export type SundialStop = {
  /** Sketch drawn for this place (see src/data/citySketches.ts). */
  key: CityKey;
  place: string;
  /** Degrees north; sets the height of the sun's day arc. */
  latitude: number;
  /** Shown under the city selector; two or three lines at most. */
  caption: string;
};

export const sundial = {
  ariaLabel: 'Hand-drawn sundial: a sketch of each place I have lived casts a shadow from the sun',
  citiesLabel: 'Places I have lived',
  sunLabel: 'Sun position (time of day)',
  /** Screen readers only: the scene's taps have no keyboard equivalent of their own. */
  sceneHint: 'Use the place buttons below to switch cities.',
  /** Handwritten note beside the sun until it is first moved. */
  hint: 'drag the sun',
  /** Played in this order by the story tour. */
  stops: [
    {
      key: 'benxi',
      place: 'Benxi',
      latitude: 41.3,
      caption:
        'Home, where time seems to pause. A quiet place I carry with me, and the reason I design for people, not just products.',
    },
    {
      key: 'beijing',
      place: 'Beijing',
      latitude: 39.9,
      caption:
        'In architecture, I kept looking past the walls, to the people moving between them. Their stories drew me into human factors research, and then to HCI.',
    },
    {
      key: 'singapore',
      place: 'Singapore',
      latitude: 1.3,
      caption:
        'Under an almost vertical sun, I designed a space that never touches the ground, and began to imagine spaces that need no ground at all.',
    },
    {
      key: 'seattle',
      place: 'Seattle',
      latitude: 47.6,
      caption:
        'Leaf shadows drift across my window as I learn to design the spaces people now spend their days in: the ones on their screens.',
    },
  ] satisfies SundialStop[],
};

export const sectionLabels = {
  education: 'Education',
  experience: 'Experience',
  skills: 'Skills',
};

/** One labelled line of content. Separate list items with " / ". */
export type Field = { label: string; value: string };

export const education: { school: string; fields: Field[] }[] = [
  {
    school: 'University of Washington',
    fields: [
      { label: 'Degree', value: 'Master of Science in Human Centered Design & Engineering' },
      { label: 'Year', value: '2025.9 – 2027.6 (Expected)' },
      {
        label: 'Relevant Courses',
        value:
          'User Centered Design / Usability Studies / Computational Concepts in HCDE / Experimental Research Methods / Qualitative Research Methods',
      },
    ],
  },
  {
    school: 'Tsinghua University',
    fields: [
      { label: 'Degree', value: 'Bachelor of Engineering in Architecture' },
      { label: 'Year', value: '2020.9 – 2025.6' },
      { label: 'Relevant Courses', value: 'Design Studio / Media Programming / Interactive Design' },
      { label: 'Distinctions', value: 'Graduated with top 10% ranking / Tsinghua Overall Excellence Scholarship' },
    ],
  },
];

export const experience: { org: string; role: string; year: string }[] = [
  { org: 'IDEA Enterprises', role: 'UX / Product Designer Intern', year: '2026.6 – 2026.9' },
  { org: 'Colleague.AI', role: 'UX Research Lead · Industry-Sponsored Course Project', year: '2026.1 – 2026.3' },
  { org: 'City University of Hong Kong · KnowVis Lab', role: 'UX Researcher Intern', year: '2025.6 – 2025.12' },
  { org: 'NetEase Games', role: 'UX / Product Designer Intern', year: '2024.6 – 2024.9' },
  { org: 'Tsinghua Future Lab', role: 'UX / Product Designer Intern', year: '2023.6 – 2023.9' },
];

/** Items render joined with " / ". */
export const skills: { label: string; items: string[] }[] = [
  {
    label: 'UX Design',
    items: ['Interaction Design', 'Prototyping', 'Responsive Design', 'Design Systems', 'Information Architecture'],
  },
  {
    label: 'UX Research',
    items: ['User Interviews', 'Usability Testing', 'Mixed Methods', 'Eye Tracking', 'A/B Testing', 'Data Analysis'],
  },
  {
    label: 'AI Product Design',
    items: ['Generative AI', 'AI Agents & Automation', 'Human-AI Interaction', 'LLM-powered Workflows'],
  },
  { label: 'Vibe Coding', items: ['Claude Code', 'Cursor', 'Figma Make', 'Lovable', 'Bolt'] },
  {
    label: 'Tools',
    items: ['Figma', 'Framer', 'Adobe Suite', 'Rhino', 'Blender', 'HTML & CSS', 'JavaScript', 'Python'],
  },
];

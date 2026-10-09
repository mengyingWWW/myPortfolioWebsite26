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

/** Object drawn at each stop of the latitude sundial (see LatitudeSundial.astro). */
export type SundialObject = 'stick' | 'building' | 'floating' | 'monitor';

export type SundialStop = {
  /** Button label, first line. */
  lat: string;
  /** Noon sun altitude at the equinox, in degrees (90 − latitude). */
  altitude: number;
  /** Button label, second line. */
  place: string;
  /** Shown under the controls; two or three lines at most. */
  caption: string;
  object: SundialObject;
  /** Height of the object's top above the ground, in SVG units (where the light ray grazes it). */
  height: number;
  /** The object hovers, so it casts a detached ground shadow instead of a projected one. */
  floating?: boolean;
  /** Where "me" (the dot) stands in this scene, in SVG units (viewBox 1000×400, ground y = 330). Keep it off the light ray. */
  meAnchor: { x: number; y: number };
  /** Time stands still here: no idle drift of the sun, unlike the other stops. */
  still?: boolean;
};

export const sundial = {
  ariaLabel: 'The noon sun and the shadows it casts at the four latitudes I have lived at',
  controlsLabel: 'Choose a latitude',
  /** Annotation next to the sun; fades out once a latitude is chosen. */
  hint: 'follow the sun ↓',
  /** Played in this order, ending on the last stop. */
  stops: [
    {
      lat: '41.3°N',
      altitude: 48.7,
      place: 'Benxi',
      caption:
        'Home, where time seems to pause. A quiet place I carry with me, and the reason I design for people, not just products.',
      object: 'stick',
      // Above the stick (its top is at 176), so the ray clears "me" standing on it.
      height: 174,
      meAnchor: { x: 400, y: 170 },
      still: true,
    },
    {
      lat: '39.9°N',
      altitude: 50.1,
      place: 'Beijing',
      caption:
        'In architecture, I kept looking past the walls, to the people moving between them. Their stories drew me into human factors research, and then to HCI.',
      object: 'building',
      height: 180,
      // In the doorway.
      meAnchor: { x: 400, y: 316 },
    },
    {
      lat: '1.3°N',
      altitude: 88.7,
      place: 'Singapore',
      caption:
        'Under an almost vertical sun, I designed a space that never touches the ground, and began to imagine spaces that need no ground at all.',
      object: 'floating',
      height: 176,
      floating: true,
      // On the ground under the building, inside its shadow, clear of the ray, the angle arc and its label.
      meAnchor: { x: 470, y: 327 },
    },
    {
      lat: '47.6°N',
      altitude: 42.4,
      place: 'Seattle',
      caption:
        'Leaf shadows drift across my window as I learn to design the spaces people now spend their days in: the ones on their screens.',
      object: 'monitor',
      height: 162,
      // On the screen, like a button.
      meAnchor: { x: 440, y: 270 },
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

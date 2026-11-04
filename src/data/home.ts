export const hero = {
  greeting: 'Hello, I am',
  name: 'Mengying',
  taglineLead: 'A product designer who uses AI',
  /** Second line: before + rotating word + after. The first word shows first and under reduced motion. */
  taglineBefore: 'to',
  taglineWords: ['build', 'shape', 'uncover', 'translate'],
  taglineAfter: 'what it can’t generate alone.',
  /** What screen readers hear instead of both visible tagline lines. */
  taglineSpoken: 'A product designer who uses AI to build, shape, uncover and translate what it can’t generate alone.',
  intro: '2+ years of experience in AI, B2B and B2C products.',
  /** Quieter line under the intro; it only wraps between items. */
  education: ['M.S. HCDE @ UW', 'B.Eng @ Tsinghua'],
};

/** Homepage chapter strips. `projects` are work-collection slugs, in order. */
export const chapters = [
  {
    id: 'make-the-call',
    label: 'Chapter 01',
    title: 'Make the call.',
    subtitle:
      'I decide which design ships, and why. I sketch by hand, build with AI, and treat every problem as its own puzzle.',
    projects: ['idea-ai-wiki', 'idea-mapping'],
  },
  {
    id: 'sit-with-people',
    label: 'Chapter 02',
    title: 'Sit with people.',
    subtitle:
      'I listen to real users and feel what they feel. Empathy starts my design, and clear thinking turns it into a solution.',
    projects: ['seattle-ai-permitting', 'colleague-ai'],
  },
  {
    id: 'carry-it-forward',
    label: 'Chapter 03',
    title: 'Carry it forward.',
    subtitle:
      'My path wasn’t straight or standard. Every step shaped the designer I am, and no AI has walked it.',
    projects: ['parkipedia', 'netease-games'],
  },
];

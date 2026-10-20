/**
 * Hand-drawn city sketches for the About sundial (see SketchSundial.astro). Each stroke is an SVG path `d`,
 * drawn as a jittered double ink line. Coordinates are in a 200 × 140 sketch space whose ground line is
 * y = 118 and whose centre is x = 100; anything below y = 118 sits under the ground.
 *
 * Every stroke casts a shadow, unless it is marked `noShadow` (sky, smoke, rain, far background, or detail
 * drawn on a surface such as windows and doors). To use your own drawing, paste its path data here.
 *
 * The sun sits behind the drawing. A stroke can hide it (`cover`: a closed silhouette filled with the page
 * background) or cross in front of it (`knockout`: drawn over a wider background-coloured line).
 */
export type SketchStroke = {
  d: string;
  /** `thin`: a finer detail line. `light`: a grey background line. Default: the main ink line. */
  weight?: 'thin' | 'light';
  noShadow?: boolean;
  /** A closed outline of the shape this stroke draws, filled with the page background. */
  cover?: string;
  knockout?: boolean;
};

export type CityKey = 'benxi' | 'beijing' | 'singapore' | 'seattle';

export const citySketches: Record<CityKey, SketchStroke[]> = {
  benxi: [
    {
      d: 'M2 104 C22 86 34 78 52 70 C64 64 74 72 86 66 C100 58 112 46 126 50 C140 54 150 66 166 62 C180 58 190 64 198 70',
      weight: 'light',
      noShadow: true,
    },
    { d: 'M18 118 C30 104 40 98 52 94 C64 90 70 84 82 86 C92 88 98 96 104 100' },
    { d: 'M100 118 L100 92 L110 86 L120 92 L130 86 L140 92 L150 86 L150 118' },
    { d: 'M154 118 L154 62 L162 62 L162 118' },
    { d: 'M168 118 L168 70 L175 70 L175 118' },
    { d: 'M158 60 C154 52 162 48 158 40 C155 34 162 30 160 24', weight: 'thin', noShadow: true, knockout: true },
    { d: 'M171 68 C167 60 175 56 171 48 C168 42 174 38 172 32', weight: 'thin', noShadow: true, knockout: true },
    { d: 'M108 104 L116 104 M124 104 L132 104 M140 104 L146 104', weight: 'thin', noShadow: true },
  ],
  beijing: [
    { d: 'M30 70 C55 64 80 62 100 62 C120 62 145 64 170 70' },
    { d: 'M22 66 C28 72 32 72 38 70' },
    { d: 'M178 66 C172 72 168 72 162 70' },
    { d: 'M40 72 L40 82 L160 82 L160 72' },
    {
      d: 'M50 66 L50 72 M62 64 L62 72 M74 63 L74 72 M86 62 L86 72 M98 62 L98 72 M110 62 L110 72 M122 63 L122 72 M134 64 L134 72 M146 65 L146 72',
      weight: 'thin',
      noShadow: true,
    },
    { d: 'M48 82 L48 118 M152 82 L152 118' },
    { d: 'M84 118 L84 94 C84 86 116 86 116 94 L116 118', noShadow: true },
    { d: 'M64 92 L64 104 M60 92 L72 92 L72 104 L60 104 Z', weight: 'thin', noShadow: true },
    {
      d: 'M134 98 C130 98 128 102 130 106 C132 110 138 110 140 106 C142 102 138 98 134 98 Z M134 94 L134 98',
      weight: 'thin',
      noShadow: true,
    },
    { d: 'M176 118 L176 84 M176 96 C184 88 194 92 198 84 M176 104 C168 98 162 100 158 94', weight: 'light' },
  ],
  singapore: [
    { d: 'M62 118 L62 22 L138 22 L138 118' },
    { d: 'M62 40 L138 40 M62 58 L138 58 M62 76 L138 76 M62 94 L138 94', weight: 'thin', noShadow: true },
    {
      d: 'M74 32 L84 32 M98 32 L108 32 M118 32 L128 32 M74 50 L84 50 M98 50 L108 50 M118 50 L128 50 M74 68 L84 68 M98 68 L108 68 M118 68 L128 68 M74 86 L84 86 M98 86 L108 86 M118 86 L128 86',
      weight: 'thin',
      noShadow: true,
    },
    { d: 'M138 46 L156 46 M146 46 L146 50 M150 46 L150 52', weight: 'thin' },
    { d: 'M30 118 C30 96 28 82 26 64' },
    {
      d: 'M26 64 C16 58 8 62 2 70 M26 64 C20 52 10 50 4 52 M26 64 C30 52 40 48 48 52 M26 64 C38 60 46 64 52 72 M26 64 C26 54 24 46 18 40',
    },
  ],
  seattle: [
    {
      d: 'M10 96 C40 80 62 52 84 40 C92 36 98 34 104 40 C122 56 150 76 192 94',
      weight: 'light',
      noShadow: true,
      cover: 'M10 96 C40 80 62 52 84 40 C92 36 98 34 104 40 C122 56 150 76 192 94 L192 118 L10 118 Z',
    },
    {
      d: 'M74 50 C80 54 86 48 92 54 C96 50 102 54 108 50 C112 54 118 54 120 56',
      weight: 'thin',
      noShadow: true,
    },
    { d: 'M30 118 L30 108 M22 108 L30 84 L38 108 Z M24 100 L36 100' },
    { d: 'M52 118 L52 110 M45 110 L52 90 L59 110 Z' },
    { d: 'M150 118 L150 106 M140 106 L150 76 L160 106 Z M143 96 L157 96 M146 86 L154 86' },
    { d: 'M168 118 L168 112 M162 112 L168 98 L174 112 Z' },
  ],
};

/**
 * Hand-drawn city sketches for the About sundial (see SketchSundial.astro). Each stroke is an SVG path `d`,
 * drawn as a jittered double ink line. Coordinates are in a 200 × 140 sketch space whose ground line is
 * y = 118 and whose centre is x = 100; anything below y = 118 sits under the ground.
 *
 * Every stroke casts a shadow, unless it is marked `noShadow` (sky, smoke, rain, far background, or detail
 * drawn on a surface such as windows and doors). To use your own drawing, paste its path data here.
 */
export type SketchStroke = {
  d: string;
  /** `thin`: a finer detail line. `light`: a grey background line. Default: the main ink line. */
  weight?: 'thin' | 'light';
  noShadow?: boolean;
};

export type CityKey = 'benxi' | 'beijing' | 'singapore' | 'seattle';

/** From about-sketch-sundial-v7.html. */
export const citySketches: Record<CityKey, SketchStroke[]> = {
  benxi: [
    { d: 'M2 104 C22 86 34 78 52 70 C64 64 74 72 86 66 C100 58 112 46 126 50 C140 54 150 66 166 62 C180 58 190 64 198 70', weight: 'light', noShadow: true },
    { d: 'M18 118 C30 104 40 98 52 94 C64 90 70 84 82 86 C92 88 98 96 104 100' },
    { d: 'M100 118 L100 92 L110 86 L120 92 L130 86 L140 92 L150 86 L150 118' },
    { d: 'M154 118 L154 62 L162 62 L162 118' },
    { d: 'M168 118 L168 70 L175 70 L175 118' },
    { d: 'M158 60 C154 52 162 48 158 40 C155 34 162 30 160 24', weight: 'thin', noShadow: true },
    { d: 'M171 68 C167 60 175 56 171 48 C168 42 174 38 172 32', weight: 'thin', noShadow: true },
    { d: 'M116 93 L134 93 L134 110 L116 110 Z', weight: 'thin', noShadow: true },
    { d: 'M125 93 L125 90 M121 90 L129 90', weight: 'light', noShadow: true },
    { d: 'M105 114 L112 114 M138 114 L145 114', weight: 'thin', noShadow: true },
  ],
  beijing: [
    // A Beijing hutong: a low grey-brick wall with tiled coping, a small courtyard door, a scholar tree behind.
    { d: 'M20 118 L20 78 L124 78 M140 78 L190 78 L190 118' },
    { d: 'M17 76 L128 76 M136 76 L193 76 M17 76 L17 78 L20 78 M193 76 L193 78 L190 78' },
    { d: 'M18 76 Q20 73.6 22 76 Q24 73.6 26 76 Q28 73.6 30 76 Q32 73.6 34 76 Q36 73.6 38 76 Q40 73.6 42 76 Q44 73.6 46 76 Q48 73.6 50 76 Q52 73.6 54 76 Q56 73.6 58 76 Q60 73.6 62 76 Q64 73.6 66 76 Q68 73.6 70 76 Q72 73.6 74 76 Q76 73.6 78 76 Q80 73.6 82 76 Q84 73.6 86 76 Q88 73.6 90 76 Q92 73.6 94 76 Q96 73.6 98 76 Q100 73.6 102 76 Q104 73.6 106 76 Q108 73.6 110 76 Q112 73.6 114 76 Q116 73.6 118 76 Q120 73.6 122 76 Q124 73.6 126 76 M138 76 Q140 73.6 142 76 Q144 73.6 146 76 Q148 73.6 150 76 Q152 73.6 154 76 Q156 73.6 158 76 Q160 73.6 162 76 Q164 73.6 166 76 Q168 73.6 170 76 Q172 73.6 174 76 Q176 73.6 178 76 Q180 73.6 182 76 Q184 73.6 186 76 Q188 73.6 190 76', weight: 'light', noShadow: true },
    { d: 'M30 96 L42 96 M58 108 L72 108 M86 90 L96 90 M156 102 L168 102', weight: 'light', noShadow: true },
    { d: 'M120 118 L120 90 L144 90 L144 118', noShadow: true },
    { d: 'M132 90 L132 118', weight: 'thin', noShadow: true },
    { d: 'M112 84 L132 74 L152 84 Z' },
    { d: 'M112 84 Q114 86 116 84 Q118 86 120 84 Q122 86 124 84 Q126 86 128 84 Q130 86 132 84 Q134 86 136 84 Q138 86 140 84 Q142 86 144 84 Q146 86 148 84 Q150 86 152 84', weight: 'light', noShadow: true },
    { d: 'M162 76 C162.5 66 161 58 158 50 M168 76 C167.5 66 169 59 172 52' },
    { d: 'M159 54 L151 46 M171 56 L180 48 M165 60 L165 46', weight: 'thin', noShadow: true },
    { d: 'M138 52 C134 40 146 30 158 33 C164 24 182 26 186 36', weight: 'light', noShadow: true },
    { d: 'M186 36 C198 40 196 56 184 58 C176 62 164 60 156 58', weight: 'light', noShadow: true },
    { d: 'M146 48 C150 42 158 40 164 42', weight: 'light', noShadow: true },
    { d: 'M168 40 C176 36 184 40 186 48', weight: 'light', noShadow: true },
    // A bike parked in front; the dot is its front hub.
    { d: 'M-28 106 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0', noShadow: true },
    { d: 'M2 106 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0', noShadow: true },
    { d: 'M6 106 L14 106 M4.8 102.2 L10.5 96.5 M2 102 L2 94 M-0.8 102.2 L-6.5 96.5 M-2 106 L-10 106 M-0.8 109.8 L-6.5 115.5 M2 110 L2 118 M4.8 109.8 L10.5 115.5', weight: 'light', noShadow: true },
    { d: 'M-28 106 L-12 107 L-16 90 Z M-16 90 L-3 90 L-12 107 M-3 90 L2 106', noShadow: true },
    { d: 'M-16 90 L-17 86 M-21 86 L-12 86 M-3 90 L-4 84 C-2 82 2 82 5 85', weight: 'thin', noShadow: true },
  ],
  singapore: [
    { d: 'M62 118 L62 22 L138 22 L138 118' },
    { d: 'M62 40 L138 40 M62 58 L138 58 M62 76 L138 76 M62 94 L138 94', weight: 'thin', noShadow: true },
    { d: 'M74 32 L84 32 M98 32 L108 32 M118 32 L128 32 M74 50 L84 50 M98 50 L108 50 M118 50 L128 50 M74 68 L84 68 M98 68 L108 68 M118 68 L128 68 M74 86 L84 86 M98 86 L108 86 M118 86 L128 86', weight: 'thin', noShadow: true },
    { d: 'M138 46 L156 46 M146 46 L146 50 M150 46 L150 52', weight: 'thin' },
    { d: 'M30 118 C30 96 28 82 26 64' },
    { d: 'M16 70 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0', weight: 'thin', noShadow: true },
    { d: 'M26 64 C16 58 8 62 2 70 M26 64 C20 52 10 50 4 52 M26 64 C30 52 40 48 48 52 M26 64 C38 60 46 64 52 72 M26 64 C26 54 24 46 18 40' },
  ],
  seattle: [
    { d: 'M10 96 C40 80 62 52 84 40 C92 36 98 34 104 40 C122 56 150 76 192 94', weight: 'light', noShadow: true },
    { d: 'M74 50 C80 54 86 48 92 54 C96 50 102 54 108 50 C112 54 118 54 120 56', weight: 'thin', noShadow: true },
    { d: 'M30 118 L30 108 M22 108 L30 84 L38 108 Z M24 100 L36 100' },
    { d: 'M52 118 L52 110 M45 110 L52 90 L59 110 Z' },
    { d: 'M150 118 L150 106 M140 106 L150 76 L160 106 Z M143 96 L157 96 M146 86 L154 86' },
    { d: 'M168 118 L168 112 M162 112 L168 98 L174 112 Z' },
  ],
};

/** Where the ink dot lands in each sketch (sketch space): a stopped clock, a bicycle's front hub, a coconut, a crow. */
export const cityDots: Record<CityKey, [number, number]> = {
  benxi: [125, 101.5],
  beijing: [2, 106],
  singapore: [23, 71],
  seattle: [168, 94.5],
};

/**
 * SVG drawn with the dot once it has landed (scene units around its centre), faded in after the hop and out
 * before the next: the clock's white hands, the crow's head, beak, tail and legs. `data-nod` tilts once.
 */
export const cityDotParts: Partial<Record<CityKey, string>> = {
  benxi: `<path d="M0 0 L0 -3.4 M0 0 L2.6 1.3" stroke="#fff" stroke-width="1.1" stroke-linecap="round" fill="none"/>`,
  seattle: `<g data-nod><circle cx="4.4" cy="-3.6" r="2.5" fill="#1A1A1A"/><path d="M6.3 -4.2 L9.6 -3.4 L6.5 -2.6 Z" fill="#1A1A1A"/></g>
    <path d="M-4 -1 L-9 -3.8 M-4 0.6 L-9.4 -1" stroke="#151515" stroke-width="1.2" stroke-linecap="round" fill="none"/>
    <path d="M-1.2 4.4 L-1.6 7.2 M1.6 4.4 L1.9 7.2" stroke="#151515" stroke-width=".9" stroke-linecap="round" fill="none"/>`,
};

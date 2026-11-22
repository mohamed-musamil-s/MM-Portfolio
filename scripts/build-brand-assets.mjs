/**
 * Writes the "MM." logo files to public/brand/ from the shared geometry
 * (src/lib/shared/brand/monogram.ts, loaded with Node's type stripping).
 *
 *   npm run brand:assets
 *
 * Files use the exact brief colours (charcoal #232931, circuit orange #FF7B1C,
 * off-white #F5F4F0). See docs/brand/LOGO.md.
 */
import { mkdir, writeFile } from "node:fs/promises";
import {
  BRAND_ASSET_COLORS as C,
  MONOGRAM_DOT as DOT,
  MONOGRAM_DOT_RING_RADIUS,
  MONOGRAM_LETTERS,
  MONOGRAM_NODES,
  MONOGRAM_NODE_RADIUS,
  MONOGRAM_TRACES,
  MONOGRAM_TRACE_WIDTH,
  MONOGRAM_VIEWBOX as VB,
} from "../src/lib/shared/brand/monogram.ts";

const OUT = new URL("../public/brand/", import.meta.url);
/** Clear space around the mark on the "on paper" files: half the cap height. */
const PAD = VB.height / 2;

const mark = (circuit) => {
  const parts = [
    `<path d="${MONOGRAM_LETTERS}" fill="${C.charcoal}"/>`,
    `<circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${C.charcoal}"/>`,
  ];
  if (circuit) {
    parts.push(
      `<g fill="none" stroke="${C.circuit}" stroke-width="${MONOGRAM_TRACE_WIDTH}" stroke-linecap="round" stroke-linejoin="round">`,
      ...MONOGRAM_TRACES.map((d) => `<path d="${d}"/>`),
      ...MONOGRAM_NODES.map(
        ([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="${MONOGRAM_NODE_RADIUS}" fill="${C.charcoal}"/>`,
      ),
      `<circle cx="${DOT.cx}" cy="${DOT.cy}" r="${MONOGRAM_DOT_RING_RADIUS}"/>`,
      `</g>`,
    );
  }
  return parts.join("\n  ");
};

const svg = ({ circuit, paper }) => {
  const width = VB.width + (paper ? PAD * 2 : 0);
  const height = VB.height + (paper ? PAD * 2 : 0);
  const offset = paper ? PAD : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="MM.">
  ${paper ? `<rect width="${width}" height="${height}" fill="${C.offWhite}"/>` : ""}
  <g transform="translate(${offset} ${offset})">
  ${mark(circuit)}
  </g>
</svg>
`;
};

const FILES = {
  "mm-monogram.svg": { circuit: false, paper: false },
  "mm-monogram-on-paper.svg": { circuit: false, paper: true },
  "mm-monogram-circuit.svg": { circuit: true, paper: false },
  "mm-monogram-circuit-on-paper.svg": { circuit: true, paper: true },
};

await mkdir(OUT, { recursive: true });
for (const [name, options] of Object.entries(FILES)) {
  await writeFile(new URL(name, OUT), svg(options));
  console.log(`wrote public/brand/${name}`);
}

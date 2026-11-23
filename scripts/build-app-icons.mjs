/**
 * Writes the site's app icons from the "MM." monogram geometry
 * (src/lib/shared/brand/monogram.ts, loaded with Node's type stripping).
 *
 *   npm run brand:icons
 *
 * Output (Next.js metadata file conventions pick up the ones in src/app):
 *   src/app/favicon.ico         16, 32 and 48 px in one file
 *   src/app/icon.svg            scalable tab icon
 *   src/app/apple-icon.png      180 px home-screen icon (iOS)
 *   public/icons/icon-192.png   web app manifest
 *   public/icons/icon-512.png   web app manifest
 *   public/icons/icon-maskable-512.png  Android adaptive icon (full bleed, mark in the safe zone)
 *
 * Look: charcoal tile, off-white letters, orange period (docs/brand/LOGO.md).
 */
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import {
  BRAND_ASSET_COLORS as C,
  MONOGRAM_DOT as DOT,
  MONOGRAM_LETTERS,
  MONOGRAM_VIEWBOX as VB,
} from "../src/lib/shared/brand/monogram.ts";

const APP = new URL("../src/app/", import.meta.url);
const PUBLIC_ICONS = new URL("../public/icons/", import.meta.url);

/**
 * A square icon. `markShare` is the mark's width as a share of the tile;
 * `radius` is the corner radius as a share of the tile (0 = full bleed).
 */
const iconSvg = ({ size = 512, markShare = 0.74, radius = 0.22 } = {}) => {
  const markWidth = size * markShare;
  const scale = markWidth / VB.width;
  const x = (size - markWidth) / 2;
  const y = (size - VB.height * scale) / 2;
  const r = size * radius;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="${C.charcoal}"/>
  <g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(5)})">
    <path d="${MONOGRAM_LETTERS}" fill="${C.offWhite}"/>
    <circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${C.circuit}"/>
  </g>
</svg>
`;
};

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/** ICO container holding PNG images (supported by every current browser). */
const ico = (images) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]);
};

const write = async (url, data, label) => {
  await writeFile(url, data);
  console.log(`wrote ${label}`);
};

// Small sizes: the mark fills more of the tile so it stays legible at 16 px.
const small = iconSvg({ markShare: 0.84, radius: 0.2 });
const standard = iconSvg();
const maskable = iconSvg({ markShare: 0.56, radius: 0 });

await mkdir(PUBLIC_ICONS, { recursive: true });

const icoImages = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(small, size) })));
await write(new URL("favicon.ico", APP), ico(icoImages), "src/app/favicon.ico");
await write(new URL("icon.svg", APP), small, "src/app/icon.svg");
await write(new URL("apple-icon.png", APP), await png(iconSvg({ radius: 0 }), 180), "src/app/apple-icon.png");
await write(new URL("icon-192.png", PUBLIC_ICONS), await png(standard, 192), "public/icons/icon-192.png");
await write(new URL("icon-512.png", PUBLIC_ICONS), await png(standard, 512), "public/icons/icon-512.png");
await write(
  new URL("icon-maskable-512.png", PUBLIC_ICONS),
  await png(maskable, 512),
  "public/icons/icon-maskable-512.png",
);

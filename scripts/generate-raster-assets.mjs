/**
 * Rasterize the SVG brand assets into the PNG/ICO files that browsers and
 * social crawlers expect (they don't all accept SVG). Uses `sharp`, which
 * is already a dependency. Re-run whenever the source SVGs change:
 *
 *   node scripts/generate-raster-assets.mjs
 */
import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pub = resolve(root, "public");

const favicon = readFileSync(resolve(pub, "favicon.svg"));
const og = readFileSync(resolve(pub, "og-image.svg"));
const avatar = readFileSync(resolve(pub, "img", "default-avatar.svg"));

const jobs = [
  { src: favicon, out: "apple-touch-icon.png", size: 180 },
  { src: favicon, out: "icon-192.png", size: 192 },
  { src: favicon, out: "icon-512.png", size: 512 },
  { src: favicon, out: "favicon-32.png", size: 32 },
  { src: og, out: "og-image.png", width: 1200, height: 630 },
  // next/image won't serve raw SVG without dangerouslyAllowSVG, so the
  // avatar fallback ships as a PNG (the SVG remains the editable source).
  { src: avatar, out: "img/default-avatar.png", size: 256 },
];

for (const job of jobs) {
  const pipeline = sharp(job.src, { density: 300 });
  if (job.size) pipeline.resize(job.size, job.size);
  if (job.width) pipeline.resize(job.width, job.height);
  await pipeline.png().toFile(resolve(pub, job.out));
  console.log(`  wrote public/${job.out}`);
}

console.log("Raster assets generated.");

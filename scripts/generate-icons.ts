#!/usr/bin/env bun
/**
 * Generates static/icons/icon-192.png and icon-512.png from src/icon.svg.
 * Run with:  bun run icons
 *
 * sharp v0.33+ API: sharp(input).resize(w, h).png().toFile(output)
 */
import sharp from 'sharp';
import { mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

const root   = new URL('..', import.meta.url).pathname;
const input  = join(root, 'src', 'icon.svg');
const outDir = join(root, 'static', 'icons');

mkdirSync(outDir, { recursive: true });

const sizes = [192, 512] as const;

for (const size of sizes) {
  const output = join(outDir, `icon-${size}.png`);
  await sharp(input)
    .resize(size, size)
    .png()
    .toFile(output);
  console.log(`✓ ${output}`);
}

console.log('Icons generated successfully.');

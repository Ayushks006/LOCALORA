import fs from 'fs';
import path from 'path';

const fallbackPath = path.resolve(__dirname, '../../../frontend/src/data/destinationsFallback.ts');
const content = fs.readFileSync(fallbackPath, 'utf8');

const startArr = content.indexOf('[');
const endArr = content.lastIndexOf(']');
const fallbackDestinations = JSON.parse(content.slice(startArr, endArr + 1));

console.log('Total fallback destinations in frontend:', fallbackDestinations.length);
let bad = 0;
let lt3 = 0;
for (const d of fallbackDestinations) {
  if (d.primary_image?.includes('.svg') || d.cover_image?.includes('.svg')) {
    bad++;
  }
  if ((d.images?.length || 0) < 3) {
    lt3++;
  }
}
console.log('Bad SVG images in frontend fallback:', bad);
console.log('Frontend fallback destinations with < 3 images:', lt3);

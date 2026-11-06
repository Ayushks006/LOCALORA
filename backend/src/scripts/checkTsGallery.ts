import { heritageDestinations } from '../seed/data/heritageDestinations.js';
import { natureHillsDestinations } from '../seed/data/natureHillsDestinations.js';
import { wildlifeWaterfallsDestinations } from '../seed/data/wildlifeWaterfallsDestinations.js';
import { coastalSpiritualDestinations } from '../seed/data/coastalSpiritualDestinations.js';
import { cultureUrbanDestinations } from '../seed/data/cultureUrbanDestinations.js';
import { regionalGemsDestinations } from '../seed/data/regionalGemsDestinations.js';
import { heritageNatureExtraDestinations } from '../seed/data/heritageNatureExtraDestinations.js';

const all = [
  ...heritageDestinations,
  ...natureHillsDestinations,
  ...wildlifeWaterfallsDestinations,
  ...coastalSpiritualDestinations,
  ...cultureUrbanDestinations,
  ...regionalGemsDestinations,
  ...heritageNatureExtraDestinations,
];

let totalGallery = 0;
let badGallery = 0;
const destinationsWithFewerThan3Gallery: string[] = [];

for (const d of all) {
  const images = d.images || [];
  totalGallery += images.length;
  if (images.length < 3) {
    destinationsWithFewerThan3Gallery.push(`${d.name} (${images.length} images)`);
  }
  for (const img of images) {
    if (img.url.includes('.svg') || img.url.includes('Question_book') || img.url.includes('Red_pog')) {
      badGallery++;
      console.log(`Bad gallery image in TS: [${d.name}] -> ${img.url}`);
    }
  }
}

console.log('Total gallery images in TS modules:', totalGallery);
console.log('Bad gallery images in TS modules:', badGallery);
console.log('Destinations with fewer than 3 gallery images:', destinationsWithFewerThan3Gallery.length);
if (destinationsWithFewerThan3Gallery.length > 0) {
  console.log('Sample < 3 gallery:', destinationsWithFewerThan3Gallery.slice(0, 10));
}

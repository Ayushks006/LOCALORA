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

console.log('Total destinations in pure TypeScript modules:', all.length);

const districts = new Set(all.map(d => d.district));
console.log('Districts covered:', districts.size);

let bad = 0;
for (const d of all) {
  if (d.primary_image.includes('.svg') || d.primary_image.includes('Question_book') || d.primary_image.includes('Red_pog')) {
    bad++;
    console.log(`Bad in TS: ${d.name} (${d.district}) -> ${d.primary_image}`);
  }
}
console.log('Bad primary images in pure TS modules:', bad);

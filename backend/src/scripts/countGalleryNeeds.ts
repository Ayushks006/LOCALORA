import { heritageDestinations } from '../seed/data/heritageDestinations.js';
import { natureHillsDestinations } from '../seed/data/natureHillsDestinations.js';
import { wildlifeWaterfallsDestinations } from '../seed/data/wildlifeWaterfallsDestinations.js';
import { coastalSpiritualDestinations } from '../seed/data/coastalSpiritualDestinations.js';
import { cultureUrbanDestinations } from '../seed/data/cultureUrbanDestinations.js';
import { regionalGemsDestinations } from '../seed/data/regionalGemsDestinations.js';
import { heritageNatureExtraDestinations } from '../seed/data/heritageNatureExtraDestinations.js';

const groups = [
  { name: 'heritageDestinations.ts', list: heritageDestinations },
  { name: 'natureHillsDestinations.ts', list: natureHillsDestinations },
  { name: 'wildlifeWaterfallsDestinations.ts', list: wildlifeWaterfallsDestinations },
  { name: 'coastalSpiritualDestinations.ts', list: coastalSpiritualDestinations },
  { name: 'cultureUrbanDestinations.ts', list: cultureUrbanDestinations },
  { name: 'regionalGemsDestinations.ts', list: regionalGemsDestinations },
  { name: 'heritageNatureExtraDestinations.ts', list: heritageNatureExtraDestinations },
];

for (const g of groups) {
  const needs = g.list.filter(d => (d.images?.length || 0) < 3);
  console.log(`${g.name}: ${g.list.length} destinations, ${needs.length} have < 3 gallery images`);
}

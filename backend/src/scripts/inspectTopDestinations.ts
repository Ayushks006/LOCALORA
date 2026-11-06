import fs from 'fs';
import path from 'path';
import https from 'https';
import { heritageDestinations } from '../seed/data/heritageDestinations.js';
import { natureHillsDestinations } from '../seed/data/natureHillsDestinations.js';
import { wildlifeWaterfallsDestinations } from '../seed/data/wildlifeWaterfallsDestinations.js';
import { coastalSpiritualDestinations } from '../seed/data/coastalSpiritualDestinations.js';
import { cultureUrbanDestinations } from '../seed/data/cultureUrbanDestinations.js';

const all = [
  ...heritageDestinations,
  ...natureHillsDestinations,
  ...wildlifeWaterfallsDestinations,
  ...coastalSpiritualDestinations,
  ...cultureUrbanDestinations,
];

const targetSlugs = [
  'hampi',
  'mysuru-palace',
  'badami',
  'belur',
  'halebidu',
  'jog-falls',
  'gokarna',
  'coorg',
  'mullayanagiri',
  'lalbagh-botanical-garden',
  'kudremukh',
  'st-marys-islands',
  'murudeshwar',
  'chitradurga-fort'
];

const selected = all.filter(d => targetSlugs.includes(d.slug));
console.log('Found top destinations:', selected.map(d => ({ slug: d.slug, name: d.name, imgCount: d.images?.length })));

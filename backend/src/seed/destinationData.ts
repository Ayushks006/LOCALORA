import { heritageDestinations } from './data/heritageDestinations.js';
import { natureHillsDestinations } from './data/natureHillsDestinations.js';
import { wildlifeWaterfallsDestinations } from './data/wildlifeWaterfallsDestinations.js';
import { coastalSpiritualDestinations } from './data/coastalSpiritualDestinations.js';
import { cultureUrbanDestinations } from './data/cultureUrbanDestinations.js';
import { regionalGemsDestinations } from './data/regionalGemsDestinations.js';
import { heritageNatureExtraDestinations } from './data/heritageNatureExtraDestinations.js';

export interface SeedDestination {
  name: string;
  slug: string;
  region_code: string;
  district: string;
  locality: string;
  category_slug: string;
  description: string;
  long_description: string;
  latitude: number;
  longitude: number;
  best_time_to_visit: string;
  suggested_duration: string;
  travel_tips: string;
  primary_image: string;
  is_featured: number;
  attractions: { title: string; description: string; image_url: string }[];
  images: { url: string; caption: string; attribution: string; license: string; sort_order?: number; is_cover?: number; alt_text?: string }[];
}

export const karnatakaDestinations: SeedDestination[] = [
  ...heritageDestinations,
  ...natureHillsDestinations,
  ...wildlifeWaterfallsDestinations,
  ...coastalSpiritualDestinations,
  ...cultureUrbanDestinations,
  ...regionalGemsDestinations,
  ...heritageNatureExtraDestinations,
];

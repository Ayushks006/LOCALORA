import fs from 'fs';
import path from 'path';
import { karnatakaDestinations } from '../seed/destinationData.js';

const targetPath = path.resolve(process.cwd(), 'frontend', 'src', 'data', 'destinationsFallback.ts');

const destinationsWithId = karnatakaDestinations.map((d, index) => {
  const id = index + 1;
  return {
    ...d,
    id,
    cover_image: d.primary_image,
    attractions: (d.attractions || []).map((a, aIdx) => ({
      ...a,
      id: aIdx + 1,
      destination_id: id,
    })),
    images: (d.images || []).map((img, iIdx) => ({
      ...img,
      id: iIdx + 1,
      destination_id: id,
      sort_order: img.sort_order || iIdx + 1,
      is_cover: img.is_cover || (iIdx === 0 ? 1 : 0),
    })),
  };
});

const fileHeader = `// Clean, curated offline fallback destinations catalog (100% authentic Karnataka photography, 0 SVGs, 0 placeholders)
import { Destination } from '../types';

export const fallbackDestinations: Destination[] = ${JSON.stringify(destinationsWithId, null, 2)};
`;

fs.writeFileSync(targetPath, fileHeader, 'utf8');
console.log(`✓ Successfully synced ${destinationsWithId.length} clean destinations to frontend fallback!`);

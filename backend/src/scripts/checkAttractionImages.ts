import { heritageDestinations } from '../seed/data/heritageDestinations.js';

let newFromAttractions = 0;
for (const d of heritageDestinations) {
  const existingUrls = new Set((d.images || []).map(img => img.url));
  const candidateUrls = (d.attractions || [])
    .map(a => a.image_url)
    .filter(u => u && !existingUrls.has(u));
  if (candidateUrls.length > 0) {
    newFromAttractions += candidateUrls.length;
    console.log(`${d.name}: ${candidateUrls.length} fresh attraction images found`);
  }
}
console.log('Total fresh attraction images in heritageDestinations:', newFromAttractions);

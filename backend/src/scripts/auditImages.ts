import { karnatakaDestinations } from '../seed/destinationData.js';

console.log('Total destinations in catalog:', karnatakaDestinations.length);

let totalPrimary = 0;
let totalGallery = 0;
let totalAttractions = 0;

const domainCounts: Record<string, number> = {};
const samplesByDomain: Record<string, string[]> = {};

function addUrl(url: string) {
  if (!url) return;
  try {
    const parsed = new URL(url);
    domainCounts[parsed.hostname] = (domainCounts[parsed.hostname] || 0) + 1;
    if (!samplesByDomain[parsed.hostname]) samplesByDomain[parsed.hostname] = [];
    if (samplesByDomain[parsed.hostname].length < 3) {
      samplesByDomain[parsed.hostname].push(url);
    }
  } catch (e) {
    domainCounts['INVALID'] = (domainCounts['INVALID'] || 0) + 1;
  }
}

for (const dest of karnatakaDestinations) {
  totalPrimary++;
  addUrl(dest.primary_image);

  for (const img of dest.images || []) {
    totalGallery++;
    addUrl(img.url);
  }

  for (const attr of dest.attractions || []) {
    totalAttractions++;
    addUrl(attr.image_url);
  }
}

console.log(`Primary: ${totalPrimary}, Gallery: ${totalGallery}, Attractions: ${totalAttractions}`);
console.log('Domain breakdown:');
for (const [dom, count] of Object.entries(domainCounts)) {
  console.log(`  ${dom}: ${count}`);
  console.log(`    Sample: ${samplesByDomain[dom]?.[0]}`);
}

// Check destinations with < 3 gallery images
const lowGallery = karnatakaDestinations.filter(d => (d.images?.length || 0) < 3);
console.log(`Destinations with fewer than 3 gallery images: ${lowGallery.length}`);
if (lowGallery.length > 0) {
  console.log('Sample low gallery destinations:', lowGallery.slice(0, 5).map(d => `${d.name} (${d.images?.length || 0})`));
}

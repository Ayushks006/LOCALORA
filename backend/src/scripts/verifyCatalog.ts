import { karnatakaDestinations } from '../seed/destinationData.js';

console.log('=== VERIFYING EXPANDED KARNATAKA CATALOG ===');
console.log('Total destinations loaded:', karnatakaDestinations.length);

const slugs = new Set<string>();
const duplicateSlugs: string[] = [];
for (const d of karnatakaDestinations) {
  if (slugs.has(d.slug)) {
    duplicateSlugs.push(d.slug);
  }
  slugs.add(d.slug);
}
console.log('Unique destination slugs:', slugs.size);
if (duplicateSlugs.length > 0) {
  console.error('ERROR: Duplicate slugs found:', duplicateSlugs);
}

const districts = new Set<string>();
const categories = new Set<string>();
let totalAttractions = 0;
let totalGalleryImages = 0;
const imageUrls = new Map<string, string>(); // url -> dest name
const duplicateImages: { url: string; dest1: string; dest2: string }[] = [];

for (const d of karnatakaDestinations) {
  districts.add(d.district);
  categories.add(d.category_slug);
  totalAttractions += d.attractions.length;
  totalGalleryImages += d.images.length;

  for (const img of d.images) {
    if (imageUrls.has(img.url)) {
      duplicateImages.push({ url: img.url, dest1: imageUrls.get(img.url)!, dest2: d.name });
    } else {
      imageUrls.set(img.url, d.name);
    }
  }
}

console.log('\nDistricts covered (' + districts.size + '):');
console.log(Array.from(districts).sort().join(', '));

console.log('\nCategories covered (' + categories.size + '):');
console.log(Array.from(categories).sort().join(', '));

console.log('\nTotal sub-attractions:', totalAttractions);
console.log('Total gallery photographs:', totalGalleryImages);
console.log('Unique gallery photograph URLs:', imageUrls.size);
console.log('Cross-destination duplicate image URLs:', duplicateImages.length);

if (duplicateImages.length > 0) {
  console.warn('Cross-destination duplicates detected:');
  console.log(duplicateImages);
}

const KARNATAKA_31_DISTRICTS = [
  'Bagalkote', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
  'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga',
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan',
  'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal',
  'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga',
  'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Vijayapura', 'Yadgir'
];

const missingDistricts = KARNATAKA_31_DISTRICTS.filter((d) => !districts.has(d));
console.log('\nMissing districts from all 31:', missingDistricts.length === 0 ? 'NONE! ALL 31 DISTRICTS COVERED! ✓' : missingDistricts);

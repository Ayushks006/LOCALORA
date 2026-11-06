import fs from 'fs';

const raw = fs.readFileSync('all_125_enriched_destinations.json', 'utf8');
const data = JSON.parse(raw);

console.log('Total in JSON:', data.length);
let badCount = 0;
for (const d of data) {
  if (d.primary_image && (d.primary_image.includes('.svg') || d.primary_image.includes('Question_book') || d.primary_image.includes('Red_pog'))) {
    badCount++;
    console.log(`Bad primary in JSON: [${d.slug}] ${d.name} -> ${d.primary_image}`);
  }
}
console.log('Total bad primary images in all_125_enriched_destinations.json:', badCount);

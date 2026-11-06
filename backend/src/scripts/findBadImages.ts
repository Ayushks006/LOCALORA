import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const dbPath = path.resolve('backend/data/localora.sqlite');
const db = new DatabaseSync(dbPath);

const destinations = db.prepare('SELECT id, name, slug, district, primary_image FROM destinations').all() as any[];
const images = db.prepare('SELECT id, destination_id, url, caption FROM destination_images').all() as any[];

console.log('--- Checking Primary Images ---');
for (const d of destinations) {
  if (d.primary_image.includes('.svg') || d.primary_image.includes('Question_book') || d.primary_image.includes('tableau') || d.primary_image.includes('FIRMAN')) {
    console.log(`Primary Image Issue: [${d.id}] ${d.name} (${d.district}) -> ${d.primary_image}`);
  }
}

console.log('--- Checking Gallery Images ---');
let badGalleryCount = 0;
for (const img of images) {
  if (img.url.includes('.svg') || img.url.includes('Question_book') || img.url.includes('tableau') || img.url.includes('FIRMAN')) {
    badGalleryCount++;
    console.log(`Gallery Image Issue: [Dest #${img.destination_id}] -> ${img.url}`);
  }
}
console.log('Total bad gallery images found:', badGalleryCount);

import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const dbPath = path.resolve('backend/data/localora.sqlite');
const db = new DatabaseSync(dbPath);

const destinations = db.prepare('SELECT id, name, slug, district, primary_image FROM destinations').all() as any[];

console.log('Total destinations in DB:', destinations.length);

const placeholderImages: any[] = [];
for (const d of destinations) {
  if (!d.primary_image || d.primary_image.includes('placeholder') || d.primary_image.includes('svg') || d.primary_image.includes('wiki') || !d.primary_image.startsWith('http')) {
    placeholderImages.push(d);
  }
}

console.log('Special/Wikimedia/non-standard primary images:', placeholderImages.length);
for (const p of placeholderImages.slice(0, 20)) {
  console.log(`  [${p.id}] ${p.name} (${p.district}): ${p.primary_image}`);
}

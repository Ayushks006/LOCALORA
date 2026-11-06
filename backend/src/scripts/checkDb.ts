import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'backend/data/localora.sqlite');
const db = new DatabaseSync(dbPath);

const tables = ['destinations', 'destination_attractions', 'destination_images', 'guide_profiles', 'homestays', 'users'];
for (const t of tables) {
  const row = db.prepare(`SELECT COUNT(*) as count FROM ${t}`).get() as { count: number };
  console.log(`${t}: ${row.count}`);
}

const districts = db.prepare('SELECT COUNT(DISTINCT district) as count FROM destinations').get() as { count: number };
console.log(`distinct districts in destinations: ${districts.count}`);

const sampleDists = db.prepare('SELECT DISTINCT district FROM destinations ORDER BY district ASC').all() as { district: string }[];
console.log('Districts sample:', sampleDists.map(d => d.district).join(', '));

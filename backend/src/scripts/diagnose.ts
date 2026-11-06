import path from 'path';
import fs from 'fs';
import { getDatabase, dbAll, dbGet } from '../database/index.js';
import { config } from '../config/index.js';

console.log('=== LOCALORA DIAGNOSTIC AUDIT ===');
console.log('Current working directory:', process.cwd());
console.log('Config databasePath:', config.databasePath);
console.log('Database file exists:', fs.existsSync(config.databasePath));

const db = getDatabase();

const destCount = dbGet<{ c: number }>('SELECT count(*) as c FROM destinations')?.c ?? 0;
const verifiedDestCount = dbGet<{ c: number }>('SELECT count(*) as c FROM destinations WHERE is_verified = 1')?.c ?? 0;
const featuredDestCount = dbGet<{ c: number }>('SELECT count(*) as c FROM destinations WHERE is_featured = 1')?.c ?? 0;
const hiddenGemsCount = dbGet<{ c: number }>('SELECT count(*) as c FROM destinations WHERE is_featured = 0 AND is_verified = 1')?.c ?? 0;
const imagesCount = dbGet<{ c: number }>('SELECT count(*) as c FROM destination_images')?.c ?? 0;
const categoriesCount = dbGet<{ c: number }>('SELECT count(*) as c FROM categories')?.c ?? 0;
const regionsCount = dbGet<{ c: number }>('SELECT count(*) as c FROM regions')?.c ?? 0;
const guidesCount = dbGet<{ c: number }>('SELECT count(*) as c FROM guide_profiles')?.c ?? 0;
const homestaysCount = dbGet<{ c: number }>('SELECT count(*) as c FROM homestays')?.c ?? 0;
const communitySubsCount = dbGet<{ c: number }>('SELECT count(*) as c FROM community_submissions')?.c ?? 0;

console.log('\nEntity counts in config database:');
console.log('- Total destinations:', destCount);
console.log('- Verified destinations (is_verified = 1):', verifiedDestCount);
console.log('- Featured destinations (is_featured = 1):', featuredDestCount);
console.log('- Hidden gems (is_featured = 0 & verified):', hiddenGemsCount);
console.log('- Destination images:', imagesCount);
console.log('- Categories:', categoriesCount);
console.log('- Regions:', regionsCount);
console.log('- Guides:', guidesCount);
console.log('- Homestays:', homestaysCount);
console.log('- Community submissions:', communitySubsCount);

// Test the actual query used by GET /api/destinations
const defaultQuery = `
  SELECT d.*, c.name as category_name, r.name as region_name
  FROM destinations d
  JOIN categories c ON d.category_slug = c.slug
  JOIN regions r ON d.region_code = r.code
  WHERE d.is_verified = 1 AND d.region_code = ?
`;
const destinationsKA = dbAll(defaultQuery, ['KA']);
console.log('\nResults of default GET /api/destinations (region=KA):', destinationsKA.length);

// Check if any categories or region joins are failing
const rawDestinations = dbAll('SELECT id, name, slug, region_code, category_slug, is_verified, is_featured FROM destinations');
console.log('\nFirst 5 raw destinations:');
console.log(rawDestinations.slice(0, 5));

async function main() {
  const rootDbPath = path.resolve(process.cwd(), '../data/localora.sqlite');
  console.log('\nRoot database exists at', rootDbPath, ':', fs.existsSync(rootDbPath));
  if (fs.existsSync(rootDbPath)) {
    try {
      const { DatabaseSync } = await import('node:sqlite');
      const rdb = new DatabaseSync(rootDbPath);
      const rDest = rdb.prepare('SELECT count(*) as c FROM destinations').get() as any;
      console.log('Root DB destinations count:', rDest?.c);
    } catch (err: any) {
      console.log('Root DB read error:', err.message);
    }
  }
}

main().catch(console.error);

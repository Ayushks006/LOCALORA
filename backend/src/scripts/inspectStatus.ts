import { getDatabase } from '../database/index.js';

const db = getDatabase();

console.log('=== DESTINATIONS IN DATABASE ===');
const dests = db.prepare('SELECT id, slug, name, primary_image, district FROM destinations ORDER BY id ASC').all() as any[];
console.log(`Total destinations: ${dests.length}`);

console.log('\n=== DESTINATION IMAGES IN DATABASE ===');
const imgStats = db.prepare(`
  SELECT d.id, d.name, d.slug, count(di.id) as gallery_count
  FROM destinations d
  LEFT JOIN destination_images di ON d.id = di.destination_id
  GROUP BY d.id
  ORDER BY d.id ASC
`).all() as any[];

for (const stat of imgStats) {
  console.log(`[${stat.id}] ${stat.name} (${stat.slug}): ${stat.gallery_count} gallery photos`);
}

const dupUrls = db.prepare(`
  SELECT url, count(*) as c, group_concat(d.name, ', ') as dests
  FROM destination_images di
  JOIN destinations d ON di.destination_id = d.id
  GROUP BY url
  HAVING count(*) > 1
`).all() as any[];
console.log(`\nDuplicate gallery URLs across destinations: ${dupUrls.length}`);
if (dupUrls.length > 0) {
  console.log(dupUrls);
}

const dupPrimary = db.prepare(`
  SELECT primary_image, count(*) as c, group_concat(name, ', ') as dests
  FROM destinations
  GROUP BY primary_image
  HAVING count(*) > 1
`).all() as any[];
console.log(`Duplicate primary_image URLs across destinations: ${dupPrimary.length}`);
if (dupPrimary.length > 0) {
  console.log(dupPrimary);
}

console.log('\n=== USERS IN DATABASE ===');
const users = db.prepare('SELECT id, email, full_name, role, is_active FROM users').all() as any[];
console.log(`Total users: ${users.length}`);
for (const u of users) {
  console.log(`User #${u.id}: ${u.email} (${u.role}) - ${u.full_name}`);
}

console.log('\n=== BOOKINGS, HOMESTAYS, GUIDES STATS ===');
const counts = {
  bookings: (db.prepare('SELECT count(*) as c FROM bookings').get() as any).c,
  homestays: (db.prepare('SELECT count(*) as c FROM homestays').get() as any).c,
  guides: (db.prepare('SELECT count(*) as c FROM guide_profiles').get() as any).c,
  reviews: (db.prepare('SELECT count(*) as c FROM reviews').get() as any).c,
  saved_destinations: (db.prepare('SELECT count(*) as c FROM saved_destinations').get() as any).c,
  itineraries: (db.prepare('SELECT count(*) as c FROM itineraries').get() as any).c,
};
console.log(counts);

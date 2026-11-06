import { getDatabase } from '../database/index.js';
import { karnatakaDestinations } from '../seed/destinationData.js';

console.log('====================================================');
console.log('PART A: 33 DESTINATIONS AUDIT FROM DESTINATIONDATA.TS');
console.log('====================================================');

console.log(`Total seed destinations: ${karnatakaDestinations.length}`);

const primaryImages = karnatakaDestinations.map((d) => d.primary_image);
const uniquePrimary = new Set(primaryImages);
console.log(`Unique cover photographs: ${uniquePrimary.size} / ${karnatakaDestinations.length}`);

let totalGalleryImages = 0;
const allGalleryUrls: string[] = [];
const allAttractionUrls: string[] = [];

karnatakaDestinations.forEach((d, idx) => {
  totalGalleryImages += d.images.length;
  d.images.forEach((img) => allGalleryUrls.push(img.url));
  d.attractions.forEach((a) => allAttractionUrls.push(a.image_url));

  console.log(`\n#${idx + 1}: ${d.name} (${d.district})`);
  console.log(`  Cover: ${d.primary_image}`);
  console.log(`  Gallery photos count: ${d.images.length}`);
  console.log(`  Attractions count: ${d.attractions.length}`);
  d.images.forEach((img, i) => {
    console.log(`    [Photo ${i + 1}] ${img.caption} | By: ${img.attribution} | License: ${img.license}`);
  });
});

console.log(`\nTotal gallery images across all 33 destinations: ${totalGalleryImages}`);
console.log(`Unique gallery image URLs: ${new Set(allGalleryUrls).size} / ${totalGalleryImages}`);

// Check for cross-destination gallery duplicates
const galleryCounts: Record<string, string[]> = {};
karnatakaDestinations.forEach((d) => {
  d.images.forEach((img) => {
    if (!galleryCounts[img.url]) galleryCounts[img.url] = [];
    galleryCounts[img.url].push(d.name);
  });
});

const crossDups = Object.entries(galleryCounts).filter(([_, dests]) => dests.length > 1);
console.log(`Cross-destination gallery duplicates: ${crossDups.length}`);
if (crossDups.length > 0) {
  crossDups.forEach(([url, dests]) => {
    console.log(`  Duplicate URL: ${url} in destinations: ${dests.join(', ')}`);
  });
}

console.log('\n====================================================');
console.log('PART B: DATABASE USER AUDIT');
console.log('====================================================');
const db = getDatabase();
const users = db.prepare('SELECT id, email, full_name, role, is_active FROM users ORDER BY id ASC').all() as any[];
console.log(`Total users in database: ${users.length}`);
users.forEach((u) => {
  console.log(`User ID ${u.id}: ${u.email} | Role: ${u.role} | Name: ${u.full_name}`);
});

const homestays = db.prepare('SELECT id, owner_id, title FROM homestays').all() as any[];
console.log(`Homestays count: ${homestays.length}`);
homestays.forEach((h) => console.log(`  Stay #${h.id}: "${h.title}" (Owner ID: ${h.owner_id})`));

const guides = db.prepare('SELECT id, user_id, service_area FROM guide_profiles').all() as any[];
console.log(`Guides count: ${guides.length}`);
guides.forEach((g) => console.log(`  Guide #${g.id}: ${g.service_area} (User ID: ${g.user_id})`));

const bookings = db.prepare('SELECT id, user_id, booking_type, total_amount, status FROM bookings').all() as any[];
console.log(`Bookings count: ${bookings.length}`);
bookings.forEach((b) => console.log(`  Booking #${b.id}: Type ${b.booking_type}, User ID: ${b.user_id}, Amount: ₹${b.total_amount}, Status: ${b.status}`));

const reviews = db.prepare('SELECT id, user_id, target_type, target_id, rating FROM reviews').all() as any[];
console.log(`Reviews count: ${reviews.length}`);

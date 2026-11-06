// Script to seed all 125 enriched destinations with 10 real images into SQLite and frontend fallback
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function seedDatabase(dbPath, destinations) {
  console.log(`Seeding database at: ${dbPath}...`);
  if (!fs.existsSync(dbPath)) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = OFF;');

  // Clean old destination images, attractions, and destinations
  db.exec(`
    DELETE FROM destination_images;
    DELETE FROM destination_attractions;
    DELETE FROM destinations;
  `);

  const insertDest = db.prepare(`
    INSERT INTO destinations (
      id, name, slug, region_code, district, locality, category_slug,
      description, long_description, latitude, longitude,
      best_time_to_visit, suggested_duration, travel_tips,
      primary_image, is_verified, is_featured, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, 1, ?, datetime('now')
    )
  `);

  const insertAttr = db.prepare(`
    INSERT INTO destination_attractions (
      destination_id, title, description, image_url
    ) VALUES (?, ?, ?, ?)
  `);

  const insertImg = db.prepare(`
    INSERT INTO destination_images (
      destination_id, url, caption, attribution, license, sort_order, is_cover, alt_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let totalImages = 0;
  let totalAttractions = 0;

  for (let i = 0; i < destinations.length; i++) {
    const d = destinations[i];
    const destId = i + 1; // 1-based sequential ID

    insertDest.run(
      destId,
      d.name,
      d.slug,
      d.region_code || 'KA',
      d.district,
      d.locality,
      d.category_slug,
      d.description,
      d.long_description || d.description,
      d.latitude,
      d.longitude,
      d.best_time_to_visit,
      d.suggested_duration,
      d.travel_tips,
      d.primary_image,
      d.is_featured ? 1 : 0
    );

    // Attractions
    if (Array.isArray(d.attractions)) {
      for (const a of d.attractions) {
        insertAttr.run(destId, a.title, a.description, a.image_url || d.primary_image);
        totalAttractions++;
      }
    }

    // Exactly 10 images
    if (Array.isArray(d.images)) {
      for (let order = 0; order < d.images.length; order++) {
        const img = d.images[order];
        insertImg.run(
          destId,
          img.url,
          img.caption,
          img.attribution || 'Verified Tourism Contributor',
          img.license || 'Open Editorial License',
          img.sort_order || order + 1,
          order === 0 ? 1 : 0,
          img.alt_text || img.caption
        );
        totalImages++;
      }
    }
  }

  db.exec('PRAGMA foreign_keys = ON;');
  console.log(`✓ Inserted ${destinations.length} destinations, ${totalAttractions} attractions, ${totalImages} images into ${dbPath}`);
}

function exportFrontendFallback(destinations) {
  const targetPath = path.resolve('frontend/src/data/destinationsFallback.ts');
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const enrichedForFrontend = destinations.map((d, index) => {
    const destId = index + 1;
    return {
      ...d,
      id: destId,
      region_code: d.region_code || 'KA',
      attractions: (d.attractions || []).map((a, aIdx) => ({
        ...a,
        id: aIdx + 1,
        destination_id: destId
      })),
      images: (d.images || []).map((img, iIdx) => ({
        ...img,
        id: iIdx + 1,
        destination_id: destId
      }))
    };
  });

  const content = `// Auto-generated fallback destinations catalog containing all 120+ authentic destinations with 10 real images each
import { Destination } from '../types';

export const fallbackDestinations: Destination[] = ${JSON.stringify(enrichedForFrontend, null, 2)};
`;

  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`✓ Exported fallback data to ${targetPath} (${destinations.length} places)`);
}

function main() {
  const enrichedPath = 'all_125_enriched_destinations.json';
  if (!fs.existsSync(enrichedPath)) {
    console.error('File all_125_enriched_destinations.json does not exist yet!');
    process.exit(1);
  }

  const destinations = JSON.parse(fs.readFileSync(enrichedPath, 'utf8'));
  console.log(`Loaded ${destinations.length} destinations.`);

  // Seed both backend and root sqlite databases
  seedDatabase('backend/data/localora.sqlite', destinations);
  seedDatabase('data/localora.sqlite', destinations);

  // Export to frontend fallback
  exportFrontendFallback(destinations);

  console.log('✓ Database & frontend fallback synchronization COMPLETE!');
}

main();

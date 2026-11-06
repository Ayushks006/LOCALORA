import { getDatabase, dbAll } from '../database/index.js';

const rows = dbAll<{ id: number; name: string; slug: string; img_count: number }>(
  'SELECT d.id, d.name, d.slug, count(di.id) as img_count FROM destinations d LEFT JOIN destination_images di ON d.id = di.destination_id GROUP BY d.id HAVING img_count < 3'
);

console.log('Destinations with < 3 gallery images in database:', rows);

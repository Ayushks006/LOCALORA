import { getDatabase } from '../database/index.js';

const db = getDatabase();

const destCount = db.prepare('SELECT count(*) as cnt FROM destinations').get() as { cnt: number };
const localCovers = db.prepare("SELECT count(*) as cnt FROM destinations WHERE primary_image LIKE '/images/destinations/%'").get() as { cnt: number };
const totalGallery = db.prepare('SELECT count(*) as cnt FROM destination_images').get() as { cnt: number };
const localGallery = db.prepare("SELECT count(*) as cnt FROM destination_images WHERE url LIKE '/images/destinations/%'").get() as { cnt: number };
const homestays = db.prepare('SELECT title, slug, primary_image FROM homestays').all();

console.log('Destinations in DB:', destCount.cnt);
console.log('Local destination covers:', localCovers.cnt);
console.log('Total gallery rows in DB:', totalGallery.cnt);
console.log('Local gallery rows in DB:', localGallery.cnt);
console.log('Homestays in DB:');
console.log(homestays);

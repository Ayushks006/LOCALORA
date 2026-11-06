import { dbGet } from '../database/index.js';

const dest = dbGet('SELECT * FROM destinations WHERE slug = ?', ['dodda-aalada-mara-big-banyan-tree']);
console.log('Destination 1431:', dest);

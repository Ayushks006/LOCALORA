import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'backend', 'src', 'seed', 'data');
const files = fs.readdirSync(dataDir);
for (const f of files) {
  const content = fs.readFileSync(path.join(dataDir, f), 'utf8');
  if (content.includes('dodda-aalada-mara')) {
    console.log(`Found dodda-aalada-mara in ${f}`);
  }
}

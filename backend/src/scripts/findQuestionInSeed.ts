import fs from 'fs';
import path from 'path';

const files = [
  'backend/src/seed/destinationData.ts',
  ...fs.readdirSync('backend/src/seed/data').map(f => path.join('backend/src/seed/data', f))
];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.match(/(question|placeholder|book|icon|default|\.svg|missing)/i)) {
      if (!line.includes('booking') && !line.includes('suggested_duration') && !line.includes('Facebook')) {
        console.log(`${file}:${i+1}: ${line.trim()}`);
      }
    }
  });
}

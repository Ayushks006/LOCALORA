import fs from 'fs';
import path from 'path';

function searchInDir(dir: string, regex: RegExp) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist') {
        searchInDir(full, regex);
      }
    } else if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.css') || f.endsWith('.svg') || f.endsWith('.json')) {
      const content = fs.readFileSync(full, 'utf8');
      const matches = content.match(regex);
      if (matches) {
        console.log(`Match in ${full}:`, matches.slice(0, 3));
      }
    }
  }
}

console.log('Searching for placeholder/question/book...');
searchInDir('frontend/src', /(placeholder|question|book|fallback|default.*image|avatar)/i);
searchInDir('backend/src', /(placeholder|question|book|fallback|default.*image|avatar)/i);

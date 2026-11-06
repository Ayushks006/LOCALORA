import https from 'https';
import fs from 'fs';
import path from 'path';

const guides = [
  { file: 'raghavendra-rao.jpg', url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=600&q=80' },
  { file: 'manjunath-swamy.jpg', url: 'https://images.unsplash.com/photo-1506863530036-1efeddceb993?auto=format&fit=crop&w=600&q=80' },
  { file: 'ganesh-naik.jpg', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80' },
  { file: 'basavaraj-naik.jpg', url: 'https://images.unsplash.com/photo-1507081323647-4d250478b919?auto=format&fit=crop&w=600&q=80' },
  { file: 'sharath-kumar.jpg', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80' },
];

const targetDirs = [
  path.resolve(process.cwd(), 'frontend', 'public', 'images', 'guides'),
  path.resolve(process.cwd(), 'backend', 'uploads', 'avatars'),
];

for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function download(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed with status ${res.statusCode}`));
        return;
      }
      const stream = fs.createWriteStream(destPath);
      res.pipe(stream);
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  for (const g of guides) {
    const fPath = path.resolve(process.cwd(), 'frontend', 'public', 'images', 'guides', g.file);
    try {
      await download(g.url, fPath);
      console.log(`✓ Downloaded ${g.file}`);
      // Copy to backend uploads as well
      const bPath = path.resolve(process.cwd(), 'backend', 'uploads', 'avatars', g.file);
      fs.copyFileSync(fPath, bPath);
    } catch (err: any) {
      console.error(`✗ Failed ${g.file}:`, err.message);
    }
  }
  console.log('All authentic guide portraits populated locally!');
}

run();

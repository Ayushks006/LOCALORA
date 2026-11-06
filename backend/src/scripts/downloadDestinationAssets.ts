import fs from 'fs';
import path from 'path';
import https from 'https';

const keyDestinations = [
  {
    slug: 'hampi',
    images: [
      { name: 'cover.jpg', url: 'https://images.unsplash.com/photo-1600100397608-f010f4439c2c?auto=format&fit=crop&w=1200&q=80' },
      { name: 'gallery-1.jpg', url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80' },
      { name: 'gallery-2.jpg', url: 'https://images.unsplash.com/photo-1620766182966-c6eb5ed2b788?auto=format&fit=crop&w=1200&q=80' },
      { name: 'gallery-3.jpg', url: 'https://images.unsplash.com/photo-1670165184224-85d9145f614f?auto=format&fit=crop&w=1200&q=80' }
    ]
  },
  {
    slug: 'mysuru-palace',
    images: [
      { name: 'cover.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Mysore_Palace_Morning.jpg' },
      { name: 'gallery-1.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Mysore_Palace_Illuminated.jpg' },
      { name: 'gallery-2.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Mysore_Palace_Durbar_Hall.jpg' },
      { name: 'gallery-3.jpg', url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80' }
    ]
  },
  {
    slug: 'badami',
    images: [
      { name: 'cover.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Badami_cave_temples_view.jpg' },
      { name: 'gallery-1.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Badami_Cave_1_Nataraja.jpg' },
      { name: 'gallery-2.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Bhoothanatha_group_of_temples.jpg' },
      { name: 'gallery-3.jpg', url: 'https://images.unsplash.com/photo-1600100397608-f010f4439c2c?auto=format&fit=crop&w=1200&q=80' }
    ]
  },
  {
    slug: 'belur',
    images: [
      { name: 'cover.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Chennakeshava_Temple_Belur.jpg' },
      { name: 'gallery-1.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Belur_bracket_figure.jpg' },
      { name: 'gallery-2.jpg', url: 'https://images.unsplash.com/photo-1600100397608-f010f4439c2c?auto=format&fit=crop&w=1200&q=80' },
      { name: 'gallery-3.jpg', url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80' }
    ]
  },
  {
    slug: 'jog-falls',
    images: [
      { name: 'cover.jpg', url: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=1200&q=80' },
      { name: 'gallery-1.jpg', url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80' },
      { name: 'gallery-2.jpg', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80' },
      { name: 'gallery-3.jpg', url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80' }
    ]
  },
  {
    slug: 'coorg',
    images: [
      { name: 'cover.jpg', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80' },
      { name: 'gallery-1.jpg', url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80' },
      { name: 'gallery-2.jpg', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80' },
      { name: 'gallery-3.jpg', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80' }
    ]
  },
  {
    slug: 'gokarna',
    images: [
      { name: 'cover.jpg', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' },
      { name: 'gallery-1.jpg', url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80' },
      { name: 'gallery-2.jpg', url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80' },
      { name: 'gallery-3.jpg', url: 'https://images.unsplash.com/photo-1600100397608-f010f4439c2c?auto=format&fit=crop&w=1200&q=80' }
    ]
  }
];

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Status ${res.statusCode}`));
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
  const baseDir = path.resolve(process.cwd(), 'frontend', 'public', 'images', 'destinations');
  for (const item of keyDestinations) {
    const destFolder = path.join(baseDir, item.slug);
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }
    for (const img of item.images) {
      const targetFile = path.join(destFolder, img.name);
      try {
        await downloadFile(img.url, targetFile);
        console.log(`✓ [${item.slug}] saved ${img.name}`);
      } catch (err: any) {
        console.warn(`! [${item.slug}] failed ${img.name}: ${err.message}`);
      }
    }
  }
  console.log('Finished saving local destination photography!');
}

run();

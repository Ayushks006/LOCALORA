import https from 'https';
import http from 'http';

function checkUrl(url: string): Promise<{ status?: number; error?: string; contentType?: string }> {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 }, (res) => {
        resolve({ status: res.statusCode, contentType: res.headers['content-type'] });
        res.resume();
      });
      req.on('error', (err) => resolve({ error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
    } catch (e: any) {
      resolve({ error: e.message });
    }
  });
}

async function run() {
  const testUrls = [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/15th-16th_century_ruins_of_market_and_Vaishnavism_Achyutaraya_Tiruvengalanatha_temple%2C_Hampi_Hindu_monuments_Karnataka_3.jpg/1280px-15th-16th_century_ruins_of_market_and_Vaishnavism_Achyutaraya_Tiruvengalanatha_temple%2C_Hampi_Hindu_monuments_Karnataka_3.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'https://upload.wikimedia.org/wikipedia/commons/d/d7/4_Erotic_statues_of_Hindu_Virupaksha_Shiva_Temple_Hampi%2C_Vijayanagar_Karnataka_India.jpg',
    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80'
  ];

  for (const u of testUrls) {
    const res = await checkUrl(u);
    console.log(`URL: ${u.substring(0, 70)}...`);
    console.log(`  Result:`, res);
  }
}

run();

import fs from 'fs';
import path from 'path';

const fallbackPath = path.resolve(process.cwd(), 'frontend', 'src', 'data', 'destinationsFallback.ts');
const content = fs.readFileSync(fallbackPath, 'utf8');

const svgMatches = content.match(/https?:\/\/[^"'\s]+\.svg[^"'\s]*/g) || [];
const questionMatches = content.match(/Question_book/g) || [];
const redPogMatches = content.match(/Red_pog/g) || [];

console.log('SVG matches in frontend fallback:', svgMatches.length);
console.log('Question_book matches in frontend fallback:', questionMatches.length);
console.log('Red_pog matches in frontend fallback:', redPogMatches.length);
if (svgMatches.length > 0) {
  console.log('Sample SVG matches:', svgMatches.slice(0, 5));
}

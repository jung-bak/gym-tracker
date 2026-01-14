import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const indexHtml = path.join(distDir, 'index.html');
const notFoundHtml = path.join(distDir, '404.html');

try {
  fs.copyFileSync(indexHtml, notFoundHtml);
  console.log('Successfully copied index.html to 404.html');
} catch (err) {
  console.error('Error copying file:', err);
  process.exit(1);
}

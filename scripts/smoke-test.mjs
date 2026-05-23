import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'src', 'generated', 'photoManifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const errors = [];
if (!manifest || typeof manifest !== 'object') errors.push('manifest must be an object');
if (!Array.isArray(manifest.series) || manifest.series.length === 0) errors.push('manifest.series must contain at least one series');
if (!Number.isInteger(manifest.totalPhotos) || manifest.totalPhotos <= 0) errors.push('manifest.totalPhotos must be positive');
const seenSeriesSlugs = new Set();
const seenPhotoIds = new Set();
for (const series of manifest.series || []) {
  if (!series.slug) errors.push(`series without slug: ${series.title}`);
  if (seenSeriesSlugs.has(series.slug)) errors.push(`duplicate series slug: ${series.slug}`);
  seenSeriesSlugs.add(series.slug);
  if (!series.title) errors.push(`series without title: ${series.slug}`);
  if (!series.description) errors.push(`series without description: ${series.slug}`);
  if (!Array.isArray(series.photos) || series.photos.length === 0) errors.push(`series has no photos: ${series.slug}`);
  if (series.photoCount !== series.photos.length) errors.push(`photoCount mismatch for series: ${series.slug}`);
  for (const photo of series.photos || []) {
    if (!photo.id) errors.push(`photo without id in series: ${series.slug}`);
    if (seenPhotoIds.has(photo.id)) errors.push(`duplicate photo id: ${photo.id}`);
    seenPhotoIds.add(photo.id);
    if (!photo.title) errors.push(`photo without title: ${photo.id}`);
    if (!photo.description) errors.push(`photo without description: ${photo.id}`);
    if (!photo.publicPath) errors.push(`photo without publicPath: ${photo.id}`);
    if (photo.publicPath && !fs.existsSync(path.join(root, 'public', photo.publicPath))) errors.push(`public photo file not found: ${photo.publicPath}`);
  }
}
if (seenPhotoIds.size !== manifest.totalPhotos) errors.push('totalPhotos mismatch');
if (errors.length) { console.error('Smoke-test failed:'); for (const error of errors) console.error(`- ${error}`); process.exit(1); }
console.log(`Smoke-test passed: ${manifest.series.length} series, ${manifest.totalPhotos} photos.`);
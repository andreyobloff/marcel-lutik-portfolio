import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const photoDirName = 'photo';
const photoRoot = path.join(root, photoDirName);
const publicPhotoRoot = path.join(root, 'public', 'photo');
const generatedDir = path.join(root, 'src', 'generated');
const manifestPath = path.join(generatedDir, 'photoManifest.json');
const contentDir = path.join(root, 'content');
const seriesDescriptionsPath = path.join(contentDir, 'series-descriptions.json');
const photoDescriptionsPath = path.join(contentDir, 'photo-descriptions.json');
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);
const animatedExtensions = new Set(['.gif']);

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function readJsonSafe(filePath, fallback) { try { return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : fallback; } catch (error) { throw new Error(`Cannot parse JSON: ${filePath}\n${error.message}`); } }
function writeJson(filePath, value) { ensureDir(path.dirname(filePath)); fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
function slugify(value) { const normalized = value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 80); return normalized || crypto.createHash('sha1').update(value).digest('hex').slice(0, 10); }
function toPosix(value) { return value.split(path.sep).join('/'); }
function naturalSort(a, b) { return a.localeCompare(b, 'ru', { numeric: true, sensitivity: 'base' }); }
function walkFiles(dir) { if (!fs.existsSync(dir)) return []; const entries = fs.readdirSync(dir, { withFileTypes: true }); const result = []; for (const entry of entries) { const fullPath = path.join(dir, entry.name); if (entry.isDirectory()) result.push(...walkFiles(fullPath)); if (entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase())) result.push(fullPath); } return result.sort((a, b) => naturalSort(a, b)); }
function getUniqueTargetPath(targetDir, desiredName, usedTargets) { const ext = path.extname(desiredName); const base = path.basename(desiredName, ext); let candidate = desiredName; let index = 2; while (usedTargets.has(path.join(targetDir, candidate))) { candidate = `${base}-${index}${ext}`; index += 1; } const fullPath = path.join(targetDir, candidate); usedTargets.add(fullPath); return fullPath; }
async function optimizeImage(sourceFile, targetFile) { ensureDir(path.dirname(targetFile)); const ext = path.extname(sourceFile).toLowerCase(); if (animatedExtensions.has(ext)) { fs.copyFileSync(sourceFile, targetFile); return; } await sharp(sourceFile).rotate().resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(targetFile); }

if (!fs.existsSync(photoRoot)) throw new Error(`Photo folder not found: ${photoRoot}`);

const seriesDirs = fs.readdirSync(photoRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort(naturalSort);
if (seriesDirs.length === 0) throw new Error(`No series directories found in: ${photoRoot}`);

ensureDir(contentDir);
fs.rmSync(publicPhotoRoot, { recursive: true, force: true });
ensureDir(publicPhotoRoot);
ensureDir(generatedDir);

const existingSeriesDescriptions = readJsonSafe(seriesDescriptionsPath, {});
const existingPhotoDescriptions = readJsonSafe(photoDescriptionsPath, {});
const nextSeriesDescriptions = { ...existingSeriesDescriptions };
const usedSlugs = new Map();
const usedOutputTargets = new Set();
const series = [];
let totalPhotos = 0;
let heroPhoto = null;
let createdSeriesDescriptionTemplate = false;

for (const seriesName of seriesDirs) {
  const seriesRoot = path.join(photoRoot, seriesName);
  const files = walkFiles(seriesRoot);
  if (files.length === 0) continue;

  if (!nextSeriesDescriptions[seriesName]) {
    nextSeriesDescriptions[seriesName] = `Серия «${seriesName}». Основное описание можно изменить в content/series-descriptions.json.`;
    createdSeriesDescriptionTemplate = true;
  }

  const rawSlug = slugify(seriesName);
  const count = usedSlugs.get(rawSlug) || 0;
  usedSlugs.set(rawSlug, count + 1);
  const seriesSlug = count === 0 ? rawSlug : `${rawSlug}-${count + 1}`;
  const photos = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const relativeFromPhoto = toPosix(path.relative(photoRoot, file));
    const relativeFromSeries = toPosix(path.relative(seriesRoot, file));
    const fileName = path.basename(file);
    const sourceExt = path.extname(fileName).toLowerCase();
    const sourceBaseName = path.basename(fileName, sourceExt);
    const number = String(index + 1).padStart(2, '0');
    const id = `${seriesSlug}-${number}`;
    const photoDescriptionKey = `${seriesName}/${relativeFromSeries}`;
    const targetSeriesDir = path.join(publicPhotoRoot, seriesName);
    const targetFileName = animatedExtensions.has(sourceExt) ? fileName : `${sourceBaseName}.webp`;
    const targetFile = getUniqueTargetPath(targetSeriesDir, targetFileName, usedOutputTargets);
    await optimizeImage(file, targetFile);
    const relativePublicPath = toPosix(path.relative(path.join(root, 'public'), targetFile));

    photos.push({
      id,
      title: `${seriesName} — ${number}`,
      description: existingPhotoDescriptions[photoDescriptionKey] || `Фотография из серии «${seriesName}». Номер ${number}. Описание можно переопределить в content/photo-descriptions.json по ключу «${photoDescriptionKey}».`,
      fileName,
      sourcePath: `${photoDirName}/${relativeFromPhoto}`,
      publicPath: relativePublicPath,
    });
  }

  const item = { slug: seriesSlug, title: seriesName, description: nextSeriesDescriptions[seriesName], sourceFolder: `${photoDirName}/${seriesName}`, photoCount: photos.length, coverPhoto: photos[0], photos };
  if (!heroPhoto) heroPhoto = photos[0];
  totalPhotos += photos.length;
  series.push(item);
}

if (series.length === 0 || totalPhotos === 0) throw new Error(`No supported images found. Supported extensions: ${Array.from(supportedExtensions).join(', ')}`);
if (!fs.existsSync(seriesDescriptionsPath) || createdSeriesDescriptionTemplate) writeJson(seriesDescriptionsPath, nextSeriesDescriptions);
if (!fs.existsSync(photoDescriptionsPath)) writeJson(photoDescriptionsPath, { '_example': 'Ключ должен выглядеть так: Derealisation/file-name.jpg. Значение станет описанием конкретного фото.' });

writeJson(manifestPath, { generatedAt: new Date().toISOString(), sourceFolder: photoDirName, totalSeries: series.length, totalPhotos, heroPhoto, series });
console.log(`Generated optimized photo manifest: ${series.length} series, ${totalPhotos} photos.`);
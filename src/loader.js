import { readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREATIONS_DIR = resolve(__dirname, '..', 'creations');
const DATE_PATTERN = /^(\d{4}-\d{2}-\d{2})-(.+)\.js$/;

function getCreationFiles() {
  try {
    return readdirSync(CREATIONS_DIR)
      .filter(f => DATE_PATTERN.test(f))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

function todayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function tryLoadCreation(filename) {
  const fullPath = resolve(CREATIONS_DIR, filename);
  const fileUrl = pathToFileURL(fullPath).href;
  try {
    const mod = await import(fileUrl);
    if (typeof mod.render !== 'function') return null;
    return {
      title: mod.title || 'Untitled',
      description: mod.description || '',
      fps: typeof mod.fps === 'number' ? mod.fps : 0,
      render: mod.render,
      update: typeof mod.update === 'function' ? mod.update : null,
      setup: typeof mod.setup === 'function' ? mod.setup : null,
      teardown: typeof mod.teardown === 'function' ? mod.teardown : null,
      filename,
    };
  } catch (err) {
    process.stderr.write(`Failed to load ${filename}: ${err.message}\n`);
    return null;
  }
}

async function pickCreation() {
  const files = getCreationFiles();
  if (files.length === 0) return null;

  const today = todayString();
  const todayFile = files.find(f => f.startsWith(today));

  if (todayFile) {
    const creation = await tryLoadCreation(todayFile);
    if (creation) return creation;
  }

  for (const file of files) {
    const creation = await tryLoadCreation(file);
    if (creation) return creation;
  }

  return null;
}

export async function loadCreation() {
  const creation = await pickCreation();
  if (creation) {
    // Lands in the systemd journal (StandardError=journal) — lets pi/doctor.sh
    // and `journalctl -u morning-view` answer "which art is it showing?"
    process.stderr.write(`Loaded creation: ${creation.filename}\n`);
  }
  return creation;
}

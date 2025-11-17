#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const appDir = path.resolve(process.cwd(), 'app');
const outFile = path.resolve(process.cwd(), 'public', 'search-index.json');

function walk(dir) {
  const entries = [];
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) {
      entries.push(...walk(full));
    } else if (/page\.(tsx|jsx|mdx?)$/.test(name.name)) {
      entries.push(full);
    }
  }
  return entries;
}

function extract(file) {
  const src = fs.readFileSync(file, 'utf8');
  // try to extract a title from an exported const or H1 comment
  const titleMatch = src.match(/<h1[^>]*>([^<]+)<\/h1>/i) || src.match(/export const title\s*=\s*['"]([^'"]+)['"]/i);
  const title = titleMatch ? titleMatch[1].trim() : path.basename(path.dirname(file));
  // take first text chunk as excerpt
  const text = src.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
  // build href from file path relative to app
  const rel = path.relative(appDir, file);
  const href = '/' + rel.replace(/page\.(tsx|jsx|mdx?)$/, '').replace(/index\/$/, '').replace(/\\/g, '/');
  const keywords = Array.from(new Set((title + ' ' + text).toLowerCase().split(/[^a-z0-9äöüß]+/).filter(Boolean))).slice(0, 20);
  return { label: title, href, keywords };
}

function main() {
  const files = walk(appDir);
  const items = files
    .map(extract)
    .filter((it) => !it.href.startsWith('/admin'))
    .sort((a, b) => a.label.localeCompare(b.label));
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(items, null, 2));
  console.log('Wrote', outFile, 'with', items.length, 'entries');
}

main();

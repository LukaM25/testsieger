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

function toTitle(slug) {
  const normalized = (slug || '').replace(/\/$/, '');
  const clean = normalized.replace(/\[(.+?)\]/g, '$1').split(/[\\/]/).filter(Boolean).pop() || '';
  if (!clean) return 'Home';
  return clean
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeCopy(value) {
  if (!value) return '';
  const translation = value.match(/tr\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\)/i);
  if (translation) {
    return translation[1].trim();
  }
  return value.replace(/[{}]/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractMetadata(src) {
  const metaBlock = src.match(/export const metadata\s*=\s*{([\s\S]*?)}/m);
  const metaBody = metaBlock ? metaBlock[1] : '';
  const title = (metaBody.match(/title\s*:\s*['"`]([^'"`]+)['"`]/) || [])[1];
  const description = (metaBody.match(/description\s*:\s*['"`]([^'"`]+)['"`]/) || [])[1];
  return {
    title: title ? title.trim() : undefined,
    description: description ? description.trim() : undefined,
  };
}

function extractHeadings(src) {
  const normalizeHeading = (raw) => {
    const cleaned = normalizeCopy(raw);
    if (!cleaned) return '';
    const looksLikeCode = /^[a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*$/.test(cleaned);
    return looksLikeCode ? '' : cleaned;
  };

  const matches = [...src.matchAll(/<h([1-6])[^>]*>([^<]+)<\/h\1>/gi)];
  return matches
    .map((m) => normalizeHeading(m[2]))
    .filter(Boolean);
}

function extract(file) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(appDir, file);
  const slugPath = rel.replace(/page\.(tsx|jsx|mdx?)$/, '').replace(/index\/$/, '').replace(/\\/g, '/');
  const href = '/' + slugPath;

  const headings = extractHeadings(src);
  const { title: metaTitle, description: metaDescription } = extractMetadata(src);
  const explicitTitle = (src.match(/export const title\s*=\s*['"`]([^'"`]+)['"`]/i) || [])[1];
  const label = metaTitle || headings[0] || explicitTitle || toTitle(slugPath);

  // Remove obvious code to keep keywords human readable
  const exportIdx = src.indexOf('export default function');
  const searchStart = exportIdx >= 0 ? exportIdx : 0;
  const jsxStart = src.indexOf('<', searchStart);
  const contentPortion = jsxStart >= 0 ? src.slice(jsxStart) : src;
  const withoutImports = contentPortion.replace(/import[\s\S]*?;(\s|$)/g, ' ');
  const withoutMetadata = withoutImports.replace(/export const metadata\s*=\s*{[\s\S]*?};?/g, ' ');

  const textNodes = [...withoutMetadata.matchAll(/>([^<]+)</g)]
    .map((m) => normalizeCopy(m[1]))
    .filter(Boolean)
    .join(' ');
  const textContent = textNodes.replace(/\s+/g, ' ').trim();

  const firstParagraph = (contentPortion.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1];
  const paragraphText = firstParagraph ? normalizeCopy(firstParagraph.replace(/<[^>]+>/g, ' ')) : '';

  const excerptSource = metaDescription || paragraphText || textContent;
  const excerpt = excerptSource.slice(0, 240);

  const keywordSource = [
    label,
    metaDescription,
    headings.join(' '),
    paragraphText,
    textContent,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const keywords = Array.from(
    new Set(
      keywordSource
        .split(/[^a-z0-9äöüß]+/i)
        .filter(Boolean)
    )
  ).slice(0, 40);

  return { label, href, keywords, excerpt };
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

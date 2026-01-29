const fs = require('fs');
const path = require('path');

function exists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const root = process.cwd();
const sourceDist = path.join(root, 'node_modules/@storybook/builder-vite/dist');
const targetDist = path.join(
  root,
  'node_modules/@storybook/nextjs-vite/node_modules/@storybook/builder-vite/dist'
);

const targetPreset = path.join(targetDist, 'preset.js');
const targetChunks = path.join(targetDist, '_node-chunks');

if (exists(targetPreset) && exists(targetChunks)) {
  process.exit(0);
}

if (!exists(sourceDist)) {
  console.warn('storybook builder-vite dist missing; source not found:', sourceDist);
  process.exit(0);
}

fs.mkdirSync(targetDist, { recursive: true });
fs.cpSync(sourceDist, targetDist, { recursive: true });
console.log('synced storybook builder-vite dist to nested package');

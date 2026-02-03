import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentDir = path.resolve(__dirname, '../content');
const files = fs.readdirSync(contentDir);

const variantFiles = files.filter(f => f.startsWith('resume-') && f.endsWith('.yaml'));

const variants = [
  { key: 'default', displayName: 'Default', order: 0 },
  ...variantFiles.map(filename => {
    const key = filename.replace('resume-', '').replace('.yaml', '');
    let order = 99;
    let displayName = key.charAt(0).toUpperCase() + key.slice(1);

    try {
      const content = fs.readFileSync(path.join(contentDir, filename), 'utf-8');
      const data = yaml.load(content);
      if (data?.meta) {
        if (data.meta.order !== undefined) order = data.meta.order;
        if (data.meta.displayName) displayName = data.meta.displayName;
      }
    } catch (e) {
      console.error(`Error reading ${filename}:`, e);
    }

    return { key, displayName, order };
  })
].sort((a, b) => {
  if (a.order !== b.order) return a.order - b.order;
  return a.key.localeCompare(b.key);
});

const outputPath = path.resolve(__dirname, '../src/lib/data/variants.ts');
fs.writeFileSync(
  outputPath,
  `export const variants = ${JSON.stringify(variants, null, 2)};`
);

console.log('Generated site/src/lib/data/variants.ts');

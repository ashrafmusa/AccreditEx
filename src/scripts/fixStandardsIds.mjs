import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../data/standards.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Add id field based on standardId
const updated = data.map(item => ({
  ...item,
  id: item.standardId
}));

fs.writeFileSync(dataPath, JSON.stringify(updated, null, 2));
console.log('✓ standards.json updated with id fields');
process.exit(0);

import path from 'path';
import { fileURLToPath } from 'url';

// Ricostruzione di __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getHomePage(req, res) {
  res.sendFile(path.join(__dirname, '..', '..', 'Frontend', 'public', 'html', 'index.html'));
}

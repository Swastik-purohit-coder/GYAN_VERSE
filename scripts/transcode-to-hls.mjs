// Root proxy to frontend/scripts/transcode-to-hls.mjs
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import('../frontend/scripts/transcode-to-hls.mjs');

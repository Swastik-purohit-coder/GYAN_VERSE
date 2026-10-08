import fs from 'fs';
import path from 'path';
import { nodeStreamToWebStream, getMimeType } from '@/lib/media/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/media/hls/[...path]
 * Serves HLS playlist manifests (.m3u8) and segment files (.ts, .m4s) with zero RAM streaming.
 */
export async function GET(request, context) {
  const { path: subPathSegments } = await context.params;
  const relPath = Array.isArray(subPathSegments) ? subPathSegments.join('/') : subPathSegments;

  // Prevent path traversal
  if (!relPath || relPath.includes('..') || relPath.includes('\0')) {
    return new Response(JSON.stringify({ error: 'Invalid path' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cwd = process.cwd();
  const rootDir = path.resolve(cwd, '..');
  const hlsDir = path.join(rootDir, 'content', 'media', 'hls');
  const targetFile = path.join(hlsDir, relPath);

  if (!fs.existsSync(targetFile)) {
    return new Response(JSON.stringify({ error: 'HLS asset not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stat = await fs.promises.stat(targetFile);
  if (!stat.isFile()) {
    return new Response(JSON.stringify({ error: 'Not a file' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const mimeType = getMimeType(targetFile, 'application/octet-stream');
  const isManifest = targetFile.endsWith('.m3u8');

  // Manifests should have short or no cache, segments (.ts) can be cached long term
  const cacheControl = isManifest
    ? 'no-cache, no-store, must-revalidate'
    : 'public, max-age=31536000, immutable';

  const nodeStream = fs.createReadStream(targetFile);
  const webStream = nodeStreamToWebStream(nodeStream);

  return new Response(webStream, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(stat.size),
      'Cache-Control': cacheControl,
      'Access-Control-Allow-Origin': '*',
    },
  });
}

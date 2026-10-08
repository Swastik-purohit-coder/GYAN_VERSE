import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

/**
 * Supported MIME Types Map
 */
const MIME_MAP = {
  // Video
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.ts': 'video/mp2t',
  '.m3u8': 'application/vnd.apple.mpegurl',
  // Audio
  '.mp3': 'audio/mpeg',
  '.aac': 'audio/aac',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.wave': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/opus',
  '.weba': 'audio/webm',
  '.flac': 'audio/flac',
  // Images
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

/**
 * Sanitizes input ID / filename to prevent directory traversal and injection.
 * @param {string} rawId
 * @returns {string} Cleaned filename or ID
 */
export function sanitizeMediaId(rawId) {
  if (!rawId || typeof rawId !== 'string') return '';
  // Remove query strings if any
  const clean = rawId.split('?')[0].split('#')[0];
  // Disallow directory traversal characters
  const baseName = path.basename(clean).replace(/[^a-zA-Z0-9._-]/g, '_');
  return baseName;
}

/**
 * Gets allowed base search directories for media files
 */
function getMediaRoots() {
  const cwd = process.cwd(); // in Next.js, cwd is frontend directory
  const rootDir = path.resolve(cwd, '..'); // project root
  return [
    path.join(rootDir, 'content', 'media'),
    path.join(rootDir, 'content', 'lessons'),
    path.join(cwd, 'public', 'media'),
    path.join(rootDir, 'content'),
  ];
}

/**
 * Resolves the MIME type from file extension
 */
export function getMimeType(filePath, defaultType = 'application/octet-stream') {
  const ext = path.extname(filePath || '').toLowerCase();
  return MIME_MAP[ext] || defaultType;
}

/**
 * Locates the local media file on the filesystem across configured content directories.
 * @param {string} mediaId - Sanitized media or lesson ID
 * @param {'video'|'audio'|'thumbnail'|'hls'} mediaType - Media category
 * @returns {Promise<{ filePath: string, mimeType: string, stat: fs.Stats } | null>}
 */
export async function findLocalMediaFile(mediaId, mediaType = 'video') {
  const sanitized = sanitizeMediaId(mediaId);
  if (!sanitized) return null;

  const cwd = process.cwd();
  const rootDir = path.resolve(cwd, '..');

  // Specific folders by mediaType
  const typeDirs = {
    video: [
      path.join(rootDir, 'content', 'media', 'videos'),
      path.join(rootDir, 'content', 'media'),
      path.join(rootDir, 'content', 'lessons'),
      path.join(cwd, 'public', 'media', 'videos'),
      path.join(cwd, 'public', 'media'),
    ],
    audio: [
      path.join(rootDir, 'content', 'media', 'audio'),
      path.join(rootDir, 'content', 'media'),
      path.join(rootDir, 'content', 'lessons'),
      path.join(cwd, 'public', 'media', 'audio'),
      path.join(cwd, 'public', 'media'),
    ],
    thumbnail: [
      path.join(rootDir, 'content', 'media', 'thumbnails'),
      path.join(rootDir, 'content', 'media'),
      path.join(cwd, 'public', 'media', 'thumbnails'),
      path.join(cwd, 'public', 'media'),
    ],
    hls: [
      path.join(rootDir, 'content', 'media', 'hls'),
      path.join(cwd, 'public', 'media', 'hls'),
    ],
  };

  const candidateDirs = typeDirs[mediaType] || typeDirs.video;

  // Extensions to check if extension is missing in mediaId
  const defaultExts = {
    video: ['.mp4', '.webm', '.mov', '.mkv', '.m4v', '.m3u8'],
    audio: ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.opus', '.flac'],
    thumbnail: ['.webp', '.avif', '.jpg', '.jpeg', '.png', '.svg'],
    hls: ['.m3u8', '.ts', '.m4s'],
  };

  const extensions = defaultExts[mediaType] || [];

  for (const dir of candidateDirs) {
    // 1. Direct match with extension already in mediaId
    const directPath = path.join(dir, sanitized);
    try {
      if (fs.existsSync(directPath)) {
        const stat = await fs.promises.stat(directPath);
        if (stat.isFile()) {
          return {
            filePath: directPath,
            mimeType: getMimeType(directPath, mediaType === 'audio' ? 'audio/mpeg' : 'video/mp4'),
            stat,
          };
        }
      }
    } catch (e) {
      // ignore
    }

    // 2. Try with standard extensions
    for (const ext of extensions) {
      const pathWithExt = path.join(dir, `${sanitized}${ext}`);
      try {
        if (fs.existsSync(pathWithExt)) {
          const stat = await fs.promises.stat(pathWithExt);
          if (stat.isFile()) {
            return {
              filePath: pathWithExt,
              mimeType: getMimeType(pathWithExt, mediaType === 'audio' ? 'audio/mpeg' : 'video/mp4'),
              stat,
            };
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }

  return null;
}

/**
 * Parses HTTP Range header according to RFC 7233 / RFC 9110.
 * Examples:
 *   "bytes=0-1023" -> { start: 0, end: 1023 }
 *   "bytes=1000-"  -> { start: 1000, end: fileSize - 1 }
 *   "bytes=-500"   -> { start: fileSize - 500, end: fileSize - 1 }
 *
 * @param {string|null} rangeHeader
 * @param {number} fileSize
 * @returns {{ start: number, end: number, isRange: boolean, isValid: boolean }}
 */
export function parseRangeHeader(rangeHeader, fileSize) {
  if (!rangeHeader || typeof rangeHeader !== 'string' || !rangeHeader.startsWith('bytes=')) {
    return {
      start: 0,
      end: fileSize > 0 ? fileSize - 1 : 0,
      isRange: false,
      isValid: true,
    };
  }

  const rangeSpec = rangeHeader.replace(/^bytes=/, '').trim();
  // We handle single range requests (standard for video/audio streaming)
  const [startStr, endStr] = rangeSpec.split('-');

  let start = NaN;
  let end = NaN;

  if (startStr === '' && endStr !== '') {
    // Suffix range: bytes=-500 (last 500 bytes)
    const suffixLength = parseInt(endStr, 10);
    if (isNaN(suffixLength) || suffixLength <= 0) {
      return { start: 0, end: 0, isRange: true, isValid: false };
    }
    start = Math.max(0, fileSize - suffixLength);
    end = fileSize - 1;
  } else if (startStr !== '' && (endStr === '' || endStr === undefined)) {
    // Open-ended range: bytes=1000-
    start = parseInt(startStr, 10);
    end = fileSize - 1;
  } else if (startStr !== '' && endStr !== '') {
    // Closed range: bytes=0-1023
    start = parseInt(startStr, 10);
    end = parseInt(endStr, 10);
  } else {
    return { start: 0, end: 0, isRange: true, isValid: false };
  }

  if (isNaN(start) || isNaN(end) || start < 0 || start >= fileSize || end < start) {
    return { start: 0, end: 0, isRange: true, isValid: false };
  }

  // Bound end to fileSize - 1
  end = Math.min(end, fileSize - 1);

  return {
    start,
    end,
    isRange: true,
    isValid: true,
  };
}

/**
 * Converts a Node.js Readable stream into a Web ReadableStream
 * without loading the file into memory.
 * @param {import('stream').Readable} nodeStream
 * @returns {ReadableStream}
 */
export function nodeStreamToWebStream(nodeStream) {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => {
        controller.enqueue(chunk);
      });
      nodeStream.on('end', () => {
        controller.close();
      });
      nodeStream.on('error', (err) => {
        controller.error(err);
      });
    },
    cancel() {
      if (typeof nodeStream.destroy === 'function') {
        nodeStream.destroy();
      }
    },
  });
}

/**
 * Serves a media stream response with full HTTP Range Request support.
 * @param {Request} request
 * @param {string} mediaId
 * @param {'video'|'audio'|'thumbnail'|'hls'} mediaType
 * @param {object} [options]
 * @returns {Promise<Response>}
 */
export async function createMediaStreamResponse(request, mediaId, mediaType = 'video', options = {}) {
  const isHead = request.method === 'HEAD';

  // 1. Locate local media file
  const localMedia = await findLocalMediaFile(mediaId, mediaType);

  if (!localMedia) {
    // Check if it corresponds to an external URL or database record (S3, CDN, etc.)
    return new Response(JSON.stringify({ error: `${mediaType} '${mediaId}' not found on storage` }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { filePath, mimeType, stat } = localMedia;
  const fileSize = stat.size;

  if (fileSize === 0) {
    return new Response('', {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': '0',
        'Accept-Ranges': 'bytes',
      },
    });
  }

  // 2. Parse Range header
  const rangeHeader = request.headers.get('range');
  const range = parseRangeHeader(rangeHeader, fileSize);

  // If Range is invalid (out of bounds)
  if (range.isRange && !range.isValid) {
    return new Response(null, {
      status: 416, // Range Not Satisfiable
      headers: {
        'Content-Range': `bytes */${fileSize}`,
        'Accept-Ranges': 'bytes',
      },
    });
  }

  const { start, end, isRange } = range;
  const chunkSize = end - start + 1;

  // Base caching headers
  const cacheControl = options.cacheControl || 'public, max-age=31536000, immutable';

  const headers = {
    'Content-Type': mimeType,
    'Accept-Ranges': 'bytes',
    'Content-Length': String(chunkSize),
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
    'ETag': `"${stat.mtimeMs.toString(16)}-${fileSize.toString(16)}"`,
    'Last-Modified': stat.mtime.toUTCString(),
  };

  // 3. For HEAD requests, return headers only without body stream
  if (isHead) {
    if (isRange) {
      headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
      return new Response(null, { status: 206, headers });
    }
    return new Response(null, { status: 200, headers });
  }

  // 4. Create Node.js chunk read stream (Never load entire file into memory!)
  const nodeStream = fs.createReadStream(filePath, { start, end });
  const webStream = nodeStreamToWebStream(nodeStream);

  if (isRange) {
    headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
    return new Response(webStream, {
      status: 206, // Partial Content
      headers,
    });
  }

  return new Response(webStream, {
    status: 200,
    headers,
  });
}

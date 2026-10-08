import {
  createMediaStreamResponse,
  findLocalMediaFile,
  sanitizeMediaId,
  getMimeType,
} from './storage';
import { supabase, runSingle } from '@/app/api/_utils/supabase';

/**
 * Resolves full media metadata for a lesson or media ID.
 * Checks local content folder first, then Supabase lessons table.
 *
 * @param {string} id - Lesson or media ID
 * @param {'video'|'audio'|'thumbnail'} type
 */
export async function getMediaMetadata(id, type = 'video') {
  const cleanId = sanitizeMediaId(id);

  // 1. Check local file on disk
  const local = await findLocalMediaFile(cleanId, type);
  if (local) {
    return {
      id: cleanId,
      sourceType: 'local',
      filePath: local.filePath,
      mimeType: local.mimeType,
      fileSize: local.stat.size,
      streamingUrl: `/api/media/${type}/${encodeURIComponent(cleanId)}`,
    };
  }

  // 2. Check Supabase Database for matching lesson record
  try {
    const lesson = await runSingle(
      supabase
        .from('lessons')
        .select('id, title, description, video_path, video_url, video_type, duration, published')
        .eq('id', cleanId)
        .maybeSingle()
    );

    if (lesson) {
      const rawUrl = lesson.video_url || lesson.video_path || '';
      const isYt =
        lesson.video_type === 'youtube' ||
        rawUrl.includes('youtube.com') ||
        rawUrl.includes('youtu.be');
      const isHls = rawUrl.includes('.m3u8') || lesson.video_type === 'hls';

      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration || 0,
        videoType: isYt ? 'youtube' : isHls ? 'hls' : 'mp4',
        sourceType: isYt ? 'youtube' : isHls ? 'hls' : rawUrl.startsWith('http') ? 'remote' : 'local',
        rawUrl,
        streamingUrl: isYt
          ? rawUrl
          : `/api/media/video/${encodeURIComponent(lesson.id)}`,
      };
    }
  } catch (e) {
    // Database query error or table not yet configured
  }

  return null;
}

/**
 * Handles streaming for both local files and remote S3/CDN media streams
 * with upstream Range forwarding for zero server RAM usage.
 *
 * @param {Request} request
 * @param {string} id
 * @param {'video'|'audio'|'thumbnail'} type
 */
export async function handleMediaStreaming(request, id, type = 'video') {
  const cleanId = sanitizeMediaId(id);

  // 1. Local storage stream
  const local = await findLocalMediaFile(cleanId, type);
  if (local) {
    return createMediaStreamResponse(request, cleanId, type);
  }

  // 2. If not found locally, query database for remote S3 / Cloudflare / Supabase Storage URL
  try {
    const lesson = await runSingle(
      supabase
        .from('lessons')
        .select('id, video_url, video_path, video_type')
        .eq('id', cleanId)
        .maybeSingle()
    );

    const remoteUrl = lesson?.video_url || lesson?.video_path;
    if (remoteUrl && remoteUrl.startsWith('http')) {
      // Forward the Range header upstream to the cloud/S3/CDN storage
      const upstreamHeaders = {};
      const rangeHeader = request.headers.get('range');
      if (rangeHeader) {
        upstreamHeaders['Range'] = rangeHeader;
      }

      const upstreamRes = await fetch(remoteUrl, {
        headers: upstreamHeaders,
      });

      const responseHeaders = new Headers();
      ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control', 'etag', 'last-modified'].forEach((h) => {
        const val = upstreamRes.headers.get(h);
        if (val) responseHeaders.set(h, val);
      });

      if (!responseHeaders.has('accept-ranges')) {
        responseHeaders.set('accept-ranges', 'bytes');
      }

      return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: responseHeaders,
      });
    }
  } catch (e) {
    // DB error
  }

  return new Response(
    JSON.stringify({ error: `${type} '${id}' not found` }),
    { status: 404, headers: { 'Content-Type': 'application/json' } }
  );
}

export {
  createMediaStreamResponse,
  findLocalMediaFile,
  sanitizeMediaId,
  getMimeType,
};

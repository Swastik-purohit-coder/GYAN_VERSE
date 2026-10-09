import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { supabase, runSingle } from '@/app/api/_utils/supabase';
import { findLocalMediaFile, sanitizeMediaId } from '@/lib/media/storage';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/lessons/[id]
 * Returns lightweight lesson metadata with streaming endpoints for video and audio.
 */
export async function GET(request, context) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get('lang') || 'en').toLowerCase();
  const cleanId = sanitizeMediaId(id);

  let userId = null;
  try {
    const authObj = await auth();
    userId = authObj?.userId || null;
  } catch (e) {}

  let lessonData = null;

  // 1. Try fetching from Supabase Database
  try {
    let dbLesson = null;
    try {
      dbLesson = await runSingle(
        supabase
          .from('lessons')
          .select('id, module_id, title, description, video_path, video_url, video_type, audio_path, audio_url, duration, order_index, is_required, published, created_at, updated_at')
          .eq('id', cleanId)
          .maybeSingle()
      );
    } catch (colErr) {
      dbLesson = await runSingle(
        supabase
          .from('lessons')
          .select('id, module_id, title, description, video_path, video_url, duration, order_index, is_required, published, created_at, updated_at')
          .eq('id', cleanId)
          .maybeSingle()
      );
    }

    if (dbLesson) {
      let progress = 0;
      let completed = false;

      if (userId) {
        const prog = await runSingle(
          supabase
            .from('lesson_progress')
            .select('completed, last_position')
            .eq('student_id', userId)
            .eq('lesson_id', cleanId)
            .maybeSingle()
        );
        if (prog) {
          completed = Boolean(prog.completed);
          progress = prog.last_position || 0;
        }
      }

      const rawUrl = dbLesson.video_url || dbLesson.video_path || '';
      const isYt = dbLesson.video_type === 'youtube' || rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be');
      const isHls = dbLesson.video_type === 'hls' || rawUrl.includes('.m3u8');

      // Check if audio exists in db or local media
      const rawAudio = dbLesson.audio_url || dbLesson.audio_path || '';
      const localAudio = await findLocalMediaFile(cleanId, 'audio');
      const localThumb = await findLocalMediaFile(cleanId, 'thumbnail');

      lessonData = {
        id: dbLesson.id,
        moduleId: dbLesson.module_id,
        title: dbLesson.title,
        description: dbLesson.description || '',
        duration: dbLesson.duration || 0,
        videoUrl: isYt ? rawUrl : rawUrl.startsWith('http') ? rawUrl : `/api/media/video/${encodeURIComponent(dbLesson.id)}`,
        audioUrl: rawAudio ? rawAudio : localAudio ? `/api/media/audio/${encodeURIComponent(cleanId)}` : null,
        thumbnail: localThumb ? `/api/media/thumbnail/${encodeURIComponent(cleanId)}` : null,
        videoType: isYt ? 'youtube' : isHls ? 'hls' : 'mp4',
        completed,
        progress,
      };
    }
  } catch (e) {
    // Database fallback
  }

  // 2. Try fetching from content/lessons/[id].[lang].json or content/lessons/[id].json
  if (!lessonData) {
    try {
      const rootDir = path.resolve(process.cwd(), '..');
      const jsonPath = path.join(rootDir, 'content', 'lessons', `${cleanId}.${lang}.json`);
      const fallbackJsonPath = path.join(rootDir, 'content', 'lessons', `${cleanId}.json`);

      let rawContent = null;
      try {
        rawContent = await fs.readFile(jsonPath, 'utf8');
      } catch (e) {
        rawContent = await fs.readFile(fallbackJsonPath, 'utf8');
      }

      const parsed = JSON.parse(rawContent);

      const localVideo = await findLocalMediaFile(cleanId, 'video');
      const localAudio = await findLocalMediaFile(cleanId, 'audio');
      const localThumb = await findLocalMediaFile(cleanId, 'thumbnail');

      lessonData = {
        id: cleanId,
        title: parsed.title || cleanId,
        description: parsed.description || '',
        duration: parsed.duration || 0,
        videoUrl: parsed.videoUrl || (localVideo ? `/api/media/video/${encodeURIComponent(cleanId)}` : null),
        audioUrl: parsed.audioUrl || (localAudio ? `/api/media/audio/${encodeURIComponent(cleanId)}` : null),
        thumbnail: parsed.thumbnail || (localThumb ? `/api/media/thumbnail/${encodeURIComponent(cleanId)}` : null),
        videoType: parsed.videoType || 'mp4',
        completed: false,
        progress: 0,
        ...parsed,
      };
    } catch (e) {
      // Not in json
    }
  }

  // 3. If still not found, check if media files exist directly on disk for this ID
  if (!lessonData) {
    const localVideo = await findLocalMediaFile(cleanId, 'video');
    const localAudio = await findLocalMediaFile(cleanId, 'audio');
    const localThumb = await findLocalMediaFile(cleanId, 'thumbnail');

    if (localVideo || localAudio) {
      lessonData = {
        id: cleanId,
        title: cleanId.replace(/[-_]/g, ' '),
        description: '',
        duration: 0,
        videoUrl: localVideo ? `/api/media/video/${encodeURIComponent(cleanId)}` : null,
        audioUrl: localAudio ? `/api/media/audio/${encodeURIComponent(cleanId)}` : null,
        thumbnail: localThumb ? `/api/media/thumbnail/${encodeURIComponent(cleanId)}` : null,
        videoType: 'mp4',
        completed: false,
        progress: 0,
      };
    }
  }

  if (!lessonData) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  return NextResponse.json(lessonData, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}


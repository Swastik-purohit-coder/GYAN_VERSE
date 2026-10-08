import { handleMediaStreaming } from '@/lib/media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/media/video/[id]
 * Supports HTTP Range Requests for chunked streaming to low-end devices and slow networks.
 */
export async function GET(request, context) {
  const { id } = await context.params;
  return handleMediaStreaming(request, id, 'video');
}

/**
 * HEAD /api/media/video/[id]
 * Returns header metadata without transferring media byte content.
 */
export async function HEAD(request, context) {
  const { id } = await context.params;
  return handleMediaStreaming(request, id, 'video');
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Accept-Ranges, Content-Range, Content-Type',
      'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length, Content-Type',
    },
  });
}

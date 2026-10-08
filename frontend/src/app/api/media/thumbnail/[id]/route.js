import { handleMediaStreaming } from '@/lib/media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/media/thumbnail/[id]
 * Streams lightweight thumbnail images (WebP, AVIF, PNG, JPG) with long-term caching headers.
 */
export async function GET(request, context) {
  const { id } = await context.params;
  return handleMediaStreaming(request, id, 'thumbnail');
}

/**
 * HEAD /api/media/thumbnail/[id]
 */
export async function HEAD(request, context) {
  const { id } = await context.params;
  return handleMediaStreaming(request, id, 'thumbnail');
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    },
  });
}

import { galleryAccessCore } from '@/lib/gallery-core';
import { findGalleryByCode, findGalleryBySlugOrId } from '@/lib/gallery-data';
import type { APIRoute } from 'astro';

/**
 * POST /api/gallery-access
 * Body: { slug?, id?, code? }
 * Metadata / unlock / resolve-by-code gate. Logic in src/lib/gallery-core.ts;
 * read strategy (elevated + fallback) in src/lib/gallery-data.ts.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await galleryAccessCore(
      { slug: body?.slug, id: body?.id, code: body?.code },
      {
        findOne: ({ slug, id }) => findGalleryBySlugOrId(slug, id),
        findByCode: (code) => findGalleryByCode(code),
        findAll: async () => [],
      }
    );
    return json(result.body, result.status);
  } catch (error) {
    console.error('gallery-access error:', error);
    return json({ ok: false, error: String((error as Error)?.message || error) }, 500);
  }
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

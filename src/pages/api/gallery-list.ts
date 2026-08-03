import { galleryListCore } from '@/lib/gallery-core';
import { findAllGalleries } from '@/lib/gallery-data';
import type { APIRoute } from 'astro';

/**
 * GET /api/gallery-list
 * Public-safe listing for the read-only galleries grid. Returns only safe
 * fields (name, slug, cover, layout, photo COUNT, dates) — never the access
 * code, never the media contents. Read strategy (elevated + fallback) lives in
 * src/lib/gallery-data.ts.
 */
export const GET: APIRoute = async () => {
  try {
    const result = await galleryListCore({
      findAll: findAllGalleries,
      findOne: async () => null,
    });
    return json(result.body, result.status);
  } catch (error) {
    console.error('gallery-list error:', error);
    return json(
      { ok: false, galleries: [], error: String((error as Error)?.message || error) },
      500
    );
  }
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

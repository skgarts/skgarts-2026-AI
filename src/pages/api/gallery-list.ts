import { COLLECTION, galleryListCore, type RawGallery } from '@/lib/gallery-core';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import type { APIRoute } from 'astro';

/**
 * GET /api/gallery-list
 *
 * Public-safe listing for the read-only galleries grid. Returns ONLY safe
 * fields (client name, slug, cover, layout, photo COUNT, dates) — never the
 * access code and never the media-gallery contents. This is what allows the
 * `clientgalleries` collection read to be locked to Admin-only without either
 * (a) breaking the public grid or (b) leaking client photo ids through it.
 *
 * Elevation note: same rule as gallery-access.ts — we elevate a wrapper that
 * runs `.find()`, not the `items.query()` builder factory.
 */

const elevatedFindAll = auth.elevate(() =>
  items.query(COLLECTION).limit(1000).find()
);

async function findAll(): Promise<RawGallery[]> {
  const res = await elevatedFindAll();
  return (res.items ?? []) as RawGallery[];
}

export const GET: APIRoute = async () => {
  try {
    const result = await galleryListCore({
      findAll,
      findOne: async () => null,
    });
    return json(result.body, result.status);
  } catch (error) {
    console.error('gallery-list error:', error);
    return json({ ok: false, galleries: [] }, 500);
  }
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

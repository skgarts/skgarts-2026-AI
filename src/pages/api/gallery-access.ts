import {
  COLLECTION,
  galleryAccessCore,
  type RawGallery,
} from '@/lib/gallery-core';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import type { APIRoute } from 'astro';

/**
 * POST /api/gallery-access
 * Body: { slug?: string, id?: string, code?: string }
 *
 * Server-side access-code gate for a client gallery. See src/lib/gallery-core.ts
 * for the two-mode contract (metadata vs. unlock). This file is the thin Wix
 * wrapper: it provides an ELEVATED reader and delegates all logic to the core.
 *
 * ELEVATION — READ THIS BEFORE CHANGING
 * -------------------------------------
 * `auth.elevate(fn)` runs `fn` with elevated permissions for the duration of
 * that one invocation. In @wix/data the privileged network call is the terminal
 * `.find()`, NOT the synchronous `items.query()` builder construction. So we must
 * elevate a function whose body performs the whole chain up to and including
 * `.find()`. Elevating `items.query` alone would leave `.find()` running with the
 * caller's (visitor) identity — which silently works while the collection has
 * public read, then breaks the instant you lock it to Admin-only.
 */

// Elevate a wrapper that performs the full query + find(). Defined once at module
// scope so the elevated copy is created a single time.
const elevatedFindBySlug = auth.elevate((slug: string) =>
  items.query(COLLECTION).eq('slug', slug).limit(1).find()
);
const elevatedFindById = auth.elevate((id: string) =>
  items.query(COLLECTION).eq('_id', id).limit(1).find()
);
const elevatedFindByCode = auth.elevate((code: string) =>
  items.query(COLLECTION).eq('accessCode', code).limit(1).find()
);

async function findOne({ slug, id }: { slug?: string; id?: string }): Promise<RawGallery | null> {
  if (slug) {
    const bySlug = await elevatedFindBySlug(slug);
    const hit = bySlug.items?.[0];
    if (hit) return hit as RawGallery;
  }
  const key = slug || id;
  if (key) {
    const byId = await elevatedFindById(key);
    const hit = byId.items?.[0];
    if (hit) return hit as RawGallery;
  }
  return null;
}

async function findByCode(code: string): Promise<RawGallery | null> {
  const res = await elevatedFindByCode(code);
  return (res.items?.[0] as RawGallery) || null;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await galleryAccessCore(
      { slug: body?.slug, id: body?.id, code: body?.code },
      { findOne, findByCode, findAll: async () => [] }
    );
    return json(result.body, result.status);
  } catch (error) {
    console.error('gallery-access error:', error);
    return json({ ok: false, error: 'Server error' }, 500);
  }
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

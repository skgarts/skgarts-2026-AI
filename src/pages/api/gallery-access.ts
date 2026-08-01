import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import type { APIRoute } from 'astro';

/**
 * POST /api/gallery-access
 * Body: { slug?: string, id?: string, code: string }
 *
 * Server-side access-code gate for a client gallery.
 * - Looks up the gallery by slug (or _id) with ELEVATED permission, so this works
 *   even when the `clientgalleries` collection's public read is turned OFF.
 * - Compares the submitted code to the CMS `accessCode` on the SERVER. The code is
 *   never sent to the browser.
 * - Returns the gallery's photos ONLY when the code matches. On a wrong/empty code
 *   it returns 401 with no photos, so the browser never receives the images.
 *
 * Uses the same proven patterns already in this project:
 *   - `auth.elevate(fn)` from @wix/essentials (see /api/upload-media.ts)
 *   - `items.query(collectionId)` from @wix/data (see integrations/cms/service.ts)
 */

const COLLECTION = 'clientgalleries';

// Convert a Wix media reference / object to a bare media id, then build sized URLs.
function toMediaId(raw: any): string {
  if (!raw) return '';
  if (typeof raw === 'object') {
    raw = raw.src || raw.url || raw.image || raw.slug || raw.uri || '';
  }
  if (typeof raw !== 'string') return '';
  if (raw.startsWith('wix:image://')) {
    return raw.replace('wix:image://v1/', '').split('/')[0].split('#')[0];
  }
  if (raw.startsWith('http')) {
    const m = raw.match(/\/media\/([^/?#]+)/);
    return m ? m[1] : '';
  }
  return raw;
}
const sized = (id: string, w: number, h: number, q = 80) =>
  id ? `https://static.wixstatic.com/media/${id}/v1/fill/w_${w},h_${h},al_c,q_${q},enc_auto/file.jpg` : '';
const full = (id: string) => (id ? `https://static.wixstatic.com/media/${id}` : '');

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const slug: string = (body?.slug || '').trim();
    const id: string = (body?.id || '').trim();
    const code: string = (body?.code || '').trim();

    if (!slug && !id) return json({ error: 'Missing gallery identifier' }, 400);
    if (!code) return json({ ok: false, error: 'Access code required' }, 401);

    // Query the collection with elevated permission (works even if read is admin-only).
    const runQuery = auth.elevate(async () => {
      // Try slug first, then _id.
      let res = slug
        ? await items.query(COLLECTION).eq('slug', slug).limit(1).find()
        : { items: [] as any[] };
      if ((!res.items || res.items.length === 0)) {
        const key = slug ? 'slug' : '_id';
        const val = slug || id;
        res = await items.query(COLLECTION).eq(key, val).limit(1).find();
      }
      if ((!res.items || res.items.length === 0) && id) {
        res = await items.query(COLLECTION).eq('_id', id).limit(1).find();
      }
      return res;
    });

    const result = await runQuery();
    const gallery: any = result.items?.[0];

    if (!gallery) return json({ ok: false, error: 'Gallery not found' }, 404);

    // Validate the code on the server. Never leak the correct code back.
    const expected = (gallery.accessCode || '').trim();
    if (!expected || code !== expected) {
      return json({ ok: false, error: 'Invalid access code' }, 401);
    }

    // Correct code — build and return the photos + safe metadata.
    const mg: any[] = Array.isArray(gallery.mediagallery) ? gallery.mediagallery : [];
    const photos = mg
      .map((it: any) => {
        const mid = toMediaId(typeof it === 'object' ? (it.src || it.url || it.image || it) : it);
        return {
          id: mid,
          thumb: sized(mid, 800, 800, 80),
          url: full(mid),
          title: (typeof it === 'object' && (it.title || it.description)) || undefined,
          description: (typeof it === 'object' && it.description) || undefined,
        };
      })
      .filter((p) => p.id);

    const heroId = toMediaId(gallery.hero);
    const heroUrl = heroId ? sized(heroId, 1920, 1080, 85) : '';

    return json({
      ok: true,
      gallery: {
        clientName: gallery.clientName || '',
        description: gallery.description || '',
        eventDate: gallery.eventDate || null,
        displayLayout: gallery.displayLayout || 'collage',
        heroUrl,
      },
      photos,
    }, 200);
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

import { COLLECTION } from '@/lib/gallery-core';
import { findGalleryBySlugOrId } from '@/lib/gallery-data';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { members } from '@wix/members';
import type { APIRoute } from 'astro';

/**
 * POST /api/gallery-write  — elevated Create / Update / Delete for galleries.
 * Body: { action: 'create'|'update'|'delete', data: {...} }
 *
 * WHY THIS EXISTS
 * ---------------
 * The `clientgalleries` collection is Write = Admin. A visitor signed in via
 * member login is NOT a site admin, so a browser-side items.update() is denied
 * (WDE0027). This endpoint runs server-side: it verifies the caller is an
 * authorized admin (by login email), then performs the write with ELEVATED
 * permissions.
 *
 * ── ACTION REQUIRED ──────────────────────────────────────────────────────────
 * Set ADMIN_EMAILS to the email address(es) you use to LOG INTO THE SITE (your
 * member login), which may differ from your Wix account email. Anyone whose
 * login email is not in this list cannot create/edit/delete galleries.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const ADMIN_EMAILS = ['srikanth@skgarts.com'];

async function currentEmail(): Promise<string | null> {
  try {
    const res = await members.getCurrentMember({ fieldsets: ['FULL'] });
    return res?.member?.loginEmail?.toLowerCase() || null;
  } catch (err) {
    console.warn('gallery-write: getCurrentMember failed:', err);
    return null;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1) Authorize the caller.
    const email = await currentEmail();
    if (!email) {
      return json({ ok: false, error: 'You must be signed in to manage galleries.' }, 401);
    }
    if (!ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email)) {
      // Include the detected email so you can confirm what to put in ADMIN_EMAILS.
      return json({ ok: false, error: 'Not authorized to manage galleries.', detected: email }, 403);
    }

    // 2) Perform the requested write, elevated.
    const body = await request.json().catch(() => ({}));
    const action = body?.action as string;
    const data = (body?.data || {}) as Record<string, any>;

    // Elevated write wrappers (closures preserve `this` and elevate the call).
    const elevatedInsert = auth.elevate((c: string, i: any) => items.insert(c, i));
    const elevatedUpdate = auth.elevate((c: string, i: any) => items.update(c, i));
    const elevatedRemove = auth.elevate((c: string, id: string) => items.remove(c, id));

    if (action === 'create') {
      const created = await elevatedInsert(COLLECTION, data);
      return json({ ok: true, item: created }, 200);
    }

    if (action === 'update') {
      if (!data._id) return json({ ok: false, error: '_id is required for update' }, 400);
      // Merge onto the existing record so fields not in the form (mediagallery,
      // accessCode, coverImage, hero, galleryLink) are preserved.
      const current = (await findGalleryBySlugOrId(undefined, data._id)) || {};
      const merged = { ...current, ...data };
      const updated = await elevatedUpdate(COLLECTION, merged);
      return json({ ok: true, item: updated }, 200);
    }

    if (action === 'delete') {
      if (!data._id) return json({ ok: false, error: '_id is required for delete' }, 400);
      await elevatedRemove(COLLECTION, data._id);
      return json({ ok: true }, 200);
    }

    return json({ ok: false, error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    console.error('gallery-write error:', error);
    return json({ ok: false, error: String((error as Error)?.message || error) }, 500);
  }
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

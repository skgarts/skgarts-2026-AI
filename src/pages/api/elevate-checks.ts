import { COLLECTION } from '@/lib/gallery-core';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import type { APIRoute } from 'astro';

/**
 * GET /api/elevate-check  — TEMPORARY DIAGNOSTIC. Delete after use.
 *
 * Reports how many rows a DIRECT read vs an ELEVATED read of `clientgalleries`
 * returns, plus any error each throws. Use this while the collection Read is
 * still public to confirm the elevated read works BEFORE locking Read to Admin.
 *
 * Interpretation:
 *  - direct.count  > 0 (expected now, since Read is public)
 *  - elevated.count > 0 and == direct.count  -> elevation works; safe to lock.
 *  - elevated.count == 0 or elevated.ok == false -> DO NOT LOCK; locking would
 *    empty the site. Send this output back for a targeted fix.
 *
 * Exposes counts only (no photos, codes, or record contents).
 */
export const GET: APIRoute = async () => {
  const out: Record<string, unknown> = { collection: COLLECTION };

  try {
    const d = await items.query(COLLECTION).limit(1000).find();
    out.direct = { ok: true, count: d.items?.length ?? 0 };
  } catch (e) {
    out.direct = { ok: false, error: String((e as Error)?.message || e) };
  }

  try {
    const elevatedFind = auth.elevate(() => items.query(COLLECTION).limit(1000).find());
    const e = await elevatedFind();
    out.elevated = { ok: true, count: e.items?.length ?? 0 };
  } catch (err) {
    out.elevated = { ok: false, error: String((err as Error)?.message || err) };
  }

  return new Response(JSON.stringify(out, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

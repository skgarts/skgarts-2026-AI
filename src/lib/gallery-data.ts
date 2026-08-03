import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { COLLECTION, type RawGallery } from './gallery-core';

/**
 * Server-only data access for the client-gallery endpoints.
 *
 * READ STRATEGY — elevated, with a safe fallback
 * ----------------------------------------------
 * We attempt each read with ELEVATED permissions so it will keep working once
 * the `clientgalleries` collection's Read permission is locked to Admin-only.
 * If elevation throws for any reason (SDK shape/runtime differences), we fall
 * back to a DIRECT query. The direct query succeeds only while the collection's
 * Read permission is still public ("Everyone") — which is the current state.
 *
 * Consequence:
 *   - Today (Read = Everyone): site works whether or not elevation succeeds.
 *   - After you lock Read = Admin: elevation MUST succeed, otherwise the direct
 *     fallback will be denied and reads return empty. So verify elevation works
 *     (see /api/gallery-list returning real data) BEFORE locking the collection.
 *
 * `auth.elevate(fn)` runs `fn` elevated for the duration of its invocation, and
 * we wrap a closure that performs the terminal `.find()` because in @wix/data the
 * privileged network call is `.find()`, not the synchronous `items.query()`.
 * elevate() is invoked here inside request-handling code (never at module load),
 * matching the working pattern in src/pages/api/upload-media.ts.
 */

type FindResult = { items?: any[] };

async function runFind(buildAndFind: () => Promise<FindResult>): Promise<FindResult> {
  try {
    const elevated = auth.elevate(buildAndFind);
    return await elevated();
  } catch (err) {
    // Elevation unavailable or wrong shape in this runtime. Fall back to a direct
    // read (works only while collection Read is public). Logged so it's visible
    // in server logs why elevation didn't take.
    console.warn('[gallery-data] elevate() failed; falling back to direct query. ' +
      'This fallback only works while collection Read is public:', err);
    return await buildAndFind();
  }
}

export async function findAllGalleries(): Promise<RawGallery[]> {
  const res = await runFind(() => items.query(COLLECTION).limit(1000).find());
  return (res.items ?? []) as RawGallery[];
}

export async function findGalleryBySlugOrId(slug?: string, id?: string): Promise<RawGallery | null> {
  if (slug) {
    const r = await runFind(() => items.query(COLLECTION).eq('slug', slug).limit(1).find());
    if (r.items?.[0]) return r.items[0] as RawGallery;
  }
  const key = slug || id;
  if (key) {
    const r = await runFind(() => items.query(COLLECTION).eq('_id', key).limit(1).find());
    if (r.items?.[0]) return r.items[0] as RawGallery;
  }
  return null;
}

export async function findGalleryByCode(code: string): Promise<RawGallery | null> {
  const r = await runFind(() => items.query(COLLECTION).eq('accessCode', code).limit(1).find());
  return (r.items?.[0] as RawGallery) ?? null;
}

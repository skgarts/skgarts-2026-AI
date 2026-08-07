/**
 * Pure, framework-free core logic for the client-gallery API endpoints.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The Astro routes in `src/pages/api/*` are thin wrappers: they parse the
 * request, obtain an ELEVATED Wix data reader, and hand off to the pure
 * functions here. Keeping the decision logic (code validation, metadata-vs-
 * photos branching, field whitelisting, URL building) in one dependency-free
 * module means it can be unit-tested in isolation with a mock data layer —
 * no live Wix, no network — which is exactly how we validate the access gate
 * BEFORE wiring it to the viewer and locking the CMS collection.
 *
 * Nothing in here imports @wix/*. The endpoints inject a `findOne` / `findAll`
 * function that performs the actual (elevated) query.
 */

export const COLLECTION = 'clientgalleries';

/** A raw gallery record as returned by Wix data (only fields we read). */
export interface RawGallery {
  _id: string;
  slug?: string;
  clientName?: string;
  description?: string;
  eventDate?: string | Date | null;
  displayLayout?: string;
  accessCode?: string;
  coverImage?: unknown;
  hero?: unknown;
  mediagallery?: unknown;
  [k: string]: unknown;
}

export interface Photo {
  id: string;
  thumb: string;
  url: string;
  title?: string;
  description?: string;
}

/** Injected data access. Implementations elevate permissions server-side. */
export interface GalleryDataAccess {
  /** Find a single gallery by slug, else by _id. Returns null if absent. */
  findOne: (opts: { slug?: string; id?: string }) => Promise<RawGallery | null>;
  /** List all galleries (used for the public-safe grid). */
  findAll: () => Promise<RawGallery[]>;
  /** Find a gallery by exact access code (used by the homepage "enter code" box). */
  findByCode?: (code: string) => Promise<RawGallery | null>;
}

/* ------------------------------------------------------------------ *
 * Media helpers — convert a Wix media reference to a bare media id,
 * then build size-optimized URLs via the Wix on-the-fly image service.
 * ------------------------------------------------------------------ */

export function toMediaId(raw: unknown): string {
  let v: unknown = raw;
  if (!v) return '';
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    v = o.src || o.url || o.image || o.slug || o.uri || '';
  }
  if (typeof v !== 'string') return '';
  if (v.startsWith('wix:image://')) {
    return v.replace('wix:image://v1/', '').split('/')[0].split('#')[0];
  }
  if (v.startsWith('http')) {
    const m = v.match(/\/media\/([^/?#]+)/);
    return m ? m[1] : '';
  }
  return v; // already a bare media id
}

export const sized = (id: string, w: number, h: number, q = 80) =>
  id
    ? `https://static.wixstatic.com/media/${id}/v1/fill/w_${w},h_${h},al_c,q_${q},enc_auto/file.jpg`
    : '';

/**
 * Scale-to-FIT URL: preserves the image's aspect ratio (no cropping), scaling it
 * to fit within a max box. Small images are served at their native size. Used for
 * the Hero image, which must show the full uncropped frame at high resolution.
 */
export const sizedFit = (id: string, max: number, q = 90) =>
  id
    ? `https://static.wixstatic.com/media/${id}/v1/fit/w_${max},h_${max},q_${q},enc_auto/file.jpg`
    : '';

export const full = (id: string) =>
  id ? `https://static.wixstatic.com/media/${id}` : '';

/** Normalize the CMS media-gallery array into sized photo objects. */
export function buildPhotos(mediagallery: unknown): Photo[] {
  const items = Array.isArray(mediagallery) ? mediagallery : [];
  return items
    .map((it: any): Photo => {
      const mid = toMediaId(typeof it === 'object' ? it.src || it.url || it.image || it : it);
      return {
        id: mid,
        thumb: sized(mid, 800, 800, 80),
        url: full(mid),
        title: (typeof it === 'object' && (it.title || it.description)) || undefined,
        description: (typeof it === 'object' && it.description) || undefined,
      };
    })
    .filter((p) => p.id);
}

/* ------------------------------------------------------------------ *
 * Access endpoint core
 * ------------------------------------------------------------------ */

export interface AccessInput {
  slug?: string;
  id?: string;
  code?: string;
}

export interface AccessResult {
  status: number;
  body: Record<string, unknown>;
}

/**
 * Core of POST /api/gallery-access.
 *
 * Two modes, decided by whether a non-empty `code` was supplied:
 *
 *  1. METADATA MODE (no code): returns the minimum the gate screen needs to
 *     render — the client name and whether a code is required. NEVER returns
 *     photos or the access code. This lets the viewer show the unlock screen
 *     even after the collection's public read is turned OFF.
 *
 *  2. UNLOCK MODE (code present): validates the code on the server. Only on a
 *     match does it return photos + display metadata + heroUrl. A wrong code
 *     yields 401 with no photos, so the browser never receives the images.
 */
export async function galleryAccessCore(
  input: AccessInput,
  data: GalleryDataAccess
): Promise<AccessResult> {
  const slug = (input.slug || '').trim();
  const id = (input.id || '').trim();
  const code = (input.code || '').trim();

  // RESOLVE-BY-CODE MODE — used by the homepage "enter your access code" box,
  // which has a code but no specific gallery. We look the gallery up by its code
  // on the SERVER and return only its destination (slug + link). No photos, no
  // other galleries' data, and the code is never echoed back. This replaces the
  // old client-side lookup that downloaded every gallery's access code.
  if (!slug && !id && code) {
    if (!data.findByCode) {
      return { status: 400, body: { ok: false, error: 'Missing gallery identifier' } };
    }
    const match = await data.findByCode(code);
    if (!match) {
      return { status: 401, body: { ok: false, error: 'Invalid access code' } };
    }
    return {
      status: 200,
      body: {
        ok: true,
        mode: 'resolve',
        slug: (match.slug || '') as string,
        galleryLink: (match.galleryLink as string) || '',
      },
    };
  }

  if (!slug && !id) {
    return { status: 400, body: { ok: false, error: 'Missing gallery identifier' } };
  }

  const gallery = await data.findOne({ slug: slug || undefined, id: id || undefined });
  if (!gallery) {
    return { status: 404, body: { ok: false, error: 'Gallery not found' } };
  }

  const expected = (gallery.accessCode || '').trim();
  const hasCode = expected.length > 0;

  // METADATA MODE — no code submitted yet. Return only public-safe fields.
  if (!code) {
    return {
      status: 200,
      body: {
        ok: false,
        needsCode: true,
        gallery: { clientName: gallery.clientName || '', hasCode },
      },
    };
  }

  // UNLOCK MODE — validate. Never leak the correct code back.
  if (!hasCode || code !== expected) {
    return { status: 401, body: { ok: false, error: 'Invalid access code' } };
  }

  const photos = buildPhotos(gallery.mediagallery);
  const heroId = toMediaId(gallery.hero);
  // Hero is shown uncropped at high resolution — scale-to-fit, not fill/crop.
  const heroUrl = heroId ? sizedFit(heroId, 2560, 90) : '';

  return {
    status: 200,
    body: {
      ok: true,
      gallery: {
        clientName: gallery.clientName || '',
        description: gallery.description || '',
        eventDate: gallery.eventDate || null,
        displayLayout: gallery.displayLayout || 'collage',
        heroUrl,
      },
      photos,
    },
  };
}

/* ------------------------------------------------------------------ *
 * List endpoint core
 * ------------------------------------------------------------------ */

export interface GalleryListEntry {
  _id: string;
  slug: string;
  clientName: string;
  description: string;
  eventDate: string | Date | null;
  displayLayout: string;
  coverImage: unknown; // raw cover ref for the <Image> component; NOT a client photo
  coverFocal: string;  // "X,Y" focal percentages for the card cover crop
  photoCount: number;  // a count only — never the media ids/urls
  hasCode: boolean;
}

/**
 * Core of GET /api/gallery-list.
 *
 * Returns ONLY public-safe listing fields for the read-only grid. It never
 * exposes `accessCode` or the media-gallery contents — `photoCount` is a bare
 * number. This is what makes it safe to lock `clientgalleries` read to
 * Admin-only: the grid keeps working without leaking any client photos.
 */
export async function galleryListCore(
  data: GalleryDataAccess
): Promise<{ status: number; body: { ok: boolean; galleries: GalleryListEntry[] } }> {
  const all = await data.findAll();
  const galleries: GalleryListEntry[] = all.map((g) => ({
    _id: g._id,
    slug: (g.slug || '') as string,
    clientName: g.clientName || '',
    description: g.description || '',
    eventDate: g.eventDate ?? null,
    displayLayout: g.displayLayout || 'collage',
    coverImage: g.coverImage ?? '',
    coverFocal: (g.coverFocal as string) || '',
    photoCount: Array.isArray(g.mediagallery) ? g.mediagallery.length : 0,
    hasCode: !!(g.accessCode && String(g.accessCode).trim()),
  }));
  return { status: 200, body: { ok: true, galleries } };
}

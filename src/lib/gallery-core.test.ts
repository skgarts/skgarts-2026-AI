import { describe, expect, it } from 'vitest';
import {
  buildPhotos,
  galleryAccessCore,
  galleryListCore,
  toMediaId,
  type GalleryDataAccess,
  type RawGallery,
} from './gallery-core';

const SAMPLE: RawGallery = {
  _id: 'rec-1',
  slug: 'manohar-portfolio',
  clientName: 'Manohar Portfolio',
  description: 'Studio session',
  eventDate: '2026-01-10',
  displayLayout: 'hero',
  accessCode: 'secret123',
  coverImage: 'wix:image://v1/cover_abc~mv2.jpg/cover.jpg',
  hero: 'wix:image://v1/hero_xyz~mv2.jpg/hero.jpg',
  mediagallery: [
    { src: 'wix:image://v1/photo_1~mv2.jpg/1.jpg', title: 'One' },
    { src: 'wix:image://v1/photo_2~mv2.jpg/2.jpg' },
    'wix:image://v1/photo_3~mv2.jpg/3.jpg',
  ],
};

function mockData(gallery: RawGallery | null, all: RawGallery[] = []): GalleryDataAccess {
  return {
    findOne: async ({ slug, id }) => {
      if (!gallery) return null;
      if (slug && gallery.slug === slug) return gallery;
      if (id && gallery._id === id) return gallery;
      // emulate slug-first-then-id lookup
      if (slug && gallery._id === slug) return gallery;
      return null;
    },
    findAll: async () => all,
    findByCode: async (code) => {
      const pool = all.length ? all : gallery ? [gallery] : [];
      return pool.find((g) => (g.accessCode || '').trim() === code.trim()) || null;
    },
  };
}

describe('toMediaId', () => {
  it('extracts id from wix:image refs', () => {
    expect(toMediaId('wix:image://v1/photo_1~mv2.jpg/1.jpg')).toBe('photo_1~mv2.jpg');
  });
  it('extracts id from static.wixstatic urls', () => {
    expect(toMediaId('https://static.wixstatic.com/media/abc123/v1/fill/w_1,h_1/file.jpg')).toBe('abc123');
  });
  it('passes through a bare id and handles junk', () => {
    expect(toMediaId('bare_id')).toBe('bare_id');
    expect(toMediaId(null)).toBe('');
    expect(toMediaId(42)).toBe('');
  });
});

describe('buildPhotos', () => {
  it('normalizes mixed object/string entries and drops empties', () => {
    const photos = buildPhotos(SAMPLE.mediagallery);
    expect(photos).toHaveLength(3);
    expect(photos[0].id).toBe('photo_1~mv2.jpg');
    expect(photos[0].title).toBe('One');
    expect(photos[0].thumb).toContain('/photo_1~mv2.jpg/');
    expect(photos[0].thumb).toContain('w_800,h_800');
    expect(photos[0].url).toBe('https://static.wixstatic.com/media/photo_1~mv2.jpg');
  });
  it('returns [] for non-arrays', () => {
    expect(buildPhotos(undefined)).toEqual([]);
    expect(buildPhotos('nope')).toEqual([]);
  });
});

describe('galleryAccessCore', () => {
  it('400 when no identifier is given', async () => {
    const r = await galleryAccessCore({}, mockData(SAMPLE));
    expect(r.status).toBe(400);
  });

  it('404 when the gallery is not found', async () => {
    const r = await galleryAccessCore({ slug: 'ghost' }, mockData(null));
    expect(r.status).toBe(404);
  });

  it('METADATA mode: no code returns clientName + needsCode, NO photos, NO accessCode', async () => {
    const r = await galleryAccessCore({ slug: 'manohar-portfolio' }, mockData(SAMPLE));
    expect(r.status).toBe(200);
    expect(r.body.needsCode).toBe(true);
    expect((r.body.gallery as any).clientName).toBe('Manohar Portfolio');
    expect((r.body.gallery as any).hasCode).toBe(true);
    // Critical: nothing sensitive leaks in metadata mode
    expect(r.body.photos).toBeUndefined();
    expect(JSON.stringify(r.body)).not.toContain('secret123');
    expect(JSON.stringify(r.body)).not.toContain('photo_1');
  });

  it('UNLOCK fail: wrong code returns 401 with NO photos and NO code echo', async () => {
    const r = await galleryAccessCore(
      { slug: 'manohar-portfolio', code: 'wrong' },
      mockData(SAMPLE)
    );
    expect(r.status).toBe(401);
    expect(r.body.photos).toBeUndefined();
    expect(JSON.stringify(r.body)).not.toContain('secret123');
    expect(JSON.stringify(r.body)).not.toContain('photo_1');
  });

  it('UNLOCK success: correct code returns photos + heroUrl + display metadata', async () => {
    const r = await galleryAccessCore(
      { slug: 'manohar-portfolio', code: 'secret123' },
      mockData(SAMPLE)
    );
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect((r.body.photos as any[])).toHaveLength(3);
    expect((r.body.gallery as any).displayLayout).toBe('hero');
    expect((r.body.gallery as any).heroUrl).toContain('/hero_xyz~mv2.jpg/');
    expect((r.body.gallery as any).heroUrl).toContain('w_1920,h_1080');
    // Never echo the code back
    expect(JSON.stringify(r.body)).not.toContain('secret123');
  });

  it('trims whitespace around the submitted code', async () => {
    const r = await galleryAccessCore(
      { slug: 'manohar-portfolio', code: '  secret123  ' },
      mockData(SAMPLE)
    );
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });

  it('a gallery with no access code cannot be unlocked (401)', async () => {
    const noCode = { ...SAMPLE, accessCode: '' };
    const r = await galleryAccessCore(
      { slug: 'manohar-portfolio', code: 'anything' },
      mockData(noCode)
    );
    expect(r.status).toBe(401);
  });

  it('resolves by _id when slug lookup misses', async () => {
    const r = await galleryAccessCore({ id: 'rec-1', code: 'secret123' }, mockData(SAMPLE));
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });
});

describe('galleryAccessCore — resolve-by-code (homepage box)', () => {
  it('correct code with no slug/id returns slug + link, NO photos, NO code echo', async () => {
    const withLink = { ...SAMPLE, galleryLink: 'https://skgarts.com/gallery/manohar-portfolio' };
    const r = await galleryAccessCore({ code: 'secret123' }, mockData(withLink, [withLink]));
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.mode).toBe('resolve');
    expect(r.body.slug).toBe('manohar-portfolio');
    expect(r.body.galleryLink).toBe('https://skgarts.com/gallery/manohar-portfolio');
    // Must not leak photos or the code
    expect(r.body.photos).toBeUndefined();
    expect(JSON.stringify(r.body)).not.toContain('secret123');
    expect(JSON.stringify(r.body)).not.toContain('photo_1');
  });

  it('wrong code with no slug/id returns 401 and reveals nothing', async () => {
    const r = await galleryAccessCore({ code: 'nope' }, mockData(SAMPLE, [SAMPLE]));
    expect(r.status).toBe(401);
    expect(r.body.slug).toBeUndefined();
    expect(JSON.stringify(r.body)).not.toContain('manohar-portfolio');
  });

  it('picks the correct gallery out of several by code', async () => {
    const a = { ...SAMPLE, _id: 'a', slug: 'alpha', accessCode: 'code-a' };
    const b = { ...SAMPLE, _id: 'b', slug: 'bravo', accessCode: 'code-b' };
    const r = await galleryAccessCore({ code: 'code-b' }, mockData(a, [a, b]));
    expect(r.status).toBe(200);
    expect(r.body.slug).toBe('bravo');
  });

  it('400 when neither identifier nor code is supplied', async () => {
    const r = await galleryAccessCore({}, mockData(SAMPLE));
    expect(r.status).toBe(400);
  });
});

describe('galleryListCore', () => {
  it('returns only safe fields — never accessCode or media contents', async () => {
    const r = await galleryListCore(mockData(SAMPLE, [SAMPLE]));
    expect(r.status).toBe(200);
    expect(r.body.galleries).toHaveLength(1);
    const entry = r.body.galleries[0];
    expect(entry.clientName).toBe('Manohar Portfolio');
    expect(entry.slug).toBe('manohar-portfolio');
    expect(entry.photoCount).toBe(3);
    expect(entry.hasCode).toBe(true);
    // Whitelist check: the serialized entry must not contain sensitive data
    const serialized = JSON.stringify(entry);
    expect(serialized).not.toContain('secret123');
    expect(serialized).not.toContain('photo_1');
    expect(serialized).not.toContain('mediagallery');
    expect((entry as any).accessCode).toBeUndefined();
  });

  it('photoCount is 0 when mediagallery is missing', async () => {
    const bare: RawGallery = { _id: 'x', slug: 's', clientName: 'C' };
    const r = await galleryListCore(mockData(bare, [bare]));
    expect(r.body.galleries[0].photoCount).toBe(0);
    expect(r.body.galleries[0].hasCode).toBe(false);
  });
});

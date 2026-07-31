import { auth } from '@wix/essentials';
import { files } from '@wix/media';
import type { APIRoute } from 'astro';

/**
 * Uploads an image to Wix Media and returns its URL.
 *
 * Uses the `@wix/media` SDK directly — the same pattern as the working
 * `@wix/data` calls in BaseCrudService. Authentication is handled by the
 * Wix Astro integration (`wix({ auth: true })` in astro.config.mjs), so we
 * do NOT create a client manually (the old getWixClient() approach failed
 * with "getWixClient is not a function").
 *
 * Flow: generate a resumable/simple upload URL for the file, then PUT the
 * bytes to it. Wix returns the stored file descriptor (incl. its URL).
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return json({ error: 'No file provided' }, 400);
    }

    // DEBUG — inspect what actually arrived at the server
    const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const magic = Array.from(head).map((b) => b.toString(16).padStart(2, '0')).join(' ');
    console.log('UPLOAD DEBUG:', { name: file.name, type: file.type, size: file.size, firstBytes: magic });
    // A real JPEG starts with "ff d8 ff"; PNG with "89 50 4e 47".

    const rawType = file.type || 'image/jpeg';
    // Map mime -> canonical extension Wix recognizes
    const extByMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = extByMime[rawType.toLowerCase()] || 'jpg';
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

    // Build a clean, safe filename with exactly ONE correct extension.
    // Wix rejects names with spaces, odd characters, or double extensions
    // (UNSUPPORTED_FILE_FORMAT). e.g. "Manohar_portfolio - 001.jpg" -> "manohar_portfolio-001.jpg"
    const base = (file.name || 'photo')
      .replace(/\.[^.]+$/, '')          // strip existing extension
      .normalize('NFKD')
      .replace(/[^\w-]+/g, '-')          // spaces/punctuation -> hyphen
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 60) || 'photo';
    const fileName = `${base}-${Date.now().toString(36)}.${ext}`;

    // 1) Generate an upload URL — elevated so the server route is authorized to
    // write to Wix Media (default visitor identity gets 403 PERMISSION_DENIED).
    const elevatedGenerateUploadUrl = auth.elevate(files.generateFileUploadUrl);
    const { uploadUrl } = await elevatedGenerateUploadUrl(mimeType, {
      fileName,
      private: false,
    });

    if (!uploadUrl) {
      return json({ error: 'Could not obtain an upload URL from Wix Media' }, 500);
    }

    // 2) PUT the raw bytes to the returned upload URL.
    const buffer = await file.arrayBuffer();
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
      body: buffer,
    });

    if (!putRes.ok) {
      const text = await putRes.text().catch(() => '');
      return json({ error: 'Upload to Wix Media failed', details: text || `status ${putRes.status}` }, 500);
    }

    // 3) The PUT response contains the created file descriptor.
    const uploaded = await putRes.json().catch(() => null);
    const descriptor = uploaded?.file ?? uploaded;
    const url: string | undefined = descriptor?.url;

    if (!url) {
      return json({ error: 'Upload succeeded but no URL was returned', details: JSON.stringify(uploaded) }, 500);
    }

    return json({ url, fileId: descriptor?.id ?? descriptor?._id ?? null }, 200);
  } catch (error) {
    console.error('Media upload error:', error);
    return json(
      { error: 'Failed to upload media', details: error instanceof Error ? error.message : 'Unknown error' },
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

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

    const mimeType = file.type || 'image/jpeg';
    const fileName = file.name || `upload-${Date.now()}.jpg`;

    // 1) Ask Wix Media for an upload URL for this file.
    const { uploadUrl } = await files.generateFileUploadUrl(mimeType, {
      fileName,
      // store uploads from this app under a predictable folder
      parentFolderId: 'visitor-uploads',
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

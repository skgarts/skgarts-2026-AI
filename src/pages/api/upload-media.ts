import { files } from '@wix/media';
import { auth } from '@wix/essentials';
import type { APIRoute } from 'astro';

/**
 * Uploads an image to Wix Media and returns its URL.
 *
 * AUTHORIZATION FIX:
 * - Uses auth.elevate() to grant the API route elevated permissions for media uploads
 * - This is required because server-side media operations need app-level authorization
 * - The elevated identity has permission to write to Wix Media Manager
 *
 * Flow: 
 * 1. Elevate permissions with auth.elevate()
 * 2. Generate an upload URL from Wix Media
 * 3. PUT the file bytes to that URL
 * 4. Return the stored file's URL
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

    // 1) Elevate permissions for this operation
    const elevatedAuth = auth.elevate();

    // 2) Ask Wix Media for an upload URL for this file (using elevated auth)
    const { uploadUrl } = await elevatedAuth.files.generateFileUploadUrl(mimeType, {
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

import type { APIRoute } from 'astro';
import { getWixClient } from '@wix/codegen-framework-packages';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get Wix client
    const wixClient = getWixClient();

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Upload to Wix Media
    const uploadResponse = await wixClient.mediaManager.upload({
      resource: {
        filename: file.name,
        mimeType: file.type,
      },
      mediaOptions: {
        mediaType: 'image',
      },
      file: uint8Array,
    });

    if (!uploadResponse.file?.url) {
      throw new Error('Upload failed - no URL returned');
    }

    return new Response(
      JSON.stringify({
        url: uploadResponse.file.url,
        fileId: uploadResponse.file.id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Media upload error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to upload media',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

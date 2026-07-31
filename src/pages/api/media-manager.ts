import { auth } from '@wix/essentials';
import { files } from '@wix/media';
import type { APIRoute } from 'astro';

/**
 * Media Manager API endpoint
 * Retrieves available media files from Wix Media
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { multiSelect = true, mediaTypes = ['image'] } = body;

    // Get the elevated files API
    const listFiles = auth.elevate(files.listFiles);

    // Fetch files from Wix Media
    const result = await listFiles({
      limit: 100,
      sort: 'CREATED_DESC',
    });

    // Filter files based on media types
    const filteredFiles = (result?.files || [])
      .filter((file: any) => {
        if (!mediaTypes.includes('image')) return false;
        const mimeType = file.mimeType || '';
        return mimeType.startsWith('image/');
      })
      .map((file: any) => ({
        id: file.id || file._id,
        filename: file.displayName || file.filename || 'Untitled',
        url: file.url || '',
        mediaType: file.mimeType,
        width: file.width,
        height: file.height,
      }));

    return new Response(
      JSON.stringify({
        files: multiSelect ? filteredFiles : filteredFiles.slice(0, 1),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Media manager error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch media',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

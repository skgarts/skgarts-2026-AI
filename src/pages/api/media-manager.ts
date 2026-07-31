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

    // Use elevated permissions to access files
    const elevatedListFiles = auth.elevate(files.listFiles);

    // Fetch files from Wix Media with pagination
    const result = await elevatedListFiles({
      limit: 100,
      sort: 'CREATED_DESC',
      fieldsets: ['FULL'],
    });

    // Filter and map files
    const filteredFiles = (result?.files || [])
      .filter((file: any) => {
        if (!mediaTypes.includes('image')) return false;
        const mimeType = file.mimeType || '';
        return mimeType.startsWith('image/');
      })
      .map((file: any) => {
        // Build the proper URL for the file
        const fileUrl = file.url || `https://static.wixstatic.com/media/${file.id}`;
        
        return {
          id: file.id,
          filename: file.displayName || file.filename || 'Untitled',
          url: fileUrl,
          mediaType: file.mimeType,
          width: file.width,
          height: file.height,
        };
      });

    return new Response(
      JSON.stringify({
        success: true,
        files: multiSelect ? filteredFiles : filteredFiles.slice(0, 1),
        total: filteredFiles.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Media manager error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch media files',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

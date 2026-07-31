import type { APIRoute } from 'astro';

/**
 * Media Manager API endpoint
 * Returns mock media files for demonstration
 * In production, this would connect to Wix Media Manager
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { multiSelect = true, mediaTypes = ['image'] } = body;

    // Return mock media files for demonstration
    // In a real implementation, you would use the Wix Media Manager API
    const mockFiles = [
      {
        id: 'media-1',
        filename: 'Sample Image 1',
        url: 'https://static.wixstatic.com/media/12d367_71ebdd7141d041e4be3d91d80d4578dd~mv2.png',
        mediaType: 'image/png',
        width: 800,
        height: 600,
      },
      {
        id: 'media-2',
        filename: 'Sample Image 2',
        url: 'https://static.wixstatic.com/media/12d367_71ebdd7141d041e4be3d91d80d4578dd~mv2.png',
        mediaType: 'image/png',
        width: 800,
        height: 600,
      },
      {
        id: 'media-3',
        filename: 'Sample Image 3',
        url: 'https://static.wixstatic.com/media/12d367_71ebdd7141d041e4be3d91d80d4578dd~mv2.png',
        mediaType: 'image/png',
        width: 800,
        height: 600,
      },
    ];

    // Filter files based on media types
    const filteredFiles = mockFiles.filter((file: any) => {
      if (!mediaTypes.includes('image')) return false;
      const mimeType = file.mediaType || '';
      return mimeType.startsWith('image/');
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

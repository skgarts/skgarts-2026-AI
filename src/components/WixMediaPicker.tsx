import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { X, Loader2, FolderOpen } from 'lucide-react';

interface WixMediaFile {
  id: string;
  filename: string;
  url: string;
  mediaType?: string;
  width?: number;
  height?: number;
}

interface SelectedMedia extends WixMediaFile {
  selected: boolean;
}

export default function WixMediaPicker() {
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const openMediaManager = async () => {
    setIsLoading(true);
    try {
      // Call the backend API to open Wix Media Manager
      const response = await fetch('/api/media-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          multiSelect: true,
          mediaTypes: ['image'],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch media files');
      }

      const result = await response.json();

      if (result.success && result.files && result.files.length > 0) {
        const newMedia: SelectedMedia[] = result.files.map((file: any) => ({
          id: file.id || crypto.randomUUID(),
          filename: file.filename || file.name || 'Untitled',
          url: file.url || '',
          mediaType: file.mediaType,
          width: file.width,
          height: file.height,
          selected: true,
        }));

        setSelectedMedia((prev) => [...prev, ...newMedia]);
      } else if (result.files && result.files.length === 0) {
        alert('No images found in your media library. Please upload some images first.');
      } else {
        throw new Error(result.error || 'No files returned from media manager');
      }
    } catch (error) {
      console.error('Error opening media manager:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to open media manager: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeMedia = (id: string) => {
    setSelectedMedia((prev) => prev.filter((media) => media.id !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-secondary/5 rounded-lg border border-secondary/10">
      <h2 className="font-heading text-3xl text-secondary mb-2">Media Manager</h2>
      <p className="font-paragraph text-secondary/70 mb-8">
        Select and manage images from your Wix Site Files. Click the button below to open the media manager and choose images to display.
      </p>

      {/* Open Media Manager Button */}
      <Button
        onClick={openMediaManager}
        disabled={isLoading}
        className="mb-8 bg-primary hover:bg-primary/90 text-background font-paragraph uppercase tracking-widest text-sm py-6 px-8 flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <FolderOpen className="h-4 w-4" />
            Open Media Manager
          </>
        )}
      </Button>

      {/* Selected Media Grid */}
      {selectedMedia.length > 0 && (
        <div className="space-y-8">
          <div>
            <h3 className="font-heading text-xl text-secondary mb-6">
              Selected Media ({selectedMedia.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedMedia.map((media) => (
                <div key={media.id} className="relative group">
                  <div className="relative overflow-hidden aspect-square bg-secondary/10 rounded-lg">
                    <Image
                      src={media.url}
                      alt={media.filename}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={() => removeMedia(media.id)}
                      className="absolute top-3 right-3 bg-accent-red hover:bg-accent-red/90 text-background p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <p className="font-paragraph text-xs text-secondary/70 truncate">
                      {media.filename}
                    </p>
                    {media.width && media.height && (
                      <p className="font-paragraph text-xs text-secondary/50">
                        {media.width} × {media.height}px
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Display URLs and File IDs for reference */}
          <div className="p-6 bg-background rounded-lg border border-secondary/10">
            <h4 className="font-heading text-sm text-secondary mb-4">Media Details:</h4>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {selectedMedia.map((media) => (
                <div key={media.id} className="space-y-2 pb-4 border-b border-secondary/10 last:border-b-0">
                  <div>
                    <p className="font-paragraph text-xs text-secondary/60 mb-1">File Name:</p>
                    <p className="font-paragraph text-xs text-secondary break-all">
                      {media.filename}
                    </p>
                  </div>
                  <div>
                    <p className="font-paragraph text-xs text-secondary/60 mb-1">File ID:</p>
                    <code className="font-mono text-xs bg-secondary/5 px-2 py-1 rounded text-secondary break-all">
                      {media.id}
                    </code>
                  </div>
                  <div>
                    <p className="font-paragraph text-xs text-secondary/60 mb-1">URL:</p>
                    <code className="font-mono text-xs bg-secondary/5 px-2 py-1 rounded text-secondary break-all">
                      {media.url}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedMedia.length === 0 && (
        <div className="text-center py-12 text-secondary/50">
          <p className="font-paragraph">No media selected yet. Click the button above to open the media manager.</p>
        </div>
      )}
    </div>
  );
}

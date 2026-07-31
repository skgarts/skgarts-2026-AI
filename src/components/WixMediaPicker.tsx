import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { X } from 'lucide-react';

interface SelectedMedia {
  url: string;
  fileId: string;
  fileName: string;
  width?: number;
  height?: number;
}

export default function WixMediaPicker() {
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const openWixMediaManager = async () => {
    try {
      // Import the Wix Media Manager SDK
      const { openMediaManager } = await import('@wix/sdk');

      // Open the native Wix Media Manager
      const result = await openMediaManager({
        multiSelect: true,
        mediaType: 'image',
      });

      if (result && result.items && result.items.length > 0) {
        const newMedia: SelectedMedia[] = result.items.map((item: any) => ({
          url: item.url || item.src || '',
          fileId: item.fileId || item.id || '',
          fileName: item.fileName || item.name || 'Image',
          width: item.width,
          height: item.height,
        }));

        setSelectedMedia((prev) => [...prev, ...newMedia]);
      }
    } catch (error) {
      console.error('Error opening Wix Media Manager:', error);
      // Fallback: Show alert if SDK not available
      alert(
        'Wix Media Manager is not available in this environment. Please ensure you are using this in a Wix site context.'
      );
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-secondary/5 rounded-lg border border-secondary/10">
      <h2 className="font-heading text-3xl text-secondary mb-2">Wix Media Manager</h2>
      <p className="font-paragraph text-secondary/70 mb-8">
        Select images from your Wix Media library. The selected images will be displayed below with their URLs and file IDs.
      </p>

      {/* Open Media Manager Button */}
      <Button
        onClick={openWixMediaManager}
        className="mb-8 bg-primary hover:bg-primary/90 text-background font-paragraph uppercase tracking-widest text-sm py-6 px-8"
      >
        Open Wix Media Manager
      </Button>

      {/* Selected Media Grid */}
      {selectedMedia.length > 0 && (
        <div className="space-y-8">
          <div>
            <h3 className="font-heading text-xl text-secondary mb-6">
              Selected Media ({selectedMedia.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedMedia.map((media, index) => (
                <div key={index} className="relative group">
                  <div className="relative overflow-hidden aspect-square bg-secondary/10 rounded-lg">
                    <Image
                      src={media.url}
                      alt={media.fileName}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-3 right-3 bg-accent-red hover:bg-accent-red/90 text-background p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <p className="font-paragraph text-xs text-secondary/70 truncate">
                      {media.fileName}
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
              {selectedMedia.map((media, index) => (
                <div key={index} className="space-y-2 pb-4 border-b border-secondary/10 last:border-b-0">
                  <div>
                    <p className="font-paragraph text-xs text-secondary/60 mb-1">File Name:</p>
                    <p className="font-paragraph text-xs text-secondary break-all">
                      {media.fileName}
                    </p>
                  </div>
                  <div>
                    <p className="font-paragraph text-xs text-secondary/60 mb-1">File ID:</p>
                    <code className="font-mono text-xs bg-secondary/5 px-2 py-1 rounded text-secondary break-all">
                      {media.fileId}
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
          <p className="font-paragraph">No media selected yet. Click the button above to open the Wix Media Manager.</p>
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { X } from 'lucide-react';

interface UploadedImage {
  url: string;
  fileId?: string;
  name: string;
}

export default function MediaPickerExample() {
  const [selectedImages, setSelectedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError('');
    const newImages: UploadedImage[] = [];

    try {
      // Upload each file sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-media', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Upload failed for ${file.name}`);
        }

        const data = await response.json();
        newImages.push({
          url: data.url,
          fileId: data.fileId,
          name: file.name,
        });
      }

      setSelectedImages((prev) => [...prev, ...newImages]);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'Failed to upload images'
      );
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-2xl font-heading font-bold mb-4">Media Picker Example</h2>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Open Picker Button */}
      <Button
        onClick={handleOpenPicker}
        disabled={isUploading}
        className="mb-6 bg-primary hover:bg-primary/90 text-white"
      >
        {isUploading ? (
          <>
            <LoadingSpinner className="mr-2 h-4 w-4" />
            Uploading...
          </>
        ) : (
          'Select Images'
        )}
      </Button>

      {/* Error Message */}
      {uploadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {uploadError}
        </div>
      )}

      {/* Selected Images Grid */}
      {selectedImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-heading font-semibold">
            Selected Images ({selectedImages.length})
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative group">
                <Image
                  src={image.url}
                  alt={image.name}
                  width={200}
                  height={200}
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="mt-2 text-xs text-gray-600 truncate">
                  {image.name}
                </div>
              </div>
            ))}
          </div>

          {/* Display URLs for reference */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Image URLs:</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {selectedImages.map((image, index) => (
                <div key={index} className="text-xs text-gray-700 break-all">
                  <span className="font-mono bg-gray-200 px-2 py-1 rounded">
                    {image.url}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedImages.length === 0 && !isUploading && (
        <div className="text-center py-8 text-gray-500">
          No images selected yet. Click "Select Images" to get started.
        </div>
      )}
    </div>
  );
}

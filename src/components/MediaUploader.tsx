import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { X, Loader2, Upload, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadedMedia {
  id: string;
  url: string;
  filename: string;
  uploadedAt: Date;
}

export default function MediaUploader() {
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is too large (max 10MB)`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-media', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || `Upload failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data.url) {
          throw new Error('No URL returned from server');
        }

        setUploadedMedia((prev) => [
          ...prev,
          {
            id: data.fileId || crypto.randomUUID(),
            url: data.url,
            filename: file.name,
            uploadedAt: new Date(),
          },
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(`Failed to upload ${file.name}: ${message}`);
        console.error('Upload error:', err);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  const removeMedia = (id: string) => {
    setUploadedMedia((prev) => prev.filter((media) => media.id !== id));
  };

  return (
    <div className="w-full space-y-6">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 transition-all ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-secondary/20 bg-secondary/5 hover:border-primary/50'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-heading text-lg text-secondary mb-1">
              Drag and drop your images here
            </p>
            <p className="font-paragraph text-sm text-secondary/60">
              or click the button below to select files
            </p>
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-primary hover:bg-primary/90 text-background font-paragraph text-sm py-2 px-6"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Select Images
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
          />
          <p className="font-paragraph text-xs text-secondary/50">
            Max 10MB per file • Supports JPG, PNG, WebP, GIF
          </p>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-accent-red/10 border border-accent-red/30 rounded-lg"
          >
            <AlertCircle className="h-5 w-5 text-accent-red flex-shrink-0" />
            <p className="font-paragraph text-sm text-accent-red">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-accent-red hover:text-accent-red/70"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Media Grid */}
      {uploadedMedia.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <h3 className="font-heading text-lg text-secondary mb-4">
              Uploaded Media ({uploadedMedia.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {uploadedMedia.map((media) => (
                <motion.div
                  key={media.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group"
                >
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
                    <p className="font-paragraph text-xs text-secondary/50">
                      {media.uploadedAt.toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Media URLs for Reference */}
          <div className="p-6 bg-background rounded-lg border border-secondary/10">
            <h4 className="font-heading text-sm text-secondary mb-4">Media URLs:</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {uploadedMedia.map((media) => (
                <div key={media.id} className="space-y-1">
                  <p className="font-paragraph text-xs text-secondary/60">{media.filename}</p>
                  <code className="font-mono text-xs bg-secondary/5 px-2 py-1 rounded text-secondary break-all block">
                    {media.url}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {uploadedMedia.length === 0 && !isUploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-secondary/50"
        >
          <p className="font-paragraph">No media uploaded yet.</p>
        </motion.div>
      )}
    </div>
  );
}

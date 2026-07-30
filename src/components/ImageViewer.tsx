import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Image } from '@/components/ui/image';

interface ImageViewerProps {
  src: string;
  alt?: string;
  title?: string;
}

// Remove Wix URL parameters to get the original full-resolution image
const getFullResolutionUrl = (url: string): string => {
  if (!url) return url;
  // Remove Wix transformation parameters
  return url.split('?')[0];
};

export function ImageViewer({ src, alt = '', title = '' }: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const fullResUrl = getFullResolutionUrl(src);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  return (
    <>
      {/* Clickable Image Container */}
      <div
        onClick={() => setIsOpen(true)}
        className="cursor-pointer hover:opacity-80 transition-opacity duration-200 select-none"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <Image
          src={src}
          alt={alt}
          className="w-full h-full"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {/* Full-Screen Viewer Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setIsOpen(false)}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
              aria-label="Close image viewer"
            >
              <X size={24} />
            </motion.button>

            {/* Image Container - Using raw img tag for full-size display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full flex items-center justify-center p-4 overflow-auto"
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
            >
              <Image src={fullResUrl} alt={alt} className="max-w-full max-h-full w-auto h-auto object-contain select-none" draggable={false} onContextMenu={(e) => e.preventDefault()} onLoad={() => setImageLoaded(true)} style={{ maxWidth: '100vw', maxHeight: '100vh' }} />
            </motion.div>

            {/* Title (if provided) */}
            {title && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-4 right-4 text-white text-center text-sm md:text-base"
              >
                {title}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

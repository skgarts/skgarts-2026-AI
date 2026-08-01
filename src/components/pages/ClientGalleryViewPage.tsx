import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { Input } from '@/components/ui/input';
import { ClientGalleries } from '@/entities';
import { BaseCrudService } from '@/integrations';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronLeft, ChevronRight, Lock, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

// Tiled "SKG Arts" watermark overlay (deters casual saving; note: screenshots
// cannot be fully blocked on the web — the watermark is the real deterrent).
function Watermark() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden"
      aria-hidden="true"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='160'><text x='50%' y='50%' fill='white' fill-opacity='0.16' font-size='22' font-family='Georgia, serif' font-style='italic' text-anchor='middle' transform='rotate(-30 130 80)'>SKG Arts</text></svg>\")",
        backgroundRepeat: 'repeat',
      }}
    />
  );
}

export default function ClientGalleryViewPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [gallery, setGallery] = useState<ClientGalleries | null>(null);
  const [photos, setPhotos] = useState<{ url: string; title?: string; description?: string }[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const showPrev = useCallback(
    () => setLightboxIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length)),
    [photos.length]
  );
  const showNext = useCallback(
    () => setLightboxIndex((i) => (i === null ? i : (i + 1) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') showPrev();
      else if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  useEffect(() => {
    loadGallery();
  }, [clientId]);

  const loadGallery = async () => {
    setIsLoading(true);
    try {
      if (!clientId) return;

      // Resolve the gallery by slug first (pretty URLs), then fall back to the
      // raw record id so any older /gallery/{uuid} links keep working.
      let galleryData: ClientGalleries | null = null;

      const all = await BaseCrudService.getAll<ClientGalleries>('clientgalleries');
      galleryData = all.items.find((g) => (g as any).slug === clientId) || null;

      if (!galleryData) {
        galleryData =
          all.items.find((g) => g._id === clientId) ||
          (await BaseCrudService.getById<ClientGalleries>('clientgalleries', clientId).catch(() => null));
      }

      if (!galleryData) {
        setError('Gallery not found');
        return;
      }
      setGallery(galleryData);

      // Photos now come from the native Wix CMS "Media Gallery" field (id: mediagallery),
      // bulk-added via Media Manager. Each item is usually a wix:image:// reference
      // or an object; normalize every item to a plain https URL the browser can render.
      const toUrl = (raw: any): string => {
        if (!raw) return '';
        // Object shapes Wix may return
        if (typeof raw === 'object') {
          raw = raw.src || raw.url || raw.image || raw.slug || raw.uri || '';
        }
        if (typeof raw !== 'string') return '';
        if (raw.startsWith('http')) return raw;
        if (raw.startsWith('wix:image://')) {
          // wix:image://v1/<mediaId>/<filename>#...  ->  static.wixstatic.com/media/<mediaId>
          const id = raw.replace('wix:image://v1/', '').split('/')[0].split('#')[0];
          return id ? `https://static.wixstatic.com/media/${id}` : '';
        }
        // Bare media id fallback
        return `https://static.wixstatic.com/media/${raw}`;
      };

      const mg = (galleryData as any).mediagallery;
      const items = Array.isArray(mg) ? mg : [];
      const normalized = items
        .map((it: any) => ({
          url: toUrl(typeof it === 'object' ? (it.src || it.url || it.image || it) : it),
          title: (typeof it === 'object' && (it.title || it.description)) || undefined,
          description: (typeof it === 'object' && it.description) || undefined,
        }))
        .filter((p) => p.url);

      setPhotos(normalized);
    } catch (error) {
      console.error('Error loading gallery:', error);
      setError('Gallery not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gallery?.accessCode && accessCode === gallery.accessCode) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid access code');
      setAccessCode('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!gallery || error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <section className="w-full max-w-[120rem] mx-auto px-6 lg:px-12 py-32 flex flex-col items-center justify-center min-h-screen">
          <AlertCircle size={48} className="text-accent-red mb-4" />
          <h1 className="font-heading text-4xl text-secondary mb-4">Gallery Not Found</h1>
          <p className="font-paragraph text-secondary/70">The gallery you're looking for doesn't exist or has been removed.</p>
        </section>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <section className="w-full max-w-[120rem] mx-auto px-6 lg:px-12 py-32 flex flex-col items-center justify-center min-h-screen">
          <div className="w-full max-w-md">
            <div className="text-center mb-12">
              <Lock size={48} className="text-primary mx-auto mb-4" />
              <h1 className="font-heading text-4xl text-secondary mb-4">
                {gallery.clientName}'s Gallery
              </h1>
              <p className="font-paragraph text-secondary/70">
                Enter the access code to view the gallery
              </p>
            </div>

            <form onSubmit={handleAccessCodeSubmit} className="space-y-6">
              <div>
                <Input
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter access code"
                  className="bg-white border border-secondary/20 rounded px-4 py-3 font-paragraph text-lg focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              {error && (
                <p className="text-accent-red font-paragraph text-sm">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full bg-primary text-background hover:bg-primary/90 font-paragraph uppercase tracking-widest text-sm py-3 rounded-none"
              >
                Access Gallery
              </Button>
            </form>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="w-full max-w-[120rem] mx-auto px-6 lg:px-12 py-32">
        <div className="mb-12">
          <h1 className="font-heading text-5xl lg:text-6xl text-secondary mb-4">
            {gallery.clientName}
          </h1>
          {gallery.eventDate && (
            <p className="font-paragraph text-secondary/60 mb-2">
              Event Date: {new Date(gallery.eventDate).toLocaleDateString()}
            </p>
          )}
          {gallery.description && (
            <p className="font-paragraph text-secondary/70 max-w-3xl">
              {gallery.description}
            </p>
          )}
        </div>

        {photos.length > 0 ? (
          <div
            className="[column-fill:_balance] columns-1 sm:columns-2 lg:columns-3 gap-4"
            style={{ columnGap: '1rem' }}
          >
            {photos.map((photo, index) => (
              <motion.button
                key={photo._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4) }}
                onClick={() => setLightboxIndex(index)}
                className="group relative mb-4 block w-full break-inside-avoid overflow-hidden bg-secondary/5"
                title="Click to view"
              >
                {photo.url && (
                  <>
                    <Image
                      src={photo.url}
                      alt={photo.title || 'Gallery photo'}
                      className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03] pointer-events-none"
                      width={800}
                    />
                    <Watermark />
                    <div className="absolute inset-0 z-20 bg-secondary/0 group-hover:bg-secondary/10 transition-colors duration-300" />
                  </>
                )}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-secondary/10">
            <p className="font-paragraph text-secondary/50">No photos in this gallery yet</p>
          </div>
        )}
      </section>

      {/* Fullscreen Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (dx > 50) showPrev();
            else if (dx < -50) showNext();
            touchStartX.current = null;
          }}
        >
          {/* Close */}
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-5 right-5 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X size={22} />
          </button>

          {/* Counter */}
          <span className="absolute top-6 left-6 z-30 font-paragraph text-sm text-white/70">
            {lightboxIndex + 1} / {photos.length}
          </span>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showPrev(); }}
              className="absolute left-3 md:left-6 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={26} />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-[92vw] max-h-[88vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <Image
                src={photos[lightboxIndex].url}
                alt={photos[lightboxIndex].title || 'Gallery photo'}
                className="max-w-[92vw] max-h-[82vh] w-auto h-auto object-contain pointer-events-none"
                width={1600}
              />
              <Watermark />
            </div>
            {(photos[lightboxIndex].title || photos[lightboxIndex].description) && (
              <div className="mt-3 text-center">
                {photos[lightboxIndex].title && (
                  <h3 className="font-heading text-lg text-white">{photos[lightboxIndex].title}</h3>
                )}
                {photos[lightboxIndex].description && (
                  <p className="font-paragraph text-sm text-white/70">{photos[lightboxIndex].description}</p>
                )}
              </div>
            )}
          </div>

          {/* Next */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showNext(); }}
              className="absolute right-3 md:right-6 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={26} />
            </button>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
}

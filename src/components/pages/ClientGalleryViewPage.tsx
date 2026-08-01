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

// A single lazy-loaded, watermarked, clickable photo tile.
type Photo = { id: string; thumb: string; url: string; title?: string; description?: string };

function PhotoTile({
  photo,
  index,
  onOpen,
  className = '',
  imgClassName = 'w-full h-auto',
  delay = 0,
}: {
  photo: Photo;
  index: number;
  onOpen: (i: number) => void;
  className?: string;
  imgClassName?: string;
  delay?: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay }}
      onClick={() => onOpen(index)}
      title="Click to view"
      className={`group relative block overflow-hidden bg-secondary/5 ${className}`}
    >
      <Image src={photo.thumb} alt={photo.title || 'Gallery photo'} loading="lazy" decoding="async" onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1'; }} style={{ opacity: 0, transition: 'opacity 0.5s ease' }} className={`object-cover transition-transform duration-500 group-hover:scale-[1.04] pointer-events-none ${imgClassName}`} />
      <Watermark />
      <div className="absolute inset-0 z-20 bg-secondary/0 group-hover:bg-secondary/10 transition-colors duration-300" />
    </motion.button>
  );
}

// --- Layout: Masonry (Pinterest columns) ---
function MasonryLayout({ photos, onOpen }: { photos: Photo[]; onOpen: (i: number) => void }) {
  return (
    <div className="[column-fill:_balance] columns-1 sm:columns-2 lg:columns-3 gap-4" style={{ columnGap: '1rem' }}>
      {photos.map((p, i) => (
        <PhotoTile key={p.id} photo={p} index={i} onOpen={onOpen} delay={Math.min(i * 0.03, 0.5)}
          className="mb-4 w-full break-inside-avoid" imgClassName="w-full h-auto" />
      ))}
    </div>
  );
}

// --- Layout: Uniform Grid (equal squares) ---
function GridLayout({ photos, onOpen }: { photos: Photo[]; onOpen: (i: number) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {photos.map((p, i) => (
        <PhotoTile key={p.id} photo={p} index={i} onOpen={onOpen} delay={Math.min(i * 0.02, 0.4)}
          className="aspect-square" imgClassName="w-full h-full" />
      ))}
    </div>
  );
}

// --- Layout: Justified rows (shared row height, flexbox approximation) ---
function JustifiedLayout({ photos, onOpen }: { photos: Photo[]; onOpen: (i: number) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {photos.map((p, i) => (
        <PhotoTile key={p.id} photo={p} index={i} onOpen={onOpen} delay={Math.min(i * 0.02, 0.4)}
          className="h-48 md:h-64 flex-grow" imgClassName="w-full h-full" />
      ))}
    </div>
  );
}

// --- Layout: Collage (mosaic with some spanning tiles) ---
function CollageLayout({ photos, onOpen }: { photos: Photo[]; onOpen: (i: number) => void }) {
  // Deterministic pattern: every 5th image spans 2 cols, every 7th spans 2 rows.
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] md:auto-rows-[220px] gap-3">
      {photos.map((p, i) => {
        const wide = i % 5 === 0;
        const tall = i % 7 === 3;
        const span = `${wide ? 'md:col-span-2' : ''} ${tall ? 'row-span-2' : ''}`.trim();
        return (
          <PhotoTile key={p.id} photo={p} index={i} onOpen={onOpen} delay={Math.min(i * 0.02, 0.4)}
            className={`${span}`} imgClassName="w-full h-full" />
        );
      })}
    </div>
  );
}

// --- Layout: Hero + grid (first image large, rest flow) ---
function HeroLayout({ photos, onOpen }: { photos: Photo[]; onOpen: (i: number) => void }) {
  const [first, ...rest] = photos;
  return (
    <div className="space-y-4">
      {first && (
        <PhotoTile photo={first} index={0} onOpen={onOpen}
          className="w-full max-h-[70vh]" imgClassName="w-full h-full max-h-[70vh]" />
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {rest.map((p, i) => (
          <PhotoTile key={p.id} photo={p} index={i + 1} onOpen={onOpen} delay={Math.min(i * 0.02, 0.4)}
            className="aspect-square" imgClassName="w-full h-full" />
        ))}
      </div>
    </div>
  );
}

// --- Layout: Filmstrip (large featured + horizontal thumbnail strip) ---
function FilmstripLayout({ photos, onOpen }: { photos: Photo[]; onOpen: (i: number) => void }) {
  const [active, setActive] = useState(0);
  const current = photos[active] || photos[0];
  return (
    <div className="space-y-4">
      {/* Featured */}
      <div className="relative w-full bg-secondary/5 overflow-hidden">
        <button onClick={() => onOpen(active)} className="group relative block w-full" title="Click to view">
          <Image src={current.url} alt={current.title || 'Gallery photo'} loading="lazy" className="w-full max-h-[72vh] object-contain bg-black/5 pointer-events-none" />
          <Watermark />
        </button>
      </div>
      {/* Strip */}
      <div className="flex gap-3 overflow-x-auto pb-3">
        {photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActive(i)}
            className={`relative shrink-0 w-28 h-20 overflow-hidden transition-all ${
              active === i ? 'ring-2 ring-primary' : 'ring-1 ring-secondary/15 opacity-70 hover:opacity-100'
            }`}
            title={p.title || 'Photo'}
          >
            <Image src={p.thumb} alt="" loading="lazy" className="w-full h-full object-cover pointer-events-none" />
          </button>
        ))}
      </div>
    </div>
  );
}

function GalleryLayout({ layout, photos, onOpen }: { layout: string; photos: Photo[]; onOpen: (i: number) => void }) {
  switch ((layout || 'collage').toLowerCase()) {
    case 'masonry': return <MasonryLayout photos={photos} onOpen={onOpen} />;
    case 'grid': return <GridLayout photos={photos} onOpen={onOpen} />;
    case 'justified': return <JustifiedLayout photos={photos} onOpen={onOpen} />;
    case 'hero': return <HeroLayout photos={photos} onOpen={onOpen} />;
    case 'filmstrip': return <FilmstripLayout photos={photos} onOpen={onOpen} />;
    case 'collage':
    default: return <CollageLayout photos={photos} onOpen={onOpen} />;
  }
}

export default function ClientGalleryViewPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [gallery, setGallery] = useState<ClientGalleries | null>(null);
  const [photos, setPhotos] = useState<{ id: string; thumb: string; url: string; title?: string; description?: string }[]>([])
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

      // Photos come from the native Wix CMS "Media Gallery" field (id: mediagallery).
      // We resolve each item to a Wix media id, then build size-optimized URLs:
      //  - a small "grid" version (fast to load, right-sized for thumbnails)
      //  - a large "full" version only used in the lightbox.
      // This dramatically speeds up the grid vs. serving multi-MB originals.
      const toMediaId = (raw: any): string => {
        if (!raw) return '';
        if (typeof raw === 'object') {
          raw = raw.src || raw.url || raw.image || raw.slug || raw.uri || '';
        }
        if (typeof raw !== 'string') return '';
        if (raw.startsWith('wix:image://')) {
          return raw.replace('wix:image://v1/', '').split('/')[0].split('#')[0];
        }
        if (raw.startsWith('http')) {
          // Extract the media id from an existing static.wixstatic URL if present
          const m = raw.match(/\/media\/([^/?#]+)/);
          return m ? m[1] : '';
        }
        return raw; // assume it's already a bare media id
      };

      // Wix on-the-fly image service: /media/<id>/v1/fill/w_W,h_H,q_Q/file.jpg
      const wixSized = (id: string, w: number, h: number, q = 80) =>
        id
          ? `https://static.wixstatic.com/media/${id}/v1/fill/w_${w},h_${h},al_c,q_${q},enc_auto/file.jpg`
          : '';
      // Full media URL (original) for lightbox
      const wixFull = (id: string) => (id ? `https://static.wixstatic.com/media/${id}` : '');

      const mg = (galleryData as any).mediagallery;
      const items = Array.isArray(mg) ? mg : [];
      const normalized = items
        .map((it: any) => {
          const id = toMediaId(typeof it === 'object' ? (it.src || it.url || it.image || it) : it);
          return {
            id,
            thumb: wixSized(id, 800, 800, 80), // grid version
            url: wixFull(id),                  // lightbox version
            title: (typeof it === 'object' && (it.title || it.description)) || undefined,
            description: (typeof it === 'object' && it.description) || undefined,
          };
        })
        .filter((p) => p.id);

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
          <GalleryLayout
            layout={(gallery as any).displayLayout || 'collage'}
            photos={photos}
            onOpen={setLightboxIndex}
          />
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

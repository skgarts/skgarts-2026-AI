import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { Input } from '@/components/ui/input';
import { ClientGalleries } from '@/entities';
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

// --- Layout: Hero + grid ---
// If the gallery has a dedicated `hero` CMS image, use it as the large banner
// and show ALL photos in the grid below. Otherwise fall back to promoting the
// first photo as the banner (original behavior).
function HeroLayout({ photos, onOpen, heroUrl }: { photos: Photo[]; onOpen: (i: number) => void; heroUrl?: string }) {
  if (heroUrl) {
    return (
      <div className="space-y-4">
        <div className="relative w-full bg-secondary/5">
          <Image src={heroUrl} alt="Gallery hero" loading="eager" className="w-full h-auto block pointer-events-none" />
          <Watermark />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {photos.map((p, i) => (
            <PhotoTile key={p.id} photo={p} index={i} onOpen={onOpen} delay={Math.min(i * 0.02, 0.4)}
              className="aspect-square" imgClassName="w-full h-full" />
          ))}
        </div>
      </div>
    );
  }

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

function GalleryLayout({ layout, photos, onOpen, heroUrl }: { layout: string; photos: Photo[]; onOpen: (i: number) => void; heroUrl?: string }) {
  switch ((layout || 'collage').toLowerCase()) {
    case 'masonry': return <MasonryLayout photos={photos} onOpen={onOpen} />;
    case 'grid': return <GridLayout photos={photos} onOpen={onOpen} />;
    case 'justified': return <JustifiedLayout photos={photos} onOpen={onOpen} />;
    case 'hero': return <HeroLayout photos={photos} onOpen={onOpen} heroUrl={heroUrl} />;
    case 'filmstrip': return <FilmstripLayout photos={photos} onOpen={onOpen} />;
    case 'collage':
    default: return <CollageLayout photos={photos} onOpen={onOpen} />;
  }
}

export default function ClientGalleryViewPage() {
  const { clientId } = useParams<{ clientId: string }>();
  // `gallery` now holds only the safe metadata returned by the server endpoint
  // (client name for the gate; description/date/layout after unlock). Photos and
  // the access code are NEVER read on the client.
  const [gallery, setGallery] = useState<Partial<ClientGalleries> | null>(null);
  const [heroUrl, setHeroUrl] = useState<string>('');
  const [photos, setPhotos] = useState<{ id: string; thumb: string; url: string; title?: string; description?: string }[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
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

  // METADATA load: ask the server only for what the gate screen needs (client
  // name + whether a code is required). No photos and no access code ever reach
  // the browser here — that's what lets the `clientgalleries` collection read be
  // locked to Admin-only. Photos are fetched only after a correct code below.
  const loadGallery = async () => {
    setIsLoading(true);
    setError('');
    setNotFound(false);
    try {
      if (!clientId) {
        setNotFound(true);
        return;
      }
      const res = await fetch('/api/gallery-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // clientId may be a slug or a raw record id — send as both candidates.
        body: JSON.stringify({ slug: clientId, id: clientId }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 404 || (!data?.gallery && !data?.ok)) {
        setNotFound(true);
        return;
      }
      setGallery({ clientName: data.gallery?.clientName || '' });
    } catch (err) {
      console.error('Error loading gallery:', err);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  // UNLOCK: the code is validated on the SERVER. Photos are returned only on a
  // correct code; a wrong code yields a 401 and no images.
  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/gallery-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: clientId, id: clientId, code: accessCode }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.ok) {
        setPhotos(Array.isArray(data.photos) ? data.photos : []);
        setHeroUrl(data.gallery?.heroUrl || '');
        setGallery((prev) => ({
          ...(prev || {}),
          clientName: data.gallery?.clientName || prev?.clientName || '',
          description: data.gallery?.description || '',
          eventDate: data.gallery?.eventDate || undefined,
          displayLayout: data.gallery?.displayLayout || 'collage',
        }));
        setIsAuthenticated(true);
      } else if (res.status === 401) {
        setError('Incorrect access code. Please check it and try again.');
        setAccessCode('');
      } else {
        // Not a wrong-code case — surface it distinctly and log the server detail.
        console.error('Unlock failed:', res.status, data);
        setError('Something went wrong verifying the code. Please try again.');
      }
    } catch (err) {
      console.error('Error validating access code:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  if (!gallery || notFound) {
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
                disabled={isSubmitting || !accessCode.trim()}
                className="w-full bg-primary text-background hover:bg-primary/90 font-paragraph uppercase tracking-widest text-sm py-3 rounded-none disabled:opacity-50"
              >
                {isSubmitting ? 'Checking…' : 'Access Gallery'}
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
            heroUrl={heroUrl}
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

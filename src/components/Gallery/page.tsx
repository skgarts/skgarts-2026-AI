import { Image } from '@/components/ui/image';
import type { Photo } from '@/lib/gallery-core';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reusable photo gallery: 6 layouts (collage/masonry/justified/grid/hero/filmstrip),
 * a fullscreen lightbox with keyboard + swipe nav, lazy loading, Wix on-the-fly
 * resizing (via the pre-built Photo.thumb / Photo.url), and an optional tiled
 * watermark. Used by both the client-gallery viewer and the public service
 * galleries so they look and behave identically.
 *
 * Photos should already be normalized to { id, thumb, url, title?, description? }
 * — use buildPhotos() from '@/lib/gallery-core'.
 */
export default function PhotoGallery({
  photos,
  layout = 'collage',
  heroUrl,
  watermark = true,
}: {
  photos: Photo[];
  layout?: string;
  heroUrl?: string;
  watermark?: boolean;
}) {
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

  if (!photos || photos.length === 0) return null;

  const Mark = () => (watermark ? <Watermark /> : null);

  const Tile = ({
    photo,
    index,
    className = '',
    imgClassName = 'w-full h-auto',
    delay = 0,
  }: {
    photo: Photo;
    index: number;
    className?: string;
    imgClassName?: string;
    delay?: number;
  }) => (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay }}
      onClick={() => setLightboxIndex(index)}
      title="Click to view"
      className={`group relative block overflow-hidden bg-secondary/5 ${className}`}
    >
      <Image
        src={photo.thumb}
        alt={photo.title || 'Gallery photo'}
        loading="lazy"
        decoding="async"
        onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1'; }}
        style={{ opacity: 0, transition: 'opacity 0.5s ease' }}
        className={`object-cover transition-transform duration-500 group-hover:scale-[1.04] pointer-events-none ${imgClassName}`}
      />
      <Mark />
      <div className="absolute inset-0 z-20 bg-secondary/0 group-hover:bg-secondary/10 transition-colors duration-300" />
      {photo.title && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 bg-gradient-to-t from-black/65 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="font-paragraph text-xs md:text-sm text-white line-clamp-1">{photo.title}</span>
        </div>
      )}
    </motion.button>
  );

  const renderLayout = () => {
    switch ((layout || 'collage').toLowerCase()) {
      case 'masonry':
        return (
          <div className="[column-fill:_balance] columns-1 sm:columns-2 lg:columns-3 gap-4" style={{ columnGap: '1rem' }}>
            {photos.map((p, i) => (
              <Tile key={p.id} photo={p} index={i} delay={Math.min(i * 0.03, 0.5)} className="mb-4 w-full break-inside-avoid" imgClassName="w-full h-auto" />
            ))}
          </div>
        );
      case 'grid':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((p, i) => (
              <Tile key={p.id} photo={p} index={i} delay={Math.min(i * 0.02, 0.4)} className="aspect-square" imgClassName="w-full h-full" />
            ))}
          </div>
        );
      case 'justified':
        return (
          <div className="flex flex-wrap gap-3">
            {photos.map((p, i) => (
              <Tile key={p.id} photo={p} index={i} delay={Math.min(i * 0.02, 0.4)} className="h-48 md:h-64 flex-grow" imgClassName="w-full h-full" />
            ))}
          </div>
        );
      case 'hero':
        return <HeroLayout photos={photos} heroUrl={heroUrl} onOpen={setLightboxIndex} Tile={Tile} Mark={Mark} />;
      case 'filmstrip':
        return <FilmstripLayout photos={photos} onOpen={setLightboxIndex} Mark={Mark} />;
      case 'collage':
      default:
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] md:auto-rows-[220px] gap-3">
            {photos.map((p, i) => {
              const wide = i % 5 === 0;
              const tall = i % 7 === 3;
              const span = `${wide ? 'md:col-span-2' : ''} ${tall ? 'row-span-2' : ''}`.trim();
              return (
                <Tile key={p.id} photo={p} index={i} delay={Math.min(i * 0.02, 0.4)} className={span} imgClassName="w-full h-full" />
              );
            })}
          </div>
        );
    }
  };

  return (
    <>
      {renderLayout()}

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
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-5 right-5 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X size={22} />
          </button>

          <span className="absolute top-6 left-6 z-30 font-paragraph text-sm text-white/70">
            {lightboxIndex + 1} / {photos.length}
          </span>

          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showPrev(); }}
              className="absolute left-3 md:left-6 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={26} />
            </button>
          )}

          <div className="relative max-w-[92vw] max-h-[88vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <Image
                src={photos[lightboxIndex].url}
                alt={photos[lightboxIndex].title || 'Gallery photo'}
                className="max-w-[92vw] max-h-[82vh] w-auto h-auto object-contain pointer-events-none"
                width={1600}
              />
              <Mark />
            </div>
            {photos[lightboxIndex].title && (
              <div className="mt-3 text-center">
                <h3 className="font-heading text-lg text-white">{photos[lightboxIndex].title}</h3>
              </div>
            )}
          </div>

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
    </>
  );
}

// Tiled "SKG Arts" watermark overlay.
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

type TileComp = (props: { photo: Photo; index: number; className?: string; imgClassName?: string; delay?: number }) => JSX.Element;
type MarkComp = () => JSX.Element | null;

function HeroLayout({
  photos,
  heroUrl,
  onOpen,
  Tile,
  Mark,
}: {
  photos: Photo[];
  heroUrl?: string;
  onOpen: (i: number) => void;
  Tile: TileComp;
  Mark: MarkComp;
}) {
  const idFromUrl = (u?: string) => {
    const m = (u || '').match(/\/media\/([^/?#]+)/);
    return m ? m[1] : '';
  };
  const fit = (id: string) =>
    id ? `https://static.wixstatic.com/media/${id}/v1/fit/w_2560,h_2560,q_90,enc_auto/file.jpg` : '';

  const heroId = idFromUrl(heroUrl);
  const [first, ...rest] = photos;
  const bannerSrc = heroId ? fit(heroId) : fit(first?.id || '');
  const gridPhotos = heroId ? photos : rest;

  return (
    <div className="space-y-4">
      {bannerSrc && (
        <div className="w-full flex justify-center bg-secondary/5">
          <button
            type="button"
            onClick={() => onOpen(heroId ? -1 : 0)}
            className={`relative block ${heroId ? 'cursor-default' : 'cursor-zoom-in'}`}
            aria-label="Gallery hero image"
            disabled={!!heroId}
          >
            <Image src={bannerSrc} alt="Gallery hero" loading="eager" className="max-h-[85vh] max-w-full w-auto h-auto block mx-auto pointer-events-none" />
            <Mark />
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {gridPhotos.map((p, i) => (
          <Tile key={p.id} photo={p} index={heroId ? i : i + 1} delay={Math.min(i * 0.02, 0.4)} className="aspect-square" imgClassName="w-full h-full" />
        ))}
      </div>
    </div>
  );
}

function FilmstripLayout({ photos, onOpen, Mark }: { photos: Photo[]; onOpen: (i: number) => void; Mark: MarkComp }) {
  const [active, setActive] = useState(0);
  const current = photos[active] || photos[0];
  return (
    <div className="space-y-4">
      <div className="relative w-full bg-secondary/5 overflow-hidden">
        <button onClick={() => onOpen(active)} className="group relative block w-full" title="Click to view">
          <Image src={current.url} alt={current.title || 'Gallery photo'} loading="lazy" className="w-full max-h-[72vh] object-contain bg-black/5 pointer-events-none" />
          <Mark />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActive(i)}
            className={`relative shrink-0 w-28 h-20 overflow-hidden transition-all ${active === i ? 'ring-2 ring-primary' : 'ring-1 ring-secondary/15 opacity-70 hover:opacity-100'}`}
            title={p.title || 'Photo'}
          >
            <Image src={p.thumb} alt="" loading="lazy" className="w-full h-full object-cover pointer-events-none" />
          </button>
        ))}
      </div>
    </div>
  );
}

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ClientGalleries } from '@/entities';
import { useMember } from '@/integrations';
import { motion } from 'framer-motion';
import { Check, Copy, Edit2, ExternalLink, Images, Plus, Power, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// Extract a bare Wix media id from a wix:image ref OR a static wixstatic URL.
function coverMediaId(u?: string): string {
  if (!u) return '';
  if (u.startsWith('wix:image://')) return u.replace('wix:image://v1/', '').split('/')[0].split('#')[0];
  const m = u.match(/\/media\/([^/?#]+)/);
  return m ? m[1] : '';
}
// Serve the cover scaled-to-FIT (aspect preserved, ~900px). We do NOT crop in the
// URL — the visible region is controlled by CSS (object-position for pan, transform
// scale for zoom), so the crop can be positioned and resized freely.
function coverFitUrl(u?: string): string {
  const id = coverMediaId(u);
  return id ? `https://static.wixstatic.com/media/${id}/v1/fit/w_900,h_900,q_85,enc_auto/file.jpg` : '';
}
// Parse "X,Y[,Z]" — X,Y are focal percentages (0-100), Z is zoom (>=1). Defaults
// to horizontal-center / upper area at 1x (good for standing portraits) when unset.
function parseFocal(s?: string): { x: number; y: number; zoom: number } {
  const [x, y, z] = (s || '').split(',').map((n) => parseFloat(n.trim()));
  return {
    x: Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : 50,
    y: Number.isFinite(y) ? Math.min(100, Math.max(0, y)) : 20,
    zoom: Number.isFinite(z) ? Math.min(4, Math.max(1, z)) : 1,
  };
}
// CSS style that reproduces the chosen crop (pan + zoom) inside an object-cover box.
function cropStyle(f: { x: number; y: number; zoom: number }) {
  return {
    objectPosition: `${f.x}% ${f.y}%`,
    transform: `scale(${f.zoom})`,
    transformOrigin: `${f.x}% ${f.y}%`,
  } as const;
}

function GalleryManagementContent() {
  const { isAuthenticated, actions } = useMember();
  const [galleries, setGalleries] = useState<ClientGalleries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<ClientGalleries | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [focal, setFocal] = useState<{ x: number; y: number; zoom: number }>({ x: 50, y: 20, zoom: 1 });
  const [editCover, setEditCover] = useState<string>(''); // cover URL of the gallery being edited
  const focalBoxRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<{ px: number; py: number; fx: number; fy: number; w: number; h: number } | null>(null);
  const [formData, setFormData] = useState({
    clientName: '',
    description: '',
    eventDate: '',
    slug: '',
    displayLayout: 'collage',
  });

  const LAYOUT_OPTIONS = [
    { value: 'collage', label: 'Collage (mosaic)' },
    { value: 'masonry', label: 'Masonry (columns)' },
    { value: 'justified', label: 'Justified rows' },
    { value: 'grid', label: 'Uniform grid' },
    { value: 'hero', label: 'Hero + grid' },
    { value: 'filmstrip', label: 'Filmstrip' },
  ];

  // Turn a title into a URL-safe slug: "Sushen Upanayanam!" -> "sushen-upanayanam"
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  useEffect(() => {
    loadGalleries();
  }, []);

  // Listing comes from the public-safe /api/gallery-list endpoint. It returns
  // only non-sensitive fields (name, slug, cover, layout, photo COUNT, dates) —
  // never the access code or the media-gallery contents. This keeps the grid
  // working for signed-out visitors even when the `clientgalleries` collection
  // read is locked to Admin-only, without leaking any client photos.
  const loadGalleries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gallery-list');
      const data = await res.json().catch(() => ({}));
      setGalleries(Array.isArray(data?.galleries) ? data.galleries : []);
    } catch (error) {
      console.error('Error loading galleries:', error);
      setGalleries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (gallery?: ClientGalleries) => {
    setSaveError('');
    if (gallery) {
      setEditingGallery(gallery);
      setFocal(parseFocal((gallery as any).coverFocal));
      setEditCover((gallery as any).coverImage || '');
      setFormData({
        clientName: gallery.clientName || '',
        description: gallery.description || '',
        eventDate: gallery.eventDate ? new Date(gallery.eventDate).toISOString().split('T')[0] : '',
        slug: (gallery as any).slug || '',
        displayLayout: (gallery as any).displayLayout || 'collage',
      });
    } else {
      setEditingGallery(null);
      setFocal({ x: 50, y: 20 });
      setEditCover('');
      setFormData({ clientName: '', description: '', eventDate: '', slug: '', displayLayout: 'collage' });
    }
    setIsDialogOpen(true);
  };

  // Grab-and-drag panning of the cover within the crop frame.
  const startPan = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = { px: e.clientX, py: e.clientY, fx: focal.x, fy: focal.y, w: rect.width, h: rect.height };
  };
  const movePan = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1 || !dragStart.current) return;
    const d = dragStart.current;
    const dxPct = ((e.clientX - d.px) / d.w) * 100;
    const dyPct = ((e.clientY - d.py) / d.h) * 100;
    setFocal((f) => ({
      ...f,
      x: Math.min(100, Math.max(0, d.fx - dxPct)),
      y: Math.min(100, Math.max(0, d.fy - dyPct)),
    }));
  };

  const handleSave = async () => {
    setSaveError('');
    setIsSaving(true);
    try {
      // Use provided slug, or generate one from the client name. Keep it unique.
      let slug = formData.slug ? slugify(formData.slug) : slugify(formData.clientName);
      if (slug) {
        const clash = galleries.find(
          (g) => (g as any).slug === slug && g._id !== (editingGallery?._id || '')
        );
        if (clash) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      }

      const galleryData: Record<string, any> = {
        _id: editingGallery ? editingGallery._id : crypto.randomUUID(),
        clientName: formData.clientName,
        description: formData.description,
        eventDate: formData.eventDate ? new Date(formData.eventDate).toISOString() : undefined,
        slug,
        displayLayout: formData.displayLayout,
        coverFocal: `${Math.round(focal.x)},${Math.round(focal.y)},${focal.zoom.toFixed(2)}`,
      };

      const res = await fetch('/api/gallery-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: editingGallery ? 'update' : 'create', data: galleryData }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result?.ok) {
        const extra = result?.detected ? ` (signed in as ${result.detected})` : '';
        throw new Error((result?.error || 'Save failed') + extra);
      }

      setIsDialogOpen(false);
      await loadGalleries();
    } catch (error) {
      console.error('Error saving gallery:', error);
      setSaveError(
        (error instanceof Error ? error.message : String(error)) ||
        'Could not save. You may not have permission to edit this collection.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (galleryId: string) => {
    if (!confirm('Delete this gallery? This removes the album record (your photos in the Media Manager are not deleted).')) {
      return;
    }
    try {
      const res = await fetch('/api/gallery-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', data: { _id: galleryId } }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result?.ok) {
        throw new Error(result?.error || 'Delete failed');
      }
      await loadGalleries();
    } catch (error) {
      console.error('Error deleting gallery:', error);
      alert(`Could not delete: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const getGalleryLink = (gallery: ClientGalleries) => {
    const baseUrl = window.location.origin;
    const idOrSlug = (gallery as any).slug || gallery._id;
    return `${baseUrl}/gallery/${idOrSlug}`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Photo count comes straight from the list endpoint (a bare number). The grid
  // never receives the media-gallery contents, so we don't compute this from
  // `mediagallery` anymore.
  const photoCount = (gallery: ClientGalleries) => {
    const c = (gallery as any).photoCount;
    return typeof c === 'number' ? c : 0;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="w-full max-w-[120rem] mx-auto px-6 lg:px-12 pt-32 lg:pt-40 pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <h1 className="font-heading text-5xl lg:text-7xl text-secondary leading-none mb-4">
              Galleries
            </h1>
            <p className="font-paragraph text-secondary/60 max-w-xl">
              {isAuthenticated
                ? 'Your client albums. Manage album details and shareable links here; add photos natively in the Wix CMS “Media Gallery” field.'
                : 'Browse our client galleries. Select an album and enter your access code to view the photos.'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isAuthenticated && (
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-primary text-background hover:bg-primary/90 font-paragraph text-sm uppercase tracking-widest px-8 py-6 rounded-none flex items-center gap-2"
              >
                <Plus size={16} />
                New Gallery
              </Button>
            )}
            {/* Admin toggle: red = signed out (click to sign in), green = signed in (click to sign out) */}
            <button
              onClick={() => (isAuthenticated ? actions.logout() : actions.login())}
              title={isAuthenticated ? 'Sign out of admin mode' : 'Sign in to manage galleries'}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm transition-colors shrink-0 ${
                isAuthenticated
                  ? 'bg-[#1FA35A] hover:bg-[#188a4a] text-white'
                  : 'bg-[#ED1B23] hover:bg-[#c8151c] text-white'
              }`}
            >
              <Power size={18} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : galleries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-secondary/10 text-center">
            <Images size={40} className="text-secondary/30 mb-4" />
            <p className="font-paragraph text-secondary/50 mb-6">No galleries yet.</p>
            {isAuthenticated && (
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-primary text-background hover:bg-primary/90 font-paragraph text-sm uppercase tracking-widest px-8 py-4 rounded-none"
              >
                Create your first gallery
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleries.map((gallery, index) => {
              const cover = (gallery as any).coverImage as string | undefined;
              const count = photoCount(gallery);
              const link = getGalleryLink(gallery);
              const idOrSlug = (gallery as any).slug || gallery._id;
              const path = `/gallery/${idOrSlug}`; // relative path for client-side navigation
              const prettyUrl = `https://skgarts.com/gallery/${idOrSlug}`;
              return (
                <motion.div
                  key={gallery._id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
                  className="bg-white border border-secondary/10 flex flex-col"
                >
                  {/* Cover — locked to 16:10 so it matches the editor crop frame exactly */}
                  <div className="relative aspect-[16/10] bg-secondary/5 overflow-hidden">
                    {cover ? (
                      <Image src={coverFitUrl(cover)} alt={gallery.clientName || 'Gallery'} loading="lazy" className="w-full h-full object-cover" style={cropStyle(parseFocal((gallery as any).coverFocal))} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Images size={32} className="text-secondary/20" />
                      </div>
                    )}
                    <span className="absolute top-3 right-3 bg-secondary/70 text-background font-paragraph text-xs px-3 py-1 rounded-full">
                      {count} {count === 1 ? 'photo' : 'photos'}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-heading text-2xl text-secondary mb-1">{gallery.clientName}</h3>
                    {gallery.eventDate && (
                      <p className="font-paragraph text-xs text-secondary/40 mb-3">
                        {new Date(gallery.eventDate).toLocaleDateString()}
                      </p>
                    )}
                    {gallery.description && (
                      <p className="font-paragraph text-sm text-secondary/70 mb-4 line-clamp-2">
                        {gallery.description}
                      </p>
                    )}

                    {isAuthenticated ? (
                      <>
                        {/* Admin: shareable client link */}
                        <div className="bg-secondary/5 p-4 mb-4 mt-auto">
                          <div className="flex items-center gap-2">
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-paragraph text-xs text-primary truncate hover:underline flex-1"
                              title={prettyUrl}
                            >
                              {prettyUrl}
                            </a>
                            <button
                              onClick={() => copyToClipboard(prettyUrl, gallery._id)}
                              className="text-secondary/50 hover:text-primary transition-colors shrink-0"
                              title="Copy link"
                            >
                              {copiedId === gallery._id ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                            <Link
                              to={path}
                              className="text-secondary/50 hover:text-primary transition-colors shrink-0"
                              title="Open gallery"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          </div>
                        </div>

                        {/* Admin: actions */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleOpenDialog(gallery)}
                            className="flex-1 bg-secondary/10 text-secondary hover:bg-secondary/20 font-paragraph text-xs uppercase tracking-widest py-2 rounded-none flex items-center justify-center gap-2"
                          >
                            <Edit2 size={14} />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(gallery._id)}
                            className="flex-1 bg-[#ED1B23]/5 text-[#ED1B23] hover:bg-[#ED1B23]/10 font-paragraph text-xs uppercase tracking-widest py-2 rounded-none flex items-center justify-center gap-2"
                          >
                            <Trash2 size={14} />
                            Delete
                          </Button>
                        </div>
                      </>
                    ) : (
                      /* Visitor: single call-to-action into the album (code-gated) */
                      <Link
                        to={path}
                        className="mt-auto block w-full text-center bg-primary text-background hover:bg-primary/90 font-paragraph text-xs uppercase tracking-widest py-3 rounded-none transition-colors"
                      >
                        View Gallery
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {editingGallery ? 'Edit Gallery' : 'New Gallery'}
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <label className="font-paragraph text-xs uppercase tracking-widest text-secondary/60">
                Client / Gallery Name
              </label>
              <Input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="e.g. Manohar Portfolio"
                className="bg-transparent border-b border-secondary/20 rounded-none px-0 py-2 font-paragraph text-lg focus-visible:ring-0 focus-visible:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="font-paragraph text-xs uppercase tracking-widest text-secondary/60">
                Gallery URL slug
              </label>
              <Input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder={slugify(formData.clientName) || 'auto-generated-from-name'}
                className="bg-transparent border-b border-secondary/20 rounded-none px-0 py-2 font-paragraph text-lg focus-visible:ring-0 focus-visible:border-primary transition-colors"
              />
              <p className="font-paragraph text-xs text-secondary/50">
                Link: <span className="text-primary">/gallery/{slugify(formData.slug) || slugify(formData.clientName) || 'your-gallery'}</span> — leave blank to auto-generate.
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-paragraph text-xs uppercase tracking-widest text-secondary/60">
                Display Layout
              </label>
              <select
                value={formData.displayLayout}
                onChange={(e) => setFormData({ ...formData, displayLayout: e.target.value })}
                className="w-full bg-transparent border-b border-secondary/20 rounded-none px-0 py-2 font-paragraph text-lg focus:outline-none focus:border-primary transition-colors"
              >
                {LAYOUT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="font-paragraph text-xs text-secondary/50">
                How this client’s photos are arranged on their gallery page.
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-paragraph text-xs uppercase tracking-widest text-secondary/60">
                Event Date
              </label>
              <Input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="bg-transparent border-b border-secondary/20 rounded-none px-0 py-2 font-paragraph text-lg focus-visible:ring-0 focus-visible:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="font-paragraph text-xs uppercase tracking-widest text-secondary/60">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Short description of this session…"
                className="bg-transparent border border-secondary/20 rounded px-3 py-2 font-paragraph text-sm resize-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
              />
            </div>

            {editingGallery && (
              <div className="space-y-2">
                <label className="font-paragraph text-xs uppercase tracking-widest text-secondary/60">
                  Cover crop &amp; zoom
                </label>
                {editCover ? (
                  <>
                    <p className="font-paragraph text-xs text-secondary/50">
                      Drag inside the frame to reposition, and use the slider to zoom. This frame is exactly how the card cover will look.
                    </p>
                    {/* WYSIWYG crop frame — same aspect as the card cover */}
                    <div
                      ref={focalBoxRef}
                      onPointerDown={startPan}
                      onPointerMove={movePan}
                      className="relative w-full max-w-sm aspect-[16/10] overflow-hidden bg-secondary/5 border border-secondary/20 cursor-move select-none touch-none"
                    >
                      <Image src={coverFitUrl(editCover)} alt="Cover crop" className="w-full h-full object-cover pointer-events-none" style={cropStyle(focal)} />
                    </div>
                    {/* Zoom (resize) control */}
                    <div className="flex items-center gap-3 max-w-sm pt-1">
                      <span className="font-paragraph text-xs text-secondary/60 w-10">Zoom</span>
                      <input
                        type="range"
                        min={1}
                        max={4}
                        step={0.05}
                        value={focal.zoom}
                        onChange={(e) => setFocal((f) => ({ ...f, zoom: parseFloat(e.target.value) }))}
                        className="flex-1 accent-primary"
                      />
                      <span className="font-paragraph text-xs text-secondary/60 w-10 text-right">{focal.zoom.toFixed(1)}×</span>
                      <button
                        type="button"
                        onClick={() => setFocal({ x: 50, y: 20, zoom: 1 })}
                        className="font-paragraph text-xs text-primary hover:underline shrink-0"
                      >
                        Reset
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="font-paragraph text-xs text-secondary/50">
                    Set a <span className="font-semibold">Cover Image</span> on this gallery in the Wix CMS to enable crop positioning.
                  </p>
                )}
              </div>
            )}

            <div className="bg-primary/5 border border-primary/10 p-4 space-y-2">
              <p className="font-paragraph text-xs text-secondary/70">
                <span className="font-semibold text-secondary">Adding photos:</span> open this gallery&rsquo;s row in the
                Wix CMS &ldquo;Client Galleries&rdquo; collection and use the <span className="font-semibold">Media Gallery</span> field
                to bulk-select photos from your Media Manager.
              </p>
              <p className="font-paragraph text-xs text-secondary/70">
                <span className="font-semibold text-secondary">Access code:</span> set or change it in the CMS
                &ldquo;Access Code&rdquo; field. Clients must enter it to view the gallery; it is never shown on the page.
              </p>
            </div>

            {saveError && (
              <div className="bg-accent-red/5 border border-accent-red/20 p-3">
                <p className="font-paragraph text-xs text-accent-red">{saveError}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={!formData.clientName.trim() || isSaving}
                className="flex-1 bg-primary text-background hover:bg-primary/90 font-paragraph text-sm uppercase tracking-widest py-6 rounded-none disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : editingGallery ? 'Save Changes' : 'Create Gallery'}
              </Button>
              <Button
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
                className="bg-secondary/10 text-secondary hover:bg-secondary/20 font-paragraph text-sm uppercase tracking-widest px-8 py-6 rounded-none disabled:opacity-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

export default function GalleryManagementPage() {
  return <GalleryManagementContent />;
}

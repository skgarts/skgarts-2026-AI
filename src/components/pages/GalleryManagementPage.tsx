import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ClientGalleries } from '@/entities';
import { BaseCrudService, useMember } from '@/integrations';
import { motion } from 'framer-motion';
import { Check, Copy, Edit2, ExternalLink, Images, Plus, Power, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

function GalleryManagementContent() {
  const { isAuthenticated, actions } = useMember();
  const [galleries, setGalleries] = useState<ClientGalleries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<ClientGalleries | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  const loadGalleries = async () => {
    setIsLoading(true);
    try {
      const result = await BaseCrudService.getAll<ClientGalleries>('clientgalleries');
      setGalleries(result.items);
    } catch (error) {
      console.error('Error loading galleries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (gallery?: ClientGalleries) => {
    if (gallery) {
      setEditingGallery(gallery);
      setFormData({
        clientName: gallery.clientName || '',
        description: gallery.description || '',
        eventDate: gallery.eventDate ? new Date(gallery.eventDate).toISOString().split('T')[0] : '',
        slug: (gallery as any).slug || '',
        displayLayout: (gallery as any).displayLayout || 'collage',
      });
    } else {
      setEditingGallery(null);
      setFormData({ clientName: '', description: '', eventDate: '', slug: '', displayLayout: 'collage' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      // Use provided slug, or generate one from the client name. Keep it unique.
      let slug = formData.slug ? slugify(formData.slug) : slugify(formData.clientName);
      if (slug) {
        const clash = galleries.find(
          (g) => (g as any).slug === slug && g._id !== (editingGallery?._id || '')
        );
        if (clash) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      }

      if (editingGallery) {
        await BaseCrudService.update<ClientGalleries>('clientgalleries', {
          _id: editingGallery._id,
          clientName: formData.clientName,
          description: formData.description,
          eventDate: formData.eventDate ? new Date(formData.eventDate) : undefined,
          slug,
          displayLayout: formData.displayLayout,
        } as any);
      } else {
        await BaseCrudService.create<ClientGalleries>('clientgalleries', {
          _id: crypto.randomUUID(),
          clientName: formData.clientName,
          description: formData.description,
          eventDate: formData.eventDate ? new Date(formData.eventDate) : undefined,
          slug,
          displayLayout: formData.displayLayout,
        } as any);
      }

      setIsDialogOpen(false);
      await loadGalleries();
    } catch (error) {
      console.error('Error saving gallery:', error);
    }
  };

  const handleDelete = async (galleryId: string) => {
    if (!confirm('Delete this gallery? This removes the album record (your photos in the Media Manager are not deleted).')) {
      return;
    }
    try {
      await BaseCrudService.delete('clientgalleries', galleryId);
      await loadGalleries();
    } catch (error) {
      console.error('Error deleting gallery:', error);
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

  // Count of photos in the native Media Gallery field (field ID: mediagallery)
  const photoCount = (gallery: ClientGalleries) => {
    const mg = (gallery as any).mediagallery;
    return Array.isArray(mg) ? mg.length : 0;
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
              const prettyUrl = `https://skgarts.com/gallery/${idOrSlug}`;
              return (
                <motion.div
                  key={gallery._id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
                  className="bg-white border border-secondary/10 flex flex-col"
                >
                  {/* Cover */}
                  <div className="relative h-56 bg-secondary/5 overflow-hidden">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={gallery.clientName || 'Gallery'}
                        className="w-full h-full object-cover"
                        width={600}
                      />
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
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-secondary/50 hover:text-primary transition-colors shrink-0"
                              title="Open gallery"
                            >
                              <ExternalLink size={14} />
                            </a>
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
                      <a
                        href={link}
                        className="mt-auto block w-full text-center bg-primary text-background hover:bg-primary/90 font-paragraph text-xs uppercase tracking-widest py-3 rounded-none transition-colors"
                      >
                        View Gallery
                      </a>
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

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={!formData.clientName.trim()}
                className="flex-1 bg-primary text-background hover:bg-primary/90 font-paragraph text-sm uppercase tracking-widest py-6 rounded-none disabled:opacity-50"
              >
                {editingGallery ? 'Save Changes' : 'Create Gallery'}
              </Button>
              <Button
                onClick={() => setIsDialogOpen(false)}
                className="bg-secondary/10 text-secondary hover:bg-secondary/20 font-paragraph text-sm uppercase tracking-widest px-8 py-6 rounded-none"
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

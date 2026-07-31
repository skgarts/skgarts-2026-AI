import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Image } from '@/components/ui/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BaseCrudService } from '@/integrations';
import { ClientGalleries, GalleryPhotos } from '@/entities';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Upload, Link as LinkIcon, Copy, Check, Image as ImageIcon, X, Loader2 } from 'lucide-react';

function GalleryManagementContent() {
  const { member } = useMember();
  const [galleries, setGalleries] = useState<ClientGalleries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<ClientGalleries | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<GalleryPhotos[]>([]);
  const [isPhotosDialogOpen, setIsPhotosDialogOpen] = useState(false);
  const [selectedGalleryForPhotos, setSelectedGalleryForPhotos] = useState<ClientGalleries | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    description: '',
    accessCode: '',
    galleryLink: '',
    eventDate: '',
    slug: '',
  });

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

      // Load all photos
      const photosResult = await BaseCrudService.getAll<GalleryPhotos>('galleryphotos');
      setPhotos(photosResult.items);
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
        accessCode: gallery.accessCode || '',
        galleryLink: gallery.galleryLink || '',
        eventDate: gallery.eventDate ? new Date(gallery.eventDate).toISOString().split('T')[0] : '',
        slug: (gallery as any).slug || '',
      });
    } else {
      setEditingGallery(null);
      setFormData({
        clientName: '',
        description: '',
        accessCode: '',
        galleryLink: '',
        eventDate: '',
        slug: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveGallery = async () => {
    try {
      // Ensure gallery link has proper protocol
      let galleryLink = formData.galleryLink;
      if (galleryLink && !galleryLink.startsWith('http://') && !galleryLink.startsWith('https://')) {
        galleryLink = 'https://' + galleryLink;
      }

      // Use provided slug, or generate one from the client name. Keep it unique.
      let slug = formData.slug ? slugify(formData.slug) : slugify(formData.clientName);
      if (slug) {
        const clash = galleries.find(
          (g) => (g as any).slug === slug && g._id !== (editingGallery?._id || '')
        );
        if (clash) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      }

      if (editingGallery) {
        // Update existing gallery
        await BaseCrudService.update<ClientGalleries>('clientgalleries', {
          _id: editingGallery._id,
          clientName: formData.clientName,
          description: formData.description,
          accessCode: formData.accessCode,
          galleryLink: galleryLink,
          eventDate: formData.eventDate ? new Date(formData.eventDate) : undefined,
          slug: slug,
        } as any);
      } else {
        // Create new gallery
        await BaseCrudService.create<ClientGalleries>('clientgalleries', {
          _id: crypto.randomUUID(),
          clientName: formData.clientName,
          description: formData.description,
          accessCode: formData.accessCode,
          galleryLink: galleryLink,
          eventDate: formData.eventDate ? new Date(formData.eventDate) : undefined,
          slug: slug,
        } as any);
      }
      setIsDialogOpen(false);
      loadGalleries();
    } catch (error) {
      console.error('Error saving gallery:', error);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (confirm('Are you sure you want to delete this gallery?')) {
      try {
        await BaseCrudService.delete('clientgalleries', id);
        loadGalleries();
      } catch (error) {
        console.error('Error deleting gallery:', error);
      }
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

  const openPhotosDialog = (gallery: ClientGalleries) => {
    setSelectedGalleryForPhotos(gallery);
    setIsPhotosDialogOpen(true);
  };

  const getGalleryPhotos = (galleryId: string) => {
    return photos.filter(p => p.galleryId === galleryId);
  };

  // Downscale + re-encode an image in the browser to a clean JPEG. Always returns
  // a valid JPEG File, or throws (so we never silently upload un-encodable bytes).
  const compressImage = (file: File, maxDim = 2560, quality = 0.82): Promise<File> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        if (!width || !height) {
          URL.revokeObjectURL(url);
          reject(new Error('image has no dimensions'));
          return;
        }
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height / width) * maxDim);
            width = maxDim;
          } else {
            width = Math.round((width / height) * maxDim);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('canvas not available'));
          return;
        }
        // white background (JPEG has no alpha) then draw
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size === 0) {
              reject(new Error('could not encode image to JPEG'));
              return;
            }
            const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
            resolve(new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('could not decode image (unsupported or corrupt)'));
      };
      img.src = url;
    });

  // Upload one file to Wix Media via the /api/upload-media endpoint, return its URL
  const uploadOneFile = async (file: File): Promise<string> => {
    // Always re-encode to a clean JPEG. If this throws, we skip the file with a
    // clear reason rather than uploading bytes Wix will reject.
    const prepared = await compressImage(file);
    const body = new FormData();
    body.append('file', prepared, prepared.name);
    const res = await fetch('/api/upload-media', { method: 'POST', body });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      const sizeMb = (prepared.size / (1024 * 1024)).toFixed(1);
      if (res.status === 413) throw new Error(`still too large after compression (${sizeMb}MB)`);
      throw new Error(detail?.details || detail?.error || `Upload failed (${res.status})`);
    }
    const data = await res.json();
    if (!data?.url) throw new Error('Upload returned no URL');
    return data.url as string;
  };

  // Bulk upload: send many files, save each as a galleryphotos record
  const handleBulkUpload = async (fileList: FileList | File[]) => {
    if (!selectedGalleryForPhotos) return;
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadErrors([]);
    setUploadProgress({ done: 0, total: files.length });

    const errors: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const url = await uploadOneFile(file);
        await BaseCrudService.create<GalleryPhotos>('galleryphotos', {
          _id: crypto.randomUUID(),
          title: file.name.replace(/\.[^.]+$/, ''),
          imageFile: url,
          galleryId: selectedGalleryForPhotos._id,
          uploadDate: new Date(),
        });
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : 'failed'}`);
      }
      setUploadProgress({ done: i + 1, total: files.length });
    }

    setUploadErrors(errors);
    setIsUploading(false);
    await loadGalleries(); // refresh photo list
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await BaseCrudService.delete('galleryphotos', photoId);
      await loadGalleries();
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) handleBulkUpload(e.dataTransfer.files);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="w-full max-w-[120rem] mx-auto px-6 lg:px-12 py-32">
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <h1 className="font-heading text-5xl lg:text-6xl text-secondary mb-4">
              Gallery Management
            </h1>
            <p className="font-paragraph text-secondary/70 max-w-2xl">
              Create, edit, and manage your client galleries. Add access codes and gallery links for your clients.
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-primary text-background hover:bg-primary/90 font-paragraph uppercase tracking-widest text-sm px-8 py-6 rounded-none flex items-center gap-2"
          >
            <Plus size={18} />
            New Gallery
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : galleries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleries.map((gallery, index) => (
              <motion.div
                key={gallery._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white border border-secondary/10 overflow-hidden hover:border-primary/30 transition-colors"
              >
                {gallery.coverImage && (
                  <div className="relative h-48 overflow-hidden bg-secondary/5">
                    <Image
                      src={gallery.coverImage}
                      alt={gallery.clientName || 'Gallery'}
                      className="w-full h-full object-cover"
                      width={400}
                    />
                  </div>
                )}

                <div className="p-6">
                  <h3 className="font-heading text-xl text-secondary mb-2">
                    {gallery.clientName || 'Untitled Gallery'}
                  </h3>

                  {gallery.eventDate && (
                    <p className="font-paragraph text-xs text-secondary/50 uppercase tracking-widest mb-3">
                      {new Date(gallery.eventDate).toLocaleDateString()}
                    </p>
                  )}

                  {gallery.description && (
                    <p className="font-paragraph text-sm text-secondary/70 mb-4 line-clamp-2">
                      {gallery.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-6 p-3 bg-secondary/5 rounded">
                    <p className="font-paragraph text-xs text-secondary/60">
                      <span className="font-semibold">Access Code:</span> {gallery.accessCode || 'N/A'}
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href={getGalleryLink(gallery)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-paragraph text-xs text-primary hover:text-primary/80 flex-1 truncate"
                      >
                        {getGalleryLink(gallery)}
                      </a>
                      <button
                        onClick={() => copyToClipboard(getGalleryLink(gallery), gallery._id)}
                        className="p-1 hover:bg-secondary/10 rounded transition-colors"
                        title="Copy gallery link"
                      >
                        {copiedId === gallery._id ? (
                          <Check size={14} className="text-accent-green" />
                        ) : (
                          <Copy size={14} className="text-secondary/60" />
                        )}
                      </button>
                    </div>
                    {gallery.galleryLink && (
                      <a
                        href={gallery.galleryLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-paragraph text-xs text-secondary/60 hover:text-primary break-all flex items-center gap-1"
                      >
                        <LinkIcon size={12} />
                        External Gallery →
                      </a>
                    )}
                  </div>

                  <Button
                    onClick={() => openPhotosDialog(gallery)}
                    className="w-full mb-2 bg-primary/10 text-primary hover:bg-primary/20 font-paragraph text-xs uppercase tracking-widest py-2 rounded-none flex items-center justify-center gap-2"
                  >
                    <ImageIcon size={14} />
                    Manage Photos ({getGalleryPhotos(gallery._id).length})
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleOpenDialog(gallery)}
                      className="flex-1 bg-secondary/10 text-secondary hover:bg-secondary/20 font-paragraph text-xs uppercase tracking-widest py-2 rounded-none flex items-center justify-center gap-2"
                    >
                      <Edit2 size={14} />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteGallery(gallery._id)}
                      className="flex-1 bg-[#ED1B23]/10 text-[#ED1B23] hover:bg-[#ED1B23]/20 font-paragraph text-xs uppercase tracking-widest py-2 rounded-none flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-secondary/10">
            <Upload size={48} className="text-secondary/30 mb-4" />
            <p className="font-paragraph text-secondary/50 mb-6">No galleries yet</p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-primary text-background hover:bg-primary/90 font-paragraph uppercase tracking-widest text-sm px-8 py-4 rounded-none"
            >
              Create Your First Gallery
            </Button>
          </div>
        )}
      </section>

      {/* Photos Management Dialog */}
      <Dialog open={isPhotosDialogOpen} onOpenChange={(open) => { setIsPhotosDialogOpen(open); if (!open) { setUploadErrors([]); setSelectedGalleryForPhotos(null); } }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Photos — {selectedGalleryForPhotos?.clientName || 'Gallery'}
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 space-y-8">
            {/* Dropzone */}
            <label
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg py-12 px-6 cursor-pointer transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-secondary/20 hover:border-primary/40'
              }`}
            >
              <Upload size={36} className="text-primary" />
              <p className="font-paragraph text-sm text-secondary">
                Drag &amp; drop photos here, or <span className="text-primary underline">browse</span>
              </p>
              <p className="font-paragraph text-xs text-secondary/50">
                Select multiple files — they upload to your Wix media and attach to this gallery.
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={isUploading}
                onChange={(e) => { if (e.target.files?.length) handleBulkUpload(e.target.files); e.currentTarget.value = ''; }}
              />
            </label>

            {/* Upload progress */}
            {isUploading && (
              <div className="flex items-center gap-3 text-secondary">
                <Loader2 size={18} className="animate-spin text-primary" />
                <span className="font-paragraph text-sm">
                  Uploading {uploadProgress.done} / {uploadProgress.total}…
                </span>
                <div className="flex-1 h-1.5 bg-secondary/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${uploadProgress.total ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Errors */}
            {uploadErrors.length > 0 && (
              <div className="bg-[#ED1B23]/5 border border-[#ED1B23]/20 rounded p-4">
                <p className="font-paragraph text-sm text-[#ED1B23] font-semibold mb-2">
                  {uploadErrors.length} file(s) failed to upload:
                </p>
                <ul className="font-paragraph text-xs text-[#ED1B23]/80 space-y-1 list-disc pl-5">
                  {uploadErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            {/* Existing photos grid */}
            {selectedGalleryForPhotos && (() => {
              const galleryPhotos = getGalleryPhotos(selectedGalleryForPhotos._id);
              return galleryPhotos.length > 0 ? (
                <div>
                  <p className="font-paragraph text-xs uppercase tracking-widest text-secondary/60 mb-4">
                    {galleryPhotos.length} photo{galleryPhotos.length === 1 ? '' : 's'} in this gallery
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {galleryPhotos.map((photo) => (
                      <div key={photo._id} className="relative group aspect-square bg-secondary/5 overflow-hidden rounded">
                        {photo.imageFile && (
                          <Image
                            src={photo.imageFile}
                            alt={photo.title || 'Photo'}
                            className="w-full h-full object-cover"
                            width={300}
                          />
                        )}
                        <button
                          onClick={() => handleDeletePhoto(photo._id)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-secondary/70 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#ED1B23]"
                          title="Delete photo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                !isUploading && (
                  <p className="font-paragraph text-sm text-secondary/50 text-center py-6">
                    No photos yet — upload some above.
                  </p>
                )
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {editingGallery ? 'Edit Gallery' : 'Create New Gallery'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <label className="font-paragraph text-xs uppercase tracking-widest text-secondary/60">
                Client Name
              </label>
              <Input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Enter client name"
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
                placeholder="Describe the gallery or event"
                rows={3}
                className="bg-transparent border-b border-secondary/20 rounded-none px-0 py-2 font-paragraph text-lg resize-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
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
                Your link: <span className="text-primary">/gallery/{slugify(formData.slug) || slugify(formData.clientName) || 'your-gallery'}</span> — leave blank to auto-generate from the client name.
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-paragraph text-xs uppercase tracking-widest text-secondary/60">
                Access Code
              </label>
              <Input
                type="text"
                value={formData.accessCode}
                onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                placeholder="e.g., WEDDING2024"
                className="bg-transparent border-b border-secondary/20 rounded-none px-0 py-2 font-paragraph text-lg focus-visible:ring-0 focus-visible:border-primary transition-colors"
              />
              <p className="font-paragraph text-xs text-secondary/50">
                Clients will use this code to access the gallery
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-paragraph text-xs uppercase tracking-widest text-secondary/60">
                Gallery Link
              </label>
              <Input
                type="url"
                value={formData.galleryLink}
                onChange={(e) => setFormData({ ...formData, galleryLink: e.target.value })}
                placeholder="https://your-gallery-link.com"
                className="bg-transparent border-b border-secondary/20 rounded-none px-0 py-2 font-paragraph text-lg focus-visible:ring-0 focus-visible:border-primary transition-colors"
              />
              <p className="font-paragraph text-xs text-secondary/50">
                Link to your hosted gallery (e.g., Pixieset, Zenfolio, etc.)
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

            <div className="flex gap-4 pt-6">
              <Button
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 bg-secondary/10 text-secondary hover:bg-secondary/20 font-paragraph uppercase tracking-widest text-sm py-3 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveGallery}
                className="flex-1 bg-primary text-background hover:bg-primary/90 font-paragraph uppercase tracking-widest text-sm py-3 rounded-none"
              >
                {editingGallery ? 'Update Gallery' : 'Create Gallery'}
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
  return (
    <MemberProtectedRoute messageToSignIn="Sign in to manage your galleries">
      <GalleryManagementContent />
    </MemberProtectedRoute>
  );
}

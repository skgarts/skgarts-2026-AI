import { useState, useEffect, useRef } from 'react';
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
import { Plus, Trash2, Edit2, Upload, Link as LinkIcon, Copy, Check, X } from 'lucide-react';

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
  const [uploadingPhotos, setUploadingPhotos] = useState<File[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    clientName: '',
    description: '',
    accessCode: '',
    galleryLink: '',
    eventDate: '',
  });

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
      });
    } else {
      setEditingGallery(null);
      setFormData({
        clientName: '',
        description: '',
        accessCode: '',
        galleryLink: '',
        eventDate: '',
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

      if (editingGallery) {
        // Update existing gallery
        await BaseCrudService.update<ClientGalleries>('clientgalleries', {
          _id: editingGallery._id,
          clientName: formData.clientName,
          description: formData.description,
          accessCode: formData.accessCode,
          galleryLink: galleryLink,
          eventDate: formData.eventDate ? new Date(formData.eventDate) : undefined,
        });
      } else {
        // Create new gallery
        await BaseCrudService.create<ClientGalleries>('clientgalleries', {
          _id: crypto.randomUUID(),
          clientName: formData.clientName,
          description: formData.description,
          accessCode: formData.accessCode,
          galleryLink: galleryLink,
          eventDate: formData.eventDate ? new Date(formData.eventDate) : undefined,
        });
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

  const getGalleryLink = (galleryId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/gallery/${galleryId}`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openPhotosDialog = (gallery: ClientGalleries) => {
    setSelectedGalleryForPhotos(gallery);
    setUploadingPhotos([]);
    setIsPhotosDialogOpen(true);
  };

  const getGalleryPhotos = (galleryId: string) => {
    return photos.filter(p => p.galleryId === galleryId);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadingPhotos([...uploadingPhotos, ...files]);
  };

  const removeUploadingPhoto = (index: number) => {
    setUploadingPhotos(uploadingPhotos.filter((_, i) => i !== index));
  };

  const uploadPhotosToGallery = async () => {
    if (!selectedGalleryForPhotos || uploadingPhotos.length === 0) return;

    setIsUploadingPhotos(true);
    try {
      for (const file of uploadingPhotos) {
        // Create FormData for file upload
        const formDataForUpload = new FormData();
        formDataForUpload.append('file', file);

        // Upload file to Wix Media
        const uploadResponse = await fetch('/api/upload-media', {
          method: 'POST',
          body: formDataForUpload,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        const uploadedData = await uploadResponse.json();
        const mediaUrl = uploadedData.url;

        // Save photo to database with Wix media URL
        await BaseCrudService.create<GalleryPhotos>('galleryphotos', {
          _id: crypto.randomUUID(),
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: '',
          imageFile: mediaUrl,
          galleryId: selectedGalleryForPhotos._id,
          uploadDate: new Date(),
        });
      }

      // Reload photos and close dialog
      const photosResult = await BaseCrudService.getAll<GalleryPhotos>('galleryphotos');
      setPhotos(photosResult.items);
      setUploadingPhotos([]);
      setIsPhotosDialogOpen(false);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (confirm('Delete this photo?')) {
      try {
        await BaseCrudService.delete('galleryphotos', photoId);
        const photosResult = await BaseCrudService.getAll<GalleryPhotos>('galleryphotos');
        setPhotos(photosResult.items);
      } catch (error) {
        console.error('Error deleting photo:', error);
      }
    }
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
                        href={getGalleryLink(gallery._id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-paragraph text-xs text-primary hover:text-primary/80 flex-1 truncate"
                      >
                        {getGalleryLink(gallery._id)}
                      </a>
                      <button
                        onClick={() => copyToClipboard(getGalleryLink(gallery._id), gallery._id)}
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
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleOpenDialog(gallery)}
                      className="flex-1 bg-secondary/10 text-secondary hover:bg-secondary/20 font-paragraph text-xs uppercase tracking-widest py-2 rounded-none flex items-center justify-center gap-2"
                    >
                      <Edit2 size={14} />
                      Edit
                    </Button>
                    <Button
                      onClick={() => openPhotosDialog(gallery)}
                      className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 font-paragraph text-xs uppercase tracking-widest py-2 rounded-none flex items-center justify-center gap-2"
                    >
                      <Upload size={14} />
                      Photos
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

      {/* Photos Upload Dialog */}
      <Dialog open={isPhotosDialogOpen} onOpenChange={setIsPhotosDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Upload Photos to {selectedGalleryForPhotos?.clientName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-secondary/10 text-secondary hover:bg-secondary/20 font-paragraph uppercase tracking-widest text-sm py-3 rounded-none flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Select Photos
              </Button>
            </div>

            {uploadingPhotos.length > 0 && (
              <div className="space-y-3">
                <p className="font-paragraph text-sm text-secondary/70">
                  {uploadingPhotos.length} photo(s) selected
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uploadingPhotos.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary/5 rounded">
                      <p className="font-paragraph text-sm text-secondary/70 truncate">
                        {file.name}
                      </p>
                      <button
                        onClick={() => removeUploadingPhoto(index)}
                        className="p-1 hover:bg-secondary/20 rounded transition-colors"
                      >
                        <X size={16} className="text-secondary/60" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <Button
                onClick={() => setIsPhotosDialogOpen(false)}
                className="flex-1 bg-secondary/10 text-secondary hover:bg-secondary/20 font-paragraph uppercase tracking-widest text-sm py-3 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={uploadPhotosToGallery}
                disabled={uploadingPhotos.length === 0 || isUploadingPhotos}
                className="flex-1 bg-primary text-background hover:bg-primary/90 disabled:opacity-50 font-paragraph uppercase tracking-widest text-sm py-3 rounded-none"
              >
                {isUploadingPhotos ? 'Uploading...' : 'Upload Photos'}
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

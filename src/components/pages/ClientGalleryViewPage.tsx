import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import { ClientGalleries, GalleryPhotos } from '@/entities';
import { Image } from '@/components/ui/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Lock, AlertCircle } from 'lucide-react';

export default function ClientGalleryViewPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [gallery, setGallery] = useState<ClientGalleries | null>(null);
  const [photos, setPhotos] = useState<GalleryPhotos[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadGallery();
  }, [clientId]);

  const loadGallery = async () => {
    setIsLoading(true);
    try {
      if (!clientId) return;
      const galleryData = await BaseCrudService.getById<ClientGalleries>('clientgalleries', clientId);
      setGallery(galleryData);
      
      // Load photos for this gallery
      const photosResult = await BaseCrudService.getAll<GalleryPhotos>('galleryphotos');
      const galleryPhotos = photosResult.items.filter(p => p.galleryId === clientId);
      setPhotos(galleryPhotos);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo, index) => (
              <motion.div
                key={photo._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="overflow-hidden bg-white border border-secondary/10 hover:border-primary/30 transition-colors"
              >
                {photo.imageFile && (
                  <div className="relative h-64 overflow-hidden bg-secondary/5">
                    <Image
                      src={photo.imageFile}
                      alt={photo.title || 'Gallery photo'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      width={400}
                    />
                  </div>
                )}
                {(photo.title || photo.description) && (
                  <div className="p-4">
                    {photo.title && (
                      <h3 className="font-heading text-lg text-secondary mb-2">
                        {photo.title}
                      </h3>
                    )}
                    {photo.description && (
                      <p className="font-paragraph text-sm text-secondary/70">
                        {photo.description}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-secondary/10">
            <p className="font-paragraph text-secondary/50">No photos in this gallery yet</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

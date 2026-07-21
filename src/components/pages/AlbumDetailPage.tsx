import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import { ClientGalleries } from '@/entities';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';

interface GalleryPhoto {
  _id: string;
  title?: string;
  description?: string;
  imageFile?: string;
  galleryId?: string;
  uploadDate?: Date | string;
}

export default function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [gallery, setGallery] = useState<ClientGalleries | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const loadGallery = async () => {
      if (!id) return;
      try {
        const galleryData = await BaseCrudService.getById<ClientGalleries>(
          'clientgalleries',
          id
        );
        setGallery(galleryData);
      } catch (error) {
        console.error('Failed to load gallery:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGallery();
  }, [id]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!gallery?.accessCode) {
      setPasswordError('Gallery configuration error');
      return;
    }

    if (passwordInput === gallery.accessCode) {
      setIsUnlocked(true);
      loadPhotos();
    } else {
      setPasswordError('Incorrect password. Please try again.');
      setPasswordInput('');
    }
  };

  const loadPhotos = async () => {
    if (!id) return;
    try {
      const result = await BaseCrudService.getAll<GalleryPhoto>('galleryphotos');
      const galleryPhotos = result.items.filter(
        (photo) => photo.galleryId === id
      );
      setPhotos(galleryPhotos);
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center">
          <p className="font-paragraph text-lg text-gray-600 mb-6">
            Gallery not found
          </p>
          <Button onClick={() => navigate('/albums')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Albums
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 w-full">
        {/* Header Section */}
        <section className="w-full py-8 md:py-12 bg-secondary text-primary-foreground">
          <div className="max-w-[100rem] mx-auto px-4 md:px-8">
            <Button
              onClick={() => navigate('/albums')}
              variant="ghost"
              className="text-primary-foreground hover:bg-white/10 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Albums
            </Button>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-2">
                {gallery.clientName}
              </h1>
              {gallery.eventDate && (
                <p className="font-paragraph text-primary-foreground/80">
                  Event Date: {new Date(gallery.eventDate).toLocaleDateString()}
                </p>
              )}
            </motion.div>
          </div>
        </section>

        {/* Content Section */}
        <section className="w-full py-16 md:py-24">
          <div className="max-w-[100rem] mx-auto px-4 md:px-8">
            {!isUnlocked ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-md mx-auto"
              >
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <Lock className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <h2 className="font-heading text-2xl font-bold text-secondary mb-2">
                    Password Protected
                  </h2>
                  <p className="font-paragraph text-gray-600 mb-6">
                    Enter the access code to view this gallery
                  </p>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <Input
                        type="password"
                        placeholder="Enter access code"
                        value={passwordInput}
                        onChange={(e) => {
                          setPasswordInput(e.target.value);
                          setPasswordError('');
                        }}
                        className="w-full"
                      />
                      {passwordError && (
                        <p className="text-red-500 text-sm mt-2">
                          {passwordError}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Unlock Gallery
                    </Button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                {gallery.description && (
                  <div className="mb-12 text-center">
                    <p className="font-paragraph text-lg text-gray-700">
                      {gallery.description}
                    </p>
                  </div>
                )}

                {photos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {photos.map((photo, index) => (
                      <motion.div
                        key={photo._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="group rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-lg transition-shadow"
                      >
                        <div className="relative aspect-square overflow-hidden bg-gray-200">
                          {photo.imageFile ? (
                            <Image
                              src={photo.imageFile}
                              alt={photo.title || 'Gallery photo'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              width={400}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-300">
                              <span className="text-gray-500">No image</span>
                            </div>
                          )}
                        </div>
                        {(photo.title || photo.description) && (
                          <div className="p-4">
                            {photo.title && (
                              <h3 className="font-heading text-sm font-bold text-secondary mb-1">
                                {photo.title}
                              </h3>
                            )}
                            {photo.description && (
                              <p className="font-paragraph text-xs text-gray-600">
                                {photo.description}
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="font-paragraph text-lg text-gray-600">
                      No photos in this gallery yet.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import { ClientGalleries } from '@/entities';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

export default function ClientAlbumsPage() {
  const [galleries, setGalleries] = useState<ClientGalleries[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGalleries = async () => {
      try {
        const result = await BaseCrudService.getAll<ClientGalleries>('clientgalleries');
        setGalleries(result.items || []);
      } catch (error) {
        console.error('Failed to load galleries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGalleries();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 bg-secondary text-primary-foreground">
          <div className="max-w-[100rem] mx-auto px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="font-heading text-5xl md:text-6xl font-bold mb-4">
                Client Galleries
              </h1>
              <p className="font-paragraph text-lg md:text-xl text-primary-foreground/90">
                Access your password-protected photo albums
              </p>
            </motion.div>
          </div>
        </section>

        {/* Albums Grid */}
        <section className="w-full py-16 md:py-24">
          <div className="max-w-[100rem] mx-auto px-4 md:px-8">
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner />
              </div>
            ) : galleries.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {galleries.map((gallery, index) => (
                  <motion.div
                    key={gallery._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group"
                  >
                    <Link
                      to={`/album/${gallery._id}`}
                      className="block h-full rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-lg transition-shadow"
                    >
                      <div className="relative aspect-square overflow-hidden bg-gray-200">
                        {gallery.coverImage ? (
                          <Image
                            src={gallery.coverImage}
                            alt={gallery.clientName || 'Gallery'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            width={400}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-300">
                            <span className="text-gray-500">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="font-heading text-xl font-bold text-secondary mb-2">
                          {gallery.clientName || 'Untitled Gallery'}
                        </h3>
                        <p className="font-paragraph text-sm text-gray-600 mb-4 line-clamp-2">
                          {gallery.description || 'Password-protected album'}
                        </p>
                        {gallery.eventDate && (
                          <p className="font-paragraph text-xs text-gray-500 mb-4">
                            Event: {new Date(gallery.eventDate).toLocaleDateString()}
                          </p>
                        )}
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                          View Album
                        </Button>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-16">
                <p className="font-paragraph text-lg text-gray-600 mb-6">
                  No galleries available at this time.
                </p>
                <Link to="/">
                  <Button variant="outline">Back to Home</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

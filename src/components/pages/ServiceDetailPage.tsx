import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { ServiceCategories } from '@/entities';
import { Image } from '@/components/ui/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [service, setService] = useState<ServiceCategories | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadService();
  }, [slug]);

  const loadService = async () => {
    setIsLoading(true);
    try {
      const { items } = await BaseCrudService.getAll<ServiceCategories>('servicecategories');
      const foundService = items.find(s => s.slug === slug);
      setService(foundService || null);
    } catch (error) {
      console.error('Error loading service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WhatsAppButton />

      <div className="pt-24 min-h-[600px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <LoadingSpinner />
          </div>
        ) : !service ? (
          <div className="max-w-[100rem] mx-auto px-6 lg:px-12 py-32 text-center">
            <h1 className="font-heading text-4xl text-secondary mb-6">Service Not Found</h1>
            <p className="font-paragraph text-foreground/80 mb-8">
              The service you're looking for doesn't exist.
            </p>
            <Link to="/" className="inline-flex items-center gap-2 font-paragraph text-primary font-bold hover:text-primary/80 transition-colors">
              <ArrowLeft size={20} />
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <section className="relative w-full h-[60vh] lg:h-[70vh] overflow-hidden">
              <Image
                src={service.coverImage || ''}
                alt={service.serviceName || 'Service'}
                className="w-full h-full object-cover"
                width={1920}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-secondary/40 to-transparent" />
              <div className="absolute inset-0 flex items-end">
                <div className="max-w-[100rem] mx-auto px-6 lg:px-12 pb-16 lg:pb-20 w-full">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 font-paragraph text-primary-foreground/80 hover:text-primary-foreground font-medium mb-6 transition-colors"
                  >
                    <ArrowLeft size={20} />
                    Back to Home
                  </Link>
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="font-heading text-5xl lg:text-7xl text-primary-foreground"
                  >
                    {service.serviceName}
                  </motion.h1>
                </div>
              </div>
            </section>

            {/* Content Section */}
            <section className="w-full max-w-[100rem] mx-auto px-6 lg:px-12 py-24 lg:py-32">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                <div className="lg:col-span-2 space-y-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <h2 className="font-heading text-3xl lg:text-4xl text-secondary mb-6">
                      About This Service
                    </h2>
                    <p className="font-paragraph text-base lg:text-lg text-foreground leading-relaxed whitespace-pre-line">
                      {service.detailedDescription || service.shortDescription}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-secondary/5 rounded-lg p-8"
                  >
                    <h3 className="font-heading text-2xl text-secondary mb-4">
                      Our Approach
                    </h3>
                    <p className="font-paragraph text-base text-foreground leading-relaxed">
                      Every session is crafted with intention and artistry. We believe in capturing authentic moments that tell your unique story. Our fine art approach ensures that each image is not just a photograph, but a timeless piece of art that you'll treasure forever.
                    </p>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="space-y-8"
                >
                  <div className="bg-primary/5 rounded-lg p-8 border border-primary/20">
                    <h3 className="font-heading text-2xl text-secondary mb-6">
                      Ready to Begin?
                    </h3>
                    <p className="font-paragraph text-base text-foreground mb-6">
                      Let's create something beautiful together. Get in touch to discuss your vision and book your session.
                    </p>
                    <a href="/#contact">
                      <button className="w-full bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-paragraph font-bold px-6 py-4 rounded-full text-base transition-all duration-300">
                        Get in Touch
                      </button>
                    </a>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-paragraph text-lg font-bold text-secondary">
                      What's Included
                    </h4>
                    <ul className="space-y-3">
                      {[
                        'Pre-session consultation',
                        'Professional photography session',
                        'Fine art editing & retouching',
                        'High-resolution digital files',
                        'Private online gallery',
                        'Print rights included'
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="font-paragraph text-sm text-foreground/80">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Gallery Preview Section */}
            <section className="w-full bg-secondary/5 py-24 lg:py-32">
              <div className="max-w-[100rem] mx-auto px-6 lg:px-12">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="font-heading text-3xl lg:text-4xl text-secondary text-center mb-12"
                >
                  Sample Work
                </motion.h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: item * 0.1 }}
                      className="aspect-[3/4] rounded-lg overflow-hidden"
                    >
                      <Image
                        src="https://static.wixstatic.com/media/897509_73199d91e0d0414fafdb5192aae2011b~mv2.png?originWidth=576&originHeight=768"
                        alt={`${service.serviceName} sample ${item}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        width={600}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="w-full max-w-[100rem] mx-auto px-6 lg:px-12 py-24 lg:py-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center max-w-3xl mx-auto"
              >
                <h2 className="font-heading text-4xl lg:text-5xl text-secondary mb-6">
                  Let's Create Your Story
                </h2>
                <p className="font-paragraph text-lg text-foreground mb-8">
                  Every moment deserves to be captured with artistry and intention. Let's discuss how we can bring your vision to life.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="/#contact">
                    <button className="bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-paragraph font-bold px-8 py-4 rounded-full text-base transition-all duration-300">
                      Book a Consultation
                    </button>
                  </a>
                  <Link to="/">
                    <button className="bg-transparent text-secondary hover:text-primary font-paragraph font-bold px-8 py-4 rounded-full text-base transition-all duration-300">
                      View All Services
                    </button>
                  </Link>
                </div>
              </motion.div>
            </section>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

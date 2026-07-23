// HPI 1.7-G
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import WhatsAppButton from '@/components/WhatsAppButton';
import { ClientGalleries, FrequentlyAskedQuestions, PortraitGallery, ServiceCategories } from '@/entities';
import { BaseCrudService } from '@/integrations';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ExternalLink, Instagram, Lock, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  // --- Canonical Data Sources ---
  const [portraits, setPortraits] = useState<PortraitGallery[]>([]);
  const [services, setServices] = useState<ServiceCategories[]>([]);
  const [faqs, setFaqs] = useState<FrequentlyAskedQuestions[]>([]);
  const [clientGalleries, setClientGalleries] = useState<ClientGalleries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [isShowreelOpen, setIsShowreelOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(100);
  const [containerHeight, setContainerHeight] = useState(120);
  const [headerHeight, setHeaderHeight] = useState(0);

  // --- Refs for Scroll Animations ---
  const heroRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // --- Scroll Hooks ---
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroY = useTransform(heroProgress, [0, 1], ["0%", "40%"]);
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);

  const { scrollYProgress: statementProgress } = useScroll({
    target: statementRef,
    offset: ["start end", "end start"]
  });
  const statementScale = useTransform(statementProgress, [0, 0.5, 1], [0.9, 1, 0.9]);
  const statementOpacity = useTransform(statementProgress, [0, 0.5, 1], [0.3, 1, 0.3]);

  // --- Data Fetching (Preserved) ---
  useEffect(() => {
    loadData();
  }, []);

  // --- Measure the fixed header so the hero can sit right below it ---
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    const update = () => setHeaderHeight(header.getBoundingClientRect().height);
    update();

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [portraitsRes, servicesRes, faqsRes, galleriesRes] = await Promise.all([
        BaseCrudService.getAll<PortraitGallery>('portraitgallery'),
        BaseCrudService.getAll<ServiceCategories>('servicecategories'),
        BaseCrudService.getAll<FrequentlyAskedQuestions>('faq'),
        BaseCrudService.getAll<ClientGalleries>('clientgalleries')
      ]);

      setPortraits(portraitsRes.items);
      // Reorder services: Fine Art Portraits and portrait services first, then weddings/events
      const reorderedServices = servicesRes.items.sort((a, b) => {
        const portraitServices = ['Fine Art Portraits', 'Portrait Photography'];
        const weddingEventServices = ['Wedding', 'Event', 'Events'];

        const aIsPortrait = portraitServices.some(p => a.serviceName?.includes(p));
        const bIsPortrait = portraitServices.some(p => b.serviceName?.includes(p));
        const aIsWeddingEvent = weddingEventServices.some(p => a.serviceName?.includes(p));
        const bIsWeddingEvent = weddingEventServices.some(p => b.serviceName?.includes(p));

        // Portrait services first
        if (aIsPortrait && !bIsPortrait) return -1;
        if (!aIsPortrait && bIsPortrait) return 1;

        // Then wedding/event services
        if (aIsWeddingEvent && !bIsWeddingEvent) return -1;
        if (!aIsWeddingEvent && bIsWeddingEvent) return 1;

        // Otherwise maintain display order
        return (a.displayOrder || 0) - (b.displayOrder || 0);
      });
      setServices(reorderedServices);
      setFaqs(faqsRes.items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
      setClientGalleries(galleriesRes.items);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessGallery = () => {
    setAccessError('');
    const gallery = clientGalleries.find(g => g.accessCode === accessCode);
    if (gallery && gallery.galleryLink) {
      window.open(gallery.galleryLink, '_blank');
      setAccessCode('');
    } else {
      setAccessError('Invalid access code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-secondary overflow-clip">
      <style>{`
        .masonry-grid {
          column-count: 1;
          column-gap: 2rem;
        }
        @media (min-width: 768px) { .masonry-grid { column-count: 2; } }
        @media (min-width: 1024px) { .masonry-grid { column-count: 3; } }
        .masonry-item {
          break-inside: avoid;
          margin-bottom: 2rem;
        }
        .noise-overlay {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 10;
        }
      `}</style>
      <Header />
      <WhatsAppButton />
      {/* 1. HERO SECTION - Cinematic Parallax */}
      <motion.section
        ref={heroRef}
        className="relative w-full flex items-center justify-center overflow-hidden bg-background"
        style={{
          y: heroY,
          opacity: heroOpacity,
          height: `calc(100dvh - ${headerHeight}px)`,
          marginTop: `${headerHeight}px`
        }}
      >
        <div className="noise-overlay" />

        <motion.div
          className="relative z-20 w-full max-w-[120rem] mx-auto px-6 lg:px-12 flex flex-col items-center text-center h-full justify-center"
        >
          {/* Eyebrow Span */}
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="eyebrow block text-sm md:text-base text-primary tracking-[0.2em] uppercase font-paragraph font-semibold mb-6"
          >
            Fine Art Portraiture · SKG Arts
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="font-heading text-6xl md:text-8xl text-secondary tracking-tight leading-[0.95] mb-8 max-w-4xl mx-auto"
          >
            Portraits, shot<br />like <span className="italic text-primary">fine art</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="font-paragraph text-lg md:text-xl text-secondary/70 max-w-2xl font-light leading-relaxed mb-12 mx-auto"
          >
            Soulful, gallery-grade portraits — plus weddings, editorial and films — captured across India and beyond by Srikanth Gumma.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="flex justify-center"
          >
            <a href="#contact" className="group relative flex items-center justify-center px-10 py-5 overflow-visible rounded-full bg-transparent border border-secondary/20 text-secondary font-paragraph text-sm uppercase tracking-widest transition-all duration-500 hover:border-primary hover:text-primary">
              <span
                className="absolute inset-0 w-full h-full bg-primary/5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-full"
              />
              <span className="relative flex items-center gap-3">
                Get in touch
                <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
          </motion.div>

          {/* Spectrum Aperture Motif - Six-Blade Camera Iris (rotates clockwise) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, rotate: 360 }}
            transition={{
              opacity: { duration: 0.8, delay: 0.8, ease: "easeOut" },
              scale: { duration: 0.8, delay: 0.8, ease: "easeOut" },
              rotate: { repeat: Infinity, duration: 16, ease: "linear" }
            }}
            className="mt-16"
          >
            <svg className="w-[64px] h-[64px]" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(200,200)">
                <circle r="184" fill="none" stroke="url(#ringGradient)" strokeWidth="1.5" opacity="0.4" />
                {['#ED1B23','#F4911C','#88C73F','#007090','#2C3081','#8A2889'].map((c,i)=>(
                  <path key={i} d="M-90,-155.88 L90,-155.88 L5.75,-54.7 L-44.5,-32.3 Z" fill={c} opacity="0.85" transform={`rotate(${i*60})`} />
                ))}
                <circle r="44" fill="#F6F5F2" />
                <circle r="26" fill="#12355A" />
              </g>
              <defs>
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ED1B23"/><stop offset="14%" stopColor="#F4911C"/>
                  <stop offset="28%" stopColor="#F9C400"/><stop offset="42%" stopColor="#88C73F"/>
                  <stop offset="57%" stopColor="#007090"/><stop offset="71%" stopColor="#0072B4"/>
                  <stop offset="85%" stopColor="#2C3081"/><stop offset="100%" stopColor="#8A2889"/>
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <span className="font-paragraph text-xs uppercase tracking-[0.2em] text-secondary/40">Scroll</span>
          <div className="w-[1px] h-16 bg-secondary/20 relative overflow-hidden">
            <motion.div
              animate={{ y: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute top-0 left-0 w-full h-full bg-primary"
            />
          </div>
        </motion.div>
      </motion.section>
      {/* 2. PORTRAIT GALLERY - The Core Feature */}
      <section id="gallery" ref={galleryRef} className="w-full max-w-[120rem] mx-auto px-6 lg:px-12 py-32 lg:py-48 relative">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="font-heading text-5xl lg:text-7xl text-secondary leading-none">
              The <br/><span className="italic text-primary">Gallery</span>
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-paragraph text-secondary/60 max-w-md text-right"
          >
            A curated selection of fine art portraits, where every frame is a study in light, emotion, and timeless elegance.
          </motion.p>
        </div>

        <div className={`min-h-[600px] transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
          {portraits.length > 0 ? (
            <div className="masonry-grid">
              {portraits.map((portrait, index) => (
                <motion.div
                  key={portrait._id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: (index % 3) * 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className="masonry-item group cursor-pointer"
                >
                  <div className="relative overflow-hidden bg-secondary/5">
                    <Image
                      src={portrait.image || 'https://static.wixstatic.com/media/897509_555ffd7d31fc41f28c7c854b3b34debb~mv2.png?originWidth=768&originHeight=576'}
                      alt={portrait.altText || portrait.title || 'Fine art portrait'}
                      className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-[1.03] filter grayscale-[20%] group-hover:grayscale-0"
                      width={800}
                    />
                    <div className="absolute inset-0 bg-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Hover Content */}
                    <div className="absolute bottom-0 left-0 w-full p-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out flex flex-col justify-end">
                      <div className="w-8 h-[1px] bg-background mb-4 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 delay-100" />
                      {portrait.title && (
                        <h3 className="font-heading text-2xl text-background mb-1">{portrait.title}</h3>
                      )}
                      {portrait.location && (
                        <p className="font-paragraph text-xs uppercase tracking-widest text-background/80">{portrait.location}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="w-full h-[40vh] flex items-center justify-center border border-secondary/10">
              <p className="text-secondary/40 font-paragraph uppercase tracking-widest text-sm">Curating the gallery...</p>
            </div>
          )}
        </div>
      </section>
      {/* 3. STATEMENT SECTION - Sticky & Cinematic */}
      <section ref={statementRef} className="w-full h-[150vh] relative bg-background">
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-secondary/5" />
          <motion.div
            style={{ scale: statementScale, opacity: statementOpacity }}
            className="max-w-[100rem] mx-auto px-6 lg:px-12 text-center relative z-10"
          >
            <p className="font-heading text-4xl md:text-6xl lg:text-8xl text-secondary leading-[1.1]">
              Make it <span className="italic text-primary">art</span>.<br/>
              Make it <span className="italic text-primary">yours</span>.<br/>
              Make it <span className="italic text-primary">last</span>.
            </p>
            <div className="mt-12 flex justify-center">
              <div className="w-[1px] h-24 bg-secondary/20" />
            </div>
          </motion.div>
        </div>
      </section>
      {/* Rainbow Spectrum Divider */}
      <div className="w-full h-[2px] bg-gradient-to-r from-[#ED1B23] via-[#F4911C] via-[#F9C400] via-[#88C73F] via-[#007090] via-[#0072B4] via-[#2C3081] to-[#8A2889]" />
      {/* 4. SERVICES GRID - Editorial Layout */}
      <section id="services" className="w-full max-w-[120rem] mx-auto px-6 lg:px-12 py-32 lg:py-48">
        <div className="mb-24 flex flex-col items-center text-center">
          <span className="font-paragraph text-xs uppercase tracking-[0.3em] text-primary mb-4 block">Expertise</span>
          <h2 className="font-heading text-5xl lg:text-6xl text-secondary">
            Our Services
          </h2>
          <div className="w-12 h-[1px] bg-secondary/20 mt-8" />
        </div>

        <div className={`transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-24">
              {services.map((service, index) => (
                <motion.div
                  key={service._id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: (index % 3) * 0.1 }}
                  className={`group flex flex-col ${index % 2 !== 0 ? 'lg:mt-24' : ''}`}
                >
                  <Link to={`/services/${service.slug}`} className="block w-full">
                    <div className="relative overflow-hidden aspect-[4/5] mb-8 bg-secondary/5">
                      <Image
                        src={service.coverImage || 'https://static.wixstatic.com/media/897509_a28e362fd6824691a42465b7ce8ca437~mv2.png?originWidth=576&originHeight=704'}
                        alt={service.serviceName || 'Service'}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        width={600}
                      />
                      {/* Editorial Corner Accent */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-background/50 m-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-background/50 m-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-heading text-2xl text-secondary mb-3 group-hover:text-primary transition-colors duration-300">
                          {service.serviceName}
                        </h3>
                        <p className="font-paragraph text-sm text-secondary/70 leading-relaxed line-clamp-2 max-w-[85%]">
                          {service.shortDescription}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-secondary/10 flex items-center justify-center group-hover:border-primary group-hover:bg-primary group-hover:text-background transition-all duration-300 shrink-0">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="w-full h-[30vh] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </section>
      {/* 5. FILMS SECTION - Split Narrative */}
      <section id="films" className="w-full bg-secondary/5 py-32 lg:py-48 relative overflow-hidden border-t border-[#ED1B23]/20" style={{ borderImage: 'linear-gradient(90deg, #ED1B23, #F4911C, #F9C400, #88C73F, #007090, #0072B4, #2C3081, #8A2889) 1' }}>
        {/* Decorative background text */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 opacity-[0.03] pointer-events-none whitespace-nowrap">
          <span className="font-heading text-[20vw] leading-none">CINEMA</span>
        </div>

        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="lg:col-span-5 space-y-8"
            >
              <span className="font-paragraph text-xs uppercase tracking-[0.3em] text-primary">Motion</span>
              <h2 className="font-heading text-5xl lg:text-6xl text-secondary leading-tight">
                Director of <br/><span className="italic">Photography</span>
              </h2>
              <p className="font-paragraph text-lg text-secondary/70 leading-relaxed">
                With 8 years of experience as a cinematographer, Srikanth brings a fine art sensibility to motion pictures. From intimate documentaries to grand wedding films, every frame is composed with intention, light, and artistry.
              </p>

              <div className="pt-8">
                <a
                  href="https://www.imdb.com/name/nm12481877/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 font-paragraph text-sm uppercase tracking-widest text-secondary pb-2 hover:text-primary transition-colors"
                >
                  View IMDb Profile
                  <ExternalLink size={16} />
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="lg:col-span-7 relative"
            >
              <button
                type="button"
                onClick={() => setIsShowreelOpen(true)}
                aria-label="Play showreel"
                className="aspect-video w-full bg-secondary relative group cursor-pointer overflow-hidden block"
              >
                <Image
                  src="https://static.wixstatic.com/media/897509_4462e04f22494fd68d9ea0a10369bff8~mv2.png?originWidth=576&originHeight=320"
                  alt="Showreel Cover"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-700"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border border-background/30 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 group-hover:border-background/60 transition-all duration-500">
                    <Play className="text-background ml-2" size={32} fill="currentColor" />
                  </div>
                </div>
              </button>
              {/* Decorative offset border */}
              <div className="absolute -inset-4 border border-secondary/10 -z-10 hidden lg:block" />
            </motion.div>

          </div>
        </div>

        <Dialog open={isShowreelOpen} onOpenChange={setIsShowreelOpen}>
          <DialogContent className="max-w-4xl w-full p-0 bg-black border-none overflow-hidden">
            <div className="aspect-video w-full">
              {isShowreelOpen && (
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/Em9FnP9kDoM?autoplay=1"
                  title="SKG Arts Showreel"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </section>
      {/* 6. INSTAGRAM FEED - Infinite Marquee Style */}
      <section id="instagram" className="w-full py-32 overflow-hidden bg-background border-t border-[#ED1B23]/20" style={{ borderImage: 'linear-gradient(90deg, #ED1B23, #F4911C, #F9C400, #88C73F, #007090, #0072B4, #2C3081, #8A2889) 1' }}>
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
          <div>
            <h2 className="font-heading text-4xl lg:text-5xl text-secondary mb-4">
              Follow Along
            </h2>
            <a
              href="https://instagram.com/skg.arts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-paragraph text-sm uppercase tracking-widest text-primary pb-1 hover:text-primary/80 transition-colors"
            >
              <Instagram size={16} />
              @skg.arts
            </a>
          </div>
        </div>

        {/* Marquee Container */}
        <div className="relative w-full flex overflow-x-hidden">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
            className="flex gap-4 px-4 w-max"
          >
            {/* Duplicate array for seamless loop */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8].map((item, index) => (
              <div key={index} className="w-[280px] md:w-[350px] aspect-square shrink-0 relative group overflow-hidden bg-secondary/5">
                <Image
                  src="https://static.wixstatic.com/media/897509_3ab872aa780b4722a729c2300340a8c2~mv2.png?originWidth=384&originHeight=384"
                  alt={`Instagram post ${item}`}
                  className="w-full h-full object-cover filter grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                  width={400}
                />
                <div className="absolute inset-0 bg-secondary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                  <Instagram className="text-background" size={32} />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
      {/* 7. CLIENT GALLERY - Minimalist Portal */}
      <section id="client-gallery" className="w-full bg-background text-secondary py-32 lg:py-48 relative border-t border-[#ED1B23]/20" style={{ borderImage: 'linear-gradient(90deg, #ED1B23, #F4911C, #F9C400, #88C73F, #007090, #0072B4, #2C3081, #8A2889) 1' }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at center, #12355A 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="max-w-[100rem] mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-xl mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-secondary/20 mb-8">
              <Lock className="text-secondary/60" size={24} />
            </div>
            <h2 className="font-heading text-4xl lg:text-5xl mb-6 text-secondary">
              Private Collection
            </h2>
            <p className="font-paragraph text-secondary/60 mb-12 font-light">
              Enter your unique access code to view and download your curated gallery.
            </p>

            <div className="space-y-6">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter Access Code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-secondary/20 rounded-none px-0 py-4 text-center font-paragraph text-xl text-secondary placeholder:text-secondary/30 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-primary transition-all duration-300 peer-focus:w-full" />
              </div>

              <AnimatePresence>
                {accessError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[#ED1B23] font-paragraph text-sm"
                  >
                    {accessError}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button
                onClick={handleAccessGallery}
                className="w-full bg-primary text-background hover:bg-primary/90 font-paragraph uppercase tracking-widest text-sm py-8 rounded-none transition-all duration-500 mt-8"
              >
                Enter Gallery
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      {/* 8. FAQ - Elegant Accordion */}
      <section id="faq" className="w-full max-w-[80rem] mx-auto px-6 lg:px-12 py-32 lg:py-48 border-t border-[#ED1B23]/20" style={{ borderImage: 'linear-gradient(90deg, #ED1B23, #F4911C, #F9C400, #88C73F, #007090, #0072B4, #2C3081, #8A2889) 1' }}>
        <div className="text-center mb-20">
          <h2 className="font-heading text-4xl lg:text-5xl text-secondary mb-6">
            Frequently Asked
          </h2>
          <div className="w-12 h-[1px] bg-secondary/20 mx-auto" />
        </div>

        <div className={`min-h-[300px] transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
          {faqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full space-y-6">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <AccordionItem value={faq._id} className="border-b border-secondary/10 pb-2">
                    <AccordionTrigger className="font-heading text-xl lg:text-2xl text-secondary hover:text-primary hover:no-underline text-left py-6">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="font-paragraph text-base text-secondary/70 leading-relaxed pb-8">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </section>
      {/* 9. CONTACT - Editorial Split */}
      <section id="contact" className="w-full bg-background py-32 lg:py-48 border-t border-[#ED1B23]/20" style={{ borderImage: 'linear-gradient(90deg, #ED1B23, #F4911C, #F9C400, #88C73F, #007090, #0072B4, #2C3081, #8A2889) 1' }}>
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col justify-between"
            >
              <div>
                <h2 className="font-heading text-5xl lg:text-7xl text-secondary mb-8 leading-none">
                  Let's create <br/><span className="italic text-primary">together.</span>
                </h2>
                <p className="font-paragraph text-lg text-secondary/70 max-w-md leading-relaxed mb-16">
                  Whether you're planning a wedding, need a portrait session, or want to discuss a film project, we'd love to hear from you.
                </p>
              </div>

              <div className="space-y-12">
                <div className="group">
                  <span className="font-paragraph text-xs uppercase tracking-[0.2em] text-secondary/40 block mb-2">Studio</span>
                  <p className="font-heading text-2xl text-secondary">Hyderabad, India</p>
                </div>
                <div className="group">
                  <span className="font-paragraph text-xs uppercase tracking-[0.2em] text-secondary/40 block mb-2">Direct</span>
                  <a href="mailto:hello@skgarts.com" className="font-heading text-2xl text-secondary hover:text-primary transition-colors block">
                    hello@skgarts.com
                  </a>
                  <a href="tel:+919876543210" className="font-heading text-2xl text-secondary hover:text-primary transition-colors block mt-2">+91 9740076381</a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-secondary/5 p-8 lg:p-16"
            >
              <form
                className="space-y-10"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Thank you for your message! We will get back to you soon.');
                }}
              >
                <div className="space-y-2">
                  <label className="font-paragraph text-xs uppercase tracking-widest text-secondary/60">Name</label>
                  <Input
                    type="text"
                    required
                    className="bg-transparent border-0 border-b border-secondary/20 rounded-none px-0 py-2 font-paragraph text-lg focus-visible:ring-0 focus-visible:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-paragraph text-xs uppercase tracking-widest text-secondary/60">Email</label>
                  <Input
                    type="email"
                    required
                    className="bg-transparent border-0 border-b border-secondary/20 rounded-none px-0 py-2 font-paragraph text-lg focus-visible:ring-0 focus-visible:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-paragraph text-xs uppercase tracking-widest text-secondary/60">Phone (Optional)</label>
                  <Input
                    type="tel"
                    className="bg-transparent border-0 border-b border-secondary/20 rounded-none px-0 py-2 font-paragraph text-lg focus-visible:ring-0 focus-visible:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-paragraph text-xs uppercase tracking-widest text-secondary/60">Project Details</label>
                  <Textarea
                    required
                    rows={4}
                    className="bg-transparent border-0 border-b border-secondary/20 rounded-none px-0 py-2 font-paragraph text-lg resize-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-secondary text-background hover:bg-primary font-paragraph uppercase tracking-widest text-sm py-8 rounded-none transition-all duration-500"
                >
                  Submit Inquiry
                </Button>
              </form>
            </motion.div>

          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

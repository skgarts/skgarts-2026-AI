import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Image } from '@/components/ui/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FineArtGallery } from '@/entities';
import { BaseCrudService } from '@/integrations';

export default function ProfilePage() {
  const [fineArtGallery, setFineArtGallery] = useState<FineArtGallery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(0);

  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    const update = () => setHeaderHeight(header.getBoundingClientRect().height);
    update();

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const fineArtRes = await BaseCrudService.getAll<FineArtGallery>('fineartgallery');
      setFineArtGallery(fineArtRes.items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const films = [
    { title: 'Sahasi, Dateline Singapore', type: 'Shortfilm', role: 'DOP, Audiographer' },
    { title: 'PsychoLogical', type: 'Shortfilm', role: 'DOP' },
    { title: 'Sirf Main Singapore Vignettes', type: 'Shortfilm series', role: 'DOP, Editor' },
    { title: 'Lifaafe', type: 'Shortfilm', role: 'DOP' },
    { title: 'Zindagi Interrupted', type: 'Shortfilm', role: 'DOP, Editor' },
    { title: 'Achar', type: 'Shortfilm', role: 'DOP' },
    { title: 'MG Road', type: 'Shortfilm', role: 'DOP' },
    { title: 'Soul Of Love', type: 'Shortfilm', role: 'DOP' },
    { title: 'Hridyam', type: 'Shortfilm', role: 'Associate DOP' },
    { title: 'Druvangal Randu', type: 'Psychological Thriller shortfilm', role: 'Lighting' },
  ];

  const videoProjects = [
    { title: 'Hindustan Badhega', artist: '' },
    { title: 'Meri Jaan X Aao Huzoor', artist: 'Kavya Kannan' },
    { title: 'Aadha Ishq', artist: 'Harshu Kamble' },
    { title: 'Kanha Re', artist: 'Harshu Kamble' },
    { title: 'Kuch Toh Hua Hai (Kal Ho No Ho)', artist: 'Harshu Kamble' },
    { title: 'Gulabi Aankhen', artist: 'Harshu Kamble' },
    { title: 'Mere Khwabon Mein - cover', artist: 'Harshu Kamble' },
    { title: 'Main Tenu Samjhawan ki song cover', artist: 'Harshu Kamble' },
  ];

  const otherProjects = [
    { title: 'Filming of the event', description: 'Rhythm International Dance Festival' },
    { title: 'Dream Catchers Runway Talent hunt', description: 'Photoshoots for events and portraits' },
    { title: 'Dream Catchers Runway mom', description: '' },
    { title: 'NRI buzzar event photoshoot', description: '' },
    { title: 'Dream Catchers Iventure Event', description: '' },
    { title: 'ArcLight Productions & Dream Catchers', description: 'Timeless Tales Theatre Festival' },
    { title: 'Associate Camera crew for the Film Grahanam', description: 'Malayalam film', link: 'https://bit.ly/3cZRewq' },
  ];

  const equipment = {
    camera: [
      'Canon R5C',
      'Canon R6',
      'BMPCC 6K',
    ],
    lights: [
      'Godox FL Series Flexible LED Light 150 FL',
      'Apurtue Amaran 100X',
      'Nanlite Forza 60C RGBLAC',
      'Godox LC 500R',
      'Few other incident lights',
    ],
    lens: [
      'Canon RF24-70 f/2.8L',
      'Canon RF100-500mm F4.5-7.1L IS USM',
      'Canon EF24-70mm f/2.8L II USM',
      'Canon EF16-35mm f/2.8L II USM',
      'Canon EF70-200mm f/2.8L IS II USM',
      'Canon 85mm f/1.2L II USM',
      'Canon RF 50mm f/1.8L',
      'Samyang 35mm T1.5 AS UMCII cine lens',
      'Samyang 50mm T1.5 cine lens',
      'Samyang 80mm T1.5 Cine lens',
    ],
    sound: [
      'Zoom F6',
      'RODE WirelessGO II',
      'Hollyland Lark MAX Wireless Microphone',
      'Rode NTG4+ (Boom Mic)',
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-secondary overflow-clip">
      <Header />

      {/* HERO SECTION - Split Layout with Photo */}
      <motion.section
        ref={heroRef}
        className="relative w-full flex items-center justify-center overflow-hidden bg-background"
        style={{
          height: `calc(100dvh - ${headerHeight}px)`,
          marginTop: `${headerHeight}px`
        }}
      >
        <div className="relative z-20 w-full max-w-[120rem] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 h-full justify-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 space-y-6"
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="block text-sm md:text-base text-primary tracking-[0.2em] uppercase font-paragraph font-semibold"
            >
              Director of Photography & Photographer
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="font-heading text-5xl md:text-7xl text-secondary tracking-tight leading-[0.95]"
            >
              Srikanth Gumma
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="font-heading text-2xl md:text-3xl text-primary italic"
            >
              Visuals Driven by Art. Backed by Precision.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="font-paragraph text-lg text-secondary/70 leading-relaxed max-w-lg"
            >
              I create under the banner SKG Arts, guided by a simple belief: every piece of visual media—from raw documentaries to high-concept films—is fundamentally an art form meant to tell a story.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="font-paragraph text-base text-secondary/60 leading-relaxed max-w-lg"
            >
              Great visuals require technical perfection. As a versatile, one-stop technical lead, I seamlessly manage cinematography, dynamic lighting setups, and location sync sound. By controlling the entire technical ecosystem, I ensure your narrative retains its soul without losing an ounce of production value.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="font-paragraph text-base text-secondary/60 leading-relaxed max-w-lg"
            >
              Whether you're crafting an intimate documentary or an ambitious commercial film, let's turn your vision into an unforgettable visual experience.
            </motion.p>
          </motion.div>

          {/* Right: Photo */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="flex-1 relative"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-secondary/5 rounded-lg">
              <Image
                src="https://static.wixstatic.com/media/897509_555ffd7d31fc41f28c7c854b3b34debb~mv2.png?originWidth=600&originHeight=800"
                alt="Srikanth Gumma - Director of Photography"
                className="w-full h-full object-cover"
                width={600}
              />
              {/* Decorative corner accent */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-primary/30" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-primary/30" />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* FILMS SECTION */}
      <section className="w-full max-w-[120rem] mx-auto px-6 lg:px-12 py-32 lg:py-48">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="font-heading text-5xl lg:text-6xl text-secondary mb-4">
            Films
          </h2>
          <div className="w-12 h-[1px] bg-primary" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {films.map((film, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: (index % 2) * 0.1 }}
              className="group p-6 lg:p-8 border border-secondary/10 hover:border-primary/30 transition-all duration-300 bg-secondary/[0.02] hover:bg-secondary/5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="font-heading text-xl lg:text-2xl text-secondary group-hover:text-primary transition-colors">
                  {film.title}
                </h3>
                <ArrowRight size={20} className="text-primary/40 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>
              <p className="font-paragraph text-sm text-secondary/60 mb-2">
                <span className="font-semibold text-secondary/80">{film.type}</span>
              </p>
              <p className="font-paragraph text-sm text-secondary/70">
                <span className="text-primary">Role:</span> {film.role}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* VIDEO PROJECTS SECTION */}
      <section className="w-full bg-secondary/5 py-32 lg:py-48 border-t border-[#ED1B23]/20" style={{ borderImage: 'linear-gradient(90deg, #ED1B23, #F4911C, #F9C400, #88C73F, #007090, #0072B4, #2C3081, #8A2889) 1' }}>
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="font-heading text-5xl lg:text-6xl text-secondary mb-4">
              Video Projects
            </h2>
            <div className="w-12 h-[1px] bg-primary" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoProjects.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
                className="group p-6 border border-secondary/10 hover:border-primary/30 transition-all duration-300 bg-background hover:bg-background/50"
              >
                <h3 className="font-heading text-lg text-secondary group-hover:text-primary transition-colors mb-2">
                  {project.title}
                </h3>
                {project.artist && (
                  <p className="font-paragraph text-sm text-secondary/70">
                    <span className="text-primary font-semibold">Artist:</span> {project.artist}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* OTHER PROJECTS SECTION */}
      <section className="w-full max-w-[120rem] mx-auto px-6 lg:px-12 py-32 lg:py-48">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="font-heading text-5xl lg:text-6xl text-secondary mb-4">
            Other Projects
          </h2>
          <div className="w-12 h-[1px] bg-primary" />
        </motion.div>

        <div className="space-y-4">
          {otherProjects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: (index % 5) * 0.05 }}
              className="group p-6 border-b border-secondary/10 hover:border-primary/30 transition-all duration-300 flex items-start justify-between gap-4"
            >
              <div className="flex-1">
                <h3 className="font-heading text-lg text-secondary group-hover:text-primary transition-colors mb-1">
                  {project.title}
                </h3>
                {project.description && (
                  <p className="font-paragraph text-sm text-secondary/70">
                    {project.description}
                  </p>
                )}
              </div>
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors flex-shrink-0 mt-1"
                >
                  <ArrowRight size={20} />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* EQUIPMENT SECTION */}
      <section className="w-full bg-secondary/5 py-32 lg:py-48 border-t border-[#ED1B23]/20" style={{ borderImage: 'linear-gradient(90deg, #ED1B23, #F4911C, #F9C400, #88C73F, #007090, #0072B4, #2C3081, #8A2889) 1' }}>
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="font-heading text-5xl lg:text-6xl text-secondary mb-4">
              Equipment
            </h2>
            <p className="font-paragraph text-lg text-secondary/70 max-w-2xl">
              Professional gear meticulously curated for precision cinematography and photography.
            </p>
            <div className="w-12 h-[1px] bg-primary mt-6" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Camera */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0 }}
              className="space-y-6"
            >
              <h3 className="font-heading text-2xl text-secondary">Camera</h3>
              <ul className="space-y-3">
                {equipment.camera.map((item, idx) => (
                  <li key={idx} className="font-paragraph text-sm text-secondary/70 flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Lights */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              <h3 className="font-heading text-2xl text-secondary">Lights</h3>
              <ul className="space-y-3">
                {equipment.lights.map((item, idx) => (
                  <li key={idx} className="font-paragraph text-sm text-secondary/70 flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Lens */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <h3 className="font-heading text-2xl text-secondary">Lens</h3>
              <ul className="space-y-3">
                {equipment.lens.map((item, idx) => (
                  <li key={idx} className="font-paragraph text-sm text-secondary/70 flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Sound */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-6"
            >
              <h3 className="font-heading text-2xl text-secondary">Sound</h3>
              <ul className="space-y-3">
                {equipment.sound.map((item, idx) => (
                  <li key={idx} className="font-paragraph text-sm text-secondary/70 flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* GALLERY SECTION - Published Photos */}
      <section className="w-full max-w-[120rem] mx-auto px-6 lg:px-12 py-32 lg:py-48">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="font-heading text-5xl lg:text-6xl text-secondary mb-4">
            Published Work
          </h2>
          <p className="font-paragraph text-lg text-secondary/70 max-w-2xl">
            A curated selection of fine art photography showcasing technical excellence and artistic vision.
          </p>
          <div className="w-12 h-[1px] bg-primary mt-6" />
        </motion.div>

        <div className={`transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
          {fineArtGallery.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {fineArtGallery.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
                  className="group relative overflow-hidden"
                >
                  <div className="relative overflow-hidden aspect-square bg-secondary/5">
                    <Image
                      src={item.image || 'https://static.wixstatic.com/media/897509_555ffd7d31fc41f28c7c854b3b34debb~mv2.png?originWidth=768&originHeight=576'}
                      alt={item.title || 'Fine art piece'}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      width={600}
                    />
                    <div className="absolute inset-0 bg-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {item.title && (
                      <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-secondary/80 to-transparent translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        <h3 className="font-heading text-xl text-background">{item.title}</h3>
                        {item.medium && (
                          <p className="font-paragraph text-xs text-background/80 mt-2">{item.medium}</p>
                        )}
                        {item.yearCreated && (
                          <p className="font-paragraph text-xs text-background/80">{item.yearCreated}</p>
                        )}
                        {item.description && (
                          <p className="font-paragraph text-xs text-background/80 mt-2 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="w-full h-[40vh] flex items-center justify-center border border-secondary/10 rounded-lg">
              <p className="text-secondary/40 font-paragraph uppercase tracking-widest text-sm">Loading published work...</p>
            </div>
          )}
        </div>
      </section>

      {/* Rainbow Spectrum Divider */}
      <div className="w-full h-[2px] bg-gradient-to-r from-[#ED1B23] via-[#F4911C] via-[#F9C400] via-[#88C73F] via-[#007090] via-[#0072B4] via-[#2C3081] to-[#8A2889]" />

      <Footer />
    </div>
  );
}

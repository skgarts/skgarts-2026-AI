// SKG Arts — Profile / About page
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Image } from '@/components/ui/image';
import WhatsAppButton from '@/components/WhatsAppButton';
import { BaseCrudService } from '@/integrations';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, ExternalLink, Film, Lightbulb, Mic, Video } from 'lucide-react';
import { useEffect, useState } from 'react';

// Srikanth's profile portrait (Wix media)
const PROFILE_PHOTO = 'https://static.wixstatic.com/media/897509_81fd36b4521b4beeb9e6260db65d94fe~mv2.jpg';

// --- Static credit data ---
const FILMS = [
  { title: 'Sahasi, Dateline Singapore', type: 'Short film', role: 'DOP, Audiographer' },
  { title: 'PsychoLogical', type: 'Short film', role: 'DOP' },
  { title: 'Sirf Main — Singapore Vignettes', type: 'Short film series', role: 'DOP, Editor' },
  { title: 'Lifaafe', type: 'Short film', role: 'DOP' },
  { title: 'Zindagi Interrupted', type: 'Short film', role: 'DOP, Editor' },
  { title: 'Achar', type: 'Short film', role: 'DOP' },
  { title: 'MG Road', type: 'Short film', role: 'DOP' },
  { title: 'Soul Of Love', type: 'Short film', role: 'DOP' },
  { title: 'Hridyam', type: 'Short film', role: 'Associate DOP' },
  { title: 'Druvangal Randu', type: 'Psychological thriller short film', role: 'Lighting' },
];

const VIDEOS = [
  { title: 'Hindustan Badhega Meri Jaan × Aao Huzoor', artist: 'Kavya Kannan' },
  { title: 'Aadha Ishq', artist: 'Harshu Kamble' },
  { title: 'Kanha Re', artist: 'Harshu Kamble' },
  { title: 'Kuch Toh Hua Hai (Kal Ho Na Ho)', artist: 'Harshu Kamble' },
  { title: 'Gulabi Aankhen', artist: 'Harshu Kamble' },
  { title: 'Mere Khwabon Mein — cover', artist: 'Harshu Kamble' },
  { title: 'Main Tenu Samjhawan — song cover', artist: 'Harshu Kamble' },
];

const OTHER_PROJECTS = [
  { title: 'Rhythm International Dance Festival', note: 'Event filming' },
  { title: 'Dream Catchers Runway — Talent Hunt', note: 'Event & portrait photoshoots' },
  { title: 'Dream Catchers Runway Mom — NRI Buzzar Event', note: 'Photoshoot' },
  { title: 'Dream Catchers — Iventure Event', note: 'Photoshoot' },
  { title: 'ArcLight Productions & Dream Catchers — Timeless Tales Theatre Festival', note: 'Filming' },
  { title: 'Grahanam (Malayalam)', note: 'Associate camera crew', link: 'https://bit.ly/3cZRewq' },
];

const EQUIPMENT = [
  {
    icon: Camera,
    group: 'Camera',
    items: ['Canon R5C', 'Canon R6', 'BMPCC 6K'],
  },
  {
    icon: Lightbulb,
    group: 'Lights',
    items: [
      'Godox FL150 Flexible LED (FL Series)',
      'Aputure Amaran 100X',
      'Nanlite Forza 60C RGBLAC',
      'Godox LC500R',
      'Assorted incident lights',
    ],
  },
  {
    icon: Video,
    group: 'Lens',
    items: [
      'Canon RF 24-70mm f/2.8L',
      'Canon RF 100-500mm f/4.5-7.1L IS USM',
      'Canon EF 24-70mm f/2.8L II USM',
      'Canon EF 16-35mm f/2.8L II USM',
      'Canon EF 70-200mm f/2.8L IS II USM',
      'Canon EF 85mm f/1.2L II USM',
      'Canon RF 50mm f/1.8',
      'Samyang 35mm T1.5 AS UMC II (cine)',
      'Samyang 50mm T1.5 (cine)',
      'Samyang 80mm T1.5 (cine)',
    ],
  },
  {
    icon: Mic,
    group: 'Sound',
    items: [
      'Zoom F6',
      'RODE Wireless GO II',
      'Hollyland Lark MAX',
      'Rode NTG4+ (boom mic)',
    ],
  },
];

const RAINBOW = 'linear-gradient(90deg, #ED1B23, #F4911C, #F9C400, #88C73F, #007090, #0072B4, #2C3081, #8A2889) 1';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: 'easeOut' },
};

export default function ProfilePage() {
  const [published, setPublished] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await BaseCrudService.getAll<any>('published-photos-self');
        setPublished(res.items.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0)));
      } catch (error) {
        console.error('Error loading published photos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Offset content below the fixed header
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;
    const update = () => setHeaderHeight(header.getBoundingClientRect().height);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-clip">
      <Header />
      <WhatsAppButton />

      {/* 1. HERO — photo + intro */}
      <section
        className="w-full max-w-[120rem] mx-auto px-6 lg:px-12 pb-24 lg:pb-32"
        style={{ paddingTop: `calc(${headerHeight}px + 4rem)` }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-secondary/5">
              <Image
                src={PROFILE_PHOTO}
                alt="Srikanth Gumma — Director of Photography & Photographer"
                className="w-full h-full object-cover"
                width={900}
              />
            </div>
            {/* Decorative offset border */}
            <div className="absolute -inset-4 border border-secondary/10 -z-10 hidden lg:block" />
          </motion.div>

          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
            className="lg:col-span-7"
          >
            <span className="font-paragraph text-xs md:text-sm text-primary uppercase tracking-[0.2em] font-semibold block mb-6">
              Director of Photography &amp; Photographer · Hyderabad · SKG Arts
            </span>
            <h1 className="font-heading text-4xl md:text-6xl text-secondary leading-[1.05] mb-8">
              Visuals driven by <span className="italic text-primary">art</span>.<br />
              Backed by <span className="italic text-primary">precision</span>.
            </h1>
            <div className="space-y-5 font-paragraph text-base md:text-lg text-secondary/70 leading-relaxed max-w-2xl">
              <p>
                Hey, I'm Srikanth Gumma — a Hyderabad-based Director of Photography (DOP) and Photographer. I create under the banner SKG Arts, guided by a simple belief: every piece of visual media, from raw documentaries to high-concept films, is fundamentally an art form meant to tell a story.
              </p>
              <p>
                Great visuals require technical perfection. As a versatile, one-stop technical lead, I seamlessly manage cinematography, dynamic lighting setups, and location sync sound. By controlling the entire technical ecosystem, I make sure your narrative keeps its soul without losing an ounce of production value.
              </p>
              <p className="text-secondary">
                Whether you're crafting an intimate documentary or an ambitious commercial film, let's turn your vision into an unforgettable visual experience.
              </p>
            </div>
            <div className="mt-10">
              <a
                href="/#contact"
                className="group inline-flex items-center gap-3 px-10 py-5 bg-primary text-background font-paragraph text-sm uppercase tracking-widest transition-all duration-300 hover:bg-primary/90"
              >
                Let's work together
                <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="w-full h-[2px]" style={{ background: RAINBOW.replace(') 1', ')') }} />

      {/* 2. FILMS */}
      <section className="w-full max-w-[100rem] mx-auto px-6 lg:px-12 py-24 lg:py-32">
        <motion.div {...fadeUp} className="flex items-center gap-4 mb-16">
          <Film className="text-primary" size={28} />
          <h2 className="font-heading text-4xl lg:text-5xl text-secondary">Films</h2>
        </motion.div>

        <div className="divide-y divide-secondary/10 border-t border-secondary/10">
          {FILMS.map((film, i) => (
            <motion.div
              key={film.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.05 }}
              className="group flex flex-col md:flex-row md:items-baseline justify-between gap-2 md:gap-8 py-6"
            >
              <div className="flex-1">
                <h3 className="font-heading text-xl lg:text-2xl text-secondary group-hover:text-primary transition-colors">
                  {film.title}
                </h3>
                <p className="font-paragraph text-xs uppercase tracking-widest text-secondary/40 mt-1">
                  {film.type}
                </p>
              </div>
              <p className="font-paragraph text-sm text-secondary/70 md:text-right md:min-w-[220px]">
                {film.role}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. VIDEO PROJECTS */}
      <section className="w-full bg-secondary/5 py-24 lg:py-32">
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12">
          <motion.div {...fadeUp} className="flex items-center gap-4 mb-16">
            <Video className="text-primary" size={28} />
            <h2 className="font-heading text-4xl lg:text-5xl text-secondary">Video Projects</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
            {VIDEOS.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.06 }}
                className="border-l-2 border-primary/30 pl-5 py-1"
              >
                <h3 className="font-heading text-lg lg:text-xl text-secondary leading-snug">{v.title}</h3>
                <p className="font-paragraph text-xs uppercase tracking-widest text-secondary/50 mt-2">
                  {v.artist}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. OTHER PROJECTS */}
      <section className="w-full max-w-[100rem] mx-auto px-6 lg:px-12 py-24 lg:py-32">
        <motion.div {...fadeUp} className="flex items-center gap-4 mb-16">
          <Camera className="text-primary" size={28} />
          <h2 className="font-heading text-4xl lg:text-5xl text-secondary">Other Projects</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {OTHER_PROJECTS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (i % 2) * 0.06 }}
              className="flex items-start gap-4 border-b border-secondary/10 pb-6"
            >
              <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
              <div>
                <h3 className="font-heading text-lg lg:text-xl text-secondary">
                  {p.link ? (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      {p.title}
                      <ExternalLink size={15} />
                    </a>
                  ) : (
                    p.title
                  )}
                </h3>
                <p className="font-paragraph text-sm text-secondary/60 mt-1">{p.note}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="w-full h-[2px]" style={{ background: RAINBOW.replace(') 1', ')') }} />

      {/* 5. EQUIPMENT */}
      <section className="w-full bg-secondary/5 py-24 lg:py-32">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="font-paragraph text-xs uppercase tracking-[0.3em] text-primary mb-4 block">
              The Kit
            </span>
            <h2 className="font-heading text-4xl lg:text-5xl text-secondary">Equipment</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {EQUIPMENT.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.group}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="bg-background border border-secondary/10 p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Icon className="text-primary" size={22} />
                    <h3 className="font-heading text-2xl text-secondary">{cat.group}</h3>
                  </div>
                  <ul className="space-y-3">
                    {cat.items.map((item) => (
                      <li key={item} className="font-paragraph text-sm text-secondary/70 leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. PUBLISHED WORK — pulls from `published-photos-self` collection */}
      <section className="w-full max-w-[120rem] mx-auto px-6 lg:px-12 py-24 lg:py-32">
        <motion.div {...fadeUp} className="mb-16 flex flex-col items-center text-center">
          <span className="font-paragraph text-xs uppercase tracking-[0.3em] text-primary mb-4 block">
            Selected &amp; Published
          </span>
          <h2 className="font-heading text-4xl lg:text-5xl text-secondary">Published Work</h2>
          <div className="w-12 h-[1px] bg-secondary/20 mt-8" />
        </motion.div>

        <div className={`min-h-[300px] transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
          {published.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {published.map((item, index) => (
                <motion.div
                  key={item._id || index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
                  className="group relative overflow-hidden aspect-[4/5] bg-secondary/5"
                >
                  <Image
                    src={item.image || 'https://static.wixstatic.com/media/897509_555ffd7d31fc41f28c7c854b3b34debb~mv2.png?originWidth=768&originHeight=576'}
                    alt={item.altText || item.title || 'Published photograph'}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    width={800}
                  />
                  <div className="absolute inset-0 bg-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {(item.title || item.location) && (
                    <div className="absolute bottom-0 left-0 w-full p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      {item.title && <h3 className="font-heading text-xl text-background">{item.title}</h3>}
                      {item.location && (
                        <p className="font-paragraph text-xs uppercase tracking-widest text-background/80 mt-1">
                          {item.location}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="w-full h-[40vh] flex items-center justify-center border border-secondary/10">
              <p className="text-secondary/40 font-paragraph uppercase tracking-widest text-sm">
                Loading published work…
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-secondary/5 py-24 lg:py-32 border-t border-[#ED1B23]/20" style={{ borderImage: RAINBOW }}>
        <div className="max-w-[80rem] mx-auto px-6 lg:px-12 text-center">
          <motion.h2 {...fadeUp} className="font-heading text-4xl lg:text-6xl text-secondary leading-tight mb-8">
            Let's create something <span className="italic text-primary">unforgettable</span>.
          </motion.h2>
          <motion.div {...fadeUp}>
            <a
              href="/#contact"
              className="group inline-flex items-center gap-3 px-10 py-5 bg-primary text-background font-paragraph text-sm uppercase tracking-widest transition-all duration-300 hover:bg-primary/90"
            >
              Get in touch
              <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

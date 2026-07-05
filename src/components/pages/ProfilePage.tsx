import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';

export default function ProfilePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="w-full">
        {/* Hero Section */}
        <section className="w-full bg-secondary text-primary-foreground py-20">
          <div className="max-w-[100rem] mx-auto px-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <motion.h1 variants={itemVariants} className="font-heading text-6xl font-bold">
                SKG Arts
              </motion.h1>
              <motion.p variants={itemVariants} className="font-paragraph text-xl max-w-2xl">
                Professional Photography & Videography Services
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* About Section */}
        <section className="w-full py-20 bg-background">
          <div className="max-w-[100rem] mx-auto px-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <motion.div variants={itemVariants} className="space-y-6">
                <h2 className="font-heading text-4xl font-bold text-secondary">About Us</h2>
                <p className="font-paragraph text-lg text-secondary leading-relaxed">
                  SKG Arts is a creative studio dedicated to capturing authentic moments and telling compelling visual stories. With years of experience in photography and videography, we specialize in creating high-quality content that resonates with audiences.
                </p>
                <p className="font-paragraph text-lg text-secondary leading-relaxed">
                  Our approach combines technical expertise with artistic vision, ensuring every project reflects the unique character and vision of our clients. We believe in the power of visual storytelling to connect, inspire, and transform.
                </p>
              </motion.div>
              
              <motion.div variants={itemVariants} className="relative h-96 rounded-lg overflow-hidden">
                <Image
                  src="https://static.wixstatic.com/media/897509_c1debeaf8ce5455c9004ce1b165194aa~mv2.png?originWidth=448&originHeight=384"
                  alt="SKG Arts Studio"
                  width={500}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="w-full py-20 bg-secondary text-primary-foreground">
          <div className="max-w-[100rem] mx-auto px-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="space-y-12"
            >
              <motion.div variants={itemVariants}>
                <h2 className="font-heading text-4xl font-bold mb-6">Our Vision</h2>
                <p className="font-paragraph text-lg leading-relaxed max-w-3xl">
                  We envision a world where every brand and individual has access to professional, compelling visual content that tells their unique story. Through innovation, creativity, and dedication to excellence, we aim to be the trusted partner for all visual storytelling needs.
                </p>
              </motion.div>

              <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    title: 'Quality',
                    description: 'We deliver exceptional quality in every frame, ensuring your vision is realized with precision and artistry.',
                  },
                  {
                    title: 'Creativity',
                    description: 'Our team brings fresh perspectives and innovative ideas to every project, pushing creative boundaries.',
                  },
                  {
                    title: 'Reliability',
                    description: 'We are committed to meeting deadlines and exceeding expectations with professional service.',
                  },
                ].map((value, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="p-6 bg-primary-foreground bg-opacity-10 rounded-lg border border-primary-foreground border-opacity-20"
                  >
                    <h3 className="font-heading text-xl font-bold mb-3">{value.title}</h3>
                    <p className="font-paragraph text-base leading-relaxed">{value.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Experience Section */}
        <section className="w-full py-20 bg-background">
          <div className="max-w-[100rem] mx-auto px-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="space-y-12"
            >
              <motion.h2 variants={itemVariants} className="font-heading text-4xl font-bold text-secondary">
                Experience & Expertise
              </motion.h2>

              <motion.div variants={containerVariants} className="space-y-8">
                {[
                  {
                    title: 'Portrait Photography',
                    description: 'Professional headshots, family portraits, and personal branding photography that captures personality and essence.',
                  },
                  {
                    title: 'Event Coverage',
                    description: 'Comprehensive documentation of weddings, corporate events, and special occasions with artistic storytelling.',
                  },
                  {
                    title: 'Commercial Videography',
                    description: 'High-quality video production for commercials, promotional content, and brand storytelling.',
                  },
                  {
                    title: 'Post-Production',
                    description: 'Professional editing, color grading, and digital enhancement to bring your vision to life.',
                  },
                ].map((service, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="border-l-4 border-accent-blue pl-6 py-2"
                  >
                    <h3 className="font-heading text-2xl font-bold text-secondary mb-2">{service.title}</h3>
                    <p className="font-paragraph text-lg text-secondary leading-relaxed">{service.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 bg-accent-blue text-primary-foreground">
          <div className="max-w-[100rem] mx-auto px-6 text-center">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="space-y-6"
            >
              <motion.h2 variants={itemVariants} className="font-heading text-4xl font-bold">
                Ready to Create Something Amazing?
              </motion.h2>
              <motion.p variants={itemVariants} className="font-paragraph text-lg max-w-2xl mx-auto">
                Let's collaborate to bring your vision to life through compelling visual storytelling.
              </motion.p>
              <motion.a
                variants={itemVariants}
                href="/"
                className="inline-block bg-primary-foreground text-accent-blue px-8 py-3 rounded-lg font-heading font-bold hover:bg-opacity-90 transition-all"
              >
                Get in Touch
              </motion.a>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Portraits', href: '/#gallery' },
    { name: 'Services', href: '/#services' },
    { name: 'Films', href: '/#films' },
    { name: 'Client Gallery', href: '/#client-gallery' },
    { name: 'FAQ', href: '/#faq' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-secondary/10">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="font-heading text-2xl lg:text-3xl text-secondary font-bold">
            SKG Arts
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="font-paragraph text-base text-foreground hover:text-primary transition-colors font-medium"
              >
                {link.name}
              </a>
            ))}
            <a href="/#contact">
              <button className="bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-paragraph font-bold px-6 py-3 rounded-full text-sm transition-all duration-300">
                Contact Us
              </button>
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-secondary p-2"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="pt-6 pb-4 space-y-4">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block font-paragraph text-base text-foreground hover:text-primary transition-colors font-medium py-2"
                  >
                    {link.name}
                  </a>
                ))}
                <a href="/#contact" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-paragraph font-bold px-6 py-3 rounded-full text-sm transition-all duration-300">
                    Contact Us
                  </button>
                </a>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

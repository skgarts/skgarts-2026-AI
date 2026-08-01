import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { useMember } from '@/integrations';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, actions } = useMember();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Portraits', href: '/#gallery' },
    { name: 'Services', href: '/#services' },
    { name: 'Films', href: '/#films' },
    { name: 'FAQ', href: '/#faq' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-secondary/10">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Image 
              src="https://static.wixstatic.com/media/897509_46a058e553ed4113a420249d230b42fd~mv2.png" 
              alt="SKG Arts Logo" 
              width={180}
              className="h-auto"
            />
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
            {isAuthenticated && (
              <Link
                to="/gallery-management"
                className="font-paragraph text-base text-foreground hover:text-primary transition-colors font-medium"
              >
                Edit Gallery
              </Link>
            )}
            <a href="/#contact">
              <button className="bg-gradient-to-r from-primary to-accent-blue text-primary-foreground hover:shadow-lg hover:scale-105 font-paragraph font-bold px-8 py-3 rounded-full text-sm transition-all duration-300">
                Contact Us
              </button>
            </a>
            {isAuthenticated && (
              <button
                onClick={actions.logout}
                className="font-paragraph text-base text-foreground hover:text-primary transition-colors font-medium"
              >
                Sign Out
              </button>
            )}
            {!isAuthenticated && (
              <button
                onClick={actions.login}
                className="font-paragraph text-base text-foreground hover:text-primary transition-colors font-medium"
              >
                Sign In
              </button>
            )}
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
                {isAuthenticated && (
                  <Link
                    to="/gallery-management"
                    onClick={() => setIsMenuOpen(false)}
                    className="block font-paragraph text-base text-foreground hover:text-primary transition-colors font-medium py-2"
                  >
                    Edit Gallery
                  </Link>
                )}
                <a href="/#contact" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full bg-gradient-to-r from-primary to-accent-blue text-primary-foreground hover:shadow-lg hover:scale-105 font-paragraph font-bold px-6 py-3 rounded-full text-sm transition-all duration-300">
                    Contact Us
                  </button>
                </a>
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      actions.logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full font-paragraph text-base text-foreground hover:text-primary transition-colors font-medium py-2"
                  >
                    Sign Out
                  </button>
                )}
                {!isAuthenticated && (
                  <button
                    onClick={() => {
                      actions.login();
                      setIsMenuOpen(false);
                    }}
                    className="w-full font-paragraph text-base text-foreground hover:text-primary transition-colors font-medium py-2"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

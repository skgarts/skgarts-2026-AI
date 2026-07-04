import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-secondary text-secondary-foreground">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-heading text-2xl font-bold">SKG Arts</h3>
            <p className="font-paragraph text-sm text-secondary-foreground/80 leading-relaxed">
              Fine art photography and cinematography by Srikanth Gumma. Making memories into art since 2016.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-paragraph text-lg font-bold">Quick Links</h4>
            <nav className="flex flex-col space-y-2">
              <a href="/#gallery" className="font-paragraph text-sm text-secondary-foreground/80 hover:text-secondary-foreground transition-colors">
                Gallery
              </a>
              <a href="/#services" className="font-paragraph text-sm text-secondary-foreground/80 hover:text-secondary-foreground transition-colors">
                Services
              </a>
              <a href="/#films" className="font-paragraph text-sm text-secondary-foreground/80 hover:text-secondary-foreground transition-colors">
                Films
              </a>
              <a href="/#client-gallery" className="font-paragraph text-sm text-secondary-foreground/80 hover:text-secondary-foreground transition-colors">
                Client Gallery
              </a>
              <a href="/#faq" className="font-paragraph text-sm text-secondary-foreground/80 hover:text-secondary-foreground transition-colors">
                FAQ
              </a>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-paragraph text-lg font-bold">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-1 flex-shrink-0" />
                <span className="font-paragraph text-sm text-secondary-foreground/80">
                  Hyderabad, India
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="flex-shrink-0" />
                <a href="mailto:hello@skgarts.com" className="font-paragraph text-sm text-secondary-foreground/80 hover:text-secondary-foreground transition-colors">
                  hello@skgarts.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="flex-shrink-0" />
                <a href="tel:+919876543210" className="font-paragraph text-sm text-secondary-foreground/80 hover:text-secondary-foreground transition-colors">
                  +91 98765 43210
                </a>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h4 className="font-paragraph text-lg font-bold">Follow Us</h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/skg.arts"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-secondary-foreground/10 hover:bg-secondary-foreground/20 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://facebook.com/skgarts"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-secondary-foreground/10 hover:bg-secondary-foreground/20 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://youtube.com/@skgarts"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-secondary-foreground/10 hover:bg-secondary-foreground/20 flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
            </div>
            <p className="font-paragraph text-sm text-secondary-foreground/80 italic mt-4">
              "Make it art. Make it yours. Make it last."
            </p>
          </div>
        </div>

        {/* Aperture Divider */}
        <div className="w-full h-px bg-gradient-to-r from-accent-red via-accent-orange via-accent-green via-accent-blue to-accent-magenta opacity-40 mb-8" />

        {/* Copyright */}
        <div className="text-center">
          <p className="font-paragraph text-sm text-secondary-foreground/60">
            © {new Date().getFullYear()} SKG Arts. All rights reserved. | Fine Art Photography & Cinematography by Srikanth Gumma
          </p>
        </div>
      </div>
    </footer>
  );
}

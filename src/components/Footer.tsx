import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-background text-secondary border-t border-secondary/10">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-heading text-2xl font-bold text-secondary">SKG Arts</h3>
            <p className="font-paragraph text-sm text-secondary/70 leading-relaxed">
              Fine art photography and cinematography by Srikanth Gumma. Making memories into art since 2016.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-paragraph text-lg font-bold text-secondary">Quick Links</h4>
            <nav className="flex flex-col space-y-2">
              <a href="/#gallery" className="font-paragraph text-sm text-primary hover:text-primary/80 transition-colors">
                Portraits
              </a>
              <a href="/#services" className="font-paragraph text-sm text-primary hover:text-primary/80 transition-colors">
                Services
              </a>
              <a href="/#films" className="font-paragraph text-sm text-primary hover:text-primary/80 transition-colors">
                Films
              </a>
              <a href="/#client-gallery" className="font-paragraph text-sm text-primary hover:text-primary/80 transition-colors">
                Client Gallery
              </a>
              <a href="/#faq" className="font-paragraph text-sm text-primary hover:text-primary/80 transition-colors">
                FAQ
              </a>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-paragraph text-lg font-bold text-secondary">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-1 flex-shrink-0 text-secondary" />
                <span className="font-paragraph text-sm text-secondary/70">
                  Hyderabad, India
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="flex-shrink-0 text-secondary" />
                <a href="mailto:hello@skgarts.com" className="font-paragraph text-sm text-primary hover:text-primary/80 transition-colors">
                  hello@skgarts.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="flex-shrink-0 text-secondary" />
                <a href="tel:+919740076381" className="font-paragraph text-sm text-primary hover:text-primary/80 transition-colors">
                  +91 97400 76381
                </a>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h4 className="font-paragraph text-lg font-bold text-secondary">Follow Us</h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/skg.arts"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors text-primary"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://facebook.com/skgarts"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors text-primary"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://youtube.com/@skgarts"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors text-primary"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
            </div>
            <p className="font-paragraph text-sm text-secondary/70 italic mt-4">
              "Make it art. Make it yours. Make it last."
            </p>
          </div>
        </div>

        {/* Rainbow Spectrum Divider */}
        <div className="w-full h-[2px] bg-gradient-to-r from-[#ED1B23] via-[#F4911C] via-[#F9C400] via-[#88C73F] via-[#007090] via-[#0072B4] via-[#2C3081] to-[#8A2889] mb-8" />

        {/* Copyright */}
        <div className="text-center">
          <p className="font-paragraph text-sm text-secondary/60">
            © {new Date().getFullYear()} SKG Arts. All rights reserved. | Fine Art Photography & Cinematography by Srikanth Gumma
          </p>
        </div>
      </div>
    </footer>
  );
}

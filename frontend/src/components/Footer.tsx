import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Lock, ShieldCheck } from 'lucide-react';

const Footer: React.FC = () => {
  const handleScrollToFeature = (featureId?: string) => {
    // If already on /about, smoothly scroll up to the requested section or top
    if (window.location.pathname === '/about') {
      if (featureId) {
        const el = document.getElementById(featureId);
        if (el) {
          const yOffset = -90;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
  <footer className="bg-navy-dark border-t border-border/80 text-white relative overflow-hidden">
    {/* Subtle Glow Accents */}
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand Column */}
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <MapPin className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-wider text-white">
                WAY<span className="text-gradient-cyan">RIVO</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400 -mt-1 tracking-tight">
                AI Travel Platform
              </span>
            </div>
          </Link>

          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            WayRivo AI 2.0 combines intelligent Google Gemini travel agents with verified destination specialists and secure PayPal Escrow protection.
          </p>

          {/* Escrow Guarantee Pill */}
          <Link
            to="/about?feature=escrow#escrow-terms"
            onClick={() => handleScrollToFeature('escrow-terms')}
            className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-cyan-500/25 text-xs text-cyan-300 hover:border-cyan-400/50 hover:bg-surface-elevated transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Escrow Protected &bull; PayPal Developer Sandbox</span>
          </Link>

          <div className="flex gap-3 mt-6">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-xl bg-surface border border-border-light flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-400/40 transition-all"
              aria-label="Twitter"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-xl bg-surface border border-border-light flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-400/40 transition-all"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-xl bg-surface border border-border-light flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-400/40 transition-all"
              aria-label="Facebook"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">
            Platform
          </h4>
          <div className="space-y-3">
            {[
              ['Explore Destinations', '/explore'],
              ['How It Works', '/how-it-works'],
              ['About WayRivo AI', '/about'],
              ['Create Trip Request', '/traveler/create-trip'],
            ].map(([label, href]) => (
              <Link
                key={label}
                to={href}
                onClick={() => href === '/about' && handleScrollToFeature()}
                className="block text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Specialists */}
        <div>
          <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">
            Travel Specialists
          </h4>
          <div className="space-y-3">
            {[
              ['Join as Verified Expert', '/register'],
              ['Specialist Dashboard', '/expert/dashboard'],
              ['Browse Open Requests', '/expert/requests'],
              ['Submit Proposals', '/expert/proposals'],
            ].map(([label, href]) => (
              <Link
                key={label}
                to={href}
                className="block text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Security & Contact */}
        <div>
          <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">
            Security & Support
          </h4>
          <div className="space-y-3 text-xs text-slate-400">
            <Link
              to="/about?feature=escrow#escrow-terms"
              onClick={() => handleScrollToFeature('escrow-terms')}
              className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>100% Escrow Protection</span>
            </Link>
            <a
              href="mailto:support@wayrivo.com"
              className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
            >
              <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>support@wayrivo.com</span>
            </a>
            <a
              href="tel:+919876543210"
              className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
            >
              <Phone className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>+91 98765 43210</span>
            </a>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-border/80">
              Autonomous Travel Orchestration & Escrow Platform
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Copyright */}
    <div className="border-t border-border/80 bg-navy-dark/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-xs text-slate-500">
          &copy; 2026 WayRivo AI 2.0 &bull; Intelligent Travel Commerce. All rights reserved.
        </p>
        <div className="flex gap-6 text-xs text-slate-500">
          <Link to="/privacy-policy" className="hover:text-slate-300 transition-colors focus:outline-hidden focus:text-cyan-400">
            Privacy Policy
          </Link>
          <Link
            to="/about?feature=escrow#escrow-terms"
            onClick={() => handleScrollToFeature('escrow-terms')}
            className="hover:text-slate-300 transition-colors focus:outline-hidden focus:text-cyan-400 cursor-pointer"
          >
            Escrow Terms
          </Link>
          <Link
            to="/about?feature=security#security-architecture"
            onClick={() => handleScrollToFeature('security-architecture')}
            className="hover:text-slate-300 transition-colors focus:outline-hidden focus:text-cyan-400 cursor-pointer"
          >
            Security
          </Link>
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;

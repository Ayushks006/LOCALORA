import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Heart, MapPin, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-charcoal text-white pt-16 pb-12 border-t border-charcoal-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-charcoal-700">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-ivory-300 flex items-center justify-center p-0.5 shadow-sm overflow-hidden">
                <img src="/logo.png" alt="LOCALORA Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-ivory">
                LOCALORA
              </span>
            </div>
            <p className="text-terracotta text-sm font-semibold tracking-wide uppercase">
              Discover Local. Experience More.
            </p>
            <p className="text-charcoal-300 text-xs sm:text-sm leading-relaxed max-w-sm">
              Smart community-led tourism platform connecting travellers directly with authentic heritage,
              local homestays, licensed regional guides, and grassroots cultural experiences.
            </p>
            <div className="pt-2 text-xs text-charcoal-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-terracotta flex-shrink-0" />
              <span>Initial focus: Karnataka, India (Scalable Pan-India Architecture)</span>
            </div>
          </div>

          {/* Discover Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold text-ivory uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-charcoal-300">
              <li><Link to="/destinations" className="hover:text-terracotta transition">Heritage & Ruins</Link></li>
              <li><Link to="/destinations?category=hills-nature" className="hover:text-terracotta transition">Western Ghats & Hills</Link></li>
              <li><Link to="/destinations?category=wildlife" className="hover:text-terracotta transition">Tiger Reserves & Wildlife</Link></li>
              <li><Link to="/destinations?category=coastal" className="hover:text-terracotta transition">Beaches & Coastal Islands</Link></li>
              <li><Link to="/destinations?category=waterfalls" className="hover:text-terracotta transition">Cascades & Waterfalls</Link></li>
              <li><Link to="/discover-hidden-gems" className="hover:text-terracotta transition">Discover Hidden Gems</Link></li>
            </ul>
          </div>

          {/* Marketplace Services */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold text-ivory uppercase tracking-wider">Marketplace</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-charcoal-300">
              <li><Link to="/homestays" className="hover:text-terracotta transition">Plantation & Heritage Homestays</Link></li>
              <li><Link to="/guides" className="hover:text-terracotta transition">ASI Certified Guides</Link></li>
              <li><Link to="/experiences" className="hover:text-terracotta transition">Artisan Workshops & Walks</Link></li>
              <li><Link to="/trip-planner" className="hover:text-terracotta transition">Custom Trip Planner</Link></li>
              <li><Link to="/register" className="hover:text-terracotta transition">Register as a Host or Guide</Link></li>
            </ul>
          </div>

          {/* Trust, Governance & Policies */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold text-ivory uppercase tracking-wider">Transparency</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-charcoal-300">
              <li><Link to="/policies" className="hover:text-terracotta transition">Booking & Cancellation Policies</Link></li>
              <li><Link to="/terms" className="hover:text-terracotta transition">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-terracotta transition">Privacy & Data Notice</Link></li>
              <li><Link to="/image-manifest" className="hover:text-terracotta transition flex items-center gap-1">Image Attribution Manifest <ExternalLink className="w-3 h-3" /></Link></li>
              <li><Link to="/about" className="hover:text-terracotta transition">About Localora Project</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-charcoal-400">
          <p>© 2026 LOCALORA. Built with care for Karnataka community tourism.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-ivory-200">
              <ShieldCheck className="w-4 h-4 text-forest-400" /> Secure Role-Based Verification
            </span>
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3.5 h-3.5 text-terracotta fill-terracotta" /> for sustainable local travel
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

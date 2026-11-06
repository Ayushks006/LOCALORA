import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Gem,
  PlusCircle,
  MapPin,
  Star,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { api } from '../services/api';
import { Destination } from '../types';
import { TiltCard } from '../components/interactive/TiltCard';
import { SuggestPlaceModal } from '../components/common/SuggestPlaceModal';

export const DiscoverHiddenGemsPage: React.FC = () => {
  const [hiddenGems, setHiddenGems] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  useEffect(() => {
    loadGems();
  }, []);

  const loadGems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.community.getHiddenGems();
      setHiddenGems(res.hiddenGems || []);
    } catch (err: any) {
      console.error('Failed to load hidden gems', err);
      setError(err.message || 'Unable to load hidden gems catalog.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory pb-20">
      {/* Hero Header */}
      <section className="bg-forest text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F7F5EF_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-700/80 border border-forest-500 text-xs font-semibold uppercase tracking-wider text-terracotta-200 mb-4">
            <Gem className="w-4 h-4 text-terracotta-300" />
            Crowdsourced & Community Moderated
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            Discover Lesser-Known Hidden Gems
          </h1>
          <p className="max-w-2xl mx-auto text-forest-100 text-sm sm:text-base leading-relaxed">
            Beyond the famous postcards lie secret waterfalls, untouched sacred groves, megalithic dolmens, and tranquil riverside hamlets. Discover places preserved by local communities.
          </p>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setIsSuggestModalOpen(true)}
              className="px-6 py-3 rounded-2xl bg-terracotta text-white font-semibold text-sm hover:bg-terracotta-600 shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" /> Suggest a Local Hidden Gem
            </button>
          </div>
        </div>
      </section>

      {/* Sustainable Travel Code Notice */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-white rounded-2xl p-5 border border-ivory-200 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-forest" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-charcoal">The Localora Leave-No-Trace Pledge</h4>
              <p className="text-xs text-charcoal-400">
                Respect fragile ecosystems, preserve stone heritage, support local village shops, and do not litter.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-forest whitespace-nowrap bg-ivory px-3 py-1.5 rounded-xl border border-ivory-200">
            Community Moderated Catalog
          </span>
        </div>
      </section>

      {/* Grid of Gems */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-ivory-200 p-6"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-red-200 p-8 max-w-lg mx-auto space-y-4 shadow-soft">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-charcoal">Unable to Load Hidden Gems</h3>
            <p className="text-charcoal-500 text-xs">{error}</p>
            <button
              onClick={() => loadGems()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest text-white text-xs font-semibold hover:bg-forest/90 transition shadow-sm"
            >
              <RotateCw className="w-4 h-4" />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : hiddenGems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-ivory-200 p-8 max-w-lg mx-auto">
            <Gem className="w-12 h-12 text-terracotta mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-charcoal">No Hidden Gems Published Yet</h3>
            <p className="text-charcoal-400 text-sm mt-1 mb-6">
              Be the first explorer to contribute an authentic, offbeat spot to our Karnataka catalog!
            </p>
            <button
              onClick={() => setIsSuggestModalOpen(true)}
              className="px-5 py-2.5 bg-forest text-white rounded-xl text-xs font-semibold hover:bg-forest-700 transition"
            >
              Suggest First Place
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hiddenGems.map((gem) => (
              <TiltCard key={gem.id} className="h-full">
                <div className="bg-white rounded-3xl overflow-hidden border border-ivory-200 shadow-soft hover:shadow-elevated transition-all flex flex-col h-full group">
                  <div className="relative h-56 bg-forest-900 overflow-hidden">
                    <img
                      src={
                        gem.primary_image ||
                        gem.cover_image ||
                        gem.image_url ||
                        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={gem.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-terracotta/90 backdrop-blur-md text-white text-[11px] font-semibold border border-terracotta-400">
                        <Sparkles className="w-3 h-3" /> Hidden Gem
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                      <div>
                        <h3 className="font-serif text-xl font-bold leading-snug">{gem.name}</h3>
                        <p className="text-xs text-ivory-200 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-terracotta" />
                          {gem.district}, Karnataka
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg text-xs font-bold">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{Number(gem.rating_avg || 4.9).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-charcoal-500 line-clamp-3 leading-relaxed mb-4">
                        {gem.short_description || gem.description}
                      </p>

                      {gem.best_time_to_visit && (
                        <div className="text-[11px] text-charcoal-400 mb-2">
                          Ideal Season: <strong className="text-forest">{gem.best_time_to_visit}</strong>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-ivory-200 flex items-center justify-between mt-auto">
                      <span className="text-[11px] text-charcoal-400">Community Verified</span>
                      <Link
                        to={`/destinations/${gem.slug}`}
                        className="px-4 py-2 rounded-xl bg-forest text-white hover:bg-forest-700 text-xs font-semibold shadow-sm transition inline-flex items-center gap-1"
                      >
                        Explore <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        )}
      </section>

      {/* Suggest Modal */}
      <SuggestPlaceModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        onSuccess={() => {
          loadGems();
        }}
      />
    </div>
  );
};

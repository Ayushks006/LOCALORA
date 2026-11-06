import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Star, MapPin, Languages, Award, Filter, Calendar, Search, AlertCircle, RotateCw } from 'lucide-react';
import { api } from '../services/api';
import { GuideProfile } from '../types';
import { TiltCard } from '../components/interactive/TiltCard';
import { BookingModal } from '../components/common/BookingModal';

export const GuidesPage: React.FC = () => {
  const [guides, setGuides] = useState<GuideProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchDistrict, setSearchDistrict] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedGuideForBooking, setSelectedGuideForBooking] = useState<GuideProfile | null>(null);

  useEffect(() => {
    loadGuides();
  }, [searchDistrict, selectedLanguage]);

  const loadGuides = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.guides.getAll({
        district: searchDistrict || undefined,
        language: selectedLanguage || undefined,
      });
      setGuides(res.guides || []);
    } catch (err: any) {
      console.error('Failed to load guides', err);
      setError(err.message || 'Unable to load guides directory.');
    } finally {
      setIsLoading(false);
    }
  };

  const languages = ['Kannada', 'English', 'Hindi', 'French', 'German', 'Telugu', 'Tamil'];

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header Banner */}
      <section className="bg-forest text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F7F5EF_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-700/80 border border-forest-500 text-xs font-semibold uppercase tracking-wider text-terracotta-200 mb-4">
            <ShieldCheck className="w-4 h-4 text-terracotta-300" />
            ASI & State Certified Storytellers
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            Licensed Local Guides of Karnataka
          </h1>
          <p className="max-w-2xl mx-auto text-forest-100 text-sm sm:text-base leading-relaxed">
            Experience destinations through the eyes of certified local historians, naturalists, and cultural custodians. Transparent daily rates, verified credentials, and personalized itineraries.
          </p>

          {/* Quick Filters */}
          <div className="mt-8 max-w-3xl mx-auto bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-200" />
              <input
                type="text"
                placeholder="Filter by district (e.g. Vijayanagara, Mysuru, Kodagu)..."
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-forest-800/80 text-white placeholder-forest-200 border border-forest-600 focus:outline-none focus:border-terracotta text-sm"
              />
            </div>
            <div className="relative sm:w-48">
              <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-200" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-forest-800/80 text-white border border-forest-600 focus:outline-none focus:border-terracotta text-sm appearance-none"
              >
                <option value="">All Languages</option>
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            {(searchDistrict || selectedLanguage) && (
              <button
                onClick={() => {
                  setSearchDistrict('');
                  setSelectedLanguage('');
                }}
                className="px-4 py-2.5 rounded-xl bg-forest-700 text-ivory text-xs font-semibold hover:bg-forest-600 transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Guide Cards Listing */}
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
            <h3 className="font-serif text-xl font-bold text-charcoal">Unable to Load Guides</h3>
            <p className="text-charcoal-500 text-xs">{error}</p>
            <button
              onClick={() => loadGuides()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest text-white text-xs font-semibold hover:bg-forest/90 transition shadow-sm"
            >
              <RotateCw className="w-4 h-4" />
              <span>Retry Guides Connection</span>
            </button>
          </div>
        ) : guides.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-ivory-200 p-8 max-w-lg mx-auto">
            <ShieldCheck className="w-12 h-12 text-forest-300 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-charcoal">No Guides Found</h3>
            <p className="text-charcoal-400 text-sm mt-1">
              Try adjusting your district or language filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map((guide) => (
              <TiltCard key={guide.id} className="h-full">
                <div className="bg-white rounded-3xl overflow-hidden border border-ivory-200 shadow-soft hover:shadow-elevated transition-all flex flex-col h-full">
                  {/* Top Photo & Badge */}
                  <div className="relative h-48 bg-forest-900 overflow-hidden">
                    <img
                      src={
                        guide.profile_image ||
                        guide.avatar_url ||
                        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={guide.full_name || 'Local Guide'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-forest/90 backdrop-blur-md text-white text-xs font-semibold border border-forest-400">
                        <Award className="w-3.5 h-3.5 text-terracotta-300" />
                        {guide.badge_label || 'Certified Guide'}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                      <div>
                        <h3 className="font-serif text-xl font-bold leading-snug">
                          {guide.full_name || 'Guide Specialist'}
                        </h3>
                        <p className="text-xs text-ivory-200 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-terracotta" />
                          {guide.district}, Karnataka
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg text-xs font-bold">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{Number(guide.rating_avg || 5.0).toFixed(1)}</span>
                        <span className="text-[10px] opacity-75">({guide.reviews_count})</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-charcoal-500 line-clamp-3 leading-relaxed mb-4">
                        {guide.bio ||
                          'Specialized in historic temple architecture, inscriptions, and folklore of the region.'}
                      </p>

                      {/* Languages */}
                      <div className="mb-4">
                        <span className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider block mb-1.5">
                          Languages Spoken
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(guide.languages)
                            ? guide.languages
                            : ['Kannada', 'English']
                          ).map((lang, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-ivory-100 text-forest text-xs font-medium border border-ivory-200"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* License number */}
                      {guide.license_number && (
                        <div className="text-[11px] text-charcoal-400 mb-2">
                          Badge / License: <span className="font-mono text-charcoal-600">{guide.license_number}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer / CTA */}
                    <div className="pt-4 border-t border-ivory-200 flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-xs text-charcoal-400 block">Daily Rate</span>
                        <span className="font-serif text-lg font-bold text-forest">
                          ₹{Number(guide.pricing_per_day).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-charcoal-400"> / day</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/guides/${guide.id}`}
                          className="px-3 py-2 rounded-xl border border-forest text-forest hover:bg-forest-50 text-xs font-semibold transition"
                        >
                          Profile
                        </Link>
                        <button
                          onClick={() => setSelectedGuideForBooking(guide)}
                          className="px-4 py-2 rounded-xl bg-forest text-white hover:bg-forest-700 text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Book
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        )}
      </section>

      {/* Booking Modal */}
      {selectedGuideForBooking && (
        <BookingModal
          isOpen={!!selectedGuideForBooking}
          onClose={() => setSelectedGuideForBooking(null)}
          bookingType="guide"
          item={selectedGuideForBooking}
          onBookingSuccess={() => {
            setSelectedGuideForBooking(null);
          }}
        />
      )}
    </div>
  );
};

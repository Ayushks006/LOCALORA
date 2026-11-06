import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Clock, Star, Users, Calendar, Filter } from 'lucide-react';
import { api } from '../services/api';
import { Experience } from '../types';
import { TiltCard } from '../components/interactive/TiltCard';
import { BookingModal } from '../components/common/BookingModal';

export const ExperiencesPage: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [selectedExpForBooking, setSelectedExpForBooking] = useState<Experience | null>(null);

  const categories = [
    { label: 'All Experiences', value: '' },
    { label: 'Heritage & Archaeology', value: 'Heritage' },
    { label: 'Plantations & Nature', value: 'Nature & Plantation' },
    { label: 'Artisan Crafts & Weaving', value: 'Artisan Crafts' },
    { label: 'Culinary & Cooking', value: 'Culinary' },
    { label: 'Adventure & Water', value: 'Adventure' },
  ];

  useEffect(() => {
    loadExperiences();
  }, [selectedCategory, searchDistrict]);

  const loadExperiences = async () => {
    setIsLoading(true);
    try {
      const res = await api.experiences.getAll({
        category: selectedCategory || undefined,
        district: searchDistrict || undefined,
      });
      setExperiences(res.experiences || []);
    } catch (err) {
      console.error('Failed to load experiences', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* Banner */}
      <section className="bg-forest text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F7F5EF_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-700/80 border border-forest-500 text-xs font-semibold uppercase tracking-wider text-terracotta-200 mb-4">
            <Sparkles className="w-4 h-4 text-terracotta-300" />
            Hands-on Cultural Workshops & Guided Walks
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            Curated Local Experiences
          </h1>
          <p className="max-w-2xl mx-auto text-forest-100 text-sm sm:text-base leading-relaxed">
            Immerse yourself in authentic Karnataka traditions. Learn Ilkal weaving, explore third-generation coffee estates, brew filter kaapi, and trek with indigenous forest trackers.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                  selectedCategory === cat.value
                    ? 'bg-terracotta text-white shadow-md'
                    : 'bg-forest-800/80 text-ivory-200 hover:bg-forest-700 border border-forest-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-ivory-200 p-6"></div>
            ))}
          </div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-ivory-200 p-8 max-w-lg mx-auto">
            <Sparkles className="w-12 h-12 text-forest-300 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-charcoal">No Experiences Found</h3>
            <p className="text-charcoal-400 text-sm mt-1">
              Try selecting another category or resetting the filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {experiences.map((exp) => (
              <TiltCard key={exp.id} className="h-full">
                <div className="bg-white rounded-3xl overflow-hidden border border-ivory-200 shadow-soft hover:shadow-elevated transition-all flex flex-col h-full group">
                  {/* Photo */}
                  <div className="relative h-52 bg-forest-900 overflow-hidden">
                    <img
                      src={
                        exp.image_url ||
                        'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={exp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="px-3 py-1 rounded-full bg-forest/90 backdrop-blur-md text-white text-[11px] font-semibold border border-forest-400">
                        {exp.category}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-charcoal text-[11px] font-bold flex items-center gap-1 shadow-sm">
                        <Clock className="w-3 h-3 text-terracotta" />
                        {exp.duration_hours}h
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                      <div>
                        <p className="text-xs text-ivory-200 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-terracotta" />
                          {exp.locality ? `${exp.locality}, ` : ''}{exp.district}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg text-xs font-bold">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{Number(exp.rating_avg || 5.0).toFixed(1)}</span>
                        <span className="text-[10px] opacity-75">({exp.reviews_count})</span>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-charcoal mb-2 group-hover:text-forest transition line-clamp-2">
                        {exp.title}
                      </h3>
                      <p className="text-xs text-charcoal-500 line-clamp-3 leading-relaxed mb-4">
                        {exp.description}
                      </p>

                      {/* Inclusions tags */}
                      {exp.includes && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {(Array.isArray(exp.includes)
                            ? exp.includes
                            : typeof exp.includes === 'string'
                            ? JSON.parse(exp.includes)
                            : []
                          ).slice(0, 3).map((inc: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-ivory-100 text-forest text-[11px] font-medium border border-ivory-200"
                            >
                              ✓ {inc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-ivory-200 flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-xs text-charcoal-400 block">Per Person</span>
                        <span className="font-serif text-lg font-bold text-forest">
                          ₹{Number(exp.price_per_person).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/experiences/${exp.slug}`}
                          className="px-3 py-2 rounded-xl border border-forest text-forest hover:bg-forest-50 text-xs font-semibold transition"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => setSelectedExpForBooking(exp)}
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
      {selectedExpForBooking && (
        <BookingModal
          isOpen={!!selectedExpForBooking}
          onClose={() => setSelectedExpForBooking(null)}
          bookingType="experience"
          item={selectedExpForBooking}
          onBookingSuccess={() => {
            setSelectedExpForBooking(null);
          }}
        />
      )}
    </div>
  );
};

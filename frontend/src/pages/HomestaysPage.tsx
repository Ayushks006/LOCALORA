import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Home, Search, Star, MapPin, Users, Filter, CheckCircle } from 'lucide-react';
import { BookingModal } from '../components/common/BookingModal';
import { api } from '../services/api';
import { Homestay } from '../types';

export const HomestaysPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedHomestay, setSelectedHomestay] = useState<Homestay | null>(null);

  // Filters
  const district = searchParams.get('district') || '';
  const propertyType = searchParams.get('property_type') || '';
  const guests = searchParams.get('guests') || '';
  const maxPrice = searchParams.get('max_price') || '';

  useEffect(() => {
    loadHomestays();
  }, [searchParams]);

  const loadHomestays = async () => {
    setIsLoading(true);
    try {
      const res = await api.homestays.getAll({
        district: district || undefined,
        property_type: propertyType || undefined,
        guests: guests ? Number(guests) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
      });
      setHomestays(res.homestays || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val);
    else next.delete(key);
    setSearchParams(next);
  };

  const districts = ['Kodagu', 'Chikkamagaluru', 'Uttara Kannada', 'Udupi', 'Hassan', 'Mysuru', 'Shivamogga'];
  const propertyTypes = ['Plantation Bungalow', 'Heritage Villa', 'Eco Cottage', 'Farm Stay', 'Coastal Home'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs uppercase font-bold text-terracotta tracking-wider">
          <Home className="w-4 h-4 text-forest" />
          <span>Local Hospitality Marketplace</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-charcoal mt-1">
          Karnataka Homestays & Plantation Retreats
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500 max-w-2xl mt-2 leading-relaxed">
          Experience warm Kodava and Malnad hospitality. Stay amidst coffee plantations, organic farms, and serene coastal villages with homemade traditional cuisine.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-ivory-200 shadow-soft grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block font-bold uppercase tracking-wider text-[10px] text-charcoal-400 mb-1">
            District
          </label>
          <select
            value={district}
            onChange={(e) => handleFilterChange('district', e.target.value)}
            className="w-full px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
          >
            <option value="">All Regions</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold uppercase tracking-wider text-[10px] text-charcoal-400 mb-1">
            Property Style
          </label>
          <select
            value={propertyType}
            onChange={(e) => handleFilterChange('property_type', e.target.value)}
            className="w-full px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
          >
            <option value="">All Styles</option>
            {propertyTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold uppercase tracking-wider text-[10px] text-charcoal-400 mb-1">
            Min Guests
          </label>
          <select
            value={guests}
            onChange={(e) => handleFilterChange('guests', e.target.value)}
            className="w-full px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
          >
            <option value="">Any Capacity</option>
            <option value="2">2+ Guests</option>
            <option value="4">4+ Guests</option>
            <option value="6">6+ Guests (Family)</option>
          </select>
        </div>

        <div>
          <label className="block font-bold uppercase tracking-wider text-[10px] text-charcoal-400 mb-1">
            Budget per night
          </label>
          <select
            value={maxPrice}
            onChange={(e) => handleFilterChange('max_price', e.target.value)}
            className="w-full px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
          >
            <option value="">Any Budget</option>
            <option value="3000">Up to ₹3,000</option>
            <option value="5000">Up to ₹5,000</option>
            <option value="8000">Up to ₹8,000</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between text-xs text-charcoal-500 font-medium">
          <span>
            Found <strong className="text-charcoal font-bold">{homestays.length}</strong> verified homestay properties
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-charcoal-400 animate-pulse">
            Loading verified homestays...
          </div>
        ) : homestays.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-ivory-200 p-8 space-y-3">
            <Home className="w-12 h-12 text-charcoal-300 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-charcoal">No homestays match your filters</h3>
            <p className="text-xs text-charcoal-500">Try clearing the selected budget or district.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {homestays.map((stay) => (
              <div
                key={stay.id}
                className="bg-white rounded-3xl overflow-hidden border border-ivory-200 shadow-soft hover:shadow-elevated transition-all flex flex-col justify-between"
              >
                <Link to={`/homestays/${stay.slug}`} className="block relative aspect-[16/10] overflow-hidden group">
                  <img
                    src={stay.primary_image}
                    alt={stay.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-forest flex items-center gap-1 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{stay.rating_avg.toFixed(1)}</span>
                  </span>
                  <span className="absolute bottom-3 left-3 bg-charcoal/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                    {stay.property_type}
                  </span>
                </Link>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <p className="text-xs text-charcoal-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-terracotta" />
                      <span>{stay.locality}, {stay.district}</span>
                    </p>
                    <h3 className="font-serif text-lg font-bold text-charcoal mt-1 line-clamp-1 hover:text-forest">
                      <Link to={`/homestays/${stay.slug}`}>{stay.title}</Link>
                    </h3>
                    <p className="text-xs text-charcoal-600 line-clamp-2 mt-2 leading-relaxed">
                      {stay.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {(stay.amenities || []).slice(0, 3).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ivory-100 text-charcoal-600"
                      >
                        {amenity}
                      </span>
                    ))}
                    {(stay.amenities || []).length > 3 && (
                      <span className="text-[10px] text-charcoal-400 self-center">
                        +{(stay.amenities || []).length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-ivory-200 flex items-center justify-between">
                    <div>
                      <span className="font-serif text-xl font-bold text-forest">
                        ₹{Number(stay.price_per_night || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-charcoal-400"> / night</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedHomestay(stay);
                        setBookingModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-700 text-white font-semibold text-xs transition"
                    >
                      Book Stay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedHomestay && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          bookingType="homestay"
          item={selectedHomestay}
        />
      )}
    </div>
  );
};

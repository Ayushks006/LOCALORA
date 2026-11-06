import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Compass, Search, MapPin, Bookmark, BookmarkCheck, ArrowRight, Filter, AlertCircle, RotateCw } from 'lucide-react';
import { TiltCard } from '../components/interactive/TiltCard';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Destination, Category, Region } from '../types';

export const DestinationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [dynamicDistricts, setDynamicDistricts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const district = searchParams.get('district') || '';
  const region = searchParams.get('region') || 'KA';

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadDestinations();
  }, [searchParams]);

  const loadFilterOptions = async () => {
    try {
      const [catsRes, regsRes, distsRes] = await Promise.all([
        api.destinations.getCategories(),
        api.destinations.getRegions(),
        api.destinations.getDistricts().catch(() => ({ districts: [] })),
      ]);
      setCategories(catsRes.categories || []);
      setRegions(regsRes.regions || []);
      if (distsRes.districts && distsRes.districts.length > 0) {
        setDynamicDistricts(distsRes.districts);
      }
    } catch (err) {
      console.error('Failed to load filter options', err);
    }
  };

  const loadDestinations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.destinations.getAll({
        search: search || undefined,
        category: category || undefined,
        district: district || undefined,
      });
      setDestinations(res.destinations || []);
    } catch (err: any) {
      console.error('Failed to load destinations', err);
      setError(err.message || 'Unable to load destinations. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const handleToggleSave = async (destId: number) => {
    if (!isAuthenticated) return;
    try {
      const res = await api.itineraries.toggleSave(destId);
      setDestinations((prev) =>
        prev.map((d) => (d.id === destId ? { ...d, is_saved: res.isSaved } : d))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const fallbackDistricts = [
    'Bagalkote', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
    'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga',
    'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan',
    'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal',
    'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga',
    'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Vijayapura', 'Yadgir'
  ];

  const districts = dynamicDistricts.length > 0 ? dynamicDistricts : fallbackDistricts;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Title & Pan-India Scope Header */}
      <div>
        <div className="flex items-center gap-2 text-xs uppercase font-bold text-terracotta tracking-wider">
          <Compass className="w-4 h-4 text-forest" />
          <span>Regional Destination Catalog</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-charcoal mt-1">
          Explore Tourist Destinations
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500 max-w-2xl mt-2 leading-relaxed">
          Discover certified heritage sites, mist-shrouded Western Ghats peaks, wildlife sanctuaries, and secluded coastal bays.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-ivory-200 shadow-soft space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by destination name, locality..."
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-ivory-50 border border-ivory-200 rounded-2xl focus:ring-2 focus:ring-forest focus:outline-none"
            />
          </div>

          {/* District Filter */}
          <div className="sm:col-span-4">
            <select
              value={district}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              className="w-full px-3 py-2.5 text-xs sm:text-sm bg-ivory-50 border border-ivory-200 rounded-2xl focus:ring-2 focus:ring-forest focus:outline-none cursor-pointer"
            >
              <option value="">All Karnataka Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Region / State (Pan-India readiness) */}
          <div className="sm:col-span-3">
            <select
              value={region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="w-full px-3 py-2.5 text-xs sm:text-sm bg-ivory-50 border border-ivory-200 rounded-2xl focus:ring-2 focus:ring-forest focus:outline-none cursor-pointer font-medium text-forest"
            >
              {regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ivory-100">
          <button
            onClick={() => handleFilterChange('category', '')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              !category
                ? 'bg-forest text-white'
                : 'bg-ivory-100 text-charcoal hover:bg-ivory-200'
            }`}
          >
            All Themes
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => handleFilterChange('category', c.slug)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                category === c.slug
                  ? 'bg-forest text-white'
                  : 'bg-ivory-100 text-charcoal hover:bg-ivory-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count & Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between text-xs text-charcoal-500 font-medium px-1">
          <span>
            Showing <strong className="text-charcoal font-bold">{destinations.length}</strong> verified places
          </span>
          {category && (
            <button
              onClick={() => handleFilterChange('category', '')}
              className="text-terracotta hover:underline font-semibold"
            >
              Clear filter
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-charcoal-400 animate-pulse">
            Loading destinations catalog...
          </div>
        ) : error ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-red-200 p-8 space-y-4 max-w-lg mx-auto shadow-soft">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-charcoal">Unable to Load Destinations</h3>
            <p className="text-xs text-charcoal-500">{error}</p>
            <button
              onClick={() => loadDestinations()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest text-white text-xs font-semibold hover:bg-forest/90 transition shadow-sm"
            >
              <RotateCw className="w-4 h-4" />
              <span>Retry Catalog Connection</span>
            </button>
          </div>
        ) : destinations.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-ivory-200 p-8 space-y-3">
            <Compass className="w-12 h-12 text-charcoal-300 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-charcoal">No destinations found</h3>
            <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
              Try adjusting your search keyword or selected district filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.map((dest) => (
              <TiltCard key={dest.id} className="bg-white border border-ivory-200 flex flex-col h-full">
                <div className="relative aspect-[4/3] overflow-hidden group">
                  <Link to={`/destinations/${dest.slug}`} className="block w-full h-full">
                    <img
                      src={dest.primary_image}
                      alt={dest.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
                  </Link>

                  {/* Category Pill */}
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-forest text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {dest.category_name || dest.category_slug}
                  </span>

                  {/* Bookmark Button */}
                  {isAuthenticated && (
                    <button
                      onClick={() => handleToggleSave(dest.id)}
                      className="absolute top-4 right-4 p-2 rounded-full bg-white/90 backdrop-blur-md text-charcoal hover:text-terracotta transition shadow-sm"
                      aria-label="Save Destination"
                    >
                      {dest.is_saved ? (
                        <BookmarkCheck className="w-4 h-4 text-terracotta fill-terracotta" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-xs text-ivory-200 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-terracotta" />
                      <span>{dest.district}, Karnataka</span>
                    </p>
                    <h3 className="font-serif text-xl font-bold text-white mt-0.5">
                      <Link to={`/destinations/${dest.slug}`}>{dest.name}</Link>
                    </h3>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-charcoal-600 line-clamp-3 leading-relaxed">
                    {dest.description}
                  </p>

                  <div className="pt-3 border-t border-ivory-200 flex items-center justify-between text-xs">
                    <span className="text-charcoal-400">
                      Duration: <strong className="text-charcoal font-semibold">{dest.suggested_duration}</strong>
                    </span>
                    <Link
                      to={`/destinations/${dest.slug}`}
                      className="font-semibold text-terracotta hover:text-forest transition flex items-center gap-1"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

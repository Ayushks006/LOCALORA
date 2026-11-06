import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Calendar,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Home,
  Users,
  Compass,
  ArrowRight,
  Info,
  Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Destination } from '../types';
import { ImageGallery } from '../components/common/ImageGallery';

export const DestinationDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();

  const [destination, setDestination] = useState<Destination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (slug) {
      loadDestination(slug);
    }
  }, [slug]);

  const loadDestination = async (destSlug: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.destinations.getBySlug(destSlug);
      setDestination(res.destination);
      setIsSaved(Boolean(res.destination.is_saved));
    } catch (err: any) {
      setError(err.message || 'Failed to load destination details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!isAuthenticated || !destination) return;
    try {
      const res = await api.itineraries.toggleSave(destination.id);
      setIsSaved(res.isSaved);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-32 text-center text-xs text-charcoal-400 animate-pulse">
        Loading destination records...
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-charcoal">Destination Not Found</h2>
        <p className="text-xs text-charcoal-500">{error || 'The requested destination does not exist in our catalog.'}</p>
        <Link
          to="/destinations"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest text-white rounded-xl text-xs font-semibold"
        >
          <span>Back to Destinations</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* 1. CINEMATIC HERO BANNER */}
      <div className="relative h-[60vh] min-h-[420px] bg-charcoal overflow-hidden">
        <img
          src={destination.primary_image}
          alt={destination.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/30 to-transparent" />

        <div className="absolute bottom-8 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-terracotta text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full">
              {destination.category_name || destination.category_slug}
            </span>
            <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified Destination
            </span>
            <a
              href="#destination-gallery"
              className="bg-black/40 hover:bg-forest/80 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition"
            >
              <Camera className="w-3.5 h-3.5 text-terracotta" />
              Explore Gallery ({destination.images?.length || 1})
            </a>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-ivory">
            {destination.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-ivory-200">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-terracotta" />
              {destination.locality}, {destination.district}, Karnataka
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-[11px]">
              GPS: {destination.latitude.toFixed(4)}° N, {destination.longitude.toFixed(4)}° E
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT & SIDEBAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Details, Attractions, Gallery */}
          <div className="lg:col-span-8 space-y-10">
            {/* Overview */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-ivory-200 shadow-soft space-y-4">
              <h2 className="font-serif text-2xl font-bold text-charcoal">About {destination.name}</h2>
              <p className="text-sm text-charcoal-700 leading-relaxed font-normal">
                {destination.long_description || destination.description}
              </p>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-ivory-100">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-charcoal-400 font-bold block">
                    Best Time to Visit
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-forest flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-terracotta" />
                    {destination.best_time_to_visit}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-charcoal-400 font-bold block">
                    Suggested Stay
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-forest flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-terracotta" />
                    {destination.suggested_duration}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-charcoal-400 font-bold block">
                    State Jurisdiction
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-charcoal">
                    Karnataka ({destination.region_code})
                  </span>
                </div>
              </div>

              {destination.travel_tips && (
                <div className="p-4 bg-ivory-50 rounded-2xl border border-ivory-200 text-xs text-charcoal space-y-1">
                  <span className="font-bold text-forest flex items-center gap-1">
                    <Info className="w-4 h-4 text-terracotta" /> Travel & Accessibility Tips
                  </span>
                  <p className="text-charcoal-600 leading-relaxed">{destination.travel_tips}</p>
                </div>
              )}
            </div>

            {/* Major Attractions */}
            {destination.attractions && destination.attractions.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-serif text-2xl font-bold text-charcoal">Major Highlights & Attractions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {destination.attractions.map((attr) => (
                    <div
                      key={attr.id}
                      className="bg-white rounded-2xl overflow-hidden border border-ivory-200 shadow-soft flex flex-col"
                    >
                      <img
                        src={attr.image_url}
                        alt={attr.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-40 object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = destination.primary_image || '';
                        }}
                      />
                      <div className="p-4 flex-1 space-y-1">
                        <h3 className="font-serif font-bold text-sm text-charcoal">{attr.title}</h3>
                        <p className="text-xs text-charcoal-500 leading-relaxed">{attr.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Image Gallery & Attribution Manifest */}
            <div id="destination-gallery" className="pt-2">
              <ImageGallery
                destinationName={destination.name}
                locality={destination.locality}
                district={destination.district}
                primaryImage={destination.primary_image || destination.cover_image || ''}
                images={destination.images || []}
              />
            </div>
          </div>

          {/* Right Column: Actions, Map View, Nearby Services */}
          <div className="lg:col-span-4 space-y-6">
            {/* Action Box */}
            <div className="bg-white p-6 rounded-3xl border border-ivory-200 shadow-soft space-y-4">
              <h3 className="font-serif font-bold text-lg text-charcoal">Plan Your Visit</h3>
              <div className="space-y-2">
                {isAuthenticated && (
                  <button
                    onClick={handleToggleSave}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 border ${
                      isSaved
                        ? 'bg-terracotta/10 border-terracotta text-terracotta'
                        : 'border-ivory-200 hover:bg-ivory-50 text-charcoal'
                    }`}
                  >
                    {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    <span>{isSaved ? 'Saved to Collection' : 'Save to Favorites'}</span>
                  </button>
                )}

                <Link
                  to="/trip-planner"
                  className="w-full py-2.5 px-4 rounded-xl bg-forest hover:bg-forest-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>Add to Custom Itinerary</span>
                </Link>

                <Link
                  to={`/map?lat=${destination.latitude}&lng=${destination.longitude}&zoom=12`}
                  className="w-full py-2.5 px-4 rounded-xl border border-ivory-200 hover:bg-ivory-50 text-charcoal text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-terracotta" />
                  <span>View on Interactive Map</span>
                </Link>
              </div>
            </div>

            {/* Nearby Verified Homestays */}
            {destination.nearbyHomestays && destination.nearbyHomestays.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-ivory-200 shadow-soft space-y-4">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-terracotta" />
                  <h3 className="font-serif font-bold text-base text-charcoal">Nearby Homestays</h3>
                </div>
                <div className="space-y-3">
                  {destination.nearbyHomestays.map((stay) => (
                    <Link
                      key={stay.id}
                      to={`/homestays/${stay.slug}`}
                      className="flex items-center gap-3 p-2 rounded-2xl hover:bg-ivory-50 transition group"
                    >
                      <img
                        src={stay.primary_image}
                        alt={stay.title}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-serif font-bold text-xs text-charcoal truncate group-hover:text-forest">
                          {stay.title}
                        </h4>
                        <p className="text-[11px] text-forest font-semibold mt-0.5">
                          ₹{Number(stay.price_per_night || 0).toLocaleString('en-IN')}/night
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Regional Guides */}
            {destination.nearbyGuides && destination.nearbyGuides.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-ivory-200 shadow-soft space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-forest" />
                  <h3 className="font-serif font-bold text-base text-charcoal">Area Guides</h3>
                </div>
                <div className="space-y-3">
                  {destination.nearbyGuides.map((guide) => (
                    <Link
                      key={guide.id}
                      to={`/guides/${guide.id}`}
                      className="flex items-center gap-3 p-2 rounded-2xl hover:bg-ivory-50 transition group"
                    >
                      <img
                        src={guide.profile_image}
                        alt={guide.full_name || 'Guide'}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-serif font-bold text-xs text-charcoal truncate group-hover:text-forest">
                          {guide.full_name}
                        </h4>
                        <p className="text-[11px] text-charcoal-400">
                          ₹{guide.pricing_per_day.toLocaleString('en-IN')}/day
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

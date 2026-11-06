import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  Star,
  Users,
  Home,
  ShieldCheck,
  CheckCircle,
  Gem,
  Award,
  BookOpen,
} from 'lucide-react';
import { TiltCard } from '../components/interactive/TiltCard';
import { BookingModal } from '../components/common/BookingModal';
import { SuggestPlaceModal } from '../components/common/SuggestPlaceModal';
import { api } from '../services/api';
import { Destination, Category, Homestay, GuideProfile, Experience } from '../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Search Bar States
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredDestinations, setFeaturedDestinations] = useState<Destination[]>([]);
  const [popularHomestays, setPopularHomestays] = useState<Homestay[]>([]);
  const [topGuides, setTopGuides] = useState<GuideProfile[]>([]);
  const [culturalExperiences, setCulturalExperiences] = useState<Experience[]>([]);
  const [hiddenGems, setHiddenGems] = useState<Destination[]>([]);

  // Modals
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedBookingItem, setSelectedBookingItem] = useState<{
    type: 'homestay' | 'guide' | 'experience';
    item: any;
  } | null>(null);
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);

  const [dynamicDistricts, setDynamicDistricts] = useState<string[]>([]);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [catsRes, destsRes, staysRes, guidesRes, expRes, gemsRes, distsRes] = await Promise.all([
        api.destinations.getCategories().catch(() => ({ categories: [] })),
        api.destinations.getAll({ featured: true }).catch(() => ({ destinations: [] })),
        api.homestays.getAll().catch(() => ({ homestays: [] })),
        api.guides.getAll().catch(() => ({ guides: [] })),
        api.experiences.getAll().catch(() => ({ experiences: [] })),
        api.community.getHiddenGems().catch(() => ({ hiddenGems: [] })),
        api.destinations.getDistricts().catch(() => ({ districts: [] })),
      ]);

      setCategories(catsRes.categories || []);
      setFeaturedDestinations((destsRes.destinations || []).slice(0, 8));
      setPopularHomestays((staysRes.homestays || []).slice(0, 3));
      setTopGuides((guidesRes.guides || []).slice(0, 3));
      setCulturalExperiences((expRes.experiences || []).slice(0, 3));
      setHiddenGems(gemsRes.hiddenGems || []);
      if (distsRes.districts && distsRes.districts.length > 0) {
        setDynamicDistricts(distsRes.districts);
      }
    } catch (err) {
      console.error('Failed to load homepage data:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (searchKeyword) query.append('search', searchKeyword);
    if (selectedCategory) query.append('category', selectedCategory);
    if (selectedDistrict) query.append('district', selectedDistrict);
    navigate(`/destinations?${query.toString()}`);
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
    <div className="space-y-20 pb-20">
      {/* 1. CINEMATIC HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-charcoal text-white overflow-hidden px-4">
        {/* Background Image with Deep Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/destinations/hampi/cover.jpg"
            alt="Scenic Karnataka Vijayanagara Ruins at Twilight"
            className="w-full h-full object-cover object-center scale-105 transform animate-pulse duration-1000 opacity-45"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-transparent" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-charcoal/80" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6 pt-12 pb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-terracotta-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-terracotta" />
            <span>Discover Local • Experience More</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-ivory leading-[1.1]">
            Discover the Soul of <span className="text-terracotta underline decoration-terracotta/40">Karnataka</span>.
          </h1>

          <p className="text-sm sm:text-lg text-ivory-100 max-w-2xl mx-auto leading-relaxed font-light">
            Journey beyond the typical tourist trails. Connect directly with heritage plantation homestays, licensed local historians, and traditional craft masters.
          </p>

          {/* Integrated Search Box */}
          <div className="pt-4 max-w-4xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white/95 backdrop-blur-xl p-3 sm:p-4 rounded-3xl shadow-elevated border border-ivory-200 grid grid-cols-1 sm:grid-cols-12 gap-3 text-left"
            >
              <div className="sm:col-span-5 px-3 py-1.5 border-b sm:border-b-0 sm:border-r border-ivory-200">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
                  Where to explore?
                </label>
                <div className="flex items-center gap-2 mt-0.5">
                  <Search className="w-4 h-4 text-forest" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Hampi, Coorg, Gokarna, Badami..."
                    className="w-full bg-transparent text-charcoal font-medium text-xs sm:text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-3 px-3 py-1.5 border-b sm:border-b-0 sm:border-r border-ivory-200">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-transparent text-charcoal font-medium text-xs sm:text-sm focus:outline-none mt-0.5 cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 px-3 py-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
                  District
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-transparent text-charcoal font-medium text-xs sm:text-sm focus:outline-none mt-0.5 cursor-pointer"
                >
                  <option value="">Any District</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 flex items-center">
                <button
                  type="submit"
                  className="w-full h-full py-3 px-4 rounded-2xl bg-forest hover:bg-forest-700 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md hover:scale-[1.02]"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Quick Metrics */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs text-ivory-200 font-medium">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl sm:text-2xl font-bold text-terracotta">120+</span>
              <span>Curated Destinations</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-ivory-400" />
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl sm:text-2xl font-bold text-terracotta">100%</span>
              <span>Direct Host Contact</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-ivory-400" />
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl sm:text-2xl font-bold text-terracotta">ASI</span>
              <span>Verified Regional Guides</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DISCOVER BY CATEGORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <span className="text-xs uppercase font-bold text-terracotta tracking-wider">REGIONAL PALETTE</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mt-1">Discover by Theme</h2>
          </div>
          <Link
            to="/destinations"
            className="text-xs sm:text-sm font-semibold text-forest hover:text-terracotta transition flex items-center gap-1.5 mt-2 sm:mt-0"
          >
            <span>Browse all themes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/destinations?category=${cat.slug}`}
              className="group p-5 rounded-3xl bg-white border border-ivory-200 shadow-soft hover:shadow-elevated transition-all hover:-translate-y-1 block"
            >
              <div className="w-11 h-11 rounded-2xl bg-forest-50 text-forest group-hover:bg-forest group-hover:text-white transition flex items-center justify-center mb-3">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-charcoal group-hover:text-forest transition">
                {cat.name}
              </h3>
              <p className="text-xs text-charcoal-400 mt-1 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED DESTINATIONS (3D TILT CARDS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <span className="text-xs uppercase font-bold text-terracotta tracking-wider">HERITAGE & WILDERNESS</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mt-1">
              Featured Karnataka Destinations
            </h2>
          </div>
          <Link
            to="/destinations"
            className="text-xs sm:text-sm font-semibold text-forest hover:text-terracotta transition flex items-center gap-1.5 mt-2 sm:mt-0"
          >
            <span>View all 120+ destinations</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredDestinations.map((dest) => (
            <TiltCard key={dest.id} className="bg-white border border-ivory-200 flex flex-col h-full">
              <Link to={`/destinations/${dest.slug}`} className="block relative aspect-[4/3] overflow-hidden group">
                <img
                  src={dest.primary_image}
                  alt={dest.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-forest text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  {dest.category_name || dest.category_slug}
                </span>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-xs text-ivory-200 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-terracotta" />
                    <span>{dest.district}, Karnataka</span>
                  </p>
                  <h3 className="font-serif text-xl font-bold text-white mt-0.5">{dest.name}</h3>
                </div>
              </Link>
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
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* 4. POPULAR HOMESTAYS MARKETPLACE */}
      <section className="bg-ivory-100/60 py-16 border-y border-ivory-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <span className="text-xs uppercase font-bold text-terracotta tracking-wider">COMMUNITY HOSPITALITY</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mt-1">
                Authentic Plantation & Coastal Homestays
              </h2>
            </div>
            <Link
              to="/homestays"
              className="text-xs sm:text-sm font-semibold text-forest hover:text-terracotta transition flex items-center gap-1.5 mt-2 sm:mt-0"
            >
              <span>Explore all verified stays</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularHomestays.map((homestay) => (
              <div
                key={homestay.id}
                className="bg-white rounded-3xl overflow-hidden border border-ivory-200 shadow-soft hover:shadow-elevated transition-all flex flex-col"
              >
                <Link to={`/homestays/${homestay.slug}`} className="block relative aspect-[16/10] overflow-hidden group">
                  <img
                    src={homestay.primary_image}
                    alt={homestay.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-forest flex items-center gap-1 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{homestay.rating_avg.toFixed(1)}</span>
                  </span>
                </Link>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-400">
                      {homestay.property_type} • {homestay.district}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-charcoal mt-0.5 line-clamp-1 hover:text-forest">
                      <Link to={`/homestays/${homestay.slug}`}>{homestay.title}</Link>
                    </h3>
                    <p className="text-xs text-charcoal-600 line-clamp-2 mt-2 leading-relaxed">
                      {homestay.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-ivory-200 flex items-center justify-between">
                    <div>
                      <span className="font-serif text-lg font-bold text-forest">
                        ₹{Number(homestay.price_per_night || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-charcoal-400"> / night</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBookingItem({ type: 'homestay', item: homestay });
                        setBookingModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-forest hover:bg-forest-700 text-white font-semibold text-xs transition"
                    >
                      Book Stay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CERTIFIED LOCAL GUIDES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <span className="text-xs uppercase font-bold text-terracotta tracking-wider">HERITAGE EXPERTS</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mt-1">
              Certified Regional Guides
            </h2>
          </div>
          <Link
            to="/guides"
            className="text-xs sm:text-sm font-semibold text-forest hover:text-terracotta transition flex items-center gap-1.5 mt-2 sm:mt-0"
          >
            <span>Meet all guides</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topGuides.map((guide) => (
            <div
              key={guide.id}
              className="bg-white rounded-3xl p-6 border border-ivory-200 shadow-soft hover:shadow-elevated transition flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={guide.profile_image}
                  alt={guide.full_name || 'Guide'}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover border border-ivory-200 shadow-sm"
                  loading="lazy"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-serif font-bold text-base text-charcoal">{guide.full_name}</h3>
                    {guide.verified === 1 && (
                      <span title="ASI Verified">
                        <ShieldCheck className="w-4 h-4 text-forest" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-charcoal-500">{guide.service_area}</p>
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{guide.rating_avg.toFixed(1)}</span>
                    <span className="text-charcoal-400 font-normal">({guide.reviews_count} reviews)</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-charcoal-600 line-clamp-3 leading-relaxed">
                {guide.bio}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {(guide.languages || []).map((lang, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ivory-100 text-charcoal-700"
                  >
                    {lang}
                  </span>
                ))}
              </div>

              <div className="pt-3 border-t border-ivory-200 flex items-center justify-between">
                <div>
                  <span className="font-serif text-base font-bold text-forest">
                    ₹{guide.pricing_per_day.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-charcoal-400"> / day</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedBookingItem({ type: 'guide', item: guide });
                    setBookingModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-forest text-forest hover:bg-forest hover:text-white font-semibold text-xs transition"
                >
                  Request Guide
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CULTURAL EXPERIENCES & ARTISANS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <span className="text-xs uppercase font-bold text-terracotta tracking-wider">IMMERSIVE TRADITIONS</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mt-1">
              Cultural Workshops & Activities
            </h2>
          </div>
          <Link
            to="/experiences"
            className="text-xs sm:text-sm font-semibold text-forest hover:text-terracotta transition flex items-center gap-1.5 mt-2 sm:mt-0"
          >
            <span>All experiences</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {culturalExperiences.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-3xl overflow-hidden border border-ivory-200 shadow-soft hover:shadow-elevated transition flex flex-col justify-between"
            >
              <Link to={`/experiences/${exp.slug}`} className="block relative aspect-[16/10] overflow-hidden group">
                <img
                  src={exp.primary_image}
                  alt={exp.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-charcoal uppercase">
                  {exp.category}
                </span>
              </Link>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-serif font-bold text-base text-charcoal line-clamp-1 hover:text-forest">
                    <Link to={`/experiences/${exp.slug}`}>{exp.title}</Link>
                  </h3>
                  <p className="text-xs text-charcoal-500 mt-1 line-clamp-2">
                    {exp.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-charcoal-400">
                  <span>⏱ {exp.duration_hours} hours</span>
                  <span>•</span>
                  <span>👥 Up to {exp.max_group_size} guests</span>
                </div>

                <div className="pt-3 border-t border-ivory-200 flex items-center justify-between">
                  <div>
                    <span className="font-serif text-base font-bold text-forest">
                      ₹{exp.price_per_person.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-charcoal-400"> / person</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBookingItem({ type: 'experience', item: exp });
                      setBookingModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-forest hover:bg-forest-700 text-white font-semibold text-xs transition"
                  >
                    Reserve Session
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. DISCOVER HIDDEN GEMS (COMMUNITY CONTRIBUTION CALLOUT) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-forest text-white p-8 sm:p-12 shadow-elevated relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full bg-white/10 text-terracotta text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Gem className="w-3.5 h-3.5" />
              Community Contributions
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold leading-tight">
              Discover Hidden Gems
            </h2>
            <p className="text-ivory-100 text-sm sm:text-base leading-relaxed">
              Know a beautiful place that deserves more attention? Help others discover it. Submit photos, locations, and travel tips to our community editorial board.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={() => setSuggestModalOpen(true)}
                className="py-3 px-6 rounded-2xl bg-terracotta hover:bg-terracotta-600 text-white font-semibold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
              >
                <span>Suggest a Place</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/discover-hidden-gems"
                className="py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition"
              >
                Explore Hidden Gems Feed
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. HOW BOOKING WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase font-bold text-terracotta tracking-wider">SEAMLESS JOURNEY</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal mt-1">
            How Localora Booking Works
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-2">
            Direct, fair, and transparent community tourism with verified local providers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white border border-ivory-200 shadow-soft text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-forest-50 text-forest mx-auto flex items-center justify-center font-serif text-2xl font-bold">
              1
            </div>
            <h3 className="font-serif text-lg font-bold text-charcoal">Discover & Choose Dates</h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              Explore authentic homestays, ASI licensed guides, and artisan workshops with verified reviews and real coordinates.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-ivory-200 shadow-soft text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-forest-50 text-forest mx-auto flex items-center justify-center font-serif text-2xl font-bold">
              2
            </div>
            <h3 className="font-serif text-lg font-bold text-charcoal">Submit Request & Host Review</h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              Backend collision checking protects against double bookings. Hosts and guides review your dates and confirm directly.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-ivory-200 shadow-soft text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-forest-50 text-forest mx-auto flex items-center justify-center font-serif text-2xl font-bold">
              3
            </div>
            <h3 className="font-serif text-lg font-bold text-charcoal">Secure & Enjoy</h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              Receive status updates and digital reference numbers through persistent notifications. Experience authentic Karnataka hospitality.
            </p>
          </div>
        </div>
      </section>

      {/* 9. PARTNER REGISTRATION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-ivory border border-ivory-200 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs uppercase font-bold text-forest tracking-wider">LOCAL BUSINESS EMPOWERMENT</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal">
              Are you a Homestay Owner, Guide, or Cultural Artisan?
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
              Showcase your offerings to conscious travellers seeking genuine Karnataka experiences without exorbitant commission fees.
            </p>
          </div>
          <Link
            to="/register"
            className="py-3 px-6 rounded-2xl bg-forest hover:bg-forest-700 text-white font-semibold text-xs sm:text-sm shadow-md transition whitespace-nowrap"
          >
            Register Your Service
          </Link>
        </div>
      </section>

      {/* Booking Modal */}
      {selectedBookingItem && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          bookingType={selectedBookingItem.type}
          item={selectedBookingItem.item}
        />
      )}

      {/* Suggest Place Modal */}
      <SuggestPlaceModal
        isOpen={suggestModalOpen}
        onClose={() => setSuggestModalOpen(false)}
        onSuccess={() => {
          loadHomeData();
        }}
      />
    </div>
  );
};

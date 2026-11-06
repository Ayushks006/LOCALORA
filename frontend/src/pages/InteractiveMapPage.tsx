import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Compass,
  MapPin,
  Star,
  Home,
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { api } from '../services/api';
import { Destination, Homestay } from '../types';

// Custom SVG Pin Creator for crisp, colorful Leaflet markers
const createCustomIcon = (color: string, emojiOrInitial: string) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 14px;
          color: white;
          font-weight: bold;
        ">${emojiOrInitial}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const iconsMap: Record<string, L.DivIcon> = {
  heritage: createCustomIcon('#174D3A', '🏛️'),
  hills: createCustomIcon('#2D6A4F', '⛰️'),
  wildlife: createCustomIcon('#B06D3B', '🐅'),
  coastal: createCustomIcon('#2A6F97', '🏖️'),
  waterfalls: createCustomIcon('#014F86', '🌊'),
  spiritual: createCustomIcon('#D87955', '🕉️'),
  culture: createCustomIcon('#6B2D5C', '🌸'),
  homestay: createCustomIcon('#C05C36', '🏡'),
  default: createCustomIcon('#202822', '📍'),
};

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export const InteractiveMapPage: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.5, 75.8]); // Karnataka center
  const [mapZoom, setMapZoom] = useState<number>(7);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [destRes, homeRes] = await Promise.all([
        api.destinations.getAll(),
        api.homestays.getAll().catch(() => ({ homestays: [] })),
      ]);
      setDestinations(destRes.destinations || []);
      setHomestays(homeRes.homestays || []);
    } catch (err: any) {
      console.error('Failed to load map data', err);
      setError(err.message || 'Unable to connect to destination catalog.');
    } finally {
      setIsLoading(false);
    }
  };

  const getMarkerCategory = (slug?: string) => {
    if (!slug) return 'default';
    if (slug.includes('heritage')) return 'heritage';
    if (slug.includes('hills') || slug.includes('nature')) return 'hills';
    if (slug.includes('wildlife')) return 'wildlife';
    if (slug.includes('coastal') || slug.includes('beach')) return 'coastal';
    if (slug.includes('waterfall')) return 'waterfalls';
    if (slug.includes('spiritual')) return 'spiritual';
    if (slug.includes('culture') || slug.includes('cities')) return 'culture';
    return 'default';
  };

  const filteredDestinations = destinations.filter((d) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'homestays') return false;
    return d.category_slug?.includes(activeFilter) || d.category_name?.toLowerCase().includes(activeFilter);
  });

  const showHomestays = activeFilter === 'all' || activeFilter === 'homestays';

  const filterButtons = [
    { label: 'All Places', value: 'all' },
    { label: '🏛️ Heritage', value: 'heritage' },
    { label: '⛰️ Hills & Nature', value: 'hills' },
    { label: '🐅 Wildlife', value: 'wildlife' },
    { label: '🏖️ Coastal', value: 'coastal' },
    { label: '🌊 Waterfalls', value: 'waterfall' },
    { label: '🕉️ Spiritual', value: 'spiritual' },
    { label: '🏡 Homestays', value: 'homestays' },
  ];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col relative overflow-hidden bg-ivory">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[500] max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-elevated border border-ivory-300 pointer-events-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center text-white">
            <Compass className="w-5 h-5 text-terracotta-300" />
          </div>
          <div>
            <h1 className="font-serif text-base sm:text-lg font-bold text-charcoal">
              Interactive Karnataka Map
            </h1>
            <p className="text-[11px] text-charcoal-400">
              {filteredDestinations.length} destinations • {showHomestays ? homestays.length : 0} homestays mapped
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 border border-red-200 px-4 py-2 rounded-2xl shadow-elevated pointer-events-auto flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => loadMapData()}
              className="ml-2 px-2 py-1 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Filter Scroll Pills */}
        <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-elevated border border-ivory-300 pointer-events-auto overflow-x-auto max-w-full flex items-center gap-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setActiveFilter(btn.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeFilter === btn.value
                  ? 'bg-forest text-white shadow-sm'
                  : 'text-charcoal-600 hover:bg-ivory-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full h-full">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter center={mapCenter} zoom={mapZoom} />

          {/* Destination Markers */}
          {filteredDestinations.map((dest) => {
            const lat = Number(dest.latitude);
            const lng = Number(dest.longitude);
            if (!lat || !lng) return null;

            const categoryKey = getMarkerCategory(dest.category_slug);
            const icon = iconsMap[categoryKey] || iconsMap.default;

            return (
              <Marker key={`dest-${dest.id}`} position={[lat, lng]} icon={icon}>
                <Popup>
                  <div className="w-64 overflow-hidden rounded-2xl bg-white shadow-card">
                    <img
                      src={
                        dest.primary_image ||
                        dest.cover_image ||
                        dest.image_url ||
                        'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={dest.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-28 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-terracotta uppercase tracking-wider">
                          {dest.category_name || dest.category_slug}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{Number(dest.rating_avg || 4.8).toFixed(1)}</span>
                        </div>
                      </div>
                      <h4 className="font-serif text-base font-bold text-charcoal leading-tight">
                        {dest.name}
                      </h4>
                      <p className="text-xs text-charcoal-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-terracotta" />
                        {dest.locality ? `${dest.locality}, ` : ''}{dest.district}, Karnataka
                      </p>
                      <p className="text-xs text-charcoal-500 mt-2 line-clamp-2 leading-relaxed">
                        {dest.description || dest.short_description}
                      </p>
                      <Link
                        to={`/destinations/${dest.slug}`}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-forest hover:text-terracotta transition"
                      >
                        Explore Destination <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Homestay Markers */}
          {showHomestays &&
            homestays.map((stay) => {
              const lat = Number(stay.latitude);
              const lng = Number(stay.longitude);
              if (!lat || !lng) return null;

              return (
                <Marker
                  key={`stay-${stay.id}`}
                  position={[lat, lng]}
                  icon={iconsMap.homestay}
                >
                  <Popup>
                    <div className="w-64 overflow-hidden rounded-2xl bg-white shadow-card">
                      <img
                        src={
                          stay.primary_image ||
                          stay.cover_image ||
                          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={stay.title || stay.name || 'Homestay'}
                        referrerPolicy="no-referrer"
                        className="w-full h-28 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-forest uppercase tracking-wider">
                            {stay.property_type || 'Homestay'}
                          </span>
                          <span className="text-xs font-bold text-forest">
                            ₹{Number(stay.price_per_night || stay.price_per_night_min || 2500).toLocaleString('en-IN')}/nt
                          </span>
                        </div>
                        <h4 className="font-serif text-base font-bold text-charcoal leading-tight">
                          {stay.title || stay.name}
                        </h4>
                        <p className="text-xs text-charcoal-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-terracotta" />
                          {stay.locality ? `${stay.locality}, ` : ''}{stay.district}, Karnataka
                        </p>
                        <Link
                          to={`/homestays/${stay.slug}`}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-terracotta hover:text-forest transition"
                        >
                          View Rooms & Reserve <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>
      </div>
    </div>
  );
};

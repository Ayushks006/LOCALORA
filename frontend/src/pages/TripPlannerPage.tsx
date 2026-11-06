import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Trash2,
  MapPin,
  Bookmark,
  CheckCircle,
  AlertCircle,
  Clock,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Itinerary, Destination } from '../types';

export const TripPlannerPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [savedDestinations, setSavedDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Itinerary form state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Add Item to itinerary state
  const [selectedDestId, setSelectedDestId] = useState<number | ''>('');
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [itemNotes, setItemNotes] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [itinRes, savedRes] = await Promise.all([
        api.itineraries.getAll().catch(() => ({ itineraries: [] })),
        api.itineraries.getSaved().catch(() => ({ savedDestinations: [] })),
      ]);

      setItineraries(itinRes.itineraries || []);
      setSavedDestinations(savedRes.savedDestinations || []);

      if (itinRes.itineraries && itinRes.itineraries.length > 0) {
        loadItineraryDetails(itinRes.itineraries[0].id);
      } else {
        setSelectedItinerary(null);
      }
    } catch (err) {
      console.error('Failed to load trip planner data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadItineraryDetails = async (id: number) => {
    try {
      const res = await api.itineraries.getById(id);
      setSelectedItinerary(res.itinerary);
    } catch (err) {
      console.error('Failed to load itinerary details', err);
    }
  };

  const handleCreateItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Please provide a title for your trip.');
      return;
    }
    setFormError(null);

    try {
      const res = await api.itineraries.create({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        start_date: newStartDate || undefined,
        end_date: newEndDate || undefined,
      });

      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');
      setNewStartDate('');
      setNewEndDate('');

      await loadData();
      if (res.itineraryId) {
        await loadItineraryDetails(res.itineraryId);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create itinerary.');
    }
  };

  const handleAddItem = async (destId: number) => {
    if (!selectedItinerary) return;

    try {
      await api.itineraries.addItem(selectedItinerary.id, {
        destination_id: destId,
        day_number: dayNumber || 1,
        notes: itemNotes.trim() || undefined,
      });

      setSelectedDestId('');
      setItemNotes('');
      await loadItineraryDetails(selectedItinerary.id);
    } catch (err: any) {
      alert(err.message || 'Failed to add place to itinerary.');
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!selectedItinerary) return;
    try {
      await api.itineraries.removeItem(selectedItinerary.id, itemId);
      await loadItineraryDetails(selectedItinerary.id);
    } catch (err) {
      console.error('Failed to remove item', err);
    }
  };

  const handleDeleteItinerary = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this itinerary?')) return;
    try {
      await api.itineraries.deleteItinerary(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete itinerary', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-ivory-200 text-center shadow-card">
          <Calendar className="w-12 h-12 text-forest mx-auto mb-3" />
          <h2 className="font-serif text-2xl font-bold text-charcoal mb-2">Trip Planner</h2>
          <p className="text-sm text-charcoal-500 mb-6">
            Log in or create a tourist account to craft custom day-by-day Karnataka itineraries, bookmark destinations, and schedule homestay stays.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest-700 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl border border-forest text-forest text-xs font-semibold hover:bg-forest-50 transition"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory pb-20">
      {/* Header */}
      <section className="bg-forest text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-700 text-xs font-semibold uppercase text-terracotta-200 mb-2">
              <Compass className="w-3.5 h-3.5" />
              Smart Travel Planner
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">My Karnataka Itineraries</h1>
            <p className="text-forest-100 text-xs sm:text-sm mt-1">
              Organize destinations by day, coordinate with homestay check-ins, and curate your personal route.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-5 py-2.5 rounded-xl bg-terracotta text-white font-semibold text-xs sm:text-sm hover:bg-terracotta-600 transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> {isCreating ? 'Cancel' : 'New Itinerary'}
          </button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Create Itinerary Form */}
        {isCreating && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft mb-8 max-w-2xl">
            <h3 className="font-serif text-xl font-bold text-forest mb-4">Create New Journey</h3>
            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            <form onSubmit={handleCreateItinerary} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Itinerary Title *</label>
                <input
                  type="text"
                  placeholder="e.g. 5-Day Heritage Trail (Hampi, Badami & Pattadakal)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-sm focus:outline-none focus:border-forest"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-sm focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-sm focus:outline-none focus:border-forest"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Trip Overview / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes about travel companions, vehicle rental, or preferred tempo..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-sm focus:outline-none focus:border-forest"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs font-semibold text-charcoal-500 hover:bg-ivory rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-forest text-white rounded-xl text-xs font-semibold hover:bg-forest-700 shadow-sm"
                >
                  Save Itinerary
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Itinerary list & Saved Places */}
          <div className="space-y-6">
            {/* Itinerary Selectors */}
            <div className="bg-white rounded-3xl p-6 border border-ivory-200 shadow-soft">
              <h3 className="font-serif text-lg font-bold text-forest mb-3">Your Itineraries</h3>
              {itineraries.length === 0 ? (
                <p className="text-xs text-charcoal-400 italic">No itineraries created yet.</p>
              ) : (
                <div className="space-y-2">
                  {itineraries.map((itin) => (
                    <button
                      key={itin.id}
                      onClick={() => loadItineraryDetails(itin.id)}
                      className={`w-full text-left p-3.5 rounded-2xl transition border flex items-center justify-between ${
                        selectedItinerary?.id === itin.id
                          ? 'bg-forest text-white border-forest shadow-sm'
                          : 'bg-ivory/50 text-charcoal border-ivory-200 hover:bg-ivory'
                      }`}
                    >
                      <div>
                        <h4 className="font-semibold text-xs sm:text-sm leading-tight">{itin.title}</h4>
                        <span className={`text-[10px] block mt-0.5 ${selectedItinerary?.id === itin.id ? 'text-ivory-200' : 'text-charcoal-400'}`}>
                          {itin.items_count || (itin.items ? itin.items.length : 0)} places scheduled
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-75 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Saved / Bookmarked Places */}
            <div className="bg-white rounded-3xl p-6 border border-ivory-200 shadow-soft">
              <h3 className="font-serif text-lg font-bold text-forest mb-1 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-terracotta" /> Saved Places
              </h3>
              <p className="text-xs text-charcoal-400 mb-4">Destinations you bookmarked while browsing</p>

              {savedDestinations.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-charcoal-400">No saved destinations yet.</p>
                  <Link
                    to="/destinations"
                    className="mt-2 inline-block text-xs font-semibold text-forest hover:text-terracotta"
                  >
                    Browse Destinations →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {savedDestinations.map((dest) => (
                    <div
                      key={dest.id}
                      className="p-3 rounded-2xl bg-ivory/50 border border-ivory-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <h5 className="font-bold text-charcoal truncate">{dest.name}</h5>
                        <p className="text-[10px] text-charcoal-400">{dest.district}</p>
                      </div>
                      {selectedItinerary && (
                        <button
                          onClick={() => handleAddItem(dest.id)}
                          className="px-2.5 py-1 rounded-lg bg-forest text-white text-[10px] font-semibold hover:bg-forest-700 whitespace-nowrap flex items-center gap-1 flex-shrink-0"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Selected Itinerary Details */}
          <div className="lg:col-span-2">
            {!selectedItinerary ? (
              <div className="bg-white rounded-3xl p-12 border border-ivory-200 text-center shadow-soft">
                <Calendar className="w-12 h-12 text-forest-300 mx-auto mb-3" />
                <h3 className="font-serif text-xl font-bold text-charcoal">Select or Create an Itinerary</h3>
                <p className="text-charcoal-400 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                  Pick one of your planned trips on the left or create a new route to build a day-by-day plan.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-200 shadow-soft space-y-6">
                {/* Header of selected itinerary */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ivory-200 pb-6">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-charcoal">
                      {selectedItinerary.title}
                    </h2>
                    {selectedItinerary.description && (
                      <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
                        {selectedItinerary.description}
                      </p>
                    )}
                    {(selectedItinerary.start_date || selectedItinerary.end_date) && (
                      <p className="text-xs text-charcoal-400 flex items-center gap-1.5 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-terracotta" />
                        {selectedItinerary.start_date ? new Date(selectedItinerary.start_date).toLocaleDateString() : 'TBD'}
                        {' — '}
                        {selectedItinerary.end_date ? new Date(selectedItinerary.end_date).toLocaleDateString() : 'TBD'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteItinerary(selectedItinerary.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition text-xs flex items-center gap-1"
                    title="Delete Itinerary"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Trip
                  </button>
                </div>

                {/* Scheduled Items List */}
                <div className="space-y-4">
                  <h3 className="font-serif text-lg font-bold text-forest">Scheduled Stops</h3>

                  {!selectedItinerary.items || selectedItinerary.items.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-ivory/50 border border-ivory-200 text-center">
                      <MapPin className="w-8 h-8 text-charcoal-300 mx-auto mb-2" />
                      <p className="text-xs text-charcoal-500 font-semibold">No stops scheduled yet</p>
                      <p className="text-[11px] text-charcoal-400 mt-0.5">
                        Click "+ Add" on any saved destination from the left panel to attach it to Day 1.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedItinerary.items.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl bg-ivory/40 border border-ivory-200 flex items-start justify-between gap-4"
                        >
                          <div className="flex items-start gap-3">
                            <span className="w-8 h-8 rounded-xl bg-forest text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                              D{item.day_number || 1}
                            </span>
                            <div>
                              <h4 className="font-bold text-sm text-charcoal">{item.destination_name}</h4>
                              <p className="text-xs text-charcoal-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-terracotta" />
                                {item.district}, Karnataka
                              </p>
                              {item.notes && (
                                <p className="text-xs text-charcoal-500 mt-2 bg-white/60 p-2 rounded-lg border border-ivory-200">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-charcoal-300 hover:text-red-500 p-1 rounded-lg transition"
                            title="Remove stop"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import {
  User,
  Destination,
  Category,
  Region,
  Homestay,
  GuideProfile,
  Experience,
  Booking,
  Review,
  CommunitySubmission,
  Notification,
  Itinerary,
} from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('localora_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('localora_token', token);
  } else {
    localStorage.removeItem('localora_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

import { fallbackDestinations } from '../data/destinationsFallback';

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (payload: any) =>
      request<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getMe: () => request<{ user: User }>('/auth/me'),
    getProfile: () =>
      request<{ user: User; guideProfile?: any; homestay?: any; culturalBusiness?: any }>('/auth/profile'),
    updateProfile: (data: {
      full_name: string;
      phone?: string;
      avatar_url?: string;
      bio?: string;
      city?: string;
      preferred_language?: string;
      guideProfile?: any;
      homestay?: any;
      culturalBusiness?: any;
    }) =>
      request<{
        message: string;
        user: User;
        guideProfile?: any;
        homestay?: any;
        culturalBusiness?: any;
      }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    uploadProfilePhoto: (payload: { image: string; filename?: string }) =>
      request<{ message: string; avatar_url: string; user: User }>('/auth/profile-photo', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Destinations
  destinations: {
    getAll: async (params?: { search?: string; category?: string; district?: string; featured?: boolean }) => {
      try {
        const query = new URLSearchParams();
        if (params?.search) query.append('search', params.search);
        if (params?.category) query.append('category', params.category);
        if (params?.district) query.append('district', params.district);
        if (params?.featured) query.append('featured', 'true');
        const res = await request<{ destinations: Destination[] }>(`/destinations?${query.toString()}`);
        if (res.destinations && res.destinations.length > 0) {
          return res;
        }
      } catch (err) {
        console.warn('Backend API /destinations unavailable, serving verified local catalog:', err);
      }

      // Filter verified fallback catalog
      let list = fallbackDestinations;
      if (params?.category) {
        list = list.filter((d) => d.category_slug === params.category);
      }
      if (params?.district) {
        list = list.filter((d) => d.district.toLowerCase() === params.district?.toLowerCase());
      }
      if (params?.featured) {
        list = list.filter((d) => Boolean(d.is_featured));
      }
      if (params?.search) {
        const term = params.search.toLowerCase();
        list = list.filter(
          (d) =>
            d.name.toLowerCase().includes(term) ||
            d.district.toLowerCase().includes(term) ||
            d.locality.toLowerCase().includes(term) ||
            d.description.toLowerCase().includes(term)
        );
      }
      return { destinations: list };
    },

    getBySlug: async (slug: string) => {
      try {
        const res = await request<{ destination: Destination }>(`/destinations/${slug}`);
        if (res.destination) return res;
      } catch (err) {
        console.warn(`Backend API /destinations/${slug} unavailable, checking verified catalog:`, err);
      }
      const match = fallbackDestinations.find((d) => d.slug === slug);
      if (match) {
        return { destination: match };
      }
      throw new Error(`Destination with slug '${slug}' not found.`);
    },

    getCategories: async () => {
      try {
        const res = await request<{ categories: Category[] }>('/destinations/categories');
        if (res.categories && res.categories.length > 0) return res;
      } catch (err) {
        console.warn('Backend API /destinations/categories unavailable, using standard categories:', err);
      }
      return {
        categories: [
          { slug: 'heritage', name: 'Heritage & History', description: 'Ancient empires, monolithic stone temples, and royal palaces', icon: 'Landmark' },
          { slug: 'hills-nature', name: 'Hills & Nature', description: 'Misty peaks, coffee valleys, and pristine Western Ghats ridges', icon: 'Mountain' },
          { slug: 'wildlife', name: 'Wildlife & Sanctuaries', description: 'Tiger reserves, wild elephant corridors, and endemic bird colonies', icon: 'Trees' },
          { slug: 'coastal', name: 'Beaches & Coastal', description: 'Arabian Sea coastlines, geological islands, and tranquil shores', icon: 'Waves' },
          { slug: 'waterfalls', name: 'Waterfalls & Gorges', description: 'Plunging river cascades and deep forest canyons', icon: 'Droplets' },
          { slug: 'spiritual', name: 'Spiritual Destinations', description: 'Centuries-old pilgrimage centers, mutts, and sacred rivers', icon: 'Sun' },
          { slug: 'culture-cities', name: 'Culture & Cities', description: 'Botanical parks, vibrant bazaars, and traditional festivals', icon: 'Sparkles' },
        ],
      };
    },

    getRegions: async () => {
      try {
        const res = await request<{ regions: Region[] }>('/destinations/regions');
        if (res.regions && res.regions.length > 0) return res;
      } catch (err) {
        console.warn('Backend API /destinations/regions unavailable, using standard regions:', err);
      }
      return {
        regions: [
          { code: 'KA', name: 'Karnataka', country: 'India', is_active: 1 },
          { code: 'KL', name: 'Kerala', country: 'India', is_active: 1 },
          { code: 'GA', name: 'Goa', country: 'India', is_active: 1 },
          { code: 'TN', name: 'Tamil Nadu', country: 'India', is_active: 1 },
          { code: 'MH', name: 'Maharashtra', country: 'India', is_active: 1 },
        ],
      };
    },

    getDistricts: async () => {
      try {
        const res = await request<{ districts: string[] }>('/destinations/districts');
        if (res.districts && res.districts.length > 0) return res;
      } catch (err) {}
      const uniqueDistricts = Array.from(new Set(fallbackDestinations.map((d) => d.district))).sort();
      return { districts: uniqueDistricts };
    },
  },

  // Homestays
  homestays: {
    getAll: (params?: { district?: string; property_type?: string; max_price?: number; guests?: number; min_rating?: number }) => {
      const query = new URLSearchParams();
      if (params?.district) query.append('district', params.district);
      if (params?.property_type) query.append('property_type', params.property_type);
      if (params?.max_price) query.append('max_price', String(params.max_price));
      if (params?.guests) query.append('guests', String(params.guests));
      if (params?.min_rating) query.append('min_rating', String(params.min_rating));
      return request<{ homestays: Homestay[] }>(`/homestays?${query.toString()}`);
    },
    getBySlug: (slug: string) => request<{ homestay: Homestay }>(`/homestays/${slug}`),
    getMyListings: () => request<{ listings: Homestay[] }>('/homestays/me/listings'),
    createListing: (data: any) =>
      request<{ message: string; homestayId: number }>('/homestays', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMyBookings: () => request<{ bookings: Booking[] }>('/homestays/me/bookings'),
  },

  // Guides
  guides: {
    getAll: (params?: { district?: string; language?: string; max_price?: number; min_rating?: number }) => {
      const query = new URLSearchParams();
      if (params?.district) query.append('district', params.district);
      if (params?.language) query.append('language', params.language);
      if (params?.max_price) query.append('max_price', String(params.max_price));
      if (params?.min_rating) query.append('min_rating', String(params.min_rating));
      return request<{ guides: GuideProfile[] }>(`/guides?${query.toString()}`);
    },
    getById: (id: number) => request<{ guide: GuideProfile }>(`/guides/${id}`),
    getMyProfile: () => request<{ guide: GuideProfile }>('/guides/me/profile'),
    updateMyProfile: (data: any) =>
      request<{ message: string }>('/guides/me/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getMyBookings: () => request<{ bookings: Booking[] }>('/guides/me/bookings'),
  },

  // Experiences
  experiences: {
    getAll: (params?: { district?: string; category?: string; max_price?: number }) => {
      const query = new URLSearchParams();
      if (params?.district) query.append('district', params.district);
      if (params?.category) query.append('category', params.category);
      if (params?.max_price) query.append('max_price', String(params.max_price));
      return request<{ experiences: Experience[] }>(`/experiences?${query.toString()}`);
    },
    getBySlug: (slug: string) => request<{ experience: Experience }>(`/experiences/${slug}`),
    getMyExperiences: () => request<{ experiences: Experience[] }>('/experiences/me/experiences'),
    createExperience: (data: any) =>
      request<{ message: string; experienceId: number }>('/experiences', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMyBookings: () => request<{ bookings: Booking[] }>('/experiences/me/bookings'),
  },

  // Bookings
  bookings: {
    checkAvailability: (params: { booking_type: string; item_id: number; room_id?: number | null; start_date: string; end_date: string; guests_count?: number }) => {
      const query = new URLSearchParams({
        booking_type: params.booking_type,
        item_id: String(params.item_id),
        start_date: params.start_date,
        end_date: params.end_date,
        guests_count: String(params.guests_count || 1),
      });
      if (params.room_id) query.append('room_id', String(params.room_id));
      return request<{ available: boolean; reason?: string }>(`/bookings/check-availability?${query.toString()}`);
    },
    create: (data: any) =>
      request<{ message: string; booking: Booking }>('/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMyBookings: (status?: string) => {
      const query = status ? `?status=${status}` : '';
      return request<{ bookings: Booking[] }>(`/bookings/me${query}`);
    },
    getById: (id: number) => request<{ booking: Booking; history: any[] }>(`/bookings/${id}`),
    updateStatus: (id: number, status: string, reason?: string) =>
      request<{ message: string; booking: Booking }>(`/bookings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
      }),
    cancel: (id: number, reason?: string) =>
      request<{ message: string; booking: Booking }>(`/bookings/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  // Payments
  payments: {
    createOrder: (booking_id: number) =>
      request<{ orderId: string; amount: number; currency: string; provider: string; keyId?: string; isSimulated: boolean }>(
        '/payments/create-order',
        {
          method: 'POST',
          body: JSON.stringify({ booking_id }),
        }
      ),
    simulate: (booking_id: number, should_succeed = true) =>
      request<{ message: string; payment: any; isSimulation: boolean }>('/payments/simulate', {
        method: 'POST',
        body: JSON.stringify({ booking_id, should_succeed }),
      }),
    verifyRazorpay: (data: { booking_id: number; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
      request<{ message: string }>('/payments/verify-razorpay', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Reviews
  reviews: {
    getByItem: (type: string, id: number) => request<{ reviews: Review[] }>(`/reviews/item/${type}/${id}`),
    getEligible: () => request<{ eligibleBookings: Booking[] }>('/reviews/eligible'),
    submit: (data: { target_type: string; target_id: number; rating: number; comment: string; booking_id?: number }) =>
      request<{ message: string; reviewId: number }>('/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Community
  community: {
    suggest: (data: any) =>
      request<{ message: string; submissionId: number }>('/community/suggest', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getHiddenGems: () => request<{ hiddenGems: Destination[] }>('/community/hidden-gems'),
  },

  // Itineraries & Saved
  itineraries: {
    getSaved: () => request<{ savedDestinations: Destination[] }>('/itineraries/saved'),
    toggleSave: (destination_id: number) =>
      request<{ isSaved: boolean; message: string }>('/itineraries/saved/toggle', {
        method: 'POST',
        body: JSON.stringify({ destination_id }),
      }),
    getAll: () => request<{ itineraries: Itinerary[] }>('/itineraries'),
    getById: (id: number) => request<{ itinerary: Itinerary }>(`/itineraries/${id}`),
    create: (data: { title: string; description?: string; start_date?: string; end_date?: string }) =>
      request<{ message: string; itineraryId: number }>('/itineraries', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    addItem: (itineraryId: number, data: { destination_id: number; day_number?: number; notes?: string }) =>
      request<{ message: string }>(`/itineraries/${itineraryId}/items`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    removeItem: (itineraryId: number, itemId: number) =>
      request<{ message: string }>(`/itineraries/${itineraryId}/items/${itemId}`, {
        method: 'DELETE',
      }),
    deleteItinerary: (id: number) =>
      request<{ message: string }>(`/itineraries/${id}`, {
        method: 'DELETE',
      }),
  },

  // Notifications
  notifications: {
    getAll: () => request<{ notifications: Notification[]; unreadCount: number }>('/notifications'),
    markRead: (id: number) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request<{ count: number }>('/notifications/read-all', { method: 'PUT' }),
  },

  // Admin
  admin: {
    getStats: () => request<{ stats: any }>('/admin/stats'),
    getUsers: (params?: { role?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.role) q.append('role', params.role);
      if (params?.search) q.append('search', params.search);
      return request<{ users: User[] }>(`/admin/users?${q.toString()}`);
    },
    toggleUserStatus: (id: number) =>
      request<{ message: string; is_active: number }>(`/admin/users/${id}/toggle-status`, { method: 'PUT' }),
    getGuides: () => request<{ guides: any[] }>('/admin/guides'),
    verifyGuide: (id: number, verified: boolean) =>
      request<{ message: string }>(`/admin/guides/${id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ verified }),
      }),
    getHomestays: () => request<{ homestays: any[] }>('/admin/homestays'),
    verifyHomestay: (id: number, verified: boolean) =>
      request<{ message: string }>(`/admin/homestays/${id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ verified }),
      }),
    getExperiences: () => request<{ experiences: any[] }>('/admin/experiences'),
    verifyExperience: (id: number, verified: boolean) =>
      request<{ message: string }>(`/admin/experiences/${id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ verified }),
      }),
    getCommunity: () => request<{ submissions: CommunitySubmission[] }>('/admin/community'),
    moderateCommunity: (id: number, data: { status: string; admin_notes?: string; publish_as_destination?: boolean }) =>
      request<{ message: string }>(`/admin/community/${id}/moderate`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getBookings: () => request<{ bookings: any[] }>('/admin/bookings'),
    getReviews: () => request<{ reviews: any[] }>('/admin/reviews'),
    moderateReview: (id: number, is_approved: boolean) =>
      request<{ message: string }>(`/admin/reviews/${id}/moderate`, {
        method: 'PUT',
        body: JSON.stringify({ is_approved }),
      }),
    getAuditLogs: () => request<{ logs: any[] }>('/admin/audit-logs'),
  },
};

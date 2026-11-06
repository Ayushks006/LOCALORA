export type UserRole = 'tourist' | 'guide' | 'homestay_owner' | 'business_owner' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  city?: string;
  preferred_language?: string;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Region {
  code: string;
  name: string;
  country: string;
  is_active: number;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export interface Destination {
  id: number;
  slug: string;
  name: string;
  region_code: string;
  region_name?: string;
  district: string;
  locality: string;
  category_slug: string;
  category_name?: string;
  description: string;
  short_description?: string;
  long_description?: string;
  latitude: number;
  longitude: number;
  best_time_to_visit: string;
  suggested_duration?: string;
  travel_tips?: string;
  primary_image?: string;
  cover_image?: string;
  image_url?: string;
  rating_avg?: number;
  reviews_count?: number;
  is_verified?: number;
  is_featured?: number;
  is_saved?: boolean;
  attractions?: DestinationAttraction[];
  images?: DestinationImage[];
  nearbyHomestays?: Homestay[];
  nearbyGuides?: GuideProfile[];
  nearbyExperiences?: Experience[];
}

export interface DestinationAttraction {
  id: number;
  destination_id: number;
  title: string;
  description: string;
  image_url: string;
}

export interface DestinationImage {
  id: number;
  destination_id: number;
  url: string;
  caption: string;
  attribution: string;
  license: string;
  sort_order?: number;
  is_cover?: number;
  alt_text?: string;
}

export interface GuideProfile {
  id: number;
  user_id: number;
  full_name?: string;
  email?: string;
  phone?: string;
  service_area: string;
  district: string;
  languages: string[];
  years_experience?: number;
  bio: string;
  pricing_per_day: number;
  pricing_unit?: string;
  verified: number;
  profile_image?: string;
  avatar_url?: string;
  badge_label?: string;
  license_number?: string;
  rating_avg: number;
  reviews_count: number;
  reviews?: Review[];
}

export interface Homestay {
  id: number;
  owner_id: number;
  owner_name?: string;
  owner_phone?: string;
  title?: string;
  name?: string;
  slug: string;
  region_code: string;
  district: string;
  locality: string;
  address?: string;
  description: string;
  property_type: string;
  max_guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  price_per_night?: number;
  price_per_night_min?: number;
  amenities?: string[];
  rules?: string;
  check_in_time?: string;
  check_out_time?: string;
  latitude: number;
  longitude: number;
  primary_image?: string;
  cover_image?: string;
  verified: number;
  rating_avg: number;
  reviews_count: number;
  rooms?: HomestayRoom[];
  reviews?: Review[];
}

export interface HomestayRoom {
  id: number;
  homestay_id: number;
  room_name: string;
  capacity: number;
  price_per_night: number;
  description: string;
}

export interface Experience {
  id: number;
  business_id: number;
  business_name?: string;
  business_bio?: string;
  business_address?: string;
  contact_phone?: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  region_code: string;
  district: string;
  locality: string;
  duration_hours: number;
  price_per_person: number;
  max_group_size?: number;
  max_participants?: number;
  includes: string[];
  primary_image?: string;
  image_url?: string;
  verified: number;
  rating_avg: number;
  reviews_count: number;
  reviews?: Review[];
}

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'paid';
export type BookingType = 'homestay' | 'guide' | 'experience';

export interface Booking {
  id: number;
  reference_number?: string;
  booking_code?: string;
  user_id: number;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  tourist_name?: string;
  tourist_email?: string;
  tourist_phone?: string;
  booking_type: BookingType;
  item_id: number;
  room_id?: number | null;
  room_name?: string;
  start_date: string;
  end_date: string;
  guests_count: number;
  unit_price?: number;
  total_nights_or_days?: number;
  total_amount?: number;
  total_price?: number;
  currency?: string;
  status: BookingStatus;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_provider?: 'razorpay' | 'demo';
  transaction_id?: string;
  item_title?: string;
  item_image?: string;
  item_locality?: string;
}

export interface Review {
  id: number;
  user_id: number;
  author_name?: string;
  user_name?: string;
  booking_id?: number;
  target_type: 'destination' | 'homestay' | 'guide' | 'experience';
  target_id: number;
  rating: number;
  comment: string;
  created_at: string;
  is_verified_booking?: boolean | number;
}

export interface CommunitySubmission {
  id: number;
  contributor_name: string;
  contributor_email: string;
  destination_name: string;
  region_code: string;
  district: string;
  locality: string;
  category_slug: string;
  description: string;
  best_time?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  image_attribution?: string;
  status: 'pending' | 'needs_info' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  link_url?: string;
  is_read: number;
  created_at: string;
}

export interface Itinerary {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_public: number;
  created_at: string;
  items_count?: number;
  items?: ItineraryItem[];
}

export interface ItineraryItem {
  id: number;
  itinerary_id: number;
  destination_id: number;
  destination_name?: string;
  destination_slug?: string;
  district?: string;
  category_slug?: string;
  primary_image?: string;
  latitude?: number;
  longitude?: number;
  day_number: number;
  order_index: number;
  notes?: string;
}

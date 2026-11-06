export type UserRole = 'tourist' | 'guide' | 'homestay_owner' | 'business_owner' | 'admin';

export interface User {
  id: number;
  email: string;
  password_hash?: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  city?: string;
  preferred_language?: string;
  is_active: number; // 0 or 1
  created_at: string;
  updated_at: string;
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
  district: string;
  locality: string;
  category_slug: string;
  description: string;
  long_description: string;
  latitude: number;
  longitude: number;
  best_time_to_visit: string;
  suggested_duration: string;
  travel_tips?: string;
  primary_image: string;
  is_verified: number;
  is_featured: number;
  created_at: string;
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
}

export interface GuideProfile {
  id: number;
  user_id: number;
  service_area: string;
  district: string;
  languages: string; // JSON array of string
  years_experience: number;
  bio: string;
  pricing_per_day: number;
  pricing_unit: string;
  verified: number;
  profile_image: string;
  rating_avg: number;
  reviews_count: number;
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface Homestay {
  id: number;
  owner_id: number;
  title: string;
  slug: string;
  region_code: string;
  district: string;
  locality: string;
  address: string;
  description: string;
  property_type: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  price_per_night: number;
  amenities: string; // JSON array of strings
  rules: string;
  check_in_time: string;
  check_out_time: string;
  latitude: number;
  longitude: number;
  primary_image: string;
  verified: number;
  rating_avg: number;
  reviews_count: number;
  owner_name?: string;
}

export interface HomestayRoom {
  id: number;
  homestay_id: number;
  room_name: string;
  capacity: number;
  price_per_night: number;
  description: string;
}

export interface CulturalBusiness {
  id: number;
  owner_id: number;
  business_name: string;
  category: string;
  description: string;
  region_code: string;
  district: string;
  locality: string;
  address: string;
  contact_phone: string;
  verified: number;
  created_at: string;
}

export interface Experience {
  id: number;
  business_id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  region_code: string;
  district: string;
  locality: string;
  duration_hours: number;
  price_per_person: number;
  max_group_size: number;
  includes: string; // JSON array
  primary_image: string;
  verified: number;
  rating_avg: number;
  reviews_count: number;
  business_name?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
export type BookingType = 'homestay' | 'guide' | 'experience';

export interface Booking {
  id: number;
  reference_number: string;
  user_id: number;
  booking_type: BookingType;
  item_id: number;
  room_id?: number | null;
  start_date: string; // YYYY-MM-DD or ISO
  end_date: string;   // YYYY-MM-DD or ISO
  guests_count: number;
  unit_price: number;
  total_nights_or_days: number;
  total_amount: number;
  currency: string;
  status: BookingStatus;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  // joined fields
  user_name?: string;
  user_email?: string;
  item_title?: string;
  item_image?: string;
  item_locality?: string;
}

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_provider: 'razorpay' | 'demo';
  transaction_id?: string;
  order_id?: string;
  signature?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  user_id: number;
  booking_id?: number | null;
  target_type: 'destination' | 'homestay' | 'guide' | 'experience';
  target_id: number;
  rating: number; // 1 to 5
  comment: string;
  is_moderated: number;
  is_approved: number;
  created_at: string;
  user_name?: string;
}

export interface CommunitySubmission {
  id: number;
  contributor_name: string;
  contributor_email: string;
  user_id?: number | null;
  destination_name: string;
  region_code: string;
  district: string;
  locality: string;
  category_slug: string;
  description: string;
  best_time?: string;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string;
  image_attribution?: string;
  status: 'pending' | 'needs_info' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
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

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  target_type: string;
  target_id?: number | null;
  details?: string;
  created_at: string;
  user_name?: string;
}

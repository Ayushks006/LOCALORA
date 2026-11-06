import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Globe,
  Camera,
  CheckCircle,
  AlertCircle,
  Shield,
  Briefcase,
  Home,
  Sparkles,
  Save,
  RotateCw,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserRole } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User Core Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Guide Profile Fields
  const [guideData, setGuideData] = useState<{
    service_area: string;
    district: string;
    languages: string;
    years_experience: number;
    bio: string;
    pricing_per_day: number;
  }>({
    service_area: '',
    district: '',
    languages: 'Kannada, English',
    years_experience: 1,
    bio: '',
    pricing_per_day: 1500,
  });

  // Homestay Profile Fields
  const [homestayData, setHomestayData] = useState<{
    title: string;
    property_type: string;
    district: string;
    locality: string;
    address: string;
    description: string;
    price_per_night: number;
    max_guests: number;
    amenities: string;
    rules: string;
  }>({
    title: '',
    property_type: 'Plantation Bungalow',
    district: '',
    locality: '',
    address: '',
    description: '',
    price_per_night: 3500,
    max_guests: 4,
    amenities: 'Wi-Fi, Traditional Meals, Hot Water, Coffee Estate Walk',
    rules: '',
  });

  // Cultural Business Fields
  const [businessData, setBusinessData] = useState<{
    business_name: string;
    category: string;
    description: string;
    district: string;
    locality: string;
    address: string;
    contact_phone: string;
  }>({
    business_name: '',
    category: 'Traditional Handicrafts',
    description: '',
    district: '',
    locality: '',
    address: '',
    contact_phone: '',
  });

  // Photo upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/profile');
      return;
    }

    if (isAuthenticated) {
      loadFullProfile();
    }
  }, [authLoading, isAuthenticated]);

  const loadFullProfile = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.auth.getProfile();
      const u = res.user;

      setFullName(u.full_name || '');
      setPhone(u.phone || '');
      setCity(u.city || '');
      setBio(u.bio || '');
      setPreferredLanguage(u.preferred_language || 'English');
      setAvatarUrl(u.avatar_url || '');

      if (res.guideProfile) {
        const langs = Array.isArray(res.guideProfile.languages)
          ? res.guideProfile.languages.join(', ')
          : res.guideProfile.languages || '';
        setGuideData({
          service_area: res.guideProfile.service_area || '',
          district: res.guideProfile.district || '',
          languages: langs,
          years_experience: res.guideProfile.years_experience || 1,
          bio: res.guideProfile.bio || '',
          pricing_per_day: res.guideProfile.pricing_per_day || 1500,
        });
      }

      if (res.homestay) {
        const ams = Array.isArray(res.homestay.amenities)
          ? res.homestay.amenities.join(', ')
          : res.homestay.amenities || '';
        setHomestayData({
          title: res.homestay.title || '',
          property_type: res.homestay.property_type || 'Plantation Bungalow',
          district: res.homestay.district || '',
          locality: res.homestay.locality || '',
          address: res.homestay.address || '',
          description: res.homestay.description || '',
          price_per_night: res.homestay.price_per_night || 3500,
          max_guests: res.homestay.max_guests || 4,
          amenities: ams,
          rules: res.homestay.rules || '',
        });
      }

      if (res.culturalBusiness) {
        setBusinessData({
          business_name: res.culturalBusiness.business_name || '',
          category: res.culturalBusiness.category || 'Traditional Handicrafts',
          description: res.culturalBusiness.description || '',
          district: res.culturalBusiness.district || '',
          locality: res.culturalBusiness.locality || '',
          address: res.culturalBusiness.address || '',
          contact_phone: res.culturalBusiness.contact_phone || '',
        });
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setErrorMsg(err.message || 'Unable to load profile data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif)$/i)) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit. Please choose a smaller photograph.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreviewPhoto(base64);
      await uploadPhotoToServer(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  const uploadPhotoToServer = async (base64Image: string, fileName: string) => {
    setIsUploadingPhoto(true);
    setErrorMsg(null);
    try {
      const res = await api.auth.uploadProfilePhoto({
        image: base64Image,
        filename: fileName,
      });
      setAvatarUrl(res.avatar_url);
      setPreviewPhoto(null);
      updateUser({ avatar_url: res.avatar_url });
      setSuccessMsg('Profile photograph updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      setErrorMsg(err.message || 'Failed to upload photo.');
      setPreviewPhoto(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: any = {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,
        preferred_language: preferredLanguage,
      };

      if (user?.role === 'guide') {
        payload.guideProfile = {
          service_area: guideData.service_area,
          district: guideData.district,
          languages: guideData.languages.split(',').map((s) => s.trim()).filter(Boolean),
          years_experience: Number(guideData.years_experience),
          bio: guideData.bio,
          pricing_per_day: Number(guideData.pricing_per_day),
        };
      } else if (user?.role === 'homestay_owner') {
        payload.homestay = {
          title: homestayData.title,
          property_type: homestayData.property_type,
          district: homestayData.district,
          locality: homestayData.locality,
          address: homestayData.address,
          description: homestayData.description,
          price_per_night: Number(homestayData.price_per_night),
          max_guests: Number(homestayData.max_guests),
          amenities: homestayData.amenities.split(',').map((s) => s.trim()).filter(Boolean),
          rules: homestayData.rules,
        };
      } else if (user?.role === 'business_owner') {
        payload.culturalBusiness = {
          business_name: businessData.business_name,
          category: businessData.category,
          description: businessData.description,
          district: businessData.district,
          locality: businessData.locality,
          address: businessData.address,
          contact_phone: businessData.contact_phone,
        };
      }

      const res = await api.auth.updateProfile(payload);
      updateUser(res.user);
      setSuccessMsg('Your profile has been saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Update failed:', err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Platform Administrator', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'guide':
        return { label: 'Certified Local Guide', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'homestay_owner':
        return { label: 'Homestay Host', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'business_owner':
        return { label: 'Cultural Business & Artisan', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      default:
        return { label: 'Verified Explorer', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <RotateCw className="w-8 h-8 animate-spin text-forest mx-auto mb-3" />
        <p className="text-xs text-charcoal-500 font-medium">Loading user profile settings...</p>
      </div>
    );
  }

  const roleBadge = getRoleBadge(user?.role);
  const currentAvatar = previewPhoto || avatarUrl || user?.avatar_url || '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* 1. HERO HEADER WITH AVATAR & IDENTITY BADGE */}
      <div className="bg-white rounded-3xl border border-ivory-200 p-6 sm:p-8 shadow-soft flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-ivory-100 border-2 border-forest/20 shadow-md flex items-center justify-center relative">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt={fullName || 'User Avatar'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/guides/manjunath-swamy.jpg';
                }}
              />
            ) : (
              <UserIcon className="w-12 h-12 text-forest/40" />
            )}

            {isUploadingPhoto && (
              <div className="absolute inset-0 bg-charcoal/60 flex items-center justify-center backdrop-blur-sm">
                <RotateCw className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            className="absolute -bottom-2 -right-2 p-2 bg-terracotta text-white rounded-xl shadow hover:bg-terracotta/90 transition flex items-center justify-center"
            title="Upload new profile photograph"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal">
              {fullName || user?.full_name || 'My Profile'}
            </h1>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${roleBadge.color}`}>
              {roleBadge.label}
            </span>
          </div>

          <p className="text-xs text-charcoal-500 flex flex-wrap items-center justify-center sm:justify-start gap-4">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-charcoal-400" />
              {user?.email}
            </span>
            {city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-terracotta" />
                {city}, Karnataka
              </span>
            )}
          </p>

          <p className="text-xs text-charcoal-600 line-clamp-2 max-w-xl">
            {bio || 'Customize your public profile, contact details, and role preferences below.'}
          </p>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 shadow-sm animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800 shadow-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* 2. PROFILE EDIT FORM */}
      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* SECTION A: PERSONAL ESSENTIALS */}
        <div className="bg-white rounded-3xl border border-ivory-200 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="border-b border-ivory-100 pb-3 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-forest" />
            <h2 className="font-serif text-lg font-bold text-charcoal">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Full Name <span className="text-terracotta">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Raghavendra Rao"
                className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Current City / Base Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mysuru or Bengaluru"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Preferred Regional Language
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition"
                >
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                  <option value="French">French</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Personal Bio / Statement
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other travelers and local hosts about your passion for exploring Karnataka's heritage and biodiversity..."
              className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition leading-relaxed"
            />
          </div>
        </div>

        {/* SECTION B: ROLE-SPECIFIC SPECIALIST SETTINGS */}
        {user?.role === 'guide' && (
          <div className="bg-white rounded-3xl border border-amber-200 p-6 sm:p-8 shadow-soft space-y-6">
            <div className="border-b border-amber-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-600" />
                <h2 className="font-serif text-lg font-bold text-charcoal">Local Guide Credentials</h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Verified Listing
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Primary Service Area
                </label>
                <input
                  type="text"
                  value={guideData.service_area}
                  onChange={(e) => setGuideData({ ...guideData, service_area: e.target.value })}
                  placeholder="e.g. Vijayanagara & Hampi Ruins"
                  className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Assigned District
                </label>
                <input
                  type="text"
                  value={guideData.district}
                  onChange={(e) => setGuideData({ ...guideData, district: e.target.value })}
                  placeholder="e.g. Vijayanagara or Mysuru"
                  className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Years of Guiding Experience
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={guideData.years_experience}
                  onChange={(e) => setGuideData({ ...guideData, years_experience: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Daily Fee (₹ INR per day)
                </label>
                <input
                  type="number"
                  min={500}
                  step={100}
                  value={guideData.pricing_per_day}
                  onChange={(e) => setGuideData({ ...guideData, pricing_per_day: parseFloat(e.target.value) || 1500 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Languages Spoken (comma separated)
              </label>
              <input
                type="text"
                value={guideData.languages}
                onChange={(e) => setGuideData({ ...guideData, languages: e.target.value })}
                placeholder="Kannada, English, Hindi, French"
                className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Specialist Historical / Ecological Bio
              </label>
              <textarea
                rows={3}
                value={guideData.bio}
                onChange={(e) => setGuideData({ ...guideData, bio: e.target.value })}
                placeholder="Detailed historical epigraphy or wildlife tracking credentials..."
                className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition leading-relaxed"
              />
            </div>
          </div>
        )}

        {user?.role === 'homestay_owner' && (
          <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-soft space-y-6">
            <div className="border-b border-emerald-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-emerald-600" />
                <h2 className="font-serif text-lg font-bold text-charcoal">Homestay Property Information</h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Host Portal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Property Title
                </label>
                <input
                  type="text"
                  value={homestayData.title}
                  onChange={(e) => setHomestayData({ ...homestayData, title: e.target.value })}
                  placeholder="e.g. Mandalpatti Mist Estate Stay"
                  className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Property Type
                </label>
                <select
                  value={homestayData.property_type}
                  onChange={(e) => setHomestayData({ ...homestayData, property_type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                >
                  <option value="Plantation Bungalow">Plantation Bungalow</option>
                  <option value="Heritage Courtyard House">Heritage Courtyard House</option>
                  <option value="Coastal Eco Cottage">Coastal Eco Cottage</option>
                  <option value="Forest Retreat Villa">Forest Retreat Villa</option>
                  <option value="Farmstay">Farmstay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Price per Night (₹ INR)
                </label>
                <input
                  type="number"
                  min={500}
                  step={100}
                  value={homestayData.price_per_night}
                  onChange={(e) => setHomestayData({ ...homestayData, price_per_night: parseFloat(e.target.value) || 3000 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Maximum Guest Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={homestayData.max_guests}
                  onChange={(e) => setHomestayData({ ...homestayData, max_guests: parseInt(e.target.value) || 4 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Key Amenities (comma separated)
              </label>
              <input
                type="text"
                value={homestayData.amenities}
                onChange={(e) => setHomestayData({ ...homestayData, amenities: e.target.value })}
                placeholder="High-Speed Wi-Fi, Fresh Filter Coffee, Traditional Malnad Meals, Campfire"
                className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Property Story & Description
              </label>
              <textarea
                rows={3}
                value={homestayData.description}
                onChange={(e) => setHomestayData({ ...homestayData, description: e.target.value })}
                placeholder="Describe your coffee estate, regional home-cooked cuisine, and guest experience..."
                className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition leading-relaxed"
              />
            </div>
          </div>
        )}

        {user?.role === 'business_owner' && (
          <div className="bg-white rounded-3xl border border-purple-200 p-6 sm:p-8 shadow-soft space-y-6">
            <div className="border-b border-purple-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h2 className="font-serif text-lg font-bold text-charcoal">Cultural Business Profile</h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Artisan Enclave
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Business / Studio Name
                </label>
                <input
                  type="text"
                  value={businessData.business_name}
                  onChange={(e) => setBusinessData({ ...businessData, business_name: e.target.value })}
                  placeholder="e.g. Heritage Mysuru Artisans Guild"
                  className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Craft Category
                </label>
                <input
                  type="text"
                  value={businessData.category}
                  onChange={(e) => setBusinessData({ ...businessData, category: e.target.value })}
                  placeholder="Traditional Arts, Rosewood Inlay, Silk Weaving"
                  className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Heritage Business Description
              </label>
              <textarea
                rows={3}
                value={businessData.description}
                onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })}
                placeholder="Preserving authentic GI-tagged crafts and traditional workshops..."
                className="w-full px-4 py-2.5 rounded-xl border border-ivory-300 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* SECTION C: SECURITY INTEGRITY & AUDIT POLICY */}
        <div className="bg-ivory-50 rounded-3xl border border-ivory-200 p-6 sm:p-8 space-y-4 text-xs text-charcoal">
          <div className="flex items-center gap-2 text-forest font-bold font-serif text-sm">
            <Shield className="w-4 h-4 text-terracotta" />
            <span>Account Security & RBAC Integrity</span>
          </div>
          <p className="text-charcoal-600 leading-relaxed">
            Your login email (<strong>{user?.email}</strong>) and assigned account role (<strong>{user?.role}</strong>)
            are cryptographically sealed against in-app tampering. In compliance with LOCALORA platform governance, role modifications or administrative escalation require direct multi-factor bootstrap authorization.
          </p>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-forest text-white text-xs font-semibold hover:bg-forest/90 transition shadow-soft hover:shadow-hover disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

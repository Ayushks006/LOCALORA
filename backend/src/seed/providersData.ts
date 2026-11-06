export interface SeedGuide {
  email: string;
  full_name: string;
  phone: string;
  service_area: string;
  district: string;
  languages: string[];
  years_experience: number;
  bio: string;
  pricing_per_day: number;
  profile_image: string;
  rating_avg: number;
  reviews_count: number;
}

export interface SeedHomestay {
  owner_email: string;
  owner_name: string;
  owner_phone: string;
  title: string;
  slug: string;
  district: string;
  locality: string;
  address: string;
  description: string;
  property_type: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  price_per_night: number;
  amenities: string[];
  rules: string;
  latitude: number;
  longitude: number;
  primary_image: string;
  rating_avg: number;
  reviews_count: number;
  rooms: { name: string; capacity: number; price: number; description: string }[];
}

export const additionalGuides: SeedGuide[] = [
  {
    email: 'manjunath.mysore@example.com',
    full_name: 'Manjunath Swamy',
    phone: '+91 98765 00011',
    service_area: 'Mysuru Palace & Srirangapatna Heritage',
    district: 'Mysuru',
    languages: ['Kannada', 'English', 'Hindi', 'French'],
    years_experience: 12,
    bio: 'Government-certified senior cultural historian and author specializing in Mysore Wadiyar royalty, Indo-Saracenic palace art, and the Anglo-Mysore wars.',
    pricing_per_day: 2500,
    profile_image: '/images/guides/manjunath-swamy.jpg',
    rating_avg: 4.95,
    reviews_count: 32,
  },
  {
    email: 'ganesh.gokarna@example.com',
    full_name: 'Ganesh Naik',
    phone: '+91 98765 00012',
    service_area: 'Gokarna Beaches & Mirjan Fort',
    district: 'Uttara Kannada',
    languages: ['Kannada', 'English', 'Hindi', 'Konkani'],
    years_experience: 7,
    bio: 'Local coastal naturalist and temple heritage guide. Specializes in the 5-beach cliff trek, sacred Atmalinga mythology, and marine ecology.',
    pricing_per_day: 1800,
    profile_image: '/images/guides/ganesh-naik.jpg',
    rating_avg: 4.88,
    reviews_count: 24,
  },
  {
    email: 'sharath.chikmagalur@example.com',
    full_name: 'Sharath Kumar',
    phone: '+91 98765 00013',
    service_area: 'Mullayanagiri & Kudremukh Wilderness',
    district: 'Chikkamagaluru',
    languages: ['Kannada', 'English', 'Tamil'],
    years_experience: 9,
    bio: 'Certified wilderness first-responder and birdwatching expert leading treks across the Western Ghats shola ridges and coffee heritage trails.',
    pricing_per_day: 2200,
    profile_image: '/images/guides/sharath-kumar.jpg',
    rating_avg: 4.92,
    reviews_count: 19,
  },
  {
    email: 'basavaraj.badami@example.com',
    full_name: 'Basavaraj Naik',
    phone: '+91 98765 00014',
    service_area: 'Badami, Aihole & Pattadakal Circuit',
    district: 'Bagalkote',
    languages: ['Kannada', 'English', 'Hindi', 'Marathi'],
    years_experience: 14,
    bio: 'Archaeological epigraphist and Badami Chalukyan art specialist with 14 years experience decoding 6th-century stone inscriptions and rock-cut cave friezes.',
    pricing_per_day: 2400,
    profile_image: '/images/guides/basavaraj-naik.jpg',
    rating_avg: 4.97,
    reviews_count: 41,
  },
];

export const additionalHomestays: SeedHomestay[] = [
  {
    owner_email: 'deepak.chikmagalur@example.com',
    owner_name: 'Deepak Gowda',
    owner_phone: '+91 98765 00021',
    title: 'Mullayana Peak Eco Estate Stay',
    slug: 'mullayana-peak-eco-stay',
    district: 'Chikkamagaluru',
    locality: 'Mullayanagiri Foothills, Bababudangiri Road',
    address: 'Estate Road 2, Near Mullayanagiri Checkpost, Chikkamagaluru',
    description: 'Tranquil 25-acre organic coffee and silver oak plantation overlooking the misty peaks of Mullayanagiri. Enjoy authentic Malnad akki rotti, filter coffee freshly brewed on site, and mountain stargazing.',
    property_type: 'Estate Bungalow',
    max_guests: 8,
    bedrooms: 4,
    bathrooms: 4,
    price_per_night: 3800,
    amenities: ['High-Speed Wi-Fi', 'Fresh Estate Brewed Coffee', 'Malnad Traditional Meals', 'Campfire Under Stars', 'Trekking Guide on Request', 'Hot Water 24/7'],
    rules: 'No loud amplified music after 10 PM. Smoking strictly outdoors.',
    latitude: 13.3850,
    longitude: 75.7320,
    primary_image: '/images/homestays/mullayana-peak-eco-stay/images.jpg',
    rating_avg: 4.94,
    reviews_count: 28,
    rooms: [
      { name: 'Mountain View Deluxe Room', capacity: 2, price: 3800, description: 'Balcony overlooking green coffee valley and mountain mist.' },
      { name: 'Planter’s Heritage Suite', capacity: 4, price: 6200, description: 'Spacious family room with rosewood colonial four-poster bed.' },
    ],
  },
  {
    owner_email: 'vinayak.gokarna@example.com',
    owner_name: 'Vinayak Hegde',
    owner_phone: '+91 98765 00022',
    title: 'Belekan Bay Oceanfront Cottage Stay',
    slug: 'belekan-bay-oceanfront-stay',
    district: 'Uttara Kannada',
    locality: 'Belekan Beach, Near Gokarna',
    address: 'Cliffside Path, Belekan Coast, Kumta Taluk',
    description: 'Rustic wooden eco-cottages perched on a quiet ocean cove south of Om Beach. Listen to the rhythmic roar of Arabian Sea waves from your private sea-facing hammock.',
    property_type: 'Coastal Eco Cottage',
    max_guests: 4,
    bedrooms: 2,
    bathrooms: 2,
    price_per_night: 3200,
    amenities: ['Direct Beach Access', 'Oceanfront Hammocks', 'Fresh Coastal Fish Curry', 'Kayaking on Request', 'Solar Hot Water', 'Pet Friendly'],
    rules: 'Keep beach clean. No littering of plastics on the coastal path.',
    latitude: 14.5120,
    longitude: 74.3350,
    primary_image: '/images/homestays/belekan-bay-oceanfront-stay/images.jpg',
    rating_avg: 4.87,
    reviews_count: 22,
    rooms: [
      { name: 'Oceanfront Wooden Cottage', capacity: 2, price: 3200, description: 'Direct ocean breeze and panoramic sunset sea views.' },
    ],
  },
  {
    owner_email: 'shekhar.hampi@example.com',
    owner_name: 'Chandrashekhar',
    owner_phone: '+91 98765 00023',
    title: 'Tungabhadra Heritage Village Stay',
    slug: 'tungabhadra-heritage-village-stay',
    district: 'Vijayanagara',
    locality: 'Anegundi Heritage Village',
    address: 'Main Street, Near Chintamani Temple, Anegundi',
    description: 'Restored 100-year-old traditional Vernacular stone courtyard house in mythological Kishkindha. Experience authentic rural North Karnataka meals (jolada rotti with yennegai) and rent bicycles to explore Hampi across the river.',
    property_type: 'Heritage Courtyard House',
    max_guests: 6,
    bedrooms: 3,
    bathrooms: 3,
    price_per_night: 2600,
    amenities: ['Central Courtyard (Thotti Mane)', 'Traditional North Karnataka Meals', 'Bicycle Rentals', 'Rooftop Boulder Views', 'Wi-Fi'],
    rules: 'Vegetarian cooking preferred inside the heritage courtyard kitchen.',
    latitude: 15.3520,
    longitude: 76.4950,
    primary_image: '/images/homestays/tungabhadra-heritage-village-stay/images.jpg',
    rating_avg: 4.91,
    reviews_count: 17,
    rooms: [
      { name: 'Courtyard Heritage Suite', capacity: 2, price: 2600, description: 'Traditional room opening into central rainwater courtyard.' },
    ],
  },
];

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ShieldCheck,
  Heart,
  MapPin,
  ExternalLink,
  Award,
  Users,
  CheckCircle,
  FileText,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-ivory pb-20">
      <section className="bg-forest text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-700 text-xs font-semibold uppercase text-terracotta-200 mb-4">
            Our Purpose & Vision
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold mb-4">
            About the LOCALORA Initiative
          </h1>
          <p className="text-forest-100 text-sm sm:text-base leading-relaxed">
            Reconnecting mindful travellers with authentic local cultures, rural livelihoods, and time-honored traditions.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-10">
        <div className="bg-white rounded-3xl p-8 border border-ivory-200 shadow-soft space-y-4">
          <h2 className="font-serif text-2xl font-bold text-forest">The Core Vision</h2>
          <p className="text-charcoal-600 leading-relaxed text-sm sm:text-base">
            LOCALORA was built to empower regional tourism businesses — family-run heritage homestays, licensed local guides, and traditional artisan workshops — by providing a transparent, fair platform that directly connects them with conscious explorers.
          </p>
          <p className="text-charcoal-600 leading-relaxed text-sm sm:text-base">
            While mass travel portals prioritize high-volume commercial hotel chains, LOCALORA shines a spotlight on lesser-known hamlets, sacred groves, and grassroots storytellers.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-ivory-200 shadow-soft space-y-6">
          <h2 className="font-serif text-2xl font-bold text-forest">Scalable Pan-India Architecture</h2>
          <p className="text-charcoal-600 leading-relaxed text-sm sm:text-base">
            While our initial launch showcases the rich tapestry of <strong>Karnataka</strong> (spanning 30 curated heritage monuments, Western Ghats hills, tiger reserves, Malpe & Gokarna coastlines, cascades, and ancient spiritual centres), our underlying database and API models are strictly normalized for all Indian states and union territories without hardcoded geographic logic.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-ivory/60 border border-ivory-200 text-center">
              <span className="font-serif text-2xl font-bold text-forest">30+</span>
              <p className="text-xs text-charcoal-500 mt-1">Curated Destinations in Karnataka</p>
            </div>
            <div className="p-4 rounded-2xl bg-ivory/60 border border-ivory-200 text-center">
              <span className="font-serif text-2xl font-bold text-terracotta">100%</span>
              <p className="text-xs text-charcoal-500 mt-1">Decoupled Payment Architecture</p>
            </div>
            <div className="p-4 rounded-2xl bg-ivory/60 border border-ivory-200 text-center">
              <span className="font-serif text-2xl font-bold text-charcoal">Pan-India</span>
              <p className="text-xs text-charcoal-500 mt-1">Extensible Data Schemas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PoliciesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-ivory pb-20">
      <section className="bg-forest text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-700 text-xs font-semibold uppercase text-terracotta-200 mb-4">
            Transparent Governance
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold mb-4">
            Booking & Cancellation Policies
          </h1>
          <p className="text-forest-100 text-sm sm:text-base leading-relaxed">
            Fair terms designed to protect rural hosts and provide travellers with full booking clarity.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-8">
        <div className="bg-white rounded-3xl p-8 border border-ivory-200 shadow-soft space-y-4">
          <h3 className="font-serif text-xl font-bold text-forest flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-terracotta" /> 1. Two-Step Reservation Workflow
          </h3>
          <p className="text-sm text-charcoal-600 leading-relaxed">
            All homestay and guide requests are submitted as provisional inquiries. Hosts and guides review their operational capacity and confirm dates directly within their Provider Dashboard before any payment is initiated.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-ivory-200 shadow-soft space-y-4">
          <h3 className="font-serif text-xl font-bold text-forest flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-terracotta" /> 2. Cancellation and Refunds
          </h3>
          <ul className="text-sm text-charcoal-600 space-y-2 list-disc pl-5 leading-relaxed">
            <li><strong>Flexible Cancellation (Up to 48 Hours Before Check-in):</strong> Full 100% refund of any payment processed.</li>
            <li><strong>Host Declinations:</strong> If a host or guide declines a booking request, no fees are ever charged to the traveller.</li>
            <li><strong>Natural Calamities / Landslides:</strong> Full refund or date reschedule provided in the event of Western Ghats monsoon weather advisories or forest department closures.</li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-ivory-200 shadow-soft space-y-4">
          <h3 className="font-serif text-xl font-bold text-forest flex items-center gap-2">
            <FileText className="w-5 h-5 text-terracotta" /> 3. Verified Reviews Policy
          </h3>
          <p className="text-sm text-charcoal-600 leading-relaxed">
            To prevent astroturfing and fake reviews, our system validates review submissions against completed booking IDs in our database. Reviews submitted by verified travellers are distinguished with a verified badge.
          </p>
        </div>
      </div>
    </div>
  );
};

export const AttributionsPage: React.FC = () => {
  const attributions = [
    { destination: 'Hampi', source: 'Unsplash', author: 'Subhashish Sahu / Mayank Dhanawade', license: 'Unsplash Free Commercial License' },
    { destination: 'Mysuru Palace', source: 'Unsplash', author: 'Ashwini Chaudhary / Naveen Kumar', license: 'Unsplash Free Commercial License' },
    { destination: 'Badami Cave Temples', source: 'Wikimedia Commons', author: 'Nitin K / Creative Commons', license: 'CC BY-SA 4.0' },
    { destination: 'Pattadakal & Aihole', source: 'Wikimedia Commons', author: 'Dineshkannambadi', license: 'CC BY-SA 3.0' },
    { destination: 'Coorg (Kodagu)', source: 'Unsplash', author: 'Kiran CK / Sreehari Devadas', license: 'Unsplash Free Commercial License' },
    { destination: 'Chikmagalur Coffee Hills', source: 'Unsplash', author: 'Pradeep Swaminathan', license: 'Unsplash Free Commercial License' },
    { destination: 'Bandipur Tiger Reserve', source: 'Wikimedia Commons', author: 'Srikanth Parthasarathy', license: 'CC BY-SA 4.0' },
    { destination: 'Gokarna Om Beach', source: 'Unsplash', author: 'Arjun Sen / Vivek Kumar', license: 'Unsplash Free Commercial License' },
    { destination: 'Jog Falls', source: 'Wikimedia Commons', author: 'Sreejithk2000', license: 'CC BY-SA 3.0' },
    { destination: 'Murudeshwar Shiva Statue', source: 'Unsplash', author: 'Rohan Reddy', license: 'Unsplash Free Commercial License' },
    { destination: 'Kudremukh Peak', source: 'Wikimedia Commons', author: 'Karunakar Rayker', license: 'CC BY 2.0' },
    { destination: 'St. Mary’s Island & Malpe', source: 'Wikimedia Commons', author: 'Balu Velachery', license: 'CC BY-SA 4.0' },
  ];

  return (
    <div className="min-h-screen bg-ivory pb-20">
      <section className="bg-forest text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-700 text-xs font-semibold uppercase text-terracotta-200 mb-4">
            Open Knowledge & Intellectual Property
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold mb-4">
            Image Attribution Manifest
          </h1>
          <p className="text-forest-100 text-sm sm:text-base leading-relaxed">
            Photographs of Karnataka heritage and nature featured on LOCALORA are licensed under Creative Commons or Unsplash free licenses with full author credits.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-3xl p-8 border border-ivory-200 shadow-soft">
          <h2 className="font-serif text-xl font-bold text-charcoal mb-4">
            Curated Source Manifest
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ivory-200 text-charcoal-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Destination / Attraction</th>
                  <th className="py-3 px-3">Repository</th>
                  <th className="py-3 px-3">Photographer / Author</th>
                  <th className="py-3 px-3">License</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-100">
                {attributions.map((row, idx) => (
                  <tr key={idx} className="hover:bg-ivory/50">
                    <td className="py-3 px-3 font-semibold text-charcoal">{row.destination}</td>
                    <td className="py-3 px-3 text-forest">{row.source}</td>
                    <td className="py-3 px-3 text-charcoal-500">{row.author}</td>
                    <td className="py-3 px-3 text-terracotta font-mono text-[11px]">{row.license}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

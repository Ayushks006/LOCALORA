# LOCALORA — Smart Local Tourism Business Portal

> **"Discover Local. Experience More."**  
> *A community-led tourism discovery, homestay reservation, licensed guide marketplace, and cultural experience portal built with cinematic design, role-based access control, and a decoupled payment architecture.*

---

## 1. Executive Summary & Vision

**LOCALORA** is a next-generation local tourism web application created to empower regional tourism businesses, family-run plantation & heritage homestays, licensed local guides, and grassroots artisans. While mass aggregators favor large commercial hotel chains, LOCALORA elevates lesser-known destinations, pristine rural landscapes, and authentic regional culture.

### Initial Geographic Scope: Karnataka
The launch release curates 30+ destinations across Karnataka, representing all mandated categories:
- **Heritage & History**: Hampi, Mysuru, Badami, Aihole, Pattadakal, Vijayapura (Bijapur), Belur, Halebidu, Shravanabelagola.
- **Hills & Nature**: Coorg (Kodagu), Chikmagalur, Kudremukh National Park, Agumbe, Nandi Hills.
- **Wildlife & Tiger Reserves**: Bandipur National Park, Nagarhole (Kabini), Dandeli, Ranganathittu Bird Sanctuary.
- **Coastal & Beaches**: Gokarna (Om Beach), Udupi, Malpe, St. Mary's Island, Murudeshwar, Karwar.
- **Cascades & Waterfalls**: Jog Falls, Shivanasamudra Falls, Iruppu Falls, Magod Falls.
- **Spiritual Centers**: Dharmasthala, Kukke Subramanya, Sringeri Sharada Peetham, Udupi Sri Krishna Matha.
- **Culture, Gardens & Cities**: Bengaluru (Lalbagh, Cubbon Park, Bangalore Palace).

### Scalable Pan-India Architecture
Geographic data is structured across normalized tables (`regions`, `destinations`, `categories`). The platform is designed to scale across all Indian states and union territories without application code refactoring.

---

## 2. Technology Stack

| Layer | Technologies & Rationale |
| :--- | :--- |
| **Frontend Framework** | **React 18** + **Vite 5** + **TypeScript** (Blazing fast HMR, production minification) |
| **Styling & Design** | **Tailwind CSS 3** with custom Karnataka palette (`#174D3A` Forest Green, `#F7F5EF` Warm Ivory, `#D87955` Terracotta, `#202822` Charcoal) |
| **Interactivity & Motion** | **Framer Motion 11** + Perspective 3D Tilt Cards with pointer tracking and reduced-motion fallback |
| **Cartography & Maps** | **Leaflet** + **React-Leaflet** with custom SVG color-coded category markers and responsive popups |
| **Backend Runtime** | **Node.js (v24)** + **Express** + **TypeScript** (`tsx` dev / `tsc` production) |
| **Database Engine** | Native Node.js built-in **`node:sqlite` (`DatabaseSync`)** with WAL mode, foreign key enforcement, and zero native binary build toolchain dependencies |
| **Authentication & RBAC** | **JWT (JSON Web Tokens)** + **bcryptjs** (Roles: `tourist`, `guide`, `homestay_owner`, `business_owner`, `admin`) |
| **Payment Integration** | **Decoupled Payment Boundary**: Razorpay HMAC-SHA256 signature verification + clearly labeled Demo Simulation Sandbox |
| **Testing Suite** | Node.js native test runner (`tsx --test`) executing 31 end-to-end API and business logic tests |

---

## 3. Demonstration Accounts & Roles

LOCALORA features a 1-click Quick Role Switcher in the navigation bar and login page for evaluators:

| Role | Email | Password | Access Level & Key Features |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `admin@localora.in` | `Localora@2026` | Superuser: Moderate community submissions, approve/revoke homestays and guide credentials, review audit trail |
| **Conscious Tourist** | `ayush.tourist@example.com` | `Localora@2026` | Discover destinations, book homestays/guides, simulated payment modal, save bookmarks, custom day-by-day trip planner |
| **Licensed Local Guide** | `raghu.guide@example.com` | `Localora@2026` | Accept/decline booking requests, view assigned tours, manage hourly/daily rates, showcase verified ASI credentials |
| **Homestay Host** | `priya.homestay@example.com` | `Localora@2026` | Manage plantation estate listings, review incoming guest reservation requests, occupancy calendar, room tiers |
| **Cultural Business Owner** | `kavita.crafts@example.com` | `Localora@2026` | Host artisanal workshops (e.g. Channapatna wooden toys, Mysore silk weaving, pottery), track guest participants |

> **Security Note:** Public self-registration as an Administrator is strictly prohibited. Admin accounts are bootstrapped using secure environment tokens (`ADMIN_BOOTSTRAP_TOKEN`).

---

## 4. Key Functional Modules

### A. Destination Catalog & 3D Interactive Exploration
- Panoramic destination pages with high-resolution imagery and attribution.
- Categorized attractions, historical background, best season to visit, travel tips, and nearby verified service providers.
- Full-screen Interactive Leaflet Map with category filters and click-to-explore cards.

### B. Concurrency-Safe Booking Engine
- Date collision protection prevents overlapping reservations for the same room or guide schedule.
- Backend automated pricing calculates exact night/day sums, preventing client-side price tampering.
- Two-step reservation flow: Hosts confirm availability before payment collection.

### C. Decoupled Payment Boundary
- Built-in simulation mode allows testing the complete payment lifecycle without live payment gateway credentials.
- In production, switches seamlessly to Razorpay with SHA-256 HMAC order verification.
- Confetti celebration upon successful transaction confirmation.

### D. Community "Hidden Gems" & Moderation
- Travellers and locals can submit offbeat spots ("Discover Hidden Gems") with descriptions, photos, and coordinates.
- Submissions enter an administrative moderation queue before being published to the official public catalog.

### E. Verified Reviews & Ratings
- Only travellers with a completed booking reference can submit verified reviews.
- Rating aggregation computes dynamic averages and review counts across destinations, homestays, guides, and experiences.

### F. Trip Planner & Bookmarking
- Interactive day-by-day itinerary creator.
- 1-click bookmarking of destinations with direct addition to planned itineraries.

---

## 5. Automated Test Suite Results

The backend includes a comprehensive automated test suite covering all critical workflows:

```bash
npm test
```

### Test Suite Execution Output:
```text
▶ LOCALORA Comprehensive Test Suite
  ▶ 1. Authentication & Security
    ✔ Tourist registration succeeds with valid fields
    ✔ Block public self-registration with admin role
    ✔ Login fails with invalid password
    ✔ Unauthorized access to protected endpoint without token is rejected
    ✔ Tourist token cannot access admin endpoints (RBAC check)
    ✔ Admin token can access admin stats successfully
  ✔ 1. Authentication & Security (193ms)
  ▶ 2. Destination Discovery
    ✔ List all published destinations
    ✔ Filter destinations by category: heritage
    ✔ Search destinations by keyword: Hampi
    ✔ Load single destination detail by slug with attractions and image gallery
    ✔ Returns 404 for non-existent destination slug
  ✔ 2. Destination Discovery (34ms)
  ▶ 3. Homestay Booking & Concurrency Control
    ✔ Retrieve homestay listings and find Mandalpatti Mist
    ✔ Reject reservation if check-out date is not after check-in date
    ✔ Reject reservation exceeding maximum guest capacity
    ✔ Submit valid homestay booking request with automatic backend pricing calculation
    ✔ Prevent overlapping reservation for the same dates (Concurrency & Collision Protection)
    ✔ Host accepts the booking
    ✔ Unauthorized user cannot modify or cancel someone else booking
  ✔ 3. Homestay Booking & Concurrency Control (135ms)
  ▶ 4. Local Guide Marketplace
    ✔ Discover verified guides
    ✔ Submit a guide booking request
    ✔ Guide can accept incoming booking request
    ✔ Guide rejects overlapping booking for occupied dates
  ✔ 4. Local Guide Marketplace (24ms)
  ▶ 5. Decoupled Payment Processing
    ✔ Simulate payment processing in demo mode
  ✔ 5. Decoupled Payment Processing (71ms)
  ▶ 6. Community Hidden Gems & Editorial Moderation
    ✔ Submit a community destination suggestion
    ✔ Unapproved community submission is NOT visible in public destinations
    ✔ Admin reviews and approves community submission, publishing it to public catalog
  ✔ 6. Community Hidden Gems & Editorial Moderation (23ms)
  ▶ 7. Reviews & Ratings
    ✔ Submit a verified review for a destination
    ✔ Reject review with invalid rating score
  ✔ 7. Reviews & Ratings (19ms)
  ▶ 8. Notifications & Trip Planner
    ✔ Tourist receives persistent in-app notifications
    ✔ Save and toggle saved destination
    ✔ Create and retrieve custom tourist itinerary
  ✔ 8. Notifications & Trip Planner (45ms)
✔ LOCALORA Comprehensive Test Suite (1236ms)
ℹ tests 31
ℹ suites 9
ℹ pass 31
ℹ fail 0
```

---

## 6. How to Run Locally

### Prerequisites
- Node.js `v20.0.0` or higher (Node `v24+` recommended for native `node:sqlite`)
- npm `v10+`

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Seed the Database
```bash
npm run seed
```

### 3. Start Both Services in Development Mode
```bash
npm run dev
# Or: node run-dev.js
```
- **Backend API**: `http://localhost:5000`
  - Health check: `http://localhost:5000/api/health`
- **Frontend Portal**: `http://localhost:5173`

### 4. Build for Production
```bash
npm run build
```
- Compiles TypeScript backend into `backend/dist`
- Bundles and minifies frontend into `frontend/dist` with Vite

---

## 7. Open Knowledge & Image Attribution Manifest

All destination photographs used in LOCALORA are curated authentic images sourced from Wikimedia Commons and Unsplash under Creative Commons (CC BY-SA 4.0, CC BY-SA 3.0, CC BY 2.0) and Unsplash Free Commercial Licenses with full author attribution listed in the in-app **Image Attribution Manifest** page (`/image-manifest`).

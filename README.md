# 🚢 MonStar Ship — Online Ticketing & Booking System

A full-stack maritime ticketing platform built with **React + TypeScript**, **Firebase**, **Cloudinary**, **Tailwind CSS**, and **shadcn/ui** patterns.

---

## 📐 System Architecture (follows your DFDs)

| DFD Level | Process | Implementation |
|-----------|---------|----------------|
| Context (L0) | MonStar System | `App.tsx` + routing |
| L1 — Process 1.0 | User Management & Registration | `AuthContext.tsx` + Firebase Auth |
| L1 — Process 2.0 | Booking Management | `BookTrip.tsx` (3-step wizard) |
| L1 — Process 3.0 | Schedule & Trip Management | `TripManagement.tsx` (admin) |
| L1 — Process 4.0 | Ticket Generation | `TicketView.tsx` + QR Code |
| L1 — Process 5.0 | Booking Monitoring & Reporting | `BookingMonitor.tsx` (admin) |
| L1 — Process 6.0 | Manifest Reporting | `ManifestReport.tsx` (admin) |
| L2 — Process 2.1 | Select Trip | Step 0 in BookTrip wizard |
| L2 — Process 2.2 | Enter Passenger Details | Step 1 in BookTrip wizard |
| L2 — Process 2.3 | Validate Booking | Step 2 in BookTrip wizard |
| L2 — Process 2.4 | Store Booking | `createBooking()` in firestore.ts |

### Data Stores (Firestore Collections)
| DFD Store | Collection | Contents |
|-----------|-----------|----------|
| D1: Passenger Database | `users` | Accounts, profiles, roles |
| D2: Booking Records | `bookings` | All bookings, payment status |
| D3: Schedule & Trip DB | `trips` | Schedules, capacity, pricing |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS (custom maritime theme) |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Image Upload | Cloudinary |
| QR Codes | `qrcode` npm package |
| Charts | Recharts |
| Build | Vite |

---

## 🚀 Setup Instructions

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Firebase Setup
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create project → Enable **Authentication (Email/Password)**
3. Enable **Firestore Database** (production mode)
4. Paste your config into `src/lib/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

5. Deploy security rules:
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

### Step 3 — Cloudinary Setup
1. Create account at [cloudinary.com](https://cloudinary.com)
2. Settings → Upload → Add unsigned upload preset
3. Update `src/lib/cloudinary.ts`:

```typescript
const CLOUDINARY_CLOUD_NAME = 'your_cloud_name';
const CLOUDINARY_UPLOAD_PRESET = 'your_preset_name';
```

### Step 4 — Run
```bash
npm run dev
# → http://localhost:5173
```

---

## 👤 Creating an Admin Account

1. Register at `/auth` (creates a **passenger** account)
2. Firebase Console → Firestore → `users` → your UID doc
3. Change `role` field: `"passenger"` → `"admin"`
4. Sign out and sign back in → redirected to `/admin`

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── firebase.ts          # 🔧 EDIT: your Firebase config
│   ├── cloudinary.ts        # 🔧 EDIT: your Cloudinary config
│   └── utils.ts             # Formatters, helpers
├── types/index.ts           # All TypeScript interfaces
├── contexts/AuthContext.tsx # Auth state + user profile
├── services/firestore.ts    # All Firestore CRUD
├── components/
│   ├── PassengerLayout.tsx  # Passenger sidebar
│   └── AdminLayout.tsx      # Admin sidebar
└── pages/
    ├── Landing.tsx          # Public homepage
    ├── Auth.tsx             # Login + Register
    ├── passenger/
    │   ├── Dashboard.tsx    # Booking overview
    │   ├── BookTrip.tsx     # 3-step booking wizard
    │   ├── MyBookings.tsx   # Booking history
    │   └── TicketView.tsx   # QR ticket
    └── admin/
        ├── Dashboard.tsx    # Stats + Recharts
        ├── TripManagement.tsx  # Trip CRUD + Cloudinary
        ├── BookingMonitor.tsx  # Confirm/cancel bookings
        └── ManifestReport.tsx  # Port authority reports
```

---

## 🎨 Design System (maritime navy + gold)

| Token | Hex | Usage |
|-------|-----|-------|
| `navy-950` | `#060e1a` | Sidebars, dark backgrounds |
| `navy-900` | `#0a1628` | Primary buttons, accents |
| `gold-400` | `#c9a84c` | Admin highlights, ticket details |
| Font Display | Playfair Display | Headings, ticket text |
| Font Body | DM Sans | All UI copy |
| Font Mono | JetBrains Mono | Booking refs, codes |

---

## ✅ Feature Checklist

- [x] Firebase Auth — email/password register & login
- [x] Role-based routing (Passenger / Admin)
- [x] Trip browsing with origin/destination filters
- [x] 3-step booking wizard (Select Trip → Enter Passengers → Confirm)
- [x] Multi-passenger support (add/remove passengers)
- [x] Cargo booking
- [x] Auto booking reference (MS-XXXXX-XXXX)
- [x] QR code ticket generation (confirmed bookings)
- [x] Ticket print/save support
- [x] Admin trip CRUD with Cloudinary vessel image upload
- [x] Admin booking monitor — confirm payment, cancel booking
- [x] Admin dashboard with bar & pie charts (Recharts)
- [x] Passenger manifest report (D2 → Port Authorities)
- [x] Firestore security rules
- [x] Firestore composite indexes
- [x] Responsive mobile + desktop layouts

---

*MonStar Ship Lines — Philippines*


cd functions && npm install && npm run build
cd .. && firebase deploy --only functions
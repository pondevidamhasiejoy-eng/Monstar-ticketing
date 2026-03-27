/**
 * SEED SCRIPT — Run once to populate Firestore with sample data
 *
 * Usage (after filling in your Firebase credentials in src/lib/firebase.ts):
 *   npx tsx scripts/seed.ts
 *
 * Or paste the sampleTrips array directly into the Admin > Trip Management UI.
 */

export const sampleTrips = [
  {
    tripName: 'Manila–Cebu Overnight Express',
    vesselName: 'MV MonStar Queen',
    origin: 'Manila',
    destination: 'Cebu City',
    departureDate: '2025-08-10',
    arrivalDate: '2025-08-11',
    departureTime: '18:00',
    arrivalTime: '06:30',
    status: 'scheduled',
    totalSeats: 400,
    availableSeats: 280,
    totalCargoCapacity: 5000,
    availableCargoCapacity: 3200,
    pricing: { economy: 850, business: 1500, firstClass: 3200 },
    amenities: ['Air Conditioning', 'Restaurant', 'Wi-Fi', 'Cabin Rooms'],
  },
  {
    tripName: 'Cebu–Dumaguete Day Ferry',
    vesselName: 'MV MonStar Pride',
    origin: 'Cebu City',
    destination: 'Dumaguete',
    departureDate: '2025-08-12',
    arrivalDate: '2025-08-12',
    departureTime: '07:00',
    arrivalTime: '10:30',
    status: 'scheduled',
    totalSeats: 250,
    availableSeats: 180,
    totalCargoCapacity: 2000,
    availableCargoCapacity: 1500,
    pricing: { economy: 350, business: 700, firstClass: 1200 },
    amenities: ['Air Conditioning', 'Snack Bar'],
  },
  {
    tripName: 'Manila–Batangas Fast Craft',
    vesselName: 'MV MonStar Swift',
    origin: 'Manila',
    destination: 'Batangas',
    departureDate: '2025-08-15',
    arrivalDate: '2025-08-15',
    departureTime: '09:00',
    arrivalTime: '11:30',
    status: 'scheduled',
    totalSeats: 150,
    availableSeats: 95,
    totalCargoCapacity: 1000,
    availableCargoCapacity: 800,
    pricing: { economy: 480, business: 900, firstClass: 1800 },
    amenities: ['Air Conditioning', 'Free Wi-Fi', 'Café'],
  },
  {
    tripName: 'Iloilo–Bacolod Shuttle',
    vesselName: 'MV MonStar Star',
    origin: 'Iloilo',
    destination: 'Bacolod',
    departureDate: '2025-08-18',
    arrivalDate: '2025-08-18',
    departureTime: '08:00',
    arrivalTime: '09:00',
    status: 'scheduled',
    totalSeats: 200,
    availableSeats: 160,
    totalCargoCapacity: 1500,
    availableCargoCapacity: 1200,
    pricing: { economy: 200, business: 400, firstClass: 700 },
    amenities: ['Air Conditioning'],
  },
];

/**
 * To create an admin account:
 * 1. Register normally at /auth
 * 2. Go to Firebase Console > Firestore
 * 3. Find your user document under /users/{uid}
 * 4. Change the "role" field from "passenger" to "admin"
 * 5. Sign out and sign back in
 */

console.log('Sample trips data exported. Add via Admin UI or Firebase Console.');
console.log(JSON.stringify(sampleTrips, null, 2));

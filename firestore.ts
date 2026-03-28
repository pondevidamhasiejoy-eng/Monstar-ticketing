import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Trip, Booking, User, DashboardStats } from '@/types';
import { generateBookingRef } from '@/lib/utils';

// ─── Trips ────────────────────────────────────────────────────────────────────
export async function getTrips(): Promise<Trip[]> {
  const snap = await getDocs(query(collection(db, 'trips'), orderBy('departureDate', 'asc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip));
}

export async function getAvailableTrips(): Promise<Trip[]> {
  const snap = await getDocs(
    query(
      collection(db, 'trips'),
      where('status', 'in', ['scheduled', 'boarding']),
      orderBy('departureDate', 'asc')
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip));
}

export async function getTripById(id: string): Promise<Trip | null> {
  const snap = await getDoc(doc(db, 'trips', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Trip;
}

export async function createTrip(data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'trips'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTrip(id: string, data: Partial<Trip>): Promise<void> {
  await updateDoc(doc(db, 'trips', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTrip(id: string): Promise<void> {
  await deleteDoc(doc(db, 'trips', id));
}

// ─── Bookings ─────────────────────────────────────────────────────────────────
export async function createBooking(data: Omit<Booking, 'id' | 'bookingRef' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
  const bookingRef = generateBookingRef();
  const clean = Object.fromEntries(
    Object.entries({
      ...data,
      bookingRef,
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).filter(([, v]) => v !== undefined)
  );
  const ref = await addDoc(collection(db, 'bookings'), clean);

  // Deduct available seats
  const trip = await getTripById(data.tripId);
  if (trip) {
    const seatsUsed = data.passengers.length;
    await updateTrip(data.tripId, {
      availableSeats: Math.max(0, trip.availableSeats - seatsUsed),
    });
  }

  return { id: ref.id, bookingRef, ...data, createdAt: new Date(), updatedAt: new Date(), status: 'pending', paymentStatus: 'unpaid' } as Booking;
}

export async function getBookingsByPassenger(passengerId: string): Promise<Booking[]> {
  const snap = await getDocs(
    query(collection(db, 'bookings'), where('passengerId', '==', passengerId), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as Booking;
  });
}

export async function getAllBookings(): Promise<Booking[]> {
  const snap = await getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as Booking;
  });
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const snap = await getDoc(doc(db, 'bookings', id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  } as Booking;
}

export async function updateBookingStatus(id: string, status: Booking['status']): Promise<void> {
  await updateDoc(doc(db, 'bookings', id), { status, updatedAt: serverTimestamp() });
}

export async function confirmPayment(id: string): Promise<void> {
  await updateDoc(doc(db, 'bookings', id), {
    status: 'confirmed',
    paymentStatus: 'paid',
    updatedAt: serverTimestamp(),
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function getAllUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => d.data() as User);
}

export async function getPassengers(): Promise<User[]> {
  const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'passenger')));
  return snap.docs.map((d) => d.data() as User);
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export async function getDashboardStats(): Promise<DashboardStats> {
  const [bookings, trips] = await Promise.all([getAllBookings(), getTrips()]);

  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const pending = bookings.filter((b) => b.status === 'pending').length;
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
  const revenue = bookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalPassengers = bookings.reduce((sum, b) => sum + (b.passengers?.length || 0), 0);
  const activeTrips = trips.filter((t) => t.status === 'scheduled' || t.status === 'boarding').length;

  return {
    totalBookings: bookings.length,
    confirmedBookings: confirmed,
    pendingBookings: pending,
    cancelledBookings: cancelled,
    totalRevenue: revenue,
    totalPassengers,
    activeTrips,
  };
}

// ─── Manifest ─────────────────────────────────────────────────────────────────
export async function getManifestByTrip(tripId: string): Promise<Booking[]> {
  const snap = await getDocs(
    query(collection(db, 'bookings'), where('tripId', '==', tripId), where('status', '!=', 'cancelled'))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    } as Booking;
  });
}

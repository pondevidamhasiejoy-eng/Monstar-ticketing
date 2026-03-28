import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Triggered when a new booking document is created.
 * Deducts availableSeats on the trip using admin SDK
 * (bypasses Firestore security rules — safe because this runs server-side).
 */
export const onBookingCreated = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap) => {
    const booking = snap.data();
    if (!booking) return;

    const tripId: string = booking.tripId;
    const seatsUsed: number = Array.isArray(booking.passengers)
      ? booking.passengers.length
      : 1;

    const tripRef = db.collection('trips').doc(tripId);

    await db.runTransaction(async (tx) => {
      const tripSnap = await tx.get(tripRef);
      if (!tripSnap.exists) return;

      const current: number = tripSnap.data()?.availableSeats ?? 0;
      const updated = Math.max(0, current - seatsUsed);

      tx.update(tripRef, {
        availableSeats: updated,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  });

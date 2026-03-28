import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ship, MapPin, Calendar, Users, Package, ChevronRight, ChevronLeft, CheckCircle, Clock, ArrowRight, Car } from 'lucide-react';
import { getAvailableTrips, createBooking } from '@/services/firestore';
import { useAuth } from '@/contexts/AuthContext';
import type { Trip } from '@/types';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';

// ── Discount config ───────────────────────────────────────────
const PASSENGER_DISCOUNTS: Record<string, number> = {
  adult:  0,      // no discount
  student: 0.20,  // 20% off
  senior:  0.20,  // 20% off
  child:   0.50,  // 50% off
  infant:  1.00,  // 100% off (free)
};

// ── Vehicle fare config ───────────────────────────────────────
const VEHICLE_FARES: Record<string, number> = {
  '2-wheel': 150,   // motorcycles, bikes – cheaper
  '4-wheel': 800,   // cars, SUVs, trucks – more expensive
};

// ── Brevo Email Helper ────────────────────────────────────────
async function sendBookingEmails(booking: any, trip: any) {
  const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY;
  const ADMIN_EMAIL  = import.meta.env.VITE_ADMIN_EMAIL;

  const formatAmt = (n: number) =>
    '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

  const formatDt = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  const passengerRows = (booking.passengers || [])
    .map((p: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${p.firstName} ${p.lastName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-transform:capitalize;">${p.type}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${p.seatClass}</td>
      </tr>`)
    .join('');

  const passengerHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#0a1628;padding:32px;text-align:center;">
      <h1 style="margin:0;color:white;font-size:24px;font-weight:700;">MonStar Ship Lines</h1>
      <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Booking Confirmation</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;color:#0f172a;font-size:16px;">Hi <strong>${booking.passengerName}</strong>,</p>
      <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
        Your booking has been received and is currently <strong>pending payment confirmation</strong>.
        You will receive another email once confirmed.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Booking Reference</p>
        <p style="margin:0;color:#0a1628;font-size:22px;font-weight:700;font-family:monospace;">${booking.bookingRef}</p>
      </div>
      <h3 style="margin:0 0 12px;color:#0f172a;font-size:14px;text-transform:uppercase;">Trip Details</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
        <tr><td style="padding:8px 0;color:#64748b;width:40%;">Route</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${trip.origin} → ${trip.destination}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Vessel</td><td style="padding:8px 0;color:#0f172a;">${trip.vesselName}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Departure</td><td style="padding:8px 0;color:#0f172a;">${formatDt(trip.departureDate)} at ${trip.departureTime}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Arrival</td><td style="padding:8px 0;color:#0f172a;">${formatDt(trip.arrivalDate)} at ${trip.arrivalTime}</td></tr>
      </table>
      <h3 style="margin:0 0 12px;color:#0f172a;font-size:14px;text-transform:uppercase;">Passengers</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
        <thead><tr style="background:#f1f5f9;">
          <th style="padding:8px 12px;text-align:left;color:#475569;">Name</th>
          <th style="padding:8px 12px;text-align:left;color:#475569;">Type</th>
          <th style="padding:8px 12px;text-align:left;color:#475569;">Class</th>
        </tr></thead>
        <tbody>${passengerRows}</tbody>
      </table>
      <div style="background:#0a1628;border-radius:8px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#94a3b8;font-size:14px;">Total Fare</span>
        <span style="color:#f59e0b;font-size:20px;font-weight:700;">${formatAmt(booking.totalAmount)}</span>
      </div>
      <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
        Present your booking reference at the port for payment and boarding.
      </p>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">MonStar Ship Lines · Valid for date of travel only</p>
    </div>
  </div>
</body>
</html>`;

  const adminHtml = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;">
    <div style="background:#0a1628;padding:24px 32px;">
      <h2 style="margin:0;color:white;font-size:18px;">New Booking Received</h2>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">MonStar Admin Notification</p>
    </div>
    <div style="padding:32px;font-size:14px;color:#0f172a;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#64748b;width:40%;">Booking Ref</td><td style="padding:8px 0;font-weight:700;font-family:monospace;">${booking.bookingRef}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Passenger</td><td style="padding:8px 0;">${booking.passengerName}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;">${booking.passengerEmail}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Pax Count</td><td style="padding:8px 0;">${(booking.passengers || []).length}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Route</td><td style="padding:8px 0;">${trip.origin} → ${trip.destination}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Departure</td><td style="padding:8px 0;">${formatDt(trip.departureDate)} ${trip.departureTime}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Total</td><td style="padding:8px 0;font-weight:700;">${formatAmt(booking.totalAmount)}</td></tr>
      </table>
      <p style="margin:24px 0 0;color:#64748b;font-size:13px;">Log in to the admin panel to confirm payment.</p>
    </div>
  </div>
</body>
</html>`;

  const send = (to: string, subject: string, html: string) =>
    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'MonStar Ship Lines', email: 'mhasiejoyp@gmail.com' },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

  // Send to passenger
  await send(
    booking.passengerEmail,
    `Booking Received – ${booking.bookingRef} | MonStar Ship Lines`,
    passengerHtml
  );

  // Send to admin
  if (ADMIN_EMAIL) {
    await send(
      ADMIN_EMAIL,
      `New Booking: ${booking.bookingRef} – ${booking.passengerName}`,
      adminHtml
    );
  }
}

// Step 1: Select Trip
// Step 2: Enter Passenger Details
// Step 3: Validate & Confirm Booking

const passengerSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  age: z.coerce.number().min(0).max(120),
  type: z.enum(['adult', 'student', 'senior', 'child', 'infant']),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  seatClass: z.enum(['Economy', 'Business', 'First Class']),
});

const vehicleSchema = z.object({
  plateNumber: z.string().min(1, 'Required'),
  vehicleType: z.string().min(1, 'Required'),
  wheels: z.enum(['2-wheel', '4-wheel']),
});

const bookingFormSchema = z.object({
  passengers: z.array(passengerSchema).min(1),
  hasCargo: z.boolean(),
  cargoDescription: z.string().optional(),
  cargoWeight: z.coerce.number().optional(),
  hasVehicle: z.boolean(),
  vehicles: z.array(vehicleSchema).optional(),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

const STEPS = ['Select Trip', 'Passenger Details', 'Confirm Booking'];

export default function BookTrip() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterDest, setFilterDest] = useState('');

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      passengers: [{ firstName: '', lastName: '', age: 18, type: 'adult', seatClass: 'Economy' }],
      hasCargo: false,
      hasVehicle: false,
      vehicles: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'passengers' });
  const { fields: vehicleFields, append: appendVehicle, remove: removeVehicle } = useFieldArray({ control: form.control, name: 'vehicles' });

  useEffect(() => {
    getAvailableTrips().then(setTrips).finally(() => setLoadingTrips(false));
  }, []);

  const filteredTrips = trips.filter((t) => {
    const oMatch = !filterOrigin || t.origin.toLowerCase().includes(filterOrigin.toLowerCase());
    const dMatch = !filterDest || t.destination.toLowerCase().includes(filterDest.toLowerCase());
    return oMatch && dMatch;
  });

  function calcPassengerFare(pType: string, basePrice: number): number {
    const discount = PASSENGER_DISCOUNTS[pType] ?? 0;
    return Math.round(basePrice * (1 - discount));
  }

  function calcTotal(data: BookingFormData): number {
    if (!selectedTrip) return 0;
    const passengerTotal = data.passengers.reduce((sum, p) => {
      const basePrice =
        p.seatClass === 'First Class'
          ? selectedTrip.pricing.firstClass
          : p.seatClass === 'Business'
          ? selectedTrip.pricing.business
          : selectedTrip.pricing.economy;
      return sum + calcPassengerFare(p.type, basePrice);
    }, 0);
    const vehicleTotal = (data.vehicles || []).reduce((sum, v) => {
      return sum + (VEHICLE_FARES[v.wheels] ?? 0);
    }, 0);
    return passengerTotal + vehicleTotal;
  }

  async function onSubmit(data: BookingFormData) {
    if (!selectedTrip || !userProfile) return;
    setSubmitting(true);
    try {
      const booking = await createBooking({
        passengerId: userProfile.uid,
        passengerName: userProfile.displayName,
        passengerEmail: userProfile.email,
        tripId: selectedTrip.id,
        passengers: data.passengers.map((p) => ({ ...p, age: Number(p.age) })),
        cargo: (data.hasCargo && data.cargoDescription)
          ? [{ description: data.cargoDescription, weight: Number(data.cargoWeight) || 0 }]
          : [],
        vehicles: (data.hasVehicle && data.vehicles && data.vehicles.length > 0)
          ? data.vehicles.map((v) => ({ ...v, fare: VEHICLE_FARES[v.wheels] ?? 0 }))
          : [],
        totalAmount: calcTotal(data),
        notes: data.notes || '',
        status: 'pending',
        paymentStatus: 'unpaid',
      } as never);
      // Send email notifications via Brevo API
      sendBookingEmails(booking, selectedTrip).catch((err) =>
        console.error('[Email] Failed:', err)
      );

      navigate(`/passenger/ticket/${booking.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-navy-900">Book a Trip</h1>
        <p className="text-navy-500 mt-1">Follow the steps to complete your booking</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-navy-900 text-white' : 'bg-navy-100 text-navy-400'
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-navy-900' : 'text-navy-400'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-emerald-400' : 'bg-navy-100'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Select Trip */}
      {step === 0 && (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
              <input
                value={filterOrigin}
                onChange={(e) => setFilterOrigin(e.target.value)}
                placeholder="From (origin port)"
                className="w-full pl-10 pr-4 py-3 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
              <input
                value={filterDest}
                onChange={(e) => setFilterDest(e.target.value)}
                placeholder="To (destination port)"
                className="w-full pl-10 pr-4 py-3 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
            </div>
          </div>

          {loadingTrips ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card-maritime p-6 animate-pulse">
                  <div className="h-4 bg-navy-100 rounded w-2/3 mb-4" />
                  <div className="h-3 bg-navy-100 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-navy-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="card-maritime p-12 text-center">
              <Ship className="w-12 h-12 text-navy-300 mx-auto mb-4" />
              <p className="text-navy-500">No available trips found.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredTrips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => setSelectedTrip(trip)}
                  className={`card-maritime p-5 text-left transition-all duration-200 ${
                    selectedTrip?.id === trip.id
                      ? 'border-navy-900 bg-navy-50 shadow-md'
                      : 'hover:border-navy-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-navy-900 text-sm mb-1">{trip.tripName}</div>
                      <div className="text-xs text-navy-500">{trip.vesselName}</div>
                    </div>
                    {selectedTrip?.id === trip.id && (
                      <CheckCircle className="w-5 h-5 text-navy-900 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-medium text-navy-800 text-sm">{trip.origin}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-navy-400" />
                    <span className="font-medium text-navy-800 text-sm">{trip.destination}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-navy-500 mb-4">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(trip.departureDate)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{trip.departureTime}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{trip.availableSeats} seats</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-navy-400">Economy from</span>
                      <span className="font-display font-bold text-navy-900 text-lg ml-1">{formatCurrency(trip.pricing.economy)}</span>
                    </div>
                    <span className={`status-badge ${
                      trip.status === 'scheduled' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setStep(1)}
              disabled={!selectedTrip}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Passenger Details */}
      {step === 1 && selectedTrip && (
        <form onSubmit={form.handleSubmit(() => setStep(2))} className="space-y-6">
          {/* Selected trip summary */}
          <div className="bg-navy-50 rounded-2xl p-4 border border-navy-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <Ship className="w-5 h-5 text-gold-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-navy-900 text-sm">{selectedTrip.tripName}</div>
              <div className="text-xs text-navy-500">{selectedTrip.origin} → {selectedTrip.destination} · {formatDate(selectedTrip.departureDate)} {selectedTrip.departureTime}</div>
            </div>
            <button type="button" onClick={() => setStep(0)} className="text-xs text-navy-500 hover:text-navy-700 underline">Change</button>
          </div>

          {/* Passengers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-navy-900">Passenger Details</h3>
              <button
                type="button"
                onClick={() => append({ firstName: '', lastName: '', age: 18, type: 'adult', seatClass: 'Economy', idType: '', idNumber: '' })}
                className="text-sm text-navy-700 hover:text-navy-900 font-medium flex items-center gap-1 border border-navy-200 px-3 py-1.5 rounded-lg hover:bg-navy-50"
              >
                + Add Passenger
              </button>
            </div>

            <div className="space-y-5">
              {fields.map((field, index) => (
                <div key={field.id} className="card-maritime p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-navy-700">Passenger {index + 1}</span>
                    {index > 0 && (
                      <button type="button" onClick={() => remove(index)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-navy-600 block mb-1.5">First Name *</label>
                      <input
                        {...form.register(`passengers.${index}.firstName`)}
                        className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                        placeholder="Juan"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-navy-600 block mb-1.5">Last Name *</label>
                      <input
                        {...form.register(`passengers.${index}.lastName`)}
                        className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                        placeholder="Dela Cruz"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-navy-600 block mb-1.5">Age *</label>
                      <input
                        {...form.register(`passengers.${index}.age`)}
                        type="number"
                        className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-navy-600 block mb-1.5">Passenger Type</label>
                      <select
                        {...form.register(`passengers.${index}.type`)}
                        className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                      >
                        <option value="adult">Adult (Full price)</option>
                        <option value="student">Student (20% discount)</option>
                        <option value="senior">Senior Citizen (20% discount)</option>
                        <option value="child">Child (50% discount)</option>
                        <option value="infant">Infant (Free)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-navy-600 block mb-1.5">Seat Class</label>
                      <select
                        {...form.register(`passengers.${index}.seatClass`)}
                        className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                      >
                        <option value="Economy">Economy — {formatCurrency(selectedTrip.pricing.economy)}</option>
                        <option value="Business">Business — {formatCurrency(selectedTrip.pricing.business)}</option>
                        <option value="First Class">First Class — {formatCurrency(selectedTrip.pricing.firstClass)}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-navy-600 block mb-1.5">ID Type</label>
                      <select
                        {...form.register(`passengers.${index}.idType`)}
                        className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                      >
                        <option value="">Select ID type</option>
                        <option value="passport">Passport</option>
                        <option value="national_id">National ID</option>
                        <option value="drivers_license">Driver's License</option>
                        <option value="philhealth">PhilHealth ID</option>
                        <option value="sss">SSS ID</option>
                        <option value="voter_id">Voter's ID</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-navy-600 block mb-1.5">ID Number</label>
                      <input
                        {...form.register(`passengers.${index}.idNumber`)}
                        className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                        placeholder="Enter ID number"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cargo */}
          <div className="card-maritime p-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...form.register('hasCargo')}
                className="w-4 h-4 accent-navy-900"
              />
              <span className="font-medium text-navy-900 flex items-center gap-2"><Package className="w-4 h-4" />Add Cargo</span>
            </label>
            {form.watch('hasCargo') && (
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-navy-600 block mb-1.5">Cargo Description</label>
                  <input {...form.register('cargoDescription')} className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" placeholder="e.g. Electronic equipment" />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-600 block mb-1.5">Weight (kg)</label>
                  <input {...form.register('cargoWeight')} type="number" className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
              </div>
            )}
          </div>

          {/* Vehicle */}
          <div className="card-maritime p-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...form.register('hasVehicle')}
                className="w-4 h-4 accent-navy-900"
              />
              <span className="font-medium text-navy-900 flex items-center gap-2"><Car className="w-4 h-4" />Add Vehicle</span>
            </label>
            {form.watch('hasVehicle') && (
              <div className="mt-4 space-y-4">
                {/* Fare info banner */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-navy-50 border border-navy-100 rounded-xl p-3 text-center">
                    <div className="text-xs text-navy-500 mb-1">🏍️ 2-Wheel (Motorcycle/Bike)</div>
                    <div className="font-display font-bold text-navy-900 text-lg">{formatCurrency(VEHICLE_FARES['2-wheel'])}</div>
                  </div>
                  <div className="bg-navy-50 border border-navy-100 rounded-xl p-3 text-center">
                    <div className="text-xs text-navy-500 mb-1">🚗 4-Wheel (Car/SUV/Truck)</div>
                    <div className="font-display font-bold text-navy-900 text-lg">{formatCurrency(VEHICLE_FARES['4-wheel'])}</div>
                  </div>
                </div>

                {vehicleFields.map((vfield, vi) => (
                  <div key={vfield.id} className="border border-navy-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-navy-700">Vehicle {vi + 1}</span>
                      <button type="button" onClick={() => removeVehicle(vi)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-navy-600 block mb-1.5">Plate Number *</label>
                        <input
                          {...form.register(`vehicles.${vi}.plateNumber`)}
                          className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                          placeholder="e.g. ABC 1234"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-navy-600 block mb-1.5">Vehicle Type *</label>
                        <input
                          {...form.register(`vehicles.${vi}.vehicleType`)}
                          className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                          placeholder="e.g. Motorcycle, Car, SUV"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-navy-600 block mb-1.5">Wheel Type & Fare</label>
                        <select
                          {...form.register(`vehicles.${vi}.wheels`)}
                          className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                        >
                          <option value="2-wheel">2-Wheel (Motorcycle / Bike) — {formatCurrency(VEHICLE_FARES['2-wheel'])}</option>
                          <option value="4-wheel">4-Wheel (Car / SUV / Truck) — {formatCurrency(VEHICLE_FARES['4-wheel'])}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => appendVehicle({ plateNumber: '', vehicleType: '', wheels: '2-wheel' })}
                  className="text-sm text-navy-700 hover:text-navy-900 font-medium flex items-center gap-1 border border-navy-200 px-3 py-1.5 rounded-lg hover:bg-navy-50"
                >
                  + Add Another Vehicle
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-navy-600 block mb-1.5">Special Notes (optional)</label>
            <textarea {...form.register('notes')} rows={2} className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none" placeholder="Any special requirements..." />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setStep(0)} className="flex items-center gap-2 text-navy-600 hover:text-navy-900 font-medium text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              Review Booking <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && selectedTrip && (
        <div className="space-y-6">
          <div className="card-maritime p-6 space-y-5">
            <h3 className="font-display font-semibold text-navy-900 text-lg">Booking Summary</h3>

            <div className="bg-navy-50 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
                <Ship className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <div className="font-semibold text-navy-900">{selectedTrip.tripName}</div>
                <div className="text-sm text-navy-500">{selectedTrip.origin} → {selectedTrip.destination}</div>
                <div className="text-xs text-navy-400 mt-0.5">{formatDateTime(selectedTrip.departureDate + 'T' + selectedTrip.departureTime)}</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-navy-700 mb-3">Passengers</h4>
              <div className="space-y-2">
                {form.getValues('passengers').map((p, i) => {
                  const basePrice =
                    p.seatClass === 'First Class' ? selectedTrip.pricing.firstClass
                      : p.seatClass === 'Business' ? selectedTrip.pricing.business
                      : selectedTrip.pricing.economy;
                  const discount = PASSENGER_DISCOUNTS[p.type] ?? 0;
                  const finalFare = calcPassengerFare(p.type, basePrice);
                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-navy-100 last:border-0">
                      <div>
                        <span className="text-sm font-medium text-navy-900">{p.firstName} {p.lastName}</span>
                        <span className="text-xs text-navy-500 ml-2 capitalize">({p.type})</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-navy-700">{p.seatClass}</div>
                        {discount > 0 && (
                          <div className="text-xs text-navy-400 line-through">{formatCurrency(basePrice)}</div>
                        )}
                        <div className="flex items-center gap-1 justify-end">
                          {discount > 0 && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">-{(discount * 100).toFixed(0)}%</span>
                          )}
                          <span className="text-xs font-semibold text-navy-900">{discount === 1 ? 'FREE' : formatCurrency(finalFare)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {form.getValues('hasCargo') && form.getValues('cargoDescription') && (
              <div>
                <h4 className="text-sm font-semibold text-navy-700 mb-2">Cargo</h4>
                <div className="text-sm text-navy-600">{form.getValues('cargoDescription')} — {form.getValues('cargoWeight')} kg</div>
              </div>
            )}

            {form.getValues('hasVehicle') && (form.getValues('vehicles') || []).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-navy-700 mb-2">Vehicles</h4>
                <div className="space-y-2">
                  {(form.getValues('vehicles') || []).map((v, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-navy-100 last:border-0">
                      <div>
                        <span className="text-sm font-medium text-navy-900">{v.vehicleType}</span>
                        <span className="text-xs text-navy-500 ml-2">({v.plateNumber})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-navy-500">{v.wheels === '2-wheel' ? '🏍️ 2-Wheel' : '🚗 4-Wheel'}</span>
                        <div className="text-xs font-semibold text-navy-900">{formatCurrency(VEHICLE_FARES[v.wheels] ?? 0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t-2 border-navy-200 border-dashed flex items-center justify-between">
              <span className="font-display font-bold text-navy-900 text-lg">Total Amount</span>
              <span className="font-display font-bold text-navy-900 text-2xl">{formatCurrency(calcTotal(form.getValues()))}</span>
            </div>

            <p className="text-xs text-navy-400 bg-amber-50 border border-amber-200 rounded-xl p-3">
              ⚠️ Your booking will be marked as <strong>Pending</strong> until payment is confirmed by the admin. You will receive your QR-code ticket once payment is verified.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 text-navy-600 hover:text-navy-900 font-medium text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={form.handleSubmit(onSubmit)}
              disabled={submitting}
              className="btn-gold flex items-center gap-2"
            >
              {submitting ? 'Processing...' : 'Confirm Booking'}
              {!submitting && <CheckCircle className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ship, MapPin, Calendar, Users, Package, ChevronRight, ChevronLeft, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { getAvailableTrips, createBooking } from '@/services/firestore';
import { useAuth } from '@/contexts/AuthContext';
import type { Trip } from '@/types';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';

// Step 1: Select Trip
// Step 2: Enter Passenger Details
// Step 3: Validate & Confirm Booking

const passengerSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  age: z.number({ coercion: true }).min(0).max(120),
  type: z.enum(['adult', 'child', 'senior', 'infant']),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  seatClass: z.enum(['Economy', 'Business', 'First Class']),
});

const bookingFormSchema = z.object({
  passengers: z.array(passengerSchema).min(1),
  hasCargo: z.boolean(),
  cargoDescription: z.string().optional(),
  cargoWeight: z.number({ coercion: true }).optional(),
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
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'passengers' });

  useEffect(() => {
    getAvailableTrips().then(setTrips).finally(() => setLoadingTrips(false));
  }, []);

  const filteredTrips = trips.filter((t) => {
    const oMatch = !filterOrigin || t.origin.toLowerCase().includes(filterOrigin.toLowerCase());
    const dMatch = !filterDest || t.destination.toLowerCase().includes(filterDest.toLowerCase());
    return oMatch && dMatch;
  });

  function calcTotal(data: BookingFormData): number {
    if (!selectedTrip) return 0;
    return data.passengers.reduce((sum, p) => {
      const price =
        p.seatClass === 'First Class'
          ? selectedTrip.pricing.firstClass
          : p.seatClass === 'Business'
          ? selectedTrip.pricing.business
          : selectedTrip.pricing.economy;
      return sum + price;
    }, 0);
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
        cargo: data.hasCargo && data.cargoDescription
          ? [{ description: data.cargoDescription, weight: Number(data.cargoWeight) || 0 }]
          : undefined,
        totalAmount: calcTotal(data),
        notes: data.notes,
        status: 'pending',
        paymentStatus: 'unpaid',
      } as never);
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
                        <option value="adult">Adult</option>
                        <option value="child">Child</option>
                        <option value="senior">Senior</option>
                        <option value="infant">Infant</option>
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
                {form.getValues('passengers').map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-navy-100 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-navy-900">{p.firstName} {p.lastName}</span>
                      <span className="text-xs text-navy-500 ml-2 capitalize">({p.type})</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-navy-700">{p.seatClass}</div>
                      <div className="text-xs font-semibold text-navy-900">
                        {formatCurrency(
                          p.seatClass === 'First Class' ? selectedTrip.pricing.firstClass
                            : p.seatClass === 'Business' ? selectedTrip.pricing.business
                            : selectedTrip.pricing.economy
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {form.getValues('hasCargo') && form.getValues('cargoDescription') && (
              <div>
                <h4 className="text-sm font-semibold text-navy-700 mb-2">Cargo</h4>
                <div className="text-sm text-navy-600">{form.getValues('cargoDescription')} — {form.getValues('cargoWeight')} kg</div>
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

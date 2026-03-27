import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ship, Plus, Edit2, Trash2, X, Upload, Calendar, Users, Package, MapPin, Clock, Tag } from 'lucide-react';
import { getTrips, createTrip, updateTrip, deleteTrip } from '@/services/firestore';
import { uploadToCloudinary } from '@/lib/cloudinary';
import type { Trip } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';

const tripSchema = z.object({
  tripName: z.string().min(2, 'Required'),
  vesselName: z.string().min(2, 'Required'),
  origin: z.string().min(2, 'Required'),
  destination: z.string().min(2, 'Required'),
  departureDate: z.string().min(1, 'Required'),
  arrivalDate: z.string().min(1, 'Required'),
  departureTime: z.string().min(1, 'Required'),
  arrivalTime: z.string().min(1, 'Required'),
  status: z.enum(['scheduled', 'boarding', 'departed', 'arrived', 'cancelled']),
  totalSeats: z.coerce.number().min(1),
  availableSeats: z.coerce.number().min(0),
  totalCargoCapacity: z.coerce.number().min(0),
  availableCargoCapacity: z.coerce.number().min(0),
  pricingEconomy: z.coerce.number().min(0),
  pricingBusiness: z.coerce.number().min(0),
  pricingFirstClass: z.coerce.number().min(0),
  amenities: z.string(),
});

type TripFormData = z.infer<typeof tripSchema>;

const inputCls = 'w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all bg-white';
const labelCls = 'text-xs font-semibold text-navy-600 block mb-1.5';

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-navy-100 mb-4">
      <div className="w-7 h-7 bg-navy-100 rounded-lg flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-navy-600" />
      </div>
      <span className="text-sm font-semibold text-navy-700">{title}</span>
    </div>
  );
}

export default function TripManagement() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [vesselImageUrl, setVesselImageUrl] = useState('');

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      status: 'scheduled',
      totalSeats: 200,
      availableSeats: 200,
      totalCargoCapacity: 5000,
      availableCargoCapacity: 5000,
      pricingEconomy: 0,
      pricingBusiness: 0,
      pricingFirstClass: 0,
      amenities: '',
    },
  });

  const { formState: { errors } } = form;

  function loadTrips() {
    setLoading(true);
    getTrips().then(setTrips).finally(() => setLoading(false));
  }

  useEffect(() => { loadTrips(); }, []);

  function openCreate() {
    setEditingTrip(null);
    setVesselImageUrl('');
    form.reset({
      status: 'scheduled',
      totalSeats: 200,
      availableSeats: 200,
      totalCargoCapacity: 5000,
      availableCargoCapacity: 5000,
      pricingEconomy: 0,
      pricingBusiness: 0,
      pricingFirstClass: 0,
      amenities: '',
    });
    setShowModal(true);
  }

  function openEdit(trip: Trip) {
    setEditingTrip(trip);
    setVesselImageUrl(trip.vesselImage || '');
    form.reset({
      tripName: trip.tripName,
      vesselName: trip.vesselName,
      origin: trip.origin,
      destination: trip.destination,
      departureDate: trip.departureDate,
      arrivalDate: trip.arrivalDate,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      status: trip.status,
      totalSeats: trip.totalSeats,
      availableSeats: trip.availableSeats,
      totalCargoCapacity: trip.totalCargoCapacity,
      availableCargoCapacity: trip.availableCargoCapacity,
      pricingEconomy: trip.pricing.economy,
      pricingBusiness: trip.pricing.business,
      pricingFirstClass: trip.pricing.firstClass,
      amenities: trip.amenities.join(', '),
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    form.reset();
    setVesselImageUrl('');
    setEditingTrip(null);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await uploadToCloudinary(file, 'monstar-vessels');
      setVesselImageUrl(result.secure_url);
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSubmit(data: TripFormData) {
    setSaving(true);
    try {
      const tripData = {
        tripName: data.tripName,
        vesselName: data.vesselName,
        vesselImage: vesselImageUrl,
        origin: data.origin,
        destination: data.destination,
        departureDate: data.departureDate,
        arrivalDate: data.arrivalDate,
        departureTime: data.departureTime,
        arrivalTime: data.arrivalTime,
        status: data.status,
        totalSeats: Number(data.totalSeats),
        availableSeats: Number(data.availableSeats),
        totalCargoCapacity: Number(data.totalCargoCapacity),
        availableCargoCapacity: Number(data.availableCargoCapacity),
        pricing: {
          economy: Number(data.pricingEconomy),
          business: Number(data.pricingBusiness),
          firstClass: Number(data.pricingFirstClass),
        },
        amenities: data.amenities.split(',').map(s => s.trim()).filter(Boolean),
      };

      if (editingTrip) {
        await updateTrip(editingTrip.id, tripData);
      } else {
        await createTrip(tripData as never);
      }
      closeModal();
      loadTrips();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(trip: Trip) {
    if (!confirm(`Delete trip "${trip.tripName}"?`)) return;
    await deleteTrip(trip.id);
    loadTrips();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-900">Trip Management</h1>
          <p className="text-navy-500 mt-1">Schedule & Trip Database (D3)</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Trip
        </button>
      </div>

      {/* Trip Cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="card-maritime p-6 animate-pulse h-48" />)}
        </div>
      ) : trips.length === 0 ? (
        <div className="card-maritime p-16 text-center">
          <Ship className="w-12 h-12 text-navy-300 mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold text-navy-700 mb-2">No trips scheduled</h3>
          <button onClick={openCreate} className="btn-primary text-sm mt-2">Add First Trip</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <div key={trip.id} className="card-maritime overflow-hidden group">
              {trip.vesselImage ? (
                <img src={trip.vesselImage} alt={trip.vesselName} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-navy-900 to-ocean-dark flex items-center justify-center">
                  <Ship className="w-12 h-12 text-white/30" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-navy-900">{trip.tripName}</h3>
                    <p className="text-xs text-navy-500">{trip.vesselName}</p>
                  </div>
                  <span className={`status-badge ${getStatusColor(trip.status)}`}>{trip.status}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-navy-700 mb-3 font-medium">
                  <span>{trip.origin}</span>
                  <span className="text-navy-300">→</span>
                  <span>{trip.destination}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-navy-500 mb-4">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(trip.departureDate)}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{trip.availableSeats}/{trip.totalSeats} seats</span>
                  <span className="flex items-center gap-1"><Package className="w-3 h-3" />{trip.availableCargoCapacity}kg cargo</span>
                  <span className="text-emerald-600 font-medium">{formatCurrency(trip.pricing.economy)}+</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(trip)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border border-navy-200 rounded-xl hover:bg-navy-50 text-navy-700 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(trip)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border border-red-200 rounded-xl hover:bg-red-50 text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
<div className="relative space-y-6 animate-fade-in">
      {showModal && (
      <div className="absolute inset-0 z-50 flex items-center justify-center p-6">

        {/* Modal Box */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col"
          style={{ maxHeight: 'calc(100svh - 3rem)' }}>

              {/* ── Sticky Header ── */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-navy-100 rounded-t-2xl bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-navy-900 rounded-xl flex items-center justify-center">
                    <Ship className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-navy-900 text-lg leading-none">
                      {editingTrip ? 'Edit Trip' : 'Add New Trip'}
                    </h2>
                    <p className="text-xs text-navy-400 mt-0.5">
                      {editingTrip ? `Editing: ${editingTrip.tripName}` : 'Fill in the trip details below'}
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} className="w-8 h-8 rounded-lg hover:bg-navy-100 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-navy-600" />
                </button>
              </div>

              {/* ── Scrollable Body ── */}
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-6 py-5 space-y-6">

                {/* Section 1: Vessel Image */}
                <div>
                  <SectionHeader icon={Upload} title="Vessel Image" />
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-20 rounded-xl overflow-hidden border-2 border-navy-200 flex-shrink-0 bg-navy-50 flex items-center justify-center">
                      {vesselImageUrl ? (
                        <img src={vesselImageUrl} alt="Vessel" className="w-full h-full object-cover" />
                      ) : (
                        <Ship className="w-8 h-8 text-navy-300" />
                      )}
                    </div>
                    <div>
                      <label className="inline-flex items-center gap-2 border border-navy-200 rounded-xl px-4 py-2.5 text-sm text-navy-700 hover:bg-navy-50 cursor-pointer transition-colors font-medium">
                        <Upload className="w-4 h-4" />
                        {uploadingImage ? 'Uploading...' : vesselImageUrl ? 'Change Image' : 'Upload Image'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                      </label>
                      <p className="text-xs text-navy-400 mt-1.5">JPG, PNG or WEBP. Recommended 800×400px.</p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Trip Info */}
                <div>
                  <SectionHeader icon={Ship} title="Trip Information" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Trip Name *</label>
                      <input {...form.register('tripName')} placeholder="e.g. Manila–Cebu Express" className={inputCls} />
                      {errors.tripName && <p className="text-red-500 text-xs mt-1">{errors.tripName.message}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Vessel Name *</label>
                      <input {...form.register('vesselName')} placeholder="e.g. MV MonStar Queen" className={inputCls} />
                      {errors.vesselName && <p className="text-red-500 text-xs mt-1">{errors.vesselName.message}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Status</label>
                      <select {...form.register('status')} className={inputCls}>
                        <option value="scheduled">Scheduled</option>
                        <option value="boarding">Boarding</option>
                        <option value="departed">Departed</option>
                        <option value="arrived">Arrived</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Amenities <span className="text-navy-400 font-normal">(comma-separated)</span></label>
                      <input {...form.register('amenities')} placeholder="WiFi, Air Con, Restaurant" className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Section 3: Route */}
                <div>
                  <SectionHeader icon={MapPin} title="Route" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Origin Port *</label>
                      <input {...form.register('origin')} placeholder="e.g. Manila" className={inputCls} />
                      {errors.origin && <p className="text-red-500 text-xs mt-1">{errors.origin.message}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Destination Port *</label>
                      <input {...form.register('destination')} placeholder="e.g. Cebu" className={inputCls} />
                      {errors.destination && <p className="text-red-500 text-xs mt-1">{errors.destination.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Section 4: Schedule */}
                <div>
                  <SectionHeader icon={Clock} title="Schedule" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Departure Date *</label>
                      <input {...form.register('departureDate')} type="date" className={inputCls} />
                      {errors.departureDate && <p className="text-red-500 text-xs mt-1">Required</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Departure Time *</label>
                      <input {...form.register('departureTime')} type="time" className={inputCls} />
                      {errors.departureTime && <p className="text-red-500 text-xs mt-1">Required</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Arrival Date *</label>
                      <input {...form.register('arrivalDate')} type="date" className={inputCls} />
                      {errors.arrivalDate && <p className="text-red-500 text-xs mt-1">Required</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Arrival Time *</label>
                      <input {...form.register('arrivalTime')} type="time" className={inputCls} />
                      {errors.arrivalTime && <p className="text-red-500 text-xs mt-1">Required</p>}
                    </div>
                  </div>
                </div>

                {/* Section 5: Capacity */}
                <div>
                  <SectionHeader icon={Users} title="Capacity" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Total Seats</label>
                      <input {...form.register('totalSeats')} type="number" min={1} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Available Seats</label>
                      <input {...form.register('availableSeats')} type="number" min={0} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Total Cargo (kg)</label>
                      <input {...form.register('totalCargoCapacity')} type="number" min={0} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Available Cargo (kg)</label>
                      <input {...form.register('availableCargoCapacity')} type="number" min={0} className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Section 6: Pricing */}
                <div>
                  <SectionHeader icon={Tag} title="Pricing (₱)" />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>Economy</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 text-sm font-medium">₱</span>
                        <input {...form.register('pricingEconomy')} type="number" min={0} className={`${inputCls} pl-7`} placeholder="0" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Business</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 text-sm font-medium">₱</span>
                        <input {...form.register('pricingBusiness')} type="number" min={0} className={`${inputCls} pl-7`} placeholder="0" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>First Class</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 text-sm font-medium">₱</span>
                        <input {...form.register('pricingFirstClass')} type="number" min={0} className={`${inputCls} pl-7`} placeholder="0" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* ── Sticky Footer ── */}
              <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-navy-100 rounded-b-2xl bg-navy-50">
                <p className="text-xs text-navy-400">* Required fields</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 text-sm font-medium text-navy-700 border border-navy-200 rounded-xl hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={saving || uploadingImage}
                    className="btn-primary text-sm px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>{editingTrip ? 'Update Trip' : 'Create Trip'}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
    </div>
  );
}
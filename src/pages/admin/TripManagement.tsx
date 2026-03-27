import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ship, Plus, Edit2, Trash2, X, Upload, Calendar, Users, Package } from 'lucide-react';
import { getTrips, createTrip, updateTrip, deleteTrip } from '@/services/firestore';
import { uploadToCloudinary } from '@/lib/cloudinary';
import type { Trip } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';

const tripSchema = z.object({
  tripName: z.string().min(2),
  vesselName: z.string().min(2),
  origin: z.string().min(2),
  destination: z.string().min(2),
  departureDate: z.string(),
  arrivalDate: z.string(),
  departureTime: z.string(),
  arrivalTime: z.string(),
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
    defaultValues: { status: 'scheduled', totalSeats: 200, availableSeats: 200, totalCargoCapacity: 5000, availableCargoCapacity: 5000 },
  });

  function loadTrips() {
    setLoading(true);
    getTrips().then(setTrips).finally(() => setLoading(false));
  }

  useEffect(() => { loadTrips(); }, []);

  function openCreate() {
    setEditingTrip(null);
    setVesselImageUrl('');
    form.reset({ status: 'scheduled', totalSeats: 200, availableSeats: 200, totalCargoCapacity: 5000, availableCargoCapacity: 5000 });
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
      setShowModal(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-900">Trip Management</h1>
          <p className="text-navy-500 mt-1">Schedule & Trip Database (D3)</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Trip
        </button>
      </div>

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
            <div key={trip.id} className="card-maritime overflow-hidden">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="sticky top-0 bg-white border-b border-navy-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="font-display font-bold text-navy-900 text-lg">
                {editingTrip ? 'Edit Trip' : 'Add New Trip'}
              </h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-navy-100 flex items-center justify-center">
                <X className="w-4 h-4 text-navy-600" />
              </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
              {/* Vessel Image */}
              <div>
                <label className="text-xs font-semibold text-navy-600 block mb-2">Vessel Image (Cloudinary)</label>
                <div className="flex items-center gap-4">
                  {vesselImageUrl ? (
                    <img src={vesselImageUrl} alt="Vessel" className="w-20 h-16 object-cover rounded-xl border border-navy-200" />
                  ) : (
                    <div className="w-20 h-16 bg-navy-100 rounded-xl flex items-center justify-center">
                      <Ship className="w-6 h-6 text-navy-400" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 border border-navy-200 rounded-xl px-4 py-2 text-sm text-navy-700 hover:bg-navy-50 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { name: 'tripName' as const, label: 'Trip Name', placeholder: 'e.g. Manila–Cebu Express' },
                  { name: 'vesselName' as const, label: 'Vessel Name', placeholder: 'e.g. MV MonStar Queen' },
                  { name: 'origin' as const, label: 'Origin Port', placeholder: 'e.g. Manila' },
                  { name: 'destination' as const, label: 'Destination Port', placeholder: 'e.g. Cebu' },
                ].map(({ name, label, placeholder }) => (
                  <div key={name}>
                    <label className="text-xs font-medium text-navy-600 block mb-1.5">{label}</label>
                    <input {...form.register(name)} placeholder={placeholder} className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                  </div>
                ))}

                <div>
                  <label className="text-xs font-medium text-navy-600 block mb-1.5">Departure Date</label>
                  <input {...form.register('departureDate')} type="date" className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-600 block mb-1.5">Departure Time</label>
                  <input {...form.register('departureTime')} type="time" className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-600 block mb-1.5">Arrival Date</label>
                  <input {...form.register('arrivalDate')} type="date" className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-600 block mb-1.5">Arrival Time</label>
                  <input {...form.register('arrivalTime')} type="time" className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>

                <div>
                  <label className="text-xs font-medium text-navy-600 block mb-1.5">Status</label>
                  <select {...form.register('status')} className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500">
                    <option value="scheduled">Scheduled</option>
                    <option value="boarding">Boarding</option>
                    <option value="departed">Departed</option>
                    <option value="arrived">Arrived</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-600 block mb-1.5">Total Seats</label>
                  <input {...form.register('totalSeats')} type="number" className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-600 block mb-1.5">Available Seats</label>
                  <input {...form.register('availableSeats')} type="number" className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-600 block mb-1.5">Total Cargo (kg)</label>
                  <input {...form.register('totalCargoCapacity')} type="number" className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-600 block mb-1.5">Available Cargo (kg)</label>
                  <input {...form.register('availableCargoCapacity')} type="number" className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>

                <div>
                  <label className="text-xs font-medium text-navy-600 block mb-1.5">Economy Price (₱)</label>
                  <input {...form.register('pricingEconomy')} type="number" className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-600 block mb-1.5">Business Price (₱)</label>
                  <input {...form.register('pricingBusiness')} type="number" className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-600 block mb-1.5">First Class Price (₱)</label>
                  <input {...form.register('pricingFirstClass')} type="number" className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-navy-600 block mb-1.5">Amenities (comma-separated)</label>
                <input {...form.register('amenities')} placeholder="e.g. WiFi, Air Conditioning, Restaurant" className="w-full px-3 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline text-sm px-5">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm px-5">
                  {saving ? 'Saving...' : editingTrip ? 'Update Trip' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
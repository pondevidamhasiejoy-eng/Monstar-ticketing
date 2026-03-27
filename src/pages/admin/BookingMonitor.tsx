import { useEffect, useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, Clock, Eye, X } from 'lucide-react';
import { getAllBookings, updateBookingStatus, confirmPayment, getTripById } from '@/services/firestore';
import type { Booking, Trip } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import QRCode from 'qrcode';

export default function BookingMonitor() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [tripDetail, setTripDetail] = useState<Trip | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  function loadBookings() {
    setLoading(true);
    getAllBookings().then(setBookings).finally(() => setLoading(false));
  }

  useEffect(() => { loadBookings(); }, []);

  async function openDetail(booking: Booking) {
    setSelectedBooking(booking);
    const trip = await getTripById(booking.tripId);
    setTripDetail(trip);
    if (booking.status === 'confirmed') {
      const url = await QRCode.toDataURL(
        JSON.stringify({ bookingRef: booking.bookingRef, id: booking.id }),
        { width: 180, margin: 2, color: { dark: '#0a1628', light: '#ffffff' } }
      );
      setQrUrl(url);
    } else {
      setQrUrl('');
    }
  }

  async function handleConfirmPayment(bookingId: string) {
    setActionLoading(bookingId);
    await confirmPayment(bookingId);
    loadBookings();
    if (selectedBooking?.id === bookingId) {
      const updated = { ...selectedBooking, status: 'confirmed' as const, paymentStatus: 'paid' as const };
      setSelectedBooking(updated);
      const url = await QRCode.toDataURL(
        JSON.stringify({ bookingRef: updated.bookingRef, id: updated.id }),
        { width: 180, margin: 2, color: { dark: '#0a1628', light: '#ffffff' } }
      );
      setQrUrl(url);
    }
    setActionLoading(null);
  }

  async function handleCancelBooking(bookingId: string) {
    if (!confirm('Cancel this booking?')) return;
    setActionLoading(bookingId);
    await updateBookingStatus(bookingId, 'cancelled');
    loadBookings();
    if (selectedBooking?.id === bookingId) {
      setSelectedBooking({ ...selectedBooking, status: 'cancelled' });
    }
    setActionLoading(null);
  }

  const filtered = bookings.filter((b) => {
    const matchSearch = !search ||
      b.bookingRef.toLowerCase().includes(search.toLowerCase()) ||
      b.passengerName.toLowerCase().includes(search.toLowerCase()) ||
      b.passengerEmail.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy-900">Booking Monitor</h1>
        <p className="text-navy-500 mt-1">Booking Records (D2) — Manage and validate all bookings</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(counts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === status ? 'bg-navy-900 text-white' : 'bg-white border border-navy-200 text-navy-600 hover:bg-navy-50'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} ({count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by booking ref, passenger name, or email..."
          className="w-full pl-10 pr-4 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
        />
      </div>

      {/* Table */}
      <div className="card-maritime overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50">
                <th className="text-left py-3 px-5 text-xs font-semibold text-navy-500 uppercase tracking-wider">Booking Ref</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Passenger</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider hidden lg:table-cell">Payment</th>
                <th className="text-right py-3 px-5 text-xs font-semibold text-navy-500 uppercase tracking-wider">Amount</th>
                <th className="text-right py-3 px-5 text-xs font-semibold text-navy-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-3 bg-navy-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-navy-400">No bookings found</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="border-b border-navy-100 hover:bg-navy-50/50 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs font-semibold text-navy-700">{b.bookingRef}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-navy-900 text-sm">{b.passengerName}</div>
                      <div className="text-xs text-navy-400">{b.passengerEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-navy-500 hidden md:table-cell text-xs">{formatDate(b.createdAt)}</td>
                    <td className="py-3 px-4">
                      <span className={`status-badge ${getStatusColor(b.status)}`}>{b.status}</span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className={`status-badge ${b.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : b.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right font-semibold text-navy-900">{formatCurrency(b.totalAmount)}</td>
                    <td className="py-3 px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetail(b)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-navy-200 hover:bg-navy-100 text-navy-600 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {b.status === 'pending' && (
                          <button
                            onClick={() => handleConfirmPayment(b.id)}
                            disabled={actionLoading === b.id}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors"
                            title="Confirm payment"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            disabled={actionLoading === b.id}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                            title="Cancel booking"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="sticky top-0 bg-white border-b border-navy-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="font-display font-bold text-navy-900">Booking Detail</h2>
                <p className="text-xs text-navy-500 font-mono">{selectedBooking.bookingRef}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="w-8 h-8 rounded-lg hover:bg-navy-100 flex items-center justify-center">
                <X className="w-4 h-4 text-navy-600" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status & Payment */}
              <div className="flex gap-3">
                <span className={`status-badge ${getStatusColor(selectedBooking.status)}`}>{selectedBooking.status}</span>
                <span className={`status-badge ${selectedBooking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {selectedBooking.paymentStatus}
                </span>
              </div>

              {/* Trip */}
              {tripDetail && (
                <div className="bg-navy-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-2">Trip</p>
                  <p className="font-semibold text-navy-900">{tripDetail.tripName}</p>
                  <p className="text-sm text-navy-600">{tripDetail.origin} → {tripDetail.destination}</p>
                  <p className="text-xs text-navy-400 mt-1">{formatDate(tripDetail.departureDate)} · {tripDetail.departureTime}</p>
                </div>
              )}

              {/* Passenger */}
              <div>
                <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-3">Passenger Info</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm"><span className="text-navy-500">Name</span><span className="font-medium text-navy-900">{selectedBooking.passengerName}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-navy-500">Email</span><span className="font-medium text-navy-900">{selectedBooking.passengerEmail}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-navy-500">Pax Count</span><span className="font-medium text-navy-900">{selectedBooking.passengers.length}</span></div>
                </div>
              </div>

              {/* Passengers detail */}
              <div>
                <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-3">Passengers</p>
                <div className="space-y-2">
                  {selectedBooking.passengers.map((p, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-navy-100 last:border-0 text-sm">
                      <span className="text-navy-900">{p.firstName} {p.lastName} <span className="text-navy-400 text-xs capitalize">({p.type})</span></span>
                      <span className="text-xs text-navy-600 bg-navy-100 px-2 py-0.5 rounded-full">{p.seatClass}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="pt-3 border-t border-navy-200 flex justify-between items-center">
                <span className="font-semibold text-navy-700">Total Amount</span>
                <span className="font-display font-bold text-navy-900 text-xl">{formatCurrency(selectedBooking.totalAmount)}</span>
              </div>

              {/* QR Code */}
              {qrUrl && selectedBooking.status === 'confirmed' && (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <img src={qrUrl} alt="QR Code" className="w-32 h-32 rounded-xl border-2 border-navy-200" />
                  <span className="text-xs text-navy-500">Boarding QR Code</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {selectedBooking.status === 'pending' && (
                  <button
                    onClick={() => handleConfirmPayment(selectedBooking.id)}
                    disabled={actionLoading === selectedBooking.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {actionLoading === selectedBooking.id ? 'Processing...' : 'Confirm Payment'}
                  </button>
                )}
                {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                  <button
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    disabled={actionLoading === selectedBooking.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-sm font-medium transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

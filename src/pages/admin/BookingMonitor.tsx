import { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, Eye, X, Users, Package } from 'lucide-react';
import { getAllBookings, updateBookingStatus, confirmPayment, getTripById } from '@/services/firestore';
import type { Booking, Trip } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import QRCode from 'qrcode';

export default function BookingMonitor() {
  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [tripDetail, setTripDetail]   = useState<Trip | null>(null);
  const [qrUrl, setQrUrl]             = useState('');
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
    } else { setQrUrl(''); }
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
    if (selectedBooking?.id === bookingId) setSelectedBooking({ ...selectedBooking, status: 'cancelled' });
    setActionLoading(null);
  }

  const counts = {
    all:       bookings.length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch = !search || b.bookingRef.toLowerCase().includes(q) || b.passengerName.toLowerCase().includes(q) || b.passengerEmail.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const tabStyles: Record<string, string> = {
    all:       'bg-navy-900 text-white border-navy-900',
    pending:   'bg-amber-500 text-white border-amber-500',
    confirmed: 'bg-emerald-600 text-white border-emerald-600',
    cancelled: 'bg-red-500 text-white border-red-500',
  };

  return (
    <>
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900">Booking Monitor</h1>
        <p className="text-navy-500 mt-0.5 text-sm">Manage and validate all bookings</p>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(Object.entries(counts) as [string, number][]).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                statusFilter === status ? tabStyles[status] : 'bg-white border-navy-200 text-navy-600 hover:bg-navy-50'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} ({count})
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="relative flex-1 sm:max-w-72 ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookings..."
            className="w-full pl-9 pr-4 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card-maritime overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/70">
                <th className="text-left py-3 px-4 sm:px-5 text-xs font-semibold text-navy-400 uppercase tracking-wider">Booking Ref</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Passenger</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-400 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-400 uppercase tracking-wider hidden lg:table-cell">Payment</th>
                <th className="text-right py-3 px-4 sm:px-5 text-xs font-semibold text-navy-400 uppercase tracking-wider">Amount</th>
                <th className="text-right py-3 px-4 sm:px-5 text-xs font-semibold text-navy-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-3.5"><div className="h-3 bg-navy-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-navy-300 text-sm">No bookings found</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="border-b border-navy-100 last:border-0 hover:bg-navy-50/40 transition-colors group">
                    <td className="py-3 px-4 sm:px-5 font-mono text-xs font-bold text-navy-700">{b.bookingRef}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-navy-900 text-sm leading-none">{b.passengerName}</div>
                      <div className="text-xs text-navy-400 mt-0.5 truncate max-w-[140px]">{b.passengerEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-navy-400 text-xs hidden md:table-cell">{formatDate(b.createdAt)}</td>
                    <td className="py-3 px-4"><span className={`status-badge ${getStatusColor(b.status)}`}>{b.status}</span></td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className={`status-badge ${b.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right font-bold text-navy-900 text-sm">{formatCurrency(b.totalAmount)}</td>
                    <td className="py-3 px-4 sm:px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openDetail(b)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-navy-200 hover:bg-navy-100 text-navy-500 transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {b.status === 'pending' && (
                          <button onClick={() => handleConfirmPayment(b.id)} disabled={actionLoading === b.id} className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors disabled:opacity-50" title="Confirm">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <button onClick={() => handleCancelBooking(b.id)} disabled={actionLoading === b.id} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors disabled:opacity-50" title="Cancel">
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

    </div>

    {/* Detail Modal — outside main wrapper so fixed covers full screen */}
    {selectedBooking && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="fixed inset-0 bg-navy-950/50" onClick={() => setSelectedBooking(null)} />
          <div className="relative bg-white w-full sm:rounded-2xl  sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl">
            {/* Modal Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-navy-100">
              <div>
                <h2 className="font-display font-bold text-navy-900 text-base sm:text-lg">Booking Detail</h2>
                <p className="text-xs text-navy-400 font-mono mt-0.5">{selectedBooking.bookingRef}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="w-8 h-8 rounded-xl hover:bg-navy-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-navy-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
              {/* Badges */}
              <div className="flex gap-2">
                <span className={`status-badge ${getStatusColor(selectedBooking.status)}`}>{selectedBooking.status}</span>
                <span className={`status-badge ${selectedBooking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {selectedBooking.paymentStatus}
                </span>
              </div>

              {/* Trip */}
              {tripDetail && (
                <div className="bg-navy-50 border border-navy-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-2">TRIP</p>
                  <p className="font-bold text-navy-900">{tripDetail.tripName}</p>
                  <p className="text-sm text-navy-600 mt-0.5">{tripDetail.origin} → {tripDetail.destination}</p>
                  <p className="text-xs text-navy-400 mt-1">{formatDate(tripDetail.departureDate)} · {tripDetail.departureTime}</p>
                </div>
              )}

              {/* Passenger Info */}
              <div>
                <p className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-3">PASSENGER INFO</p>
                <div className="space-y-2">
                  {[
                    { label: 'Name',      val: selectedBooking.passengerName },
                    { label: 'Email',     val: selectedBooking.passengerEmail },
                    { label: 'Pax Count', val: selectedBooking.passengers.length },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-navy-400">{label}</span>
                      <span className="font-semibold text-navy-900 text-right max-w-[60%] truncate">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Passengers List */}
              <div>
                <p className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> PASSENGERS
                </p>
                <div className="space-y-2">
                  {selectedBooking.passengers.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-navy-100 last:border-0 text-sm">
                      <span className="text-navy-900 font-medium">{p.firstName} {p.lastName}
                        <span className="text-navy-400 text-xs ml-1.5 capitalize">({p.type})</span>
                      </span>
                      <span className="text-xs text-navy-600 bg-navy-100 px-2 py-0.5 rounded-full">{p.seatClass}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-3 border-t border-navy-200">
                <span className="font-semibold text-navy-600">Total Amount</span>
                <span className="font-display font-bold text-navy-900 text-xl">{formatCurrency(selectedBooking.totalAmount)}</span>
              </div>

              {/* QR */}
              {qrUrl && selectedBooking.status === 'confirmed' && (
                <div className="flex flex-col items-center gap-2 py-2">
                  <img src={qrUrl} alt="QR" className="w-32 h-32 rounded-xl border-2 border-navy-200" />
                  <span className="text-xs text-navy-400">Boarding QR Code</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1 pb-2">
                {selectedBooking.status === 'pending' && (
                  <button
                    onClick={() => handleConfirmPayment(selectedBooking.id)}
                    disabled={actionLoading === selectedBooking.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {actionLoading === selectedBooking.id ? 'Processing...' : 'Confirm Payment'}
                  </button>
                )}
                {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                  <button
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    disabled={actionLoading === selectedBooking.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
    )}
    </>
  );
}
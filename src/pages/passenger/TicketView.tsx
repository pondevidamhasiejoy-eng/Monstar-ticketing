import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Ship, Calendar, Clock, Users, Package, Download, ArrowLeft, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { getBookingById, getTripById, updateBookingStatus } from '@/services/firestore';
import type { Booking, Trip } from '@/types';
import { formatDate, formatDateTime, formatCurrency, getStatusColor } from '@/lib/utils';

export default function TicketView() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bookingId) return;
    getBookingById(bookingId).then(async (b) => {
      if (b) {
        setBooking(b);
        const t = await getTripById(b.tripId);
        setTrip(t);
        // Generate QR code
        const qrData = JSON.stringify({ bookingRef: b.bookingRef, id: b.id, tripId: b.tripId });
        const url = await QRCode.toDataURL(qrData, { width: 200, margin: 2, color: { dark: '#0a1628', light: '#ffffff' } });
        setQrUrl(url);
      }
      setLoading(false);
    });
  }, [bookingId]);

  function handlePrint() {
    const ticketEl = ticketRef.current;
    if (!ticketEl) return;

    // Inline all critical styles so the iframe doesn't depend on external CSS loading
    const computedStyles = `
      @page { size: 8.5in 11in portrait; margin: 0.5in; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: white; font-family: sans-serif; }
      .ticket-card { width: 100%; box-shadow: none !important; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
      .bg-navy-950 { background-color: #0a1628 !important; }
      .bg-navy-50 { background-color: #f8fafc !important; }
      .bg-navy-100 { background-color: #f1f5f9 !important; }
      .bg-gold-400 { background-color: #f59e0b !important; }
      .bg-emerald-100 { background-color: #d1fae5 !important; }
      .text-white { color: #ffffff !important; }
      .text-navy-900 { color: #0f172a !important; }
      .text-navy-700 { color: #1e293b !important; }
      .text-navy-600 { color: #334155 !important; }
      .text-navy-500 { color: #64748b !important; }
      .text-navy-400 { color: #94a3b8 !important; }
      .text-gold-400 { color: #f59e0b !important; }
      .text-emerald-600 { color: #059669 !important; }
      .text-amber-600 { color: #d97706 !important; }
      .font-mono { font-family: monospace; }
      .font-display { font-family: serif; }
      .font-bold { font-weight: 700; }
      .font-semibold { font-weight: 600; }
      .font-medium { font-weight: 500; }
      .text-xs { font-size: 0.75rem; }
      .text-sm { font-size: 0.875rem; }
      .text-lg { font-size: 1.125rem; }
      .text-3xl { font-size: 1.875rem; }
      .leading-none { line-height: 1; }
      .uppercase { text-transform: uppercase; }
      .capitalize { text-transform: capitalize; }
      .tracking-wider { letter-spacing: 0.05em; }
      .px-8 { padding-left: 2rem; padding-right: 2rem; }
      .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
      .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
      .py-1\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
      .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
      .py-0\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
      .mt-1 { margin-top: 0.25rem; }
      .mt-4 { margin-top: 1rem; }
      .mb-2 { margin-bottom: 0.5rem; }
      .mb-3 { margin-bottom: 0.75rem; }
      .ml-2 { margin-left: 0.5rem; }
      .gap-1 { gap: 0.25rem; }
      .gap-1\.5 { gap: 0.375rem; }
      .gap-2 { gap: 0.5rem; }
      .gap-4 { gap: 1rem; }
      .gap-6 { gap: 1.5rem; }
      .flex { display: flex; }
      .flex-1 { flex: 1 1 0%; }
      .flex-col { flex-direction: column; }
      .flex-shrink-0 { flex-shrink: 0; }
      .items-center { align-items: center; }
      .justify-center { justify-content: center; }
      .justify-between { justify-content: space-between; }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .space-y-2 > * + * { margin-top: 0.5rem; }
      .border-b { border-bottom-width: 1px; }
      .border-t { border-top-width: 1px; }
      .last\:border-0:last-child { border-width: 0; }
      .border-navy-100 { border-color: #f1f5f9; }
      .rounded-full { border-radius: 9999px; }
      .rounded-xl { border-radius: 0.75rem; }
      .w-2 { width: 0.5rem; }
      .h-2 { height: 0.5rem; }
      .w-3 { width: 0.75rem; }
      .h-3 { height: 0.75rem; }
      .w-3\.5 { width: 0.875rem; }
      .h-3\.5 { height: 0.875rem; }
      .w-5 { width: 1.25rem; }
      .h-5 { height: 1.25rem; }
      .w-6 { width: 1.5rem; }
      .h-6 { height: 1.5rem; }
      .w-8 { width: 2rem; }
      .h-px { height: 1px; }
      .w-10 { width: 2.5rem; }
      .h-10 { height: 2.5rem; }
      .w-28 { width: 7rem; }
      .h-28 { height: 7rem; }
      .h-\[1px\] { height: 1px; }
      .bg-navy-300 { background-color: #cbd5e1 !important; }
      .bg-navy-400 { background-color: #94a3b8 !important; }
      .border-navy-200 { border-color: #e2e8f0; }
      .border-dashed { border-style: dashed; }
      .border-2 { border-width: 2px; }
      .status-badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background: #e2e8f0; color: #475569; }
      .block { display: block; }
      img { max-width: 100%; height: auto; display: block; }
    `;

    const html = [
      '<!DOCTYPE html><html><head>',
      '<meta charset="utf-8" />',
      '<title>Ticket - ' + (booking?.bookingRef ?? '') + '</title>',
      '<style>' + computedStyles + '</style>',
      '</head><body>',
      ticketEl.outerHTML,
      '</body></html>',
    ].join('');

    const iframe = document.createElement('iframe');
    // Give it real size off-screen so it renders properly before printing
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;height:600px;border:none;visibility:hidden;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    // Wait for images (QR code) to load before printing
    const images = doc.querySelectorAll('img');
    const imagePromises = Array.from(images).map(
      (img) => img.complete ? Promise.resolve() : new Promise((res) => { img.onload = res; img.onerror = res; })
    );

    Promise.all(imagePromises).then(() => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 300);
    });
  }


  async function handleCancel() {
    if (!booking) return;
    setCancelling(true);
    try {
      await updateBookingStatus(booking.id, 'cancelled');
      setBooking({ ...booking, status: 'cancelled' });
      setShowCancelConfirm(false);
    } catch (e) {
      console.error('Cancel failed:', e);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-navy-200 border-t-navy-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-navy-500">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="card-maritime p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="font-display text-lg font-semibold text-navy-700">Booking not found</h3>
        <Link to="/passenger/bookings" className="btn-primary mt-4 inline-flex">Back to Bookings</Link>
      </div>
    );
  }

  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <div className="space-y-6 animate-fade-in print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/passenger/bookings" className="w-9 h-9 rounded-xl border border-navy-200 flex items-center justify-center hover:bg-navy-50">
            <ArrowLeft className="w-4 h-4 text-navy-600" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-navy-900">Your Ticket</h1>
            <p className="text-navy-500 text-sm">Booking #{booking.bookingRef}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canCancel && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 px-3 py-2 rounded-xl hover:bg-red-50 transition-all"
            >
              <XCircle className="w-4 h-4" />
              Cancel Booking
            </button>
          )}
          <button onClick={handlePrint} className="btn-outline flex items-center gap-2 text-sm print:hidden">
            <Download className="w-4 h-4" />
            Save / Print
          </button>
        </div>
      </div>

      {/* Cancel Confirm Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-display text-lg font-bold text-navy-900 text-center mb-2">Cancel Booking?</h3>
            <p className="text-sm text-navy-500 text-center mb-6">
              Are you sure you want to cancel booking <span className="font-mono font-semibold text-navy-800">{booking.bookingRef}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 border border-navy-200 rounded-xl text-sm font-medium text-navy-700 hover:bg-navy-50 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Banner */}
      {booking.status !== 'confirmed' && booking.status !== 'scanned' && (
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${
          booking.status === 'pending' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'
        }`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${booking.status === 'pending' ? 'text-amber-500' : 'text-red-500'}`} />
          <div>
            <p className={`text-sm font-medium ${booking.status === 'pending' ? 'text-amber-800' : 'text-red-800'}`}>
              {booking.status === 'pending'
                ? 'Booking pending — Awaiting payment confirmation from admin'
                : `Booking ${booking.status}`}
            </p>
            {booking.status === 'pending' && (
              <p className="text-xs text-amber-600 mt-0.5">Your QR-code ticket will appear here once confirmed.</p>
            )}
          </div>
        </div>
      )}

      {booking.status === 'scanned' && (
        <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-medium text-emerald-800">Boarding confirmed — QR code successfully scanned</p>
        </div>
      )}

      {booking.status === 'confirmed' && (
        <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-medium text-emerald-800">Booking confirmed — Show QR code at boarding</p>
        </div>
      )}

      {/* Ticket */}
      <div ref={ticketRef} className="ticket-card mx-auto max-w-2xl">
        {/* Ticket Header */}
        <div className="bg-navy-950 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-400 rounded-xl flex items-center justify-center">
              <img src="/assets/logo2.png" className="w-5 h-5" alt="logo" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-lg leading-none">MonStar</div>
              <div className="text-navy-400 text-xs">Ship Lines</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-gold-400 font-bold text-sm">{booking.bookingRef}</div>
            <div className={`mt-1 status-badge ${getStatusColor(booking.status)}`}>{booking.status}</div>
          </div>
        </div>

        {/* Route */}
        <div className="px-8 py-6 border-b border-navy-100">
          {trip ? (
            <div className="flex items-center gap-4">
              <div className="text-center flex-1">
                <div className="font-display text-3xl font-bold text-navy-900">{trip.origin.slice(0, 3).toUpperCase()}</div>
                <div className="text-sm text-navy-600 mt-1">{trip.origin}</div>
                <div className="text-xs text-navy-400 mt-1 flex items-center justify-center gap-1">
                  <Calendar className="w-3 h-3" />{formatDate(trip.departureDate)}
                </div>
                <div className="text-xs text-navy-400 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />{trip.departureTime}
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="text-xs text-navy-400 text-center">
                  <Ship className="w-6 h-6 text-navy-900 mx-auto" />
                  <span className="block mt-1">{trip.vesselName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-8 h-px bg-navy-300" />
                  <div className="w-2 h-2 rounded-full bg-navy-400" />
                  <div className="w-8 h-px bg-navy-300" />
                </div>
              </div>

              <div className="text-center flex-1">
                <div className="font-display text-3xl font-bold text-navy-900">{trip.destination.slice(0, 3).toUpperCase()}</div>
                <div className="text-sm text-navy-600 mt-1">{trip.destination}</div>
                <div className="text-xs text-navy-400 mt-1 flex items-center justify-center gap-1">
                  <Calendar className="w-3 h-3" />{formatDate(trip.arrivalDate)}
                </div>
                <div className="text-xs text-navy-400 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />{trip.arrivalTime}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-navy-400 py-4">Trip information unavailable</div>
          )}
        </div>

        {/* Passenger List & QR */}
        <div className="px-8 py-6 flex gap-6">
          <div className="flex-1">
            <h3 className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Passengers
            </h3>
            <div className="space-y-2">
              {booking.passengers.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-navy-100 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-navy-900">{p.firstName} {p.lastName}</span>
                    <span className="text-xs text-navy-400 ml-2 capitalize">({p.type})</span>
                  </div>
                  <span className="text-xs font-medium text-navy-600 bg-navy-100 px-2 py-0.5 rounded-full">{p.seatClass}</span>
                </div>
              ))}
            </div>

            {booking.cargo && booking.cargo.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Cargo
                </h3>
                {booking.cargo.map((c, i) => (
                  <div key={i} className="text-sm text-navy-700">{c.description} — {c.weight} kg</div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-navy-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-navy-500">Total Fare</span>
                <span className="font-display font-bold text-navy-900 text-lg">{formatCurrency(booking.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-navy-400">Payment</span>
                <span className={`text-xs font-semibold capitalize ${booking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {booking.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            {booking.status === 'confirmed' && qrUrl ? (
              <>
                <img src={qrUrl} alt="Boarding QR Code" className="w-28 h-28 rounded-xl border-2 border-navy-200" />
                <span className="text-xs text-navy-400 text-center">Scan to board</span>
              </>
            ) : booking.status === 'scanned' && qrUrl ? (
              <>
                <div className="relative">
                  <img src={qrUrl} alt="Boarding QR Code" className="w-28 h-28 rounded-xl border-2 border-navy-200 opacity-50" />
                  <div className="absolute inset-0 bg-emerald-500/90 rounded-xl flex items-center justify-center">
                    <div className="text-center text-white">
                      <CheckCircle className="w-8 h-8 mx-auto mb-1" />
                      <span className="text-xs font-semibold">Confirmed</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-emerald-600 text-center font-medium">Boarding confirmed</span>
              </>
            ) : booking.status === 'scanned' ? (
              <>
                <div className="w-28 h-28 rounded-xl border-2 border-emerald-200 bg-emerald-50 flex flex-col items-center justify-center text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mb-1" />
                  <span className="text-xs font-semibold text-emerald-700">Confirmed</span>
                </div>
                <span className="text-xs text-emerald-600 text-center font-medium">Boarding confirmed</span>
              </>
            ) : (
              <div className="w-28 h-28 rounded-xl border-2 border-dashed border-navy-200 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-6 h-6 text-navy-300 mb-1" />
                <span className="text-xs text-navy-400">QR after<br />confirmation</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-navy-50 border-t border-navy-100 flex items-center justify-between text-xs text-navy-400">
          <span>Issued: {formatDateTime(booking.createdAt)}</span>
          <span>MonStar Ship Lines · Valid for date of travel only</span>
        </div>
      </div>
    </div>
  );
}
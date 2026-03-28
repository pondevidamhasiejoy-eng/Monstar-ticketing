import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Ship, MapPin, Calendar, Clock, Users, Package, Download, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { getBookingById, getTripById } from '@/services/firestore';
import type { Booking, Trip } from '@/types';
import { formatDate, formatDateTime, formatCurrency, getStatusColor } from '@/lib/utils';

export default function TicketView() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(true);
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

    // Build a minimal page with only the ticket HTML
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('
');

    const html = [
      '<!DOCTYPE html><html><head>',
      '<meta charset="utf-8" />',
      '<title>Ticket - ' + (booking?.bookingRef ?? '') + '</title>',
      styles,
      '<style>',
      'body { margin: 1cm; background: white; }',
      '@page { size: A4 portrait; margin: 1cm; }',
      '</style>',
      '</head><body>',
      ticketEl.outerHTML,
      '</body></html>',
    ].join('
');

    // Use a hidden iframe — avoids popup blockers, prints only the ticket
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
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

  const isConfirmed = booking.status === 'confirmed';

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
        <button onClick={handlePrint} className="btn-outline flex items-center gap-2 text-sm print:hidden">
          <Download className="w-4 h-4" />
          Save / Print
        </button>
      </div>

      {/* Status Banner */}
      {!isConfirmed && (
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

      {isConfirmed && (
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
            {isConfirmed && qrUrl ? (
              <>
                <img src={qrUrl} alt="Boarding QR Code" className="w-28 h-28 rounded-xl border-2 border-navy-200" />
                <span className="text-xs text-navy-400 text-center">Scan to board</span>
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

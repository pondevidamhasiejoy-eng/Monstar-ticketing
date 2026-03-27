import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ship, Ticket, Clock, CheckCircle, ChevronRight, ArrowRight, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getBookingsByPassenger } from '@/services/firestore';
import type { Booking } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';

export default function PassengerDashboard() {
  const { userProfile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) return;
    getBookingsByPassenger(userProfile.uid)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [userProfile?.uid]);

  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const pending = bookings.filter((b) => b.status === 'pending').length;
  const recent = bookings.slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-navy-500 text-sm">{greeting}</p>
          <h1 className="font-display text-3xl font-bold text-navy-900">
            {userProfile?.displayName?.split(' ')[0] ?? 'Passenger'} 👋
          </h1>
        </div>
        <Link to="/passenger/book" className="btn-primary flex items-center gap-2 self-start">
          <Ship className="w-4 h-4" />
          Book New Trip
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: bookings.length, icon: Ticket, color: 'bg-navy-100 text-navy-700' },
          { label: 'Confirmed', value: confirmed, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Pending', value: pending, icon: Clock, color: 'bg-amber-100 text-amber-700' },
          { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, icon: Ship, color: 'bg-blue-100 text-blue-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-maritime p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="font-display text-2xl font-bold text-navy-900">{loading ? '—' : value}</div>
            <div className="text-sm text-navy-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Book Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-navy-900 p-7">
        <div className="absolute inset-0 water-pattern opacity-20" />
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -right-4 -top-8 w-28 h-28 rounded-full bg-gold-400/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-white mb-1">Ready to set sail?</h3>
            <p className="text-navy-300 text-sm">Browse available trips and book your next journey.</p>
          </div>
          <Link to="/passenger/book" className="btn-gold flex items-center gap-2 self-start sm:self-center whitespace-nowrap">
            Browse Trips
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-navy-900">Recent Bookings</h2>
          <Link to="/passenger/bookings" className="text-sm text-navy-600 hover:text-navy-900 flex items-center gap-1 font-medium">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-maritime p-5 animate-pulse">
                <div className="h-4 bg-navy-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-navy-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="card-maritime p-12 text-center">
            <div className="w-16 h-16 bg-navy-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Ship className="w-8 h-8 text-navy-400" />
            </div>
            <h3 className="font-display text-lg font-semibold text-navy-700 mb-2">No bookings yet</h3>
            <p className="text-navy-400 text-sm mb-6">Book your first trip to get started!</p>
            <Link to="/passenger/book" className="btn-primary text-sm">Book Now</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((booking) => (
              <Link
                key={booking.id}
                to={`/passenger/ticket/${booking.id}`}
                className="card-maritime p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-navy-300 group cursor-pointer block"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-navy-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Ship className="w-5 h-5 text-navy-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-navy-900 text-sm">{booking.bookingRef}</span>
                      <span className={`status-badge ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-navy-500">
                      <MapPin className="w-3 h-3" />
                      <span>{booking.passengers.length} passenger{booking.passengers.length > 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{formatDate(booking.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-navy-900 text-sm">{formatCurrency(booking.totalAmount)}</div>
                    <div className="text-xs text-navy-500 capitalize">{booking.paymentStatus}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-navy-400 group-hover:text-navy-700 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

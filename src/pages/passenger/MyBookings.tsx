import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ship, Ticket, Search, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getBookingsByPassenger } from '@/services/firestore';
import type { Booking } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';

export default function MyBookings() {
  const { userProfile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!userProfile?.uid) return;
    getBookingsByPassenger(userProfile.uid)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [userProfile?.uid]);

  const filtered = bookings.filter((b) => {
    const matchesSearch = !search || b.bookingRef.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy-900">My Bookings</h1>
        <p className="text-navy-500 mt-1">View and manage all your trip bookings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by booking reference..."
            className="w-full pl-10 pr-4 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white appearance-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-maritime p-6 animate-pulse">
              <div className="h-4 bg-navy-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-navy-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-maritime p-16 text-center">
          <div className="w-16 h-16 bg-navy-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-navy-400" />
          </div>
          <h3 className="font-display text-lg font-semibold text-navy-700 mb-2">No bookings found</h3>
          <p className="text-navy-400 text-sm mb-6">
            {bookings.length === 0 ? "You haven't made any bookings yet." : "No bookings match your filters."}
          </p>
          {bookings.length === 0 && (
            <Link to="/passenger/book" className="btn-primary text-sm">Book a Trip</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <Link
              key={booking.id}
              to={`/passenger/ticket/${booking.id}`}
              className="card-maritime p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-navy-300 hover:shadow-md group block transition-all duration-200"
            >
              <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Ship className="w-6 h-6 text-navy-600" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-semibold text-navy-900">{booking.bookingRef}</span>
                  <span className={`status-badge ${getStatusColor(booking.status)}`}>{booking.status}</span>
                  <span className={`status-badge ${booking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {booking.paymentStatus}
                  </span>
                </div>
                <div className="text-sm text-navy-600">
                  {booking.passengers.length} passenger{booking.passengers.length > 1 ? 's' : ''} · {booking.passengers[0]?.seatClass}
                </div>
                <div className="text-xs text-navy-400 mt-0.5">Booked on {formatDate(booking.createdAt)}</div>
              </div>

              <div className="flex items-center gap-6 flex-shrink-0">
                <div className="text-right">
                  <div className="font-display font-bold text-navy-900 text-lg">{formatCurrency(booking.totalAmount)}</div>
                  <div className="text-xs text-navy-500">{booking.passengers.length} pax</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center group-hover:bg-navy-900 transition-colors duration-200">
                  <Ticket className="w-4 h-4 text-navy-600 group-hover:text-white transition-colors duration-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

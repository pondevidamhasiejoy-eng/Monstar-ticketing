import { useEffect, useState } from 'react';
import { Ship, Ticket, Users, TrendingUp, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { getDashboardStats, getAllBookings } from '@/services/firestore';
import type { DashboardStats, Booking } from '@/types';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#1e3a6e', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getAllBookings()])
      .then(([s, b]) => {
        setStats(s);
        setRecentBookings(b.slice(0, 8));
      })
      .finally(() => setLoading(false));
  }, []);

  const pieData = stats ? [
    { name: 'Confirmed', value: stats.confirmedBookings },
    { name: 'Completed', value: stats.totalBookings - stats.confirmedBookings - stats.pendingBookings - stats.cancelledBookings },
    { name: 'Pending', value: stats.pendingBookings },
    { name: 'Cancelled', value: stats.cancelledBookings },
  ].filter(d => d.value > 0) : [];

  const statCards = stats ? [
    { label: 'Total Bookings', value: stats.totalBookings, icon: Ticket, change: '+12%', color: 'text-navy-700 bg-navy-100' },
    { label: 'Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, change: '+8%', color: 'text-emerald-700 bg-emerald-100' },
    { label: 'Total Passengers', value: stats.totalPassengers, icon: Users, change: '+15%', color: 'text-blue-700 bg-blue-100' },
    { label: 'Active Trips', value: stats.activeTrips, icon: Ship, change: 'Live', color: 'text-amber-700 bg-amber-100' },
  ] : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy-900">Admin Dashboard</h1>
        <p className="text-navy-500 mt-1">Overview of MonStar Ship Lines operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [1, 2, 3, 4].map(i => <div key={i} className="card-maritime p-6 animate-pulse h-28" />)
          : statCards.map(({ label, value, icon: Icon, change, color }) => (
            <div key={label} className="card-maritime p-5">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{change}</span>
              </div>
              <div className="mt-3">
                <div className="font-display text-2xl font-bold text-navy-900">{value}</div>
                <div className="text-xs text-navy-500 mt-0.5">{label}</div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Quick Stats Row */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Confirmed', value: stats.confirmedBookings, icon: CheckCircle, color: 'text-emerald-600' },
            { label: 'Pending', value: stats.pendingBookings, icon: Clock, color: 'text-amber-600' },
            { label: 'Cancelled', value: stats.cancelledBookings, icon: XCircle, color: 'text-red-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-navy-100 p-4 flex items-center gap-3">
              <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
              <div>
                <div className="font-bold text-navy-900 text-xl">{value}</div>
                <div className="text-xs text-navy-500">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card-maritime p-6 lg:col-span-2">
          <h3 className="font-display font-semibold text-navy-900 mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-navy-500" />
            Booking Trend (Mock)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { month: 'Jan', bookings: 32 }, { month: 'Feb', bookings: 45 },
              { month: 'Mar', bookings: 38 }, { month: 'Apr', bookings: 61 },
              { month: 'May', bookings: 55 }, { month: 'Jun', bookings: 72 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e8edf5', fontSize: 12 }} />
              <Bar dataKey="bookings" fill="#1e3a6e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-maritime p-6">
          <h3 className="font-display font-semibold text-navy-900 mb-5">Booking Status</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e8edf5', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-navy-400 text-sm">No booking data</div>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card-maritime overflow-hidden">
        <div className="px-6 py-4 border-b border-navy-100">
          <h3 className="font-display font-semibold text-navy-900">Recent Bookings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50">
                <th className="text-left py-3 px-6 text-xs font-semibold text-navy-500 uppercase tracking-wider">Ref #</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Passenger</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-navy-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-3 bg-navy-100 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-navy-400">No bookings yet</td>
                </tr>
              ) : (
                recentBookings.map((b) => (
                  <tr key={b.id} className="border-b border-navy-100 hover:bg-navy-50/50 transition-colors">
                    <td className="py-3 px-6 font-mono text-xs text-navy-700 font-medium">{b.bookingRef}</td>
                    <td className="py-3 px-4 text-navy-800">{b.passengerName}</td>
                    <td className="py-3 px-4 text-navy-500">{formatDate(b.createdAt)}</td>
                    <td className="py-3 px-4">
                      <span className={`status-badge ${getStatusColor(b.status)}`}>{b.status}</span>
                    </td>
                    <td className="py-3 px-6 text-right font-semibold text-navy-900">{formatCurrency(b.totalAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

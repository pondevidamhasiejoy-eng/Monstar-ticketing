import { useEffect, useState } from 'react';
import { Ship, Ticket, Users, TrendingUp, Clock, CheckCircle, XCircle, DollarSign, ArrowUpRight } from 'lucide-react';
import { getDashboardStats, getAllBookings } from '@/services/firestore';
import type { DashboardStats, Booking } from '@/types';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#1e3a6e', '#ef4444'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getAllBookings()])
      .then(([s, b]) => { setStats(s); setRecentBookings(b.slice(0, 8)); })
      .finally(() => setLoading(false));
  }, []);

  const pieData = stats ? [
    { name: 'Confirmed', value: stats.confirmedBookings },
    { name: 'Pending',   value: stats.pendingBookings },
    { name: 'Other',     value: stats.totalBookings - stats.confirmedBookings - stats.pendingBookings - stats.cancelledBookings },
    { name: 'Cancelled', value: stats.cancelledBookings },
  ].filter(d => d.value > 0) : [];

  const statCards = stats ? [
    { label: 'Total Bookings',    value: stats.totalBookings,            icon: Ticket,      accent: 'from-navy-800 to-navy-900',   text: 'text-white' },
    { label: 'Total Revenue',     value: formatCurrency(stats.totalRevenue), icon: DollarSign,  accent: 'from-emerald-600 to-emerald-700', text: 'text-white' },
    { label: 'Total Passengers',  value: stats.totalPassengers,          icon: Users,       accent: 'from-blue-600 to-blue-700',   text: 'text-white' },
    { label: 'Active Trips',      value: stats.activeTrips,              icon: Ship,        accent: 'from-amber-500 to-amber-600', text: 'text-white' },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900">Admin Dashboard</h1>
          <p className="text-navy-500 mt-0.5 text-sm">Overview of MonStar Ship Lines operations</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-navy-400 bg-navy-50 border border-navy-100 rounded-xl px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Data
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {loading
          ? [1,2,3,4].map(i => <div key={i} className="rounded-2xl h-28 animate-pulse bg-navy-100" />)
          : statCards.map(({ label, value, icon: Icon, accent, text }) => (
            <div key={label} className={`relative overflow-hidden bg-gradient-to-br ${accent} rounded-2xl p-4 sm:p-5`}>
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <div className="absolute -right-1 -bottom-6 w-16 h-16 rounded-full bg-white/5" />
              <div className={`relative ${text}`}>
                <Icon className="w-5 h-5 mb-3 opacity-80" />
                <div className="font-display text-2xl sm:text-3xl font-bold leading-none">{value}</div>
                <div className="text-xs mt-1.5 opacity-70 font-medium">{label}</div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Quick Status Row */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Confirmed', value: stats.confirmedBookings, icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-100', icon_color: 'text-emerald-600', val_color: 'text-emerald-700' },
            { label: 'Pending',   value: stats.pendingBookings,   icon: Clock,         bg: 'bg-amber-50',   border: 'border-amber-100',   icon_color: 'text-amber-500',   val_color: 'text-amber-700' },
            { label: 'Cancelled', value: stats.cancelledBookings, icon: XCircle,       bg: 'bg-red-50',     border: 'border-red-100',     icon_color: 'text-red-500',     val_color: 'text-red-700' },
          ].map(({ label, value, icon: Icon, bg, border, icon_color, val_color }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-3 sm:p-4 flex items-center gap-3`}>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${icon_color}`} />
              </div>
              <div>
                <div className={`font-display font-bold text-lg sm:text-2xl leading-none ${val_color}`}>{value}</div>
                <div className="text-xs text-navy-500 mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="card-maritime p-4 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-navy-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-navy-400" /> Booking Trend
            </h3>
            <span className="text-xs text-navy-400 bg-navy-50 px-2 py-1 rounded-lg">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { month: 'Jan', bookings: 32 }, { month: 'Feb', bookings: 45 },
              { month: 'Mar', bookings: 38 }, { month: 'Apr', bookings: 61 },
              { month: 'May', bookings: 55 }, { month: 'Jun', bookings: 72 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e8edf5', fontSize: 12, }} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="bookings" fill="#0f2d5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-maritime p-4 sm:p-6">
          <h3 className="font-display font-semibold text-navy-900 mb-4">Booking Status</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e8edf5', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-navy-300 text-sm">No booking data</div>
          )}
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="card-maritime overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-navy-100 flex items-center justify-between">
          <h3 className="font-display font-semibold text-navy-900">Recent Bookings</h3>
          <ArrowUpRight className="w-4 h-4 text-navy-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/70">
                <th className="text-left py-3 px-4 sm:px-6 text-xs font-semibold text-navy-400 uppercase tracking-wider">Ref #</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Passenger</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-400 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 sm:px-6 text-xs font-semibold text-navy-400 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-6 py-3"><div className="h-3 bg-navy-100 rounded animate-pulse" /></td></tr>
                ))
              ) : recentBookings.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-navy-300 text-sm">No bookings yet</td></tr>
              ) : (
                recentBookings.map((b) => (
                  <tr key={b.id} className="border-b border-navy-100 last:border-0 hover:bg-navy-50/50 transition-colors">
                    <td className="py-3 px-4 sm:px-6 font-mono text-xs text-navy-600 font-semibold">{b.bookingRef}</td>
                    <td className="py-3 px-4 text-navy-800 font-medium text-sm">{b.passengerName}</td>
                    <td className="py-3 px-4 text-navy-400 text-xs hidden sm:table-cell">{formatDate(b.createdAt)}</td>
                    <td className="py-3 px-4"><span className={`status-badge ${getStatusColor(b.status)}`}>{b.status}</span></td>
                    <td className="py-3 px-4 sm:px-6 text-right font-semibold text-navy-900">{formatCurrency(b.totalAmount)}</td>
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
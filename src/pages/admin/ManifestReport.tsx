import { useEffect, useState } from 'react';
import { FileText, Download, Search, Ship, Users, X } from 'lucide-react';
import { getTrips, getManifestByTrip } from '@/services/firestore';
import type { Trip, Booking } from '@/types';
import { formatDate, formatDateTime, getStatusColor } from '@/lib/utils';

export default function ManifestReport() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [manifest, setManifest] = useState<Booking[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getTrips().then(setTrips).finally(() => setLoadingTrips(false));
  }, []);

  async function loadManifest(trip: Trip) {
    setSelectedTrip(trip);
    setLoadingManifest(true);
    setSearch('');
    const bookings = await getManifestByTrip(trip.id);
    setManifest(bookings);
    setLoadingManifest(false);
  }

  function exportCSV() {
    if (!selectedTrip || manifest.length === 0) return;

    const rows = [
      ['Booking Ref', 'Passenger Name', 'Email', 'Seat Class', 'Pax Count', 'Origin', 'Destination', 'Departure', 'Status', 'Payment'],
      ...manifest.flatMap((b) =>
        b.passengers.map((p) => [
          b.bookingRef,
          `${p.firstName} ${p.lastName}`,
          b.passengerEmail,
          p.seatClass,
          b.passengers.length,
          selectedTrip.origin,
          selectedTrip.destination,
          `${formatDate(selectedTrip.departureDate)} ${selectedTrip.departureTime}`,
          b.status,
          b.paymentStatus,
        ])
      ),
    ];

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifest_${selectedTrip.tripName.replace(/\s+/g, '_')}_${formatDate(selectedTrip.departureDate)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const allPassengers = manifest.flatMap((b) =>
    b.passengers.map((p) => ({
      bookingRef: b.bookingRef,
      passengerName: `${p.firstName} ${p.lastName}`,
      passengerType: p.type,
      seatClass: p.seatClass,
      idType: p.idType,
      idNumber: p.idNumber,
      bookingStatus: b.status,
      paymentStatus: b.paymentStatus,
    }))
  );

  const filteredPassengers = allPassengers.filter((p) =>
    !search ||
    p.passengerName.toLowerCase().includes(search.toLowerCase()) ||
    p.bookingRef.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy-900">Manifest Report</h1>
        <p className="text-navy-500 mt-1">Passenger manifest for Port Authorities & Regulatory Agencies</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trip Selector */}
        <div className="lg:col-span-1">
          <div className="card-maritime overflow-hidden">
            <div className="px-5 py-4 border-b border-navy-100 bg-navy-50">
              <h3 className="font-semibold text-navy-900 text-sm">Select Trip</h3>
            </div>
            <div className="divide-y divide-navy-100 max-h-[500px] overflow-y-auto scrollbar-thin">
              {loadingTrips ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="h-3 bg-navy-100 rounded w-2/3 mb-2" />
                    <div className="h-2 bg-navy-100 rounded w-1/2" />
                  </div>
                ))
              ) : trips.length === 0 ? (
                <div className="p-8 text-center text-navy-400 text-sm">No trips available</div>
              ) : (
                trips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => loadManifest(trip)}
                    className={`w-full text-left px-5 py-4 hover:bg-navy-50 transition-colors ${
                      selectedTrip?.id === trip.id ? 'bg-navy-100 border-l-4 border-navy-900' : ''
                    }`}
                  >
                    <div className="font-medium text-navy-900 text-sm">{trip.tripName}</div>
                    <div className="text-xs text-navy-500 mt-0.5">{trip.origin} → {trip.destination}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-navy-400">{formatDate(trip.departureDate)}</span>
                      <span className={`status-badge text-[10px] ${getStatusColor(trip.status)}`}>{trip.status}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Manifest */}
        <div className="lg:col-span-2">
          {!selectedTrip ? (
            <div className="card-maritime p-16 text-center h-full flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-navy-200 mb-4" />
              <h3 className="font-display text-lg font-semibold text-navy-500 mb-2">Select a trip</h3>
              <p className="text-navy-400 text-sm">Choose a trip from the list to view its passenger manifest</p>
            </div>
          ) : (
            <div className="card-maritime overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-navy-100 bg-navy-900 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg">{selectedTrip.tripName}</h3>
                    <p className="text-navy-300 text-sm">{selectedTrip.origin} → {selectedTrip.destination}</p>
                    <p className="text-navy-400 text-xs mt-0.5">Departure: {formatDate(selectedTrip.departureDate)} at {selectedTrip.departureTime}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-3xl font-bold text-gold-400">{allPassengers.length}</div>
                    <div className="text-navy-400 text-xs">Total Passengers</div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-navy-800">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Ship className="w-3.5 h-3.5 text-navy-400" />
                    <span className="text-navy-300">{selectedTrip.vesselName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Users className="w-3.5 h-3.5 text-navy-400" />
                    <span className="text-navy-300">{manifest.length} bookings</span>
                  </div>
                  <button
                    onClick={exportCSV}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-gold-400 hover:bg-gold-500 text-navy-950 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="px-5 py-3 border-b border-navy-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search passengers..."
                    className="w-full pl-10 pr-4 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                  />
                </div>
              </div>

              {/* Manifest Table */}
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-navy-50 border-b border-navy-100 z-10">
                    <tr>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-navy-500 uppercase tracking-wider">#</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Passenger</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider hidden md:table-cell">Class</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider hidden lg:table-cell">ID</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingManifest ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}><td colSpan={5} className="px-5 py-3"><div className="h-3 bg-navy-100 rounded animate-pulse" /></td></tr>
                      ))
                    ) : filteredPassengers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-navy-400 text-sm">
                          {allPassengers.length === 0 ? 'No passengers on this manifest' : 'No results found'}
                        </td>
                      </tr>
                    ) : (
                      filteredPassengers.map((p, i) => (
                        <tr key={i} className="border-b border-navy-100 hover:bg-navy-50/50 transition-colors">
                          <td className="py-3 px-5 text-navy-400 text-xs">{i + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-navy-900">{p.passengerName}</div>
                            <div className="text-xs text-navy-400 font-mono">{p.bookingRef}</div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <span className="text-xs bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full">{p.seatClass}</span>
                          </td>
                          <td className="py-3 px-4 text-xs text-navy-500 hidden lg:table-cell">
                            {p.idType ? `${p.idType}: ${p.idNumber || '—'}` : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`status-badge ${getStatusColor(p.bookingStatus)}`}>{p.bookingStatus}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-navy-50 border-t border-navy-100 text-xs text-navy-400 flex justify-between items-center">
                <span>Manifest generated: {formatDateTime(new Date())}</span>
                <span>MonStar Ship Lines — Confidential</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/pages/Landing';
import AuthPage from '@/pages/Auth';
import PassengerLayout from '@/components/PassengerLayout';
import AdminLayout from '@/components/AdminLayout';
import PassengerDashboard from '@/pages/passenger/Dashboard';
import BookTrip from '@/pages/passenger/BookTrip';
import MyBookings from '@/pages/passenger/MyBookings';
import TicketView from '@/pages/passenger/TicketView';
import AdminDashboard from '@/pages/admin/Dashboard';
import TripManagement from '@/pages/admin/TripManagement';
import BookingMonitor from '@/pages/admin/BookingMonitor';
import ManifestReport from '@/pages/admin/ManifestReport';

function ProtectedRoute({ children, requireAdmin = false }: { 
  children: React.ReactNode; 
  requireAdmin?: boolean 
}) {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) return null; // or a spinner

  if (!currentUser) return <Navigate to="/auth" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/passenger" replace />;
  if (!requireAdmin && isAdmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Passenger Routes */}
          <Route path="/passenger" element={
            <ProtectedRoute>
              <PassengerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<PassengerDashboard />} />
            <Route path="book" element={<BookTrip />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="ticket/:bookingId" element={<TicketView />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="trips" element={<TripManagement />} />
            <Route path="bookings" element={<BookingMonitor />} />
            <Route path="manifest" element={<ManifestReport />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

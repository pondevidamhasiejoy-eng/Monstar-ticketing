import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Anchor, LayoutDashboard, Ship, Ticket, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/passenger', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/passenger/book', icon: Ship, label: 'Book a Trip' },
  { to: '/passenger/bookings', icon: Ticket, label: 'My Bookings' },
];

export default function PassengerLayout() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-6 py-5 border-b border-navy-100">
        <div className="w-9 h-9 bg-navy-900 rounded-xl flex items-center justify-center flex-shrink-0">
          <Anchor className="w-5 h-5 text-gold-400" />
        </div>
        <div>
          <span className="font-display font-bold text-navy-900 text-base leading-none block">MonStar</span>
          <span className="text-xs text-navy-400">Ship Lines</span>
        </div>
      </div>

      <div className="px-4 py-4 mx-3 mt-4 bg-navy-50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-navy-200 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-navy-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy-900 truncate">{userProfile?.displayName ?? 'Passenger'}</p>
            <p className="text-xs text-navy-400 truncate">{userProfile?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider px-3 mb-3">Navigation</p>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-navy-600 hover:bg-navy-100 hover:text-navy-900'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-navy-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-navy-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-navy-100 fixed h-full z-30">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-white flex flex-col h-full shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy-100">
              <X className="w-4 h-4 text-navy-600" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-navy-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-navy-900 rounded-lg flex items-center justify-center">
              <Anchor className="w-4 h-4 text-gold-400" />
            </div>
            <span className="font-display font-bold text-navy-900">MonStar</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-navy-100 rounded-lg">
            <Menu className="w-5 h-5 text-navy-700" />
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

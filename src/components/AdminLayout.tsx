import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Anchor, LayoutDashboard, Ship, ClipboardList, FileText, LogOut, ShieldCheck, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/trips', icon: Ship, label: 'Trip Management' },
  { to: '/admin/bookings', icon: ClipboardList, label: 'Booking Monitor' },
  { to: '/admin/manifest', icon: FileText, label: 'Manifest Report' },
];

export default function AdminLayout() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-6 py-5 border-b border-navy-800">
        <div className="w-9 h-9 bg-gold-400 rounded-xl flex items-center justify-center flex-shrink-0">
          <Anchor className="w-5 h-5 text-navy-950" />
        </div>
        <div>
          <span className="font-display font-bold text-white text-base leading-none block">MonStar</span>
          <span className="text-xs text-navy-400">Admin Console</span>
        </div>
      </div>

      <div className="px-4 py-4 mx-3 mt-4 bg-navy-800/50 rounded-xl border border-navy-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gold-400/20 rounded-full flex items-center justify-center flex-shrink-0 border border-gold-400/30">
            <ShieldCheck className="w-4 h-4 text-gold-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{userProfile?.displayName ?? 'Admin'}</p>
            <p className="text-xs text-navy-400 truncate">Administrator</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider px-3 mb-3">Admin Menu</p>
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
                  ? 'bg-gold-400 text-navy-950 shadow-sm font-semibold'
                  : 'text-navy-300 hover:bg-navy-800 hover:text-white'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-navy-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-navy-400 hover:bg-red-900/30 hover:text-red-400 transition-all duration-200 w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-navy-50">
      <aside className="hidden lg:flex flex-col w-64 bg-navy-950 border-r border-navy-800 fixed h-full z-30">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-navy-950 flex flex-col h-full shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy-800">
              <X className="w-4 h-4 text-navy-300" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-20 bg-navy-950 border-b border-navy-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold-400 rounded-lg flex items-center justify-center">
              <Anchor className="w-4 h-4 text-navy-950" />
            </div>
            <span className="font-display font-bold text-white">Admin</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-navy-800 rounded-lg">
            <Menu className="w-5 h-5 text-white" />
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

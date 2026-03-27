import { Link } from 'react-router-dom';
import { Ship, Anchor, MapPin, Clock, Shield, Star, ChevronRight, Waves } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const { currentUser, isAdmin } = useAuth();

  const dashboardPath = currentUser ? (isAdmin ? '/admin' : '/passenger') : '/auth';

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-navy-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
              <Anchor className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <span className="font-display font-bold text-navy-900 text-lg leading-none block">MonStar</span>
              <span className="text-xs text-navy-500 font-body">Ship Lines</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#routes" className="nav-link">Routes</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#about" className="nav-link">About</a>
          </div>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link to={dashboardPath} className="btn-primary text-sm">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/auth" className="nav-link text-sm">Sign In</Link>
                <Link to="/auth?mode=register" className="btn-primary text-sm">Book Now</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Ocean background */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-800 to-ocean-dark" />
        <div className="absolute inset-0 water-pattern opacity-30" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        
        {/* Animated waves */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-around opacity-20">
          {[...Array(6)].map((_, i) => (
            <Waves
              key={i}
              className="text-ocean-mid w-16 h-16"
              style={{ animation: `wave 3s ease-in-out ${i * 0.5}s infinite` }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
            <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
            <span className="text-white/90 text-sm font-body">Philippines' Premier Maritime Booking</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 text-balance leading-tight">
            Sail with{' '}
            <span className="relative">
              <span className="text-gold-400">Confidence</span>
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gold-400/40 rounded-full" />
            </span>
          </h1>
          <p className="text-navy-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-body">
            Book your ferry tickets online with MonStar Ship Lines. 
            Secure, fast, and hassle-free ticketing for all major Philippine routes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={currentUser ? '/passenger/book' : '/auth?mode=register'} className="btn-gold text-base px-8 py-3 flex items-center gap-2">
              <Ship className="w-5 h-5" />
              Book a Trip
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/auth" className="btn-outline border-white text-white hover:bg-white hover:text-navy-900 text-base px-8 py-3">
              View Schedules
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16">
            {[
              { value: '50+', label: 'Routes' },
              { value: '200K+', label: 'Passengers' },
              { value: '15+', label: 'Years' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="font-display text-3xl font-bold text-gold-400">{value}</div>
                <div className="text-navy-300 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="section-title mb-4">Why Choose MonStar?</h2>
            <p className="text-navy-500 text-lg max-w-xl mx-auto">Everything you need for a seamless maritime journey</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Ship className="w-7 h-7 text-navy-700" />,
                title: 'Online Booking',
                desc: 'Book your seats and cargo space anytime, anywhere from any device.',
              },
              {
                icon: <Shield className="w-7 h-7 text-navy-700" />,
                title: 'Secure Payments',
                desc: 'Your transactions are encrypted and protected at every step.',
              },
              {
                icon: <MapPin className="w-7 h-7 text-navy-700" />,
                title: 'QR-Code Tickets',
                desc: 'Get digital QR tickets instantly. No printing needed for boarding.',
              },
              {
                icon: <Clock className="w-7 h-7 text-navy-700" />,
                title: 'Real-time Schedules',
                desc: 'Always up-to-date trip info, seat availability and capacity.',
              },
              {
                icon: <Anchor className="w-7 h-7 text-navy-700" />,
                title: 'Cargo Booking',
                desc: 'Ship your cargo alongside passengers with our integrated system.',
              },
              {
                icon: <Star className="w-7 h-7 text-navy-700" />,
                title: 'Passenger Manifest',
                desc: 'Full compliance reporting for Port Authorities and regulators.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="card-maritime p-7 group hover:border-gold-300 transition-colors duration-300">
                <div className="w-14 h-14 bg-navy-50 group-hover:bg-gold-50 rounded-2xl flex items-center justify-center mb-5 transition-colors duration-300">
                  {icon}
                </div>
                <h3 className="font-display font-semibold text-navy-900 text-lg mb-2">{title}</h3>
                <p className="text-navy-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy-950">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Ready to Set Sail?
          </h2>
          <p className="text-navy-300 text-lg mb-8">
            Create your account and book your first trip in minutes.
          </p>
          <Link to="/auth?mode=register" className="btn-gold text-base px-10 py-3.5 inline-flex items-center gap-2">
            Get Started Free
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 border-t border-navy-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-navy-800 rounded-lg flex items-center justify-center">
              <Anchor className="w-4 h-4 text-gold-400" />
            </div>
            <span className="font-display text-white font-semibold">MonStar Ship Lines</span>
          </div>
          <p className="text-navy-500 text-sm">© 2025 MonStar Ship Lines. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

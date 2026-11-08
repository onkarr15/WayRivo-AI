import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { WayRivoLogo } from '../components/branding';
import {
  LayoutDashboard,
  MapPin,
  FileText,
  Briefcase,
  MessageSquare,
  User,
  Star,
  Users,
  CheckCircle,
  Map,
  ClipboardList,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

const travelerLinks = [
  { to: '/traveler/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/traveler/create-trip', icon: MapPin, label: 'Create Trip' },
  { to: '/traveler/requests', icon: FileText, label: 'My Requests' },
  { to: '/traveler/bookings', icon: Briefcase, label: 'My Bookings' },
  { to: '/traveler/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/traveler/profile', icon: User, label: 'Profile' },
];

const expertLinks = [
  { to: '/expert/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expert/requests', icon: FileText, label: 'Trip Requests' },
  { to: '/expert/proposals', icon: ClipboardList, label: 'My Proposals' },
  { to: '/expert/bookings', icon: Briefcase, label: 'Bookings' },
  { to: '/expert/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/expert/profile', icon: User, label: 'Profile' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/experts', icon: CheckCircle, label: 'Experts' },
  { to: '/admin/destinations', icon: Map, label: 'Destinations' },
  { to: '/admin/requests', icon: FileText, label: 'Trip Requests' },
  { to: '/admin/bookings', icon: Briefcase, label: 'Bookings' },
  { to: '/admin/reviews', icon: Star, label: 'Reviews' },
  { to: '/admin/profile', icon: User, label: 'Profile' },
];

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = user?.role === 'ADMIN' ? adminLinks : user?.role === 'EXPERT' ? expertLinks : travelerLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 flex print:bg-white print:text-black print:min-h-0 print:block">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-navy border-r border-border/80 text-white transform transition-transform duration-300 lg:translate-x-0 print:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-border/80">
          <WayRivoLogo
            variant="horizontal"
            size="sm"
            withVersion={true}
            href="/"
            glow={true}
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-5 flex flex-col justify-between h-[calc(100vh-5rem)]">
          <div>
            <div className="px-3 py-2 mb-3">
              <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-black">
                {user?.role || 'TRAVELER'} WORKSPACE
              </p>
            </div>

            <nav className="space-y-1.5">
              {links.map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-border/80">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 w-full transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-navy-dark/80 backdrop-blur-md z-30 lg:hidden print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0 bg-navy-dark print:ml-0 print:bg-white print:block">
        <header className="sticky top-0 z-20 bg-navy-dark/80 backdrop-blur-xl border-b border-border/80 h-20 flex items-center px-4 sm:px-8 print:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-xl"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-3 pl-3 py-1.5 pr-2 rounded-2xl bg-surface border border-border-light">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">{user?.name || 'Traveler'}</p>
                <p className="text-[10px] text-cyan-400 font-medium">{user?.role || 'MEMBER'}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 print:p-0 print:m-0 print:max-w-none">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

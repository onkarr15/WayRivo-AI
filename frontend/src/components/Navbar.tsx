import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Bell, MessageSquare, ChevronDown, LogOut, User, LayoutDashboard, MapPin, Sparkles } from 'lucide-react';
import { notificationService, messageService } from '../services';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchCounts = async () => {
        try {
          const [nRes, mRes] = await Promise.all([
            notificationService.getUnreadCount(),
            messageService.getUnreadCount(),
          ]);
          setUnreadNotifs(nRes.data?.data?.count || 0);
          setUnreadMsgs(mRes.data?.data?.count || 0);
        } catch { }
      };
      fetchCounts();
      const interval = setInterval(fetchCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardPath =
    user?.role === 'ADMIN'
      ? '/admin/dashboard'
      : user?.role === 'EXPERT'
      ? '/expert/dashboard'
      : '/traveler/dashboard';

  const messagesPath = user?.role === 'EXPERT' ? '/expert/messages' : '/traveler/messages';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-navy-dark/90 backdrop-blur-xl border-b border-border-cyan/30 shadow-2xl shadow-black/50'
          : 'bg-navy-dark/70 backdrop-blur-md border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-400/40 transition-shadow">
              <MapPin className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-wider text-white">
                  WAY<span className="text-gradient-cyan">RIVO</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  AI 2.0
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 -mt-1 tracking-tight">
                Intelligent Travel Commerce
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/explore"
              className="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors"
            >
              Explore Destinations
            </Link>
            <Link
              to="/how-it-works"
              className="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors"
            >
              How It Works
            </Link>
            <Link
              to="/about"
              className="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors"
            >
              About
            </Link>
          </div>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to={messagesPath}
                  className="relative p-2.5 text-slate-300 hover:text-cyan-400 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
                  aria-label="Direct Messages"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMsgs > 0 && (
                    <span className="absolute 1 top-1 right-1 w-4 h-4 bg-cyan-400 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                      {unreadMsgs}
                    </span>
                  )}
                </Link>

                <Link
                  to={dashboardPath}
                  className="relative p-2.5 text-slate-300 hover:text-cyan-400 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(212,175,55,0.6)]">
                      {unreadNotifs}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl bg-surface hover:bg-surface-elevated border border-border-light hover:border-cyan-400/40 transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-bold text-white hidden lg:block">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-3 w-60 rounded-2xl bg-surface/95 backdrop-blur-2xl border border-white/10 shadow-2xl py-2 z-50">
                      <div className="px-4 py-3 border-b border-border/80">
                        <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          {user?.role}
                        </span>
                      </div>

                      <Link
                        to={dashboardPath}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-cyan-300 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                        Dashboard
                      </Link>

                      <Link
                        to={user?.role === 'EXPERT' ? '/expert/profile' : '/traveler/profile'}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-cyan-300 transition-colors"
                      >
                        <User className="w-4 h-4 text-teal-400" />
                        Profile Settings
                      </Link>

                      <div className="my-1 border-t border-border/80" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors w-full text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-xs sm:text-sm px-5 py-2.5 shadow-cyan-500/25"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-navy-dark/95 backdrop-blur-2xl border-b border-border/80 px-4 py-5 space-y-3">
          <Link
            to="/explore"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm font-medium text-slate-300 hover:text-cyan-400"
          >
            Explore Destinations
          </Link>
          <Link
            to="/how-it-works"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm font-medium text-slate-300 hover:text-cyan-400"
          >
            How It Works
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm font-medium text-slate-300 hover:text-cyan-400"
          >
            About
          </Link>

          <div className="border-t border-border/80 pt-3">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm font-semibold text-cyan-400"
                >
                  Go to Dashboard
                </Link>
                <Link
                  to={messagesPath}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm font-medium text-slate-300"
                >
                  Messages {unreadMsgs > 0 && `(${unreadMsgs})`}
                </Link>
                <button
                  onClick={handleLogout}
                  className="block py-2 text-sm font-semibold text-red-400 w-full text-left"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-center py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary text-center text-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

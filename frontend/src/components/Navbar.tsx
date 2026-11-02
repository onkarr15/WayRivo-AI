import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  X,
  Bell,
  MessageSquare,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  MapPin,
  Sparkles,
  Bot,
} from 'lucide-react';
import { notificationService, messageService } from '../services';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
        } catch {}
      };
      fetchCounts();
      const interval = setInterval(fetchCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
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

  const scrollToSection = (sectionId: string) => {
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'py-2.5 bg-navy-dark/85 backdrop-blur-xl border-b border-cyan-500/20 shadow-2xl shadow-cyan-950/40'
          : 'py-4 bg-navy-dark/70 backdrop-blur-md border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* 1. WayRivo AI Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-400/40 transition-shadow">
              <MapPin className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-wider text-white">
                  WAY<span className="text-gradient-cyan">RIVO</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  AI 2.0
                </span>
              </div>
              <span className="text-[9px] font-medium text-slate-400 -mt-1 tracking-tight">
                Intelligent Travel Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links: Home, Explore, Destinations, Packages, AI Travel Planner, About */}
          <div className="hidden lg:flex items-center gap-7">
            <Link
              to="/"
              className={`text-xs font-bold transition-colors ${
                location.pathname === '/' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              Home
            </Link>

            <Link
              to="/explore"
              className={`text-xs font-bold transition-colors ${
                location.pathname === '/explore' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              Explore
            </Link>

            <button
              onClick={() => scrollToSection('destinations')}
              className="text-xs font-bold text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Destinations
            </button>

            <button
              onClick={() => scrollToSection('packages')}
              className="text-xs font-bold text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Packages
            </button>

            {/* AI Travel Planner */}
            <Link
              to="/traveler/create-trip"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-cyan-300 hover:text-cyan-200 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400/50 transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)]"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Travel Planner</span>
            </Link>

            <Link
              to="/about"
              className={`text-xs font-bold transition-colors ${
                location.pathname === '/about' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              About
            </Link>
          </div>

          {/* Auth Controls: Login, Get Started CTA */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to={messagesPath}
                  className="relative p-2 text-slate-300 hover:text-cyan-400 hover:bg-white/5 rounded-xl transition-all"
                  aria-label="Direct Messages"
                >
                  <MessageSquare className="w-4 h-4" />
                  {unreadMsgs > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-cyan-400 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center">
                      {unreadMsgs}
                    </span>
                  )}
                </Link>

                <Link
                  to={dashboardPath}
                  className="relative p-2 text-slate-300 hover:text-cyan-400 hover:bg-white/5 rounded-xl transition-all"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center">
                      {unreadNotifs}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-surface hover:bg-surface-elevated border border-border-light hover:border-cyan-400/40 transition-all cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-bold text-white max-w-[100px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface/95 backdrop-blur-2xl border border-white/10 shadow-2xl py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-border/80">
                        <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          {user?.role}
                        </span>
                      </div>

                      <Link
                        to={dashboardPath}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-cyan-300"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                        Dashboard
                      </Link>

                      <Link
                        to={user?.role === 'EXPERT' ? '/expert/profile' : '/traveler/profile'}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-cyan-300"
                      >
                        <User className="w-3.5 h-3.5 text-teal-400" />
                        Profile
                      </Link>

                      <div className="my-1 border-t border-border/80" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 w-full text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
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
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-xs px-4 py-2 shadow-cyan-500/25"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-navy-dark/95 backdrop-blur-2xl border-b border-border/80 px-4 py-5 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-300 hover:text-cyan-400"
          >
            Home
          </Link>
          <Link
            to="/explore"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-300 hover:text-cyan-400"
          >
            Explore
          </Link>
          <button
            onClick={() => scrollToSection('destinations')}
            className="block w-full text-left py-2 text-sm font-semibold text-slate-300 hover:text-cyan-400"
          >
            Destinations
          </button>
          <button
            onClick={() => scrollToSection('packages')}
            className="block w-full text-left py-2 text-sm font-semibold text-slate-300 hover:text-cyan-400"
          >
            Packages
          </button>
          <Link
            to="/traveler/create-trip"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-bold text-cyan-400"
          >
            <Bot className="w-4 h-4" />
            AI Travel Planner
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-300 hover:text-cyan-400"
          >
            About
          </Link>

          <div className="border-t border-border/80 pt-3">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm font-bold text-cyan-400"
                >
                  Dashboard
                </Link>
                <Link
                  to={messagesPath}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm font-semibold text-slate-300"
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
                  Login
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

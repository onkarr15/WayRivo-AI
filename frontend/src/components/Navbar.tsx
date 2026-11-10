import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles,
  Bot,
  Settings,
} from 'lucide-react';
import { notificationService, messageService } from '../services';
import { WayRivoLogo } from './branding';

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

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/explore', label: 'Explore' },
    { to: '/destinations', label: 'Destinations' },
    { to: '/packages', label: 'Packages' },
    { to: '/itinerary-planner', label: 'Itinerary & Budget' },
    { to: '/about', label: 'About' },
  ];

  return (
    <motion.nav
      initial={false}
      animate={{
        backgroundColor: scrolled ? 'rgba(10, 15, 29, 0.92)' : 'rgba(10, 15, 29, 0.72)',
        borderColor: scrolled ? 'rgba(0, 240, 255, 0.22)' : 'rgba(255, 255, 255, 0.05)',
        boxShadow: scrolled ? '0 20px 40px -15px rgba(0, 0, 0, 0.7)' : 'none',
      }}
      transition={{ duration: 0.3 }}
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b ${
        scrolled ? 'py-2.5' : 'py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* 1. Official WayRivo AI Aero W Logo */}
          <WayRivoLogo
            variant="horizontal"
            size="md"
            withVersion={true}
            href="/"
            glow={true}
          />

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative text-xs font-bold transition-colors py-1 ${
                    isActive ? 'text-cyan-400' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}

            {/* AI Travel Agent Spotlight Pill */}
            <Link
              to="/agent"
              className="relative inline-flex items-center gap-1.5 text-xs font-extrabold text-cyan-300 hover:text-cyan-200 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400/60 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_20px_rgba(0,240,255,0.35)]"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>WayRivo AI Agent</span>
            </Link>
          </div>

          {/* Auth Controls */}
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

                {/* User Dropdown with AnimatePresence */}
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-surface hover:bg-surface-elevated border border-border-light hover:border-cyan-400/40 transition-all cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-bold text-white max-w-[100px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        profileOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface/95 backdrop-blur-2xl border border-white/10 shadow-2xl py-2 z-50 origin-top-right"
                      >
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
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-cyan-300"
                        >
                          <User className="w-3.5 h-3.5 text-teal-400" />
                          Profile
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-cyan-300"
                        >
                          <Settings className="w-3.5 h-3.5 text-slate-400" />
                          Account Settings
                        </Link>

                        <div className="my-1 border-t border-border/80" />

                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 w-full text-left cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
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

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu with AnimatePresence */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden bg-navy-dark/95 backdrop-blur-2xl border-b border-border/80 px-4 py-5 space-y-3 overflow-hidden"
          >
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
            <Link
              to="/destinations"
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-300 hover:text-cyan-400"
            >
              Destinations
            </Link>
            <Link
              to="/packages"
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-300 hover:text-cyan-400"
            >
              Packages
            </Link>
            <Link
              to="/agent"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-2 text-sm font-bold text-cyan-400"
            >
              <Bot className="w-4 h-4" />
              WayRivo AI Agent
            </Link>
            <Link
              to="/itinerary-planner"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-2 text-sm font-bold text-slate-200 hover:text-cyan-400"
            >
              Itinerary & Budget
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
                    className="block py-2 text-sm font-semibold text-red-400 w-full text-left cursor-pointer"
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;

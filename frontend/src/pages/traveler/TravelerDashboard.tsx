import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MapPin, FileText, Briefcase, MessageSquare, Bell, ArrowRight, Plus, CheckCircle } from 'lucide-react';
import { tripRequestService, bookingService, notificationService, messageService } from '../../services';

const TravelerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [bookingCount, setBookingCount] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, bookingsRes, notifsRes, msgsRes] = await Promise.all([
          tripRequestService.getDashboardStats(),
          bookingService.getTravelerBookings(0, 1),
          notificationService.getUnreadCount(),
          messageService.getUnreadCount(),
        ]);
        setStats(statsRes.data?.data || {});
        setBookingCount(bookingsRes.data?.data?.totalElements || 0);
        setUnreadNotifs(notifsRes.data?.data?.count || 0);
        setUnreadMsgs(msgsRes.data?.data?.count || 0);
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const cards = [
    { label: 'Active Requests', value: stats.activeRequests || 0, icon: FileText, color: 'bg-blue-500', link: '/traveler/requests' },
    { label: 'Proposals Received', value: stats.proposalsReceived || 0, icon: CheckCircle, color: 'bg-emerald-500', link: '/traveler/requests' },
    { label: 'My Bookings', value: bookingCount, icon: Briefcase, color: 'bg-purple-500', link: '/traveler/bookings' },
    { label: 'Unread Messages', value: unreadMsgs, icon: MessageSquare, color: 'bg-orange', link: '/traveler/messages' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-text-light mt-1">Here's what's happening with your trips</p>
        </div>
        <Link to="/traveler/create-trip" className="btn-primary"><Plus className="w-4 h-4" />Create Trip</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="card p-5 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-light">{label}</p>
                <p className="text-3xl font-bold text-navy mt-1">{value}</p>
              </div>
              <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-navy mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/traveler/create-trip" className="flex items-center justify-between p-3 rounded-xl hover:bg-bg transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-orange" /></div>
                <div><p className="text-sm font-medium text-text">Create a New Trip</p><p className="text-xs text-text-light">Tell us where you want to go</p></div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-light group-hover:text-orange transition-colors" />
            </Link>
            <Link to="/traveler/requests" className="flex items-center justify-between p-3 rounded-xl hover:bg-bg transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5 text-blue-500" /></div>
                <div><p className="text-sm font-medium text-text">View My Requests</p><p className="text-xs text-text-light">Check proposals and status</p></div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-light group-hover:text-orange transition-colors" />
            </Link>
            <Link to="/explore" className="flex items-center justify-between p-3 rounded-xl hover:bg-bg transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-emerald-500" /></div>
                <div><p className="text-sm font-medium text-text">Explore Destinations</p><p className="text-xs text-text-light">Discover amazing places</p></div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-light group-hover:text-orange transition-colors" />
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy">Notifications</h3>
            {unreadNotifs > 0 && <span className="badge-warning">{unreadNotifs} new</span>}
          </div>
          {unreadNotifs === 0 ? (
            <div className="text-center py-8 text-text-light">
              <Bell className="w-10 h-10 mx-auto mb-3 text-text-lighter" />
              <p className="text-sm">No new notifications</p>
            </div>
          ) : (
            <p className="text-sm text-text-light">You have {unreadNotifs} unread notification{unreadNotifs > 1 ? 's' : ''}. Check your dashboard for updates.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelerDashboard;

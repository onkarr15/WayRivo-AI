import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { proposalService } from '../../services';
import { FileText, CheckCircle, Star, Briefcase, Shield } from 'lucide-react';

const ExpertDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    proposalService.getExpertDashboardStats()
      .then(r => setStats(r.data?.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" /></div>;

  const cards = [
    { label: 'Total Proposals', value: stats.totalProposals || 0, icon: FileText, color: 'bg-blue-500' },
    { label: 'Accepted', value: stats.acceptedProposals || 0, icon: CheckCircle, color: 'bg-emerald-500' },
    { label: 'Active Bookings', value: stats.activeBookings || 0, icon: Briefcase, color: 'bg-purple-500' },
    { label: 'Rating', value: stats.rating || '0.0', icon: Star, color: 'bg-amber-500', sub: `${stats.totalReviews || 0} reviews` },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Expert Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge ${stats.verificationStatus === 'VERIFIED' ? 'badge-success' : 'badge-warning'}`}>
              <Shield className="w-3 h-3 mr-1" />{stats.verificationStatus || 'PENDING'}
            </span>
          </div>
        </div>
        <Link to="/expert/requests" className="btn-primary">Browse Requests</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{label}</p>
                <p className="text-3xl font-bold text-white mt-1">{value}</p>
                {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
              </div>
              <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white`}><Icon className="w-6 h-6" /></div>
            </div>
          </div>
        ))}
      </div>

      {stats.verificationStatus !== 'VERIFIED' && (
        <div className="card p-6 border-amber-500/30 bg-amber-500/10">
          <h3 className="font-semibold text-amber-300 mb-2">⏳ Verification Pending</h3>
          <p className="text-sm text-amber-200/80">Your profile is being reviewed. Once verified, you'll be able to submit proposals to travelers. This usually takes 24-48 hours.</p>
        </div>
      )}
    </div>
  );
};

export default ExpertDashboard;

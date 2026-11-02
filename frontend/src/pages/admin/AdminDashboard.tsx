import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import {
  Users,
  Briefcase,
  DollarSign,
  Activity,
  History,
  ShieldCheck,
  Percent,
  Layers
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [analytics, setAnalytics] = useState<any>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getDashboardStats(),
      adminService.getAnalytics(),
      adminService.getAuditLogs(0, 10),
    ])
      .then(([statsRes, analyticsRes, auditRes]) => {
        setStats(statsRes.data?.data || {});
        setAnalytics(analyticsRes.data?.data || {});
        setAuditLogs(auditRes.data?.data?.content || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const primaryCards = [
    { label: 'Total Revenue', value: `₹${Number(stats.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-600', sub: 'Completed Escrow Bookings' },
    { label: 'Active Travelers', value: stats.totalTravelers || 0, icon: Users, color: 'bg-blue-600', sub: `${stats.totalUsers || 0} Registered Users` },
    { label: 'Verified Specialists', value: stats.verifiedExperts || 0, icon: ShieldCheck, color: 'bg-purple-600', sub: `${stats.pendingExperts || 0} Pending Verification` },
    { label: 'Total Bookings', value: stats.totalBookings || 0, icon: Briefcase, color: 'bg-orange', sub: `${stats.totalTripRequests || 0} Open Trip Requests` },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">Admin Control & Intelligence Center</h1>
        <p className="text-xs text-text-light mt-1">Live platform telemetry, marketplace analytics, and security audit logs.</p>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryCards.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card p-5 border border-border shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-light font-semibold uppercase">{label}</p>
                <p className="text-2xl font-bold text-navy mt-1">{value}</p>
                <p className="text-[11px] text-text-light mt-0.5">{sub}</p>
              </div>
              <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white shadow-xs`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Startup Marketplace Analytics */}
      <div className="card p-6 border border-border">
        <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange" /> Marketplace Conversion & Health Analytics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-bg rounded-xl">
            <span className="text-[11px] text-text-light font-bold uppercase flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-blue-600" /> Conversion Rate
            </span>
            <p className="text-2xl font-bold text-navy mt-1">{analytics.conversionRate || 0}%</p>
            <span className="text-[10px] text-emerald-600 font-semibold">Request to Booking Ratio</span>
          </div>

          <div className="p-4 bg-bg rounded-xl">
            <span className="text-[11px] text-text-light font-bold uppercase flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Avg Booking Value
            </span>
            <p className="text-2xl font-bold text-navy mt-1">₹{Number(analytics.avgBookingValue || 0).toLocaleString()}</p>
            <span className="text-[10px] text-text-light">Per Confirmed Tour</span>
          </div>

          <div className="p-4 bg-bg rounded-xl">
            <span className="text-[11px] text-text-light font-bold uppercase flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-600" /> Competition Ratio
            </span>
            <p className="text-2xl font-bold text-navy mt-1">{analytics.avgProposalsPerTrip || 0}</p>
            <span className="text-[10px] text-text-light">Proposals per Trip Request</span>
          </div>

          <div className="p-4 bg-bg rounded-xl">
            <span className="text-[11px] text-text-light font-bold uppercase flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Platform Status
            </span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{analytics.platformHealth || 'OPTIMAL'}</p>
            <span className="text-[10px] text-text-light">Escrow & APIs Active</span>
          </div>
        </div>
      </div>

      {/* Audit Log Trail */}
      <div className="card p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-orange" /> Recent Security & Moderation Audit Trail
          </h2>
          <span className="text-xs text-text-light">{auditLogs.length} recent actions recorded</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-center py-6 text-xs text-text-light bg-bg rounded-xl">
            No administrative moderation actions recorded in the active session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-bg text-text-light uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-2.5 rounded-l-lg">Action</th>
                  <th className="p-2.5">Entity</th>
                  <th className="p-2.5">Entity ID</th>
                  <th className="p-2.5">Admin</th>
                  <th className="p-2.5">Details</th>
                  <th className="p-2.5 rounded-r-lg">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-bg/50">
                    <td className="p-2.5 font-bold text-navy">{log.action}</td>
                    <td className="p-2.5 text-text-light">{log.entityType}</td>
                    <td className="p-2.5 font-mono">#{log.entityId}</td>
                    <td className="p-2.5 font-semibold text-navy">{log.adminName}</td>
                    <td className="p-2.5 text-text max-w-[200px] truncate">{log.details}</td>
                    <td className="p-2.5 text-text-light">{log.createdAt ? new Date(log.createdAt).toLocaleDateString() : 'Just now'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

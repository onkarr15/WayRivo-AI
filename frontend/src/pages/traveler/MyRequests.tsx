import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tripRequestService } from '../../services';
import { MapPin, Calendar, Users, DollarSign, FileText, Plus } from 'lucide-react';

const statusColors: Record<string, string> = {
  OPEN: 'badge-info', PROPOSALS_RECEIVED: 'badge-success', PROPOSAL_SELECTED: 'badge-warning',
  BOOKED: 'badge-success', COMPLETED: 'badge-neutral', CANCELLED: 'badge-danger', DRAFT: 'badge-neutral', SUBMITTED: 'badge-info',
};

const MyRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await tripRequestService.getMy(page, 10);
      const data = res.data?.data;
      setRequests(data?.content || []);
      setTotalPages(data?.totalPages || 0);
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => {
      tripRequestService.getMy(page, 10).then(res => {
        const data = res.data?.data;
        if (data?.content) {
          setRequests(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(data.content)) {
              return data.content;
            }
            return prev;
          });
        }
      }).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchRequests, page]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">My Trip Requests</h1><p className="text-slate-400 mt-1">Track all your travel requests</p></div>
        <Link to="/traveler/create-trip" className="btn-primary"><Plus className="w-4 h-4" />New Trip</Link>
      </div>

      {requests.length === 0 ? (
        <div className="card p-12 text-center">
          <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Your next adventure starts here</h3>
          <p className="text-slate-400 mb-6">Tell WayRivo where you want to go and get proposals from verified experts.</p>
          <Link to="/traveler/create-trip" className="btn-primary">Create Your First Trip</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r: any) => (
            <Link key={r.id} to={`/traveler/requests/${r.id}`} className="card p-5 block hover:shadow-lg transition-all group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white text-lg group-hover:text-cyan-400 transition-colors">{r.destination}</h3>
                    <span className={statusColors[r.status] || 'badge-neutral'}>{(r.status || 'OPEN').replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                    {r.fromLocation && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />From {r.fromLocation}</span>}
                    {r.startDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{r.startDate}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{r.travelersCount || 1} travelers</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />₹{Number(r.budget || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm"><FileText className="w-4 h-4 text-cyan-400" /><span className="font-semibold text-white">{r.proposalCount ?? r.proposals?.length ?? 0}</span><span className="text-slate-400">proposals</span></div>
                </div>
              </div>
            </Link>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn-ghost text-sm">Previous</button>
              <span className="btn-ghost text-sm">Page {page + 1} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="btn-ghost text-sm">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyRequests;

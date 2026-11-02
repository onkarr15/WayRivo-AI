import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tripRequestService } from '../../services';
import { MapPin, Calendar, Users, DollarSign, Search } from 'lucide-react';

const ExpertRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await tripRequestService.getOpen(page, 10, search);
      const data = res.data?.data;
      setRequests(data?.content || []);
      setTotalPages(data?.totalPages || 0);
    } catch {}
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-2">Trip Requests</h1>
      <p className="text-text-light mb-6">Browse open requests from travelers</p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
        <input className="input pl-10" placeholder="Search by destination..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" /></div>
      ) : requests.length === 0 ? (
        <div className="card p-8 text-center"><p className="text-text-light">No open requests found</p></div>
      ) : (
        <div className="space-y-4">
          {requests.map((r: any) => (
            <Link key={r.id} to={`/expert/requests/${r.id}`} className="card p-5 block hover:shadow-lg transition-all group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-navy text-lg group-hover:text-orange transition-colors">{r.destination}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-text-light mt-2">
                    {r.fromLocation && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{r.fromLocation}</span>}
                    {r.startDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{r.startDate}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{r.travelersCount}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />₹{Number(r.budget).toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {r.travelStyle && <span className="badge-info">{r.travelStyle}</span>}
                    {r.travelType && <span className="badge-neutral">{r.travelType}</span>}
                  </div>
                </div>
                <div className="btn-outline text-sm">Submit Proposal</div>
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

export default ExpertRequests;

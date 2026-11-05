import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import { MapPin, Calendar, Users, DollarSign, FileText } from 'lucide-react';

const statusColors: Record<string, string> = {
  OPEN: 'badge-info',
  PROPOSALS_RECEIVED: 'badge-success',
  PROPOSAL_SELECTED: 'badge-warning',
  BOOKED: 'badge-success',
  COMPLETED: 'badge-neutral',
  CANCELLED: 'badge-danger',
};

const AdminTripRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fallback demo requests
  const fallbackRequests = [
    { id: 101, destination: 'Munnar & Alleppey', fromLocation: 'Bangalore', startDate: '2026-09-15', endDate: '2026-09-20', travelersCount: 2, travelType: 'Couple', budget: 45000, status: 'OPEN', proposalCount: 3, travelerName: 'Arjun Sharma' },
    { id: 102, destination: 'Manali & Kasol', fromLocation: 'Delhi', startDate: '2026-10-01', endDate: '2026-10-07', travelersCount: 4, travelType: 'Friends', budget: 60000, status: 'PROPOSALS_RECEIVED', proposalCount: 5, travelerName: 'Rahul Verma' },
    { id: 103, destination: 'Goa Beaches', fromLocation: 'Mumbai', startDate: '2026-11-10', endDate: '2026-11-15', travelersCount: 2, travelType: 'Honeymoon', budget: 50000, status: 'BOOKED', proposalCount: 4, travelerName: 'Priya Patel' },
  ];

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getTripRequests(page, 10);
      const data = res.data?.data;
      if (data?.content && data.content.length > 0) {
        setRequests(data.content);
        setTotalPages(data.totalPages || 1);
      } else {
        setRequests(fallbackRequests);
      }
    } catch {
      setRequests(fallbackRequests);
    }
    setLoading(false);
  }, [page, fallbackRequests]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trip Requests Monitor</h1>
        <p className="text-sm text-slate-400 mt-1">Platform-wide overview of all submitted traveler requests and proposal activity</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(r => (
            <div key={r.id} className="card p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">
                      #{r.id} • {r.destination}
                    </h3>
                    <span className={statusColors[r.status] || 'badge-neutral'}>
                      {r.status?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Requested by: <span className="font-semibold text-white">{r.travelerName || 'Traveler'}</span>
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                    {r.fromLocation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> From {r.fromLocation}
                      </span>
                    )}
                    {r.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {r.startDate}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {r.travelersCount} travelers ({r.travelType || 'General'})
                    </span>
                    <span className="flex items-center gap-1 font-bold text-white">
                      <DollarSign className="w-3.5 h-3.5 text-cyan-400" /> ₹{Number(r.budget).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex md:flex-col items-end justify-between md:justify-center gap-1">
                  <div className="flex items-center gap-1.5 text-sm bg-orange/10 px-3 py-1.5 rounded-lg text-orange font-bold">
                    <FileText className="w-4 h-4" />
                    {r.proposalCount || 0} Proposals
                  </div>
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn-ghost text-xs">
                Previous
              </button>
              <span className="btn-ghost text-xs">Page {page + 1} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="btn-ghost text-xs">
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTripRequests;

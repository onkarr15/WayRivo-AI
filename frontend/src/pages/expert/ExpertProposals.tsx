import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { proposalService } from '../../services';
import { ClipboardList, Calendar, DollarSign, ArrowRight } from 'lucide-react';

const statusColors: Record<string, string> = {
  SUBMITTED: 'badge-info',
  SELECTED: 'badge-success',
  REJECTED: 'badge-danger',
  EXPIRED: 'badge-neutral',
};

const ExpertProposals: React.FC = () => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, [page]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await proposalService.getMy(page, 10);
      const data = res.data?.data;
      setProposals(data?.content || []);
      setTotalPages(data?.totalPages || 0);
    } catch {}
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">My Proposals</h1>
          <p className="text-sm text-text-light mt-1">Track the status of all travel proposals you've submitted</p>
        </div>
        <Link to="/expert/requests" className="btn-primary">
          Browse Open Requests
        </Link>
      </div>

      {proposals.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList className="w-12 h-12 text-text-lighter mx-auto mb-3" />
          <h3 className="text-lg font-bold text-navy mb-1">No proposals yet</h3>
          <p className="text-sm text-text-light mb-6">Browse traveler requests and submit custom proposals to start winning bookings.</p>
          <Link to="/expert/requests" className="btn-primary">
            Explore Trip Requests
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map(p => (
            <div key={p.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-navy">{p.title}</h3>
                    <span className={statusColors[p.status] || 'badge-neutral'}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-sm text-text-light line-clamp-2">{p.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-text-light">
                    <span className="flex items-center gap-1 font-semibold text-navy">
                      <DollarSign className="w-3.5 h-3.5 text-orange" />
                      ₹{Number(p.totalPrice).toLocaleString()}
                    </span>
                    {p.validityDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Valid until: {p.validityDate}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
                  <Link
                    to={`/expert/requests/${p.tripRequestId}`}
                    className="btn-outline text-xs px-4 py-2"
                  >
                    View Request <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="btn-ghost text-sm"
              >
                Previous
              </button>
              <span className="btn-ghost text-sm">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="btn-ghost text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpertProposals;

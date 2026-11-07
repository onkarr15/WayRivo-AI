import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import { CheckCircle, XCircle, ShieldAlert, Award, Star, RefreshCw } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

const AdminExperts: React.FC = () => {
  const { toast } = useToast();
  const [experts, setExperts] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchExperts = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getExperts(status, page, 10);
      const data = res.data?.data;
      setExperts(data?.content || []);
      setTotalPages(data?.totalPages || 0);
    } catch (err: any) {
      console.error('Failed to load experts:', err);
    }
    setLoading(false);
  }, [status, page]);

  useEffect(() => { fetchExperts(); }, [fetchExperts]);

  const handleVerify = async (id: string | number, newStatus: string) => {
    try {
      await adminService.updateExpertVerification(id, newStatus);
      toast.success(`Expert verification status updated to ${newStatus}`);
      fetchExperts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update expert verification');
    }
  };

  const statusColor: Record<string, string> = {
    VERIFIED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold',
    PENDING: 'bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold',
    REJECTED: 'bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold',
    SUSPENDED: 'bg-red-500/15 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold',
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-1">
            <Award className="w-3.5 h-3.5 text-amber-400" /> Destination Agency & Local Expert Verification
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Expert Credentials & Moderation</h1>
          <p className="text-xs text-slate-400 mt-1">Review, verify, and monitor certified regional travel specialists.</p>
        </div>

        <button
          onClick={fetchExperts}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'].map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(0); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              status === s ? 'bg-cyan-500 text-slate-950 font-black shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {s || 'All Experts'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : experts.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
          No expert profiles found matching the "{status || 'All'}" status criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {experts.map((e: any) => (
            <div key={e.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-white text-base">{e.user?.name || e.name || 'Local Expert'}</h3>
                    <span className={statusColor[e.verificationStatus] || 'bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-xs'}>
                      {e.verificationStatus}
                    </span>
                    <span className="text-amber-400 text-xs font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Star className="w-3 h-3 fill-amber-400" /> {e.rating || 4.9} ({e.totalReviews || 24} reviews)
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-cyan-300">{e.organizationName}</p>
                  <p className="text-xs text-slate-400">
                    Location: <span className="text-slate-300">{e.city}, {e.state}</span> • Experience: <span className="text-slate-300">{e.yearsOfExperience} years</span>
                  </p>
                  {e.specializations && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      <strong className="text-slate-300">Specializations:</strong> {e.specializations}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {e.verificationStatus !== 'VERIFIED' && (
                    <button
                      onClick={() => handleVerify(e.id, 'VERIFIED')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Verify Credentials
                    </button>
                  )}
                  {e.verificationStatus !== 'REJECTED' && (
                    <button
                      onClick={() => handleVerify(e.id, 'REJECTED')}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-bold text-xs border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  )}
                  {e.verificationStatus === 'VERIFIED' && (
                    <button
                      onClick={() => handleVerify(e.id, 'SUSPENDED')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-500/15 text-slate-400 hover:text-red-400 font-bold text-xs border border-slate-700 hover:border-red-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4" /> Suspend
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4 text-xs text-slate-400">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="font-semibold text-white px-2">Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer"
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

export default AdminExperts;

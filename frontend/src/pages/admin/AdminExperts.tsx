import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import { CheckCircle, XCircle } from 'lucide-react';

const AdminExperts: React.FC = () => {
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
    } catch {}
    setLoading(false);
  }, [status, page]);

  useEffect(() => { fetchExperts(); }, [fetchExperts]);

  const handleVerify = async (id: number, newStatus: string) => {
    try {
      await adminService.updateExpertVerification(id, newStatus);
      fetchExperts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  const statusColor: Record<string, string> = { VERIFIED: 'badge-success', PENDING: 'badge-warning', REJECTED: 'badge-danger', SUSPENDED: 'badge-danger' };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Expert Verification</h1>
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(0); }} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${status === s ? 'bg-orange text-white' : 'bg-gray-100 text-text-light hover:bg-gray-200'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {experts.map((e: any) => (
            <div key={e.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-navy">{e.user?.name || 'Unknown'}</h3>
                    <span className={statusColor[e.verificationStatus] || 'badge-neutral'}>{e.verificationStatus}</span>
                  </div>
                  <p className="text-sm text-text-light">{e.organizationName}</p>
                  <p className="text-xs text-text-light mt-1">{e.city}, {e.state} • {e.yearsOfExperience} yrs exp</p>
                  {e.specializations && <p className="text-xs text-text-lighter mt-1">{e.specializations}</p>}
                </div>
                <div className="flex gap-2">
                  {e.verificationStatus !== 'VERIFIED' && <button onClick={() => handleVerify(e.id, 'VERIFIED')} className="btn-success text-sm"><CheckCircle className="w-4 h-4" />Verify</button>}
                  {e.verificationStatus !== 'REJECTED' && <button onClick={() => handleVerify(e.id, 'REJECTED')} className="btn-danger text-sm"><XCircle className="w-4 h-4" />Reject</button>}
                  {e.verificationStatus === 'VERIFIED' && <button onClick={() => handleVerify(e.id, 'SUSPENDED')} className="btn-ghost text-sm text-danger">Suspend</button>}
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn-ghost text-xs">Previous</button>
              <span className="btn-ghost text-xs">Page {page + 1} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="btn-ghost text-xs">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminExperts;

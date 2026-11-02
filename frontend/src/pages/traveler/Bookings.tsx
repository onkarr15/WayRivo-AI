import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Calendar, DollarSign, MapPin } from 'lucide-react';

const statusColors: Record<string, string> = { PENDING: 'badge-warning', CONFIRMED: 'badge-info', COMPLETED: 'badge-success', CANCELLED: 'badge-danger' };

const Bookings: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchBookings = React.useCallback(async () => {
    try {
      const res = user?.role === 'EXPERT' ? await bookingService.getExpertBookings() : await bookingService.getTravelerBookings();
      setBookings(res.data?.data?.content || []);
    } catch {}
    setLoading(false);
  }, [user?.role]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusUpdate = async (id: number, status: string) => {
    if (!confirm(`Are you sure you want to mark this booking as ${status}?`)) return;
    setUpdating(id);
    try {
      await bookingService.updateStatus(id, status);
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update');
    }
    setUpdating(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">My Bookings</h1>
      {bookings.length === 0 ? (
        <div className="card p-8 text-center"><Briefcase className="w-10 h-10 text-text-lighter mx-auto mb-3" /><p className="text-text-light">Your next trip will appear here.</p></div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b: any) => (
            <div key={b.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono font-bold text-orange">{b.bookingReference}</span>
                    <span className={statusColors[b.status] || 'badge-neutral'}>{b.status}</span>
                    <span className={`badge ${b.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>{b.paymentStatus}</span>
                  </div>
                  <h3 className="font-semibold text-navy">{b.proposalTitle}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-text-light mt-1">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{b.destination}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{b.travelStartDate || b.bookingDate}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />₹{Number(b.totalAmount).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-text-light mt-1">{user?.role === 'EXPERT' ? `Traveler: ${b.travelerName}` : `Expert: ${b.expertName} (${b.organizationName})`}</p>
                </div>
                <div className="flex gap-2">
                  {b.status === 'PENDING' && <button onClick={() => handleStatusUpdate(b.id, 'CONFIRMED')} disabled={updating === b.id} className="btn-success text-sm">Confirm</button>}
                  {b.status === 'CONFIRMED' && <button onClick={() => handleStatusUpdate(b.id, 'COMPLETED')} disabled={updating === b.id} className="btn-primary text-sm">Complete</button>}
                  {(b.status === 'PENDING' || b.status === 'CONFIRMED') && <button onClick={() => handleStatusUpdate(b.id, 'CANCELLED')} disabled={updating === b.id} className="btn-danger text-sm">Cancel</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookings;

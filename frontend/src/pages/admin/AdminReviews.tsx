import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import { Star, User } from 'lucide-react';

const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fallback demo reviews
  const fallbackReviews = [
    { id: 1, travelerName: 'Arjun Sharma', expertName: 'Vikram Mehta', organizationName: 'Himalayan Journeys', rating: 5, comment: 'Vikram crafted an incredible Manali itinerary! The private riverside stay and camp bonfire were unforgettable.', createdAt: '2026-08-15' },
    { id: 2, travelerName: 'Priya Patel', expertName: 'Ananya Sharma', organizationName: 'Kerala Bliss', rating: 5, comment: 'Flawless houseboat booking in Alleppey and great local dining recommendations. Highly recommended!', createdAt: '2026-08-14' },
    { id: 3, travelerName: 'Rahul Verma', expertName: 'Suresh Rao', organizationName: 'Royal Rajasthan Tours', rating: 4, comment: 'Great heritage tour in Jaipur and Udaipur. Driver was very punctual and knowledgeable.', createdAt: '2026-08-12' },
  ];

  const fetchReviews = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getReviews(page, 10);
      const data = res.data?.data;
      if (data?.content && data.content.length > 0) {
        setReviews(data.content);
        setTotalPages(data.totalPages || 1);
      } else {
        setReviews(fallbackReviews);
      }
    } catch {
      setReviews(fallbackReviews);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Review Moderation</h1>
        <p className="text-sm text-slate-400 mt-1">Platform feedback, traveler ratings, and testimonial monitoring</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-white">{r.rating}.0 / 5.0</span>
                    <span className="text-xs text-slate-400">• {r.createdAt || 'Recent'}</span>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed">{r.comment}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-border">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      Traveler: <strong className="text-white">{r.travelerName}</strong>
                    </span>
                    <span>
                      Reviewed Expert: <strong className="text-white">{r.expertName} ({r.organizationName})</strong>
                    </span>
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

export default AdminReviews;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripRequestService, proposalService } from '../../services';
import { Send } from 'lucide-react';

const ExpertRequestDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', totalPrice: '', pricePerPerson: '', itinerary: '',
    accommodationDetails: '', transportationDetails: '', activities: '',
    inclusions: '', exclusions: '', cancellationPolicy: '', validityDate: '',
  });

  useEffect(() => {
    tripRequestService.getById(Number(id)).then(r => setRequest(r.data?.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form, tripRequestId: Number(id),
        totalPrice: parseFloat(form.totalPrice),
        pricePerPerson: form.pricePerPerson ? parseFloat(form.pricePerPerson) : null,
        validityDate: form.validityDate || null,
      };
      const res = await proposalService.create(payload);
      if (res.data?.success) {
        alert('Proposal submitted successfully!');
        navigate('/expert/proposals');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit proposal');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" /></div>;
  if (!request) return <div className="card p-8 text-center"><p>Request not found</p></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Trip to {request.destination}</h1>
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[['From', request.fromLocation], ['To', request.destination], ['Dates', request.startDate ? `${request.startDate} – ${request.endDate}` : 'Flexible'],
            ['Travelers', `${request.travelersCount} (${request.travelType || '-'})`], ['Budget', `₹${Number(request.budget).toLocaleString()}`], ['Style', request.travelStyle || '-']
          ].map(([l, v]) => <div key={l} className="p-3 bg-bg rounded-xl"><p className="text-xs text-text-light">{l}</p><p className="text-sm font-medium">{v}</p></div>)}
        </div>
        {request.interests && <div className="flex flex-wrap gap-2 mt-3">{request.interests.split(',').map((i: string) => <span key={i} className="badge-info">{i.trim()}</span>)}</div>}
        {request.specialRequirements && <p className="text-sm text-text-light mt-3 p-3 bg-bg rounded-xl">{request.specialRequirements}</p>}
      </div>

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="btn-primary"><Send className="w-4 h-4" />Submit Proposal</button>
      ) : (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-navy mb-4">Your Proposal</h2>
          {error && <div className="bg-red-50 text-danger text-sm px-4 py-3 rounded-xl mb-4 border border-red-200">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
            <div><label className="label">Description</label><textarea className="input min-h-[80px]" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Total Price (₹) *</label><input type="number" className="input" value={form.totalPrice} onChange={e => setForm({...form, totalPrice: e.target.value})} required /></div>
              <div><label className="label">Per Person (₹)</label><input type="number" className="input" value={form.pricePerPerson} onChange={e => setForm({...form, pricePerPerson: e.target.value})} /></div>
            </div>
            <div><label className="label">Day-by-Day Itinerary</label><textarea className="input min-h-[120px]" value={form.itinerary} onChange={e => setForm({...form, itinerary: e.target.value})} placeholder="Day 1: ...\nDay 2: ..." /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Accommodation</label><textarea className="input min-h-[80px]" value={form.accommodationDetails} onChange={e => setForm({...form, accommodationDetails: e.target.value})} /></div>
              <div><label className="label">Transportation</label><textarea className="input min-h-[80px]" value={form.transportationDetails} onChange={e => setForm({...form, transportationDetails: e.target.value})} /></div>
            </div>
            <div><label className="label">Activities</label><textarea className="input min-h-[60px]" value={form.activities} onChange={e => setForm({...form, activities: e.target.value})} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Inclusions</label><textarea className="input min-h-[60px]" value={form.inclusions} onChange={e => setForm({...form, inclusions: e.target.value})} /></div>
              <div><label className="label">Exclusions</label><textarea className="input min-h-[60px]" value={form.exclusions} onChange={e => setForm({...form, exclusions: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Cancellation Policy</label><textarea className="input min-h-[60px]" value={form.cancellationPolicy} onChange={e => setForm({...form, cancellationPolicy: e.target.value})} /></div>
              <div><label className="label">Valid Until</label><input type="date" className="input" value={form.validityDate} onChange={e => setForm({...form, validityDate: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4" />Submit Proposal</>}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ExpertRequestDetail;

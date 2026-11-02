import React, { useState, useEffect } from 'react';
import { destinationService } from '../../services';
import { Plus, Edit, Trash2, X } from 'lucide-react';

const AdminDestinations: React.FC = () => {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', country: 'India', state: '', description: '', imageUrl: '', bestTimeToVisit: '', averageBudget: '', currency: 'INR' });

  const fetchDestinations = React.useCallback(async () => {
    try { const res = await destinationService.getAll(0, 100); setDestinations(res.data?.data?.content || []); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const resetForm = () => {
    setForm({ name: '', country: 'India', state: '', description: '', imageUrl: '', bestTimeToVisit: '', averageBudget: '', currency: 'INR' });
    setEditing(null); setShowForm(false);
  };

  const openEdit = (d: any) => {
    setForm({ name: d.name, country: d.country, state: d.state, description: d.description || '', imageUrl: d.imageUrl || '', bestTimeToVisit: d.bestTimeToVisit || '', averageBudget: d.averageBudget?.toString() || '', currency: d.currency || 'INR' });
    setEditing(d); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, averageBudget: form.averageBudget ? parseFloat(form.averageBudget) : null };
    try {
      if (editing) { await destinationService.update(editing.id, payload); }
      else { await destinationService.create(payload); }
      resetForm(); fetchDestinations();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this destination?')) return;
    try { await destinationService.delete(id); fetchDestinations(); } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Destinations</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary"><Plus className="w-4 h-4" />Add Destination</button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-navy">{editing ? 'Edit' : 'Add'} Destination</h2>
            <button onClick={resetForm} className="text-text-light hover:text-text"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div><label className="label">State</label><input className="input" value={form.state} onChange={e => setForm({...form, state: e.target.value})} /></div>
              <div><label className="label">Country</label><input className="input" value={form.country} onChange={e => setForm({...form, country: e.target.value})} /></div>
            </div>
            <div><label className="label">Description</label><textarea className="input min-h-[80px]" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="label">Image URL</label><input className="input" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} /></div>
              <div><label className="label">Best Time</label><input className="input" value={form.bestTimeToVisit} onChange={e => setForm({...form, bestTimeToVisit: e.target.value})} /></div>
              <div><label className="label">Avg Budget (₹)</label><input type="number" className="input" value={form.averageBudget} onChange={e => setForm({...form, averageBudget: e.target.value})} /></div>
            </div>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'} Destination</button>
          </form>
        </div>
      )}

      {loading ? <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {destinations.map((d: any) => (
            <div key={d.id} className="card overflow-hidden">
              {d.imageUrl && <img src={d.imageUrl} alt={d.name} className="w-full h-40 object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
              <div className="p-4">
                <h3 className="font-semibold text-navy">{d.name}</h3>
                <p className="text-sm text-text-light">{d.state}, {d.country}</p>
                {d.averageBudget && <p className="text-sm text-orange font-medium mt-1">From ₹{Number(d.averageBudget).toLocaleString()}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(d)} className="btn-ghost text-sm"><Edit className="w-3.5 h-3.5" />Edit</button>
                  <button onClick={() => handleDelete(d.id)} className="btn-ghost text-sm text-danger"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDestinations;

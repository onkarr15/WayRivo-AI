import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Eye, EyeOff } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<'TRAVELER' | 'EXPERT'>('TRAVELER');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', organizationName: '', description: '', yearsOfExperience: '', city: '', state: '', country: 'India', specializations: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const payload = { ...form, role, yearsOfExperience: form.yearsOfExperience ? parseInt(form.yearsOfExperience) : null };
      const data = await register(payload);
      if (data.success) {
        navigate(role === 'EXPERT' ? '/expert/dashboard' : '/traveler/dashboard');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange to-orange-dark rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-navy">Way<span className="text-orange">Rivo</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-navy">Create Your Account</h1>
          <p className="text-text-light mt-1">Join WayRivo as a traveler or travel expert</p>
        </div>

        <div className="card p-6 sm:p-8">
          {/* Role Toggle */}
          <div className="flex bg-bg rounded-xl p-1 mb-6">
            {(['TRAVELER', 'EXPERT'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${role === r ? 'bg-white shadow-sm text-navy' : 'text-text-light hover:text-text'}`}>
                {r === 'TRAVELER' ? '✈️ Traveler' : '🏢 Travel Expert'}
              </button>
            ))}
          </div>

          {error && <div className="bg-red-50 text-danger text-sm px-4 py-3 rounded-xl mb-4 border border-red-200">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={e => update('name', e.target.value)} required /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
            </div>
            <div><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={e => update('email', e.target.value)} required /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input pr-10" value={form.password} onChange={e => update('password', e.target.value)} required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div><label className="label">Confirm Password *</label><input type="password" className="input" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required /></div>
            </div>

            {role === 'EXPERT' && (
              <>
                <hr className="border-border" />
                <p className="text-sm font-semibold text-navy">Expert Details</p>
                <div><label className="label">Organization Name *</label><input className="input" value={form.organizationName} onChange={e => update('organizationName', e.target.value)} required /></div>
                <div><label className="label">Description</label><textarea className="input min-h-[80px]" value={form.description} onChange={e => update('description', e.target.value)} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><label className="label">Experience (years)</label><input type="number" className="input" value={form.yearsOfExperience} onChange={e => update('yearsOfExperience', e.target.value)} /></div>
                  <div><label className="label">City</label><input className="input" value={form.city} onChange={e => update('city', e.target.value)} /></div>
                  <div><label className="label">State</label><input className="input" value={form.state} onChange={e => update('state', e.target.value)} /></div>
                </div>
                <div><label className="label">Specializations (comma-separated)</label><input className="input" value={form.specializations} onChange={e => update('specializations', e.target.value)} placeholder="Kerala, Beach, Adventure" /></div>
              </>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : `Create ${role === 'EXPERT' ? 'Expert' : 'Traveler'} Account`}
            </button>
          </form>

          <p className="text-center text-sm text-text-light mt-5">
            Already have an account? <Link to="/login" className="text-orange font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

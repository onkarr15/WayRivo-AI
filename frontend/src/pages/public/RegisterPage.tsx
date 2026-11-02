import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  Bot,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'USER' | 'EXPERT'>('USER');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service & Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role,
      };

      const data = await register(payload);
      if (data.success) {
        navigate(role === 'EXPERT' ? '/expert/dashboard' : '/traveler/dashboard');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Registration failed. Please check your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Password strength check
  const getPasswordStrength = () => {
    const len = form.password.length;
    if (len === 0) return { label: '', color: 'bg-transparent', width: 'w-0' };
    if (len < 6) return { label: 'Weak', color: 'bg-rose-500', width: 'w-1/4' };
    if (len < 8) return { label: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
    if (/[A-Z]/.test(form.password) && /[0-9]/.test(form.password)) {
      return { label: 'Strong', color: 'bg-emerald-400', width: 'w-full' };
    }
    return { label: 'Good', color: 'bg-cyan-400', width: 'w-3/4' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-extrabold text-2xl text-white tracking-tight">
              WayRivo <span className="text-cyan-400">AI</span>
              <span className="text-[10px] ml-1.5 font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                2.0
              </span>
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1">
            Join the autonomous AI travel planning & escrow booking network
          </p>
        </div>

        {/* Registration Card */}
        <div className="card p-6 sm:p-8 border border-border/80 shadow-2xl backdrop-blur-xl">
          {/* Role Toggle Selector */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-dark border border-border mb-6">
            <button
              type="button"
              onClick={() => setRole('USER')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                role === 'USER'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" /> Traveler
            </button>
            <button
              type="button"
              onClick={() => setRole('EXPERT')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                role === 'EXPERT'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" /> Travel Specialist
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="e.g. Maya Sharma"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="maya@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-surface border border-border text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Password strength meter */}
            {form.password && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Password strength</span>
                  <span className="font-semibold text-white">{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-dark rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                </div>
              </div>
            )}

            {/* Terms checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-border bg-surface text-cyan-500 focus:ring-cyan-500"
                />
                <span>
                  I agree to WayRivo AI's{' '}
                  <span className="text-cyan-400 hover:underline">Terms of Service</span>,{' '}
                  <span className="text-cyan-400 hover:underline">Privacy Policy</span>, and PayPal Escrow dispute terms.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
            >
              Complete Registration
            </Button>
          </form>

          {/* Escrow badge */}
          <div className="mt-6 pt-5 border-t border-border/80 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Protected by WayRivo Escrow & 256-bit SSL encryption</span>
          </div>
        </div>

        {/* Existing account link */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
            Sign in here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;

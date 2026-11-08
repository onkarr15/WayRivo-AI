import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { WayRivoLogo } from '../../components/branding';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Return to previous route or default dashboard
  const from = (location.state as any)?.from?.pathname;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errParam = params.get('error');
    const emailParam = params.get('email');

    if (emailParam) {
      setEmail(emailParam);
    }

    if (errParam) {
      if (errParam === 'account_exists_with_password') {
        setError(
          'An account with this email address already exists with a password. Please sign in below using your password, or use Forgot Password to reset it.'
        );
      } else if (errParam === 'google_cancelled') {
        setError('Google authentication was cancelled.');
      } else {
        setError(decodeURIComponent(errParam).replace(/\+/g, ' '));
      }
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.success) {
        if (from) {
          navigate(from, { replace: true });
        } else {
          const role = data.data?.user?.role || data.role;
          const target =
            role === 'ADMIN'
              ? '/admin/dashboard'
              : role === 'EXPERT'
                ? '/expert/dashboard'
                : '/traveler/dashboard';
          navigate(target, { replace: true });
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-navy-dark flex">
      {/* Left Column: Cinematic Visual & Demo Quick-Login */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-dark overflow-hidden flex-col justify-between p-12 border-r border-border">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="z-10 w-fit">
          <WayRivoLogo
            variant="horizontal"
            size="lg"
            withVersion={true}
            href="/"
            glow={true}
          />
        </div>

        {/* Cinematic Headline & Copy */}
        <div className="max-w-md z-10 my-auto py-8">
          <Badge variant="cyan" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}>
            Intelligent Travel Ecosystem
          </Badge>
          <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight leading-tight">
            Step Into the Future of <span className="gradient-text">Autonomous Travel</span>.
          </h2>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            Access your AI-orchestrated itineraries, review specialist proposals, and complete verified bookings backed by PayPal Escrow security.
          </p>

          {/* Quick Demo Credentials Panel */}
          <div className="mt-8 p-5 rounded-2xl bg-surface/80 border border-cyan-500/20 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Demo Credentials (Click to Autofill)
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('arjun@example.com')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-dark border border-border hover:border-cyan-500/40 text-left transition-all group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    👤 Traveler Account
                  </p>
                  <p className="text-[11px] text-slate-400">arjun@example.com</p>
                </div>
                <Badge variant="cyan" size="sm">Select</Badge>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('vikram@example.com')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-dark border border-border hover:border-cyan-500/40 text-left transition-all group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    🏢 Travel Expert Agency
                  </p>
                  <p className="text-[11px] text-slate-400">vikram@example.com</p>
                </div>
                <Badge variant="cyan" size="sm">Select</Badge>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('admin@wayrivo.com')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-dark border border-border hover:border-gold-500/40 text-left transition-all group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    🔑 System Administrator
                  </p>
                  <p className="text-[11px] text-slate-400">admin@wayrivo.com</p>
                </div>
                <Badge variant="gold" size="sm">Admin</Badge>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 text-center mt-3">
              Default password: <code className="text-cyan-300">password123</code>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-xs text-slate-500 z-10">
          WayRivo AI 2.0 • PayPal Escrow Protected
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-center mb-6">
            <WayRivoLogo
              variant="horizontal"
              size="md"
              withVersion={true}
              href="/"
              glow={true}
            />
          </div>

          <div className="text-left mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-slate-400 text-sm mt-1.5">
              Enter your credentials to access your traveler dashboard
            </p>
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

          {/* Google Sign-In */}
          <div className="mb-5 space-y-4">
            <GoogleSignInButton role="TRAVELER" />

            {/* Separator */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-border w-full" />
              <span className="bg-navy-dark px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest shrink-0">
                OR CONTINUE WITH EMAIL
              </span>
              <div className="border-t border-border w-full" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="traveler@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
            >
              Sign In to WayRivo
            </Button>
          </form>

          {/* Registration link */}
          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;

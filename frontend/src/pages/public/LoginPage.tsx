import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, MapPin } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.success) {
        const path = data.role === 'ADMIN' ? '/admin/dashboard' : data.role === 'EXPERT' ? '/expert/dashboard' : '/traveler/dashboard';
        navigate(path);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy via-navy-light to-navy items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-orange to-orange-dark rounded-2xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">Way<span className="text-orange">Rivo</span></span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
          <p className="text-gray-300 text-lg leading-relaxed">Sign in to access your dashboard, manage your trips, and connect with travel experts.</p>
          <div className="mt-10 p-6 bg-white/10 backdrop-blur rounded-2xl">
            <p className="text-sm text-gray-300 mb-3 font-semibold">Demo Accounts:</p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>👤 Traveler: <code className="text-orange">arjun@example.com</code></p>
              <p>🏢 Expert: <code className="text-orange">vikram@example.com</code></p>
              <p>🔑 Admin: <code className="text-orange">admin@wayrivo.com</code></p>
              <p className="text-xs mt-2">Password for all: <code className="text-orange">password123</code></p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-orange to-orange-dark rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-navy">Way<span className="text-orange">Rivo</span></span>
          </div>

          <h1 className="text-2xl font-bold text-navy mb-1">Sign In</h1>
          <p className="text-text-light mb-8">Enter your credentials to continue</p>

          {error && <div className="bg-red-50 text-danger text-sm px-4 py-3 rounded-xl mb-6 border border-red-200">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-text-light mt-6">
            Don't have an account? <Link to="/register" className="text-orange font-semibold hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

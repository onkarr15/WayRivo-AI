import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bot, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const roleParam = searchParams.get('role');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      navigate(`/login?error=${encodeURIComponent(errorParam)}`, { replace: true });
      return;
    }

    if (!token) {
      setErrorMessage('Authentication token missing from Google callback. Please try again.');
      return;
    }

    const processSession = async () => {
      try {
        const user = await loginWithToken(token);
        const resolvedRole = user.role || roleParam;

        const target =
          resolvedRole === 'ADMIN'
            ? '/admin/dashboard'
            : resolvedRole === 'EXPERT'
            ? '/expert/dashboard'
            : '/traveler/dashboard';

        navigate(target, { replace: true });
      } catch (err: any) {
        setErrorMessage(
          err.response?.data?.error ||
            err.message ||
            'Failed to establish an authenticated session. Please try logging in again.'
        );
      }
    };

    processSession();
  }, [searchParams, navigate, loginWithToken]);

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 rounded-2xl bg-surface border border-border text-center shadow-2xl"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 mx-auto mb-5">
          <Bot className="w-6 h-6 text-white" />
        </div>

        {errorMessage ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 text-left">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Authenticating with Google...
            </h2>
            <p className="text-xs text-slate-400">
              Securing your session with 256-bit encryption. Redirecting to your dashboard...
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AuthCallbackPage;


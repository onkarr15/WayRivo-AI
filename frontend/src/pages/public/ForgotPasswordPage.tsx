import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../../services';
import { Bot, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      setSubmitted(true);
      if (res.data?.data?.resetToken) {
        setResetToken(res.data.data.resetToken);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Unable to process password reset request.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-extrabold text-2xl text-white tracking-tight">
              WayRivo <span className="text-cyan-400">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Recover your account</h1>
          <p className="text-slate-400 text-sm mt-1">
            We will send you a secure link to reset your password
          </p>
        </div>

        <div className="card p-6 sm:p-8 border border-border/80 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Check your inbox</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                If an account matches <strong className="text-cyan-300">{email}</strong>, we have dispatched instructions with a 60-minute reset link.
              </p>

              {/* Sandbox quick-link for developer testing */}
              {resetToken && (
                <div className="p-3.5 mb-6 rounded-xl bg-surface-dark border border-cyan-500/30 text-left">
                  <p className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-1">
                    ⚡ Sandbox Reset Link (Demo Only)
                  </p>
                  <p className="text-[11px] text-slate-400 break-all mb-2">
                    Token: <code className="text-white">{resetToken}</code>
                  </p>
                  <Link
                    to={`/reset-password?token=${resetToken}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
                  >
                    Proceed to Reset Password Page <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => setSubmitted(false)}
              >
                Send to a different email
              </Button>
            </motion.div>
          ) : (
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

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
              >
                Send Password Reset Link
              </Button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-border/80 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;

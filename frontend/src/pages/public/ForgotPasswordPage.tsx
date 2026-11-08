import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../../services';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { WayRivoLogo } from '../../components/branding';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [emailValidationError, setEmailValidationError] = useState('');

  const validateEmail = (val: string): boolean => {
    if (!val.trim()) {
      setEmailValidationError('Email address is required');
      return false;
    }
    if (!EMAIL_REGEX.test(val.trim())) {
      setEmailValidationError('Please enter a valid email address');
      return false;
    }
    setEmailValidationError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(email.trim());
      // Always show generic success confirmation to prevent email enumeration
      setSubmitted(true);
    } catch (err: any) {
      // In the rare event of network error or server disconnect
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Unable to process password reset request. Please check your network connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-3">
            <WayRivoLogo
              variant="horizontal"
              size="lg"
              withVersion={true}
              href="/"
              glow={true}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Forgot Password?</h1>
          <p className="text-slate-400 text-sm mt-2">
            Enter your registered email address to receive a password reset link.
          </p>
        </div>

        <div className="card p-6 sm:p-8 border border-border/80 shadow-2xl backdrop-blur-xl bg-surface/90">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs leading-relaxed"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Check Your Inbox</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                If an account exists with this email address, you will receive password reset instructions shortly.
              </p>
              <div className="p-3.5 mb-6 rounded-xl bg-surface-dark/80 border border-border text-left">
                <p className="text-xs text-slate-400 leading-relaxed">
                  💡 <strong>Security Notice:</strong> The link will expire in 15 minutes. Check your spam folder if you do not see the email in your main inbox.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                >
                  Send to a different email
                </Button>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full text-xs font-semibold text-slate-400 hover:text-white transition-colors py-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return to sign in
                </Link>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="reset-email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailValidationError) validateEmail(e.target.value);
                    }}
                    onBlur={() => validateEmail(email)}
                    placeholder="traveler@example.com"
                    aria-invalid={!!emailValidationError}
                    aria-describedby={emailValidationError ? 'email-error' : undefined}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-surface border text-white placeholder-slate-500 text-sm focus:outline-none transition-all ${
                      emailValidationError
                        ? 'border-rose-500/80 focus:border-rose-400 focus:ring-1 focus:ring-rose-400'
                        : 'border-border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                    }`}
                  />
                </div>
                {emailValidationError && (
                  <p id="email-error" className="text-xs text-rose-400 mt-1.5">
                    {emailValidationError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
              >
                Send Reset Link
              </Button>
            </form>
          )}

          {!submitted && (
            <div className="mt-6 pt-5 border-t border-border/80 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors focus:outline-none focus:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to sign in
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;

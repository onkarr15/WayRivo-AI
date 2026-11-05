import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../../services';
import {
  Bot,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

// Password strength evaluator
interface PasswordStrength {
  score: number; // 0 to 4
  label: string;
  color: string;
  bgColor: string;
}

const evaluatePasswordStrength = (pass: string): PasswordStrength => {
  if (!pass) {
    return { score: 0, label: 'Too short', color: 'text-slate-400', bgColor: 'bg-slate-700' };
  }
  if (pass.length < 12) {
    return { score: 1, label: 'Weak (min 12 chars required)', color: 'text-rose-400', bgColor: 'bg-rose-500' };
  }

  let score = 2; // Base score for meeting 12+ chars
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
  if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;
  if (pass.length >= 16) score = 4;

  switch (score) {
    case 2:
      return { score: 2, label: 'Fair (12+ characters)', color: 'text-amber-400', bgColor: 'bg-amber-500' };
    case 3:
      return { score: 3, label: 'Good', color: 'text-cyan-400', bgColor: 'bg-cyan-500' };
    case 4:
    default:
      return { score: 4, label: 'Strong passphrase', color: 'text-emerald-400', bgColor: 'bg-emerald-500' };
  }
};

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Safely capture token from URL and store in memory only
  const [token, setToken] = useState<string>('');
  const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(true);
  const [tokenError, setTokenError] = useState<string>('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // 1. Initial verification & URL sanitization
  useEffect(() => {
    // Set no-referrer meta policy to prevent token leakage in HTTP headers
    let meta = document.querySelector('meta[name="referrer"]') as HTMLMetaElement | null;
    let created = false;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'referrer';
      meta.content = 'no-referrer';
      document.head.appendChild(meta);
      created = true;
    }

    const tokenFromUrl = searchParams.get('token');

    if (!tokenFromUrl || !tokenFromUrl.trim()) {
      setIsVerifyingToken(false);
      setTokenError('No password reset token was provided. Please use the link sent to your email address.');
      return () => {
        if (created && meta && meta.parentNode) meta.parentNode.removeChild(meta);
      };
    }

    const cleanToken = tokenFromUrl.trim();
    setToken(cleanToken);

    // Sanitize browser address bar to remove the raw token from history/referer
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {
      // Ignore in environments where history rewrite is restricted
    }

    // Backend token verification
    authService
      .verifyResetToken(cleanToken)
      .then(() => {
        setIsVerifyingToken(false);
        setTokenError('');
      })
      .catch((err: any) => {
        setIsVerifyingToken(false);
        setTokenError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            'This password reset link is invalid or has expired. Please request a new link.'
        );
      });

    return () => {
      if (created && meta && meta.parentNode) meta.parentNode.removeChild(meta);
    };
  }, [searchParams]);

  const strength = evaluatePasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!token) {
      setFormError('Security token is missing. Please request a new password reset link.');
      return;
    }

    if (newPassword.length < 12) {
      setFormError('Password must be at least 12 characters long according to security standards.');
      return;
    }

    if (newPassword.length > 128) {
      setFormError('Password cannot exceed 128 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('The confirmation password does not match. Please re-enter your new password.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.resetPassword({ token, newPassword });
      if (res.data?.success) {
        setSuccess(true);
        // Clear sensitive fields from state immediately
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setFormError(res.data?.message || 'Failed to reset password. Please try again.');
      }
    } catch (err: any) {
      setFormError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to reset password. The reset link may have expired or was already used.'
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
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded-xl p-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-extrabold text-2xl text-white tracking-tight">
              WayRivo <span className="text-cyan-400">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Set New Password</h1>
          <p className="text-slate-400 text-sm mt-2">
            Establish a secure password of at least 12 characters
          </p>
        </div>

        <div className="card p-6 sm:p-8 border border-border/80 shadow-2xl backdrop-blur-xl bg-surface/90">
          {/* State 1: Verifying Token on Backend */}
          {isVerifyingToken && (
            <div className="text-center py-10">
              <Loader2 className="w-9 h-9 text-cyan-400 animate-spin mx-auto mb-4" />
              <h3 className="text-base font-bold text-white mb-1">Verifying Reset Link</h3>
              <p className="text-xs text-slate-400">Checking security token validity...</p>
            </div>
          )}

          {/* State 2: Invalid or Expired Token Error Screen */}
          {!isVerifyingToken && tokenError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400 shadow-lg shadow-rose-500/10">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Reset Link Expired or Invalid</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                {tokenError}
              </p>
              <div className="space-y-3">
                <Link to="/forgot-password" className="block">
                  <Button variant="primary" size="lg" fullWidth rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}>
                    Request a New Reset Link
                  </Button>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full text-xs font-semibold text-slate-400 hover:text-white transition-colors py-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return to sign in
                </Link>
              </div>
            </motion.div>
          )}

          {/* State 3: Password Reset Successful */}
          {!isVerifyingToken && !tokenError && success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Password Reset Complete!</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                Your password has been securely updated. Any existing active sessions have been revoked. You can now log into your WayRivo AI account with your new credentials.
              </p>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/login', { replace: true })}
                rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
              >
                Sign In with New Password
              </Button>
            </motion.div>
          )}

          {/* State 4: Valid Token, Present Reset Form */}
          {!isVerifyingToken && !tokenError && !success && (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {formError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs leading-relaxed"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </motion.div>
              )}

              {/* New Password Input */}
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    maxLength={128}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 12 characters"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-surface border border-border text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none focus:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword.length > 0 && (
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-slate-400">Strength:</span>
                      <span className={`text-[11px] font-bold ${strength.color}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-dark rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 h-full rounded-full transition-all duration-300 ${
                            step <= strength.score ? strength.bgColor : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-surface border border-border text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none focus:text-white cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-rose-400 mt-1.5">
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Passwords match
                  </p>
                )}
              </div>

              {/* Security Hint */}
              <div className="p-3 rounded-xl bg-surface-dark/70 border border-border/80">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  🔒 <strong>Security Policy:</strong> Minimum 12 characters. For maximum security, use a memorable multi-word passphrase.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={loading}
                disabled={newPassword.length < 12 || newPassword !== confirmPassword}
                rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
              >
                Submit New Password
              </Button>

              <div className="mt-4 pt-4 border-t border-border/80 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Cancel and return to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;

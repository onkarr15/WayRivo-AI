import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Lock, Trash2, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services';
import { useToast } from '../ui/Toast';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountType?: 'traveler' | 'expert';
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  accountType = 'traveler',
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isExpert = accountType === 'expert' || user?.role === 'EXPERT';

  const modalDescription = isExpert
    ? 'Are you sure you want to delete your Travel Expert Agency account? Deleting the account may permanently remove your access to the WayRivo Expert platform and affect your active services.'
    : 'Are you sure you want to delete your WayRivo account? This action may permanently remove your account access and personal profile information. Please review any active bookings or pending payments before proceeding.';

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmationText('');
    setPassword('');
    setReason('');
    setErrorMessage(null);
    onClose();
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (confirmationText.trim().toUpperCase() !== 'DELETE') {
      setErrorMessage("Please type 'DELETE' in all capital letters to confirm.");
      return;
    }

    setIsDeleting(true);

    try {
      const res = await authService.deleteAccount({
        confirmation: confirmationText.trim(),
        password: password || undefined,
        reason: reason || undefined,
      });

      if (res.data?.success) {
        toast.success('Your WayRivo account has been successfully deleted.');
        // Clear local storage and log out
        await logout();
        handleClose();
        navigate('/', { replace: true });
      } else {
        setErrorMessage(res.data?.message || 'Unable to delete account.');
      }
    } catch (err: any) {
      console.error('Account deletion error:', err);
      const backendError =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Unable to process account deletion. Please check for active bookings or pending transactions.';
      setErrorMessage(backendError);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Delete Account</h2>
              <span className="text-[11px] text-slate-400">
                {isExpert ? 'Travel Expert Agency Account' : 'Traveller Account'}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed">
          {modalDescription}
        </p>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-200">Deletion Blocked or Failed</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleDelete} className="space-y-4 text-xs">
          {/* Password reauthentication */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Reauthenticate Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter current password to reauthenticate"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 transition-colors"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Required for security verification before permanent deletion.
            </span>
          </div>

          {/* Reason (Optional) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Reason for Leaving (Optional)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us why you are deleting your account..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Explicit Confirmation Input */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <label className="block text-[11px] font-bold text-slate-300">
              Type <span className="font-mono text-rose-400 font-black">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              required
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-rose-300 font-mono text-xs font-bold tracking-widest uppercase focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Notice on Financial Retention */}
          <div className="flex items-start gap-2 text-[10px] text-slate-400 pt-1">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <p>
              In accordance with legal and financial accounting requirements, past completed payment records and receipts will be anonymized and archived for audit integrity.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeleting || confirmationText.trim().toUpperCase() !== 'DELETE'}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-900/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deleting Account...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteAccountModal;


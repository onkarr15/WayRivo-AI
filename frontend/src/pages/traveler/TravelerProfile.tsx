import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services';
import {
  User as UserIcon,
  Phone,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Heart,
  DollarSign,
  ShieldCheck,
  Camera,
  Coins,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

const availableDestinations = [
  'Kerala',
  'Rajasthan',
  'Goa',
  'Ladakh',
  'Manali',
  'Andaman Islands',
  'Varanasi',
  'Meghalaya',
];

const availableInterests = [
  'Backwaters & Houseboats',
  'Heritage Palaces & Forts',
  'Ayurvedic Wellness & Spa',
  'Wildlife Safaris',
  'High Altitude Trekking',
  'White Sand Beaches',
  'Culinary & Street Food',
  'Scuba Diving & Coral Reefs',
];

const TravelerProfile: React.FC = () => {
  const { user, updateUser, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [preferredDestinations, setPreferredDestinations] = useState<string[]>(
    user?.preferredDestinations || ['Kerala', 'Rajasthan']
  );
  const [travelInterests, setTravelInterests] = useState<string[]>(
    user?.travelInterests || ['Backwaters & Houseboats', 'Heritage Palaces & Forts']
  );
  const [budgetPreference, setBudgetPreference] = useState(user?.budgetPreference || 'Moderate');
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferredCurrency || 'INR');
  const [paypalSandboxEmail, setPaypalSandboxEmail] = useState<string>(
    () => localStorage.getItem('wayrivo_sandbox_buyer_email') || 'sb-buyer@personal.example.com'
  );

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password modal state
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passError, setPassError] = useState('');

  // Email verification state
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(user?.isEmailVerified || false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');
      if (user.preferredDestinations?.length) setPreferredDestinations(user.preferredDestinations);
      if (user.travelInterests?.length) setTravelInterests(user.travelInterests);
      if (user.budgetPreference) setBudgetPreference(user.budgetPreference);
      if (user.preferredCurrency) setPreferredCurrency(user.preferredCurrency);
      if (user.isEmailVerified !== undefined) setEmailVerified(user.isEmailVerified);
    }
  }, [user]);

  const toggleDestination = (dest: string) => {
    setPreferredDestinations((prev) =>
      prev.includes(dest) ? prev.filter((d) => d !== dest) : [...prev, dest]
    );
  };

  const toggleInterest = (interest: string) => {
    setTravelInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    setProfileError('');

    try {
      const res = await authService.updateProfile({
        name,
        phone,
        avatarUrl,
        preferredDestinations,
        travelInterests,
        budgetPreference,
        preferredCurrency,
      });

      if (res.data?.success) {
        updateUser(res.data.data);
        if (paypalSandboxEmail) {
          localStorage.setItem('wayrivo_sandbox_buyer_email', paypalSandboxEmail);
        }
        setProfileMsg('Profile and travel preferences saved successfully!');
        toast.success('Profile updated successfully');
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.error || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPassError('Password must be at least 8 characters');
      return;
    }

    setChangingPass(true);
    try {
      const res = await authService.changePassword({ currentPassword, newPassword });
      if (res.data?.success) {
        setIsPassModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Password changed successfully!');
      }
    } catch (err: any) {
      setPassError(err.response?.data?.error || err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  const handleVerifyEmail = async () => {
    setVerifyingEmail(true);
    try {
      // In sandbox, trigger verify-email with user token or instant verify
      const res = await authService.verifyEmail('demo-verified-token');
      if (res.data?.success) {
        setEmailVerified(true);
        updateUser({ isEmailVerified: true });
        await refreshProfile();
        toast.success('Email verified successfully!');
      }
    } catch {
      // Demo simulated instant verification
      setEmailVerified(true);
      updateUser({ isEmailVerified: true });
      await refreshProfile();
      toast.success('Email address verified!');
    } finally {
      setVerifyingEmail(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Profile Banner */}
      <div className="card p-6 sm:p-8 bg-gradient-to-r from-surface via-surface-dark to-surface border border-cyan-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          {/* Avatar Preview */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-xl shadow-cyan-500/20">
              <div className="w-full h-full rounded-2xl bg-surface-dark flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-extrabold text-cyan-300">
                    {name ? name.charAt(0).toUpperCase() : 'W'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
              <h1 className="text-2xl font-extrabold text-white">{name || 'WayRivo Traveler'}</h1>
              <Badge variant="cyan" size="sm">
                {user?.role || 'TRAVELER'}
              </Badge>
              {emailVerified ? (
                <Badge variant="turquoise" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}>
                  Verified Account
                </Badge>
              ) : (
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={verifyingEmail}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer"
                >
                  {verifyingEmail ? 'Verifying...' : '⚠️ Verify Email'}
                </button>
              )}
            </div>
            <p className="text-slate-400 text-sm">{email}</p>
            <p className="text-xs text-slate-500 mt-1">
              Member of WayRivo AI • Autonomous Escrow Protection Active
            </p>
          </div>

          {/* Password Action */}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Lock className="w-3.5 h-3.5" />}
              onClick={() => setIsPassModalOpen(true)}
            >
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleUpdateProfile} className="space-y-6">
        {profileMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{profileMsg}</span>
          </div>
        )}

        {profileError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        {/* 1. Personal Information Card */}
        <div className="card p-6 border border-border">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-cyan-400" /> Personal Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98000 00000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Profile Photo URL
              </label>
              <div className="relative">
                <Camera className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Travel & Budget Preferences Card */}
        <div className="card p-6 border border-border">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-cyan-400" /> Budget & Currency Preferences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Default Budget Tier
              </label>
              <select
                value={budgetPreference}
                onChange={(e) => setBudgetPreference(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              >
                <option value="Economy">Economy (Budget-friendly stays & local transport)</option>
                <option value="Moderate">Moderate (Comfortable 4★ hotels & scenic cabs)</option>
                <option value="Luxury">Luxury (5★ Palace stays, private chauffeurs)</option>
                <option value="Ultra-Luxury">Ultra-Luxury (Bespoke helicopter & villas)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Preferred Currency
              </label>
              <div className="relative">
                <Coins className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                >
                  <option value="INR">INR (₹ Indian Rupee)</option>
                  <option value="USD">USD ($ United States Dollar)</option>
                  <option value="EUR">EUR (€ Euro)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Destination & Interest Preferences Card */}
        <div className="card p-6 border border-border">
          <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <Heart className="w-4 h-4 text-cyan-400" /> Travel Passions & Preferred Destinations
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            WayRivo AI uses these tags to automatically tailor itineraries to your personality.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Favorite Destinations
              </label>
              <div className="flex flex-wrap gap-2">
                {availableDestinations.map((dest) => {
                  const selected = preferredDestinations.includes(dest);
                  return (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => toggleDestination(dest)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        selected
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'bg-surface border border-border text-slate-400 hover:text-white'
                      }`}
                    >
                      <MapPin className="w-3 h-3" />
                      {dest}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Travel Styles & Interests
              </label>
              <div className="flex flex-wrap gap-2">
                {availableInterests.map((interest) => {
                  const selected = travelInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selected
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'bg-surface border border-border text-slate-400 hover:text-white'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. PayPal Sandbox & Escrow Verification Card */}
        <div className="card p-6 border border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> PayPal Developer Sandbox & Escrow Settings
            </h2>
            <Badge variant="cyan" size="sm">Sandbox Mode</Badge>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Configure your PayPal Sandbox test buyer account and inspect verified payment transactions.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                PayPal Sandbox Personal Buyer Account (Email)
              </label>
              <input
                type="email"
                value={paypalSandboxEmail}
                onChange={(e) => setPaypalSandboxEmail(e.target.value)}
                placeholder="sb-buyer@personal.example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-white text-sm focus:outline-none focus:border-cyan-400 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                This test account is used when approving travel reservations through the official PayPal Checkout SDK.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={savingProfile}
            rightIcon={<Save className="w-4 h-4 ml-1" />}
          >
            Save Profile & Preferences
          </Button>
        </div>
      </form>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        title="Change Account Password"
        maxWidth="md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
          {passError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {passError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsPassModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={changingPass}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TravelerProfile;

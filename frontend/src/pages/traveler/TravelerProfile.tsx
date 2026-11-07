import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services';
import {
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Heart,
  ShieldCheck,
  Camera,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { DeleteAccountModal } from '../../components/account/DeleteAccountModal';

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
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: View vs Edit
  const [isEditing, setIsEditing] = useState<boolean>(() => searchParams.get('edit') === 'true');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [country, setCountry] = useState(user?.country || 'India');
  const [state, setState] = useState(user?.state || '');
  const [city, setCity] = useState(user?.city || '');
  const [address, setAddress] = useState(user?.address || '');
  const [postalCode, setPostalCode] = useState(user?.postalCode || '');
  const [bio, setBio] = useState(user?.bio || '');

  // Travel Preferences
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

  // Synchronize state with current user
  const resetFormValues = () => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');
      setDateOfBirth(user.dateOfBirth || '');
      setGender(user.gender || '');
      setCountry(user.country || 'India');
      setState(user.state || '');
      setCity(user.city || '');
      setAddress(user.address || '');
      setPostalCode(user.postalCode || '');
      setBio(user.bio || '');
      if (user.preferredDestinations?.length) setPreferredDestinations(user.preferredDestinations);
      if (user.travelInterests?.length) setTravelInterests(user.travelInterests);
      if (user.budgetPreference) setBudgetPreference(user.budgetPreference);
      if (user.preferredCurrency) setPreferredCurrency(user.preferredCurrency);
    }
  };

  useEffect(() => {
    resetFormValues();
  }, [user]);

  const handleCancelEdit = () => {
    resetFormValues();
    setIsEditing(false);
    setProfileError('');
    setSearchParams({});
  };

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
        email: email !== user?.email ? email : undefined,
        phone,
        avatarUrl,
        dateOfBirth,
        gender,
        country,
        state,
        city,
        address,
        postalCode,
        bio,
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
        setProfileMsg('Profile and preferences updated successfully!');
        toast.success('Profile updated successfully');
        setIsEditing(false);
        setSearchParams({});
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.error || err.response?.data?.message || 'Failed to update profile');
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
        toast.success('Password updated successfully');
        setIsPassModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPassError(err.response?.data?.error || 'Failed to update password');
      toast.error('Failed to update password');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Traveller Profile</h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage your personal identity, travel preferences, and account configuration.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isEditing ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsEditing(true)}
              leftIcon={<Edit3 className="w-3.5 h-3.5 mr-1" />}
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              leftIcon={<X className="w-3.5 h-3.5 mr-1" />}
            >
              Cancel Editing
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsPassModalOpen(true)}
            leftIcon={<Lock className="w-3.5 h-3.5 mr-1" />}
          >
            Change Password
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {profileMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{profileMsg}</span>
        </div>
      )}

      {profileError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{profileError}</span>
        </div>
      )}

      {/* Profile Overview Banner */}
      <div className="card p-6 border border-border flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/30 text-cyan-400 font-extrabold flex items-center justify-center text-3xl shadow-lg overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase() || 'T'
            )}
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                const url = prompt('Enter image URL for your profile picture:', avatarUrl);
                if (url !== null) setAvatarUrl(url);
              }}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md cursor-pointer"
              title="Change avatar image URL"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-xl font-bold text-white">{name || 'Traveller'}</h2>
            <Badge variant="cyan" size="sm">
              {user?.role || 'TRAVELER'}
            </Badge>
            {user?.isEmailVerified ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Email
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Email Pending
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            {email}
            {phone && (
              <>
                <span>•</span>
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                {phone}
              </>
            )}
          </p>

          <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            {[city, state, country].filter(Boolean).join(', ') || 'India'}
          </p>

          {bio && <p className="text-xs text-slate-300 italic pt-1 max-w-xl">{bio}</p>}
        </div>
      </div>

      {/* VIEW OR EDIT PROFILE FORM */}
      {isEditing ? (
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* 1. PERSONAL INFORMATION */}
          <div className="card p-6 border border-border space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-cyan-400" /> Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Changing your email address requires re-verification.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Bio / About Me
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a short bio about your travel style and background..."
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* 2. ADDRESS INFORMATION */}
          <div className="card p-6 border border-border space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" /> Address Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 104 Marine Drive, Apartment 4B"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  State / Province
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="India"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Postal / ZIP Code
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 400020"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* 3. TRAVEL PREFERENCES & AI INTELLIGENCE */}
          <div className="card p-6 border border-border space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4 text-cyan-400" /> Travel Preferences
            </h3>

            {/* Destinations */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Preferred Destinations
              </label>
              <div className="flex flex-wrap gap-2">
                {availableDestinations.map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => toggleDestination(dest)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      preferredDestinations.includes(dest)
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm'
                        : 'bg-surface border-border text-slate-400 hover:text-white'
                    }`}
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Travel Styles & Interests
              </label>
              <div className="flex flex-wrap gap-2">
                {availableInterests.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      travelInterests.includes(interest)
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm'
                        : 'bg-surface border-border text-slate-400 hover:text-white'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Budget Style
                </label>
                <select
                  value={budgetPreference}
                  onChange={(e) => setBudgetPreference(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="Budget">Budget Backpacking</option>
                  <option value="Moderate">Moderate Comfort</option>
                  <option value="Luxury">Luxury Premium</option>
                  <option value="Ultra-Luxury">Ultra Luxury Royal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Preferred Currency
                </label>
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  PayPal Developer Sandbox Test Email
                </label>
                <input
                  type="email"
                  value={paypalSandboxEmail}
                  onChange={(e) => setPaypalSandboxEmail(e.target.value)}
                  placeholder="sb-buyer@personal.example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Form Actions: Save Changes and Cancel */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleCancelEdit}
              disabled={savingProfile}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={savingProfile}
              leftIcon={<Save className="w-4 h-4 mr-1" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      ) : (
        /* VIEW MODE: Clean summary cards */
        <div className="space-y-6">
          {/* Personal & Address Details Card */}
          <div className="card p-6 border border-border space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-cyan-400" /> Personal & Address Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">Full Name</span>
                <span className="text-white font-bold text-sm mt-0.5 block">{name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">Email Address</span>
                <span className="text-white font-mono text-xs mt-0.5 block">{email}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">Phone Number</span>
                <span className="text-white font-mono text-xs mt-0.5 block">{phone || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">Date of Birth</span>
                <span className="text-white text-xs mt-0.5 block">{dateOfBirth || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">Gender</span>
                <span className="text-white text-xs mt-0.5 block">{gender || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">Street Address</span>
                <span className="text-white text-xs mt-0.5 block">{address || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">City & State</span>
                <span className="text-white text-xs mt-0.5 block">
                  {[city, state].filter(Boolean).join(', ') || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">Country</span>
                <span className="text-white text-xs mt-0.5 block">{country || 'India'}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">Postal Code</span>
                <span className="text-white text-xs mt-0.5 block">{postalCode || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Travel Preferences Summary */}
          <div className="card p-6 border border-border space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4 text-cyan-400" /> Travel Preferences
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-1.5">
                  Preferred Destinations
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {preferredDestinations.map((d) => (
                    <span
                      key={d}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-border text-cyan-300 text-xs font-semibold"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-1.5">
                  Interests & Travel Styles
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {travelInterests.map((i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-border text-slate-300 text-xs"
                    >
                      {i}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Budget Style</span>
                  <span className="text-white font-bold">{budgetPreference}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Preferred Currency</span>
                  <span className="text-white font-bold">{preferredCurrency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT MANAGEMENT SECTION (NO "Danger Zone" heading) */}
      <div className="card p-6 border border-border space-y-5">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Account Management</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your personal profile information or request permanent account deletion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option 1: Edit Profile */}
          <div className="p-4 rounded-xl bg-surface-dark border border-border flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" /> Edit Profile
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Update your personal and account information.
              </p>
            </div>
            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Option 2: Delete Account (Exact label "Delete Account", NO Danger Zone) */}
          <div className="p-4 rounded-xl bg-surface-dark border border-border flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" /> Delete Account
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Request permanent deletion of your WayRivo account and associated eligible personal information.
              </p>
            </div>
            <div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        accountType="traveler"
      />

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

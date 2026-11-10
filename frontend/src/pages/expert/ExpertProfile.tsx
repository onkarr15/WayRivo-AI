import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { expertService } from '../../services';
import {
  Building,
  ShieldCheck,
  Award,
  CheckCircle2,
  Save,
  Star,
  Edit3,
  Trash2,
  X,
  Languages,
  AlertCircle,
  Camera,
  Upload,
  Laptop,
  Smartphone,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { DeleteAccountModal } from '../../components/account/DeleteAccountModal';

const ExpertProfile: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Mode: View vs Edit
  const [isEditing, setIsEditing] = useState<boolean>(() => searchParams.get('edit') === 'true');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Device Library Photo Upload State (Laptop / Mobile / Phone)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [uploadSource, setUploadSource] = useState<string>('');

  const [form, setForm] = useState({
    organizationName: '',
    agencyName: '',
    expertName: '',
    avatarUrl: user?.avatarUrl || '',
    email: '',
    phone: '',
    websiteUrl: '',
    description: '',
    bio: '',
    yearsOfExperience: 0,
    city: '',
    state: '',
    country: 'India',
    address: '',
    postalCode: '',
    specializations: '',
    languages: 'English, Hindi',
    verificationStatus: 'VERIFIED',
  });

  const processSelectedFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Image file exceeds 15MB size limit.');
      return;
    }

    setIsProcessingImage(true);

    const reader = new FileReader();
    reader.onerror = () => {
      setIsProcessingImage(false);
      toast.error('Failed to read image from device.');
    };

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        setIsProcessingImage(false);
        return;
      }

      // Resize and compress via HTML5 Canvas to max 512px
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 512;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL('image/jpeg', 0.88);
            setForm((prev) => ({ ...prev, avatarUrl: optimized }));
            setUploadSource(file.name);
            toast.success(`Photo selected from device (${file.name})! Click Save Profile to apply.`);
          } else {
            setForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
            setUploadSource(file.name);
          }
        } catch {
          setForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
          setUploadSource(file.name);
        } finally {
          setIsProcessingImage(false);
        }
      };

      img.onerror = () => {
        setIsProcessingImage(false);
        toast.error('Failed to parse image from device.');
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
    e.target.value = '';
  };

  const fetchProfile = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await expertService.getProfile();
      const data = res.data?.data;
      if (data) {
        setProfile(data);
        setForm({
          organizationName: data.organizationName || data.agencyName || user?.agencyName || user?.name || '',
          agencyName: data.agencyName || data.organizationName || user?.agencyName || '',
          expertName: data.name || user?.name || '',
          avatarUrl: data.avatarUrl || user?.avatarUrl || '',
          email: data.email || user?.email || '',
          phone: data.phone || user?.phone || '',
          websiteUrl: data.websiteUrl || user?.websiteUrl || '',
          description: data.description || user?.bio || '',
          bio: data.bio || data.description || user?.bio || '',
          yearsOfExperience: data.yearsOfExperience ?? user?.yearsOfExperience ?? 8,
          city: data.city || user?.city || 'Manali',
          state: data.state || user?.state || 'Himachal Pradesh',
          country: data.country || user?.country || 'India',
          address: data.address || user?.address || '',
          postalCode: data.postalCode || user?.postalCode || '',
          specializations: data.specializations || user?.specializations || 'Himachal, Ladakh, Trekking, Luxury Resorts',
          languages: Array.isArray(data.languages) ? data.languages.join(', ') : 'English, Hindi',
          verificationStatus: data.verificationStatus || user?.verificationStatus || 'VERIFIED',
        });
      }
    } catch {
      // Fallback data
      setProfile({
        organizationName: user?.agencyName || 'Himalayan Journeys & Expeditions',
        name: user?.name || 'Vikram Singh Rathore',
        description: 'Over 8 years crafting authentic Himalayan treks, cultural immersion tours in Himachal and Ladakh, and luxury resort stays.',
        yearsOfExperience: 8,
        city: 'Manali',
        state: 'Himachal Pradesh',
        country: 'India',
        specializations: 'Himachal, Ladakh, Trekking, Honeymoon, Luxury Resorts',
        verificationStatus: 'VERIFIED',
        rating: 4.9,
        totalReviews: 24,
      });
      setForm({
        organizationName: user?.agencyName || 'Himalayan Journeys & Expeditions',
        agencyName: user?.agencyName || 'Himalayan Journeys & Expeditions',
        expertName: user?.name || 'Vikram Singh Rathore',
        avatarUrl: user?.avatarUrl || '',
        email: user?.email || 'expert@wayrivo.com',
        phone: user?.phone || '+91 98765 43210',
        websiteUrl: user?.websiteUrl || 'https://himalayan-expeditions.example.com',
        description: 'Over 8 years crafting authentic Himalayan treks, cultural immersion tours in Himachal and Ladakh, and luxury resort stays.',
        bio: 'Certified mountain expedition leader and cultural curator with 8+ years guiding high-altitude journeys.',
        yearsOfExperience: 8,
        city: 'Manali',
        state: 'Himachal Pradesh',
        country: 'India',
        address: 'Mall Road, Near Circuit House',
        postalCode: '175131',
        specializations: 'Himachal, Ladakh, Trekking, Honeymoon, Luxury Resorts',
        languages: 'English, Hindi, Pahari',
        verificationStatus: 'VERIFIED',
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setMsg('');
    fetchProfile();
    setSearchParams({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');

    try {
      const payload = {
        name: form.expertName,
        organizationName: form.organizationName,
        agencyName: form.organizationName,
        avatarUrl: form.avatarUrl,
        phone: form.phone,
        email: form.email !== user?.email ? form.email : undefined,
        websiteUrl: form.websiteUrl,
        bio: form.description || form.bio,
        description: form.description,
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
        city: form.city,
        state: form.state,
        country: form.country,
        address: form.address,
        postalCode: form.postalCode,
        specializations: form.specializations,
        languages: form.languages.split(',').map((l) => l.trim()).filter(Boolean),
      };

      await expertService.updateProfile(payload);
      setMsg('Expert Agency profile updated successfully!');
      setIsEditing(false);
      setSearchParams({});
      await refreshProfile();
      await fetchProfile();
    } catch (err: any) {
      console.error('Expert profile update error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update agency profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Expert Agency Profile</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your agency credentials, expert coverage regions, and verified badges.
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
              onClick={handleCancel}
              leftIcon={<X className="w-3.5 h-3.5 mr-1" />}
            >
              Cancel Editing
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Verification Status & Rating Card */}
        <div className="card p-6 space-y-5 text-center flex flex-col justify-center items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-cyan-500/15 text-cyan-300 font-extrabold flex items-center justify-center text-3xl shadow-lg border-2 border-cyan-400/40 overflow-hidden shrink-0">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt={form.organizationName || 'Agency'} className="w-full h-full object-cover" />
              ) : (
                form.organizationName?.charAt(0) || user?.name?.charAt(0) || 'E'
              )}
            </div>

            {/* Hidden device input for laptop & mobile library */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              aria-label="Upload agency profile photo from device library"
            />

            <button
              type="button"
              onClick={() => {
                if (!isEditing) {
                  setIsEditing(true);
                  setTimeout(() => fileInputRef.current?.click(), 80);
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 hover:brightness-110 shadow-lg cursor-pointer transition-all border border-cyan-300/40"
              title="Upload agency photo from device library (Laptop / Phone)"
            >
              <Camera className="w-4 h-4 text-slate-950" />
            </button>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">{form.organizationName || user?.name}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{form.email || user?.email}</p>
          </div>

          <div className="w-full pt-4 border-t border-border space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Verification</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                form.verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {form.verificationStatus === 'VERIFIED' && <ShieldCheck className="w-3 h-3 mr-1" />}
                {form.verificationStatus}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Rating</span>
              <span className="font-bold text-white flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {profile?.rating || '4.9'} ({profile?.totalReviews || 24} reviews)
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Experience</span>
              <span className="font-bold text-white">{form.yearsOfExperience} Years</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Location</span>
              <span className="text-slate-200">{[form.city, form.state].filter(Boolean).join(', ') || 'India'}</span>
            </div>
          </div>
        </div>

        {/* Profile Details (View or Edit) */}
        <div className="md:col-span-2">
          {isEditing ? (
            /* EDIT FORM */
            <div className="card p-6 space-y-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-cyan-400" /> Edit Agency & Expert Information
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* 1. Agency Information */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Agency / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.organizationName}
                    onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Agency Profile Photo Device Upload */}
                <div className="p-4 rounded-2xl bg-surface border border-border/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-cyan-400" /> Agency Profile Picture / Brand Logo
                    </label>
                    <span className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span className="flex items-center gap-1"><Laptop className="w-3 h-3 text-cyan-400" /> Laptop</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1"><Smartphone className="w-3 h-3 text-cyan-400" /> Phone Library</span>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-md">
                      {form.avatarUrl ? (
                        <img src={form.avatarUrl} alt="Agency preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-black text-cyan-400">
                          {form.organizationName ? form.organizationName.charAt(0).toUpperCase() : 'E'}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isProcessingImage}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-500/20"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isProcessingImage ? 'Optimizing photo...' : 'Upload Photo from Device'}</span>
                        </button>

                        {form.avatarUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, avatarUrl: '' }));
                              setUploadSource('');
                              toast.info('Agency profile photo removed.');
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className="text-[11px] text-slate-400 hover:text-cyan-300 underline cursor-pointer ml-1"
                        >
                          {showUrlInput ? 'Hide URL input' : 'Or paste image URL'}
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {uploadSource ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Selected from device: {uploadSource}
                          </span>
                        ) : (
                          'Upload agency photo, company logo, or specialist portrait from phone gallery, camera, or laptop files (JPG, PNG, WebP up to 15MB).'
                        )}
                      </p>

                      {showUrlInput && (
                        <div className="pt-2">
                          <input
                            type="url"
                            value={form.avatarUrl}
                            onChange={(e) => {
                              setForm({ ...form, avatarUrl: e.target.value });
                              setUploadSource('');
                            }}
                            placeholder="https://example.com/logo.jpg"
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Expert Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.expertName}
                      onChange={(e) => setForm({ ...form, expertName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Business Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Contact Phone Number
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Agency Website URL
                    </label>
                    <input
                      type="url"
                      value={form.websiteUrl}
                      onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                      placeholder="https://example-travel.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Agency Description & Specialties
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe your specialties, local network, vehicle fleet, and experience..."
                    className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* 2. Address & Experience */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.yearsOfExperience}
                      onChange={(e) => setForm({ ...form, yearsOfExperience: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Areas of Expertise / Specializations (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={form.specializations}
                    onChange={(e) => setForm({ ...form, specializations: e.target.value })}
                    placeholder="e.g. Himachal, Ladakh, Trekking, Honeymoon, Luxury Resorts"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Languages Supported (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={form.languages}
                    onChange={(e) => setForm({ ...form, languages: e.target.value })}
                    placeholder="e.g. English, Hindi, German, Spanish"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <Button type="button" variant="ghost" size="md" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="md" isLoading={saving} leftIcon={<Save className="w-4 h-4 mr-1" />}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            /* VIEW MODE */
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-cyan-400" /> Agency & Service Profile
                </h3>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing(true)} leftIcon={<Edit3 className="w-3.5 h-3.5 mr-1" />}>
                  Edit Profile
                </Button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-500 uppercase font-semibold text-[10px] block mb-1">
                    About Agency & Services
                  </span>
                  <p className="text-slate-300 leading-relaxed bg-surface-dark p-3.5 rounded-xl border border-border">
                    {form.description || 'No description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px] block">Contact Representative</span>
                    <span className="text-white font-bold text-sm block mt-0.5">{form.expertName || user?.name}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px] block">Business Email</span>
                    <span className="text-white font-mono text-xs block mt-0.5">{form.email || user?.email}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px] block">Contact Phone</span>
                    <span className="text-white font-mono text-xs block mt-0.5">{form.phone || 'Not provided'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px] block">Website URL</span>
                    <span className="text-cyan-400 text-xs block mt-0.5">{form.websiteUrl || 'Not provided'}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-slate-500 uppercase font-semibold text-[10px] block mb-1.5 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-cyan-400" /> Areas of Expertise & Specializations
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {form.specializations.split(',').map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-lg bg-surface border border-border text-cyan-300 text-xs font-semibold">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-slate-500 uppercase font-semibold text-[10px] block mb-1.5 flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-slate-400" /> Languages Supported
                  </span>
                  <span className="text-slate-300 text-xs">{form.languages}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACCOUNT MANAGEMENT SECTION (NO "Danger Zone" heading) */}
      <div className="card p-6 border border-border space-y-5">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Account Management</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your Travel Expert Agency profile information or request permanent account deletion.
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
                Update your agency, travel specializations, and account information.
              </p>
            </div>
            <div>
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
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
                Request permanent deletion of your Travel Expert Agency account and associated eligible personal information.
              </p>
            </div>
            <div>
              <Button type="button" variant="danger" size="sm" onClick={() => setIsDeleteModalOpen(true)}>
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
        accountType="expert"
      />
    </div>
  );
};

export default ExpertProfile;

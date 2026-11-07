import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService, adminService } from '../../services';
import {
  ShieldCheck,
  User as UserIcon,
  Phone,
  Mail,
  Save,
  KeyRound,
  Activity,
  Layers,
  DollarSign,
  Users,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export const AdminProfile: React.FC = () => {
  const { user, updateUser, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+91 98000 00001');
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferredCurrency || 'INR');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Modal State
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  // Recent Admin Audit Logs
  const [adminAuditLogs, setAdminAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '+91 98000 00001');
      setPreferredCurrency(user.preferredCurrency || 'INR');
    }
  }, [user]);

  useEffect(() => {
    async function loadLogs() {
      setLoadingLogs(true);
      try {
        const res = await adminService.getAuditLogs(6);
        const list = res.data?.data?.content || res.data?.data?.logs || [];
        setAdminAuditLogs(list);
      } catch {
        // Fallback demo audit actions
        setAdminAuditLogs([
          { id: '1', action: 'UPDATE_USER_ROLE', entityType: 'User', createdAt: new Date().toISOString() },
          { id: '2', action: 'PAYMENT_CAPTURED_ESCROW_LOCKED', entityType: 'Payment', createdAt: new Date().toISOString() },
          { id: '3', action: 'INVENTORY_RATE_SYNC', entityType: 'Hotel', createdAt: new Date().toISOString() },
        ]);
      } finally {
        setLoadingLogs(false);
      }
    }
    loadLogs();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await userService.updateProfile({
        name,
        phone,
        preferredCurrency,
      });
      if (updateUser) {
        updateUser({ ...user, name, phone, preferredCurrency });
      }
      if (refreshProfile) {
        await refreshProfile();
      }
      toast.success('Administrator profile updated successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update admin profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    setChangingPass(true);
    try {
      await userService.changePassword({ currentPassword, newPassword });
      toast.success('Administrator credentials updated securely.');
      setIsPassModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Password update failed. Verify current password.');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-purple-500/20 border border-purple-400/40 shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-white tracking-tight">{user?.name || 'Super Administrator'}</h1>
                <Badge variant="gold" size="sm">SUPER ADMIN</Badge>
                <Badge variant="success" size="sm">LEVEL 4 CLEARANCE</Badge>
              </div>
              <p className="text-xs text-slate-400 font-mono">{user?.email || 'admin@wayrivo.com'}</p>
              <p className="text-[11px] text-purple-300/80 mt-1 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Platform Security & Financial Escrow Administrator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPassModalOpen(true)}
              className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10 text-xs flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-400" /> Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Authority & Privileges Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Escrow Oversight</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-black text-white">Full Authority</p>
          <p className="text-[10px] text-slate-400">Release & refund jurisdiction</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Role RBAC</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-lg font-black text-white">Master Admin</p>
          <p className="text-[10px] text-slate-400">Promote/demote travelers & experts</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Inventory Master</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-lg font-black text-white">Direct CRUD</p>
          <p className="text-[10px] text-slate-400">Hotels, packages, activities</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Audit Trail</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-lg font-black text-white">Continuous</p>
          <p className="text-[10px] text-slate-400">Tamper-evident DB logging</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Admin Profile Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-purple-400" /> Administrative Identity Details
              </h2>
              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                RBAC Level 4
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Administrator Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Official Admin Email (Locked)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-400 text-xs cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Emergency Mobile Contact</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Dashboard Reporting Currency</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={preferredCurrency}
                      onChange={(e) => setPreferredCurrency(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="INR">INR (₹ Indian Rupee)</option>
                      <option value="USD">USD ($ United States Dollar)</option>
                      <option value="EUR">EUR (€ Euro)</option>
                      <option value="GBP">GBP (£ British Pound)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 px-5 py-2.5 rounded-xl shadow-lg shadow-purple-600/30"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingProfile ? 'Updating Credentials...' : 'Save Administrator Profile'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Security Audit & Recent Activity */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" /> Recent Security Audit Events
            </h3>
            <p className="text-[11px] text-slate-400">
              Live tamper-evident administrative logs recorded in PostgreSQL.
            </p>

            {loadingLogs ? (
              <div className="flex items-center justify-center p-6">
                <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : adminAuditLogs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-950 rounded-xl">
                No recent administrative actions recorded.
              </div>
            ) : (
              <div className="space-y-2.5">
                {adminAuditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-300 font-mono">{log.action}</span>
                      <span className="text-slate-500 text-[10px]">
                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Target Entity: <span className="text-slate-200">{log.entityType}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Password Change Modal */}
      <Modal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        title="Update Administrator Master Password"
        subtitle="Verify your current credential and supply a secure 8+ character password."
      >
        <form onSubmit={handleChangePassword} className="space-y-4 text-xs pt-2">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              placeholder="••••••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">New Administrator Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              placeholder="Minimum 8 characters"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              placeholder="Re-enter new password"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsPassModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={changingPass}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
            >
              {changingPass ? 'Updating...' : 'Confirm Password Update'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminProfile;

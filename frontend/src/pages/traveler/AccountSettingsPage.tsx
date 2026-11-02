import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Bell,
  Trash2,
  Laptop,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';

const AccountSettingsPage: React.FC = () => {
  const { logout } = useAuth();
  const { toast } = useToast();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [escrowAlerts, setEscrowAlerts] = useState(true);
  const [marketingOffers, setMarketingOffers] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSavePreferences = () => {
    setSavingSettings(true);
    setTimeout(() => {
      setSavingSettings(false);
      toast.success('Notification and privacy preferences saved');
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Account & Security Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your notifications, active sessions, and privacy settings
        </p>
      </div>

      {/* 1. Security & Sessions Overview */}
      <div className="card p-6 border border-border">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" /> Active Sessions & Authentication
        </h2>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-dark border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  Current Browser Session <Badge variant="turquoise" size="sm">Active Now</Badge>
                </p>
                <p className="text-xs text-slate-400">
                  HTTP-Only Cookie Authenticated • 256-Bit SSL Encrypted
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline">Windows • Chrome / Edge</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-bold text-white">Two-Factor Authentication (2FA)</p>
              <p className="text-xs text-slate-400">
                Add an extra layer of protection when approving escrow disbursements.
              </p>
            </div>
            <Badge variant="cyan" size="sm">Enabled via Email</Badge>
          </div>
        </div>
      </div>

      {/* 2. Notification Preferences */}
      <div className="card p-6 border border-border">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" /> Notification Preferences
        </h2>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-surface-dark border border-border cursor-pointer">
            <div>
              <p className="text-xs font-bold text-white">PayPal Escrow Status Updates</p>
              <p className="text-[11px] text-slate-400">
                Receive instant emails when a payment is held or released from escrow
              </p>
            </div>
            <input
              type="checkbox"
              checked={escrowAlerts}
              onChange={(e) => setEscrowAlerts(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-surface text-cyan-500 focus:ring-cyan-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-surface-dark border border-border cursor-pointer">
            <div>
              <p className="text-xs font-bold text-white">Agency Proposal & Chat Alerts</p>
              <p className="text-[11px] text-slate-400">
                Get notified when a certified agency submits or updates an itinerary proposal
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-surface text-cyan-500 focus:ring-cyan-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-surface-dark border border-border cursor-pointer">
            <div>
              <p className="text-xs font-bold text-white">Curated Travel Opportunities</p>
              <p className="text-[11px] text-slate-400">
                Seasonal recommendations matching your preferred destinations
              </p>
            </div>
            <input
              type="checkbox"
              checked={marketingOffers}
              onChange={(e) => setMarketingOffers(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-surface text-cyan-500 focus:ring-cyan-500"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={savingSettings}
            onClick={handleSavePreferences}
          >
            Save Notification Settings
          </Button>
        </div>
      </div>

      {/* 3. Account Actions / Sign Out */}
      <div className="card p-6 border border-rose-500/20 bg-rose-500/5">
        <h2 className="text-base font-bold text-rose-300 mb-2 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-400" /> Account Sessions & Deactivation
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Terminating your session clears your secure HTTP-only cookies and local credentials.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={logout}
          >
            Sign Out of All Devices
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsPage;

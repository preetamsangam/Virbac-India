import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Bell,
  Building,
  Check,
  ShieldCheck,
  KeyRound,
  IdCard,
} from 'lucide-react';
import { OfficerProfile } from '../types/poultry';

interface OfficerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: OfficerProfile;
  onSaveProfile: (profile: OfficerProfile) => void;
}

export const OfficerSettingsModal: React.FC<OfficerSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<OfficerProfile>(profile);
  const [passwordInput, setPasswordInput] = useState('');
  const [notificationStatus, setNotificationStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  if (!isOpen) return null;

  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationStatus(permission);
        if (permission === 'granted') {
          new Notification('Poultry Connect: Notifications Enabled!', {
            body: '7-Day follow-up reminders and visit alerts will now appear on your device.',
            icon: '/vite.svg',
          });
          setTestNotificationSent(true);
        }
      } catch (err) {
        console.error('Error requesting notification permission:', err);
      }
    }
  };

  const handleSendTestPush = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('⚡ 7-Day Follow-Up Alert: Farm Review', {
        body: 'Scheduled follow-up is due for review today!',
        icon: '/vite.svg',
      });
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 4000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...formData,
      password: passwordInput.trim() ? passwordInput.trim() : formData.password,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Building className="h-5 w-5 text-blue-700" />
            <div>
              <h2 className="text-base font-black text-slate-900">
                Business Officer (BO) Account &amp; Settings
              </h2>
              <p className="text-xs text-slate-500">
                Officer ID: <span className="font-mono font-bold text-blue-800">{formData.officerId || 'BO-1042'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Officer ID and Credentials */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-700" /> Officer Identity &amp; Login
              </span>
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-mono font-bold text-blue-900">
                {formData.officerId || 'BO-1042'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Officer ID Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.officerId}
                  onChange={(e) => setFormData({ ...formData, officerId: e.target.value })}
                  placeholder="BO-1042"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Update Officer Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Sales Field Officer Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
              <User className="h-4 w-4 text-slate-600" /> Business Officer Information
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.officerName}
                  onChange={(e) => setFormData({ ...formData, officerName: e.target.value })}
                  placeholder="e.g. Preetam Sangam"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Follow-Up Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.officerEmail}
                  onChange={(e) => setFormData({ ...formData, officerEmail: e.target.value })}
                  placeholder="e.g. preetamsangam07@gmail.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile / Phone *
                </label>
                <input
                  type="text"
                  required
                  value={formData.officerPhone}
                  onChange={(e) => setFormData({ ...formData, officerPhone: e.target.value })}
                  placeholder="e.g. +91 98480 12345"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">BU Unit</label>
                <input
                  type="text"
                  value={formData.buUnit}
                  onChange={(e) => setFormData({ ...formData, buUnit: e.target.value })}
                  placeholder="e.g. Poultry Business Unit"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Region</label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="e.g. South Region"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">HQ (Headquarters)</label>
                <input
                  type="text"
                  value={formData.hq}
                  onChange={(e) => setFormData({ ...formData, hq: e.target.value })}
                  placeholder="e.g. Namakkal HQ"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Push Notifications & Reminders */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Bell className="h-4 w-4 text-blue-700" /> Push Notifications &amp; Reminders
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Receives 7-day follow-up reminders directly in your browser.
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Permission Status:{' '}
                  <strong
                    className={
                      notificationStatus === 'granted'
                        ? 'text-emerald-700 uppercase'
                        : notificationStatus === 'denied'
                        ? 'text-rose-700 uppercase'
                        : 'text-amber-700 uppercase'
                    }
                  >
                    {notificationStatus}
                  </strong>
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {notificationStatus !== 'granted' ? (
                  <button
                    type="button"
                    onClick={handleRequestPushPermission}
                    className="rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-800 cursor-pointer shadow-2xs"
                  >
                    Enable Push
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendTestPush}
                    className="rounded-xl border border-blue-300 bg-white px-3.5 py-2 text-xs font-bold text-blue-900 hover:bg-blue-50 cursor-pointer shadow-2xs"
                  >
                    Test Alert
                  </button>
                )}
              </div>
            </div>
            {testNotificationSent && (
              <p className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Test notification sent!
              </p>
            )}
          </div>

          {/* Footer Save & Logout */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                if (confirm('Log out from this Business Officer session?')) {
                  onSaveProfile({ ...formData, isAuthorized: false });
                  onClose();
                }
              }}
              className="text-xs text-rose-700 hover:text-rose-800 font-bold cursor-pointer"
            >
              Log Out / Switch Officer
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-blue-700 px-5 py-2 text-xs font-bold text-white hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
              >
                Save Officer Profile
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Building,
  MapPin,
  Phone,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { OfficerProfile } from '../types/poultry';

interface OfficerAuthModalProps {
  isOpen: boolean;
  onAuthorize: (profile: OfficerProfile) => void;
  currentProfile: OfficerProfile;
}

interface StoredOfficerAccount extends OfficerProfile {
  username: string;
  passwordHash: string; // Plain/hash for client mock
}

const DEFAULT_OFFICERS: StoredOfficerAccount[] = [
  {
    officerId: 'BO-1042',
    username: 'preetam',
    passwordHash: 'virbac123',
    officerName: 'Preetam Sangam',
    officerEmail: 'preetamsangam07@gmail.com',
    officerPhone: '+91 98480 12345',
    buUnit: 'Poultry Business Unit',
    region: 'South Region',
    hq: 'Namakkal HQ',
    territory: 'Namakkal & Deccan Poultry Belt',
    currencySymbol: '₹',
    autoTriggerMailtoOnDue: true,
    web3FormsKey: '',
    isAuthorized: true,
  },
  {
    officerId: 'BO-1088',
    username: 'rajesh',
    passwordHash: 'virbac123',
    officerName: 'Rajesh Kumar',
    officerEmail: 'rajesh.kumar@virbac.co.in',
    officerPhone: '+91 98120 44321',
    buUnit: 'Poultry Business Unit',
    region: 'North Region',
    hq: 'Karnal HQ',
    territory: 'Haryana & Punjab Broiler Belt',
    currencySymbol: '₹',
    autoTriggerMailtoOnDue: true,
    web3FormsKey: '',
    isAuthorized: true,
  },
  {
    officerId: 'BO-2015',
    username: 'anita',
    passwordHash: 'virbac123',
    officerName: 'Anita Deshmukh',
    officerEmail: 'anita.deshmukh@virbac.co.in',
    officerPhone: '+91 99220 87654',
    buUnit: 'Poultry Business Unit',
    region: 'West Region',
    hq: 'Pune HQ',
    territory: 'Maharashtra & Gujarat Poultry Zone',
    currencySymbol: '₹',
    autoTriggerMailtoOnDue: true,
    web3FormsKey: '',
    isAuthorized: true,
  },
];

const OFFICERS_REGISTRY_KEY = 'virbac_officers_registry_v2';

export const OfficerAuthModal: React.FC<OfficerAuthModalProps> = ({
  isOpen,
  onAuthorize,
  currentProfile,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loginUsername, setLoginUsername] = useState(currentProfile.username || 'preetam');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Registration fields
  const [regData, setRegData] = useState<OfficerProfile>({
    officerId: `BO-${Math.floor(1000 + Math.random() * 9000)}`,
    officerName: '',
    officerEmail: '',
    officerPhone: '+91 ',
    buUnit: 'Poultry Business Unit',
    region: 'South Region',
    hq: 'Namakkal HQ',
    territory: 'Local Poultry Zone',
    currencySymbol: '₹',
    autoTriggerMailtoOnDue: true,
    web3FormsKey: '',
    username: '',
    password: '',
    isAuthorized: true,
  });

  if (!isOpen) return null;

  const getOfficersRegistry = (): StoredOfficerAccount[] => {
    try {
      const saved = localStorage.getItem(OFFICERS_REGISTRY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed reading registry:', e);
    }
    return DEFAULT_OFFICERS;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const registry = getOfficersRegistry();
    const uname = loginUsername.trim().toLowerCase();
    const pwd = loginPassword.trim();

    const officer = registry.find(
      (o) =>
        (o.username.toLowerCase() === uname ||
          o.officerId.toLowerCase() === uname ||
          o.officerEmail.toLowerCase() === uname) &&
        (o.passwordHash === pwd || pwd === 'virbac123')
    );

    if (officer) {
      onAuthorize({
        ...officer,
        isAuthorized: true,
      });
    } else {
      setAuthError('Invalid Officer ID/Username or Password. Try default password: virbac123');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!regData.officerName.trim() || !regData.officerEmail.trim() || !regData.username?.trim()) {
      setAuthError('Please fill in all required officer registration details.');
      return;
    }
    const newOfficer: StoredOfficerAccount = {
      ...regData,
      officerId: regData.officerId || `BO-${Math.floor(1000 + Math.random() * 9000)}`,
      username: regData.username!.trim().toLowerCase(),
      passwordHash: regData.password?.trim() || 'virbac123',
      isAuthorized: true,
    };

    const registry = getOfficersRegistry();
    const updated = [...registry.filter((o) => o.username !== newOfficer.username), newOfficer];
    localStorage.setItem(OFFICERS_REGISTRY_KEY, JSON.stringify(updated));

    onAuthorize(newOfficer);
  };

  const handleQuickDemoOfficer = (officer: StoredOfficerAccount) => {
    setLoginUsername(officer.username);
    setLoginPassword(officer.passwordHash);
    onAuthorize({
      ...officer,
      isAuthorized: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 text-slate-800 shadow-2xl relative my-auto">
        {/* Top Header: Virbac Brand */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-auto items-center justify-center mb-2">
            <img
              src="https://in.virbac.com/assets/virbac/build/images/virbac-logo.03fd5e40.svg"
              alt="Virbac"
              className="h-9 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-900 border border-blue-200">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
            <span>Business Officer Field Portal · Mobile Suite</span>
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            Poultry <span className="text-blue-700">Connect</span>
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Secure login for Virbac Business Officers to manage customer farm visits and follow-ups.
          </p>
        </div>

        {/* Mode Toggle: Login vs Register */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setAuthError('');
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Officer Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setAuthError('');
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>New Officer</span>
          </button>
        </div>

        {authError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Officer ID / Username / Email <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="e.g. preetam or BO-1042"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Secret Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your officer password"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 font-medium">
                Default password for official accounts is: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-blue-800">virbac123</code>
              </p>
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-800 transition-all cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              <span>Sign In to Mobile Workbench</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Quick 1-Click Access for Active Field Officers */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                One-Tap Officer Login:
              </p>
              <div className="space-y-1.5">
                {DEFAULT_OFFICERS.map((off) => (
                  <button
                    key={off.officerId}
                    type="button"
                    onClick={() => handleQuickDemoOfficer(off)}
                    className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-left text-xs hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{off.officerName}</span>
                        <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-900 font-mono">
                          {off.officerId}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{off.hq} · {off.region}</p>
                    </div>
                    <span className="text-[11px] font-bold text-blue-700">Login →</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Officer ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regData.officerId}
                  onChange={(e) => setRegData({ ...regData, officerId: e.target.value })}
                  placeholder="BO-3045"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regData.username}
                  onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                  placeholder="e.g. suresh"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={regData.officerName}
                onChange={(e) => setRegData({ ...regData, officerName: e.target.value })}
                placeholder="e.g. Suresh Patel"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={regData.officerEmail}
                  onChange={(e) => setRegData({ ...regData, officerEmail: e.target.value })}
                  placeholder="officer@virbac.in"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  placeholder="Set password"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">HQ</label>
                <input
                  type="text"
                  value={regData.hq}
                  onChange={(e) => setRegData({ ...regData, hq: e.target.value })}
                  placeholder="Hyderabad HQ"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Region</label>
                <input
                  type="text"
                  value={regData.region}
                  onChange={(e) => setRegData({ ...regData, region: e.target.value })}
                  placeholder="South Region"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-800 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Create Officer Account &amp; Access</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

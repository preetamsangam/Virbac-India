import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Layers,
  Menu,
  Package,
  Phone,
  Settings,
  ShieldCheck,
  TrendingUp,
  User,
  LogOut,
  Wifi,
  WifiOff,
  X,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { FarmVisitWorkbench } from './components/FarmVisitWorkbench';
import { OfflineCompendium } from './components/OfflineCompendium';
import { FollowUpManager } from './components/FollowUpManager';
import { OfficerSettingsModal } from './components/OfficerSettingsModal';
import { OfficerAuthModal } from './components/OfficerAuthModal';
import { VIRBAC_POULTRY_PORTFOLIO } from './data/productsCatalog';
import { COMMON_AVIAN_DISEASES } from './data/diseases';
import { FarmVisitRecord, OfficerProfile } from './types/poultry';
import { exportVisitsAsJSON, getInitialSampleVisits } from './utils/calculations';

const DEFAULT_PROFILE: OfficerProfile = {
  officerId: 'BO-1042',
  username: 'preetam',
  password: 'virbac123',
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
};

const VISITS_STORAGE_KEY = 'avianfield_pro_visits_v2';
const PROFILE_STORAGE_KEY = 'avianfield_pro_profile_v2';
const LAST_SYNC_STORAGE_KEY = 'poultry_connect_last_sync_time';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workbench' | 'portfolio' | 'compendium' | 'followups'>('workbench');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Sync Status tracking
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => {
    try {
      const saved = localStorage.getItem(LAST_SYNC_STORAGE_KEY);
      if (saved) {
        const d = new Date(saved);
        if (!isNaN(d.getTime())) return d;
      }
    } catch (e) {
      console.warn('Failed to parse last sync time from storage:', e);
    }
    return new Date();
  });
  const [isSyncPulsing, setIsSyncPulsing] = useState(false);

  // Officer Profile
  const [officerProfile, setOfficerProfile] = useState<OfficerProfile>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse officer profile from storage:', e);
    }
    return DEFAULT_PROFILE;
  });

  // Recorded Farm Visits
  const [visits, setVisits] = useState<FarmVisitRecord[]>(() => {
    try {
      const saved = localStorage.getItem(VISITS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse visits from storage:', e);
    }
    return getInitialSampleVisits(DEFAULT_PROFILE.officerEmail);
  });

  // Preselected items passed from Compendium into Workbench
  const [preselectedProductIds, setPreselectedProductIds] = useState<string[]>([]);
  const [preselectedDiseaseIds, setPreselectedDiseaseIds] = useState<string[]>([]);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(officerProfile));
    } catch (e) {
      console.error('Failed to save profile to storage:', e);
    }
  }, [officerProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(visits));
      const now = new Date();
      localStorage.setItem(LAST_SYNC_STORAGE_KEY, now.toISOString());
      setLastSyncTime(now);
      setIsSyncPulsing(true);
      const timer = setTimeout(() => setIsSyncPulsing(false), 2000);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error('Failed to save visits to storage:', e);
    }
  }, [visits]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calculate follow-ups due count
  const followUpsDueCount = useMemo(() => {
    const now = new Date();
    return visits.filter((v) => v.followUpStatus === 'pending' && new Date(v.followUpDueAt) <= now).length;
  }, [visits]);

  // Visit handlers
  const handleSaveVisit = (newVisit: FarmVisitRecord) => {
    setVisits((prev) => [newVisit, ...prev]);
  };

  const handleUpdateVisit = (updated: FarmVisitRecord) => {
    setVisits((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  const handleDeleteVisit = (id: string) => {
    setVisits((prev) => prev.filter((v) => v.id !== id));
  };

  const handleImportVisits = (imported: FarmVisitRecord[]) => {
    setVisits(imported);
  };

  const handleSelectProductForVisit = (productId: string) => {
    setPreselectedProductIds((prev) => Array.from(new Set([...prev, productId])));
    setActiveTab('workbench');
    setIsSidebarOpen(false);
  };

  const handleSelectDiseaseForVisit = (diseaseId: string) => {
    setPreselectedDiseaseIds((prev) => Array.from(new Set([...prev, diseaseId])));
    const disease = COMMON_AVIAN_DISEASES.find((d) => d.id === diseaseId);
    if (disease && disease.recommendedProductIds.length > 0) {
      setPreselectedProductIds((prev) => Array.from(new Set([...prev, ...disease.recommendedProductIds])));
    }
    setActiveTab('workbench');
    setIsSidebarOpen(false);
  };

  const handleClearPreselected = () => {
    setPreselectedProductIds([]);
    setPreselectedDiseaseIds([]);
  };

  const handleLogout = () => {
    if (confirm('Log out from Business Officer account?')) {
      setOfficerProfile((prev) => ({ ...prev, isAuthorized: false }));
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans antialiased">
      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* MOBILE APPLICATION SIDEBAR DRAWER */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Top: Virbac Brand Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <img
                src="https://in.virbac.com/assets/virbac/build/images/virbac-logo.03fd5e40.svg"
                alt="Virbac"
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="border-l border-slate-200 pl-2.5">
                <span className="text-base font-black tracking-tight text-slate-900 block leading-tight">
                  Poultry <span className="text-blue-700">Connect</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Field Sales App
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Business Officer Profile Card */}
          <div className="p-4 border-b border-slate-100">
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5">
              <div className="flex items-center justify-between">
                <span className="rounded bg-blue-700 px-2 py-0.5 text-[10px] font-mono font-bold text-white tracking-wide">
                  {officerProfile.officerId || 'BO-1042'}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-[11px] font-bold text-rose-700 hover:text-rose-900 cursor-pointer flex items-center gap-1"
                  title="Log out from officer session"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Log Out</span>
                </button>
              </div>

              <div className="mt-2 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 font-black text-white text-xs shadow-xs shrink-0">
                  {officerProfile.officerName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xs font-black text-slate-900">
                    {officerProfile.officerName}
                  </h3>
                  <p className="truncate text-[11px] text-slate-500 font-medium">
                    {officerProfile.hq} · {officerProfile.region}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-blue-200/60 flex items-center justify-between text-[10px] text-blue-900 font-semibold">
                <span>{officerProfile.buUnit || 'Poultry BU'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsSidebarOpen(false);
                  }}
                  className="underline hover:text-blue-950 cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Items (Native Mobile App Style) */}
          <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTab('workbench');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'workbench'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4" />
                <span>Farm Visit Workbench</span>
              </div>
              <ChevronRight className={`h-4 w-4 ${activeTab === 'workbench' ? 'text-white' : 'text-slate-400'}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('portfolio');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'portfolio'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4" />
                <span>Virbac Portfolio &amp; Rates</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'portfolio' ? 'bg-white text-blue-900' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {VIRBAC_POULTRY_PORTFOLIO.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('compendium');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'compendium'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4" />
                <span>Avian Diseases &amp; Autopsy</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'compendium' ? 'bg-white text-blue-900' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {COMMON_AVIAN_DISEASES.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('followups');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'followups'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4" />
                <span>7-Day Follow-Up CRM</span>
              </div>
              {followUpsDueCount > 0 ? (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white animate-pulse">
                  {followUpsDueCount} Due
                </span>
              ) : (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    activeTab === 'followups' ? 'bg-white text-blue-900' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {visits.length}
                </span>
              )}
            </button>
          </nav>

          {/* Sidebar Footer: Sync Status & Backup */}
          <div className="border-t border-slate-200 p-4 space-y-2.5 bg-slate-50/70">
            {/* Sync Timestamp */}
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Database className="h-3.5 w-3.5 text-blue-700" />
                <span>Local Sync</span>
              </span>
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Offline status */}
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                {isOnline ? (
                  <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-amber-600" />
                )}
                <span>Network</span>
              </span>
              <span
                className={`font-bold ${
                  isOnline ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {isOnline ? 'Offline Ready' : 'Offline'}
              </span>
            </div>

            {/* Export JSON Button */}
            <button
              type="button"
              onClick={() => exportVisitsAsJSON(visits)}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-blue-700" />
              <span>Export Visits Backup</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Mobile Application Header Bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 shadow-2xs">
          <div className="flex items-center justify-between">
            {/* Left: Hamburger menu toggle + Page Title */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 cursor-pointer lg:hidden"
                aria-label="Open mobile menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                  {activeTab === 'workbench' && 'Farm Visit Workbench'}
                  {activeTab === 'portfolio' && 'Virbac Portfolio & Rate List'}
                  {activeTab === 'compendium' && 'Avian Diseases & Autopsy Compendium'}
                  {activeTab === 'followups' && '7-Day Follow-Up CRM'}
                </h1>
                <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                  BO: {officerProfile.officerName} ({officerProfile.officerId || 'BO-1042'}) · {officerProfile.hq}
                </p>
              </div>
            </div>

            {/* Right Quick Header Actions */}
            <div className="flex items-center gap-2">
              {followUpsDueCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('followups')}
                  className="flex items-center gap-1 rounded-xl bg-amber-500 px-2.5 py-1.5 text-xs font-black text-white hover:bg-amber-600 transition-colors cursor-pointer shadow-xs animate-pulse"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>{followUpsDueCount} Due</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                title="Business Officer Settings"
              >
                <Settings className="h-4 w-4 text-blue-700" />
                <span className="hidden md:inline">{officerProfile.officerName.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {activeTab === 'workbench' && (
            <FarmVisitWorkbench
              products={VIRBAC_POULTRY_PORTFOLIO}
              officerProfile={officerProfile}
              preselectedProductIds={preselectedProductIds}
              preselectedDiseaseIds={preselectedDiseaseIds}
              onClearPreselected={handleClearPreselected}
              onSaveVisit={handleSaveVisit}
              onNavigateToFollowUps={() => setActiveTab('followups')}
            />
          )}

          {(activeTab === 'portfolio' || activeTab === 'compendium') && (
            <OfflineCompendium
              products={VIRBAC_POULTRY_PORTFOLIO}
              diseases={COMMON_AVIAN_DISEASES}
              onSelectProductForVisit={handleSelectProductForVisit}
              onSelectDiseaseForVisit={handleSelectDiseaseForVisit}
              onNavigateToWorkbench={() => setActiveTab('workbench')}
            />
          )}

          {activeTab === 'followups' && (
            <FollowUpManager
              visits={visits}
              officerProfile={officerProfile}
              onUpdateVisit={handleUpdateVisit}
              onDeleteVisit={handleDeleteVisit}
              onImportVisits={handleImportVisits}
            />
          )}
        </main>
      </div>

      {/* Field Officer Authentication Modal / Screen */}
      <OfficerAuthModal
        isOpen={!officerProfile.isAuthorized}
        onAuthorize={setOfficerProfile}
        currentProfile={officerProfile}
      />

      {/* Officer Profile Settings Modal */}
      <OfficerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={officerProfile}
        onSaveProfile={setOfficerProfile}
      />
    </div>
  );
}

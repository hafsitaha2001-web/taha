import React, { useState } from 'react';
import {
  FileText,
  Users,
  TrendingUp,
  BrainCircuit,
  Settings,
  Film,
  Camera,
  Building2,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Menu,
  X,
  Palette,
  Check,
  Cloud,
  CloudCheck,
  RefreshCw,
  Smartphone
} from 'lucide-react';
import { ProfileInfo, DocumentData, DirectRevenueItem } from '../types';

interface NavigationProps {
  activeModule: 'docs' | 'crm' | 'prod' | 'stats' | 'expert';
  setActiveModule: (mod: 'docs' | 'crm' | 'prod' | 'stats' | 'expert') => void;
  profile: ProfileInfo;
  onSaveProfile?: (profile: ProfileInfo) => void;
  documents: DocumentData[];
  directRevenues?: DirectRevenueItem[];
  cloudSyncStatus?: 'synced' | 'saving' | 'offline';
  lastSyncTime?: Date;
  onOpenSettings: () => void;
  onOpenGeminiChat: () => void;
  onOpenFirebaseConfig?: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeModule,
  setActiveModule,
  profile,
  onSaveProfile,
  documents,
  directRevenues = [],
  cloudSyncStatus = 'synced',
  lastSyncTime = new Date(),
  onOpenSettings,
  onOpenGeminiChat,
  onOpenFirebaseConfig,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const palettes = [
    // Classiques Cinéma
    { id: 'gold' as const, label: 'Or Cinéma (Arri Pro)', category: 'Cinéma & Prestige', color: 'bg-amber-400', border: 'border-amber-400/50' },
    { id: 'crimson' as const, label: 'RED Cinema Rubis', category: 'Cinéma & Prestige', color: 'bg-rose-500', border: 'border-rose-400/50' },
    { id: 'champagne' as const, label: 'Rose Gold & Champagne', category: 'Cinéma & Prestige', color: 'bg-pink-400', border: 'border-pink-300/50' },
    { id: 'monochrome' as const, label: 'Titane Platine Chrome', category: 'Cinéma & Prestige', color: 'bg-slate-200', border: 'border-slate-300/50' },

    // Cyber, Neon & Sci-Fi
    { id: 'indigo' as const, label: 'Cyber Indigo & Violet', category: 'Cyber & Sci-Fi', color: 'bg-indigo-500', border: 'border-indigo-400/50' },
    { id: 'cyan' as const, label: 'Bleu Anamorphique Teal', category: 'Cyber & Sci-Fi', color: 'bg-cyan-400', border: 'border-cyan-400/50' },
    { id: 'fuchsia' as const, label: 'Tokyo Neon Synthwave', category: 'Cyber & Sci-Fi', color: 'bg-pink-500', border: 'border-pink-400/50' },
    { id: 'lime' as const, label: 'Vert Acide Cyber Volt', category: 'Cyber & Sci-Fi', color: 'bg-lime-400', border: 'border-lime-400/50' },

    // Atmosphères & Nature
    { id: 'emerald' as const, label: 'Émeraude Matrix & Jade', category: 'Atmosphères Riches', color: 'bg-emerald-400', border: 'border-emerald-400/50' },
    { id: 'sapphire' as const, label: 'Saphir Royal & Cobalt', category: 'Atmosphères Riches', color: 'bg-blue-500', border: 'border-blue-400/50' },
    { id: 'purple' as const, label: 'Pourpre Royal Améthyste', category: 'Atmosphères Riches', color: 'bg-purple-500', border: 'border-purple-400/50' },
    { id: 'sunset' as const, label: 'Sunset Mirage Cuivre', category: 'Atmosphères Riches', color: 'bg-orange-400', border: 'border-orange-400/50' },
  ];

  const handleSelectPalette = (paletteId: any) => {
    if (onSaveProfile) {
      onSaveProfile({ ...profile, colorPalette: paletteId });
    }
    const allThemeClasses = [
      'theme-gold',
      'theme-indigo',
      'theme-emerald',
      'theme-crimson',
      'theme-sunset',
      'theme-cyan',
      'theme-purple',
      'theme-fuchsia',
      'theme-sapphire',
      'theme-lime',
      'theme-champagne',
      'theme-monochrome',
    ];
    document.body.classList.remove(...allThemeClasses);
    document.body.classList.add(`theme-${paletteId}`);
    setIsPaletteOpen(false);
  };
  // Calculate total realized turnover HT (Only documents marked as 'paye' + Direct/Forfaits marked as 'paye')
  const docsTurnoverHT = documents
    .filter((d) => d.status === 'paye')
    .reduce((sum, doc) => {
      return sum + doc.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discountPercent || 0) / 100), 0);
    }, 0);

  const directTurnoverHT = directRevenues
    .filter((r) => r.status === 'paye')
    .reduce((sum, item) => sum + item.amountMAD * (item.occurrencesCount || 1), 0);

  const totalTurnoverHT = docsTurnoverHT + directTurnoverHT;

  const aeCeilingMAD = 200000;
  const aeUsagePercent = Math.min(100, Math.round((totalTurnoverHT / aeCeilingMAD) * 100));

  const navItems = [
    {
      id: 'docs' as const,
      label: 'Générateur de Documents',
      shortLabel: 'Devis & Factures',
      sub: 'Devis, Factures & Bon de Livraison',
      icon: FileText,
      badge: documents.length > 0 ? `${documents.length}` : undefined,
    },
    {
      id: 'stats' as const,
      label: 'Dashboard Financier',
      shortLabel: 'Finances & CA',
      sub: 'KPIs, CA & Statistiques',
      icon: TrendingUp,
    },
    {
      id: 'crm' as const,
      label: 'Networking & CRM Visuel',
      shortLabel: 'CRM Réseau',
      sub: "Organigramme & Apporteurs d'affaires",
      icon: Users,
    },
    {
      id: 'prod' as const,
      label: 'Studio Gear & Tournage',
      shortLabel: 'Tournage',
      sub: 'Matériel, Équipe & Call Sheet',
      icon: Camera,
    },
    {
      id: 'expert' as const,
      label: 'Expert SARL & Stratégie',
      shortLabel: 'Expert SARL',
      sub: 'Analyse mensuelle & Passage en SARL',
      icon: BrainCircuit,
      highlight: true,
    },
  ];

  return (
    <>
      {/* Top Bar Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#080c14]/85 backdrop-blur-2xl border-b border-white/[0.08] px-4 lg:px-8 py-3.5 no-print shadow-2xl shadow-black/50">
        <div className="max-w-[1640px] mx-auto flex items-center justify-between gap-2 sm:gap-6">
          {/* Logo & Filmmaker Name */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 text-slate-300 hover:text-white rounded-xl bg-slate-900/90 border border-white/10 active:scale-95 transition-all shadow-sm"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-[#E2B714] to-amber-600 rounded-xl flex items-center justify-center text-slate-950 font-black italic shadow-lg shadow-amber-500/25 shrink-0 text-lg border border-amber-300/40">
                F
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs sm:text-sm text-white tracking-tight uppercase italic truncate max-w-[130px] sm:max-w-none">
                    {profile.filmmakerName}
                  </span>
                  <span className="bg-amber-500/15 text-amber-300 border border-amber-500/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 shadow-sm">
                    SARL AU
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 uppercase tracking-wider mt-0.5">
                  <span>ICE: <span className="text-white font-bold">{profile.ice}</span></span>
                  <span className="hidden xs:inline text-slate-600">•</span>
                  <span className="hidden xs:inline text-amber-400 font-bold truncate max-w-[140px]">{profile.title}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center AE Revenue Gauge Header Ticker (Desktop) */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-900/90 border border-white/[0.08] px-4 py-2 rounded-2xl shadow-inner backdrop-blur-md">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
              <div className="text-xs font-bold text-slate-300">
                CA Encaissé: <span className="font-mono text-amber-400 font-extrabold">{totalTurnoverHT.toLocaleString('fr-MA')} MAD</span> / 200k
              </div>
            </div>

            <div className="w-36 h-2 bg-slate-950 rounded-full overflow-hidden border border-white/10 relative">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${aeUsagePercent}%` }}
              ></div>
            </div>

            <span className="text-[10px] font-extrabold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-sm">
              {aeUsagePercent}% Plafond AE
            </span>
          </div>

          {/* Right Action: Studio Settings, Color Themes & Gemini AI Assistant */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Cloud Sync Status Live Badge */}
            <button
              type="button"
              onClick={onOpenFirebaseConfig}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                cloudSyncStatus === 'synced'
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : cloudSyncStatus === 'saving'
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400 animate-pulse'
                  : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
              }`}
              title={
                cloudSyncStatus === 'synced'
                  ? `Cloud Synchronisé en direct (Mac ⇋ Téléphone) • ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Cliquez pour configurer Firebase`
                  : cloudSyncStatus === 'saving'
                  ? 'Synchronisation Cloud en cours...'
                  : 'Mode Hors-ligne (LocalStorage actif) • Cliquez pour configurer Firebase'
              }
            >
              {cloudSyncStatus === 'synced' && <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              {cloudSyncStatus === 'saving' && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />}
              {cloudSyncStatus === 'offline' && <Cloud className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
              <span className="hidden sm:inline">
                {cloudSyncStatus === 'synced' ? 'Cloud Sync' : cloudSyncStatus === 'saving' ? 'Syncing...' : 'Offline'}
              </span>
            </button>

            {/* Quick Color Palette Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                className="p-2 sm:px-3 sm:py-2 bg-slate-900/90 hover:bg-slate-800 border border-white/[0.08] hover:border-amber-400/40 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Changer l'ambiance couleur du studio"
              >
                <Palette className="w-4 h-4 text-amber-400" />
                <span className="hidden xl:inline">Ambiance</span>
              </button>

              {isPaletteOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsPaletteOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[85vh] overflow-y-auto p-3.5 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150 custom-scrollbar">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10 px-1">
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-amber-400" />
                          <span>Ambiance Couleur du Studio</span>
                        </div>
                        <p className="text-[10px] text-slate-400">12 Palettes d'Étalonnage Pro</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        {palettes.length} Thèmes
                      </span>
                    </div>

                    {['Cinéma & Prestige', 'Cyber & Sci-Fi', 'Atmosphères Riches'].map((category) => {
                      const categoryPalettes = palettes.filter((p) => p.category === category);
                      return (
                        <div key={category} className="space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 pt-1">
                            {category}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {categoryPalettes.map((p) => {
                              const isSelected = (profile.colorPalette || 'gold') === p.id;
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => handleSelectPalette(p.id)}
                                  className={`px-2.5 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-white/15 text-white border border-white/30 shadow-md'
                                      : 'text-slate-300 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`w-3.5 h-3.5 rounded-full ${p.color} border ${p.border} shadow-sm shrink-0`} />
                                    <span className="truncate text-[11px]">{p.label}</span>
                                  </div>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onOpenGeminiChat}
              className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-[#E2B714] text-slate-950 hover:brightness-110 font-black rounded-xl text-xs flex items-center gap-1.5 sm:gap-2 transition-all shadow-lg shadow-amber-500/25 cursor-pointer active:scale-95 border border-amber-300/40"
            >
              <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
              <span className="hidden xs:inline">Assistant</span> <span className="hidden sm:inline">Gemini</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 sm:px-3.5 sm:py-2 bg-slate-900/90 hover:bg-slate-800 border border-white/[0.08] hover:border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Paramètres du studio"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Paramètres</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Quick Navigation Strip */}
        <div className="lg:hidden mt-2 pt-2 border-t border-slate-850 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveModule(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{item.shortLabel || item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[110px] bg-slate-950/95 backdrop-blur-2xl z-40 p-4 border-b border-slate-800 space-y-2 no-print overflow-y-auto max-h-[calc(100vh-110px)]">
          <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <div className="text-xs font-bold text-slate-300">
                CA Encaissé : <span className="font-mono text-amber-400">{totalTurnoverHT.toLocaleString('fr-MA')} MAD</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {aeUsagePercent}% AE
            </span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveModule(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-lg'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                  <div>
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className={`text-[10px] ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                      {item.sub}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

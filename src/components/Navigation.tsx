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
  Check
} from 'lucide-react';
import { ProfileInfo, DocumentData, DirectRevenueItem } from '../types';

interface NavigationProps {
  activeModule: 'docs' | 'crm' | 'prod' | 'stats' | 'expert';
  setActiveModule: (mod: 'docs' | 'crm' | 'prod' | 'stats' | 'expert') => void;
  profile: ProfileInfo;
  onSaveProfile?: (profile: ProfileInfo) => void;
  documents: DocumentData[];
  directRevenues?: DirectRevenueItem[];
  onOpenSettings: () => void;
  onOpenGeminiChat: () => void;
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
  onOpenSettings,
  onOpenGeminiChat,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const palettes = [
    { id: 'gold' as const, label: 'Or Cinéma (Arri)', color: 'bg-amber-400', border: 'border-amber-400/50' },
    { id: 'indigo' as const, label: 'Cyber Indigo (Violet)', color: 'bg-indigo-500', border: 'border-indigo-400/50' },
    { id: 'emerald' as const, label: 'Émeraude Matrix (Jade)', color: 'bg-emerald-400', border: 'border-emerald-400/50' },
    { id: 'crimson' as const, label: 'Rouge RED Cinema', color: 'bg-rose-500', border: 'border-rose-400/50' },
    { id: 'sunset' as const, label: 'Sunset Mirage (Cuivre)', color: 'bg-orange-400', border: 'border-orange-400/50' },
  ];

  const handleSelectPalette = (paletteId: 'gold' | 'indigo' | 'emerald' | 'crimson' | 'sunset') => {
    if (onSaveProfile) {
      onSaveProfile({ ...profile, colorPalette: paletteId });
    }
    document.body.classList.remove('theme-gold', 'theme-indigo', 'theme-emerald', 'theme-crimson', 'theme-sunset');
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
                  <div className="absolute right-0 mt-2 w-64 p-3 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-1 flex items-center justify-between">
                      <span>Ambiances Cinéma</span>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </div>
                    {palettes.map((p) => {
                      const isSelected = (profile.colorPalette || 'gold') === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSelectPalette(p.id)}
                          className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white/10 text-white border border-white/20'
                              : 'text-slate-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-3.5 h-3.5 rounded-full ${p.color} border ${p.border} shadow-sm shrink-0`} />
                            <span>{p.label}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                        </button>
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

import React from 'react';
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
  X
} from 'lucide-react';
import { ProfileInfo, DocumentData, DirectRevenueItem } from '../types';

interface NavigationProps {
  activeModule: 'docs' | 'crm' | 'prod' | 'stats' | 'expert';
  setActiveModule: (mod: 'docs' | 'crm' | 'prod' | 'stats' | 'expert') => void;
  profile: ProfileInfo;
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
  documents,
  directRevenues = [],
  onOpenSettings,
  onOpenGeminiChat,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
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
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-3 lg:px-8 py-3 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Filmmaker Name */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-xl bg-slate-900 border border-slate-800 active:scale-95 transition-all"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#E2B714] rounded-sm flex items-center justify-center text-black font-black italic shadow-md shrink-0">
                F
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-black text-xs sm:text-sm text-white tracking-tighter uppercase italic truncate max-w-[130px] sm:max-w-none">
                    {profile.filmmakerName}
                  </span>
                  <span className="bg-[#E2B714]/20 text-[#E2B714] border border-[#E2B714]/40 text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-sm uppercase tracking-widest shrink-0">
                    SARL AU
                  </span>
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono flex items-center gap-1.5 sm:gap-2 uppercase tracking-wider">
                  <span>ICE: <span className="text-white font-bold">{profile.ice}</span></span>
                  <span className="hidden xs:inline text-slate-600">•</span>
                  <span className="hidden xs:inline text-[#E2B714] font-bold truncate max-w-[120px]">{profile.title}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center AE Revenue Gauge Header Ticker (Desktop) */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-900/90 border border-slate-800/90 px-4 py-1.5 rounded-2xl">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <div className="text-xs font-bold text-slate-300">
                CA Encaissé: <span className="font-mono text-amber-400">{totalTurnoverHT.toLocaleString('fr-MA')} MAD</span> / 200k
              </div>
            </div>

            <div className="w-28 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${aeUsagePercent}%` }}
              ></div>
            </div>

            <span className="text-[10px] font-extrabold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {aeUsagePercent}% Plafond AE
            </span>
          </div>

          {/* Right Action: Studio Settings & Gemini AI Assistant */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenGeminiChat}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-[#E2B714] text-slate-950 hover:brightness-110 font-black rounded-xl text-xs flex items-center gap-1.5 sm:gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
              <span className="hidden xs:inline">Assistant</span> <span className="hidden sm:inline">Gemini</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-1.5 sm:px-3.5 sm:py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
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

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
import { ProfileInfo, DocumentData } from '../types';

interface NavigationProps {
  activeModule: 'docs' | 'crm' | 'prod' | 'stats' | 'expert';
  setActiveModule: (mod: 'docs' | 'crm' | 'prod' | 'stats' | 'expert') => void;
  profile: ProfileInfo;
  documents: DocumentData[];
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
  onOpenSettings,
  onOpenGeminiChat,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  // Calculate total turnover HT
  const totalTurnoverHT = documents
    .filter((d) => d.status !== 'brouillon')
    .reduce((sum, doc) => {
      return sum + doc.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discountPercent || 0) / 100), 0);
    }, 0);

  const aeCeilingMAD = 200000;
  const aeUsagePercent = Math.min(100, Math.round((totalTurnoverHT / aeCeilingMAD) * 100));

  const navItems = [
    {
      id: 'docs' as const,
      label: 'Générateur de Documents',
      sub: 'Devis, Factures & Bon de Livraison',
      icon: FileText,
      badge: documents.length > 0 ? `${documents.length}` : undefined,
    },
    {
      id: 'crm' as const,
      label: 'Networking & CRM Visuel',
      sub: "Organigramme & Apporteurs d'affaires",
      icon: Users,
    },
    {
      id: 'prod' as const,
      label: 'Studio Gear & Tournage',
      sub: 'Matériel, Équipe & Call Sheet',
      icon: Camera,
    },
    {
      id: 'stats' as const,
      label: 'Dashboard Financier',
      sub: 'KPIs, CA & Statistiques',
      icon: TrendingUp,
    },
    {
      id: 'expert' as const,
      label: 'Expert SARL & Stratégie',
      sub: 'Analyse mensuelle & Passage en SARL',
      icon: BrainCircuit,
      highlight: true,
    },
  ];

  return (
    <>
      {/* Top Bar Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Filmmaker Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#E2B714] rounded-sm flex items-center justify-center text-black font-black italic shadow-md shrink-0">
                F
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-white tracking-tighter uppercase italic">
                    {profile.filmmakerName}
                  </span>
                  <span className="bg-[#E2B714]/20 text-[#E2B714] border border-[#E2B714]/40 text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest">
                    Transition SARL
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 uppercase tracking-wider">
                  <span>ICE: <span className="text-white font-bold">{profile.ice}</span></span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[#E2B714] font-bold">{profile.title}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center AE Revenue Gauge Header Ticker */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-900/90 border border-slate-800/90 px-4 py-1.5 rounded-2xl">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <div className="text-xs font-bold text-slate-300">
                CA Cumulé: <span className="font-mono text-amber-400">{totalTurnoverHT.toLocaleString('fr-MA')} MAD</span> / 200k
              </div>
            </div>

            <div className="w-28 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500"
                style={{ width: `${aeUsagePercent}%` }}
              ></div>
            </div>

            <span className="text-[10px] font-extrabold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {aeUsagePercent}% Plafond AE
            </span>
          </div>

          {/* Right Action: Studio Settings & Gemini AI Assistant */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenGeminiChat}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-[#E2B714] text-slate-950 hover:brightness-110 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
              <span>Assistant Gemini</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Paramètres</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[65px] bg-slate-950/95 backdrop-blur-2xl z-40 p-4 border-b border-slate-800 space-y-2 no-print">
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
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
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

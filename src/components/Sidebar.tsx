import React from 'react';
import {
  FileText,
  Users,
  TrendingUp,
  BrainCircuit,
  Film,
  Camera,
  Building2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { ProfileInfo, DocumentData, DirectRevenueItem } from '../types';

interface SidebarProps {
  activeModule: 'docs' | 'crm' | 'prod' | 'stats' | 'expert';
  setActiveModule: (mod: 'docs' | 'crm' | 'prod' | 'stats' | 'expert') => void;
  documents: DocumentData[];
  directRevenues?: DirectRevenueItem[];
  profile: ProfileInfo;
  onOpenGeminiChat?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  documents,
  directRevenues = [],
  profile,
  onOpenGeminiChat,
}) => {
  const menuItems = [
    {
      id: 'docs' as const,
      label: 'Générateur de Documents',
      sub: 'Devis, Factures & Acomptes',
      icon: FileText,
      badge: `${documents.length}`,
    },
    {
      id: 'stats' as const,
      label: 'Dashboard Financier',
      sub: 'KPIs, Marges & Revenus',
      icon: TrendingUp,
    },
    {
      id: 'crm' as const,
      label: 'Networking & CRM Visuel',
      sub: "Apporteurs d'affaires & Réseau",
      icon: Users,
    },
    {
      id: 'prod' as const,
      label: 'Studio Gear & Tournage',
      sub: 'Matériel, Équipe & Call Sheet',
      icon: Camera,
    },
    {
      id: 'expert' as const,
      label: 'Expert SARL & Stratégie',
      sub: 'Simulation & Conseil',
      icon: BrainCircuit,
      highlight: true,
    },
  ];

  return (
    <aside className="w-80 bg-[#080c14]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-5 space-y-6 shrink-0 hidden lg:block no-print shadow-2xl shadow-black/40 sticky top-24">
      {/* Filmmaker Studio Card */}
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/[0.08] p-4 rounded-2xl space-y-3 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-400 via-[#E2B714] to-amber-600 text-slate-950 font-black italic flex items-center justify-center rounded-2xl shrink-0 shadow-lg shadow-amber-500/25 text-lg border border-amber-300/40">
            F
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-white italic uppercase tracking-tight truncate">{profile.filmmakerName}</h3>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest truncate">{profile.title}</p>
          </div>
        </div>

        <div className="pt-2.5 border-t border-white/[0.08] text-[10px] font-mono text-slate-400 flex justify-between uppercase">
          <span>ICE: <span className="text-white font-bold">{profile.ice}</span></span>
          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30 shadow-sm">Actif B2B</span>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <div className="space-y-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 flex items-center justify-between">
          <span>Modules Studio</span>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`w-full p-3 rounded-2xl text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 border border-amber-500/40 text-white font-black shadow-lg shadow-amber-500/10'
                    : 'text-slate-400 hover:bg-slate-850/60 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl ${isActive ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' : 'bg-slate-800/80 text-slate-400'}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-bold uppercase tracking-tight truncate ${isActive ? 'text-amber-300' : 'text-slate-200'}`}>{item.label}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isActive ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {item.sub}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                      isActive ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Gemini AI Assistant Trigger Widget */}
      {onOpenGeminiChat && (
        <div
          onClick={onOpenGeminiChat}
          className="p-4 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-slate-900 border border-amber-500/35 rounded-2xl space-y-2 cursor-pointer hover:border-amber-400/70 transition-all group shadow-xl shadow-amber-500/10 active:scale-95"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <span className="text-xs font-black text-amber-300 uppercase italic">Assistant Gemini</span>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Pilotez vos Devis, Factures, CRM et Dépenses par simple prompt vocal ou écrit.
          </p>
        </div>
      )}

      {/* SARL Transition Checklist Widget */}
      <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/[0.08] space-y-3 shadow-inner">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Transition SARL
          </h4>
          <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 shadow-sm">
            SARL AU
          </span>
        </div>

        <ul className="space-y-2 text-[11px] text-slate-300">
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80"></div>
            <span className="font-medium">RC & ICE Validés</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/80"></div>
            <span className="font-medium">Identifiant Fiscal (IF)</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
            <span className="text-slate-500">Statuts Notariés</span>
          </li>
        </ul>

        <p className="text-[10px] text-slate-400 italic pt-2 border-t border-white/[0.08] leading-tight">
          Récupérez 20% de TVA sur vos investissements caméras & optiques.
        </p>
      </div>
    </aside>
  );
};

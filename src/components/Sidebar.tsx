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
      highlight: true,
    },
    {
      id: 'stats' as const,
      label: 'Dashboard Financier',
      sub: 'KPIs, Marges & Revenus',
      icon: TrendingUp,
    },
    {
      id: 'expert' as const,
      label: 'Expert SARL & Stratégie',
      sub: 'Simulation & Conseil',
      icon: BrainCircuit,
    },
  ];

  return (
    <aside className="w-80 bg-[#0A0A0B] border border-white/10 rounded-sm p-4 space-y-6 shrink-0 hidden lg:block no-print">
      {/* Filmmaker Studio Card */}
      <div className="bg-white/5 border border-white/10 p-4 rounded-sm space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E2B714] text-black font-black italic flex items-center justify-center rounded-sm shrink-0">
            F
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-white italic uppercase tracking-tight truncate">{profile.filmmakerName}</h3>
            <p className="text-[10px] text-[#E2B714] font-bold uppercase tracking-widest truncate">{profile.title}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-white/10 text-[10px] font-mono text-white/50 flex justify-between uppercase">
          <span>ICE: <span className="text-white font-bold">{profile.ice}</span></span>
          <span className="text-emerald-400 font-bold">Actif B2B</span>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <div className="space-y-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/30 px-2">
          Modules Studio
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`w-full p-3 rounded-sm text-left flex items-center justify-between transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white/10 border-l-2 border-[#E2B714] text-white font-black'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E2B714]' : 'text-white/40'}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-black uppercase tracking-tight truncate">{item.label}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isActive ? 'text-white/80' : 'text-white/40'
                      }`}
                    >
                      {item.sub}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold shrink-0 ${
                      isActive ? 'bg-[#E2B714] text-black' : 'bg-white/10 text-white/60'
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
          className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-900 border border-amber-500/30 rounded-xl space-y-2 cursor-pointer hover:border-amber-400/60 transition-all group shadow-lg shadow-amber-500/5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
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
      <div className="p-4 bg-white/5 rounded-sm border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#E2B714] flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Transition SARL
          </h4>
          <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm border border-emerald-500/20">
            SARL AU
          </span>
        </div>

        <ul className="space-y-2 text-[11px] text-white/70">
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="font-semibold">RC & ICE Validés</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#E2B714]"></div>
            <span className="font-semibold">Identifiant Fiscal (IF)</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
            <span className="text-white/40">Statuts Notariés</span>
          </li>
        </ul>

        <p className="text-[10px] text-white/40 italic pt-1 border-t border-white/5 leading-tight">
          Récupérez 20% de TVA sur vos investissements caméras & optiques.
        </p>
      </div>
    </aside>
  );
};

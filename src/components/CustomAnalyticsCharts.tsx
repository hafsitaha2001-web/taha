import React, { useState } from 'react';
import {
  BarChart3,
  Filter,
  PieChart as PieIcon,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  Users,
  Target,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Info,
  Sliders,
  Settings,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
  CartesianGrid,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { DocumentData, DirectRevenueItem, ClientData, ExpenseItem } from '../types';

export type LeftChartType =
  | 'monthly_target' // Barres comparatives : Réalisé vs Objectif / Seuil
  | 'pipeline_funnel' // Entonnoir de vente (Devis envoyés → Signés → Facturés → Encaissés)
  | 'cumulative_growth' // Courbe de CA cumulé vs Prévisionnel
  | 'time_profitability'; // Nuage de points (CA vs Heures/Jours estimés)

export type RightChartType =
  | 'pareto_clients' // Pareto 80/20 & Indice de dépendance client
  | 'recurring_vs_oneshot' // Graphique en anneau : Récurrent vs Ponctuel
  | 'heatmap_seasonality'; // Carte thermique (Client x Mois)

interface CustomAnalyticsChartsProps {
  documents: DocumentData[];
  directRevenues?: DirectRevenueItem[];
  clients: ClientData[];
  expenses?: ExpenseItem[];
}

const PALETTE = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#06B6D4', '#E11D48', '#64748B'];

export const CustomAnalyticsCharts: React.FC<CustomAnalyticsChartsProps> = ({
  documents,
  directRevenues = [],
  clients,
  expenses = [],
}) => {
  // Chart selection state with persistence
  const [leftChartType, setLeftChartType] = useState<LeftChartType>(() => {
    try {
      const saved = localStorage.getItem('cinemanage_chart_left_type');
      if (saved) return saved as LeftChartType;
    } catch (e) {
      console.error(e);
    }
    return 'monthly_target';
  });

  const [rightChartType, setRightChartType] = useState<RightChartType>(() => {
    try {
      const saved = localStorage.getItem('cinemanage_chart_right_type');
      if (saved) return saved as RightChartType;
    } catch (e) {
      console.error(e);
    }
    return 'pareto_clients';
  });

  // Target threshold state (customizable and stored in localStorage)
  const [monthlyTargetMAD, setMonthlyTargetMAD] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('cinemanage_monthly_target_mad');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch (e) {
      console.error(e);
    }
    return 30000;
  });

  const [breakEvenMAD, setBreakEvenMAD] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('cinemanage_breakeven_mad');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch (e) {
      console.error(e);
    }
    return 15000;
  });

  // Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [formMonthlyTarget, setFormMonthlyTarget] = useState<number>(monthlyTargetMAD);
  const [formBreakEven, setFormBreakEven] = useState<number>(breakEvenMAD);

  const handleOpenSettingsModal = () => {
    setFormMonthlyTarget(monthlyTargetMAD);
    setFormBreakEven(breakEvenMAD);
    setIsSettingsModalOpen(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const safeTarget = Math.max(1000, Number(formMonthlyTarget) || 30000);
    const safeBreakEven = Math.max(500, Number(formBreakEven) || 15000);

    setMonthlyTargetMAD(safeTarget);
    setBreakEvenMAD(safeBreakEven);

    try {
      localStorage.setItem('cinemanage_monthly_target_mad', safeTarget.toString());
      localStorage.setItem('cinemanage_breakeven_mad', safeBreakEven.toString());
    } catch (err) {
      console.error(err);
    }

    setIsSettingsModalOpen(false);
  };

  const handleResetDefaultSettings = () => {
    setFormMonthlyTarget(30000);
    setFormBreakEven(15000);
  };

  const applyPreset = (target: number, breakEven: number) => {
    setFormMonthlyTarget(target);
    setFormBreakEven(breakEven);
  };

  const saveLeftChartType = (type: LeftChartType) => {
    setLeftChartType(type);
    try {
      localStorage.setItem('cinemanage_chart_left_type', type);
    } catch (e) {
      console.error(e);
    }
  };

  const saveRightChartType = (type: RightChartType) => {
    setRightChartType(type);
    try {
      localStorage.setItem('cinemanage_chart_right_type', type);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper calculations
  const calculateDocHT = (doc: DocumentData) => {
    return doc.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discountPercent || 0) / 100), 0);
  };

  const calculateDocTTC = (doc: DocumentData) => {
    const ht = calculateDocHT(doc);
    return ht * (1 + (doc.tvaRate || 0) / 100);
  };

  const calculateDirectTotal = (r: DirectRevenueItem) => {
    return r.amountMAD * (r.occurrencesCount || 1);
  };

  // --- 1. DATA: Monthly Realized vs Target & Break-even ---
  const monthsLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  
  // Real dynamic aggregation by month from actual documents and direct revenues
  const monthlyComparativeData = monthsLabels.map((m, idx) => {
    // Check actual paid or accepted documents in this month
    const monthDocs = documents.filter((d) => {
      if (!d.date) return false;
      const dMonth = new Date(d.date).getMonth();
      return dMonth === idx && (d.status === 'paye' || d.status === 'accorde');
    });
    const docsSum = monthDocs.reduce((acc, d) => acc + calculateDocHT(d), 0);

    const directSum = directRevenues
      .filter((r) => {
        if (!r.date) return false;
        const rMonth = new Date(r.date).getMonth();
        return rMonth === idx && r.status === 'paye';
      })
      .reduce((acc, r) => acc + calculateDirectTotal(r), 0);

    const actualRealized = docsSum + directSum;

    return {
      month: m,
      Realise: actualRealized,
      Objectif: monthlyTargetMAD,
      SeuilRentabilite: breakEvenMAD,
      Ecart: actualRealized - monthlyTargetMAD,
    };
  });

  const monthsAboveBreakEven = monthlyComparativeData.filter((d) => d.Realise >= breakEvenMAD).length;
  const totalAnnualRealized = monthlyComparativeData.reduce((acc, d) => acc + d.Realise, 0);

  // --- 2. DATA: Commercial Sales Pipeline Funnel (Devis envoyés → Signés → Facturés → Encaissés) ---
  const quotesSent = documents.filter((d) => d.type === 'DEVIS' && d.status === 'envoye');
  const quotesSigned = documents.filter((d) => d.type === 'DEVIS' && (d.status === 'accorde' || d.status === 'paye'));
  const invoicesPending = documents.filter((d) => (d.type === 'FACTURE' || d.type === 'FACTURE_ACOMPTE') && (d.status === 'envoye' || d.status === 'retard'));
  const invoicesPaid = documents.filter((d) => d.status === 'paye');
  const directPaid = directRevenues.filter((r) => r.status === 'paye');

  const funnelValueQuotesSent = quotesSent.reduce((s, d) => s + calculateDocHT(d), 0);
  const funnelValueQuotesSigned = quotesSigned.reduce((s, d) => s + calculateDocHT(d), 0);
  const funnelValueInvoicesPending = invoicesPending.reduce((s, d) => s + calculateDocHT(d), 0);
  const funnelValueInvoicesPaid = invoicesPaid.reduce((s, d) => s + calculateDocHT(d), 0) + directPaid.reduce((s, r) => s + calculateDirectTotal(r), 0);

  const totalPipelinePotential = funnelValueQuotesSent + funnelValueQuotesSigned + funnelValueInvoicesPending + funnelValueInvoicesPaid;
  const quoteConversionRate =
    funnelValueQuotesSent + funnelValueQuotesSigned > 0
      ? Math.round((funnelValueQuotesSigned / (funnelValueQuotesSent + funnelValueQuotesSigned)) * 100)
      : 0;

  const funnelData = [
    {
      step: '1. Devis Envoyés (En négo)',
      count: quotesSent.length,
      valueMAD: funnelValueQuotesSent,
      color: '#64748B',
      desc: 'Propositions commerciales en attente de retour',
    },
    {
      step: '2. Devis Signés (Accord)',
      count: quotesSigned.length,
      valueMAD: funnelValueQuotesSigned,
      color: '#3B82F6',
      desc: 'Bons pour accord validés & tournage planifié',
    },
    {
      step: '3. Facturé en Attente',
      count: invoicesPending.length,
      valueMAD: funnelValueInvoicesPending,
      color: '#F59E0B',
      desc: 'Prestation livrée, règlement en cours (Loi 69-21)',
    },
    {
      step: '4. Encaissé Effectif (Cash)',
      count: invoicesPaid.length + directPaid.length,
      valueMAD: funnelValueInvoicesPaid,
      color: '#10B981',
      desc: 'Trésorerie disponible sur compte bancaire',
    },
  ];

  // --- 3. DATA: Cumulative Growth Trajectory (Cumul réel vs Prévisionnel) ---
  let cumReal = 0;
  let cumPrev = 0;
  const monthlyPrevTarget = monthlyTargetMAD;
  const cumulativeData = monthlyComparativeData.map((d) => {
    cumReal += d.Realise;
    cumPrev += monthlyPrevTarget;
    return {
      month: d.month,
      CumulRealise: cumReal,
      CumulPrevisionnel: cumPrev,
    };
  });

  // --- 4. DATA: Scatter Plot (CA Généré vs Heures/Jours Passés & Taux Journalier Réel) ---
  const scatterData = [
    ...documents.map((d, idx) => {
      const ca = calculateDocHT(d);
      const days = Math.max(1, Math.round(d.items.length * 1.5) || 1);
      const dayRate = days > 0 ? Math.round(ca / days) : ca;
      return {
        name: d.clientName || d.title || `Document #${d.number || idx + 1}`,
        caMAD: ca,
        daysCount: days,
        dailyRate: dayRate,
        type: d.type,
      };
    }),
    ...directRevenues.map((r) => {
      const ca = calculateDirectTotal(r);
      const days = r.frequency === 'weekly' ? 4 : r.frequency === 'monthly' ? 8 : 1;
      return {
        name: r.clientName || r.clientCompany || r.title,
        caMAD: ca,
        daysCount: days,
        dailyRate: days > 0 ? Math.round(ca / days) : ca,
        type: 'DIRECT',
      };
    }),
  ];

  // --- 5. DATA: Pareto 80/20 & Client Risk Index (Strictly User Clients) ---
  const clientRevenueMap = new Map<string, number>();
  clients.forEach((c) => clientRevenueMap.set(c.id, 0));

  documents.forEach((d) => {
    if (d.status === 'paye' || d.status === 'accorde') {
      if (d.clientId && clientRevenueMap.has(d.clientId)) {
        const prev = clientRevenueMap.get(d.clientId) || 0;
        clientRevenueMap.set(d.clientId, prev + calculateDocHT(d));
      }
    }
  });

  directRevenues.forEach((r) => {
    if (r.status === 'paye') {
      if (r.clientId && clientRevenueMap.has(r.clientId)) {
        const prev = clientRevenueMap.get(r.clientId) || 0;
        clientRevenueMap.set(r.clientId, prev + calculateDirectTotal(r));
      }
    }
  });

  const sortedRealClients = clients
    .map((c) => {
      const rev = clientRevenueMap.get(c.id) || 0;
      return {
        id: c.id,
        name: c.company || c.name,
        fullName: `${c.name}${c.company ? ` (${c.company})` : ''}`,
        revenue: rev,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const totalParetoRevenue = sortedRealClients.reduce((s, c) => s + c.revenue, 0);
  let paretoAccum = 0;
  const paretoData = sortedRealClients.map((c) => {
    paretoAccum += c.revenue;
    const sharePercent = totalParetoRevenue > 0 ? Math.round((c.revenue / totalParetoRevenue) * 100) : 0;
    const cumPercent = totalParetoRevenue > 0 ? Math.round((paretoAccum / totalParetoRevenue) * 100) : 0;
    return {
      name: c.name.length > 18 ? c.name.substring(0, 18) + '...' : c.name,
      fullName: c.fullName,
      revenue: c.revenue,
      sharePercent,
      cumPercent,
    };
  });

  const topClientShare = paretoData[0]?.sharePercent || 0;
  const isHighRisk = topClientShare >= 35 && totalParetoRevenue > 0;
  const top3Share = paretoData.slice(0, 3).reduce((acc, c) => acc + c.sharePercent, 0);

  // --- 6. DATA: Recurring vs One-Shot Donut (Strictly User Revenues) ---
  const recurringTotal = directRevenues
    .filter((r) => r.status === 'paye' && (r.frequency === 'weekly' || r.frequency === 'monthly'))
    .reduce((s, r) => s + calculateDirectTotal(r), 0);

  const oneShotTotal =
    documents.filter((d) => d.status === 'paye').reduce((s, d) => s + calculateDocHT(d), 0) +
    directRevenues.filter((r) => r.status === 'paye' && r.frequency === 'one_time').reduce((s, r) => s + calculateDirectTotal(r), 0);

  const totalRecVsOne = recurringTotal + oneShotTotal;
  const recurringPercent = totalRecVsOne > 0 ? Math.round((recurringTotal / totalRecVsOne) * 100) : 0;
  const oneShotPercent = totalRecVsOne > 0 ? 100 - recurringPercent : 0;

  const recurringData = [
    { name: 'Contrats Récurrents (Forfaits / Retainers)', value: recurringTotal, percent: recurringPercent, color: '#10B981' },
    { name: 'Missions Ponctuelles (One-Shot)', value: oneShotTotal, percent: oneShotPercent, color: '#F59E0B' },
  ];

  // --- 7. DATA: Heatmap Real Client x Month Seasonality ---
  const heatmapClients = sortedRealClients.slice(0, 6);
  const heatmapMonths = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  const getRealCellActivity = (clientId: string, monthIdx: number) => {
    const docTotal = documents
      .filter((d) => {
        if (d.clientId !== clientId || !d.date) return false;
        const dMonth = new Date(d.date).getMonth();
        return dMonth === monthIdx && (d.status === 'paye' || d.status === 'accorde');
      })
      .reduce((s, d) => s + calculateDocHT(d), 0);

    const directTotal = directRevenues
      .filter((r) => {
        if (r.clientId !== clientId || !r.date) return false;
        const rMonth = new Date(r.date).getMonth();
        return rMonth === monthIdx && r.status === 'paye';
      })
      .reduce((s, r) => s + calculateDirectTotal(r), 0);

    const total = docTotal + directTotal;
    if (total >= 20000) return { intensity: 3, label: 'Forte activité', amount: `${total.toLocaleString('fr-MA')} MAD` };
    if (total >= 8000) return { intensity: 2, label: 'Activité Moyenne', amount: `${total.toLocaleString('fr-MA')} MAD` };
    if (total > 0) return { intensity: 1, label: 'Activité Ponctuelle', amount: `${total.toLocaleString('fr-MA')} MAD` };
    return { intensity: 0, label: 'Aucune commande ce mois', amount: '0 MAD' };
  };

  return (
    <div className="space-y-6">
      {/* Dynamic 2-Column Custom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* =========================================================================
            LEFT COLUMN CHART: PILOTAGE MENSUEL & OBJECTIFS / TEMPS PASSÉ
        ========================================================================= */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-xl">
          {/* Header with Chart Type Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {leftChartType === 'monthly_target' && 'Barres Comparatives : Réalisé vs Objectif'}
                  {leftChartType === 'pipeline_funnel' && 'Entonnoir de Vente (Pipeline Commercial)'}
                  {leftChartType === 'cumulative_growth' && 'Courbe de Croissance : CA Cumulé vs Prévisionnel'}
                  {leftChartType === 'time_profitability' && 'Nuage de Points : Taux Journalier & Rentabilité'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {leftChartType === 'monthly_target' && 'Suivi mensuel de l’écart face au seuil de rentabilité minimum'}
                {leftChartType === 'pipeline_funnel' && 'Valeur du CA à chaque étape : Devis → Signés → Facturés → Encaissés'}
                {leftChartType === 'cumulative_growth' && 'Trajectoire de l’activité comparée au prévisionnel annuel'}
                {leftChartType === 'time_profitability' && 'Calcul du taux journalier moyen pour repérer les missions rentables'}
              </p>
            </div>

            {/* Controls: Chart Switcher + Setting Button */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenSettingsModal}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xl bg-slate-800/80 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/20 shadow-sm transition-all"
                title="Modifier l'Objectif Mensuel et le Seuil de Rentabilité Minimum"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Paramètres</span>
              </button>

              <div className="flex items-center gap-1 shrink-0 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => saveLeftChartType('monthly_target')}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                    leftChartType === 'monthly_target'
                      ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Barres Réalisé vs Objectif"
                >
                  📊 Objectifs
                </button>
                <button
                  type="button"
                  onClick={() => saveLeftChartType('pipeline_funnel')}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                    leftChartType === 'pipeline_funnel'
                      ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Entonnoir de vente"
                >
                  🌪️ Pipeline
                </button>
                <button
                  type="button"
                  onClick={() => saveLeftChartType('cumulative_growth')}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                    leftChartType === 'cumulative_growth'
                      ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="CA Cumulé Annuel"
                >
                  📈 Cumulé
                </button>
                <button
                  type="button"
                  onClick={() => saveLeftChartType('time_profitability')}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                    leftChartType === 'time_profitability'
                      ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Rentabilité & Taux journalier"
                >
                  ⏱️ Taux/Jour
                </button>
              </div>
            </div>
          </div>

          {/* LEFT CHART BODY RENDERING */}
          <div className="h-72 w-full pt-2">
            {/* OPTION 1: Monthly Target vs Realized & Break-even */}
            {leftChartType === 'monthly_target' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyComparativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090D16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val: any) => [`${Number(val).toLocaleString('fr-MA')} MAD`]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Realise" fill="#F59E0B" radius={[6, 6, 0, 0]} name="CA Réalisé Encaissé" barSize={18} />
                  <Line
                    type="monotone"
                    dataKey="Objectif"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    name={`Objectif Mensuel (${(monthlyTargetMAD).toLocaleString('fr-MA')} MAD)`}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="SeuilRentabilite"
                    stroke="#EC4899"
                    strokeWidth={2}
                    strokeDasharray="2 2"
                    name={`Seuil Rentabilité Min (${(breakEvenMAD).toLocaleString('fr-MA')} MAD)`}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {/* OPTION 2: Commercial Funnel (Devis envoyés → Signés → Facturés → Encaissés) */}
            {leftChartType === 'pipeline_funnel' && (
              <div className="h-full flex flex-col justify-center space-y-2.5 pr-2">
                {funnelData.map((stage, idx) => {
                  const maxVal = Math.max(...funnelData.map(f => f.valueMAD));
                  const widthPct = Math.max(25, Math.round((stage.valueMAD / maxVal) * 100));
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-white flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }}></span>
                          {stage.step}
                          <span className="text-[10px] text-slate-400 font-normal">({stage.count} dossiers)</span>
                        </span>
                        <span className="font-mono text-amber-300 font-black">
                          {stage.valueMAD.toLocaleString('fr-MA')} MAD
                        </span>
                      </div>

                      <div className="w-full bg-slate-950 h-6 rounded-lg p-0.5 border border-slate-800 flex items-center">
                        <div
                          className="h-full rounded-md transition-all duration-700 flex items-center justify-between px-2 text-[10px] font-bold text-slate-950"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: stage.color,
                          }}
                        >
                          <span className="truncate">{stage.desc}</span>
                          <span className="font-mono">{widthPct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* OPTION 3: Cumulative Growth Curve (Trajectoire vs Prévisionnel) */}
            {leftChartType === 'cumulative_growth' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeData}>
                  <defs>
                    <linearGradient id="colorCumReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090D16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val: any) => [`${Number(val).toLocaleString('fr-MA')} MAD`]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="CumulRealise" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorCumReal)" name="CA Cumulé Réel" />
                  <Line type="monotone" dataKey="CumulPrevisionnel" stroke="#3B82F6" strokeWidth={2} strokeDasharray="4 4" name="Trajectoire Prévisionnelle" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* OPTION 4: Scatter Plot (CA vs Jours Estimés & Taux Journalier Réel) */}
            {leftChartType === 'time_profitability' && (
              scatterData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl space-y-2">
                  <Clock className="w-8 h-8 text-amber-400/60" />
                  <div className="text-sm font-bold text-white">Aucun projet enregistré</div>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Ajoutez vos devis, factures ou forfaits directs pour visualiser votre rentabilité et taux journalier réel (MAD/jour).
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis type="number" dataKey="daysCount" name="Jours Passés" unit=" j" stroke="#64748B" fontSize={11} domain={[0, 'dataMax + 2']} />
                    <YAxis type="number" dataKey="caMAD" name="CA Projet" unit=" MAD" stroke="#64748B" fontSize={11} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                              <div className="font-bold text-white">{data.name}</div>
                              <div className="text-amber-400 font-mono">CA : {data.caMAD.toLocaleString('fr-MA')} MAD</div>
                              <div className="text-slate-300">Durée estimée : {data.daysCount} jour(s)</div>
                              <div className="text-emerald-400 font-mono font-bold pt-1 border-t border-slate-800">
                                Taux Réel : {data.dailyRate.toLocaleString('fr-MA')} MAD / jour
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter name="Missions Réelles" data={scatterData} fill="#F59E0B">
                      {scatterData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.dailyRate >= 7000 ? '#10B981' : entry.dailyRate >= 4500 ? '#F59E0B' : '#EC4899'}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              )
            )}
          </div>

          {/* Bottom Insights Footer */}
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            {leftChartType === 'monthly_target' && (
              <>
                <span className={monthsAboveBreakEven > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  ✓ {monthsAboveBreakEven} mois au-dessus du seuil ({breakEvenMAD.toLocaleString('fr-MA')} MAD)
                </span>
                <button
                  type="button"
                  onClick={handleOpenSettingsModal}
                  className="text-amber-400 hover:text-amber-300 font-bold hover:underline flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Modifier les seuils</span>
                </button>
              </>
            )}
            {leftChartType === 'pipeline_funnel' && (
              <>
                <span className="text-sky-400 font-bold">⚡ Taux conversion devis : {quoteConversionRate}%</span>
                <span>Encaissé total : <strong className="text-emerald-400 font-mono">{funnelValueInvoicesPaid.toLocaleString('fr-MA')} MAD</strong></span>
              </>
            )}
            {leftChartType === 'cumulative_growth' && (
              <>
                <span className={cumReal >= cumPrev ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {cumReal >= cumPrev ? "🚀 En avance sur l'objectif prévisionnel" : "📊 Progression en cours vers l'objectif"}
                </span>
                <span>Total réalisé : <strong className="text-white font-mono">{totalAnnualRealized.toLocaleString('fr-MA')} MAD</strong></span>
              </>
            )}
            {leftChartType === 'time_profitability' && (
              <>
                <span className="text-emerald-400 font-bold">🟢 Vert : ≥7 000 MAD/j • 🟡 Jaune : 4.5k-7k • 🔴 Rose : &lt;4.5k</span>
              </>
            )}
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN CHART: STABILITÉ & RISQUE CLIENT / SAISONNALITÉ
        ========================================================================= */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-xl">
          {/* Header with Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {rightChartType === 'pareto_clients' && 'Diagramme de Pareto (Règle des 80/20 & Risque)'}
                  {rightChartType === 'recurring_vs_oneshot' && 'Graphique en Anneau (Récurrent vs Ponctuel)'}
                  {rightChartType === 'heatmap_seasonality' && 'Carte Thermique (Saisonnalité Client × Mois)'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {rightChartType === 'pareto_clients' && 'Contrôle de dépendance : alerte si 1 client dépasse 35% du CA'}
                {rightChartType === 'recurring_vs_oneshot' && 'Part de CA sécurisée par des forfaits mensuels vs tournages ponctuels'}
                {rightChartType === 'heatmap_seasonality' && 'Visualisez les périodes creuses et les mois d’affluence par compte'}
              </p>
            </div>

            {/* Customizer Dropdown / Selector */}
            <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => saveRightChartType('pareto_clients')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  rightChartType === 'pareto_clients'
                    ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Pareto & Concentration client"
              >
                ⚖️ Pareto 80/20
              </button>
              <button
                type="button"
                onClick={() => saveRightChartType('recurring_vs_oneshot')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  rightChartType === 'recurring_vs_oneshot'
                    ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Récurrent vs Ponctuel"
              >
                🔄 Récurrent
              </button>
              <button
                type="button"
                onClick={() => saveRightChartType('heatmap_seasonality')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  rightChartType === 'heatmap_seasonality'
                    ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Carte Thermique Saisonnière"
              >
                🗓️ Heatmap
              </button>
            </div>
          </div>

          {/* RIGHT CHART BODY RENDERING */}
          <div className="h-72 w-full pt-2">
            {/* OPTION 1: Pareto 80/20 & Concentration Risk */}
            {rightChartType === 'pareto_clients' && (
              clients.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl space-y-2">
                  <Users className="w-8 h-8 text-amber-400/60" />
                  <div className="text-sm font-bold text-white">Aucun client enregistré</div>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Ajoutez vos clients réels dans le module CRM pour analyser la répartition 80/20 et mesurer la dépendance financière.
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-between">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={paretoData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                        <YAxis yAxisId="left" stroke="#64748B" fontSize={10} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#10B981" fontSize={10} domain={[0, 100]} unit="%" tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#090D16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                          formatter={(val: any, name: string) => [
                            name.includes('Cumulé') ? `${val}%` : `${Number(val).toLocaleString('fr-MA')} MAD`,
                            name
                          ]}
                        />
                        <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="CA Généré (MAD)" barSize={20} />
                        <Line yAxisId="right" type="monotone" dataKey="cumPercent" stroke="#10B981" strokeWidth={2.5} name="% Cumulé (Pareto)" dot={{ fill: '#10B981', r: 3 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pareto Risk Box */}
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    totalParetoRevenue === 0
                      ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                      : isHighRisk
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                      : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {totalParetoRevenue === 0 ? (
                        <Info className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : isHighRisk ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <div>
                        <strong className="block font-bold">
                          {totalParetoRevenue === 0
                            ? 'En attente de premiers règlements'
                            : isHighRisk
                            ? 'Alerte Dépendance Client Élevée'
                            : 'Portefeuille Client Équilibré & Diversifié'}
                        </strong>
                        <span className="text-[10.5px] opacity-80">
                          {totalParetoRevenue === 0
                            ? 'Enregistrez des encaissements (factures ou forfaits directs) pour activer l’indice de concentration.'
                            : isHighRisk
                            ? `Le 1er client représente ${topClientShare}% de vos revenus (seuil critique : 35%). Diversifiez vos canaux.`
                            : `Aucun client unique ne monopolise plus de 30% du CA total. Votre structure est sécurisée.`}
                        </span>
                      </div>
                    </div>
                    {totalParetoRevenue > 0 && (
                      <span className="text-xs font-mono font-black shrink-0 px-2 py-1 bg-slate-900/80 rounded-lg">
                        Top 1 : {topClientShare}%
                      </span>
                    )}
                  </div>
                </div>
              )
            )}

            {/* OPTION 2: Recurring vs One-Shot Donut */}
            {rightChartType === 'recurring_vs_oneshot' && (
              totalRecVsOne === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl space-y-2">
                  <Activity className="w-8 h-8 text-amber-400/60" />
                  <div className="text-sm font-bold text-white">Aucun revenu encaissé pour l'instant</div>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Ajoutez vos forfaits récurrents (Reels, abonnements) ou vos factures réglées pour comparer la part de revenus stables vs ponctuels.
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="h-56 w-56 relative flex items-center justify-center shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={recurringData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={6}
                          dataKey="value"
                        >
                          {recurringData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#090D16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                          formatter={(val: any) => [`${Number(val).toLocaleString('fr-MA')} MAD`]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-slate-400 font-bold">Sécurisé</span>
                      <span className="text-xl font-mono font-black text-emerald-400">{recurringPercent}%</span>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Récurrent Garanti
                        </span>
                        <span className="font-mono font-black text-white">{recurringTotal.toLocaleString('fr-MA')} MAD</span>
                      </div>
                      <p className="text-[10.5px] text-slate-400">Forfaits Reels hebdomadaires & contrats mensuels</p>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Missions Ponctuelles
                        </span>
                        <span className="font-mono font-black text-white">{oneShotTotal.toLocaleString('fr-MA')} MAD</span>
                      </div>
                      <p className="text-[10.5px] text-slate-400">Films corporate, spots pub, captations événementielles</p>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* OPTION 3: Heatmap Client x Mois */}
            {rightChartType === 'heatmap_seasonality' && (
              heatmapClients.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl space-y-2">
                  <Calendar className="w-8 h-8 text-amber-400/60" />
                  <div className="text-sm font-bold text-white">Aucun client enregistré</div>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Ajoutez vos clients pour visualiser la répartition saisonnière réelle de vos missions mois par mois.
                  </p>
                </div>
              ) : (
                <div className="h-full overflow-y-auto pr-1 space-y-2">
                  <div className="grid grid-cols-13 gap-1 text-[9px] font-bold text-slate-400 text-center pb-1 border-b border-slate-800">
                    <div className="text-left truncate col-span-3 text-slate-300">Client / Compte</div>
                    {heatmapMonths.map((m) => (
                      <div key={m} className="col-span-1">{m.substring(0, 1)}</div>
                    ))}
                  </div>

                  {heatmapClients.map((client) => (
                    <div key={client.id} className="grid grid-cols-13 gap-1 items-center">
                      <div className="col-span-3 text-[10px] font-bold text-slate-200 truncate" title={client.fullName || client.name}>
                        {client.name}
                      </div>
                      {heatmapMonths.map((_, mIdx) => {
                        const cell = getRealCellActivity(client.id, mIdx);
                        return (
                          <div
                            key={mIdx}
                            className={`col-span-1 h-6 rounded flex items-center justify-center transition-all cursor-pointer border ${
                              cell.intensity === 3
                                ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold text-[8px]'
                                : cell.intensity === 2
                                ? 'bg-amber-600/60 border-amber-500/40 text-white text-[8px]'
                                : cell.intensity === 1
                                ? 'bg-amber-950/40 border-amber-800/40'
                                : 'bg-slate-950 border-slate-800/60'
                            }`}
                            title={`${client.name} - ${heatmapMonths[mIdx]} : ${cell.label} (${cell.amount})`}
                          >
                            {cell.intensity >= 2 ? '●' : ''}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Heatmap Legend */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                    <span className="font-semibold">Niveau d'intensité :</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-950 border border-slate-800"></span> 0 (Creux)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-950 border border-amber-800"></span> 1 (&gt;0)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-600"></span> 2 (&gt;8k)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500"></span> 3 (&gt;20k)</span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Bottom Insights Footer */}
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            {rightChartType === 'pareto_clients' && (
              <>
                <span>Top 3 clients = <strong className="text-amber-300 font-mono">{top3Share}%</strong> du CA</span>
                <span className="text-sky-400">
                  {totalParetoRevenue > 0
                    ? isHighRisk ? 'Conseil : Développer 2 nouveaux comptes B2B' : 'Structure saine et diversifiée'
                    : 'En attente de règlements clients'}
                </span>
              </>
            )}
            {rightChartType === 'recurring_vs_oneshot' && (
              <>
                <span className={recurringPercent >= 30 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  Objectif sain : ≥30% en récurrent ({recurringPercent}% actuel)
                </span>
                <span>{recurringPercent >= 30 ? 'Trésorerie prévisible' : 'Opportunité de proposer des forfaits mensuels'}</span>
              </>
            )}
            {rightChartType === 'heatmap_seasonality' && (
              <>
                <span className="text-amber-400 font-bold">
                  {heatmapClients.length > 0 ? `${heatmapClients.length} client(s) suivi(s) au fil des mois` : 'Saisonnalité'}
                </span>
                <span>Suivi réel par client</span>
              </>
            )}
          </div>
        </div>

      </div>

      {/* =========================================================================
          SETTINGS MODAL: OBJECTIF MENSUEL & SEUIL DE RENTABILITÉ MINIMUM
      ========================================================================= */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Paramètres des Objectifs & Rentabilité</h3>
                  <p className="text-xs text-slate-400">Personnalisez vos cibles mensuelles et seuils de survie financière</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveSettings} className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Presets Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  💡 Raccourcis Profils Prédéfinis
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset(20000, 10000)}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-amber-500/40 text-left transition-all text-xs group"
                  >
                    <span className="block font-bold text-slate-200 group-hover:text-amber-400">🎯 Solo Débutant</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Obj: 20k • Seuil: 10k</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(30000, 15000)}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-amber-500/40 text-left transition-all text-xs group"
                  >
                    <span className="block font-bold text-slate-200 group-hover:text-amber-400">🎬 Vidéaste Pro</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Obj: 30k • Seuil: 15k</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(50000, 22000)}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-amber-500/40 text-left transition-all text-xs group"
                  >
                    <span className="block font-bold text-slate-200 group-hover:text-amber-400">🚀 Studio Croissance</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Obj: 50k • Seuil: 22k</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(16660, 10000)}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-amber-500/40 text-left transition-all text-xs group"
                  >
                    <span className="block font-bold text-slate-200 group-hover:text-amber-400">⚖️ Plafond AE (200k)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Obj: 16.6k • Seuil: 10k</span>
                  </button>
                </div>
              </div>

              {/* Main Inputs */}
              <div className="space-y-4 pt-2">
                {/* 1. Objectif Mensuel */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      Objectif Mensuel de Chiffre d'Affaires (MAD)
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      = {(formMonthlyTarget * 12).toLocaleString('fr-MA')} MAD / an
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="500"
                      min="1000"
                      max="1000000"
                      value={formMonthlyTarget}
                      onChange={(e) => setFormMonthlyTarget(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-bold font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                      MAD / mois
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Niveau de revenu mensuel visé pour développer votre studio et assurer une marge confortable.
                  </p>
                </div>

                {/* 2. Seuil de Rentabilité Min */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Seuil de Rentabilité Minimum (MAD)
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      Charges fixes + Rémunération plancher
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="500"
                      min="500"
                      max="500000"
                      value={formBreakEven}
                      onChange={(e) => setFormBreakEven(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-bold font-mono text-white focus:outline-none focus:border-rose-500 transition-colors"
                      required
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                      MAD / mois
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Montant sous lequel le studio est en déficit ou en zone de danger financier sur le mois.
                  </p>
                </div>
              </div>

              {/* Dynamic Feedback Card */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="text-slate-300 font-bold">Marge de Sécurité Mensuelle :</div>
                  <div className="text-[11px] text-slate-400">Différence entre Objectif et Seuil vital</div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black font-mono text-emerald-400">
                    +{(formMonthlyTarget - formBreakEven).toLocaleString('fr-MA')} MAD
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {formMonthlyTarget > 0 ? Math.round(((formMonthlyTarget - formBreakEven) / formMonthlyTarget) * 100) : 0}% de coussin
                  </span>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetDefaultSettings}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réinitialiser par défaut (30k / 15k)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Enregistrer les Paramètres</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

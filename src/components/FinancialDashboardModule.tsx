import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  BarChart3,
  Percent,
  Download,
  Briefcase,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { DocumentData, ExpenseItem, ClientData } from '../types';

interface FinancialDashboardModuleProps {
  documents: DocumentData[];
  expenses: ExpenseItem[];
  clients: ClientData[];
}

const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#64748B'];

export const FinancialDashboardModule: React.FC<FinancialDashboardModuleProps> = ({
  documents,
  expenses,
  clients,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'ALL' | '2026' | 'MONTH'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Configurable Chart Toggles
  const [showAEGauge, setShowAEGauge] = useState<boolean>(true);
  const [showMonthlyChart, setShowMonthlyChart] = useState<boolean>(true);
  const [showClientChart, setShowClientChart] = useState<boolean>(true);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState<boolean>(true);

  // Filter valid revenue documents (exclude brouillon or canceled)
  const validDocs = documents.filter((d) => d.status !== 'brouillon');

  // Total CA Calculation (TTC and HT)
  const calculateDocTTC = (doc: DocumentData) => {
    const totalHT = doc.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discountPercent || 0) / 100), 0);
    return totalHT * (1 + doc.tvaRate / 100);
  };

  const calculateDocHT = (doc: DocumentData) => {
    return doc.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discountPercent || 0) / 100), 0);
  };

  // KPIs
  const totalRevenueTTC = validDocs.reduce((sum, doc) => sum + calculateDocTTC(doc), 0);
  const totalRevenueHT = validDocs.reduce((sum, doc) => sum + calculateDocHT(doc), 0);

  const paidRevenueTTC = validDocs
    .filter((d) => d.status === 'paye')
    .reduce((sum, doc) => sum + calculateDocTTC(doc), 0);

  const pendingRevenueTTC = validDocs
    .filter((d) => d.status === 'envoye' || d.status === 'accorde')
    .reduce((sum, doc) => sum + calculateDocTTC(doc), 0);

  const overdueRevenueTTC = validDocs
    .filter((d) => d.status === 'retard')
    .reduce((sum, doc) => sum + calculateDocTTC(doc), 0);

  const totalExpensesMAD = expenses.reduce((sum, e) => sum + e.amountMAD, 0);
  const netProfitMAD = totalRevenueHT - totalExpensesMAD;
  const netMarginPercent = totalRevenueHT > 0 ? Math.round((netProfitMAD / totalRevenueHT) * 100) : 0;

  const projectCount = validDocs.length;
  const avgProjectTicket = projectCount > 0 ? Math.round(totalRevenueHT / projectCount) : 0;

  // Auto-Entrepreneur Ceiling (Plafond 200,000 MAD/an pour prestations de services au Maroc)
  const aeCeilingMAD = 200000;
  const aeUsagePercent = Math.min(100, Math.round((totalRevenueHT / aeCeilingMAD) * 100));

  // Monthly Revenue Chart Data
  const monthlyData = [
    { month: 'Jan', CA: 15000, Dépenses: 3000 },
    { month: 'Fév', CA: 22000, Dépenses: 4000 },
    { month: 'Mar', CA: 35000, Dépenses: 8000 },
    { month: 'Avr', CA: 28000, Dépenses: 5000 },
    { month: 'Mai', CA: 45000, Dépenses: 16500 },
    { month: 'Juin', CA: 38000, Dépenses: 6000 },
    { month: 'Juil', CA: 26500, Dépenses: 4000 },
  ];

  // Revenue by Client Donut Chart Data
  const clientRevenueData = clients.map((client) => {
    const clientDocs = validDocs.filter((d) => d.clientId === client.id);
    const value = clientDocs.reduce((sum, doc) => sum + calculateDocHT(doc), 0);
    return {
      name: client.company || client.name,
      value,
    };
  }).filter((c) => c.value > 0);

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-1">
            <TrendingUp className="w-4 h-4" /> Module 3 • Pilotage Financier & Indicateurs KPIs
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Dashboard Financier & Stats</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Suivi du chiffre d'affaires, calcul des marges nettes et contrôle du plafond Auto-Entrepreneur (200k MAD).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-bold px-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-amber-400" /> Graphiques :
            </span>
            <label className="flex items-center gap-1.5 text-slate-300 font-bold cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showAEGauge}
                onChange={(e) => setShowAEGauge(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              Plafond AE
            </label>
            <label className="flex items-center gap-1.5 text-slate-300 font-bold cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showMonthlyChart}
                onChange={(e) => setShowMonthlyChart(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              Évolution CA
            </label>
            <label className="flex items-center gap-1.5 text-slate-300 font-bold cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showClientChart}
                onChange={(e) => setShowClientChart(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              Répartition Clients
            </label>
            <label className="flex items-center gap-1.5 text-slate-300 font-bold cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showTaxBreakdown}
                onChange={(e) => setShowTaxBreakdown(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              TVA & Charges
            </label>
          </div>

          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs font-bold">
            {['ALL', '2026', 'MONTH'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p as any)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedPeriod === p ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'ALL' ? 'Tout' : p === '2026' ? 'Année 2026' : 'Mois en cours'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Auto-Entrepreneur Ceiling Progress Banner */}
      {showAEGauge && (
        <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 p-5 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" /> Seuil de Régime Auto-Entrepreneur Maroc (Prestations)
              </div>
              <h3 className="text-xl font-extrabold text-white">
                {totalRevenueHT.toLocaleString('fr-MA')} MAD{' '}
                <span className="text-xs text-slate-400 font-normal">
                  / {aeCeilingMAD.toLocaleString('fr-MA')} MAD Plafond Légal
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                {aeUsagePercent >= 80
                  ? '⚠️ Attention : Vous approchez du plafond AE (200k MAD). Le passage en SARL est fortement préconisé !'
                  : 'Plafond AE respecté. Suivez votre progression pour anticiper la création de votre SARL.'}
              </p>
            </div>

            <div className="w-full md:w-64 space-y-1 shrink-0">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Progression</span>
                <span className="text-amber-400 font-mono font-extrabold">{aeUsagePercent}%</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-1000 ${
                    aeUsagePercent >= 80
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                  }`}
                  style={{ width: `${aeUsagePercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">CA Total Réalisé</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {totalRevenueTTC.toLocaleString('fr-MA')} MAD
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +24%
            </span>{' '}
            vs trimestre précédent
          </div>
        </div>

        {/* KPI 2: Net Margin */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Marge Nette Estimée</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {netProfitMAD.toLocaleString('fr-MA')} MAD
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Taux de marge nette: <strong className="text-emerald-300 font-bold">{netMarginPercent}%</strong>
          </div>
        </div>

        {/* KPI 3: Projects Count & Ticket */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Projets Réalisés</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {projectCount} <span className="text-xs text-slate-400 font-normal">projets</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Panier Moyen: <strong className="text-sky-300 font-bold">{avgProjectTicket.toLocaleString('fr-MA')} MAD</strong>
          </div>
        </div>

        {/* KPI 4: Pending & Overdue Invoices */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">En Attente & Retards</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            {(pendingRevenueTTC + overdueRevenueTTC).toLocaleString('fr-MA')} MAD
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-amber-300">En attente: {pendingRevenueTTC.toLocaleString('fr-MA')}</span>
            <span className="text-rose-400 font-bold">Retard: {overdueRevenueTTC.toLocaleString('fr-MA')}</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue Bar / Area Chart */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" /> Évolution du Chiffre d'Affaires Mensuel
              </h3>
              <p className="text-xs text-slate-400">Comparatif des revenus HT encaissés et des dépenses de tournage (MAD)</p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorCa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090D16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="CA" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorCa)" name="Chiffre d'Affaires (MAD)" />
                <Area type="monotone" dataKey="Dépenses" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDepenses)" name="Dépenses Tournage" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Distribution by Client Donut Chart */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-400" /> Répartition du CA par Client
            </h3>
            <p className="text-xs text-slate-400">Concentration des revenus par agence & compte</p>
          </div>

          <div className="h-60 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={clientRevenueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {clientRevenueData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#090D16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend list */}
          <div className="space-y-1.5 text-xs">
            {clientRevenueData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-amber-400 shrink-0">{item.value.toLocaleString('fr-MA')} MAD</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chronological Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Tableau Récapitulatif des Revenues & Facturations</h3>
            <p className="text-xs text-slate-400">Historique chronologique des prestations audiovisuelles</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Filtrer par statut:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs font-bold text-amber-300 p-2 rounded-xl"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="paye">Payé</option>
              <option value="envoye">En attente (Envoyé)</option>
              <option value="retard">En retard</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-bold">Document</th>
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold">Client / Entreprise</th>
                <th className="py-3 px-4 font-bold text-right">Total HT (MAD)</th>
                <th className="py-3 px-4 font-bold text-right">TVA 20%</th>
                <th className="py-3 px-4 font-bold text-right">Total TTC (MAD)</th>
                <th className="py-3 px-4 font-bold text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {validDocs
                .filter((d) => statusFilter === 'ALL' || d.status === statusFilter)
                .map((doc) => {
                  const ht = calculateDocHT(doc);
                  const ttc = calculateDocTTC(doc);
                  const tva = ttc - ht;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold font-mono text-amber-400">{doc.number}</td>
                      <td className="py-3.5 px-4 text-slate-400">{doc.date}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{doc.clientName}</div>
                        <div className="text-[10px] text-slate-400">{doc.clientCompany}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">{ht.toLocaleString('fr-MA')} MAD</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">{tva.toLocaleString('fr-MA')} MAD</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {ttc.toLocaleString('fr-MA')} MAD
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {doc.status === 'paye' ? (
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold border border-emerald-500/30">
                            Payé
                          </span>
                        ) : doc.status === 'retard' ? (
                          <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 rounded-lg font-bold border border-rose-500/30">
                            En Retard
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-sky-500/20 text-sky-400 rounded-lg font-bold border border-sky-500/30">
                            En Attente
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

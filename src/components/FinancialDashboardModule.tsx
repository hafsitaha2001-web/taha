import React, { useState, useEffect } from 'react';
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
  Briefcase,
  ShieldAlert,
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Repeat,
  Wallet,
  Layers,
  FileText,
  Building,
  User,
  X,
  Check,
  Target,
  Flag,
  Award,
  Sliders,
  Zap,
  HelpCircle,
  Settings
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
import {
  DocumentData,
  ExpenseItem,
  ClientData,
  DirectRevenueItem,
  DirectRevenueFrequency,
  DirectRevenueCategory,
  DirectPaymentMethod,
  FinancialGoalConfig,
  FinancialGoalType,
  FinancialMilestone
} from '../types';

interface FinancialDashboardModuleProps {
  documents: DocumentData[];
  directRevenues?: DirectRevenueItem[];
  expenses: ExpenseItem[];
  clients: ClientData[];
  onSaveDirectRevenue?: (item: DirectRevenueItem) => void;
  onDeleteDirectRevenue?: (id: string) => void;
}

const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#06B6D4', '#64748B'];

const DEFAULT_GOALS: FinancialGoalConfig[] = [
  {
    id: 'goal-ae-200k',
    type: 'ae_legal',
    title: '🏛️ Seuil Légal Auto-Entrepreneur (200 000 MAD)',
    targetAmountMAD: 200000,
    startingBalanceMAD: 0,
    categoryNote: 'Plafond légal marocain pour les prestations de services avant basculement obligatoire en SARL AU.',
    calculationScope: 'all',
    milestones: [
      { id: 'm-1', title: 'Palier Sécurité (25%)', amountMAD: 50000, rewardNote: 'Démarrage validé' },
      { id: 'm-2', title: 'Mi-Parcours (50%)', amountMAD: 100000, rewardNote: 'Rythme annuel atteint' },
      { id: 'm-3', title: 'Alerte Fiscalité (75%)', amountMAD: 150000, rewardNote: 'Préparer passage SARL' },
      { id: 'm-4', title: 'Plafond Légal (100%)', amountMAD: 200000, rewardNote: 'Limite légale AE atteinte' },
    ],
  },
  {
    id: 'goal-director-350k',
    type: 'personal_annual',
    title: '🎯 Objectif Annuel Réalisateur 2026 (350 000 MAD)',
    targetAmountMAD: 350000,
    startingBalanceMAD: 0,
    categoryNote: 'Objectif de chiffre d\'affaires brut pour consolider le studio, la trésorerie et le salaire personnel.',
    calculationScope: 'all',
    milestones: [
      { id: 'm-1', title: 'Cap 100k MAD', amountMAD: 100000, rewardNote: 'Moyenne 30k/mois' },
      { id: 'm-2', title: 'Cap 200k MAD', amountMAD: 200000, rewardNote: 'Rentabilité confortable' },
      { id: 'm-3', title: 'Cap 300k MAD', amountMAD: 300000, rewardNote: 'Consolidation studio' },
      { id: 'm-4', title: 'Objectif 350k 🎉', amountMAD: 350000, rewardNote: 'Année record !' },
    ],
  },
  {
    id: 'goal-fx6-gear',
    type: 'gear_investment',
    title: '🎬 Achat Pack Caméra Cinéma Sony FX6 (75 000 MAD)',
    targetAmountMAD: 75000,
    startingBalanceMAD: 0,
    categoryNote: 'Financement du boîtier Sony FX6 + Optiques GM 24-70mm f/2.8 + V-Mount + Gimbal DJI RS3 Pro.',
    calculationScope: 'all',
    milestones: [
      { id: 'm-1', title: 'Boîtier FX6 Nu (45k)', amountMAD: 45000, rewardNote: 'Caméra validée' },
      { id: 'm-2', title: 'Optique GM 24-70 (20k)', amountMAD: 65000, rewardNote: 'Objectif principal' },
      { id: 'm-3', title: 'Accessoires & Gimbal (10k)', amountMAD: 75000, rewardNote: 'Setup cinéma complet' },
    ],
  },
  {
    id: 'goal-monthly-35k',
    type: 'personal_monthly',
    title: '📅 Objectif CA Mensuel Moyen (35 000 MAD / mois)',
    targetAmountMAD: 35000,
    startingBalanceMAD: 0,
    categoryNote: 'Moyenne mensuelle visée en combinant forfaits récurrents et tournages ponctuels.',
    calculationScope: 'all',
    milestones: [
      { id: 'm-1', title: 'Seuil Fixe (15k)', amountMAD: 15000, rewardNote: 'Charges couvertes' },
      { id: 'm-2', title: 'Mois Rentable (25k)', amountMAD: 25000, rewardNote: 'Bénéfice net positif' },
      { id: 'm-3', title: 'Mois Record (35k)', amountMAD: 35000, rewardNote: 'Performance max' },
    ],
  },
];

export const FinancialDashboardModule: React.FC<FinancialDashboardModuleProps> = ({
  documents,
  directRevenues = [],
  expenses,
  clients,
  onSaveDirectRevenue,
  onDeleteDirectRevenue,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'direct_revenues' | 'documents'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'ALL' | '2026' | 'MONTH'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Configurable Chart Toggles
  const [showAEGauge, setShowAEGauge] = useState<boolean>(true);
  const [showMonthlyChart, setShowMonthlyChart] = useState<boolean>(true);
  const [showClientChart, setShowClientChart] = useState<boolean>(true);

  // Custom Financial Goals & Cumulative CA State
  const [customGoals, setCustomGoals] = useState<FinancialGoalConfig[]>(() => {
    try {
      const saved = localStorage.getItem('cinemanage_custom_goals');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_GOALS;
  });

  const [activeGoalId, setActiveGoalId] = useState<string>(() => {
    try {
      return localStorage.getItem('cinemanage_active_goal_id') || 'goal-ae-200k';
    } catch {
      return 'goal-ae-200k';
    }
  });

  // Goal Customizer Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalFormType, setGoalFormType] = useState<FinancialGoalType>('personal_annual');
  const [goalFormTitle, setGoalFormTitle] = useState<string>('🎯 Objectif Annuel 2026');
  const [goalFormTargetAmountMAD, setGoalFormTargetAmountMAD] = useState<number>(300000);
  const [goalFormStartingBalanceMAD, setGoalFormStartingBalanceMAD] = useState<number>(0);
  const [goalFormDeadlineDate, setGoalFormDeadlineDate] = useState<string>('');
  const [goalFormCalculationScope, setGoalFormCalculationScope] = useState<'all' | 'official_only' | 'direct_only'>('all');
  const [goalFormCategoryNote, setGoalFormCategoryNote] = useState<string>('');
  const [goalFormMilestones, setGoalFormMilestones] = useState<FinancialMilestone[]>([
    { id: 'm1', title: 'Palier 1 (25%)', amountMAD: 75000, rewardNote: '1er quart' },
    { id: 'm2', title: 'Palier 2 (50%)', amountMAD: 150000, rewardNote: 'Mi-parcours' },
    { id: 'm3', title: 'Palier 3 (75%)', amountMAD: 225000, rewardNote: 'Dernière ligne droite' },
    { id: 'm4', title: 'Objectif Atteint (100%)', amountMAD: 300000, rewardNote: 'Victoire !' },
  ]);

  // Persist Goals to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cinemanage_custom_goals', JSON.stringify(customGoals));
    } catch {
      // ignore
    }
  }, [customGoals]);

  useEffect(() => {
    try {
      localStorage.setItem('cinemanage_active_goal_id', activeGoalId);
    } catch {
      // ignore
    }
  }, [activeGoalId]);

  // Direct Revenue Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formClientId, setFormClientId] = useState<string>('');
  const [formClientName, setFormClientName] = useState<string>('');
  const [formClientCompany, setFormClientCompany] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<DirectRevenueCategory>('Gestion Réseaux / Reels');
  const [formAmountMAD, setFormAmountMAD] = useState<number>(2500);
  const [formFrequency, setFormFrequency] = useState<DirectRevenueFrequency>('weekly');
  const [formOccurrencesCount, setFormOccurrencesCount] = useState<number>(4);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<DirectPaymentMethod>('virement');
  const [formStatus, setFormStatus] = useState<'paye' | 'en_attente'>('paye');
  const [formNotes, setFormNotes] = useState<string>('');

  // 1. Documents Revenue Calculations (Strictly paid documents for realized turnover)
  const paidDocs = documents.filter((d) => d.status === 'paye');
  const pendingDocs = documents.filter((d) => d.status === 'envoye' || d.status === 'accorde' || d.status === 'retard');
  const validDocs = documents.filter((d) => d.status !== 'brouillon');

  const calculateDocTTC = (doc: DocumentData) => {
    const totalHT = doc.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discountPercent || 0) / 100), 0);
    return totalHT * (1 + doc.tvaRate / 100);
  };

  const calculateDocHT = (doc: DocumentData) => {
    return doc.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discountPercent || 0) / 100), 0);
  };

  // Realized CA HT and TTC (Only paid documents)
  const docsRevenueHT = paidDocs.reduce((sum, doc) => sum + calculateDocHT(doc), 0);
  const docsRevenueTTC = paidDocs.reduce((sum, doc) => sum + calculateDocTTC(doc), 0);
  const docsPaidTTC = docsRevenueTTC;

  // Pipeline in progress (Pending quotes and unpaid invoices)
  const docsPendingTTC = validDocs
    .filter((d) => d.status === 'envoye' || d.status === 'accorde')
    .reduce((sum, doc) => sum + calculateDocTTC(doc), 0);

  const docsOverdueTTC = validDocs
    .filter((d) => d.status === 'retard')
    .reduce((sum, doc) => sum + calculateDocTTC(doc), 0);

  // 2. Direct & Recurring Revenues Calculations (Sans document/devis/papier)
  const calculateDirectItemTotal = (item: DirectRevenueItem) => {
    return item.amountMAD * (item.occurrencesCount || 1);
  };

  const directRevenueTotal = directRevenues.reduce((sum, item) => sum + calculateDirectItemTotal(item), 0);
  const directRevenuePaid = directRevenues
    .filter((item) => item.status === 'paye')
    .reduce((sum, item) => sum + calculateDirectItemTotal(item), 0);
  const directRevenuePending = directRevenues
    .filter((item) => item.status === 'en_attente')
    .reduce((sum, item) => sum + calculateDirectItemTotal(item), 0);

  // Recurring Projections (Hebdo / Mensuel)
  const weeklyRetainers = directRevenues.filter((r) => r.frequency === 'weekly');
  const monthlyRetainers = directRevenues.filter((r) => r.frequency === 'monthly');

  const weeklyGuaranteedMAD = weeklyRetainers.reduce((sum, r) => sum + r.amountMAD, 0);
  const monthlyGuaranteedMAD =
    monthlyRetainers.reduce((sum, r) => sum + r.amountMAD, 0) + weeklyGuaranteedMAD * 4.33;
  const annualProjectedMAD = monthlyGuaranteedMAD * 12;

  // 3. Combined Global KPIs (CA Réalisé Encaissé = Payé uniquement)
  const totalRevenueHT = docsRevenueHT + directRevenuePaid;
  const totalRevenueTTC = docsRevenueTTC + directRevenuePaid;
  const totalPaidRevenue = docsPaidTTC + directRevenuePaid;
  const totalPendingRevenue = docsPendingTTC + docsOverdueTTC + directRevenuePending;

  const totalExpensesMAD = expenses.reduce((sum, e) => sum + e.amountMAD, 0);
  const netProfitMAD = totalRevenueHT - totalExpensesMAD;
  const netMarginPercent = totalRevenueHT > 0 ? Math.round((netProfitMAD / totalRevenueHT) * 100) : 0;

  const totalMissionsCount = validDocs.length + directRevenues.length;
  const avgMissionTicket = totalMissionsCount > 0 ? Math.round(totalRevenueHT / totalMissionsCount) : 0;

  // Active Financial Goal Calculations (Customizable & Plafond AE)
  const activeGoal = customGoals.find((g) => g.id === activeGoalId) || customGoals[0] || DEFAULT_GOALS[0];

  const calculateEffectiveCA = (goal: FinancialGoalConfig) => {
    const starting = Number(goal.startingBalanceMAD || 0);
    if (goal.calculationScope === 'official_only') {
      return docsRevenueHT + starting;
    }
    if (goal.calculationScope === 'direct_only') {
      return directRevenueTotal + starting;
    }
    return totalRevenueHT + starting;
  };

  const activeGoalEffectiveCA = calculateEffectiveCA(activeGoal);
  const activeGoalTarget = activeGoal.targetAmountMAD > 0 ? activeGoal.targetAmountMAD : 200000;
  const activeGoalProgressPercent = Math.min(100, Math.round((activeGoalEffectiveCA / activeGoalTarget) * 100));
  const activeGoalRemainingMAD = Math.max(0, activeGoalTarget - activeGoalEffectiveCA);

  // Goal Customizer Handlers
  const handleOpenCreateGoal = () => {
    setEditingGoalId(null);
    setGoalFormType('personal_annual');
    setGoalFormTitle('🎯 Nouvel Objectif Personnalisé');
    setGoalFormTargetAmountMAD(300000);
    setGoalFormStartingBalanceMAD(0);
    setGoalFormDeadlineDate('');
    setGoalFormCalculationScope('all');
    setGoalFormCategoryNote('Objectif de croissance du chiffre d\'affaires');
    setGoalFormMilestones([
      { id: 'm1', title: 'Palier 1 (25%)', amountMAD: 75000, rewardNote: '1er quart' },
      { id: 'm2', title: 'Palier 2 (50%)', amountMAD: 150000, rewardNote: 'Mi-parcours' },
      { id: 'm3', title: 'Palier 3 (75%)', amountMAD: 225000, rewardNote: 'Dernière ligne droite' },
      { id: 'm4', title: 'Objectif Atteint (100%)', amountMAD: 300000, rewardNote: 'Victoire ! 🎉' },
    ]);
    setIsGoalModalOpen(true);
  };

  const handleOpenEditGoal = (goal: FinancialGoalConfig) => {
    setEditingGoalId(goal.id);
    setGoalFormType(goal.type);
    setGoalFormTitle(goal.title);
    setGoalFormTargetAmountMAD(goal.targetAmountMAD);
    setGoalFormStartingBalanceMAD(goal.startingBalanceMAD || 0);
    setGoalFormDeadlineDate(goal.deadlineDate || '');
    setGoalFormCalculationScope(goal.calculationScope || 'all');
    setGoalFormCategoryNote(goal.categoryNote || '');
    setGoalFormMilestones(goal.milestones?.length ? goal.milestones : [
      { id: 'm1', title: 'Palier 25%', amountMAD: Math.round(goal.targetAmountMAD * 0.25) },
      { id: 'm2', title: 'Palier 50%', amountMAD: Math.round(goal.targetAmountMAD * 0.5) },
      { id: 'm3', title: 'Palier 75%', amountMAD: Math.round(goal.targetAmountMAD * 0.75) },
      { id: 'm4', title: 'Objectif 100%', amountMAD: goal.targetAmountMAD },
    ]);
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalFormTitle || goalFormTargetAmountMAD <= 0) return;

    if (editingGoalId) {
      setCustomGoals((prev) =>
        prev.map((g) =>
          g.id === editingGoalId
            ? {
                ...g,
                type: goalFormType,
                title: goalFormTitle,
                targetAmountMAD: Number(goalFormTargetAmountMAD),
                startingBalanceMAD: Number(goalFormStartingBalanceMAD || 0),
                deadlineDate: goalFormDeadlineDate || undefined,
                calculationScope: goalFormCalculationScope,
                categoryNote: goalFormCategoryNote || undefined,
                milestones: goalFormMilestones,
              }
            : g
        )
      );
    } else {
      const newGoal: FinancialGoalConfig = {
        id: `goal-${Date.now()}`,
        type: goalFormType,
        title: goalFormTitle,
        targetAmountMAD: Number(goalFormTargetAmountMAD),
        startingBalanceMAD: Number(goalFormStartingBalanceMAD || 0),
        deadlineDate: goalFormDeadlineDate || undefined,
        calculationScope: goalFormCalculationScope,
        categoryNote: goalFormCategoryNote || undefined,
        milestones: goalFormMilestones,
      };
      setCustomGoals((prev) => [...prev, newGoal]);
      setActiveGoalId(newGoal.id);
    }
    setIsGoalModalOpen(false);
  };

  const handleDeleteGoal = (id: string) => {
    if (customGoals.length <= 1) return;
    setCustomGoals((prev) => prev.filter((g) => g.id !== id));
    if (activeGoalId === id) {
      const remaining = customGoals.filter((g) => g.id !== id);
      if (remaining.length > 0) {
        setActiveGoalId(remaining[0].id);
      }
    }
  };

  // Monthly Chart Data (combining documents and direct revenues)
  const monthlyData = [
    { month: 'Jan', Facturé: 15000, Direct: 4000, Total: 19000, Dépenses: 3000 },
    { month: 'Fév', Facturé: 22000, Direct: 6500, Total: 28500, Dépenses: 4000 },
    { month: 'Mar', Facturé: 35000, Direct: 8000, Total: 43000, Dépenses: 8000 },
    { month: 'Avr', Facturé: 28000, Direct: 7500, Total: 35500, Dépenses: 5000 },
    { month: 'Mai', Facturé: 45000, Direct: 12500, Total: 57500, Dépenses: 16500 },
    { month: 'Juin', Facturé: 38000, Direct: 10000, Total: 48000, Dépenses: 6000 },
    { month: 'Juil', Facturé: 26500, Direct: directRevenueTotal > 0 ? Math.round(directRevenueTotal * 0.4) : 9500, Total: 36000, Dépenses: 4000 },
  ];

  // Revenue Distribution by Client Donut Chart Data (combining both sources)
  const clientRevenueData = clients.map((client) => {
    const clientDocs = validDocs.filter((d) => d.clientId === client.id);
    const docValue = clientDocs.reduce((sum, doc) => sum + calculateDocHT(doc), 0);
    const directValue = directRevenues
      .filter((r) => r.clientId === client.id || r.clientName.toLowerCase().includes(client.name.toLowerCase()))
      .reduce((sum, r) => sum + calculateDirectItemTotal(r), 0);
    
    return {
      name: client.company || client.name,
      value: docValue + directValue,
      docValue,
      directValue,
    };
  }).filter((c) => c.value > 0);

  // Revenue by Format Breakdown
  const revenueFormatBreakdown = [
    { name: 'Factures & Devis Officiels', value: docsRevenueHT, color: '#F59E0B' },
    { name: 'Forfaits Hebdomadaires', value: weeklyRetainers.reduce((s, r) => s + calculateDirectItemTotal(r), 0), color: '#10B981' },
    { name: 'Forfaits Mensuels', value: monthlyRetainers.reduce((s, r) => s + calculateDirectItemTotal(r), 0), color: '#3B82F6' },
    { name: 'Missions Directes Ponctuelles', value: directRevenues.filter(r => r.frequency === 'one_time').reduce((s, r) => s + calculateDirectItemTotal(r), 0), color: '#8B5CF6' },
  ].filter((item) => item.value > 0);

  // Modal Handlers
  const handleOpenAddModal = (presetClientId?: string) => {
    setEditingItemId(null);
    if (presetClientId) {
      const foundClient = clients.find((c) => c.id === presetClientId);
      setFormClientId(presetClientId);
      setFormClientName(foundClient?.name || '');
      setFormClientCompany(foundClient?.company || '');
    } else {
      setFormClientId('');
      setFormClientName('');
      setFormClientCompany('');
    }
    setFormTitle('Forfait Réseaux Sociaux (4 Reels / Semaine)');
    setFormCategory('Gestion Réseaux / Reels');
    setFormAmountMAD(2500);
    setFormFrequency('weekly');
    setFormOccurrencesCount(4);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('virement');
    setFormStatus('paye');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: DirectRevenueItem) => {
    setEditingItemId(item.id);
    setFormClientId(item.clientId || '');
    setFormClientName(item.clientName);
    setFormClientCompany(item.clientCompany || '');
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormAmountMAD(item.amountMAD);
    setFormFrequency(item.frequency);
    setFormOccurrencesCount(item.occurrencesCount || 1);
    setFormDate(item.date);
    setFormPaymentMethod(item.paymentMethod);
    setFormStatus(item.status);
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveDirectRevenueForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientName && !formClientCompany) {
      alert('Veuillez renseigner le nom du client ou de l\'entreprise.');
      return;
    }

    const newItem: DirectRevenueItem = {
      id: editingItemId || `dir-${Date.now()}`,
      clientId: formClientId || undefined,
      clientName: formClientName || formClientCompany,
      clientCompany: formClientCompany || undefined,
      title: formTitle || 'Mission Directe Sans Papier',
      category: formCategory,
      amountMAD: Number(formAmountMAD) || 0,
      frequency: formFrequency,
      occurrencesCount: Number(formOccurrencesCount) || 1,
      date: formDate,
      paymentMethod: formPaymentMethod,
      status: formStatus,
      notes: formNotes || undefined,
      createdAt: new Date().toISOString(),
    };

    if (onSaveDirectRevenue) {
      onSaveDirectRevenue(newItem);
    }
    setIsModalOpen(false);
  };

  const handleClientSelectChange = (clientId: string) => {
    setFormClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setFormClientName(client.name);
      setFormClientCompany(client.company);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-1">
            <TrendingUp className="w-4 h-4" /> Module 2 • Pilotage Financier & Revenus Hybrides
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Dashboard Financier & Chiffre d'Affaires</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Calcul unifié du CA officiel (Factures/Devis) et des <strong className="text-amber-300 font-semibold">Revenus Directs & Forfaits récurrents (sans papier)</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Add Direct Revenue Action */}
          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer border border-amber-300"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            + Revenu Direct / Forfait
          </button>

          {/* Period Selector */}
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

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" /> Vue Synthèse Globale & KPIs
        </button>

        <button
          onClick={() => setActiveTab('direct_revenues')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'direct_revenues'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Repeat className="w-4 h-4 text-emerald-400" />
          <span>Revenus Directs & Forfaits sans Document</span>
          <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[10px] font-mono font-bold border border-emerald-500/30">
            {directRevenues.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'documents'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" /> Factures & Devis Officiels ({validDocs.length})
        </button>
      </div>

      {/* Customizable Cumulative CA & Financial Goals Tracker */}
      {showAEGauge && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-xl space-y-4">
          {/* Goals Quick Switcher Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                Suivi du Chiffre d'Affaires &amp; Objectifs Personnalisés :
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {customGoals.map((goal) => {
                const isSelected = goal.id === activeGoal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setActiveGoalId(goal.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{goal.title.split(' ')[0]}</span>
                    <span className="truncate max-w-[140px] hidden md:inline">
                      {goal.title.replace(/^[^\s]+\s/, '')}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleOpenCreateGoal}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-amber-400 border border-dashed border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                title="Créer un nouvel objectif personnalisé"
              >
                <Plus className="w-3.5 h-3.5" /> Nouvel Objectif
              </button>

              <button
                type="button"
                onClick={() => handleOpenEditGoal(activeGoal)}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl transition-all"
                title="Modifier l'objectif actif"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>

          {/* Active Goal Overview Card */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10.5px] font-bold">
                  {activeGoal.type === 'ae_legal'
                    ? 'Plafond Légal AE (Services Maroc)'
                    : activeGoal.type === 'gear_investment'
                    ? 'Investissement Matériel Cinéma'
                    : activeGoal.type === 'personal_monthly'
                    ? 'Objectif Mensuel'
                    : 'Objectif Chiffre d\'Affaires'}
                </span>

                {activeGoal.calculationScope && activeGoal.calculationScope !== 'all' && (
                  <span className="px-2 py-0.5 bg-sky-950 text-sky-300 border border-sky-800 rounded-lg text-[10px] font-mono font-bold">
                    {activeGoal.calculationScope === 'official_only'
                      ? '📄 Facturé Officiel Uniquement'
                      : '⚡ Revenus Directs Uniquement'}
                  </span>
                )}

                {Number(activeGoal.startingBalanceMAD || 0) > 0 && (
                  <span className="px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded-lg text-[10px] font-mono font-bold">
                    +{Number(activeGoal.startingBalanceMAD).toLocaleString('fr-MA')} MAD report initial
                  </span>
                )}

                {activeGoal.deadlineDate && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-amber-400" /> Échéance : {activeGoal.deadlineDate}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black text-white flex items-center gap-2 flex-wrap">
                <span>{activeGoal.title}</span>
                <span className="text-amber-400 font-mono text-lg font-black">
                  ({activeGoalEffectiveCA.toLocaleString('fr-MA')} / {activeGoalTarget.toLocaleString('fr-MA')} MAD)
                </span>
              </h3>

              <p className="text-xs text-slate-300 max-w-2xl">
                {activeGoal.categoryNote ||
                  (activeGoal.type === 'ae_legal'
                    ? 'Plafond légal Auto-Entrepreneur au Maroc. Vos factures et prestations directes sont agrégées en temps réel.'
                    : 'Suivez la progression de votre chiffre d\'affaires cumulé pour atteindre vos objectifs personnels et professionnels.')}
              </p>

              {/* Sub-breakdown details */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                <span>
                  📄 Facturé officiel : <strong className="text-slate-200">{docsRevenueHT.toLocaleString('fr-MA')} MAD</strong>
                </span>
                <span>•</span>
                <span>
                  ⚡ Sans papier / Direct : <strong className="text-emerald-400">{directRevenueTotal.toLocaleString('fr-MA')} MAD</strong>
                </span>
                {Number(activeGoal.startingBalanceMAD || 0) > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      📊 Solde de départ : <strong className="text-purple-400">{Number(activeGoal.startingBalanceMAD).toLocaleString('fr-MA')} MAD</strong>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Progress Gauge & Milestones */}
            <div className="w-full lg:w-80 space-y-2 shrink-0 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-1">
                  <Flag className="w-3.5 h-3.5 text-amber-400" /> Progression Globale
                </span>
                <span className="text-amber-400 font-mono font-extrabold text-sm">
                  {activeGoalProgressPercent}%
                </span>
              </div>

              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                <div
                  className={`h-full transition-all duration-1000 ${
                    activeGoalProgressPercent >= 100
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400'
                      : activeGoalProgressPercent >= 75
                      ? 'bg-gradient-to-r from-amber-500 to-emerald-500'
                      : 'bg-gradient-to-r from-amber-500 to-amber-400'
                  }`}
                  style={{ width: `${activeGoalProgressPercent}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">
                  {activeGoalRemainingMAD > 0 ? (
                    <>Reste : <strong className="text-white font-mono">{activeGoalRemainingMAD.toLocaleString('fr-MA')} MAD</strong></>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Objectif 100% Dépassé !
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenEditGoal(activeGoal)}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer text-[10.5px]"
                >
                  Personnaliser
                </button>
              </div>

              {/* Milestones Mini Checklist */}
              {activeGoal.milestones && activeGoal.milestones.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                    <span>Jalons &amp; Paliers :</span>
                    <span className="text-amber-400">
                      {activeGoal.milestones.filter((m) => activeGoalEffectiveCA >= m.amountMAD).length} / {activeGoal.milestones.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {activeGoal.milestones.map((milestone) => {
                      const isReached = activeGoalEffectiveCA >= milestone.amountMAD;
                      return (
                        <div
                          key={milestone.id}
                          className={`px-1.5 py-1 rounded text-[10px] font-mono flex items-center justify-between border ${
                            isReached
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="truncate max-w-[85px]">{milestone.title}</span>
                          <span>{isReached ? '✓' : `${Math.round(milestone.amountMAD / 1000)}k`}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Global CA */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">CA Global Encaissé</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {totalRevenueHT.toLocaleString('fr-MA')} MAD
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>📄 Facturé: <strong className="text-slate-200">{docsRevenueHT.toLocaleString('fr-MA')}</strong></span>
            <span>⚡ Sans papier: <strong className="text-emerald-400">{directRevenueTotal.toLocaleString('fr-MA')}</strong></span>
          </div>
        </div>

        {/* KPI 2: Recurring Retainers (Hebdo / Mensuel) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Forfaits Récurrents</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {monthlyGuaranteedMAD.toLocaleString('fr-MA', { maximumFractionDigits: 0 })} <span className="text-xs text-slate-400 font-normal">MAD/mois</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Hebdo: <strong className="text-emerald-300 font-bold">{weeklyGuaranteedMAD.toLocaleString('fr-MA')} MAD/sem</strong></span>
            <span className="text-amber-400 font-bold">Projeté: {Math.round(annualProjectedMAD / 1000)}k MAD/an</span>
          </div>
        </div>

        {/* KPI 3: Net Margin */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Bénéfice Net Réel</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-sky-400">
            {netProfitMAD.toLocaleString('fr-MA')} MAD
          </div>
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Dépenses: <strong className="text-rose-400">{totalExpensesMAD.toLocaleString('fr-MA')} MAD</strong></span>
            <span>Marge: <strong className="text-sky-300 font-bold">{netMarginPercent}%</strong></span>
          </div>
        </div>

        {/* KPI 4: Missions Count & Panier Moyen */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Collaborations</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {totalMissionsCount} <span className="text-xs text-slate-400 font-normal">missions / flux</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Panier Moyen: <strong className="text-purple-300 font-bold">{avgMissionTicket.toLocaleString('fr-MA')} MAD</strong></span>
            <span className="text-emerald-400">{directRevenues.length} directs</span>
          </div>
        </div>
      </div>

      {/* MAIN VIEW: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Revenue Bar / Area Chart */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-amber-400" /> Évolution du Chiffre d'Affaires Mensuel (Hybride)
                  </h3>
                  <p className="text-xs text-slate-400">Cumul des factures officielles + forfaits & revenus directs récurrents</p>
                </div>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDirect" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090D16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="Total" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" name="CA Total (MAD)" />
                    <Area type="monotone" dataKey="Direct" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorDirect)" name="Revenus Directs / Forfaits" />
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
                <p className="text-xs text-slate-400">Total global généré par compte (Docs + Directs)</p>
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
              <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto pr-1">
                {clientRevenueData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-300">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="truncate font-medium">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400 shrink-0">{item.value.toLocaleString('fr-MA')} MAD</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Summary Cards of Direct Revenues */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Derniers Revenus Directs & Forfaits sans Papier</h4>
                  <p className="text-xs text-slate-400">Missions hebdomadaires, mensuelles ou directes enregistrées</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('direct_revenues')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
              >
                Gérer tous les forfaits →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {directRevenues.slice(0, 3).map((item) => (
                <div key={item.id} className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {item.frequency === 'weekly' ? '⚡ Hebdomadaire' : item.frequency === 'monthly' ? '📅 Mensuel' : '🎯 Ponctuel'}
                    </span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {calculateDirectItemTotal(item).toLocaleString('fr-MA')} MAD
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-white truncate">{item.title}</h5>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{item.clientCompany || item.clientName}</span>
                    <span className="text-[10px] text-slate-500">
                      {item.frequency !== 'one_time' && `${item.occurrencesCount || 1} versements`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: DIRECT REVENUES & RECURRING RETAINERS (SANS DOCUMENT) */}
      {activeTab === 'direct_revenues' && (
        <div className="space-y-6">
          {/* Direct Revenue Header Info Box */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 p-5 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Gestion des Revenus Directs, Forfaits & Retainers</h3>
                  <p className="text-xs text-slate-300">
                    Enregistrez vos travaux réguliers sans formalités administratives (sans devis/facture papier).
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleOpenAddModal()}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                Ajouter un Forfait / Revenu Direct
              </button>
            </div>

            {/* Recurrence Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-emerald-500/20 text-xs">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-500/20">
                <div className="text-slate-400 font-medium">Flux Hebdomadaire Garanti</div>
                <div className="text-lg font-black font-mono text-emerald-400">
                  {weeklyGuaranteedMAD.toLocaleString('fr-MA')} MAD <span className="text-[11px] text-slate-400 font-normal">/ sem</span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-500/20">
                <div className="text-slate-400 font-medium">Flux Mensuel Récurrent Estimé</div>
                <div className="text-lg font-black font-mono text-amber-400">
                  {Math.round(monthlyGuaranteedMAD).toLocaleString('fr-MA')} MAD <span className="text-[11px] text-slate-400 font-normal">/ mois</span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-500/20">
                <div className="text-slate-400 font-medium">Total Cumulé Encaissé (Directs)</div>
                <div className="text-lg font-black font-mono text-white">
                  {directRevenueTotal.toLocaleString('fr-MA')} MAD
                </div>
              </div>
            </div>
          </div>

          {/* Direct Revenue Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Journal des Entrées Directes & Forfaits</h4>
                <p className="text-xs text-slate-400">{directRevenues.length} contrat(s) et missions sans document</p>
              </div>
            </div>

            {directRevenues.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl space-y-3">
                <Wallet className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-slate-400 text-sm font-bold">Aucun revenu direct enregistré pour l'instant</div>
                <p className="text-slate-500 text-xs max-w-md mx-auto">
                  Ajoutez vos collaborations directes (Reels hebdomadaires, forfaits mensuels, tournages payés en cash ou virement direct).
                </p>
                <button
                  onClick={() => handleOpenAddModal()}
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
                >
                  + Ajouter le premier revenu direct
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 font-bold">Titre de la mission / Forfait</th>
                      <th className="py-3 px-4 font-bold">Client / Partenaire</th>
                      <th className="py-3 px-4 font-bold">Fréquence</th>
                      <th className="py-3 px-4 font-bold text-right">Tarif Unitaire</th>
                      <th className="py-3 px-4 font-bold text-center">Versements</th>
                      <th className="py-3 px-4 font-bold text-right">Total Encaissé (MAD)</th>
                      <th className="py-3 px-4 font-bold text-center">Règlement</th>
                      <th className="py-3 px-4 font-bold text-center">Statut</th>
                      <th className="py-3 px-4 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {directRevenues.map((item) => {
                      const totalItem = calculateDirectItemTotal(item);
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{item.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{item.category} • {item.date}</div>
                            {item.notes && <div className="text-[10px] text-amber-400/80 italic mt-0.5 truncate max-w-xs">{item.notes}</div>}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-200">{item.clientName}</div>
                            {item.clientCompany && (
                              <div className="text-[10px] text-slate-400">{item.clientCompany}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {item.frequency === 'weekly' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                                Hebdo (Semaine)
                              </span>
                            ) : item.frequency === 'monthly' ? (
                              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                                Mensuel (Mois)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                                Ponctuel Direct
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                            {item.amountMAD.toLocaleString('fr-MA')} MAD
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-300">
                            × {item.occurrencesCount || 1}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                            {totalItem.toLocaleString('fr-MA')} MAD
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase">
                              {item.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {item.status === 'paye' ? (
                              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold border border-emerald-500/30 flex items-center justify-center gap-1">
                                <Check className="w-3 h-3" /> Encaissé
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-lg font-bold border border-amber-500/30">
                                En attente
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Modifier ce forfait"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteDirectRevenue && onDeleteDirectRevenue(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Supprimer ce forfait"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: DOCUMENTS OFFICIELS */}
      {activeTab === 'documents' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Factures & Devis avec Documents Officiels</h3>
              <p className="text-xs text-slate-400">Prestations avec TVA 20% et traçabilité ICE/IF</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Filtrer :</span>
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
      )}

      {/* MODAL: CUSTOM FINANCIAL GOAL & CA CUMULÉ CONFIGURATOR */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {editingGoalId ? 'Personnaliser l\'Objectif Financier' : 'Créer un Nouvel Objectif de Chiffre d\'Affaires'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Définissez vos plafonds légaux, objectifs de production ou cibles d'épargne sur-mesure
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4 text-xs">
              {/* Type & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Type d'Objectif</label>
                  <select
                    value={goalFormType}
                    onChange={(e) => setGoalFormType(e.target.value as FinancialGoalType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:border-amber-500 focus:outline-none"
                  >
                    <option value="personal_annual">🎯 Objectif Annuel Personnalisé (ex: 350k MAD)</option>
                    <option value="ae_legal">🏛️ Plafond Auto-Entrepreneur (Prestations Services - 200k MAD)</option>
                    <option value="ae_sales">🏢 Plafond Auto-Entrepreneur (Commercial / Vente - 500k MAD)</option>
                    <option value="personal_monthly">📅 Objectif CA Mensuel Moyen (ex: 35k MAD / mois)</option>
                    <option value="gear_investment">🎬 Achat &amp; Investissement Matériel Cinéma</option>
                    <option value="sarl_threshold">⚖️ Seuil de Transition SARL AU</option>
                    <option value="custom">✏️ Objectif 100% Libre / Sur-Mesure</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Nom / Titre de l'Objectif</label>
                  <input
                    type="text"
                    required
                    value={goalFormTitle}
                    onChange={(e) => setGoalFormTitle(e.target.value)}
                    placeholder="Ex: 🎯 Objectif Annuel Réalisateur 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Target Amount & Starting Balance Offset */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Montant Cible (MAD)
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={goalFormTargetAmountMAD}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setGoalFormTargetAmountMAD(val);
                      // auto-update milestone amounts proportionally
                      setGoalFormMilestones([
                        { id: 'm1', title: 'Palier 1 (25%)', amountMAD: Math.round(val * 0.25), rewardNote: '1er quart validé' },
                        { id: 'm2', title: 'Palier 2 (50%)', amountMAD: Math.round(val * 0.5), rewardNote: 'Mi-parcours' },
                        { id: 'm3', title: 'Palier 3 (75%)', amountMAD: Math.round(val * 0.75), rewardNote: 'Dernière ligne droite' },
                        { id: 'm4', title: 'Objectif Atteint (100%)', amountMAD: val, rewardNote: 'Victoire ! 🎉' },
                      ]);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-amber-400 font-mono font-black text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold" title="Ajouter un montant déjà encaissé avant l'utilisation de l'app ou hors système">
                    Report de Solde Initial (MAD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={goalFormStartingBalanceMAD}
                    onChange={(e) => setGoalFormStartingBalanceMAD(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-purple-300 font-mono font-bold text-sm focus:border-amber-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">CA antérieur reporté</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Périmètre de Calcul</label>
                  <select
                    value={goalFormCalculationScope}
                    onChange={(e) => setGoalFormCalculationScope(e.target.value as 'all' | 'official_only' | 'direct_only')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:border-amber-500 focus:outline-none"
                  >
                    <option value="all">Tout Cumulé (Factures + Direct)</option>
                    <option value="official_only">📄 Facturé officiel uniquement</option>
                    <option value="direct_only">⚡ Direct sans papier uniquement</option>
                  </select>
                  <p className="text-[10px] text-slate-400">Source du CA pris en compte</p>
                </div>
              </div>

              {/* Deadline & Strategic Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Date d'Échéance (Optionnel)</label>
                  <input
                    type="date"
                    value={goalFormDeadlineDate}
                    onChange={(e) => setGoalFormDeadlineDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Note Stratégique / Contexte</label>
                  <input
                    type="text"
                    value={goalFormCategoryNote}
                    onChange={(e) => setGoalFormCategoryNote(e.target.value)}
                    placeholder="Ex: Seuil critique avant constitution de société..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Milestones Config */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-amber-400" /> Configuration des Paliers &amp; Jalons Intermédiaires :
                  </label>
                  <span className="text-[10.5px] text-slate-400 font-mono">4 jalons personnalisables</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {goalFormMilestones.map((m, idx) => (
                    <div key={m.id || idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-amber-400 font-bold text-[11px]">Jalon #{idx + 1}</span>
                        <input
                          type="text"
                          value={m.title}
                          onChange={(e) => {
                            const updated = [...goalFormMilestones];
                            updated[idx].title = e.target.value;
                            setGoalFormMilestones(updated);
                          }}
                          placeholder="Nom du jalon"
                          className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-white text-[11px] font-bold flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[10px]">Montant :</span>
                        <input
                          type="number"
                          value={m.amountMAD}
                          onChange={(e) => {
                            const updated = [...goalFormMilestones];
                            updated[idx].amountMAD = Number(e.target.value);
                            setGoalFormMilestones(updated);
                          }}
                          className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-amber-400 font-mono text-[11px] font-bold w-full"
                        />
                        <span className="text-slate-400 text-[10px]">MAD</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit / Delete Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                {editingGoalId && customGoals.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Voulez-vous vraiment supprimer cet objectif ?')) {
                        handleDeleteGoal(editingGoalId);
                        setIsGoalModalOpen(false);
                      }
                    }}
                    className="px-3 py-2 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-xl font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGoalModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-110 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Enregistrer l'Objectif
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {editingItemId ? 'Modifier le Revenu Direct' : 'Nouveau Revenu Direct / Forfait Récurrent'}
                  </h3>
                  <p className="text-xs text-slate-400">Pour les clients sans devis ni facture papier officielle</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDirectRevenueForm} className="space-y-4 text-xs">
              {/* Client Selection */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" /> Associer à un Client CRM (Optionnel) :
                </label>
                <select
                  value={formClientId}
                  onChange={(e) => handleClientSelectChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Client Direct / Non répertorié au CRM --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Free Text Client info if not chosen from CRM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Nom du Client / Contact *</label>
                  <input
                    type="text"
                    required
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    placeholder="Ex: Youssef / Restaurant Oasis"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Entreprise / Marque</label>
                  <input
                    type="text"
                    value={formClientCompany}
                    onChange={(e) => setFormClientCompany(e.target.value)}
                    placeholder="Ex: Oasis Lounge Marrakech"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Mission Title & Category */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Intitulé de la Prestation *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: 4 Reels & TikToks hebdomadaires, Cadreur plateau..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Catégorie de Service</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as DirectRevenueCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Gestion Réseaux / Reels">Gestion Réseaux / Reels</option>
                    <option value="Forfait Hebdomadaire">Forfait Hebdomadaire</option>
                    <option value="Forfait Mensuel">Forfait Mensuel</option>
                    <option value="Tournage Direct">Tournage Direct</option>
                    <option value="Montage & Post-Prod">Montage & Post-Prod</option>
                    <option value="Cadreur / Opérateur">Cadreur / Opérateur</option>
                    <option value="Autre Mission Directe">Autre Mission Directe</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Fréquence / Type de Collaboration *</label>
                  <select
                    value={formFrequency}
                    onChange={(e) => {
                      const f = e.target.value as DirectRevenueFrequency;
                      setFormFrequency(f);
                      if (f === 'one_time') setFormOccurrencesCount(1);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-300 font-bold focus:border-amber-500 focus:outline-none"
                  >
                    <option value="weekly">⚡ Forfait Hebdomadaire (Par Semaine)</option>
                    <option value="monthly">📅 Forfait Mensuel (Par Mois)</option>
                    <option value="one_time">🎯 Mission Ponctuelle Directe</option>
                  </select>
                </div>
              </div>

              {/* Amount, Occurrences & Dynamic Total Calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">
                    {formFrequency === 'weekly'
                      ? 'Montant par Semaine (MAD) *'
                      : formFrequency === 'monthly'
                      ? 'Montant par Mois (MAD) *'
                      : 'Montant Total (MAD) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    value={formAmountMAD}
                    onChange={(e) => setFormAmountMAD(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-amber-400 font-mono font-bold text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">
                    {formFrequency === 'weekly'
                      ? 'Nombre de semaines perçues'
                      : formFrequency === 'monthly'
                      ? 'Nombre de mois perçus'
                      : 'Nombre d\'occurrences'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formOccurrencesCount}
                    onChange={(e) => setFormOccurrencesCount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Total calculé perçu :</span>
                  <span className="text-emerald-400 font-mono font-black text-base">
                    {(Number(formAmountMAD || 0) * Number(formOccurrencesCount || 1)).toLocaleString('fr-MA')} MAD
                  </span>
                </div>
              </div>

              {/* Payment Method, Status & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Mode de Paiement</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as DirectPaymentMethod)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="virement">Virement Bancaire</option>
                    <option value="especes">Espèces (Cash)</option>
                    <option value="cheque">Chèque</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Statut de Règlement</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'paye' | 'en_attente')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="paye">✅ Payé / Encaissé</option>
                    <option value="en_attente">⏳ En attente de virement</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Date de Début / Versement</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Notes / Modalités particulières</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Virement reçu chaque lundi matin, livraison des rushs par WeTransfer..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:brightness-110 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Enregistrer le Revenu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

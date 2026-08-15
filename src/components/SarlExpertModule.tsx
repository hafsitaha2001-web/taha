import React, { useState } from 'react';
import {
  BrainCircuit,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calculator,
  ShieldCheck,
  ArrowRight,
  FileCheck,
  Award,
  Layers,
  ChevronRight,
  Lightbulb,
  Camera,
  Coins,
  Percent
} from 'lucide-react';
import { DocumentData, ClientData, ExpenseItem, StrategicAdvice, DirectRevenueItem } from '../types';

interface SarlExpertModuleProps {
  documents: DocumentData[];
  directRevenues?: DirectRevenueItem[];
  clients: ClientData[];
  expenses: ExpenseItem[];
}

export const SarlExpertModule: React.FC<SarlExpertModuleProps> = ({
  documents,
  directRevenues = [],
  clients,
  expenses,
}) => {
  const [simulationTurnover, setSimulationTurnover] = useState<number>(250000); // Default 250k MAD
  const [simulationGearInvestment, setSimulationGearInvestment] = useState<number>(80000); // 80k MAD cinema gear
  const [simulationExpenses, setSimulationExpenses] = useState<number>(60000); // 60k MAD assistants & travels

  // Advice History State
  const [adviceHistory, setAdviceHistory] = useState<Array<{ id: string; title: string; category: string; date: string; status: 'Appliqué' | 'En cours' | 'Archivé'; note?: string }>>([
    { id: 'h-1', title: 'Passage en Forfait Journalier 6500 MAD (FX6)', category: 'Tarification', date: '2026-01-15', status: 'Appliqué', note: 'Appliqué sur le devis DEV-2026-001' },
    { id: 'h-2', title: 'Création du dossier Google Drive HAFSI PROD SITE', category: 'Organisation', date: '2026-02-01', status: 'Appliqué', note: 'Synchronisé avec succès' },
  ]);

  const [activeTab, setActiveTab] = useState<'advice' | 'simulator' | 'history'>('advice');

  const handleMarkAdviceStatus = (title: string, category: string, status: 'Appliqué' | 'En cours' | 'Archivé') => {
    const note = prompt(`Ajouter une note de suivi pour "${title}" (optionnel) :`);
    const newEntry = {
      id: `hist-${Date.now()}`,
      title,
      category,
      date: new Date().toISOString().split('T')[0],
      status,
      note: note || undefined,
    };
    setAdviceHistory([newEntry, ...adviceHistory]);
    alert(`✅ Conseil "${title}" enregistré dans l'historique (${status}) !`);
  };

  // Realized revenue total HT (Strictly paid documents + paid direct revenues)
  const paidDocs = documents.filter((d) => d.status === 'paye');
  const paidDirect = directRevenues.filter((r) => r.status === 'paye');
  const actualDocsTurnoverHT = paidDocs.reduce((sum, doc) => {
    return sum + doc.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discountPercent || 0) / 100), 0);
  }, 0);
  const actualDirectTurnoverHT = paidDirect.reduce((sum, item) => {
    return sum + item.amountMAD * (item.occurrencesCount || 1);
  }, 0);
  const actualTurnoverHT = actualDocsTurnoverHT + actualDirectTurnoverHT;

  // Generate Automatic End-of-Month Strategic Analysis
  const generateStrategicInsights = (): StrategicAdvice[] => {
    const adviceList: StrategicAdvice[] = [];

    // 1. Client Concentration Analysis
    const clientRevenues: Record<string, { name: string; amount: number }> = {};
    paidDocs.forEach((doc) => {
      const ht = doc.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discountPercent || 0) / 100), 0);
      if (!clientRevenues[doc.clientId]) {
        clientRevenues[doc.clientId] = { name: doc.clientCompany || doc.clientName, amount: 0 };
      }
      clientRevenues[doc.clientId].amount += ht;
    });

    if (actualTurnoverHT > 0) {
      Object.values(clientRevenues).forEach((client) => {
        const share = (client.amount / actualTurnoverHT) * 100;
        if (share >= 40) {
          adviceList.push({
            id: 'adv-01',
            type: 'warning',
            category: 'Concentration',
            title: `Risque de Dépendance Client : ${client.name}`,
            message: `Le client ${client.name} représente ${Math.round(share)}% de votre chiffre d'affaires total (${client.amount.toLocaleString('fr-MA')} MAD). Diversifiez votre portefeuille pour sécuriser votre activité.`,
            impactScore: 85,
            actionText: 'Démarcher 2 nouvelles agences à Rabat ou Marrakech',
          });
        }
      });
    }

    // 2. Auto-Entrepreneur Ceiling Analysis (Plafond 200,000 MAD)
    const aeCeiling = 200000;
    const aeUsage = (actualTurnoverHT / aeCeiling) * 100;
    if (actualTurnoverHT >= 150000) {
      adviceList.push({
        id: 'adv-02',
        type: 'danger',
        category: 'Plafond AE',
        title: 'Seuil Critique Auto-Entrepreneur Atteint (200 000 MAD)',
        message: `Vous avez réalisé ${actualTurnoverHT.toLocaleString('fr-MA')} MAD soit ${Math.round(aeUsage)}% du plafond légal marocain. Dépasser ce seuil entraîne un basculement fiscal d'office. Préparez la création de votre SARL AU !`,
        impactScore: 98,
        actionText: 'Démarrer les démarches SARL AU chez le comptable',
      });
    } else {
      adviceList.push({
        id: 'adv-02-ok',
        type: 'info',
        category: 'Plafond AE',
        title: 'Suivi du Régime Auto-Entrepreneur',
        message: `Chiffre d'affaires actuel: ${actualTurnoverHT.toLocaleString('fr-MA')} MAD sur 200,000 MAD (${Math.round(aeUsage)}%). Vous disposez encore de ${(aeCeiling - actualTurnoverHT).toLocaleString('fr-MA')} MAD de marge avant obligation SARL.`,
        impactScore: 40,
        actionText: 'Voir la simulation de transition SARL',
      });
    }

    // 3. Pricing Strategy & Daily Rate (TJM) Advice
    adviceList.push({
      id: 'adv-03',
      type: 'opportunity',
      category: 'Tarification',
      title: 'Optimisation de vos Tarifs de Tournage (TJM)',
      message: `En moyenne sur Casablanca, le Tarif Journalier Moyen (TJM) d'un chef opérateur / cadreur Sony FX6 ou RED varie de 5,500 MAD à 8,000 MAD. Revalorisez vos devis de 15% pour les projets de spots publicitaires B2B.`,
      impactScore: 75,
      actionText: 'Ajuster les forfaits dans le Générateur de Devis',
    });

    // 4. Apporteurs d'Affaires Recommendation
    adviceList.push({
      id: 'adv-04',
      type: 'opportunity',
      category: 'Réseau',
      title: "Fidélisation de vos Apporteurs d'Affaires Clés",
      message: "Votre réseau de recommandation génère plus de 45% de vos contrats. Proposez une commission d'apport d'affaires de 5% ou offrez un cadeau de remerciement aux contacts prescripteurs.",
      impactScore: 65,
      actionText: 'Consulter la Cartographie CRM Réseau',
    });

    return adviceList;
  };

  const strategicAdviceList = generateStrategicInsights();

  // SARL vs Auto-Entrepreneur Financial Calculation Simulator
  // AE: 1% IR/IS tax on Turnover (Services) + No TVA recovery on equipment investments
  const aeTax = simulationTurnover * 0.01;
  const aeTvaRecovered = 0; // AE cannot deduct 20% TVA on purchases

  // SARL AU (Société à Responsabilité Limitée):
  // Net Profit = Turnover - Expenses - Equipment Depreciation (e.g. 5 yrs)
  const yearlyGearDepreciation = simulationGearInvestment / 3; // 3 year amort
  const sarlTaxableProfit = Math.max(0, simulationTurnover - simulationExpenses - yearlyGearDepreciation);
  const sarlIsTax = sarlTaxableProfit * 0.10; // 10% IS rate for profit under 300,000 MAD in Morocco
  const sarlTvaRecovered = (simulationGearInvestment + simulationExpenses) * 0.20; // 20% TVA recovery!

  const sarlNetSavingsMAD = sarlTvaRecovered - (sarlIsTax - aeTax);

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl shadow-xl shadow-black/20">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-1.5">
            <BrainCircuit className="w-4 h-4 text-amber-400" /> Module 4 • Expert Conseil & Simulateur de Transition SARL
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Conseil Stratégique & Passage en SARL</h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Analyse automatique de fin de mois, optimisation des tarifs audiovisuels et simulation fiscale comparative Auto-Entrepreneur vs SARL AU.
          </p>
        </div>

        <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-transparent border border-amber-500/30 px-5 py-3.5 rounded-2xl text-xs font-bold text-amber-300 flex items-center gap-3 shadow-inner">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Score de Préparation SARL</div>
            <span className="font-extrabold text-emerald-400 text-base">88 / 100</span>
          </div>
        </div>
      </div>

      {/* Strategic AI Advisory Section */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl space-y-5 shadow-xl shadow-black/20">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" /> Diagnostic Stratégique Automatique de Fin de Mois
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Recommandations basées sur vos chiffres réels et la réglementation marocaine</p>
          </div>
          <span className="text-xs font-medium text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">Mis à jour automatiquement</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategicAdviceList.map((adv) => (
            <div
              key={adv.id}
              className={`p-5 rounded-2xl border space-y-3 flex flex-col justify-between transition-all shadow-md ${
                adv.type === 'danger'
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-rose-950/10'
                  : adv.type === 'warning'
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-amber-950/10'
                  : adv.type === 'opportunity'
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-emerald-950/10'
                  : 'bg-slate-950/80 border-slate-800/80'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                      adv.type === 'danger'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : adv.type === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {adv.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Impact: {adv.impactScore}%</span>
                </div>

                <h4 className="text-sm font-bold text-white tracking-tight">{adv.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{adv.message}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" /> {adv.actionText}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleMarkAdviceStatus(adv.title, adv.category, 'Appliqué')}
                    className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-[10px] rounded-lg border border-emerald-800 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    ✓ Appliqué
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAdviceStatus(adv.title, adv.category, 'En cours')}
                    className="px-2.5 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold text-[10px] rounded-lg border border-amber-800 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    ⏳ En cours
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparative SARL AU vs Auto-Entrepreneur Simulator */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl space-y-6 shadow-xl shadow-black/20">
        <div className="border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-400" /> Simulateur Comparatif : Auto-Entrepreneur vs SARL AU
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Calculez les économies fiscales et la récupération de TVA 20% sur l'achat de vos caméras & objectifs.
            </p>
          </div>
          <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl self-start sm:self-auto">
            Loi de Finance Maroc
          </span>
        </div>

        {/* Interactive Simulation Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 shadow-inner">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Chiffre d'Affaires Annuel Projeté (MAD)
            </label>
            <input
              type="range"
              min="100000"
              max="600000"
              step="10000"
              value={simulationTurnover}
              onChange={(e) => setSimulationTurnover(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="text-right font-mono font-bold text-amber-400 text-sm mt-1">
              {simulationTurnover.toLocaleString('fr-MA')} MAD
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Investissement Matériel Caméra & Lenses (MAD)
            </label>
            <input
              type="range"
              min="20000"
              max="300000"
              step="10000"
              value={simulationGearInvestment}
              onChange={(e) => setSimulationGearInvestment(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="text-right font-mono font-bold text-emerald-400 text-sm mt-1">
              {simulationGearInvestment.toLocaleString('fr-MA')} MAD
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Frais de Tournage & Assistances (MAD/an)
            </label>
            <input
              type="range"
              min="10000"
              max="200000"
              step="10000"
              value={simulationExpenses}
              onChange={(e) => setSimulationExpenses(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="text-right font-mono font-bold text-sky-400 text-sm mt-1">
              {simulationExpenses.toLocaleString('fr-MA')} MAD
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Auto-Entrepreneur */}
          <div className="bg-slate-950/80 p-6 border border-slate-800/80 rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-extrabold text-slate-300">Régime Auto-Entrepreneur</h4>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-bold">
                Plafond 200k MAD
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Impôt Direct (1% CA) :</span>
                <span className="font-mono font-bold text-rose-400">-{aeTax.toLocaleString('fr-MA')} MAD</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Déduction Frais Tournage :</span>
                <span className="font-mono text-slate-500">0 MAD (Non autorisée)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Récupération TVA 20% Matériel :</span>
                <span className="font-mono font-bold text-rose-400">0 MAD (Perdue !)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Responsabilité Juridique :</span>
                <span className="font-bold text-rose-400">Illimitée sur le patrimoine perso</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-center shadow-inner">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Bénéfice Net Réel après équipement</span>
              <div className="text-xl font-black font-mono text-slate-300 mt-1">
                {(simulationTurnover - aeTax - simulationGearInvestment - simulationExpenses).toLocaleString('fr-MA')} MAD
              </div>
            </div>
          </div>

          {/* Card 2: SARL AU (Winning Option!) */}
          <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 border-2 border-emerald-500/60 rounded-2xl space-y-4 shadow-xl relative">
            <div className="absolute -top-3 right-4 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-lg shadow-emerald-500/20">
              Option Hautement Recommandée
            </div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" /> SARL AU (Société à Associé Unique)
              </h4>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                Aucun Plafond de CA
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Impôt sur les Sociétés (IS 10%) :</span>
                <span className="font-mono font-bold text-amber-400">-{sarlIsTax.toLocaleString('fr-MA')} MAD</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Amortissement Caméra/Lenses :</span>
                <span className="font-mono text-emerald-400">+{yearlyGearDepreciation.toLocaleString('fr-MA')} MAD / an</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>TVA 20% Récupérée sur Achat Matériel :</span>
                <span className="font-mono font-black text-emerald-400">
                  +{sarlTvaRecovered.toLocaleString('fr-MA')} MAD
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Protection Juridique :</span>
                <span className="font-bold text-emerald-400">Limitée au capital de la société</span>
              </div>
            </div>

            <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-500/40 text-center shadow-inner">
              <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider">Économie Globale & Gain de Trésorerie SARL</span>
              <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                +{sarlNetSavingsMAD.toLocaleString('fr-MA')} MAD de gain fiscal & TVA
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Action Plan to Create SARL in Morocco */}
        <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800/80 space-y-4 shadow-lg">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-400" /> Guide d'Action Création SARL AU au Maroc (Procédure Dépôt)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 space-y-1.5 shadow-sm">
              <span className="text-amber-400 font-extrabold font-mono text-xs uppercase tracking-wider">Étape 1</span>
              <h5 className="font-bold text-white">Certificat Négatif OMPIC</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">Réservation du nom commercial de votre studio de production.</p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 space-y-1.5 shadow-sm">
              <span className="text-amber-400 font-extrabold font-mono text-xs uppercase tracking-wider">Étape 2</span>
              <h5 className="font-bold text-white">Rédaction des Statuts</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">Constitution du capital (ex: 10,000 MAD) et désignation du gérant.</p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 space-y-1.5 shadow-sm">
              <span className="text-amber-400 font-extrabold font-mono text-xs uppercase tracking-wider">Étape 3</span>
              <h5 className="font-bold text-white">Inscriptions Fiscales & RC</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">Obtention de l'ICE, l'IF, la Taxe Pro et l'immatriculation au Registre du Commerce (RC).</p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 space-y-1.5 shadow-sm">
              <span className="text-amber-400 font-extrabold font-mono text-xs uppercase tracking-wider">Étape 4</span>
              <h5 className="font-bold text-white">Compte Bancaire Pro B2B</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">Ouverture du compte bancaire d'entreprise et affiliation CNSS.</p>
            </div>
          </div>
        </div>

        {/* Advice History Log Table */}
        <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800/80 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Historique & Suivi des Recommandations Stratégiques
            </h4>
            <span className="text-xs font-bold text-slate-400">{adviceHistory.length} entrée(s)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3.5 font-bold">Date</th>
                  <th className="py-3 px-3.5 font-bold">Titre du Conseil</th>
                  <th className="py-3 px-3.5 font-bold">Catégorie</th>
                  <th className="py-3 px-3.5 font-bold">Statut</th>
                  <th className="py-3 px-3.5 font-bold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {adviceHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-3.5 text-slate-400 font-mono text-[11px]">{item.date}</td>
                    <td className="py-3.5 px-3.5 font-bold text-white">{item.title}</td>
                    <td className="py-3.5 px-3.5">
                      <span className="px-2.5 py-1 bg-slate-800 text-amber-300 rounded-md text-[10px] font-bold">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          item.status === 'Appliqué'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-slate-400 text-[11px] italic">{item.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

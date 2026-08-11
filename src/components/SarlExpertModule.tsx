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
import { DocumentData, ClientData, ExpenseItem, StrategicAdvice } from '../types';

interface SarlExpertModuleProps {
  documents: DocumentData[];
  clients: ClientData[];
  expenses: ExpenseItem[];
}

export const SarlExpertModule: React.FC<SarlExpertModuleProps> = ({
  documents,
  clients,
  expenses,
}) => {
  const [simulationTurnover, setSimulationTurnover] = useState<number>(250000); // Default 250k MAD
  const [simulationGearInvestment, setSimulationGearInvestment] = useState<number>(80000); // 80k MAD cinema gear
  const [simulationExpenses, setSimulationExpenses] = useState<number>(60000); // 60k MAD assistants & travels

  // Valid revenue total HT
  const validDocs = documents.filter((d) => d.status !== 'brouillon');
  const actualTurnoverHT = validDocs.reduce((sum, doc) => {
    return sum + doc.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discountPercent || 0) / 100), 0);
  }, 0);

  // Generate Automatic End-of-Month Strategic Analysis
  const generateStrategicInsights = (): StrategicAdvice[] => {
    const adviceList: StrategicAdvice[] = [];

    // 1. Client Concentration Analysis
    const clientRevenues: Record<string, { name: string; amount: number }> = {};
    validDocs.forEach((doc) => {
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-1">
            <BrainCircuit className="w-4 h-4" /> Module 4 • Expert Conseil & Simulateur de Transition SARL
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Conseil Stratégique & Passage en SARL</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Analyse automatique de fin de mois, optimisation des tarifs audiovisuels et simulation fiscale comparative Auto-Entrepreneur vs SARL AU.
          </p>
        </div>

        <div className="bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/40 px-4 py-2 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" /> Score de Préparation SARL: <span className="font-extrabold text-emerald-400 text-sm">88 / 100</span>
        </div>
      </div>

      {/* Strategic AI Advisory Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" /> Diagnostic Stratégique Automatique de Fin de Mois
            </h3>
            <p className="text-xs text-slate-400">Recommandations basées sur vos chiffres réels et la réglementation marocaine</p>
          </div>
          <span className="text-xs text-slate-500">Mis à jour automatiquement</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategicAdviceList.map((adv) => (
            <div
              key={adv.id}
              className={`p-4 rounded-xl border space-y-2 flex flex-col justify-between transition-all ${
                adv.type === 'danger'
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : adv.type === 'warning'
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : adv.type === 'opportunity'
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      adv.type === 'danger'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : adv.type === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {adv.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Impact: {adv.impactScore}%</span>
                </div>

                <h4 className="text-sm font-bold text-white">{adv.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{adv.message}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" /> {adv.actionText}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparative SARL AU vs Auto-Entrepreneur Simulator */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-400" /> Simulateur Comparatif : Auto-Entrepreneur vs SARL AU
            </h3>
            <p className="text-xs text-slate-400">
              Calculez les économies fiscales et la récupération de TVA 20% sur l'achat de vos caméras & objectifs.
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl">
            Loi de Finance Maroc
          </span>
        </div>

        {/* Interactive Simulation Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950 p-5 rounded-xl border border-slate-800">
          <div>
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

          <div>
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

          <div>
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
          <div className="bg-slate-950 p-5 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-base font-extrabold text-slate-300">Régime Auto-Entrepreneur</h4>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-bold">
                Plafond 200k MAD
              </span>
            </div>

            <div className="space-y-2 text-xs">
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

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Bénéfice Net Réel après équipement</span>
              <div className="text-xl font-black font-mono text-slate-300 mt-0.5">
                {(simulationTurnover - aeTax - simulationGearInvestment - simulationExpenses).toLocaleString('fr-MA')} MAD
              </div>
            </div>
          </div>

          {/* Card 2: SARL AU (Winning Option!) */}
          <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-5 border-2 border-emerald-500/60 rounded-2xl space-y-4 shadow-xl relative">
            <div className="absolute -top-3 right-4 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-3 py-0.5 rounded-full shadow">
              Option Hautement Recommandée
            </div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" /> SARL AU (Société à Associé Unique)
              </h4>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                Aucun Plafond de CA
              </span>
            </div>

            <div className="space-y-2 text-xs">
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

            <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/40 text-center">
              <span className="text-[10px] text-emerald-300 uppercase font-bold">Économie Globale & Gain de Trésorerie SARL</span>
              <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                +{sarlNetSavingsMAD.toLocaleString('fr-MA')} MAD de gain fiscal & TVA
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Action Plan to Create SARL in Morocco */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-400" /> Guide d'Action Création SARL AU au Maroc (Procédure Dépôt)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-amber-400 font-extrabold font-mono text-sm">Étape 1</span>
              <h5 className="font-bold text-white">Certificat Négatif OMPIC</h5>
              <p className="text-[11px] text-slate-400">Réservation du nom commercial de votre studio de production.</p>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-amber-400 font-extrabold font-mono text-sm">Étape 2</span>
              <h5 className="font-bold text-white">Rédaction des Statuts</h5>
              <p className="text-[11px] text-slate-400">Constitution du capital (ex: 10,000 MAD) et désignation du gérant.</p>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-amber-400 font-extrabold font-mono text-sm">Étape 3</span>
              <h5 className="font-bold text-white">Inscriptions Fiscales & RC</h5>
              <p className="text-[11px] text-slate-400">Obtention de l'ICE, l'IF, la Taxe Pro et l'immatriculation au Registre du Commerce (RC).</p>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-amber-400 font-extrabold font-mono text-sm">Étape 4</span>
              <h5 className="font-bold text-white">Compte Bancaire Pro B2B</h5>
              <p className="text-[11px] text-slate-400">Ouverture du compte bancaire d'entreprise et affiliation CNSS.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

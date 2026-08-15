import React, { useState } from 'react';
import {
  Camera,
  Film,
  Users,
  Calendar,
  FileCheck,
  Plus,
  Trash2,
  Copy,
  Printer,
  Calculator,
  Sparkles,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import {
  GearItem,
  CrewRoleItem,
  CallSheetData,
  LegalClause,
  DocumentData,
  DocumentItem
} from '../types';
import {
  initialGearList,
  initialCrewRoles,
  initialCallSheets,
  legalClauses
} from '../data/productionData';

interface ProductionGearModuleProps {
  documents: DocumentData[];
  onSaveDocument: (doc: DocumentData) => void;
}

const defaultBlankCallSheet: CallSheetData = {
  id: 'cs-new',
  projectTitle: '',
  clientName: '',
  shootDate: new Date().toISOString().split('T')[0],
  locationCity: 'Casablanca',
  locationAddress: '',
  callTime: '07:00',
  sunsetTime: '19:30',
  directorName: 'Taha Hafsi',
  dpName: '',
  producerPhone: '+212698519895',
  scenesNotes: '',
  weatherNotes: '',
  requiredGear: [],
};

export const ProductionGearModule: React.FC<ProductionGearModuleProps> = ({
  documents,
  onSaveDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'gear' | 'crew' | 'callsheet' | 'legal'>('gear');

  // Gear State with localStorage persistence
  const [gearList, setGearList] = useState<GearItem[]>(() => {
    try {
      const saved = localStorage.getItem('cinemanage_gear_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return initialGearList;
  });

  const [daysShootCount, setDaysShootCount] = useState<number>(1);
  const [customGearName, setCustomGearName] = useState<string>('');
  const [customGearRate, setCustomGearRate] = useState<number>(1500);

  // Crew State
  const [crewList, setCrewList] = useState<CrewRoleItem[]>(initialCrewRoles);

  // Call Sheet State
  const [callSheets, setCallSheets] = useState<CallSheetData[]>(() => {
    try {
      const saved = localStorage.getItem('cinemanage_callsheets_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return initialCallSheets;
  });

  const [activeCallSheet, setActiveCallSheet] = useState<CallSheetData>(() => {
    return initialCallSheets[0] || defaultBlankCallSheet;
  });
  const [isEditingCallSheet, setIsEditingCallSheet] = useState<boolean>(false);

  // Sync to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('cinemanage_gear_v2', JSON.stringify(gearList));
    } catch {
      // ignore
    }
  }, [gearList]);

  React.useEffect(() => {
    try {
      localStorage.setItem('cinemanage_callsheets_v2', JSON.stringify(callSheets));
    } catch {
      // ignore
    }
  }, [callSheets]);

  // Copy Feedback state
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Toggle selection of gear
  const toggleGearSelection = (id: string) => {
    setGearList((prev) =>
      prev.map((g) => (g.id === id ? { ...g, isSelected: !g.isSelected } : g))
    );
  };

  // Update gear rate
  const handleUpdateGearRate = (id: string, newRate: number) => {
    setGearList((prev) =>
      prev.map((g) => (g.id === id ? { ...g, dailyRateMAD: newRate } : g))
    );
  };

  // Delete gear
  const handleDeleteGear = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Voulez-vous supprimer cet équipement ?')) {
      setGearList((prev) => prev.filter((g) => g.id !== id));
    }
  };

  // Update crew rate
  const handleUpdateCrewRate = (id: string, newRate: number) => {
    setCrewList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, dayRateMAD: newRate } : c))
    );
  };

  // Toggle selection of crew
  const toggleCrewSelection = (id: string) => {
    setCrewList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isSelected: !c.isSelected } : c))
    );
  };

  // Calculate coefficient for multi-day rental
  // 1 day = 1.0, 2 days = 1.8, 3 days = 2.5, 5 days = 3.8, 7 days = 4.5
  const getMultiDayCoeff = (days: number) => {
    if (days <= 1) return 1;
    if (days === 2) return 1.8;
    if (days === 3) return 2.5;
    if (days <= 5) return 3.5;
    return 4.5;
  };

  const rentalCoeff = getMultiDayCoeff(daysShootCount);

  // Calculate selected gear total
  const selectedGear = gearList.filter((g) => g.isSelected);
  const totalGearDailyRate = selectedGear.reduce((sum, g) => sum + g.dailyRateMAD, 0);
  const totalGearDiscountedRental = Math.round(totalGearDailyRate * rentalCoeff);

  // Calculate selected crew total
  const selectedCrew = crewList.filter((c) => c.isSelected);
  const totalCrewCost = selectedCrew.reduce(
    (sum, c) => sum + c.dayRateMAD * c.daysCount,
    0
  );

  // Add custom gear
  const handleAddCustomGear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGearName.trim()) return;

    const newGear: GearItem = {
      id: `gear-${Date.now()}`,
      category: 'Caméra & Optiques',
      name: customGearName,
      dailyRateMAD: customGearRate,
      purchaseValueMAD: customGearRate * 25,
      amortizationMonths: 18,
      isSelected: true,
    };

    setGearList([newGear, ...gearList]);
    setCustomGearName('');
  };

  // Push Gear / Crew directly into latest or new Devis
  const handlePushToDevis = (itemsToAdd: { description: string; unitPrice: number; quantity: number }[]) => {
    const year = new Date().getFullYear();
    const count = documents.filter((d) => d.type === 'DEVIS').length + 1;
    const num = `DEV-${year}-${String(count).padStart(3, '0')}`;

    const newDocItems: DocumentItem[] = itemsToAdd.map((it, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    }));

    const newDoc: DocumentData = {
      id: `doc-${Date.now()}`,
      type: 'DEVIS',
      number: num,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      clientId: documents[0]?.clientId || 'c-1',
      clientName: documents[0]?.clientName || 'Client Média',
      clientCompany: documents[0]?.clientCompany || 'Agence Pub',
      clientIce: documents[0]?.clientIce || '002984123000088',
      clientAddress: documents[0]?.clientAddress || 'Casablanca, Maroc',
      items: newDocItems,
      tvaRate: 20,
      acompteRate: 40,
      status: 'brouillon',
      checklist: {
        briefSent: false,
        bonAccordSigned: false,
        orderReceived: false,
        driveSaved: false,
        relanceSent: false,
      },
      notes: 'Matériel cinéma fourni sous assurance studio. Conditions d\'acompte 40% à la commande.',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSaveDocument(newDoc);
    alert(`Nouveau Devis ${num} créé avec les éléments ajoutés ! Rendez-vous dans le module "Générateur de Documents" pour la prévisualisation.`);
  };

  return (
    <div className="space-y-6">
      {/* Module Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl shadow-xl shadow-black/20">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-1.5">
            <Camera className="w-4 h-4 text-amber-400" /> Studio & Production Hub • Filmmaker OS
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Tarif Matériel, Équipe & Tournage
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Calculez les tarifs de rental cinéma, estimez les coûts d'équipe, générez vos feuilles de service et accédez aux contrats de cession de droits.
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800/80 px-5 py-3.5 rounded-2xl shadow-inner">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Sélection Matériel</div>
            <div className="text-lg font-mono font-black text-amber-400">
              {totalGearDiscountedRental.toLocaleString('fr-MA')} MAD
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Équipe Tournage</div>
            <div className="text-lg font-mono font-black text-white">
              {totalCrewCost.toLocaleString('fr-MA')} MAD
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
        {[
          { id: 'gear' as const, label: 'Calculateur Rental Matériel & ROI', icon: Camera },
          { id: 'crew' as const, label: 'Tarifs Équipe Cinéma Maroc', icon: Users },
          { id: 'callsheet' as const, label: 'Feuille de Service (Call Sheet)', icon: Calendar },
          { id: 'legal' as const, label: 'Clauses Juridiques & Droits', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: GEAR RENTAL & AMORTIZATION */}
      {activeTab === 'gear' && (
        <div className="space-y-6">
          {/* Days Slider & Discount Controls */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg shadow-black/10">
            <div className="space-y-1 flex-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Durée du Tournage (Jours) :</span>
                <span className="text-base font-mono font-black text-amber-400">
                  {daysShootCount} {daysShootCount > 1 ? 'Jours' : 'Jour'} (Coeff. Dégressif : {rentalCoeff}x)
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={daysShootCount}
                onChange={(e) => setDaysShootCount(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span>1j (100%)</span>
                <span>2j (180%)</span>
                <span>3j (250%)</span>
                <span>5j (350%)</span>
                <span>7j (450%)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (selectedGear.length === 0) {
                    alert('Veuillez sélectionner au moins un matériel ci-dessous !');
                    return;
                  }
                  const items = selectedGear.map((g) => ({
                    description: `Location matériel : ${g.name} (${daysShootCount} jour(s) de tournage)`,
                    unitPrice: Math.round(g.dailyRateMAD * rentalCoeff),
                    quantity: 1,
                  }));
                  handlePushToDevis(items);
                }}
                className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Injecter Sélection au Devis ({totalGearDiscountedRental.toLocaleString('fr-MA')} MAD)
              </button>
            </div>
          </div>

          {/* Quick Add Custom Gear Form */}
          <form onSubmit={handleAddCustomGear} className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap gap-3 items-center shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Ajout Matériel Studio :</span>
            <input
              type="text"
              placeholder="Ex: Moniteur SmallHD 703 UltraBright..."
              value={customGearName}
              onChange={(e) => setCustomGearName(e.target.value)}
              className="flex-1 min-w-[200px] bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
            />
            <input
              type="number"
              placeholder="Tarif Jour HT (MAD)"
              value={customGearRate}
              onChange={(e) => setCustomGearRate(parseFloat(e.target.value) || 0)}
              className="w-36 bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-amber-400 p-2.5 rounded-xl focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              + Ajouter
            </button>
          </form>

          {/* Gear Cards Grid */}
          {gearList.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 p-12 text-center text-slate-400 rounded-2xl space-y-3">
              <Camera className="w-12 h-12 text-amber-400 mx-auto opacity-80" />
              <h4 className="text-base font-bold text-white uppercase tracking-tight">Aucun équipement enregistré</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Ajoutez votre propre matériel réel ci-dessus (Boîtiers, Optiques, Éclairage, Son HF, Drones, Stabilisateurs) pour composer vos kits de tournage et estimer leur amortissement.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {gearList.map((gear) => {
                const totalRentalForShoot = Math.round(gear.dailyRateMAD * rentalCoeff);
                const rentalsToAmortize = Math.ceil(gear.purchaseValueMAD / (gear.dailyRateMAD || 1));

                return (
                  <div
                    key={gear.id}
                    onClick={() => toggleGearSelection(gear.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 shadow-lg shadow-black/10 ${
                      gear.isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-amber-500/5'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          {gear.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteGear(gear.id, e)}
                            className="p-1 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                            title="Supprimer cet équipement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="checkbox"
                            checked={gear.isSelected || false}
                            onChange={() => {}}
                            className="accent-amber-500 w-4 h-4 cursor-pointer"
                          />
                        </div>
                      </div>

                      <h4 className="text-xs font-extrabold text-white leading-snug">
                        {gear.name}
                      </h4>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Tarif Jour (MAD) :</span>
                        <input
                          type="number"
                          value={gear.dailyRateMAD}
                          onChange={(e) => handleUpdateGearRate(gear.id, parseFloat(e.target.value) || 0)}
                          className="w-24 bg-slate-950 border border-slate-800 text-xs font-mono font-black text-amber-400 px-2 py-1 rounded-lg text-right focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-between items-baseline font-mono text-[11px]">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Total Tournage ({daysShootCount}j) :</span>
                        <span className="font-bold text-white">{totalRentalForShoot.toLocaleString('fr-MA')} MAD</span>
                      </div>

                      <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 text-[10px] font-mono text-slate-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Achat Neuf :</span>
                          <span>{gear.purchaseValueMAD.toLocaleString('fr-MA')} MAD</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-bold">
                          <span>Amorti en :</span>
                          <span>{rentalsToAmortize} locations</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREW BUDGET ESTIMATOR */}
      {activeTab === 'crew' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl shadow-xl shadow-black/20">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Grille Tarifaire & Barème Techniciens Cinéma
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tarifs de référence constatés sur le marché de la production au Maroc (Casablanca, Rabat, Ouarzazate).
              </p>
            </div>

            <button
              onClick={() => {
                if (selectedCrew.length === 0) {
                  alert('Veuillez cocher au moins un technicien ci-dessous !');
                  return;
                }
                const items = selectedCrew.map((c) => ({
                  description: `Prestation Équipe : ${c.roleName} (${c.daysCount} jour(s))`,
                  unitPrice: c.dayRateMAD,
                  quantity: c.daysCount,
                }));
                handlePushToDevis(items);
              }}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer shrink-0 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Injecter Équipe au Devis ({totalCrewCost.toLocaleString('fr-MA')} MAD)
            </button>
          </div>

          <div className="space-y-2.5">
            {crewList.map((crew) => {
              return (
                <div
                  key={crew.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 shadow-sm ${
                    crew.isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-amber-500/5'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-[250px]">
                    <input
                      type="checkbox"
                      checked={crew.isSelected || false}
                      onChange={() => toggleCrewSelection(crew.id)}
                      className="accent-amber-500 w-5 h-5 cursor-pointer rounded"
                    />
                    <div>
                      <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        {crew.department}
                      </span>
                      <h4 className="text-sm font-bold text-white tracking-tight mt-1">
                        {crew.roleName}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-bold uppercase">Jours :</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={crew.daysCount}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setCrewList((prev) =>
                            prev.map((item) => (item.id === crew.id ? { ...item, daysCount: val } : item))
                          );
                        }}
                        className="w-16 bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white p-2 rounded-xl text-center focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="text-right w-32">
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Tarif / Jour (MAD)</div>
                      <input
                        type="number"
                        value={crew.dayRateMAD}
                        onChange={(e) => handleUpdateCrewRate(crew.id, parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-amber-400 p-2 rounded-xl text-right focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="text-right w-32 border-l border-slate-800 pl-4">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Total HT</div>
                      <div className="text-base font-mono font-black text-white">
                        {(crew.dayRateMAD * crew.daysCount).toLocaleString('fr-MA')} MAD
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CALL SHEET GENERATOR */}
      {activeTab === 'callsheet' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Edit Call Sheet Form */}
          <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl space-y-4 shadow-xl shadow-black/20">
            <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" /> Éditeur de Feuille de Service
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Titre du Projet Vidéo</label>
                <input
                  type="text"
                  value={activeCallSheet.projectTitle}
                  onChange={(e) => setActiveCallSheet({ ...activeCallSheet, projectTitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Client / Agence</label>
                  <input
                    type="text"
                    value={activeCallSheet.clientName}
                    onChange={(e) => setActiveCallSheet({ ...activeCallSheet, clientName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Date du Tournage</label>
                  <input
                    type="date"
                    value={activeCallSheet.shootDate}
                    onChange={(e) => setActiveCallSheet({ ...activeCallSheet, shootDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-400 font-bold mb-1">Heure Convocation (Call Time)</label>
                  <input
                    type="text"
                    value={activeCallSheet.callTime}
                    onChange={(e) => setActiveCallSheet({ ...activeCallSheet, callTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold p-2.5 rounded-xl focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Coucher du Soleil (Sunset)</label>
                  <input
                    type="text"
                    value={activeCallSheet.sunsetTime}
                    onChange={(e) => setActiveCallSheet({ ...activeCallSheet, sunsetTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white font-mono p-2.5 rounded-xl focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Lieu & Adresse du Décor</label>
                <input
                  type="text"
                  value={activeCallSheet.locationAddress}
                  onChange={(e) => setActiveCallSheet({ ...activeCallSheet, locationAddress: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Réalisateur</label>
                  <input
                    type="text"
                    value={activeCallSheet.directorName}
                    onChange={(e) => setActiveCallSheet({ ...activeCallSheet, directorName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Chef Opérateur (DP)</label>
                  <input
                    type="text"
                    value={activeCallSheet.dpName}
                    onChange={(e) => setActiveCallSheet({ ...activeCallSheet, dpName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Notes Découpage Technique & Scènes</label>
                <textarea
                  rows={3}
                  value={activeCallSheet.scenesNotes}
                  onChange={(e) => setActiveCallSheet({ ...activeCallSheet, scenesNotes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Right Live Printable Call Sheet */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Feuille de Service Officielle Tournage
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const text = `🎥 FEUILLE DE SERVICE TOURNAGE\nProjet : ${activeCallSheet.projectTitle}\nDate : ${activeCallSheet.shootDate}\n⏰ CALL TIME : ${activeCallSheet.callTime}\n📍 Lieu : ${activeCallSheet.locationAddress}\n🎬 Réalisateur : ${activeCallSheet.directorName}\n📷 DP : ${activeCallSheet.dpName}\n\n📝 SCÈNES & NOTES :\n${activeCallSheet.scenesNotes}`;
                    handleCopy(text, 'Call Sheet Copiée !');
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" /> {copiedText === 'Call Sheet Copiée !' ? 'Copié !' : 'Copier WhatsApp'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimer
                </button>
              </div>
            </div>

            {/* Call Sheet Display Document Box */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4 text-xs font-mono shadow-inner">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-black text-amber-400 uppercase tracking-wider">{activeCallSheet.projectTitle}</h2>
                  <p className="text-slate-400 mt-0.5">CLIENT : {activeCallSheet.clientName}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-white bg-slate-950 px-3.5 py-1.5 rounded-lg border border-amber-500/40 shadow-sm">
                    {activeCallSheet.callTime}
                  </div>
                  <div className="text-[10px] text-amber-400 uppercase font-bold mt-1">CALL TIME ÉQUIPE</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">DATE & HORAIRES</span>
                  <div className="text-white font-bold mt-0.5">{activeCallSheet.shootDate}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Coucher du Soleil : {activeCallSheet.sunsetTime}</div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">ADRESSE DU DÉCOR</span>
                  <div className="text-white font-bold flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> {activeCallSheet.locationAddress}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">RÉALISATEUR</span>
                  <div className="text-white font-bold mt-0.5">{activeCallSheet.directorName}</div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">DIRECTEUR PHOTO (DP)</span>
                  <div className="text-white font-bold mt-0.5">{activeCallSheet.dpName}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1.5">PROGRAMME ET DECOUPAGE DES SCÈNES</span>
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {activeCallSheet.scenesNotes}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LEGAL & COPYRIGHT CONTRACT CLAUSES */}
      {activeTab === 'legal' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl shadow-xl shadow-black/20">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" /> Bibliothèque de Clauses Juridiques & Cession de Droits Maroc
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Copiez-collez les clauses contractuelles indispensables pour vos devis, conditions générales de vente (CGV) et contrats d'auteur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {legalClauses.map((clause) => {
              return (
                <div key={clause.id} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl space-y-3 relative shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      {clause.category}
                    </span>

                    <button
                      onClick={() => handleCopy(clause.content, clause.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-bold text-[10px] uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> {copiedText === clause.id ? 'Copié !' : 'Copier Clause'}
                    </button>
                  </div>

                  <h4 className="text-sm font-extrabold text-white tracking-tight">
                    {clause.title}
                  </h4>

                  <p className="text-xs text-slate-300 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed font-mono">
                    "{clause.content}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

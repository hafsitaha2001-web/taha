import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { DocumentGeneratorModule } from './components/DocumentGeneratorModule';
import { ClientNetworkModule } from './components/ClientNetworkModule';
import { ProductionGearModule } from './components/ProductionGearModule';
import { FinancialDashboardModule } from './components/FinancialDashboardModule';
import { SarlExpertModule } from './components/SarlExpertModule';
import { StudioSettingsModal } from './components/StudioSettingsModal';
import { GeminiChatModal } from './components/GeminiChatModal';
import { Sparkles } from 'lucide-react';
import { ProfileInfo, ClientData, DocumentData, ExpenseItem, DirectRevenueItem } from './types';
import {
  initialProfile,
  initialClients,
  initialDocuments,
  initialExpenses,
  initialDirectRevenues,
} from './data/initialData';

const STORAGE_KEYS = {
  VERSION: 'cinemanage_clean_reset_v2',
  PROFILE: 'cinemanage_profile_v2',
  CLIENTS: 'cinemanage_clients_v2',
  DOCUMENTS: 'cinemanage_documents_v2',
  EXPENSES: 'cinemanage_expenses_v2',
  DIRECT_REVENUES: 'cinemanage_direct_revenues_v2',
};

// One-time automatic purge of previous mock/virtual dummy data
if (typeof window !== 'undefined') {
  try {
    const isCleanV2 = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (!isCleanV2) {
      localStorage.removeItem('cinemanage_clients_v1');
      localStorage.removeItem('cinemanage_documents_v1');
      localStorage.removeItem('cinemanage_expenses_v1');
      localStorage.removeItem('cinemanage_direct_revenues_v1');
      localStorage.removeItem('cinemanage_gear_v1');
      localStorage.removeItem('cinemanage_custom_goals');
      localStorage.removeItem('cinemanage_active_goal_id');
      localStorage.removeItem(STORAGE_KEYS.CLIENTS);
      localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
      localStorage.removeItem(STORAGE_KEYS.EXPENSES);
      localStorage.removeItem(STORAGE_KEYS.DIRECT_REVENUES);
      localStorage.setItem(STORAGE_KEYS.VERSION, 'true');
    }
  } catch {
    // ignore
  }
}

export default function App() {
  // Load initial state from LocalStorage or fall back to clean empty state
  const [profile, setProfile] = useState<ProfileInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          !parsed.bannerImage ||
          parsed.bannerImage.includes('1485846234645-a62644f84728') ||
          parsed.bannerImage.includes('unsplash') ||
          parsed.bannerImage.startsWith('/src/') ||
          parsed.bannerImage.startsWith('http')
        ) {
          parsed.bannerImage = initialProfile.bannerImage;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return initialProfile;
  });

  const [clients, setClients] = useState<ClientData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return saved ? JSON.parse(saved) : initialClients;
    } catch {
      return initialClients;
    }
  });

  const [documents, setDocuments] = useState<DocumentData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      return saved ? JSON.parse(saved) : initialDocuments;
    } catch {
      return initialDocuments;
    }
  });

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : initialExpenses;
    } catch {
      return initialExpenses;
    }
  });

  const [directRevenues, setDirectRevenues] = useState<DirectRevenueItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DIRECT_REVENUES);
      return saved ? JSON.parse(saved) : initialDirectRevenues;
    } catch {
      return initialDirectRevenues;
    }
  });

  const [activeModule, setActiveModule] = useState<'docs' | 'crm' | 'prod' | 'stats' | 'expert'>('docs');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGeminiChatOpen, setIsGeminiChatOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    const palette = profile.colorPalette || 'gold';
    document.body.classList.remove('theme-gold', 'theme-indigo', 'theme-emerald', 'theme-crimson', 'theme-sunset');
    document.body.classList.add(`theme-${palette}`);
    if (profile.theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DIRECT_REVENUES, JSON.stringify(directRevenues));
  }, [directRevenues]);

  // Document Handlers
  const handleSaveDocument = (doc: DocumentData) => {
    setDocuments((prev) => {
      const idx = prev.findIndex((d) => d.id === doc.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = doc;
        return copy;
      }
      return [doc, ...prev];
    });
  };

  const handleDeleteDocument = (docId: string) => {
    if (confirm('Voulez-vous supprimer ce document ?')) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    }
  };

  // Direct Revenue Handlers (Pour les clients sans devis / sans papier / forfaits récurrents)
  const handleSaveDirectRevenue = (item: DirectRevenueItem) => {
    setDirectRevenues((prev) => {
      const idx = prev.findIndex((r) => r.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [item, ...prev];
    });
  };

  const handleDeleteDirectRevenue = (itemId: string) => {
    if (confirm('Voulez-vous supprimer cette entrée de revenu direct / forfait ?')) {
      setDirectRevenues((prev) => prev.filter((r) => r.id !== itemId));
    }
  };

  // Client Handlers
  const handleSaveClient = (client: ClientData) => {
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === client.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = client;
        return copy;
      }
      return [client, ...prev];
    });
  };

  const handleDeleteClient = (clientId: string) => {
    if (confirm('Voulez-vous supprimer ce client ?')) {
      setClients((prev) => prev.filter((c) => c.id !== clientId));
    }
  };

  // Expense Handler
  const handleAddExpense = (expense: ExpenseItem) => {
    setExpenses((prev) => [expense, ...prev]);
  };

  // Profile Handler
  const handleSaveProfile = (newProfile: ProfileInfo) => {
    setProfile(newProfile);
  };

  // Data Reset & JSON Export / Import
  const handleResetData = () => {
    setProfile(initialProfile);
    setClients(initialClients);
    setDocuments(initialDocuments);
    setExpenses(initialExpenses);
    setDirectRevenues(initialDirectRevenues);
    localStorage.clear();
  };

  const handleExportData = () => {
    const data = {
      profile,
      clients,
      documents,
      expenses,
      directRevenues,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinemanage_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.profile) setProfile(json.profile);
        if (json.clients) setClients(json.clients);
        if (json.documents) setDocuments(json.documents);
        if (json.expenses) setExpenses(json.expenses);
        if (json.directRevenues) setDirectRevenues(json.directRevenues);
        alert('Données importées avec succès !');
      } catch (err) {
        alert("Erreur lors de l'importation du fichier JSON.");
      }
    };
    reader.readAsText(file);
  };

  const paletteGlows = {
    gold: {
      spot1: 'from-amber-500/12 via-amber-600/6 to-transparent',
      spot2: 'from-sky-500/8 via-indigo-600/5 to-transparent',
      spot3: 'from-emerald-500/8 via-transparent to-transparent',
    },
    indigo: {
      spot1: 'from-indigo-500/15 via-violet-600/8 to-transparent',
      spot2: 'from-cyan-500/10 via-blue-600/5 to-transparent',
      spot3: 'from-purple-500/10 via-transparent to-transparent',
    },
    emerald: {
      spot1: 'from-emerald-500/15 via-teal-600/8 to-transparent',
      spot2: 'from-cyan-500/10 via-emerald-600/5 to-transparent',
      spot3: 'from-lime-500/8 via-transparent to-transparent',
    },
    crimson: {
      spot1: 'from-rose-500/15 via-red-600/8 to-transparent',
      spot2: 'from-amber-500/10 via-orange-600/5 to-transparent',
      spot3: 'from-pink-500/10 via-transparent to-transparent',
    },
    sunset: {
      spot1: 'from-orange-500/15 via-amber-600/8 to-transparent',
      spot2: 'from-rose-500/10 via-pink-600/5 to-transparent',
      spot3: 'from-yellow-500/8 via-transparent to-transparent',
    },
  };

  const activeGlows = paletteGlows[profile.colorPalette || 'gold'] || paletteGlows.gold;

  return (
    <div className="min-h-screen bg-[#07090E] text-[#E5E7EB] flex flex-col font-sans selection:bg-[#E2B714] selection:text-black antialiased relative overflow-x-hidden">
      {/* Cinematic ambient backdrop glows */}
      <div className={`fixed -top-40 left-1/4 w-[600px] h-[600px] bg-gradient-to-br ${activeGlows.spot1} rounded-full blur-3xl pointer-events-none -z-10 animate-pulse`} style={{ animationDuration: '8s' }} />
      <div className={`fixed top-1/3 -right-40 w-[600px] h-[600px] bg-gradient-to-bl ${activeGlows.spot2} rounded-full blur-3xl pointer-events-none -z-10`} />
      <div className={`fixed -bottom-40 left-1/3 w-[600px] h-[600px] bg-gradient-to-tr ${activeGlows.spot3} rounded-full blur-3xl pointer-events-none -z-10`} />

      {/* Navigation Top Bar */}
      <Navigation
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        profile={profile}
        onSaveProfile={setProfile}
        documents={documents}
        directRevenues={directRevenues}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGeminiChat={() => setIsGeminiChatOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-[1640px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8 items-start">
        {/* Desktop Left Sidebar */}
        <Sidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          documents={documents}
          directRevenues={directRevenues}
          profile={profile}
          onOpenGeminiChat={() => setIsGeminiChatOpen(true)}
        />

        {/* Active Module View Pane */}
        <div className="flex-1 min-w-0 space-y-6">
          {activeModule === 'docs' && (
            <DocumentGeneratorModule
              documents={documents}
              clients={clients}
              profile={profile}
              onSaveDocument={handleSaveDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          )}

          {activeModule === 'crm' && (
            <ClientNetworkModule
              clients={clients}
              documents={documents}
              directRevenues={directRevenues}
              onSaveClient={handleSaveClient}
              onDeleteClient={handleDeleteClient}
              onSaveDirectRevenue={handleSaveDirectRevenue}
              onDeleteDirectRevenue={handleDeleteDirectRevenue}
            />
          )}

          {activeModule === 'prod' && (
            <ProductionGearModule
              documents={documents}
              onSaveDocument={handleSaveDocument}
            />
          )}

          {activeModule === 'stats' && (
            <FinancialDashboardModule
              documents={documents}
              directRevenues={directRevenues}
              expenses={expenses}
              clients={clients}
              onSaveDirectRevenue={handleSaveDirectRevenue}
              onDeleteDirectRevenue={handleDeleteDirectRevenue}
            />
          )}

          {activeModule === 'expert' && (
            <SarlExpertModule
              documents={documents}
              directRevenues={directRevenues}
              clients={clients}
              expenses={expenses}
            />
          )}
        </div>
      </main>

      {/* Studio Profile & Settings Modal */}
      <StudioSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      {/* Gemini AI Assistant Chat Modal */}
      <GeminiChatModal
        isOpen={isGeminiChatOpen}
        onClose={() => setIsGeminiChatOpen(false)}
        profile={profile}
        clients={clients}
        documents={documents}
        expenses={expenses}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        onSaveDocument={handleSaveDocument}
        onSaveClient={handleSaveClient}
        onAddExpense={handleAddExpense}
        onSaveProfile={handleSaveProfile}
      />

      {/* Floating Action Button (FAB) for Gemini Chat */}
      <button
        onClick={() => setIsGeminiChatOpen(true)}
        className="fixed bottom-6 right-6 z-30 p-3.5 sm:px-4 sm:py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-[#E2B714] text-slate-950 font-black rounded-full shadow-2xl shadow-amber-500/40 hover:scale-105 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer no-print group border-2 border-amber-300"
        title="Ouvrir l'Assistant IA Gemini"
      >
        <Sparkles className="w-5 h-5 text-slate-950 animate-bounce" />
        <span className="hidden sm:inline text-xs uppercase tracking-wider italic">
          Assistant Gemini
        </span>
      </button>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 bg-slate-950/80 backdrop-blur-md py-6 text-center text-xs text-slate-500 no-print mt-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-slate-400">
            <strong className="text-white">CineManage Pro</strong> • Application d'accompagnement pour Filmmakers & Transition SARL au Maroc
          </div>
          <div className="font-mono text-[11px] text-amber-500/80 bg-amber-500/5 px-3 py-1 rounded-full border border-amber-500/10">
            Conforme Normes ICE, IF, TP, CNSS & Code Général des Impôts
          </div>
        </div>
      </footer>
    </div>
  );
}

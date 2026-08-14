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

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E5E7EB] flex flex-col font-sans selection:bg-[#E2B714] selection:text-black">
      {/* Navigation Top Bar */}
      <Navigation
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        profile={profile}
        documents={documents}
        directRevenues={directRevenues}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGeminiChat={() => setIsGeminiChatOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 flex gap-8 items-start">
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
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>CineManage Pro</strong> • Application d'accompagnement pour Filmmakers & Transition SARL au Maroc
          </div>
          <div className="font-mono text-[11px] text-amber-500/80">
            Conforme Normes ICE, IF, TP, CNSS & Code Général des Impôts
          </div>
        </div>
      </footer>
    </div>
  );
}

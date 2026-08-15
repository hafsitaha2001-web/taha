import React, { useState, useEffect, useRef } from 'react';
import { Navigation } from './components/Navigation';
import { DocumentGeneratorModule } from './components/DocumentGeneratorModule';
import { ClientNetworkModule } from './components/ClientNetworkModule';
import { ProductionGearModule } from './components/ProductionGearModule';
import { FinancialDashboardModule } from './components/FinancialDashboardModule';
import { SarlExpertModule } from './components/SarlExpertModule';
import { StudioSettingsModal } from './components/StudioSettingsModal';
import { GeminiChatModal } from './components/GeminiChatModal';
import {
  ProfileInfo,
  ClientData,
  DocumentData,
  ExpenseItem,
  DirectRevenueItem,
} from './types';
import {
  initialProfile,
  initialClients,
  initialDocuments,
  initialExpenses,
  initialDirectRevenues,
} from './data/initialData';
import { subscribeToStudioCloud, saveStudioToCloud } from './lib/studioSync';
import { scanAndRecoverAllLocalStorage } from './lib/storageScanner';

const STORAGE_KEYS = {
  PROFILE: 'cinemanage_profile_v2',
  CLIENTS: 'cinemanage_clients_v2',
  DOCUMENTS: 'cinemanage_documents_v2',
  EXPENSES: 'cinemanage_expenses_v2',
  DIRECT_REVENUES: 'cinemanage_direct_revenues_v2',
};

// Scan for any previously stored items across any key
const recoveredData = scanAndRecoverAllLocalStorage();

// Helper function to read from v2 or fallback to v1/any previous key safely
function getStoredData<T>(keyV2: string, keyV1: string, recoveredList: T[] | undefined, fallback: T): T {
  if (recoveredList && Array.isArray(recoveredList) && recoveredList.length > 0) {
    return recoveredList as unknown as T;
  }
  if (typeof window === 'undefined') return fallback;
  try {
    const savedV2 = localStorage.getItem(keyV2);
    if (savedV2) {
      const parsed = JSON.parse(savedV2);
      if (Array.isArray(parsed) ? parsed.length > 0 : parsed) return parsed;
    }
    const savedV1 = localStorage.getItem(keyV1);
    if (savedV1) {
      const parsed = JSON.parse(savedV1);
      if (Array.isArray(parsed) ? parsed.length > 0 : parsed) return parsed;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export default function App() {
  // Load initial state safely from any existing LocalStorage key
  const [profile, setProfile] = useState<ProfileInfo>(() => {
    try {
      const saved = recoveredData.profile || getStoredData(STORAGE_KEYS.PROFILE, 'cinemanage_profile_v1', undefined, initialProfile);
      if (saved) {
        if (
          !saved.bannerImage ||
          saved.bannerImage.includes('1485846234645-a62644f84728') ||
          saved.bannerImage.includes('unsplash') ||
          saved.bannerImage.startsWith('/src/') ||
          saved.bannerImage.startsWith('http')
        ) {
          saved.bannerImage = initialProfile.bannerImage;
        }
        return saved;
      }
    } catch {
      // ignore
    }
    return initialProfile;
  });

  const [clients, setClients] = useState<ClientData[]>(() => {
    return getStoredData(STORAGE_KEYS.CLIENTS, 'cinemanage_clients_v1', recoveredData.clients, initialClients);
  });

  const [documents, setDocuments] = useState<DocumentData[]>(() => {
    return getStoredData(STORAGE_KEYS.DOCUMENTS, 'cinemanage_documents_v1', recoveredData.documents, initialDocuments);
  });

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    return getStoredData(STORAGE_KEYS.EXPENSES, 'cinemanage_expenses_v1', recoveredData.expenses, initialExpenses);
  });

  const [directRevenues, setDirectRevenues] = useState<DirectRevenueItem[]>(() => {
    return getStoredData(STORAGE_KEYS.DIRECT_REVENUES, 'cinemanage_direct_revenues_v1', recoveredData.directRevenues, initialDirectRevenues);
  });

  const [activeModule, setActiveModule] = useState<'docs' | 'crm' | 'prod' | 'stats' | 'expert'>('docs');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGeminiChatOpen, setIsGeminiChatOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Cloud Synchronization Status
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const isCloudUpdateRef = useRef<boolean>(false);
  const hasInitializedRef = useRef<boolean>(false);

  // Subscribe to Cloud Firestore (Real-Time across Mac, iPhone, etc.)
  useEffect(() => {
    const unsubscribe = subscribeToStudioCloud(
      (cloudData, rawSnapshotExists) => {
        if (rawSnapshotExists && cloudData) {
          isCloudUpdateRef.current = true;
          if (cloudData.profile) {
            setProfile((prev) => ({ ...prev, ...cloudData.profile }));
          }
          if (Array.isArray(cloudData.clients)) {
            setClients(cloudData.clients);
          }
          if (Array.isArray(cloudData.documents)) {
            setDocuments(cloudData.documents);
          }
          if (Array.isArray(cloudData.expenses)) {
            setExpenses(cloudData.expenses);
          }
          if (Array.isArray(cloudData.directRevenues)) {
            setDirectRevenues(cloudData.directRevenues);
          }
          setLastSyncTime(new Date());
          setCloudSyncStatus('synced');
          setTimeout(() => {
            isCloudUpdateRef.current = false;
            hasInitializedRef.current = true;
          }, 150);
        } else if (!rawSnapshotExists && !hasInitializedRef.current) {
          // Cloud snapshot doesn't exist yet, push current state to cloud
          saveStudioToCloud({
            profile,
            clients,
            documents,
            expenses,
            directRevenues,
          });
          hasInitializedRef.current = true;
        }
      },
      () => {
        setCloudSyncStatus('offline');
        hasInitializedRef.current = true;
      }
    );

    return () => unsubscribe();
  }, []);

  // Save changes to Cloud (whenever state is updated by user)
  useEffect(() => {
    // Avoid re-saving when incoming change is from Cloud Firestore listener
    if (isCloudUpdateRef.current || !hasInitializedRef.current) return;

    setCloudSyncStatus('saving');
    const timer = setTimeout(async () => {
      const success = await saveStudioToCloud({
        profile,
        clients,
        documents,
        expenses,
        directRevenues,
      });
      if (success) {
        setCloudSyncStatus('synced');
        setLastSyncTime(new Date());
      } else {
        setCloudSyncStatus('offline');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [profile, clients, documents, expenses, directRevenues]);

  // Sync state to LocalStorage as instant local cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch {
      // ignore
    }
    const palette = profile.colorPalette || 'gold';
    const allThemeClasses = [
      'theme-gold',
      'theme-indigo',
      'theme-emerald',
      'theme-crimson',
      'theme-sunset',
      'theme-cyan',
      'theme-purple',
      'theme-fuchsia',
      'theme-sapphire',
      'theme-lime',
      'theme-champagne',
      'theme-monochrome',
    ];
    document.body.classList.remove(...allThemeClasses);
    document.body.classList.add(`theme-${palette}`);
    if (profile.theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    } catch {
      // ignore
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
    } catch {
      // ignore
    }
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch {
      // ignore
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DIRECT_REVENUES, JSON.stringify(directRevenues));
    } catch {
      // ignore
    }
  }, [directRevenues]);

  // Document Handlers
  const handleSaveDocument = (doc: DocumentData) => {
    const updatedDocs = (() => {
      const idx = documents.findIndex((d) => d.id === doc.id);
      if (idx >= 0) {
        const copy = [...documents];
        copy[idx] = doc;
        return copy;
      }
      return [doc, ...documents];
    })();

    setDocuments(updatedDocs);
    try {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updatedDocs));
    } catch {
      // ignore
    }
    saveStudioToCloud({ documents: updatedDocs });
  };

  const handleDeleteDocument = (docId: string) => {
    if (confirm('Voulez-vous supprimer ce document ?')) {
      const updatedDocs = documents.filter((d) => d.id !== docId);
      setDocuments(updatedDocs);
      try {
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updatedDocs));
      } catch {
        // ignore
      }
      saveStudioToCloud({ documents: updatedDocs });
    }
  };

  // Direct Revenue Handlers (Pour les clients sans devis / sans papier / forfaits récurrents)
  const handleSaveDirectRevenue = (item: DirectRevenueItem) => {
    const updatedRevenues = (() => {
      const idx = directRevenues.findIndex((r) => r.id === item.id);
      if (idx >= 0) {
        const copy = [...directRevenues];
        copy[idx] = item;
        return copy;
      }
      return [item, ...directRevenues];
    })();

    setDirectRevenues(updatedRevenues);
    try {
      localStorage.setItem(STORAGE_KEYS.DIRECT_REVENUES, JSON.stringify(updatedRevenues));
    } catch {
      // ignore
    }
    saveStudioToCloud({ directRevenues: updatedRevenues });
  };

  const handleDeleteDirectRevenue = (itemId: string) => {
    if (confirm('Voulez-vous supprimer cette entrée de revenu direct / forfait ?')) {
      const updatedRevenues = directRevenues.filter((r) => r.id !== itemId);
      setDirectRevenues(updatedRevenues);
      try {
        localStorage.setItem(STORAGE_KEYS.DIRECT_REVENUES, JSON.stringify(updatedRevenues));
      } catch {
        // ignore
      }
      saveStudioToCloud({ directRevenues: updatedRevenues });
    }
  };

  // Client Handlers
  const handleSaveClient = (client: ClientData) => {
    const updatedClients = (() => {
      const idx = clients.findIndex((c) => c.id === client.id);
      if (idx >= 0) {
        const copy = [...clients];
        copy[idx] = client;
        return copy;
      }
      return [client, ...clients];
    })();

    setClients(updatedClients);
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(updatedClients));
    } catch {
      // ignore
    }
    saveStudioToCloud({ clients: updatedClients });
  };

  const handleDeleteClient = (clientId: string) => {
    if (confirm('Voulez-vous supprimer ce client ?')) {
      const updatedClients = clients.filter((c) => c.id !== clientId);
      setClients(updatedClients);
      try {
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(updatedClients));
      } catch {
        // ignore
      }
      saveStudioToCloud({ clients: updatedClients });
    }
  };

  // Expense Handlers
  const handleSaveExpense = (expense: ExpenseItem) => {
    const updatedExpenses = (() => {
      const idx = expenses.findIndex((e) => e.id === expense.id);
      if (idx >= 0) {
        const copy = [...expenses];
        copy[idx] = expense;
        return copy;
      }
      return [expense, ...expenses];
    })();

    setExpenses(updatedExpenses);
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExpenses));
    } catch {
      // ignore
    }
    saveStudioToCloud({ expenses: updatedExpenses });
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm('Voulez-vous supprimer cette dépense ?')) {
      const updatedExpenses = expenses.filter((e) => e.id !== expenseId);
      setExpenses(updatedExpenses);
      try {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExpenses));
      } catch {
        // ignore
      }
      saveStudioToCloud({ expenses: updatedExpenses });
    }
  };

  // Profile update handler
  const handleSaveProfile = (newProfile: ProfileInfo) => {
    setProfile(newProfile);
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
    } catch {
      // ignore
    }
    saveStudioToCloud({ profile: newProfile });
  };

  // Data Reset & Backup Handlers
  const handleResetData = () => {
    if (confirm('Voulez-vous réinitialiser toutes les données de l\'application ?')) {
      setClients(initialClients);
      setDocuments(initialDocuments);
      setExpenses(initialExpenses);
      setDirectRevenues(initialDirectRevenues);
      setProfile(initialProfile);
      localStorage.clear();
      saveStudioToCloud({
        clients: initialClients,
        documents: initialDocuments,
        expenses: initialExpenses,
        directRevenues: initialDirectRevenues,
        profile: initialProfile,
      });
    }
  };

  const handleExportData = () => {
    const data = {
      profile,
      clients,
      documents,
      expenses,
      directRevenues,
      exportDate: new Date().toISOString(),
      appVersion: '2.0.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinemanage-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target?.result as string);
        if (imported.profile) handleSaveProfile(imported.profile);
        if (imported.clients) {
          setClients(imported.clients);
          saveStudioToCloud({ clients: imported.clients });
        }
        if (imported.documents) {
          setDocuments(imported.documents);
          saveStudioToCloud({ documents: imported.documents });
        }
        if (imported.expenses) {
          setExpenses(imported.expenses);
          saveStudioToCloud({ expenses: imported.expenses });
        }
        if (imported.directRevenues) {
          setDirectRevenues(imported.directRevenues);
          saveStudioToCloud({ directRevenues: imported.directRevenues });
        }
        alert('Données importées et synchronisées avec succès !');
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON de sauvegarde.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navigation
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        profile={profile}
        onSaveProfile={handleSaveProfile}
        documents={documents}
        directRevenues={directRevenues}
        cloudSyncStatus={cloudSyncStatus}
        lastSyncTime={lastSyncTime}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGeminiChat={() => setIsGeminiChatOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Workspace Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Module 1: Générateur de Devis & Factures */}
        {activeModule === 'docs' && (
          <DocumentGeneratorModule
            profile={profile}
            clients={clients}
            documents={documents}
            onSaveDocument={handleSaveDocument}
            onDeleteDocument={handleDeleteDocument}
            onSaveClient={handleSaveClient}
          />
        )}

        {/* Module 2: CRM & Réseau Clients */}
        {activeModule === 'crm' && (
          <ClientNetworkModule
            clients={clients}
            documents={documents}
            directRevenues={directRevenues}
            onSaveClient={handleSaveClient}
            onDeleteClient={handleDeleteClient}
            onSaveDocument={handleSaveDocument}
            onSaveDirectRevenue={handleSaveDirectRevenue}
          />
        )}

        {/* Module 3: Pack Production & Matériel */}
        {activeModule === 'prod' && (
          <ProductionGearModule
            documents={documents}
            onSaveDocument={handleSaveDocument}
          />
        )}

        {/* Module 4: Tableau de Bord Financier & Chiffre d'Affaires */}
        {activeModule === 'stats' && (
          <FinancialDashboardModule
            documents={documents}
            expenses={expenses}
            directRevenues={directRevenues}
            clients={clients}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
            onSaveDirectRevenue={handleSaveDirectRevenue}
            onDeleteDirectRevenue={handleDeleteDirectRevenue}
            onSaveDocument={handleSaveDocument}
          />
        )}

        {/* Module 5: Expert Stratégique SARL AU */}
        {activeModule === 'expert' && (
          <SarlExpertModule
            documents={documents}
            directRevenues={directRevenues}
            clients={clients}
            expenses={expenses}
          />
        )}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <StudioSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          profile={profile}
          onSaveProfile={handleSaveProfile}
          onResetData={handleResetData}
          onExportData={handleExportData}
          onImportData={handleImportData}
        />
      )}

      {/* Gemini AI Assistant Modal */}
      {isGeminiChatOpen && (
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
          onAddExpense={handleSaveExpense}
        />
      )}
    </div>
  );
}

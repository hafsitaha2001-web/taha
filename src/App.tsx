import React, { useState, useEffect, useRef } from 'react';
import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { DocumentGeneratorModule } from './components/DocumentGeneratorModule';
import { ClientNetworkModule } from './components/ClientNetworkModule';
import { ProductionGearModule } from './components/ProductionGearModule';
import { FinancialDashboardModule } from './components/FinancialDashboardModule';
import { SarlExpertModule } from './components/SarlExpertModule';
import { StudioSettingsModal } from './components/StudioSettingsModal';
import { GeminiChatModal } from './components/GeminiChatModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import { Sparkles, Cloud, CloudCheck, RefreshCw, Smartphone, Laptop, HardDrive } from 'lucide-react';
import { ProfileInfo, ClientData, DocumentData, ExpenseItem, DirectRevenueItem } from './types';
import {
  initialProfile,
  initialClients,
  initialDocuments,
  initialExpenses,
  initialDirectRevenues,
} from './data/initialData';
import { subscribeToStudioCloud, saveStudioToCloud, mergeListsById } from './lib/studioSync';
import {
  initGoogleDriveAuth,
  getCachedDriveToken,
  getAutoSyncPreference,
  backupStateToGoogleDrive
} from './lib/googleDriveSync';
import { scanAndRecoverAllLocalStorage } from './lib/storageScanner';
import { User } from './lib/firebase';

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
  const [isFirebaseConfigOpen, setIsFirebaseConfigOpen] = useState<boolean>(false);
  const [isGeminiChatOpen, setIsGeminiChatOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isDriveSyncing, setIsDriveSyncing] = useState<boolean>(false);

  // Cloud Synchronization Status
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const isCloudUpdateRef = useRef<boolean>(false);
  const isInitialLoadRef = useRef<boolean>(true);

  // Init Google Drive Auth listener
  useEffect(() => {
    const unsubAuth = initGoogleDriveAuth((user, token) => {
      setGoogleUser(user);
    });
    return () => unsubAuth();
  }, []);

  // Debounced Auto-Sync to Google Drive
  useEffect(() => {
    if (isCloudUpdateRef.current || isInitialLoadRef.current) return;
    const token = getCachedDriveToken();
    const autoSync = getAutoSyncPreference();
    if (!token || !autoSync) return;

    setIsDriveSyncing(true);
    const driveTimer = setTimeout(async () => {
      try {
        await backupStateToGoogleDrive(
          {
            profile,
            clients,
            documents,
            expenses,
            directRevenues,
          },
          { isSnapshot: false }
        );
      } catch (err) {
        console.error('Auto Drive backup error:', err);
      } finally {
        setIsDriveSyncing(false);
      }
    }, 1500);

    return () => clearTimeout(driveTimer);
  }, [profile, clients, documents, expenses, directRevenues]);

  // Subscribe to Cloud Firestore (Real-Time across Mac, iPhone, etc.)
  useEffect(() => {
    const unsubscribe = subscribeToStudioCloud(
      (cloudData, rawSnapshotExists) => {
        if (rawSnapshotExists && cloudData) {
          isCloudUpdateRef.current = true;
          if (cloudData.profile) setProfile((prev) => ({ ...prev, ...cloudData.profile }));
          if (isInitialLoadRef.current) {
            if (cloudData.clients) setClients((prev) => mergeListsById(cloudData.clients, prev));
            if (cloudData.documents) setDocuments((prev) => mergeListsById(cloudData.documents, prev));
            if (cloudData.expenses) setExpenses((prev) => mergeListsById(cloudData.expenses, prev));
            if (cloudData.directRevenues) setDirectRevenues((prev) => mergeListsById(cloudData.directRevenues, prev));
          } else {
            if (cloudData.clients) setClients(cloudData.clients);
            if (cloudData.documents) setDocuments(cloudData.documents);
            if (cloudData.expenses) setExpenses(cloudData.expenses);
            if (cloudData.directRevenues) setDirectRevenues(cloudData.directRevenues);
          }
          setLastSyncTime(new Date());
          setCloudSyncStatus('synced');
          setTimeout(() => {
            isCloudUpdateRef.current = false;
          }, 300);
        } else if (!rawSnapshotExists && isInitialLoadRef.current) {
          // Cloud snapshot is empty, push existing local items to cloud
          saveStudioToCloud({
            profile,
            clients,
            documents,
            expenses,
            directRevenues,
          });
        }
        isInitialLoadRef.current = false;
      },
      () => {
        setCloudSyncStatus('offline');
      }
    );

    return () => unsubscribe();
  }, []);

  // Save changes to Cloud (debounced)
  useEffect(() => {
    // Avoid re-saving when incoming change is from Cloud Firestore
    if (isCloudUpdateRef.current || isInitialLoadRef.current) return;

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
    }, 600);

    return () => clearTimeout(timer);
  }, [profile, clients, documents, expenses, directRevenues]);

  // Sync state to LocalStorage as offline backup
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
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

  const paletteGlows: Record<string, { spot1: string; spot2: string; spot3: string }> = {
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
    cyan: {
      spot1: 'from-cyan-500/15 via-sky-600/8 to-transparent',
      spot2: 'from-teal-500/10 via-blue-600/5 to-transparent',
      spot3: 'from-indigo-500/8 via-transparent to-transparent',
    },
    purple: {
      spot1: 'from-purple-500/15 via-violet-600/8 to-transparent',
      spot2: 'from-fuchsia-500/10 via-pink-600/5 to-transparent',
      spot3: 'from-indigo-500/8 via-transparent to-transparent',
    },
    fuchsia: {
      spot1: 'from-pink-500/15 via-fuchsia-600/8 to-transparent',
      spot2: 'from-rose-500/10 via-purple-600/5 to-transparent',
      spot3: 'from-cyan-500/8 via-transparent to-transparent',
    },
    sapphire: {
      spot1: 'from-blue-500/15 via-indigo-600/8 to-transparent',
      spot2: 'from-sky-500/10 via-cyan-600/5 to-transparent',
      spot3: 'from-emerald-500/8 via-transparent to-transparent',
    },
    lime: {
      spot1: 'from-lime-500/15 via-emerald-600/8 to-transparent',
      spot2: 'from-yellow-500/10 via-teal-600/5 to-transparent',
      spot3: 'from-cyan-500/8 via-transparent to-transparent',
    },
    champagne: {
      spot1: 'from-rose-400/15 via-amber-300/8 to-transparent',
      spot2: 'from-pink-400/10 via-amber-500/5 to-transparent',
      spot3: 'from-amber-200/8 via-transparent to-transparent',
    },
    monochrome: {
      spot1: 'from-slate-400/12 via-zinc-500/6 to-transparent',
      spot2: 'from-gray-300/10 via-slate-600/5 to-transparent',
      spot3: 'from-white/6 via-transparent to-transparent',
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
        cloudSyncStatus={cloudSyncStatus}
        lastSyncTime={lastSyncTime}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFirebaseConfig={() => setIsFirebaseConfigOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
        isDriveConnected={Boolean(googleUser && getCachedDriveToken())}
        isDriveSyncing={isDriveSyncing}
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
        onOpenFirebaseConfig={() => setIsFirebaseConfigOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
      />

      {/* Google Drive Secure Cloud Backup Modal */}
      <GoogleDriveSyncModal
        isOpen={isGoogleDriveModalOpen}
        onClose={() => setIsGoogleDriveModalOpen(false)}
        currentUser={googleUser}
        currentStudioState={{
          profile,
          clients,
          documents,
          expenses,
          directRevenues,
        }}
        onRestoreState={(restored) => {
          if (restored.profile) setProfile(restored.profile);
          if (restored.clients) setClients(restored.clients);
          if (restored.documents) setDocuments(restored.documents);
          if (restored.expenses) setExpenses(restored.expenses);
          if (restored.directRevenues) setDirectRevenues(restored.directRevenues);
        }}
      />

      {/* Firebase Custom Configuration Modal */}
      <FirebaseConfigModal
        isOpen={isFirebaseConfigOpen}
        onClose={() => setIsFirebaseConfigOpen(false)}
        onConfigUpdated={() => {
          setCloudSyncStatus('saving');
        }}
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

import React, { useState } from 'react';
import {
  Cloud,
  Database,
  Key,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Laptop
} from 'lucide-react';
import {
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  isUsingCustomFirebaseConfig,
  FirebaseCustomConfig
} from '../lib/firebase';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const currentConfig = getActiveFirebaseConfig();
  const isCustom = isUsingCustomFirebaseConfig();

  const [rawJsonInput, setRawJsonInput] = useState('');
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig.appId || '');
  const [databaseId, setDatabaseId] = useState(currentConfig.firestoreDatabaseId || '');

  const [pasteMode, setPasteMode] = useState<'json' | 'form'>('json');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleParseAndApplyJson = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      let cleaned = rawJsonInput.trim();
      // If user pasted JavaScript object snippet (e.g. const firebaseConfig = { ... };)
      if (cleaned.includes('{') && cleaned.includes('}')) {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        cleaned = cleaned.substring(start, end + 1);
      }

      // Convert JS object keys without quotes if needed to standard JSON
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Evaluate key: "val" format safely
        const formatted = cleaned
          .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":')
          .replace(/'/g, '"')
          .replace(/,\s*}/g, '}');
        parsed = JSON.parse(formatted);
      }

      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error("L'objet firebaseConfig doit au minimum contenir 'apiKey' et 'projectId'.");
      }

      const newConfig: FirebaseCustomConfig = {
        apiKey: parsed.apiKey || '',
        authDomain: parsed.authDomain || '',
        projectId: parsed.projectId || '',
        storageBucket: parsed.storageBucket || '',
        messagingSenderId: parsed.messagingSenderId || '',
        appId: parsed.appId || '',
        firestoreDatabaseId: parsed.firestoreDatabaseId || parsed.databaseId || '',
      };

      saveCustomFirebaseConfig(newConfig);
      setSuccessMessage('Configuration Firebase enregistrée avec succès ! Rechargement en cours...');
      setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Format JSON ou objet JavaScript invalide.');
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!apiKey.trim() || !projectId.trim()) {
      setErrorMessage("Veuillez renseigner au moins la Clé d'API (apiKey) et le Project ID.");
      return;
    }

    const newConfig: FirebaseCustomConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
      firestoreDatabaseId: databaseId.trim() || undefined,
    };

    saveCustomFirebaseConfig(newConfig);
    setSuccessMessage('Configuration Firebase enregistrée avec succès ! Rechargement en cours...');
    setTimeout(() => {
      window.location.reload();
    }, 900);
  };

  const handleResetToDefault = () => {
    if (confirm('Voulez-vous réinitialiser vers la base Cloud Firebase par défaut du projet ?')) {
      saveCustomFirebaseConfig(null);
      setSuccessMessage('Rétabli sur la configuration par défaut. Rechargement...');
      setTimeout(() => {
        window.location.reload();
      }, 700);
    }
  };

  const handleCopyCurrentConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(currentConfig, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full p-6 rounded-2xl shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Configuration Firebase Firestore
              </h3>
              <p className="text-xs text-slate-400">
                Synchronisation temps réel et persistance hors-ligne (Mac ⇋ Téléphone)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-all text-xs font-bold"
          >
            Fermer
          </button>
        </div>

        {/* Sync status overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-amber-400" /> État Actuel du Cloud
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white">
                {isCustom ? 'Projet Firebase Personnel' : 'Projet Cloud Pré-configuré'}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 truncate">
              ID: {currentConfig.projectId || 'N/A'}
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-emerald-500/30 rounded-xl space-y-1.5">
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" /> Persistance Hors-Ligne
            </div>
            <div className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              IndexedDB Local Cache Activé
            </div>
            <p className="text-[10px] text-slate-400">
              Vos devis et forfaits sont enregistrés localement même sans réseau.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPasteMode('json')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pasteMode === 'json'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Coller le Bloc firebaseConfig (Recommandé)
            </button>
            <button
              type="button"
              onClick={() => setPasteMode('form')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pasteMode === 'form'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Champs Détaillés (Formulaire)
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyCurrentConfig}
            className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 bg-slate-800 rounded-lg"
            title="Copier la configuration active"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copié !' : 'Copier Actuelle'}</span>
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* JSON Paste Mode */}
        {pasteMode === 'json' ? (
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="block text-slate-300 font-bold">
                Collez votre extrait <code className="text-amber-400 font-mono">firebaseConfig</code> de la console Firebase :
              </label>
              <p className="text-[11px] text-slate-500">
                Vous pouvez coller directement l'objet copié depuis <em>Paramètres du projet &gt; Vos applications &gt; Web</em>.
              </p>
            </div>

            <textarea
              rows={8}
              value={rawJsonInput}
              onChange={(e) => setRawJsonInput(e.target.value)}
              placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "mon-studio.firebaseapp.com",\n  projectId: "mon-studio-1234",\n  storageBucket: "mon-studio.appspot.com",\n  messagingSenderId: "123456789",\n  appId: "1:123456789:web:abcdef"\n};`}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-amber-200 font-mono p-3 rounded-xl focus:outline-none text-xs leading-relaxed"
            />

            <div className="flex items-center justify-between gap-3 pt-2">
              {isCustom ? (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/20 text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Rétablir configuration par défaut
                </button>
              ) : (
                <div className="text-[11px] text-slate-500">
                  Actuellement connecté à la base Cloud par défaut.
                </div>
              )}

              <button
                type="button"
                onClick={handleParseAndApplyJson}
                disabled={!rawJsonInput.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                <Cloud className="w-4 h-4" /> Enregistrer & Activer la Synchronisation
              </button>
            </div>
          </div>
        ) : (
          /* Form Detailed Mode */
          <form onSubmit={handleSaveForm} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-amber-400 font-bold mb-1">API Key (apiKey) *</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-mono"
                  placeholder="AIzaSy..."
                  required
                />
              </div>

              <div>
                <label className="block text-amber-400 font-bold mb-1">Project ID (projectId) *</label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-mono"
                  placeholder="studio-12345"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Auth Domain</label>
                <input
                  type="text"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-mono"
                  placeholder="studio-12345.firebaseapp.com"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Storage Bucket</label>
                <input
                  type="text"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-mono"
                  placeholder="studio-12345.appspot.com"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Messaging Sender ID</label>
                <input
                  type="text"
                  value={messagingSenderId}
                  onChange={(e) => setMessagingSenderId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-mono"
                  placeholder="123456789012"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">App ID</label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-mono"
                  placeholder="1:123456789012:web:abcdef..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-bold mb-1">
                  Firestore Database ID <span className="text-slate-600 font-normal">(Optionnel si différent de '(default)')</span>
                </label>
                <input
                  type="text"
                  value={databaseId}
                  onChange={(e) => setDatabaseId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-mono"
                  placeholder="(default) ou nom personnalisé de base"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
              {isCustom ? (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/20 text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Rétablir par défaut
                </button>
              ) : (
                <div className="text-[11px] text-slate-500">
                  Actuellement connecté à la base Cloud par défaut.
                </div>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                <Cloud className="w-4 h-4" /> Enregistrer & Activer
              </button>
            </div>
          </form>
        )}

        {/* Helper instructions footer */}
        <div className="p-3 bg-slate-950/90 border border-slate-800/80 rounded-xl space-y-2 text-[11px] text-slate-400">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" /> Où trouver vos identifiants Firebase ?
          </div>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Ouvrez <strong className="text-white">console.firebase.google.com</strong> et sélectionnez votre projet.</li>
            <li>Allez dans <strong className="text-white">Paramètres du Projet (Icône Écrou) &gt; Général</strong>.</li>
            <li>Descendez jusqu'à la section <strong className="text-white">Vos applications (SDK setup and configuration)</strong> et copiez le bloc <code className="text-amber-300">firebaseConfig</code>.</li>
            <li>Collez-le ici et vos devis, factures et clients seront directement connectés à votre base de données.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

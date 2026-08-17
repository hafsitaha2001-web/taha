import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ExternalLink,
  ShieldCheck,
  Download,
  Upload,
  Trash2,
  LogOut,
  FolderArchive,
  Layers,
  FileJson,
  FileCheck,
  Smartphone,
  Laptop
} from 'lucide-react';
import {
  signInGoogleDrive,
  signOutGoogleDrive,
  backupStateToGoogleDrive,
  listDriveBackups,
  downloadBackupFromDrive,
  deleteDriveFile,
  getCachedDriveToken,
  DriveFileInfo,
  getAutoSyncPreference,
  setAutoSyncPreference,
  getLastDriveSyncTime
} from '../lib/googleDriveSync';
import { StudioCloudState } from '../lib/studioSync';
import { User } from '../lib/firebase';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  currentStudioState: StudioCloudState;
  onRestoreState: (restored: StudioCloudState) => void;
  onDriveSyncSuccess?: () => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentStudioState,
  onRestoreState,
  onDriveSyncSuccess,
}) => {
  const [user, setUser] = useState<User | null>(currentUser);
  const [token, setToken] = useState<string | null>(getCachedDriveToken());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [backups, setBackups] = useState<DriveFileInfo[]>([]);
  const [autoSync, setAutoSync] = useState<boolean>(getAutoSyncPreference());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(getLastDriveSyncTime());

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setUser(currentUser);
    setToken(getCachedDriveToken());
  }, [currentUser, isOpen]);

  useEffect(() => {
    if (isOpen && (currentUser || token)) {
      loadBackupsList();
    }
  }, [isOpen, currentUser, token]);

  const loadBackupsList = async () => {
    if (!getCachedDriveToken()) return;
    setIsLoadingBackups(true);
    try {
      const files = await listDriveBackups();
      setBackups(files);
    } catch (err: any) {
      console.error('Failed to list drive files', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const showNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setNotification(null);
    try {
      const res = await signInGoogleDrive();
      setUser(res.user);
      setToken(res.accessToken);
      showNotify('success', `Connecté avec succès : ${res.user.email || res.user.displayName}`);
      // Immediately perform initial backup to establish the folder
      setTimeout(() => {
        handleManualBackup(res.accessToken);
      }, 500);
    } catch (err: any) {
      console.error('Login error:', err);
      showNotify('error', err.message || 'Échec de la connexion à Google Drive.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Voulez-vous vous déconnecter de Google Drive sur cet appareil ?')) {
      await signOutGoogleDrive();
      setUser(null);
      setToken(null);
      setBackups([]);
      showNotify('success', 'Déconnecté de Google Drive.');
    }
  };

  const handleManualBackup = async (overrideToken?: string) => {
    const activeToken = overrideToken || token || getCachedDriveToken();
    if (!activeToken) {
      showNotify('error', 'Veuillez vous connecter à votre compte Google d’abord.');
      return;
    }

    setIsSyncingNow(true);
    setNotification(null);

    const res = await backupStateToGoogleDrive(currentStudioState, { isSnapshot: false });
    setIsSyncingNow(false);

    if (res.success) {
      const now = new Date().toISOString();
      setLastSyncTime(now);
      showNotify('success', 'Studio et données sauvegardés avec succès sur votre Google Drive !');
      loadBackupsList();
      if (onDriveSyncSuccess) onDriveSyncSuccess();
    } else {
      showNotify('error', res.error || 'Erreur lors de la sauvegarde sur Google Drive.');
    }
  };

  const handleCreateSnapshot = async () => {
    const activeToken = token || getCachedDriveToken();
    if (!activeToken) {
      showNotify('error', 'Veuillez vous connecter à votre compte Google.');
      return;
    }

    setIsCreatingSnapshot(true);
    const res = await backupStateToGoogleDrive(currentStudioState, { isSnapshot: true });
    setIsCreatingSnapshot(false);

    if (res.success) {
      showNotify('success', `Instantané daté créé : ${res.fileName}`);
      loadBackupsList();
    } else {
      showNotify('error', res.error || "Erreur lors de la création de l'instantané.");
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    setAutoSyncPreference(enabled);
    showNotify(
      'success',
      enabled
        ? 'Synchronisation automatique Google Drive activée !'
        : 'Synchronisation automatique mise en pause.'
    );
  };

  const handleRestoreBackup = async (file: DriveFileInfo) => {
    const confirmed = window.confirm(
      `Confirmez-vous la restauration de la sauvegarde "${file.name}" datant du ${new Date(
        file.modifiedTime
      ).toLocaleString('fr-FR')} ?\n\nVos devis, factures, clients et données seront mis à jour avec cette version.`
    );
    if (!confirmed) return;

    try {
      const restored = await downloadBackupFromDrive(file.id);
      if (restored) {
        onRestoreState(restored);
        showNotify('success', `Sauvegarde "${file.name}" restaurée avec succès !`);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      showNotify('error', err.message || 'Impossible de charger la sauvegarde.');
    }
  };

  const handleDeleteFile = async (file: DriveFileInfo) => {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer définitivement le fichier "${file.name}" de votre Google Drive ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    const ok = await deleteDriveFile(file.id);
    if (ok) {
      showNotify('success', 'Fichier supprimé de Google Drive.');
      setBackups((prev) => prev.filter((b) => b.id !== file.id));
    } else {
      showNotify('error', 'Impossible de supprimer le fichier.');
    }
  };

  if (!isOpen) return null;

  const isConnected = Boolean(user && token);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full p-6 rounded-2xl shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Sauvegarde & Synchronisation Google Drive
              </h3>
              <p className="text-xs text-slate-400">
                Vos devis, factures, clients et bilans synchronisés sur votre espace personnel
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

        {/* Notifications */}
        {notification && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span className="leading-snug">{notification.message}</span>
          </div>
        )}

        {/* Auth Section */}
        {!isConnected ? (
          <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
              <Cloud className="w-6 h-6" />
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-sm font-bold text-white">Connectez votre compte Google</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connectez-vous avec votre compte Google pour activer la sauvegarde automatique de vos données
                dans un dossier dédié <strong className="text-slate-200">"CineManage Pro Backups"</strong> sur votre Drive.
              </p>
            </div>

            {/* Official Material "Sign in with Google" Button */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="group relative flex items-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-white/10 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>
                  {isLoggingIn ? 'Connexion en cours...' : 'Se connecter avec Google'}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Vos fichiers restent 100% privés
              </span>
              <span className="flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-blue-400" /> Dossier Drive dédié
              </span>
            </div>
          </div>
        ) : (
          /* Connected State & Controls */
          <div className="space-y-5">
            {/* Account bar */}
            <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-sm border border-blue-500/30">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {user?.displayName || 'Compte Google'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                      Connecté
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-[220px] sm:max-w-none">
                    {user?.email || 'drive.file scope activé'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5" /> Déconnexion
              </button>
            </div>

            {/* Quick Actions & Auto-sync */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Auto Sync Toggle Card */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${autoSync ? 'animate-spin-slow' : ''}`} />
                    Sauvegarde Automatique
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => handleToggleAutoSync(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Chaque ajout de devis, facture ou client met à jour automatiquement la sauvegarde principale sur Google Drive.
                </p>
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Dernière synchro :{' '}
                  <span className="text-slate-300 font-semibold">
                    {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Pas encore effectuée'}
                  </span>
                </div>
              </div>

              {/* Manual Backup Trigger Card */}
              <div className="p-3.5 bg-slate-950/80 border border-blue-500/30 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5" /> Sauvegarde Immédiate
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Forcez l'enregistrement de l'état complet du studio sur votre Drive sans attendre.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleManualBackup()}
                    disabled={isSyncingNow}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer transition-all active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isSyncingNow ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateSnapshot}
                    disabled={isCreatingSnapshot}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-all active:scale-95"
                    title="Créer un instantané daté archivé"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    {isCreatingSnapshot ? 'Snapshot...' : '+ Instantané'}
                  </button>
                </div>
              </div>
            </div>

            {/* Backups List on Google Drive */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                  Sauvegardes trouvées sur votre Google Drive ({backups.length})
                </h4>

                <button
                  type="button"
                  onClick={loadBackupsList}
                  disabled={isLoadingBackups}
                  className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 p-1 rounded-lg hover:bg-slate-800 transition-all"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
              </div>

              {isLoadingBackups ? (
                <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" /> Recherche des fichiers sur Drive...
                </div>
              ) : backups.length === 0 ? (
                <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-center text-xs text-slate-400 space-y-1">
                  <FileJson className="w-6 h-6 text-slate-600 mx-auto" />
                  <p>Aucune sauvegarde trouvée dans le dossier "CineManage Pro Backups".</p>
                  <p className="text-[11px] text-slate-500">
                    Cliquez sur "Sauvegarder" ci-dessus pour initialiser la première copie.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {backups.map((file) => {
                    const isMaster = file.name.includes('master');
                    return (
                      <div
                        key={file.id}
                        className="p-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isMaster
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {isMaster ? <HardDrive className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-200 truncate flex items-center gap-1.5">
                              <span>{file.name}</span>
                              {isMaster && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded font-semibold border border-blue-500/40">
                                  Principale
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2">
                              <span>{new Date(file.modifiedTime).toLocaleString('fr-FR')}</span>
                              <span>•</span>
                              <span>{file.size}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
                              title="Ouvrir dans Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRestoreBackup(file)}
                            className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Restaurer cette version"
                          >
                            <Download className="w-3 h-3" /> Restaurer
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs transition-all cursor-pointer"
                            title="Supprimer cette sauvegarde de Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Chiffrement et sécurité assurés par Google Cloud</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

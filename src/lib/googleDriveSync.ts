import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { DocumentData, DocumentType, ClientData, ExpenseItem } from '../types';

// Reuse Firebase initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// In-memory & session token cache
const DRIVE_TOKEN_KEY = 'cinemanage_drive_access_token';
let cachedAccessToken: string | null = typeof window !== 'undefined' ? sessionStorage.getItem(DRIVE_TOKEN_KEY) : null;
let cachedUser: User | null = null;

export interface DriveSyncStatus {
  connected: boolean;
  userEmail?: string;
  rootFolderId?: string;
  subfolders?: { [key: string]: string };
  lastSyncTime?: string;
}

/**
 * Listen to Firebase Auth state
 */
export function initDriveAuth(
  onSuccess?: (user: User, token: string) => void,
  onFail?: () => void
) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      cachedUser = user;
      const storedToken = sessionStorage.getItem(DRIVE_TOKEN_KEY);
      if (storedToken) {
        cachedAccessToken = storedToken;
        if (onSuccess) onSuccess(user, storedToken);
        return;
      }
    } else {
      cachedUser = null;
      if (onFail) onFail();
    }
  });
}

/**
 * Request Google Drive OAuth token and return access token
 */
export async function getGoogleDriveAccessToken(): Promise<string> {
  if (cachedAccessToken) return cachedAccessToken;
  const stored = sessionStorage.getItem(DRIVE_TOKEN_KEY);
  if (stored) {
    cachedAccessToken = stored;
    return stored;
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Jeton d'accès Google Drive introuvable.");
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    sessionStorage.setItem(DRIVE_TOKEN_KEY, credential.accessToken);
    return cachedAccessToken;
  } catch (err: any) {
    console.error('Google Auth Error:', err);
    if (err.code === 'auth/popup-blocked') {
      throw new Error("La fenêtre de connexion Google a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-up.");
    }
    if (err.code === 'auth/popup-closed-by-user') {
      throw new Error("Connexion annulée par l'utilisateur.");
    }
    throw new Error(err.message || "Impossible de se connecter à Google Drive.");
  }
}

export function isDriveConnected(): boolean {
  return !!cachedAccessToken;
}

export function getCachedDriveUser(): User | null {
  return cachedUser;
}

export function disconnectDrive() {
  cachedAccessToken = null;
  cachedUser = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(DRIVE_TOKEN_KEY);
  }
}

/**
 * Find or create a folder in Google Drive
 */
async function findOrCreateFolder(
  folderName: string,
  parentFolderId?: string,
  accessToken?: string
): Promise<string> {
  const token = accessToken || (await getGoogleDriveAccessToken());

  let query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  // Check if folder exists
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create folder if not found
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error('Folder creation error:', errText);
    throw new Error(`Erreur lors de la création du dossier Google Drive: "${folderName}"`);
  }

  const createData = await createRes.json();
  return createData.id;
}

/**
 * Get Subfolder name for a specific DocumentType
 */
export function getSubfolderNameForDocType(type: DocumentType): string {
  switch (type) {
    case 'DEVIS':
      return 'Devis';
    case 'FACTURE':
      return 'Factures';
    case 'FACTURE_ACOMPTE':
      return "Factures d'acompte";
    case 'BON_LIVRAISON':
      return 'Bons de livraison';
    default:
      return 'Autres documents';
  }
}

/**
 * Setup or get the 'hafsi prod' folder architecture in Google Drive:
 * - hafsi prod/
 *   ├── Devis/
 *   ├── Factures/
 *   ├── Factures d'acompte/
 *   ├── Bons de livraison/
 *   └── Sauvegardes & Données/
 */
export async function setupHafsiProdFolders(): Promise<{
  rootId: string;
  subfolders: { [key: string]: string };
}> {
  const token = await getGoogleDriveAccessToken();
  // User explicitly requested root folder name: "hafsi prod"
  const rootId = await findOrCreateFolder('hafsi prod', undefined, token);

  const subfolders = {
    DEVIS: await findOrCreateFolder('Devis', rootId, token),
    FACTURE: await findOrCreateFolder('Factures', rootId, token),
    FACTURE_ACOMPTE: await findOrCreateFolder("Factures d'acompte", rootId, token),
    BON_LIVRAISON: await findOrCreateFolder('Bons de livraison', rootId, token),
    BACKUPS: await findOrCreateFolder('Sauvegardes & Données', rootId, token),
  };

  return { rootId, subfolders };
}

/**
 * Upload or Update a file on Google Drive
 */
export async function uploadFileToDrive(
  fileName: string,
  content: string,
  mimeType: string = 'text/html',
  folderId: string
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const token = await getGoogleDriveAccessToken();

  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', new Blob([content], { type: mimeType }));

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Échec de l'envoi du fichier sur Google Drive.");
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
  };
}

/**
 * Automatically upload a generated document to its dedicated subfolder in 'hafsi prod'
 * when user downloads or saves the document.
 */
export async function autoUploadDocumentToDrive(
  document: DocumentData,
  htmlContent: string
): Promise<{
  success: boolean;
  folderName: string;
  fileName: string;
  fileId?: string;
  driveLink?: string;
  message: string;
}> {
  try {
    const { subfolders } = await setupHafsiProdFolders();
    const folderKey = document.type as keyof typeof subfolders;
    const targetFolderId = subfolders[folderKey] || subfolders.DEVIS;
    const subfolderName = getSubfolderNameForDocType(document.type);

    const safeClient = (document.clientCompany || document.clientName || 'Client')
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .slice(0, 30);
    const fileName = `${document.number}_${safeClient}.html`;

    const uploaded = await uploadFileToDrive(fileName, htmlContent, 'text/html', targetFolderId);

    return {
      success: true,
      folderName: `hafsi prod / ${subfolderName}`,
      fileName,
      fileId: uploaded.id,
      driveLink: uploaded.webViewLink,
      message: `Document synchronisé sur Google Drive dans "hafsi prod/${subfolderName}"`,
    };
  } catch (error: any) {
    console.error('Auto upload error:', error);
    return {
      success: false,
      folderName: `hafsi prod / ${getSubfolderNameForDocType(document.type)}`,
      fileName: `${document.number}.html`,
      message: error.message || 'Erreur lors du transfert vers Google Drive.',
    };
  }
}

/**
 * Sync entire CineManage state to Google Drive backup folder
 */
export async function syncAllStateToDrive(
  documents: DocumentData[],
  clients: ClientData[],
  expenses: ExpenseItem[]
): Promise<{ success: boolean; message: string; rootId?: string }> {
  try {
    const { rootId, subfolders } = await setupHafsiProdFolders();
    const today = new Date().toISOString().split('T')[0];

    // 1. Sync Documents
    const docsJson = JSON.stringify(documents, null, 2);
    await uploadFileToDrive(
      `documents_backup_${today}.json`,
      docsJson,
      'application/json',
      subfolders.BACKUPS
    );

    // 2. Sync CRM
    const crmJson = JSON.stringify(clients, null, 2);
    await uploadFileToDrive(
      `crm_clients_${today}.json`,
      crmJson,
      'application/json',
      subfolders.BACKUPS
    );

    // 3. Sync Finances
    const finJson = JSON.stringify(expenses, null, 2);
    await uploadFileToDrive(
      `finances_depenses_${today}.json`,
      finJson,
      'application/json',
      subfolders.BACKUPS
    );

    return {
      success: true,
      rootId,
      message: '✅ Synchronisation complète réussie ! Dossier Google Drive "hafsi prod" mis à jour avec succès.',
    };
  } catch (err: any) {
    console.error('Drive Sync error:', err);
    return {
      success: false,
      message: err.message || 'Erreur lors de la synchronisation avec Google Drive.',
    };
  }
}

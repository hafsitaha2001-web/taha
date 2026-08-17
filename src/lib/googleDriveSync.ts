import {
  auth,
  googleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User
} from './firebase';
import { GoogleAuthProvider } from 'firebase/auth';
import { StudioCloudState } from './studioSync';

// In-memory token cache (strictly in memory as per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

export interface DriveSyncStatus {
  isConnected: boolean;
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  isSyncing: boolean;
  lastDriveSyncTime: string | null;
  autoSyncEnabled: boolean;
  lastError: string | null;
}

const STORAGE_AUTOSYNC_KEY = 'cinemanage_gdrive_autosync_enabled';
const STORAGE_LAST_DRIVE_SYNC = 'cinemanage_last_gdrive_sync_time';

export function getAutoSyncPreference(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem(STORAGE_AUTOSYNC_KEY);
  return saved !== null ? saved === 'true' : true; // default true
}

export function setAutoSyncPreference(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_AUTOSYNC_KEY, enabled ? 'true' : 'false');
}

export function getLastDriveSyncTime(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_LAST_DRIVE_SYNC);
}

export function setLastDriveSyncTime(timeIso: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_LAST_DRIVE_SYNC, timeIso);
}

/**
 * Initialize Google Auth State
 */
export function initGoogleDriveAuth(
  onStateChange: (user: User | null, token: string | null) => void
) {
  return onAuthStateChanged(auth, async (user) => {
    if (user && cachedAccessToken) {
      onStateChange(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        onStateChange(user, null);
      }
    }
  });
}

/**
 * Sign in with Google Popup and obtain access token
 */
export async function signInGoogleDrive(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Impossible d'obtenir le jeton d'accès Google Drive.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Disconnect Google Drive
 */
export async function signOutGoogleDrive(): Promise<void> {
  try {
    await signOut(auth);
    cachedAccessToken = null;
  } catch (error) {
    console.error('Sign Out Error:', error);
  }
}

export function getCachedDriveToken(): string | null {
  return cachedAccessToken;
}

export function setCachedDriveToken(token: string | null) {
  cachedAccessToken = token;
}

/**
 * Helper to execute authorized Google Drive REST API calls
 */
async function driveFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  if (!cachedAccessToken) {
    throw new Error('Non connecté à Google Drive. Veuillez vous reconnecter.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${cachedAccessToken}`);

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    cachedAccessToken = null;
    throw new Error('Jeton Google Drive expiré. Veuillez cliquer sur Reconnecter.');
  }

  return response;
}

/**
 * Find or create dedicated CineManage Pro backup folder on Google Drive
 */
export async function getOrCreateCineManageFolder(): Promise<string> {
  const folderName = 'CineManage Pro Backups';
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  // Search existing
  const searchRes = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`
  );
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await driveFetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Sauvegardes automatiques et sécurisées de votre studio CineManage Pro',
    }),
  });

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Save / Backup state directly to Google Drive
 */
export async function backupStateToGoogleDrive(
  state: StudioCloudState,
  options?: { isSnapshot?: boolean; customFileName?: string }
): Promise<{ success: boolean; fileId?: string; fileName?: string; error?: string }> {
  try {
    if (!cachedAccessToken) {
      return { success: false, error: 'Non connecté à Google Drive' };
    }

    const folderId = await getOrCreateCineManageFolder();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const fileName =
      options?.customFileName ||
      (options?.isSnapshot
        ? `cinemanage_snapshot_${timestamp}.json`
        : `cinemanage_master_studio_backup.json`);

    const backupPayload = {
      app: 'CineManage Pro',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      studioId: 'main_studio',
      data: state,
    };

    const fileContent = JSON.stringify(backupPayload, null, 2);

    // If master backup and not snapshot, check if already exists to update it in place
    let existingFileId: string | null = null;
    if (!options?.isSnapshot) {
      const q = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;
      const res = await driveFetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`
      );
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        existingFileId = data.files[0].id;
      }
    }

    if (existingFileId) {
      // Update existing file content
      const updateRes = await driveFetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: fileContent,
        }
      );

      if (!updateRes.ok) {
        throw new Error(`Échec de mise à jour du fichier Drive (${updateRes.status})`);
      }

      setLastDriveSyncTime(new Date().toISOString());
      return { success: true, fileId: existingFileId, fileName };
    } else {
      // Create new multipart file
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const metadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: [folderId],
        description: `Sauvegarde synchronisée le ${new Date().toLocaleString('fr-FR')}`,
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        closeDelim;

      const uploadRes = await driveFetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
        {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Échec d'envoi vers Google Drive (${uploadRes.status})`);
      }

      const fileData = await uploadRes.json();
      setLastDriveSyncTime(new Date().toISOString());
      return { success: true, fileId: fileData.id, fileName };
    }
  } catch (error: any) {
    console.error('Google Drive Backup Error:', error);
    return { success: false, error: error.message || 'Erreur inconnue Google Drive' };
  }
}

/**
 * List backups from CineManage Pro folder on Google Drive
 */
export async function listDriveBackups(): Promise<DriveFileInfo[]> {
  try {
    if (!cachedAccessToken) return [];

    const folderId = await getOrCreateCineManageFolder();
    const query = `'${folderId}' in parents and trashed = false`;

    const res = await driveFetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query
      )}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime,size,webViewLink)`
    );

    if (!res.ok) {
      throw new Error(`Erreur récupération sauvegardes (${res.status})`);
    }

    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      modifiedTime: f.modifiedTime,
      size: f.size ? `${(parseInt(f.size, 10) / 1024).toFixed(1)} KB` : 'N/A',
      webViewLink: f.webViewLink,
    }));
  } catch (error) {
    console.error('List Backups Error:', error);
    return [];
  }
}

/**
 * Download and parse backup from Google Drive
 */
export async function downloadBackupFromDrive(fileId: string): Promise<StudioCloudState | null> {
  try {
    if (!cachedAccessToken) throw new Error('Non connecté à Google Drive');

    const res = await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
    if (!res.ok) throw new Error(`Échec de téléchargement du fichier (${res.status})`);

    const json = await res.json();
    if (json.data && json.app === 'CineManage Pro') {
      return json.data as StudioCloudState;
    } else if (json.documents || json.clients || json.profile) {
      return json as StudioCloudState;
    }
    throw new Error('Structure de fichier de sauvegarde non reconnue.');
  } catch (error) {
    console.error('Download Backup Error:', error);
    throw error;
  }
}

export function isDriveConnected(): boolean {
  return Boolean(cachedAccessToken);
}

export function getSubfolderNameForDocType(type: string): string {
  switch (type) {
    case 'DEVIS':
      return '01 - Devis';
    case 'FACTURE':
      return '02 - Factures';
    case 'FACTURE_ACOMPTE':
      return '03 - Factures Acompte';
    case 'BON_LIVRAISON':
      return '04 - Bons de Livraison';
    default:
      return '05 - Documents';
  }
}

/**
 * Setup or find the "hafsi prod" folder structure on Google Drive
 */
export async function setupHafsiProdFolders(): Promise<{ rootId: string; subfolders: Record<string, string> }> {
  if (!cachedAccessToken) {
    throw new Error('Non connecté à Google Drive');
  }

  const rootName = 'hafsi prod';
  const rootQuery = `name = '${rootName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  let rootId: string;
  const searchRoot = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(rootQuery)}&fields=files(id,name)`
  );
  const rootData = await searchRoot.json();

  if (rootData.files && rootData.files.length > 0) {
    rootId = rootData.files[0].id;
  } else {
    const createRoot = await driveFetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: rootName,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Dossier de production et facturation cinématographique Hafsi Prod',
      }),
    });
    const created = await createRoot.json();
    rootId = created.id;
  }

  // Create or find subfolders
  const folderNames = [
    '01 - Devis',
    '02 - Factures',
    '03 - Factures Acompte',
    '04 - Bons de Livraison',
    '00 - Sauvegardes Studio',
  ];

  const subfolders: Record<string, string> = {};

  for (const name of folderNames) {
    const q = `name = '${name}' and '${rootId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const res = await driveFetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`
    );
    const data = await res.json();

    if (data.files && data.files.length > 0) {
      subfolders[name] = data.files[0].id;
    } else {
      const createSub = await driveFetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [rootId],
        }),
      });
      const subCreated = await createSub.json();
      subfolders[name] = subCreated.id;
    }
  }

  return { rootId, subfolders };
}

/**
 * Upload single generated document to the appropriate "hafsi prod" subfolder
 */
export async function autoUploadDocumentToDrive(
  doc: any,
  htmlContent: string
): Promise<{ success: boolean; folderName?: string; driveLink?: string; fileId?: string; message?: string }> {
  try {
    if (!cachedAccessToken) {
      return {
        success: false,
        message: 'Google Drive non connecté. Cliquez sur Google Drive dans la barre du haut pour vous connecter.',
      };
    }

    const { subfolders } = await setupHafsiProdFolders();
    const targetSubfolderName = getSubfolderNameForDocType(doc.type);
    const targetFolderId = subfolders[targetSubfolderName] || subfolders['01 - Devis'];

    const cleanClientName = (doc.clientCompany || doc.clientName || 'Client').replace(
      /[^a-zA-Z0-9_\u0600-\u06FF-]/g,
      '_'
    );
    const fileName = `${doc.number}_${cleanClientName}.html`;

    // Check if file already exists in target folder
    const checkQuery = `name = '${fileName}' and '${targetFolderId}' in parents and trashed = false`;
    const checkRes = await driveFetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(checkQuery)}&fields=files(id,name,webViewLink)`
    );
    const checkData = await checkRes.json();

    let existingFileId: string | null = null;
    let driveLink: string | undefined = undefined;

    if (checkData.files && checkData.files.length > 0) {
      existingFileId = checkData.files[0].id;
      driveLink = checkData.files[0].webViewLink;
    }

    if (existingFileId) {
      const updateRes = await driveFetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'text/html; charset=UTF-8' },
          body: htmlContent,
        }
      );

      if (!updateRes.ok) {
        throw new Error(`Erreur mise à jour (${updateRes.status})`);
      }

      return {
        success: true,
        folderName: `hafsi prod / ${targetSubfolderName}`,
        driveLink,
        fileId: existingFileId,
      };
    } else {
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const metadata = {
        name: fileName,
        mimeType: 'text/html',
        parents: [targetFolderId],
        description: `Document ${doc.type} n° ${doc.number} pour ${doc.clientCompany || doc.clientName}`,
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
        htmlContent +
        closeDelim;

      const uploadRes = await driveFetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
        {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Erreur d'envoi (${uploadRes.status})`);
      }

      const fileData = await uploadRes.json();
      return {
        success: true,
        folderName: `hafsi prod / ${targetSubfolderName}`,
        driveLink: fileData.webViewLink,
        fileId: fileData.id,
      };
    }
  } catch (error: any) {
    console.error('autoUploadDocumentToDrive error:', error);
    return {
      success: false,
      message: error.message || 'Erreur lors de la sauvegarde sur Google Drive',
    };
  }
}

/**
 * Delete a specific backup file on Google Drive (with explicit confirmation per guidelines)
 */
export async function deleteDriveFile(fileId: string): Promise<boolean> {
  try {
    if (!cachedAccessToken) throw new Error('Non connecté');
    const res = await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
    });
    return res.ok || res.status === 204;
  } catch (err) {
    console.error('Delete file error:', err);
    return false;
  }
}



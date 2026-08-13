import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { DocumentData, ClientData, ExpenseItem } from '../types';

// Reuse Firebase initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// In-memory token cache
let cachedAccessToken: string | null = null;

export interface DriveSyncStatus {
  connected: boolean;
  rootFolderId?: string;
  subfolders?: { [key: string]: string };
  lastSyncTime?: string;
}

/**
 * Request Google Drive OAuth token and return access token
 */
export async function getGoogleDriveAccessToken(): Promise<string> {
  if (cachedAccessToken) return cachedAccessToken;

  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  provider.addScope('https://www.googleapis.com/auth/calendar.events');

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error('Impossible de récupérer le jeton d\'accès Google Drive.');
  }

  cachedAccessToken = credential.accessToken;
  return cachedAccessToken;
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

  let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  // Check if exists
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
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

  // Create folder
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
    throw new Error(`Erreur de création de dossier Google Drive: ${folderName}`);
  }

  const createData = await createRes.json();
  return createData.id;
}

/**
 * Initialize Drive Folder Architecture:
 * - HAFSI PROD SITE/
 *   ├── 01_Documents_Factures_Devis
 *   ├── 02_CRM_Clients_Reseau
 *   ├── 03_Gear_Equipement
 *   └── 04_Finances_Comptabilite
 */
export async function setupDriveFolders(): Promise<{
  rootId: string;
  subfolders: { [key: string]: string };
}> {
  const token = await getGoogleDriveAccessToken();
  const rootId = await findOrCreateFolder('HAFSI PROD SITE', undefined, token);

  const subfolders = {
    docs: await findOrCreateFolder('01_Documents_Factures_Devis', rootId, token),
    crm: await findOrCreateFolder('02_CRM_Clients_Reseau', rootId, token),
    gear: await findOrCreateFolder('03_Gear_Equipement', rootId, token),
    finance: await findOrCreateFolder('04_Finances_Comptabilite', rootId, token),
  };

  return { rootId, subfolders };
}

/**
 * Upload or Update a file on Google Drive
 */
export async function uploadFileToDrive(
  fileName: string,
  content: string,
  mimeType: string = 'text/plain',
  folderId: string
): Promise<string> {
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
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
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
    throw new Error(err.error?.message || 'Échec de l\'envoi du fichier sur Drive.');
  }

  const data = await res.json();
  return data.id;
}

/**
 * Sync entire CineManage state to Google Drive
 */
export async function syncAllStateToDrive(
  documents: DocumentData[],
  clients: ClientData[],
  expenses: ExpenseItem[]
): Promise<{ success: boolean; message: string }> {
  try {
    const { subfolders } = await setupDriveFolders();

    // 1. Sync Documents
    const docsJson = JSON.stringify(documents, null, 2);
    await uploadFileToDrive(
      `documents_backup_${new Date().toISOString().split('T')[0]}.json`,
      docsJson,
      'application/json',
      subfolders.docs
    );

    // Also upload individual document text summaries for quick viewing on Drive
    for (const doc of documents.slice(0, 10)) {
      const totalHt = doc.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
      const totalTtc = totalHt * (1 + (doc.tvaRate ?? 20) / 100);
      const summaryText = `DOCUMENT: ${doc.type} ${doc.number}\nTYPE: ${doc.type}\nDATE: ${doc.date}\nCLIENT: ${doc.clientName} (${doc.clientCompany})\nTOTAL HT: ${totalHt} MAD\nTOTAL TTC: ${totalTtc} MAD\nSTATUT: ${doc.status.toUpperCase()}\n`;
      await uploadFileToDrive(
        `${doc.number}_${doc.clientCompany.replace(/\s+/g, '_')}.txt`,
        summaryText,
        'text/plain',
        subfolders.docs
      );
    }

    // 2. Sync CRM
    const crmJson = JSON.stringify(clients, null, 2);
    await uploadFileToDrive(
      `crm_clients_${new Date().toISOString().split('T')[0]}.json`,
      crmJson,
      'application/json',
      subfolders.crm
    );

    // 3. Sync Finances
    const finJson = JSON.stringify(expenses, null, 2);
    await uploadFileToDrive(
      `finances_depenses_${new Date().toISOString().split('T')[0]}.json`,
      finJson,
      'application/json',
      subfolders.finance
    );

    return {
      success: true,
      message: '✅ Synchronisation complète réussie ! Dossier Google Drive "HAFSI PROD SITE" mis à jour avec succès.',
    };
  } catch (err: any) {
    console.error('Drive Sync error:', err);
    return {
      success: false,
      message: err.message || 'Erreur lors de la synchronisation avec Google Drive.',
    };
  }
}

/**
 * Add Shooting Date to Google Calendar
 */
export async function addShootingEventToGoogleCalendar(
  title: string,
  shootingDate: string,
  clientName: string
): Promise<string> {
  const token = await getGoogleDriveAccessToken();

  const startIso = new Date(`${shootingDate}T09:00:00`).toISOString();
  const endIso = new Date(`${shootingDate}T18:00:00`).toISOString();

  const event = {
    summary: `🎬 Tournage: ${title} - ${clientName}`,
    description: `Tournage prévu par Hafsi Prod pour le client ${clientName}.\nDocument: ${title}`,
    start: { dateTime: startIso, timeZone: 'Africa/Casablanca' },
    end: { dateTime: endIso, timeZone: 'Africa/Casablanca' },
    colorId: '5', // Yellow/Gold
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Erreur lors de l\'ajout de l\'évènement au calendrier.');
  }

  const data = await res.json();
  return data.htmlLink;
}

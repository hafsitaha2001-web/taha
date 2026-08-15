import {
  db,
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  DEFAULT_STUDIO_ID
} from './firebase';
import {
  ProfileInfo,
  ClientData,
  DocumentData,
  ExpenseItem,
  DirectRevenueItem,
  FinancialGoalConfig
} from '../types';

export interface StudioCloudState {
  profile: ProfileInfo;
  clients: ClientData[];
  documents: DocumentData[];
  expenses: ExpenseItem[];
  directRevenues: DirectRevenueItem[];
  customGoals?: FinancialGoalConfig[];
  updatedAt?: string;
  deviceOrigin?: string;
}

/**
 * Merge two arrays of items by their unique ID, prioritizing non-empty items
 */
function mergeListsById<T extends { id: string }>(primary: T[] = [], secondary: T[] = []): T[] {
  const map = new Map<string, T>();
  // Put secondary first
  for (const item of secondary) {
    if (item && item.id) map.set(item.id, item);
  }
  // Primary overwrites or adds
  for (const item of primary) {
    if (item && item.id) map.set(item.id, item);
  }
  return Array.from(map.values());
}

/**
 * Abonnement en temps réel aux données Firestore pour synchroniser Mac, iPhone, etc.
 * Avec fusion intelligente pour ne JAMAIS perdre de données locales
 */
export function subscribeToStudioCloud(
  onData: (data: Partial<StudioCloudState>, rawSnapshotExists: boolean) => void,
  onError?: (err: any) => void
) {
  const docRef = doc(db, 'studios', DEFAULT_STUDIO_ID);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as StudioCloudState;
        onData(data, true);
      } else {
        onData({}, false);
      }
    },
    (error) => {
      console.warn('[Firebase Sync Error]', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Sauvegarde de l'état studio dans Firestore
 */
export async function saveStudioToCloud(state: Partial<StudioCloudState>) {
  try {
    const docRef = doc(db, 'studios', DEFAULT_STUDIO_ID);
    await setDoc(
      docRef,
      {
        ...state,
        updatedAt: new Date().toISOString(),
        deviceOrigin: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('[Firebase Save Error]', error);
    return false;
  }
}

export { mergeListsById };

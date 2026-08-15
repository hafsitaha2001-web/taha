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
 * Merge two arrays of items by their unique ID
 * Keeps user items by prioritizing non-empty newer elements and preserving any additions
 */
export function mergeListsById<T extends { id: string }>(incoming: T[] = [], current: T[] = []): T[] {
  const map = new Map<string, T>();

  // Add current state items first
  for (const item of current) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }

  // Incoming cloud items overwrite or add, but don't delete locally present items
  for (const item of incoming) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }

  return Array.from(map.values());
}

/**
 * Abonnement en temps réel aux données Firestore pour synchroniser Mac, iPhone, etc.
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
      console.warn('[Firebase Sync Warning]', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Sauvegarde synchrone et immédiate de l'état studio dans Firestore
 */
export async function saveStudioToCloud(state: Partial<StudioCloudState>): Promise<boolean> {
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

import {
  db,
  doc,
  onSnapshot,
  setDoc,
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
 * Abonnement en temps réel aux données Firestore pour synchroniser Mac, iPhone, etc.
 */
export function subscribeToStudioCloud(
  onData: (data: Partial<StudioCloudState>) => void,
  onError?: (err: any) => void
) {
  const docRef = doc(db, 'studios', DEFAULT_STUDIO_ID);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as StudioCloudState;
        onData(data);
      } else {
        // Document n'existe pas encore
        onData({});
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

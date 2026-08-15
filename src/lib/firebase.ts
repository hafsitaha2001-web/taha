import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  enableIndexedDbPersistence,
  Firestore
} from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

const STORAGE_CUSTOM_FIREBASE_CONFIG = 'cinemanage_custom_firebase_config';

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

// Get saved custom config if user pasted one, or fallback to default environment config
export function getActiveFirebaseConfig(): FirebaseCustomConfig {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_FIREBASE_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return defaultFirebaseConfig as unknown as FirebaseCustomConfig;
}

export function saveCustomFirebaseConfig(config: FirebaseCustomConfig | null) {
  if (typeof window === 'undefined') return;
  if (!config) {
    localStorage.removeItem(STORAGE_CUSTOM_FIREBASE_CONFIG);
  } else {
    localStorage.setItem(STORAGE_CUSTOM_FIREBASE_CONFIG, JSON.stringify(config));
  }
}

export function isUsingCustomFirebaseConfig(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(STORAGE_CUSTOM_FIREBASE_CONFIG);
    return Boolean(saved && JSON.parse(saved)?.apiKey);
  } catch {
    return false;
  }
}

// Initialize active Firebase App
const activeConfig = getActiveFirebaseConfig();
let app: FirebaseApp;

try {
  const existingApps = getApps();
  app = existingApps.length === 0 ? initializeApp(activeConfig) : existingApps[0];
} catch (e) {
  console.warn('Firebase init fallback:', e);
  app = getApps()[0] || initializeApp(defaultFirebaseConfig);
}

// Initialize Firestore
export const db: Firestore = activeConfig.firestoreDatabaseId
  ? getFirestore(app, activeConfig.firestoreDatabaseId)
  : getFirestore(app);

// Enable offline persistence in browser
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore offline persistence: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore offline persistence not supported in this browser');
      }
    });
  } catch {
    // Ignore already enabled
  }
}

export const DEFAULT_STUDIO_ID = 'main_studio';

export { doc, onSnapshot, setDoc, getDoc, enableIndexedDbPersistence };

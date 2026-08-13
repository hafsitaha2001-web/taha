import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ClientData } from '../types';

// Initialize Firebase App if not already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export interface ContactImportResult {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  photoUrl?: string;
}

/**
 * Native Phone Contact Picker API (Supported on Android / Mobile Chrome)
 */
export async function pickNativePhoneContacts(): Promise<ContactImportResult[]> {
  if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
    try {
      const props = ['name', 'tel', 'email', 'icon'];
      const opts = { multiple: true };
      const contacts = await (navigator as any).contacts.select(props, opts);

      return contacts.map((c: any) => {
        const name = Array.isArray(c.name) ? c.name[0] : c.name || 'Contact Téléphone';
        const phone = Array.isArray(c.tel) ? c.tel[0] : c.tel || '';
        const email = Array.isArray(c.email) ? c.email[0] : c.email || '';
        
        let photoUrl = '';
        if (c.icon && c.icon.length > 0) {
          const blob = c.icon[0];
          photoUrl = URL.createObjectURL(blob);
        }

        return {
          name,
          phone,
          email,
          company: 'Contact Répertoire',
          photoUrl,
        };
      });
    } catch (err) {
      console.warn('Native contact picker cancelled or failed:', err);
      return [];
    }
  }
  return [];
}

/**
 * Fetch Google Contacts via Google People API using Firebase OAuth access token
 */
export async function fetchGoogleContacts(): Promise<ContactImportResult[]> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
  provider.addScope('https://www.googleapis.com/auth/user.phonenumbers.read');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (!accessToken) {
      throw new Error("Impossible d'obtenir le jeton d'accès Google.");
    }

    // Call Google People API
    const response = await fetch(
      'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses,organizations,photos&pageSize=100',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errJson = await response.json();
      throw new Error(errJson.error?.message || 'Erreur lors de la récupération des contacts Google.');
    }

    const data = await response.json();
    const connections = data.connections || [];

    const imported: ContactImportResult[] = [];

    for (const person of connections) {
      const name = person.names?.[0]?.displayName || person.names?.[0]?.givenName || 'Contact Sans Nom';
      const phone = person.phoneNumbers?.[0]?.value || '';
      const email = person.emailAddresses?.[0]?.value || '';
      const company = person.organizations?.[0]?.name || 'Google Contacts';
      const photoUrl = person.photos?.[0]?.url || '';

      if (name || phone) {
        imported.push({
          name,
          phone,
          email,
          company,
          photoUrl,
        });
      }
    }

    return imported;
  } catch (err: any) {
    console.error('Google Contacts fetch error:', err);
    throw err;
  }
}

/**
 * Parse VCF (vCard) file text content
 */
export function parseVCardText(vcfContent: string): ContactImportResult[] {
  const contacts: ContactImportResult[] = [];
  const cards = vcfContent.split(/END:VCARD/i);

  for (const card of cards) {
    if (!card.trim()) continue;

    let name = '';
    let phone = '';
    let email = '';
    let company = '';

    const lines = card.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith('FN:') || line.startsWith('FN;')) {
        name = line.substring(line.indexOf(':') + 1).trim();
      } else if (!name && (line.startsWith('N:') || line.startsWith('N;'))) {
        const parts = line.substring(line.indexOf(':') + 1).split(';');
        name = parts.filter(Boolean).reverse().join(' ').trim();
      } else if (line.startsWith('TEL') || line.includes('TEL;')) {
        phone = line.substring(line.indexOf(':') + 1).trim();
      } else if (line.startsWith('EMAIL') || line.includes('EMAIL;')) {
        email = line.substring(line.indexOf(':') + 1).trim();
      } else if (line.startsWith('ORG') || line.includes('ORG;')) {
        company = line.substring(line.indexOf(':') + 1).replace(/;/g, ' ').trim();
      }
    }

    if (name || phone) {
      contacts.push({
        name: name || 'Contact Téléphone',
        phone,
        email,
        company: company || 'Répertoire VCF',
      });
    }
  }

  return contacts;
}

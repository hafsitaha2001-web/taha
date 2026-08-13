export type DocumentType = 'DEVIS' | 'FACTURE' | 'FACTURE_ACOMPTE' | 'BON_LIVRAISON';

export type DocumentStatus = 'brouillon' | 'envoye' | 'accorde' | 'paye' | 'retard';

export interface DocumentItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // MAD
  discountPercent?: number;
}

export interface AutomationChecklist {
  briefSent: boolean;
  bonAccordSigned: boolean;
  orderReceived: boolean;
  driveSaved: boolean;
  relanceSent: boolean;
}

export interface DocumentData {
  id: string;
  type: DocumentType;
  number: string; // e.g. DEV-2026-001 or FAC-2026-001
  date: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  shootingDate?: string; // YYYY-MM-DD (Date de tournage)
  clientId: string;
  clientName: string;
  clientCompany: string;
  clientIce: string;
  clientAddress: string;
  clientEmail?: string;
  clientPhone?: string;
  items: DocumentItem[];
  tvaRate: number; // e.g., 0 or 20 (%)
  acompteRate: number; // e.g., 0, 30, 40, 50 (%)
  acompteDescription?: string;
  status: DocumentStatus;
  checklist: AutomationChecklist;
  notes?: string;
  createdAt: string;
  isTrashed?: boolean;
}

export interface ClientData {
  id: string;
  name: string;
  company: string;
  photoUrl: string;
  ice: string;
  email: string;
  phone: string;
  city: string;
  sector: 'Agence Pub' | 'Marque & Entreprise' | 'Événementiel' | 'Institutionnel' | 'Cinéma & TV';
  roleType?: 'Apporteur' | 'Filmmaker' | 'Monteur' | 'Client' | 'Agence' | 'Autre';
  acquisitionSource: string; // e.g., "Recommandé par Reda" or "Direct Instagram"
  referrerId?: string | null; // ID of client or person who referred
  referrerName?: string | null;
  connectedContactIds?: string[];
  notes?: string;
  createdAt: string;
  isTrashed?: boolean;
}

export interface ProfileInfo {
  filmmakerName: string;
  title: string;
  address: string;
  phone: string;
  email: string;
  websiteUrl: string;
  ice: string;
  ifNumber: string;
  taxePro: string;
  inscriptionNo: string;
  cnssNo: string;
  rib: string;
  bankName: string;
  bannerImage: string;
  paymentTerms: string;
  theme?: 'dark' | 'light';
  defaultCurrency?: string;
  defaultTvaRate?: number;
}

export interface ExpenseItem {
  id: string;
  date: string;
  category: 'MATERIEL' | 'EQUIPE' | 'POSTPROD' | 'DEPLACEMENT' | 'AUTRE';
  description: string;
  amountMAD: number;
  deductibleTva: boolean;
}

export interface StrategicAdvice {
  id: string;
  type: 'danger' | 'warning' | 'opportunity' | 'info';
  title: string;
  message: string;
  impactScore: number; // 1-100
  actionText: string;
  category: 'Concentration' | 'Plafond AE' | 'Tarification' | 'Réseau' | 'SARL';
}

export interface GearItem {
  id: string;
  category: 'Caméra & Optiques' | 'Éclairage & Machinerie' | 'Audio & HF' | 'Drone & FPV' | 'Post-Production';
  name: string;
  dailyRateMAD: number;
  purchaseValueMAD: number;
  amortizationMonths: number;
  isSelected?: boolean;
  status?: 'Disponible' | 'En tournage' | 'En maintenance';
  isTrashed?: boolean;
}

export interface CrewRoleItem {
  id: string;
  department: 'Régie & Prod' | 'Image & Caméra' | 'Lumière & Machinerie' | 'Son & Audio' | 'Post-Production & VF';
  roleName: string;
  dayRateMAD: number;
  daysCount: number;
  isSelected?: boolean;
}

export interface CallSheetData {
  id: string;
  projectTitle: string;
  clientName: string;
  shootDate: string;
  locationCity: string;
  locationAddress: string;
  callTime: string;
  sunsetTime: string;
  directorName: string;
  dpName: string;
  producerPhone: string;
  scenesNotes: string;
  weatherNotes: string;
  requiredGear: string[];
}

export interface LegalClause {
  id: string;
  title: string;
  category: 'Droits d\'Auteur' | 'Modalités de Paiement' | 'Confidentialité' | 'Annulation & Force Majeure' | 'Responsabilité Matériel';
  content: string;
}


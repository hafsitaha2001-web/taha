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
  tvaRate: number; // e.g., 0, 1, 2, 20 (%)
  acompteRate: number; // e.g., 0, 30, 40, 50 (%)
  acompteDescription?: string;
  // Optional Production Scope & Legal Safeguards (especially for Devis)
  hasProductionSpecs?: boolean; // Explicit toggle for Technical & Production specifications
  deliverables?: string; // e.g. "1 Master 4K 16:9 + 2 déclinaisons 9:16 Reels/TikTok + Fichiers .SRT. Inclus 2 sessions de retours"
  revisionsAllowed?: number; // e.g. 2 (sessions de révisions incluses)
  extraRevisionRate?: number; // e.g. 500 (DH HT / heure ou forfait de révision extra)
  crewAssigned?: string; // e.g. "1 Réalisateur / Cadreur, 1 Assistant / Ingénieur son"
  gearDeployed?: string; // e.g. "Sony FX3/FX6, Optiques Cinéma, Gimbal, Kit Aputure LED, Micros HF"
  includeLegalClauses?: boolean; // Toggle for Annex: Conditions & Clauses de protection
  customClauses?: string; // Additional custom conditions
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
  category:
    | 'Droits d\'Auteur'
    | 'Droits d\'Auteur (Loi 2-00)'
    | 'Rushes & Fichiers RAW'
    | 'Modalités de Paiement'
    | 'Acomptes & Réservation (D.O.C.)'
    | 'Annulation & Report'
    | 'Cadre des Révisions'
    | 'Droit à l\'Image & CNDP'
    | 'Délais de Paiement (Loi 69-21)'
    | 'Juridiction & Droit Applicable'
    | 'Confidentialité'
    | 'Annulation & Force Majeure'
    | 'Responsabilité Matériel'
    | string;
  content: string;
}

export type DirectRevenueFrequency = 'one_time' | 'weekly' | 'monthly';
export type DirectPaymentMethod = 'virement' | 'especes' | 'cheque' | 'autre';
export type DirectRevenueCategory =
  | 'Tournage Direct'
  | 'Montage & Post-Prod'
  | 'Gestion Réseaux / Reels'
  | 'Forfait Mensuel'
  | 'Forfait Hebdomadaire'
  | 'Cadreur / Opérateur'
  | 'Autre Mission Directe';

export interface DirectRevenueItem {
  id: string;
  clientId?: string;
  clientName: string;
  clientCompany?: string;
  title: string;
  category: DirectRevenueCategory;
  amountMAD: number; // Montant par versement
  frequency: DirectRevenueFrequency; // 'one_time' | 'weekly' | 'monthly'
  occurrencesCount: number; // Nombre de versements/semaines/mois perçus
  date: string; // YYYY-MM-DD
  paymentMethod: DirectPaymentMethod;
  status: 'paye' | 'en_attente';
  notes?: string;
  createdAt: string;
  isTrashed?: boolean;
}

export type FinancialGoalType =
  | 'ae_legal' // Plafond légal Auto-Entrepreneur (200 000 MAD)
  | 'ae_sales' // Plafond Vente/Hybride (500 000 MAD)
  | 'personal_annual' // Objectif Annuel Personnalisé (ex: 350 000 MAD)
  | 'personal_monthly' // Objectif Mensuel (ex: 30 000 MAD / mois)
  | 'personal_quarterly' // Objectif Trimestriel (ex: 80 000 MAD / trimestre)
  | 'gear_investment' // Achat Matériel / Investissement Production
  | 'sarl_threshold' // Seuil transition SARL AU
  | 'custom'; // Objectif 100% Libre

export interface FinancialMilestone {
  id: string;
  title: string;
  amountMAD: number;
  rewardNote?: string;
}

export interface FinancialGoalConfig {
  id: string;
  type: FinancialGoalType;
  title: string;
  targetAmountMAD: number;
  startingBalanceMAD: number; // Report de solde ou CA antérieur hors app
  deadlineDate?: string;
  categoryNote?: string;
  calculationScope?: 'all' | 'official_only' | 'direct_only'; // Périmètre de calcul du CA
  milestones: FinancialMilestone[];
}


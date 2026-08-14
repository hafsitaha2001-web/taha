import { GearItem, CrewRoleItem, CallSheetData, LegalClause } from '../types';

// Clean state: No imaginary gear - user adds their own real equipment
export const initialGearList: GearItem[] = [];

export const initialCrewRoles: CrewRoleItem[] = [
  {
    id: 'cr-1',
    department: 'Régie & Prod',
    roleName: 'Réalisateur / Directeur Artistique',
    dayRateMAD: 6000,
    daysCount: 1,
  },
  {
    id: 'cr-2',
    department: 'Image & Caméra',
    roleName: 'Chef Opérateur / Directeur de la Photographie (DP)',
    dayRateMAD: 5000,
    daysCount: 1,
  },
  {
    id: 'cr-3',
    department: 'Image & Caméra',
    roleName: 'Cadreur Caméra / Opérateur Gimbal Ronin',
    dayRateMAD: 3500,
    daysCount: 1,
  },
  {
    id: 'cr-4',
    department: 'Image & Caméra',
    roleName: '1er Assistant Caméra (Pointeur / Focus Puller)',
    dayRateMAD: 2500,
    daysCount: 1,
  },
  {
    id: 'cr-5',
    department: 'Lumière & Machinerie',
    roleName: 'Chef Électricien (Gaffer) + Kit C-Stands',
    dayRateMAD: 2800,
    daysCount: 1,
  },
  {
    id: 'cr-6',
    department: 'Son & Audio',
    roleName: 'Ingénieur du Son / Prise de son Direct',
    dayRateMAD: 3000,
    daysCount: 1,
  },
  {
    id: 'cr-7',
    department: 'Post-Production & VF',
    roleName: 'Monteur Vidéo Cinéma (Journée de Cut)',
    dayRateMAD: 2500,
    daysCount: 3,
  },
  {
    id: 'cr-8',
    department: 'Post-Production & VF',
    roleName: 'Étalonneur DaVinci Resolve (Colorist)',
    dayRateMAD: 3500,
    daysCount: 1,
  },
];

export const initialCallSheets: CallSheetData[] = [];

export const legalClauses: LegalClause[] = [
  {
    id: 'lc-1',
    category: "Droits d'Auteur",
    title: 'Cession de Droits d\'Exploitation & Image (Norme CCMC Maroc)',
    content: 'Toutes les vidéos, rushes et montages finaux restent la propriété intellectuelle exclusive du Réalisateur/Studio jusqu’au paiement intégral des factures émises. À réception du solde, les droits d’exploitation publicitaire sont cédés au Client pour une durée de 3 ans sur le territoire Maroc & Digital Monde.',
  },
  {
    id: 'lc-2',
    category: 'Modalités de Paiement',
    title: 'Acompte Bloquant & Calendrier d\'Échéances',
    content: 'Pour verrouiller la date de tournage et la réservation du matériel, un acompte de 40% TTC est exigible à la signature du présent devis. Le solde de 60% est payable sous 30 jours à compter de la livraison des fichiers masters finalisés.',
  },
  {
    id: 'lc-3',
    category: 'Annulation & Force Majeure',
    title: 'Frais de Report ou d\'Annulation de Tournage',
    content: 'En cas d’annulation par le Client moins de 48 heures avant l’heure de convocation (Call Time), l’acompte versé restera définitivement acquis au Studio à titre de dédommagement pour l’immobilisation de l’équipe et du matériel.',
  },
  {
    id: 'lc-4',
    category: 'Confidentialité',
    title: 'Engagement de Non-Divulgation (NDA Projets Secret)',
    content: 'Le Studio s’engage à ne diffuser aucune image du tournage ou des coulisses (Behind The Scenes) sur ses réseaux sociaux avant la diffusion officielle du spot par le Client.',
  },
  {
    id: 'lc-5',
    category: 'Responsabilité Matériel',
    title: 'Assurance Tournage & Dommages Matériel',
    content: 'Le Client est responsable de la sécurité sur le lieu de tournage. Toute détérioration causée par des tiers présents sur le plateau au matériel du Studio fera l’objet d’une prise en charge par l’assurance du Client.',
  },
];

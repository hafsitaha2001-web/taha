import { GearItem, CrewRoleItem, CallSheetData, LegalClause } from '../types';

export const initialGearList: GearItem[] = [
  {
    id: 'g-1',
    category: 'Caméra & Optiques',
    name: 'Pack Caméra Sony FX6 / Cinema Line 4K 120fps + Rig Tilta',
    dailyRateMAD: 2500,
    purchaseValueMAD: 75000,
    amortizationMonths: 24,
  },
  {
    id: 'g-2',
    category: 'Caméra & Optiques',
    name: 'Série 4 Optiques Cinéma Fictives / Zeiss CP.3 ou DZOFilm Vespid',
    dailyRateMAD: 1800,
    purchaseValueMAD: 55000,
    amortizationMonths: 18,
  },
  {
    id: 'g-3',
    category: 'Caméra & Optiques',
    name: 'RED V-Raptor 8K VV Cinema Package + Moniteur SmallHD 7"',
    dailyRateMAD: 5500,
    purchaseValueMAD: 180000,
    amortizationMonths: 36,
  },
  {
    id: 'g-4',
    category: 'Éclairage & Machinerie',
    name: 'Kit Éclairage Aputure 600d Pro + Light Dome II + Pied C-Stand',
    dailyRateMAD: 1200,
    purchaseValueMAD: 28000,
    amortizationMonths: 12,
  },
  {
    id: 'g-5',
    category: 'Éclairage & Machinerie',
    name: 'Stabilisateur DJI Ronin 2 / RS3 Pro + Ready Rig GS',
    dailyRateMAD: 1500,
    purchaseValueMAD: 42000,
    amortizationMonths: 18,
  },
  {
    id: 'g-6',
    category: 'Audio & HF',
    name: 'Enregistreur Sound Devices + Kit Micro HF Sennheiser G4 + Boom',
    dailyRateMAD: 1000,
    purchaseValueMAD: 32000,
    amortizationMonths: 15,
  },
  {
    id: 'g-7',
    category: 'Drone & FPV',
    name: 'Drone DJI Inspire 3 8K / FPV Cinewhoop Custom + Casque Goggles',
    dailyRateMAD: 3500,
    purchaseValueMAD: 120000,
    amortizationMonths: 24,
  },
  {
    id: 'g-8',
    category: 'Post-Production',
    name: 'Station Mac Studio M2 Ultra + Moniteur Calibré EIZO 4K',
    dailyRateMAD: 1500,
    purchaseValueMAD: 65000,
    amortizationMonths: 24,
  },
];

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

export const initialCallSheets: CallSheetData[] = [
  {
    id: 'cs-1',
    projectTitle: 'Spot Publicitaire TV & Digital "Royal Resort Marrakech"',
    clientName: 'Groupe Hôtelier Palmeraie',
    shootDate: '2026-09-15',
    locationCity: 'Marrakech',
    locationAddress: 'Palmeraie Resort Villa #12, Route de Fès, Marrakech',
    callTime: '06:30',
    sunsetTime: '19:15',
    directorName: 'Taha Hafsi',
    dpName: 'Karim Benjelloun',
    producerPhone: '+212 6 61 23 45 67',
    scenesNotes: 'Scène 1 : Lever de soleil sur la piscine (07h00 - 09h30). Scène 2 : Suite Présidentielle & Lifestyle (10h30 - 13h00). Scène 3 : Dîner gastronomique au coucher du soleil.',
    weatherNotes: 'Soleil dégagé 32°C. Prévoir diffusions textiles pour lumière directe à 12h00.',
    requiredGear: [
      'Sony FX6 + Kit Optiques Prime',
      'Aputure 600d + Softbox 150cm',
      'Gimbal DJI RS3 Pro',
      'Drone FPV 4K',
    ],
  },
];

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

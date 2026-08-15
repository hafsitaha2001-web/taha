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
    category: "Droits d'Auteur (Loi 2-00 / 34-05)",
    title: 'Cession des Droits d\'Exploitation & Réserve de Propriété (Loi 2-00 / 34-05)',
    content: 'Conformément aux dispositions de la législation marocaine sur la propriété littéraire et artistique (Loi n° 2-00 telle que modifiée et complétée par la Loi n° 34-05), la cession des droits patrimoniaux d\'exploitation (reproduction, diffusion numérique/web, réseaux sociaux, télévision et affichage) est acquise au client dès le règlement intégral et effectif de la totalité du montant TTC facturé. Les droits moraux de l\'auteur réalisateur (droit de paternité et droit au respect de l\'intégrité de l\'œuvre, art. 10 Loi 2-00) demeurent perpétuels, inaliénables et imprescriptibles.',
  },
  {
    id: 'lc-2',
    category: 'Rushes & Fichiers RAW',
    title: 'Propriété Exclusive des Rushes Bruts (RAW) & Projets de Montage',
    content: 'La prestation porte exclusivement sur la livraison du master final étalonné et validé aux formats spécifiés. Les fichiers sources bruts d\'enregistrement (rushes vidéo RAW non étalonnés, profils LOG, pistes audio multicanales séparées) et les projets logiciels de montage (DaVinci Resolve / Premiere Pro / After Effects) constituent les outils techniques protégés de création demeurant la propriété matérielle et intellectuelle exclusive du réalisateur, sauf convention de cession de rushes spécifique expressément stipulée au devis.',
  },
  {
    id: 'lc-3',
    category: 'Acomptes & Réservation (D.O.C.)',
    title: 'Régime des Acomptes & Réservation Ferme (Art. 288 & 723 D.O.C. Maroc)',
    content: 'Conformément aux articles 288, 289 et 723 du Dahir des Obligations et Contrats (D.O.C.), le versement de l\'acompte de réservation à la signature du devis garantit le blocage exclusif des dates de tournage dans le planning du studio ainsi que la mobilisation ferme des techniciens et du parc matériel de tournage. Cet acompte engage irrévocablement les deux parties pour la réalisation de la mission.',
  },
  {
    id: 'lc-4',
    category: 'Cadre des Révisions',
    title: 'Accompagnement Qualité, Retours & Anti-Dérive (Scope Creep)',
    content: 'Afin de garantir un rendu visuel d\'excellence et un respect rigoureux du calendrier de livraison, le devis comprend forfaitairement 2 sessions complètes de retours et d\'ajustements mineurs (montage, titrages, étalonnage) sur la base du brief validé, dans un délai de 15 jours suivant la livraison du premier master. Toute modification substantielle du scénario ou session additionnelle fait l\'objet d\'un avenant tarifé transparent.',
  },
  {
    id: 'lc-5',
    category: 'Annulation & Report',
    title: 'Flexibilité de Planning, Report & Force Majeure (Art. 269 D.O.C.)',
    content: 'En cas de contrainte imprévue ou d\'intempéries majeures (force majeure au sens de l\'article 269 du D.O.C.), une date de repli est convenue d\'un commun accord sans pénalité. Tout report unilatéral notifié par le client à moins de 72 heures du tournage entraîne l\'acquisition de l\'acompte à titre d\'indemnité forfaitaire d\'immobilisation des équipes et du matériel déjà engagés.',
  },
  {
    id: 'lc-6',
    category: 'Droit à l\'Image & CNDP',
    title: 'Autorisations de Tournage, Droit à l\'Image & Conformité CNDP (Loi 09-08)',
    content: 'Le client donneur d\'ordre garantit avoir recueilli l\'ensemble des autorisations écrites de captation et de diffusion d\'image auprès de ses collaborateurs, intervenants et propriétaires de lieux privés filmés, conformément à la Loi marocaine n° 09-08 relative à la protection des données personnelles. Le prestataire garantit un traitement éthique, sécurisé et confidentiel des images enregistrées.',
  },
  {
    id: 'lc-7',
    category: 'Délais de Paiement (Loi 69-21)',
    title: 'Transparence Commerciale & Délais de Règlement (Loi 69-21 & Art. 264 D.O.C.)',
    content: 'En vertu de la Loi marocaine n° 69-21 régissant les délais de paiement et de l\'article 264 du D.O.C., les règlements s\'effectuent par virement bancaire sous 30 jours à compter de la date d\'émission de la facture. Tout retard donne lieu de plein droit aux indemnités légales de recouvrement prévues par la réglementation marocaine.',
  },
  {
    id: 'lc-8',
    category: 'Juridiction & Droit Applicable',
    title: 'Concertation Amiable, Droit Marocain & Tribunal de Commerce',
    content: 'Les parties s\'engagent expressément à privilégier la concertation et le dialogue amiable pour toute question relative à l\'interprétation ou l\'exécution de la prestation. À défaut d\'accord amiable sous 30 jours, tout litige relève de la compétence exclusive du Tribunal de Commerce du siège social du prestataire, sous l\'empire exclusif du Droit Marocain.',
  },
];

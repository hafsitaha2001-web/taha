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
    category: "Droits d'Auteur (Loi 2-00)",
    title: 'Cession des Droits Patrimoniaux & Réserve de Propriété (Loi 2-00 / 34-05)',
    content: 'Conformément aux dispositions de la Loi marocaine n° 2-00 relative aux droits d\'auteur et droits voisins (telle que modifiée par la Loi n° 34-05), la cession des droits patrimoniaux d\'exploitation (reproduction, télédiffusion, communication numérique/web et réseaux sociaux) est expressément subordonnée au paiement intégral et effectif de la totalité du montant TTC facturé. Les droits moraux du réalisateur (droit de paternité et au respect de l\'œuvre, art. 10 Loi 2-00) demeurent perpétuels, inaliénables et imprescriptibles.',
  },
  {
    id: 'lc-2',
    category: 'Rushes & Fichiers RAW',
    title: 'Propriété Exclusive des Rushes Bruts (RAW) & Projets de Montage',
    content: 'Les fichiers sources bruts d\'enregistrement (rushes vidéo RAW non étalonnés, profils LOG, pistes audio multicanales séparées) et les projets de montage (DaVinci Resolve / Premiere Pro / After Effects) constituent des fixations techniques protégées demeurant la propriété matérielle et intellectuelle exclusive du réalisateur/producteur. La prestation porte exclusivement sur la livraison du master final étalonné et validé.',
  },
  {
    id: 'lc-3',
    category: 'Acomptes & Réservation (D.O.C.)',
    title: 'Régime des Acomptes & Engagement Ferme (Art. 288 & 723 D.O.C.)',
    content: 'Conformément aux articles 288, 289 et 723 du Dahir des Obligations et Contrats (D.O.C.), le versement de l\'acompte de 40% TTC à la signature du devis vaut engagement irrévocable des deux parties. Cet acompte permet le blocage du planning de tournage, la mobilisation des techniciens et la réservation ferme du parc matériel de prise de vue.',
  },
  {
    id: 'lc-4',
    category: 'Annulation & Report',
    title: 'Indemnité Forfaitaire d\'Annulation & Report (Art. 269 D.O.C.)',
    content: 'Tout report de tournage notifié par le client à moins de 72 heures du Call Time (hors cas de force majeure avéré au sens de l\'article 269 du D.O.C.) entraîne l\'acquisition intégrale et définitive de l\'acompte versé au réalisateur, à titre d\'indemnité forfaitaire d\'immobilisation des équipes et du matériel.',
  },
  {
    id: 'lc-5',
    category: 'Cadre des Révisions',
    title: 'Encadrement des Retours & Anti-Dérive (Scope Creep)',
    content: 'Le devis comprend forfaitairement 2 sessions de retours et d\'ajustements mineurs (montage, titrages, étalonnage) dans un délai de 15 jours suivant la livraison du premier master. Toute modification de scénario en cours de post-production ou session de révision additionnelle sera facturée au taux horaire de 500 DH HT/heure.',
  },
  {
    id: 'lc-6',
    category: 'Droit à l\'Image & CNDP',
    title: 'Autorisations de Tournage & Protection des Données (Loi 09-08 / CNDP)',
    content: 'Le client donneur d\'ordre garantit avoir recueilli l\'ensemble des autorisations écrites de captation et de diffusion d\'image auprès de ses collaborateurs, intervenants, figurants et propriétaires de lieux privés filmés, conformément à la Loi marocaine n° 09-08 relative à la protection des personnes physiques à l\'égard du traitement des données à caractère personnel. Le client dégage la responsabilité du prestataire de tout recours de tiers.',
  },
  {
    id: 'lc-7',
    category: 'Délais de Paiement (Loi 69-21)',
    title: 'Pénalités de Retard de Paiement & Clause Pénale (Loi 69-21 & Art. 264 D.O.C.)',
    content: 'En vertu de la Loi marocaine n° 69-21 régissant les délais de paiement et de l\'article 264 du D.O.C., tout retard de règlement au-delà de la date d\'échéance contractuelle donne lieu de plein droit à une pénalité légale de 1,5% par mois de retard entamé, ainsi qu\'à une indemnité forfaitaire pour frais de recouvrement.',
  },
  {
    id: 'lc-8',
    category: 'Juridiction & Droit Applicable',
    title: 'Droit Marocain & Attribution de Compétence Commerciale',
    content: 'Le présent contrat et ses suites sont régis exclusivement par le Droit Marocain. À défaut de règlement amiable sous 30 jours, tout litige relatif à l\'interprétation, l\'exécution ou la résiliation du contrat relève de la compétence exclusive du Tribunal de Commerce du siège social du prestataire.',
  },
];

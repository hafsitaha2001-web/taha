import React, { useState, useRef } from 'react';
import {
  Users,
  Plus,
  Share2,
  Building,
  Award,
  TrendingUp,
  MapPin,
  Trash2,
  Edit,
  DollarSign,
  Search,
  UserPlus,
  ExternalLink,
  Sparkles,
  Phone,
  Mail,
  ChevronRight,
  X,
  Target,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  Smartphone,
  Cloud,
  FileText,
  Loader2,
  CheckCircle2,
  Upload,
  Repeat,
  Clapperboard,
  Film,
  Video,
  Camera,
  Briefcase,
  Layers,
  Filter,
  ArrowRight,
  Handshake,
} from 'lucide-react';
import { ClientData, DocumentData, DirectRevenueItem, DirectRevenueFrequency, DirectRevenueCategory, DirectPaymentMethod } from '../types';
import {
  pickNativePhoneContacts,
  fetchGoogleContacts,
  parseVCardText,
  ContactImportResult,
} from '../lib/googleContacts';

interface ClientNetworkModuleProps {
  clients: ClientData[];
  documents: DocumentData[];
  directRevenues?: DirectRevenueItem[];
  onSaveClient: (client: ClientData) => void;
  onDeleteClient: (clientId: string) => void;
  onSaveDirectRevenue?: (item: DirectRevenueItem) => void;
  onDeleteDirectRevenue?: (id: string) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
];

export const ClientNetworkModule: React.FC<ClientNetworkModuleProps> = ({
  clients,
  documents,
  directRevenues = [],
  onSaveClient,
  onDeleteClient,
  onSaveDirectRevenue,
  onDeleteDirectRevenue,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id || null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'network' | 'list'>('network');

  // Contact Sync State
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [syncError, setSyncError] = useState<string>('');
  const [importedContacts, setImportedContacts] = useState<ContactImportResult[]>([]);
  const [selectedContactIndices, setSelectedContactIndices] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync Handlers
  const handleNativeContactPicker = async () => {
    setIsSyncing(true);
    setSyncError('');
    setSyncStatusMsg('Ouverture du répertoire téléphone...');

    try {
      const results = await pickNativePhoneContacts();
      if (results.length > 0) {
        setImportedContacts(results);
        setSelectedContactIndices(results.map((_, i) => i));
        setSyncStatusMsg(`${results.length} contact(s) sélectionné(s) depuis votre téléphone.`);
      } else {
        setSyncStatusMsg('Aucun contact sélectionné.');
      }
    } catch (err: any) {
      setSyncError('Le sélecteur de contacts du téléphone n\'a pas pu s\'ouvrir.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleContactsSync = async () => {
    setIsSyncing(true);
    setSyncError('');
    setSyncStatusMsg('Connexion à Google Contacts...');

    try {
      const results = await fetchGoogleContacts();
      if (results.length > 0) {
        setImportedContacts(results);
        setSelectedContactIndices(results.map((_, i) => i));
        setSyncStatusMsg(`${results.length} contact(s) Google synchronisés avec succès !`);
      } else {
        setSyncStatusMsg('Aucun contact trouvé sur ce compte Google.');
      }
    } catch (err: any) {
      console.error(err);
      setSyncError(err.message || 'Erreur lors de la synchronisation des contacts Google.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleVcfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncing(true);
    setSyncError('');
    setSyncStatusMsg('Lecture du fichier vCard (.vcf)...');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const results = parseVCardText(text);
        if (results.length > 0) {
          setImportedContacts(results);
          setSelectedContactIndices(results.map((_, i) => i));
          setSyncStatusMsg(`${results.length} contact(s) extrait(s) du fichier .VCF !`);
        } else {
          setSyncError('Aucun contact valide trouvé dans ce fichier .vcf');
        }
      } catch (err) {
        setSyncError('Impossible de lire le fichier .vcf');
      } finally {
        setIsSyncing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImportContacts = () => {
    const toImport = importedContacts.filter((_, idx) => selectedContactIndices.includes(idx));
    let countNew = 0;
    let countUpdated = 0;

    toImport.forEach((contact) => {
      // Check if contact matches existing client by phone or name
      const existing = clients.find(
        (c) =>
          (contact.phone && c.phone && c.phone.replace(/\s+/g, '') === contact.phone.replace(/\s+/g, '')) ||
          (contact.name && c.name.toLowerCase() === contact.name.toLowerCase())
      );

      if (existing) {
        // Update existing client with synchronized phone / email
        const updated: ClientData = {
          ...existing,
          phone: contact.phone || existing.phone,
          email: contact.email || existing.email,
          photoUrl: contact.photoUrl || existing.photoUrl,
        };
        onSaveClient(updated);
        countUpdated++;
      } else {
        // Create new client
        const newClient: ClientData = {
          id: `cli_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: contact.name,
          company: contact.company || 'Client Répertoire',
          photoUrl: contact.photoUrl || PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)],
          ice: '',
          email: contact.email || '',
          phone: contact.phone || '',
          city: 'Casablanca',
          sector: 'Agence Pub',
          acquisitionSource: 'Synchronisation Téléphone',
          createdAt: new Date().toISOString().split('T')[0],
        };
        onSaveClient(newClient);
        countNew++;
      }
    });

    alert(`✅ Synchronisation terminée !\n- ${countUpdated} contact(s) existant(s) mis à jour avec leur téléphone\n- ${countNew} nouveau(x) client(s) ajouté(s)`);
    setShowSyncModal(false);
    setImportedContacts([]);
    setSelectedContactIndices([]);
    setSyncStatusMsg('');
  };

  // Form State
  const [formId, setFormId] = useState<string>('');
  const [formContactType, setFormContactType] = useState<NonNullable<ClientData['contactType']>>('client_enterprise');
  const [formFilmmakerRole, setFormFilmmakerRole] = useState<NonNullable<ClientData['filmmakerRole']>>('Réalisateur');
  const [formName, setFormName] = useState<string>('');
  const [formCompany, setFormCompany] = useState<string>('');
  const [formPhotoUrl, setFormPhotoUrl] = useState<string>(PRESET_AVATARS[0]);
  const [formIce, setFormIce] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formCity, setFormCity] = useState<string>('Casablanca');
  const [formSector, setFormSector] = useState<ClientData['sector']>('Agence Pub');
  const [formRoleType, setFormRoleType] = useState<NonNullable<ClientData['roleType']>>('Client');
  const [formAcquisitionMode, setFormAcquisitionMode] = useState<'client' | 'filmmaker' | 'friend' | 'direct'>('client');
  const [formSource, setFormSource] = useState<string>('Recommandation Client');
  const [formReferrerId, setFormReferrerId] = useState<string>('');
  const [formFriendName, setFormFriendName] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Network View Filter State
  const [networkFilter, setNetworkFilter] = useState<'all' | 'enterprise' | 'filmmaker' | 'top_referrers'>('all');

  // WhatsApp launcher
  const handleOpenWhatsApp = (phone: string, name: string) => {
    if (!phone) {
      alert('Aucun numéro de téléphone disponible pour ce contact.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `212${cleanPhone.slice(1)}` : cleanPhone;
    const msg = `Bonjour ${name},\nJe vous contacte de la part de Hafsi Prod au sujet de nos collaborations audiovisuelles.`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDeleteClientWithConfirm = (clientId: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce contact du réseau CRM ?')) {
      onDeleteClient(clientId);
      if (selectedClientId === clientId) {
        setSelectedClientId(clients.find((c) => c.id !== clientId)?.id || null);
      }
    }
  };

  // Quick Direct Revenue Modal State for selected client
  const [isQuickDirectModalOpen, setIsQuickDirectModalOpen] = useState<boolean>(false);
  const [editingDirectId, setEditingDirectId] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState<string>('Forfait Réseaux Sociaux (4 Reels / Semaine)');
  const [quickCategory, setQuickCategory] = useState<DirectRevenueCategory>('Gestion Réseaux / Reels');
  const [quickAmountMAD, setQuickAmountMAD] = useState<number>(2500);
  const [quickFrequency, setQuickFrequency] = useState<DirectRevenueFrequency>('weekly');
  const [quickOccurrences, setQuickOccurrences] = useState<number>(4);
  const [quickPaymentMethod, setQuickPaymentMethod] = useState<DirectPaymentMethod>('virement');
  const [quickStatus, setQuickStatus] = useState<'paye' | 'en_attente'>('paye');
  const [quickNotes, setQuickNotes] = useState<string>('');

  const handleOpenQuickDirectModal = (client: ClientData) => {
    setEditingDirectId(null);
    setQuickTitle(`Forfait Contenu - ${client.company || client.name}`);
    setQuickCategory('Gestion Réseaux / Reels');
    setQuickAmountMAD(2500);
    setQuickFrequency('weekly');
    setQuickOccurrences(4);
    setQuickPaymentMethod('virement');
    setQuickStatus('paye');
    setQuickNotes('');
    setIsQuickDirectModalOpen(true);
  };

  const handleOpenEditQuickDirectModal = (item: DirectRevenueItem) => {
    setEditingDirectId(item.id);
    setQuickTitle(item.title);
    setQuickCategory(item.category);
    setQuickAmountMAD(item.amountMAD);
    setQuickFrequency(item.frequency);
    setQuickOccurrences(item.occurrencesCount || 1);
    setQuickPaymentMethod(item.paymentMethod);
    setQuickStatus(item.status);
    setQuickNotes(item.notes || '');
    setIsQuickDirectModalOpen(true);
  };

  const handleSaveQuickDirectRevenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const newItem: DirectRevenueItem = {
      id: editingDirectId || `dir-${Date.now()}`,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientCompany: selectedClient.company || undefined,
      title: quickTitle || 'Mission Directe',
      category: quickCategory,
      amountMAD: Number(quickAmountMAD) || 0,
      frequency: quickFrequency,
      occurrencesCount: Number(quickOccurrences) || 1,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: quickPaymentMethod,
      status: quickStatus,
      notes: quickNotes || undefined,
      createdAt: new Date().toISOString(),
    };

    if (onSaveDirectRevenue) {
      onSaveDirectRevenue(newItem);
    }
    setIsQuickDirectModalOpen(false);
  };

  // Calculate actual realized revenue generated per client (Paid Documents + Paid Direct / Sans Papier)
  const getClientDocRevenue = (clientId: string) => {
    return documents
      .filter((d) => d.clientId === clientId && d.status === 'paye')
      .reduce((sum, doc) => {
        const totalHT = doc.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discountPercent || 0) / 100), 0);
        return sum + totalHT * (1 + doc.tvaRate / 100);
      }, 0);
  };

  const getClientDirectRevenue = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return directRevenues
      .filter(
        (r) =>
          r.status === 'paye' &&
          (r.clientId === clientId ||
            (client && r.clientName && r.clientName.toLowerCase() === client.name.toLowerCase()) ||
            (client && client.company && r.clientCompany && r.clientCompany.toLowerCase() === client.company.toLowerCase()))
      )
      .reduce((sum, r) => sum + r.amountMAD * (r.occurrencesCount || 1), 0);
  };

  const getClientRevenue = (clientId: string) => {
    return getClientDocRevenue(clientId) + getClientDirectRevenue(clientId);
  };

  // Check if a client is a Filmmaker / Creative peer
  const isFilmmakerContact = (client: ClientData) => {
    return (
      client.contactType === 'filmmaker_peer' ||
      client.roleType === 'Filmmaker' ||
      client.roleType === 'Monteur' ||
      !!client.filmmakerRole
    );
  };

  // Calculate revenue brought by referrers with category awareness (Filmmakers vs Enterprise Clients)
  const getReferrerStats = () => {
    const referrerMap: Record<
      string,
      {
        name: string;
        company: string;
        isFilmmaker: boolean;
        filmmakerRole?: string;
        count: number;
        totalRevenue: number;
        clientsBrought: string[];
      }
    > = {};

    clients.forEach((client) => {
      if (client.referrerId) {
        const referrer = clients.find((c) => c.id === client.referrerId);
        const isFilmmaker = referrer ? isFilmmakerContact(referrer) : client.referrerCategory === 'filmmaker_peer';
        const refName = referrer ? referrer.name : client.referrerName || 'Inconnu';
        const refCompany = referrer ? referrer.company : isFilmmaker ? 'Cinéaste Partenaire' : 'Entreprise Recommandatrice';
        const refId = client.referrerId;
        const rev = getClientRevenue(client.id);

        if (!referrerMap[refId]) {
          referrerMap[refId] = {
            name: refName,
            company: refCompany,
            isFilmmaker,
            filmmakerRole: referrer?.filmmakerRole,
            count: 0,
            totalRevenue: 0,
            clientsBrought: [],
          };
        }

        referrerMap[refId].count += 1;
        referrerMap[refId].totalRevenue += rev;
        referrerMap[refId].clientsBrought.push(client.company || client.name);
      }
    });

    return Object.entries(referrerMap).sort((a, b) => b[1].totalRevenue - a[1].totalRevenue);
  };

  const allReferrers = getReferrerStats();
  const topFilmmakerReferrers = allReferrers.filter(([_, r]) => r.isFilmmaker);
  const topEnterpriseReferrers = allReferrers.filter(([_, r]) => !r.isFilmmaker);

  // Global referral totals
  const totalFilmmakerRevenue = topFilmmakerReferrers.reduce((acc, [_, r]) => acc + r.totalRevenue, 0);
  const totalEnterpriseRevenue = topEnterpriseReferrers.reduce((acc, [_, r]) => acc + r.totalRevenue, 0);
  const totalFilmmakerReferralsCount = topFilmmakerReferrers.reduce((acc, [_, r]) => acc + r.count, 0);
  const totalEnterpriseReferralsCount = topEnterpriseReferrers.reduce((acc, [_, r]) => acc + r.count, 0);

  const handleOpenAddForm = () => {
    setFormId('');
    setFormContactType('client_enterprise');
    setFormFilmmakerRole('Réalisateur');
    setFormName('');
    setFormCompany('');
    setFormPhotoUrl(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]);
    setFormIce('');
    setFormEmail('');
    setFormPhone('');
    setFormCity('Casablanca');
    setFormSector('Agence Pub');
    setFormRoleType('Client');
    setFormAcquisitionMode('client');
    setFormSource('Recommandation Entreprise / Client');
    setFormReferrerId(clients[0]?.id || '');
    setFormFriendName('');
    setFormNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (client: ClientData) => {
    setFormId(client.id);
    setFormContactType(client.contactType || (client.roleType === 'Filmmaker' ? 'filmmaker_peer' : 'client_enterprise'));
    setFormFilmmakerRole(client.filmmakerRole || 'Réalisateur');
    setFormName(client.name);
    setFormCompany(client.company);
    setFormPhotoUrl(client.photoUrl || PRESET_AVATARS[0]);
    setFormIce(client.ice);
    setFormEmail(client.email);
    setFormPhone(client.phone);
    setFormCity(client.city);
    setFormSector(client.sector);
    setFormRoleType(client.roleType || (client.contactType === 'filmmaker_peer' ? 'Filmmaker' : 'Client'));
    setFormNotes(client.notes || '');

    if (client.referrerId) {
      const ref = clients.find((c) => c.id === client.referrerId);
      if (ref && isFilmmakerContact(ref)) {
        setFormAcquisitionMode('filmmaker');
      } else {
        setFormAcquisitionMode('client');
      }
      setFormReferrerId(client.referrerId);
      setFormFriendName('');
      setFormSource(client.acquisitionSource || 'Recommandation Client');
    } else if (client.referrerName) {
      if (client.referrerCategory === 'filmmaker_peer') {
        setFormAcquisitionMode('filmmaker');
        setFormFriendName(client.referrerName);
      } else {
        setFormAcquisitionMode('friend');
        setFormFriendName(client.referrerName);
      }
      setFormReferrerId('');
      setFormSource(client.acquisitionSource || `Recommandé par ${client.referrerName}`);
    } else {
      setFormAcquisitionMode('direct');
      setFormReferrerId('');
      setFormFriendName('');
      setFormSource(client.acquisitionSource || 'Direct Instagram');
    }

    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    let finalSource = formSource;
    let finalReferrerId: string | null = null;
    let finalReferrerName: string | null = null;
    let finalReferrerCategory: ClientData['referrerCategory'] = 'direct';

    if (formAcquisitionMode === 'client') {
      const referrerObj = clients.find((c) => c.id === formReferrerId);
      if (referrerObj) {
        finalReferrerId = referrerObj.id;
        finalReferrerName = `${referrerObj.name} (${referrerObj.company})`;
        finalSource = `Recommandé par ${referrerObj.name} (Client / Entreprise)`;
        finalReferrerCategory = 'client_enterprise';
      } else {
        finalSource = 'Recommandation Entreprise';
        finalReferrerCategory = 'client_enterprise';
      }
    } else if (formAcquisitionMode === 'filmmaker') {
      const referrerObj = clients.find((c) => c.id === formReferrerId);
      if (referrerObj) {
        finalReferrerId = referrerObj.id;
        finalReferrerName = `${referrerObj.name} (${referrerObj.filmmakerRole || 'Filmmaker'})`;
        finalSource = `Recommandé par le Filmmaker ${referrerObj.name}`;
        finalReferrerCategory = 'filmmaker_peer';
      } else {
        finalReferrerId = null;
        finalReferrerName = formFriendName.trim() || 'Confrère Filmmaker';
        finalSource = `Recommandé par le Filmmaker ${finalReferrerName}`;
        finalReferrerCategory = 'filmmaker_peer';
      }
    } else if (formAcquisitionMode === 'friend') {
      finalReferrerId = null;
      finalReferrerName = formFriendName.trim() || 'Ami / Connaissance';
      finalSource = `Recommandé par ${finalReferrerName}`;
      finalReferrerCategory = 'friend';
    } else {
      finalReferrerId = null;
      finalReferrerName = null;
      finalSource = formSource || 'Direct / Réseau';
      finalReferrerCategory = 'direct';
    }

    const effectiveRoleType =
      formContactType === 'filmmaker_peer' ? 'Filmmaker' : formRoleType || 'Client';

    const saved: ClientData = {
      id: formId || `cli-${Date.now()}`,
      contactType: formContactType,
      filmmakerRole: formContactType === 'filmmaker_peer' ? formFilmmakerRole : undefined,
      name: formName,
      company: formCompany,
      photoUrl: formPhotoUrl,
      ice: formIce,
      email: formEmail,
      phone: formPhone,
      city: formCity,
      sector: formSector,
      roleType: effectiveRoleType,
      acquisitionSource: finalSource,
      referrerId: finalReferrerId,
      referrerName: finalReferrerName,
      referrerCategory: finalReferrerCategory,
      notes: formNotes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSaveClient(saved);
    setSelectedClientId(saved.id);
    setIsFormOpen(false);
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl shadow-xl shadow-black/20">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-1.5">
            <Share2 className="w-4 h-4" /> Module 3 • CRM Visuel & Cartographie Réseau
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Réseau & Apporteurs d'Affaires</h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Cartographiez vos recommandations clients, identifiez vos meilleurs apporteurs d'affaires et maximisez le bouche-à-oreille.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowSyncModal(true)}
            className="px-3.5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-xs rounded-xl border border-blue-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Smartphone className="w-4 h-4 text-blue-400" />
            <RefreshCw className="w-3 h-3 text-indigo-400" /> Sync Répertoire / Google
          </button>

          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" /> Templates WhatsApp / Email
          </button>

          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('network')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'network' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🕸️ Graphique Réseau
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              📋 Liste Clients
            </button>
          </div>

          <button
            onClick={handleOpenAddForm}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Nouveau Client
          </button>
        </div>
      </div>

      {/* Top Apporteurs d'Affaires & Catégories Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Apport par Filmmakers */}
        <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-500/30 p-4 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5" /> Apport Confrères Cinéastes
            </div>
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded-full border border-indigo-500/30">
              {totalFilmmakerReferralsCount} Recommandations
            </span>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-indigo-300">
            {totalFilmmakerRevenue.toLocaleString('fr-MA')} <span className="text-xs font-normal text-slate-400">MAD</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            CA généré grâce aux tournages & renvois par d'autres réalisateurs / cadreurs
          </p>
        </div>

        {/* Total Apport par Entreprises & Clients */}
        <div className="bg-gradient-to-br from-amber-950/80 to-slate-900 border border-amber-500/30 p-4 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> Apport Clients & Entreprises
            </div>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-500/30">
              {totalEnterpriseReferralsCount} Recommandations
            </span>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-amber-300">
            {totalEnterpriseRevenue.toLocaleString('fr-MA')} <span className="text-xs font-normal text-slate-400">MAD</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            CA généré par recommandation directe de vos clients fidèles & marques
          </p>
        </div>

        {/* Top 1 Apporteur Filmmaker */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-extrabold text-sm shrink-0">
            🎬 #1
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-extrabold uppercase text-indigo-400 tracking-wider">Top Filmmaker Partenaire</div>
            <h4 className="text-xs font-bold text-white truncate">
              {topFilmmakerReferrers[0]?.[1]?.name || 'Aucun cinéaste enregistré'}
            </h4>
            <div className="text-[11px] text-slate-400 mt-0.5">
              <span className="font-mono font-bold text-emerald-400">
                +{topFilmmakerReferrers[0]?.[1]?.totalRevenue.toLocaleString('fr-MA') || 0} MAD
              </span>
            </div>
          </div>
        </div>

        {/* Top 1 Apporteur Entreprise */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-extrabold text-sm shrink-0">
            🏢 #1
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-extrabold uppercase text-amber-400 tracking-wider">Top Entreprise Cliente</div>
            <h4 className="text-xs font-bold text-white truncate">
              {topEnterpriseReferrers[0]?.[1]?.name || 'Aucun client apporteur'}
            </h4>
            <div className="text-[11px] text-slate-400 mt-0.5">
              <span className="font-mono font-bold text-emerald-400">
                +{topEnterpriseReferrers[0]?.[1]?.totalRevenue.toLocaleString('fr-MA') || 0} MAD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Network View Mode */}
      {viewMode === 'network' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Network Graph Canvas */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 min-h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-amber-400" /> Schéma Interactif de Recommandation & Networking
                </h3>
                <span className="text-xs text-slate-400">
                  Distinguez le flux d'affaires entre Confrères Cinéastes et Entreprises / Marques
                </span>
              </div>

              {/* Network Category Filter Buttons */}
              <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setNetworkFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    networkFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tous ({clients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNetworkFilter('enterprise')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    networkFilter === 'enterprise'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building className="w-3 h-3" /> Entreprises ({clients.filter((c) => !isFilmmakerContact(c)).length})
                </button>
                <button
                  type="button"
                  onClick={() => setNetworkFilter('filmmaker')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    networkFilter === 'filmmaker'
                      ? 'bg-indigo-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3 h-3" /> Filmmakers ({clients.filter((c) => isFilmmakerContact(c)).length})
                </button>
                <button
                  type="button"
                  onClick={() => setNetworkFilter('top_referrers')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    networkFilter === 'top_referrers'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Award className="w-3 h-3" /> Apporteurs ({allReferrers.length})
                </button>
              </div>
            </div>

            {/* Visual Node Diagram */}
            <div className="relative bg-slate-950 rounded-xl p-6 border border-slate-800/80 min-h-[420px] flex flex-col justify-center">
              {/* Center Hub Node */}
              <div className="flex justify-center mb-8">
                <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black px-6 py-3 rounded-2xl shadow-xl shadow-amber-500/20 border border-amber-300 text-center flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center text-slate-950">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-widest text-slate-900 font-extrabold">Hub Central Studio</div>
                    <div className="text-sm font-black tracking-tight">TAHA HAFSI • CINÉSTUDIO MAROC</div>
                    <div className="text-[10px] text-slate-800 font-semibold flex items-center gap-1 mt-0.5">
                      <span>🎬 Réalisateur &amp; Cadreur FPV</span> • <span>Casablanca</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Network Tree with Category Splitting */}
              {clients.length === 0 ? (
                <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-3">
                  <Users className="w-10 h-10 text-amber-400 mx-auto opacity-75" />
                  <h4 className="text-sm font-bold text-white">Aucun contact enregistré dans le réseau</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Ajoutez vos clients, marques ou confrères cinéastes pour cartographier votre réseau de recommandations et vos flux d'affaires.
                  </p>
                  <button
                    onClick={handleOpenAddForm}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" /> Ajouter un Nouveau Contact
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {clients
                    .filter((client) => {
                      if (networkFilter === 'enterprise') return !isFilmmakerContact(client);
                      if (networkFilter === 'filmmaker') return isFilmmakerContact(client);
                      if (networkFilter === 'top_referrers') {
                        return allReferrers.some(([refId]) => refId === client.id) || !!client.referrerId;
                      }
                      return true;
                    })
                    .map((client) => {
                      const rev = getClientRevenue(client.id);
                      const isSelected = selectedClientId === client.id;
                      const isFilmmaker = isFilmmakerContact(client);
                      const referrer = clients.find((c) => c.id === client.referrerId);
                      const isReferrerFilmmaker = referrer ? isFilmmakerContact(referrer) : client.referrerCategory === 'filmmaker_peer';

                      return (
                        <div
                          key={client.id}
                          onClick={() => setSelectedClientId(client.id)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                            isSelected
                              ? isFilmmaker
                                ? 'bg-indigo-950/40 border-indigo-500 shadow-xl ring-2 ring-indigo-500/40'
                                : 'bg-amber-500/10 border-amber-500 shadow-xl ring-2 ring-amber-500/30'
                              : isFilmmaker
                              ? 'bg-slate-900/90 border-indigo-900/50 hover:border-indigo-700/80 hover:bg-indigo-950/20'
                              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          {/* Connection Tag Indicator */}
                          {client.referrerId || client.referrerName ? (
                            <div
                              className={`absolute -top-3 left-3 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border shadow-sm ${
                                isReferrerFilmmaker
                                  ? 'bg-indigo-900/80 text-indigo-200 border-indigo-500/50'
                                  : 'bg-amber-900/80 text-amber-200 border-amber-500/50'
                              }`}
                            >
                              <Share2 className="w-2.5 h-2.5" />
                              {isReferrerFilmmaker ? '🎬 Par Filmmaker :' : '🏢 Par Client :'}{' '}
                              <span className="truncate max-w-[100px]">
                                {referrer ? referrer.name : client.referrerName}
                              </span>
                            </div>
                          ) : null}

                          {/* Contact Type Tag */}
                          <div className="flex items-center justify-between mb-2">
                            {isFilmmaker ? (
                              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-extrabold rounded-md flex items-center gap-1">
                                <Film className="w-2.5 h-2.5" /> {client.filmmakerRole || 'Cinéaste / Filmmaker'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-extrabold rounded-md flex items-center gap-1">
                                <Building className="w-2.5 h-2.5" /> Client Entreprise
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-semibold">{client.city}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <img
                              src={client.photoUrl || PRESET_AVATARS[0]}
                              alt={client.name}
                              className={`w-11 h-11 rounded-xl object-cover border ${
                                isFilmmaker ? 'border-indigo-500/50' : 'border-slate-700'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{client.name}</h4>
                              <p className={`text-[11px] font-semibold truncate ${isFilmmaker ? 'text-indigo-300' : 'text-amber-400'}`}>
                                {client.company || (isFilmmaker ? 'Indépendant / Freelance' : 'Entreprise')}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                {isFilmmaker ? `Binôme Technique (${client.filmmakerRole || 'Cinéaste'})` : client.sector}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">CA Réalisé :</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {rev.toLocaleString('fr-MA')} MAD
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Selected Contact Details Panel */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            {selectedClient ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-1.5">
                    {isFilmmakerContact(selectedClient) ? (
                      <Film className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Building className="w-4 h-4 text-amber-400" />
                    )}
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      {isFilmmakerContact(selectedClient) ? 'Fiche Confrère Cinéaste' : 'Fiche Client Entreprise'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditForm(selectedClient)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Éditer
                    </button>
                    <button
                      onClick={() => handleDeleteClientWithConfirm(selectedClient.id)}
                      className="p-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Supprimer ce contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <img
                    src={selectedClient.photoUrl || PRESET_AVATARS[0]}
                    alt={selectedClient.name}
                    className={`w-20 h-20 rounded-2xl object-cover mx-auto border-2 shadow-lg ${
                      isFilmmakerContact(selectedClient) ? 'border-indigo-500/60' : 'border-amber-500/40'
                    }`}
                  />
                  <div>
                    <h3 className="text-lg font-black text-white">{selectedClient.name}</h3>
                    <p className={`text-xs font-bold ${isFilmmakerContact(selectedClient) ? 'text-indigo-300' : 'text-amber-400'}`}>
                      {selectedClient.company || (isFilmmakerContact(selectedClient) ? 'Cinéaste Freelance' : 'Entreprise')}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1.5">
                      {isFilmmakerContact(selectedClient) ? (
                        <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                          <Film className="w-3 h-3" /> {selectedClient.filmmakerRole || 'Cinéaste / Filmmaker'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                          <Building className="w-3 h-3" /> {selectedClient.roleType || 'Client'}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-full">
                        {selectedClient.sector} • {selectedClient.city}
                      </span>
                    </div>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div className="pt-2 flex items-center justify-center gap-2">
                    {selectedClient.phone && (
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(selectedClient.phone, selectedClient.name)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 fill-white" /> WhatsApp Direct
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2 text-xs">
                  {isFilmmakerContact(selectedClient) ? (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Spécialité Cinéma / Vidéo :</span>
                      <span className="font-bold text-indigo-300">{selectedClient.filmmakerRole || 'Réalisateur'}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-slate-400">ICE Entreprise :</span>
                      <span className="font-mono font-bold text-slate-200">{selectedClient.ice || 'Non renseigné'}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email :</span>
                    <span className="text-slate-200 underline">{selectedClient.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Téléphone :</span>
                    <span className="text-slate-200">{selectedClient.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Origine d'Acquisition :</span>
                    <span className="text-amber-300 font-bold">{selectedClient.acquisitionSource}</span>
                  </div>
                  {selectedClient.referrerName && (
                    <div className="flex justify-between border-t border-slate-800 pt-2">
                      <span className="text-slate-400">Recommandé par :</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        {selectedClient.referrerCategory === 'filmmaker_peer' ? '🎬' : '🏢'} {selectedClient.referrerName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Revenue stats for this client */}
                <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 p-4 rounded-xl space-y-3">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-400">Valeur Totale Générée (LTV Réel)</span>
                    <div className="text-2xl font-black font-mono text-emerald-400">
                      {getClientRevenue(selectedClient.id).toLocaleString('fr-MA')} MAD
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400">Factures & Devis</div>
                      <div className="font-mono font-bold text-slate-200">
                        {getClientDocRevenue(selectedClient.id).toLocaleString('fr-MA')} MAD
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-emerald-500/20 text-center">
                      <div className="text-[10px] text-emerald-400 font-bold">Sans Papier / Forfaits</div>
                      <div className="font-mono font-bold text-emerald-300">
                        {getClientDirectRevenue(selectedClient.id).toLocaleString('fr-MA')} MAD
                      </div>
                    </div>
                  </div>

                  {/* Button to add direct revenue / retainer for this client */}
                  <button
                    type="button"
                    onClick={() => handleOpenQuickDirectModal(selectedClient)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Forfait / Mission Directe Sans Papier
                  </button>
                </div>

                {/* Client's Direct & Recurring Revenues List */}
                {(() => {
                  const clientDirects = directRevenues.filter(
                    (r) =>
                      r.clientId === selectedClient.id ||
                      (selectedClient && r.clientName && r.clientName.toLowerCase() === selectedClient.name.toLowerCase()) ||
                      (selectedClient && selectedClient.company && r.clientCompany && r.clientCompany.toLowerCase() === selectedClient.company.toLowerCase())
                  );

                  if (clientDirects.length === 0) return null;

                  return (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span className="flex items-center gap-1">
                          <Repeat className="w-3.5 h-3.5 text-emerald-400" /> Forfaits & Missions Directes ({clientDirects.length})
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {clientDirects.map((dr) => (
                          <div
                            key={dr.id}
                            className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-white truncate">{dr.title}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                <span className="text-emerald-400 font-semibold">
                                  {dr.frequency === 'weekly' ? 'Hebdo' : dr.frequency === 'monthly' ? 'Mensuel' : 'Ponctuel'}
                                </span>
                                <span>× {dr.occurrencesCount || 1}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-mono font-black text-amber-400 text-xs">
                                {(dr.amountMAD * (dr.occurrencesCount || 1)).toLocaleString('fr-MA')} MAD
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditQuickDirectModal(dr)}
                                className="text-slate-400 hover:text-amber-400 p-1 hover:bg-slate-800 rounded transition-colors"
                                title="Modifier ce forfait"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteDirectRevenue && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Supprimer "${dr.title}" ?`)) {
                                      onDeleteDirectRevenue(dr.id);
                                    }
                                  }}
                                  className="text-slate-400 hover:text-rose-400 p-1 hover:bg-slate-800 rounded transition-colors"
                                  title="Supprimer ce forfait"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {selectedClient.notes && (
                  <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 italic">
                    "{selectedClient.notes}"
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-500 text-xs py-8">
                Sélectionnez un client pour afficher ses détails.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View Mode */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer la liste par nom, ville, secteur..."
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Contact & Profil</th>
                  <th className="py-3 px-4 font-bold">Type & Rôle</th>
                  <th className="py-3 px-4 font-bold">Structure / ICE</th>
                  <th className="py-3 px-4 font-bold">Ville</th>
                  <th className="py-3 px-4 font-bold">Apporteur / Recommandation</th>
                  <th className="py-3 px-4 font-bold text-right">CA Réalisé (MAD)</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredClients.map((client) => {
                  const rev = getClientRevenue(client.id);
                  const isFilmmaker = isFilmmakerContact(client);
                  const isReferrerFilmmaker = client.referrerCategory === 'filmmaker_peer';

                  return (
                    <tr key={client.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold flex items-center gap-3">
                        <img
                          src={client.photoUrl || PRESET_AVATARS[0]}
                          alt={client.name}
                          className={`w-9 h-9 rounded-xl object-cover border ${
                            isFilmmaker ? 'border-indigo-500/60' : 'border-slate-700'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-white">{client.name}</span>
                            {isFilmmaker && (
                              <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 text-[9px] font-bold rounded">
                                🎬 Pro
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">{client.email || client.phone || 'Sans email'}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {isFilmmaker ? (
                          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <Film className="w-2.5 h-2.5" /> {client.filmmakerRole || 'Cinéaste / Filmmaker'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <Building className="w-2.5 h-2.5" /> Client Entreprise
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">{client.sector}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{client.company || (isFilmmaker ? 'Indépendant / Freelance' : 'N/A')}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {isFilmmaker ? 'Partenaire Créatif' : `ICE: ${client.ice || 'Non renseigné'}`}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{client.city}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-semibold text-xs">
                          {client.referrerName ? (
                            <span className={isReferrerFilmmaker ? 'text-indigo-300 flex items-center gap-1' : 'text-emerald-400 flex items-center gap-1'}>
                              {isReferrerFilmmaker ? <Film className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                              {client.referrerName}
                            </span>
                          ) : (
                            <span className="text-slate-400">{client.acquisitionSource}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {rev.toLocaleString('fr-MA')} MAD
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditForm(client)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                            title="Modifier ce profil"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteClient(client.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                            title="Supprimer ce contact"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Client & Filmmaker Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveForm}
            className="bg-slate-900 border border-slate-800 max-w-xl w-full p-6 rounded-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />{' '}
                {formId ? 'Édition du Contact / Profil Réseau' : 'Ajouter un Contact au Réseau'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type de Contact Selector (Filmmaker vs Enterprise vs Partner) */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-slate-300 font-bold text-xs">
                Type de Contact dans votre Réseau :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormContactType('client_enterprise');
                    setFormSector('Marque & Entreprise');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                    formContactType === 'client_enterprise'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-extrabold text-white">Client / Entreprise</div>
                    <div className="text-[10px] text-slate-400 font-normal">Société, marque, agence cliente</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormContactType('filmmaker_peer');
                    setFormSector('Cinéma & TV');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                    formContactType === 'filmmaker_peer'
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Film className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <div className="font-extrabold text-white">Confrère Cinéaste / Filmmaker</div>
                    <div className="text-[10px] text-slate-400 font-normal">Réalisateur, cadreur, apporteur</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nom & Prénom</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={formContactType === 'filmmaker_peer' ? 'Ex: Mehdi (Chef Opérateur)' : 'Ex: Youssef El Amrani'}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
                  required
                />
              </div>

              {formContactType === 'filmmaker_peer' ? (
                <div>
                  <label className="block text-indigo-400 font-bold mb-1 flex items-center gap-1">
                    <Film className="w-3.5 h-3.5" /> Spécialité / Métier du Filmmaker
                  </label>
                  <select
                    value={formFilmmakerRole}
                    onChange={(e) => setFormFilmmakerRole(e.target.value as ClientData['filmmakerRole'])}
                    className="w-full bg-slate-950 border border-indigo-500/60 text-indigo-200 font-bold p-2.5 rounded-xl"
                  >
                    <option value="Réalisateur">🎬 Réalisateur / Metteur en scène</option>
                    <option value="Cadreur / Chef Op">🎥 Cadreur / Chef Opérateur / DP</option>
                    <option value="Droniste FPV">🚁 Droniste FPV / Aérien</option>
                    <option value="Monteur / Étalonneur">💻 Monteur / Étalonneur DaVinci</option>
                    <option value="Producteur">💼 Producteur / Directeur de Production</option>
                    <option value="Ingénieur Son">🎙️ Ingénieur Son / Sound Designer</option>
                    <option value="Autre Créatif">✨ Autre Créatif / Motion Designer</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nom de l'Entreprise / Marque</label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="Ex: Pulse Media Agence, Marjane..."
                    className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
                    required
                  />
                </div>
              )}

              {formContactType === 'client_enterprise' ? (
                <div>
                  <label className="block text-amber-400 font-bold mb-1">ICE Entreprise (Norme Maroc)</label>
                  <input
                    type="text"
                    value={formIce}
                    onChange={(e) => setFormIce(e.target.value)}
                    placeholder="Ex: 002984123000088"
                    className="w-full bg-slate-950 border border-slate-800 text-amber-300 font-mono font-bold p-2.5 rounded-xl"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Structure / Collectif (Optionnel)</label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="Ex: Freelance, Studio Atlas, Collectif 212..."
                    className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-bold mb-1">Ville</label>
                <select
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
                >
                  <option value="Casablanca">Casablanca</option>
                  <option value="Rabat">Rabat</option>
                  <option value="Marrakech">Marrakech</option>
                  <option value="Tanger">Tanger</option>
                  <option value="Agadir">Agadir</option>
                  <option value="Autre">Autre Ville</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Secteur / Univers</label>
                <select
                  value={formSector}
                  onChange={(e) => setFormSector(e.target.value as ClientData['sector'])}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
                >
                  <option value="Agence Pub">Agence Pub & Digital</option>
                  <option value="Marque & Entreprise">Marque / Entreprise Privée</option>
                  <option value="Événementiel">Événementiel</option>
                  <option value="Institutionnel">Institutionnel / État</option>
                  <option value="Cinéma & TV">Cinéma & TV / Production</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Téléphone / WhatsApp</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="06XXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
                />
              </div>

              {/* Acquisition Origin & Referral Section */}
              <div className="sm:col-span-2 bg-slate-950 p-4 border border-amber-500/30 rounded-xl space-y-3">
                <div>
                  <label className="block text-amber-400 font-bold text-xs mb-1.5 flex items-center justify-between">
                    <span>Origine d'Acquisition &amp; Recommandation</span>
                    <span className="text-[11px] text-slate-400 font-normal">Comment ce contact est-il arrivé ?</span>
                  </label>

                  {/* Mode selector pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormAcquisitionMode('filmmaker');
                        const fmk = clients.find((c) => isFilmmakerContact(c) && c.id !== formId);
                        if (fmk) setFormReferrerId(fmk.id);
                      }}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-1 cursor-pointer ${
                        formAcquisitionMode === 'filmmaker'
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Film className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <div className="font-extrabold text-[11px]">Un Confrère Filmmaker</div>
                        <div className="text-[9px] text-slate-400 font-normal">Renvoi / sous-traitance</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormAcquisitionMode('client');
                        const ent = clients.find((c) => !isFilmmakerContact(c) && c.id !== formId);
                        if (ent) setFormReferrerId(ent.id);
                      }}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-1 cursor-pointer ${
                        formAcquisitionMode === 'client'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Building className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-extrabold text-[11px]">Un Client / Entreprise</div>
                        <div className="text-[9px] text-slate-400 font-normal">Bouche-à-oreille client</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormAcquisitionMode('friend')}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-1 cursor-pointer ${
                        formAcquisitionMode === 'friend'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-extrabold text-[11px]">Un Ami / Connaissance</div>
                        <div className="text-[9px] text-slate-400 font-normal">Réseau personnel</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormAcquisitionMode('direct')}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-1 cursor-pointer ${
                        formAcquisitionMode === 'direct'
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <div className="font-extrabold text-[11px]">Canal Direct</div>
                        <div className="text-[9px] text-slate-400 font-normal">Instagram, Tournage...</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Sub-inputs depending on mode */}
                {formAcquisitionMode === 'filmmaker' && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <label className="block text-indigo-300 text-xs font-bold flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5" /> Sélectionner le Confrère Filmmaker Recommandeur :
                    </label>
                    <select
                      value={formReferrerId}
                      onChange={(e) => setFormReferrerId(e.target.value)}
                      className="w-full bg-slate-900 border border-indigo-500/60 text-indigo-200 font-bold p-2.5 rounded-xl text-xs"
                    >
                      <option value="">-- Choisir un cinéaste dans le répertoire ou saisir un nom ci-dessous --</option>
                      {clients
                        .filter((c) => isFilmmakerContact(c) && c.id !== formId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            🎬 {c.name} ({c.filmmakerRole || 'Cinéaste'}) — {c.city}
                          </option>
                        ))}
                    </select>

                    <div>
                      <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                        Ou saisir le nom du Cinéaste / Cadreur (s'il n'est pas encore dans la liste) :
                      </label>
                      <input
                        type="text"
                        value={formFriendName}
                        onChange={(e) => setFormFriendName(e.target.value)}
                        placeholder="Ex: Yassine (Réalisateur Pub), Mehdi (Cadreur FPV)..."
                        className="w-full bg-slate-900 border border-indigo-500/40 text-indigo-200 font-medium p-2.5 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                )}

                {formAcquisitionMode === 'client' && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <label className="block text-amber-300 text-xs font-bold flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" /> Sélectionner le Client / Entreprise Recommandeur :
                    </label>
                    <select
                      value={formReferrerId}
                      onChange={(e) => setFormReferrerId(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-500/60 text-amber-300 font-bold p-2.5 rounded-xl text-xs"
                    >
                      <option value="">-- Choisir un client dans la liste --</option>
                      {clients
                        .filter((c) => !isFilmmakerContact(c) && c.id !== formId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            🏢 {c.name} — {c.company} ({c.sector})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {formAcquisitionMode === 'friend' && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <label className="block text-emerald-300 text-xs font-bold">
                      Nom de l'Ami / Contact qui vous a recommandé :
                    </label>
                    <input
                      type="text"
                      value={formFriendName}
                      onChange={(e) => setFormFriendName(e.target.value)}
                      placeholder="Ex: Youssef (Ami d'enfance), Karim..."
                      className="w-full bg-slate-900 border border-emerald-500/60 text-emerald-200 font-medium p-2.5 rounded-xl text-xs"
                    />
                  </div>
                )}

                {formAcquisitionMode === 'direct' && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <label className="block text-blue-300 text-xs font-bold">Canal Direct :</label>
                    <select
                      value={formSource}
                      onChange={(e) => setFormSource(e.target.value)}
                      className="w-full bg-slate-900 border border-blue-500/50 text-blue-300 font-bold p-2.5 rounded-xl text-xs"
                    >
                      <option value="Direct Instagram">Instagram / Réseaux Sociaux</option>
                      <option value="Site Web Portfolio">Site Web / Portfolio Studio</option>
                      <option value="Événement Screen Night">Salon / Festival / Événement Pro</option>
                      <option value="Tournage / Sur le Plateau">Rencontre sur Plateau de Tournage</option>
                      <option value="Prospection Directe">Prospection Commerciale / Cold Email</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="contact@domaine.ma"
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Notes &amp; Contexte</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder={formContactType === 'filmmaker_peer' ? 'Ex: Prêt matériel FX6, collab tournage pub...' : 'Ex: Rencontré au Salon de l\'Auto...'}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-400 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Enregistrer la Fiche
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WhatsApp & Email Presets Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full p-6 rounded-2xl shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                Modèles de Messages Pro (Clients & Confrères Cinéastes)
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Copiez en 1 clic vos messages pour pitcher des entreprises, remercier un confrère cinéaste pour un renvoi ou proposer une collaboration technique.
            </p>

            <div className="space-y-4 pt-2">
              {[
                {
                  id: 'filmmaker-referral-thanks',
                  title: '🎬 Remerciement & Commission Apporteur Filmmaker',
                  subtitle: 'Pour un confrère réalisateur / cadreur qui vous a renvoyé un tournage',
                  text: `Salam [Nom du Confrère] 🎬👋\n\nJe voulais te remercier chaleureusement pour m'avoir mis en relation avec le client [Nom Client/Marque]. Le tournage s'est super bien passé et le contrat a été validé à [Montant] MAD !\n\nComme convenu pour ton apport d'affaires, je te prépare ta commission / rétrocession de 10% (soit [Commission] MAD). Dis-moi sur quel RIB ou Cash Plus tu préfères que je te l'envoie.\n\nÀ charge de revanche pour tes prochains tournages, frérot ! 👊`,
                },
                {
                  id: 'filmmaker-collab-pitch',
                  title: '🎥 Proposition de Co-Tournage / Renfort Technique',
                  subtitle: 'Pour s\'associer avec un autre cinéaste sur un gros projet publicitaire',
                  text: `Salam [Nom du Filmmaker] 👋\n\nJ'espère que tu vas bien et que les tournages tournent à plein régime.\n\nJ'ai un gros projet de film publicitaire / institutionnel qui rentre pour fin de mois sur [Ville] avec de belles exigences visuelles. Je cherche un bon profil pour m'épauler sur le cadrage / drone FPV / 2ème caméra (Setup FX6 / Sony Cinema Line).\n\nEs-tu disponible pour qu'on se cale un call rapide de 5 min ou un café pour que je te pitche le brief et la rémunération ?\n\nÀ très vite ! Taha Hafsi`,
                },
                {
                  id: 'pitch',
                  title: '📩 Pitch Portfolio & Proposition de Tournage Entreprise',
                  subtitle: 'Idéal pour démarcher une agence de com ou un responsable marketing',
                  text: `Bonjour [Nom du Contact] 👋\n\nJ'espère que vous allez bien.\n\nJe suis Taha Hafsi, Filmmaker & Réalisateur Vidéo basé à Casablanca. J'ai découvert les récentes campagnes de [Nom Entreprise] et j'admire beaucoup votre positionnement.\n\nNous accompagnons les marques dans la production de spots publicitaires 4K et de contenus réseaux sociaux à fort impact visuel (Caméras Cinéma FX6/RED, Drone FPV, Étalonnage DaVinci).\n\nDécouvrez nos récentes réalisations ici : https://portfolio-filmmaker.ma\n\nSeriez-vous disponible cette semaine pour un court échange de 10 min ou un café sur Casablanca ?\n\nExcellente journée,\nTaha Hafsi • CinéStudio`,
                },
                {
                  id: 'relance-devis',
                  title: '📄 Suivi & Relance de Devis (Brief & Bon pour Accord)',
                  subtitle: 'À envoyer 3 jours après l\'envoi d\'une proposition commerciale',
                  text: `Bonjour [Nom du Client] 👋\n\nUn petit message pour m'assurer que vous avez bien pu prendre connaissance du devis [N° Devis] transmis la semaine dernière pour le projet [Nom Projet].\n\nLe planning de tournage pour le mois prochain est en train de se finaliser avec nos équipes techniques. Avez-vous eu l'occasion d'en discuter avec la direction ?\n\nJe reste à votre entière disposition si vous souhaitez ajuster certains éléments ou options matériel.\n\nBien cordialement,\nTaha Hafsi`,
                },
                {
                  id: 'relance-facture-7d',
                  title: '💳 Relance Amicale Facture Échue (J+7)',
                  subtitle: 'Rappel courtois pour versement d\'acompte ou solde',
                  text: `Bonjour [Nom du Client] 👋\n\nJ'espère que tout se passe bien de votre côté.\n\nJe me permets de vous rappeler que la facture [N° Facture] d'un montant de [Montant] MAD relative à la prestation [Nom Projet] est arrivée à échéance le [Date].\n\nSauf erreur ou virement en cours, je vous réitère notre RIB Attijariwafa Bank ci-dessous pour règlement :\nRIB: 007 780 0001234567890123 45\n\nMerci d'avance pour le retour et votre confiance !\nBien à vous, Taha Hafsi`,
                },
              ].map((tmpl) => (
                <div key={tmpl.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-amber-300">{tmpl.title}</h4>
                      <p className="text-[10px] text-slate-500">{tmpl.subtitle}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(tmpl.text);
                        setCopiedTemplate(tmpl.id);
                        setTimeout(() => setCopiedTemplate(null), 2000);
                      }}
                      className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-bold text-[10px] uppercase rounded-lg border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedTemplate === tmpl.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedTemplate === tmpl.id ? 'Copié !' : 'Copier'}
                    </button>
                  </div>

                  <pre className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 whitespace-pre-wrap leading-relaxed">
                    {tmpl.text}
                  </pre>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-5 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Phone Numbers & Google Contacts Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full p-6 rounded-2xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Synchroniser avec le Répertoire du Téléphone</h3>
                  <p className="text-[11px] text-slate-400">
                    Importez les numéros de téléphone enregistrés sur votre smartphone ou compte Google.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  setImportedContacts([]);
                  setSyncStatusMsg('');
                  setSyncError('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sync Method Selection Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleNativeContactPicker}
                disabled={isSyncing}
                className="p-4 bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/50 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs mb-1">
                  <Smartphone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Répertoire Téléphone
                </div>
                <p className="text-[10px] text-slate-400">
                  Sélectionnez directement les numéros sur votre smartphone Android / Chrome Mobile.
                </p>
              </button>

              <button
                onClick={handleGoogleContactsSync}
                disabled={isSyncing}
                className="p-4 bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1">
                  <Cloud className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Google Contacts
                </div>
                <p className="text-[10px] text-slate-400">
                  Synchronisez tous vos contacts enregistrés sur votre compte Google.
                </p>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSyncing}
                className="p-4 bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                  <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Fichier vCard (.vcf)
                </div>
                <p className="text-[10px] text-slate-400">
                  Importez une sauvegarde de contacts exportée depuis votre téléphone.
                </p>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".vcf,text/vcard"
                onChange={handleVcfFileUpload}
                className="hidden"
              />
            </div>

            {/* Status & Loader */}
            {isSyncing && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-3 text-xs text-blue-300">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400 shrink-0" />
                <span>{syncStatusMsg || 'Synchronisation en cours...'}</span>
              </div>
            )}

            {syncError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                ⚠️ {syncError}
              </div>
            )}

            {syncStatusMsg && !isSyncing && !syncError && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{syncStatusMsg}</span>
              </div>
            )}

            {/* Contacts Preview & Selection Table */}
            {importedContacts.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">
                    Contacts prêts à être synchronisés ({selectedContactIndices.length}/{importedContacts.length})
                  </h4>
                  <button
                    onClick={() => {
                      if (selectedContactIndices.length === importedContacts.length) {
                        setSelectedContactIndices([]);
                      } else {
                        setSelectedContactIndices(importedContacts.map((_, i) => i));
                      }
                    }}
                    className="text-[11px] text-amber-400 hover:underline font-bold"
                  >
                    {selectedContactIndices.length === importedContacts.length ? 'Tout décocher' : 'Tout cocher'}
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800/80 bg-slate-950">
                  {importedContacts.map((c, idx) => {
                    const isChecked = selectedContactIndices.includes(idx);
                    const matchingClient = clients.find(
                      (cli) =>
                        (c.phone && cli.phone && cli.phone.replace(/\s+/g, '') === c.phone.replace(/\s+/g, '')) ||
                        (c.name && cli.name.toLowerCase() === c.name.toLowerCase())
                    );

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedContactIndices(selectedContactIndices.filter((i) => i !== idx));
                          } else {
                            setSelectedContactIndices([...selectedContactIndices, idx]);
                          }
                        }}
                        className={`p-3 text-xs flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-colors ${
                          isChecked ? 'bg-slate-900/40' : 'opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Handled by div click
                            className="w-4 h-4 accent-amber-500 rounded"
                          />
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              {c.name}
                              {matchingClient && (
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded-full border border-emerald-500/30">
                                  Existe dans CRM
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-3 mt-0.5">
                              {c.phone && <span className="text-amber-300 font-mono">📞 {c.phone}</span>}
                              {c.email && <span className="text-slate-400">✉️ {c.email}</span>}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-500">{c.company || 'Répertoire'}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setShowSyncModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmImportContacts}
                    disabled={selectedContactIndices.length === 0}
                    className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    Enregistrer {selectedContactIndices.length} contact(s) dans le CRM
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Direct Revenue Modal */}
      {isQuickDirectModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-emerald-400" />
                  {editingDirectId ? 'Modifier Forfait / Revenu Direct' : 'Ajouter Forfait / Revenu Direct'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Client : <span className="text-amber-400 font-bold">{selectedClient.name}</span> ({selectedClient.company})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickDirectModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickDirectRevenue} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Titre de la prestation / Forfait</label>
                <input
                  type="text"
                  required
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Ex: Forfait Vidéos Reels / Pack Contenu Mensuel"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Catégorie</label>
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value as DirectRevenueCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Gestion Réseaux / Reels">Gestion Réseaux / Reels</option>
                    <option value="Tournage Direct">Tournage Direct</option>
                    <option value="Montage Vidéo">Montage Vidéo</option>
                    <option value="Conseil / DA">Conseil / DA</option>
                    <option value="Prestation Mensuelle">Prestation Mensuelle</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Fréquence</label>
                  <select
                    value={quickFrequency}
                    onChange={(e) => setQuickFrequency(e.target.value as DirectRevenueFrequency)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-bold text-amber-400"
                  >
                    <option value="weekly">Hebdomadaire (par semaine)</option>
                    <option value="monthly">Mensuel (par mois)</option>
                    <option value="one_time">Ponctuel (mission unique)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Montant unitaire (MAD)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={quickAmountMAD}
                    onChange={(e) => setQuickAmountMAD(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    {quickFrequency === 'weekly' ? 'Nombre de semaines' : quickFrequency === 'monthly' ? 'Nombre de mois' : 'Quantité'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quickOccurrences}
                    onChange={(e) => setQuickOccurrences(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <span className="text-slate-400">Total calculé pour ce client :</span>
                <span className="font-mono text-base font-black text-emerald-400">
                  {(quickAmountMAD * quickOccurrences).toLocaleString('fr-MA')} MAD
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Moyen de paiement</label>
                  <select
                    value={quickPaymentMethod}
                    onChange={(e) => setQuickPaymentMethod(e.target.value as DirectPaymentMethod)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="virement">Virement bancaire</option>
                    <option value="especes">Espèces</option>
                    <option value="cheque">Chèque</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Statut d'encaissement</label>
                  <select
                    value={quickStatus}
                    onChange={(e) => setQuickStatus(e.target.value as 'paye' | 'en_attente')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-bold"
                  >
                    <option value="paye">✅ Payé / Encaissé</option>
                    <option value="en_attente">⏳ En attente de règlement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Notes & Détails informels (optionnel)</label>
                <input
                  type="text"
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  placeholder="Ex: 4 vidéos Reels livrées par semaine, paiement chaque vendredi"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
                {editingDirectId ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Voulez-vous supprimer ce forfait ?`)) {
                        if (onDeleteDirectRevenue) {
                          onDeleteDirectRevenue(editingDirectId);
                        }
                        setIsQuickDirectModalOpen(false);
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer ce forfait
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsQuickDirectModalOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 cursor-pointer text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black rounded-xl hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-600/20 cursor-pointer text-xs flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {editingDirectId ? 'Mettre à jour le forfait' : 'Enregistrer le forfait'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mail,
  Copy,
  Search,
  ExternalLink,
  Edit,
  Sparkles,
  DollarSign,
  ShieldCheck,
  Building,
  Calendar,
  Send,
  Eye,
  X,
  ChevronRight,
  FileCheck,
  Tag,
  Download,
  RotateCcw
} from 'lucide-react';
import { DocumentData, DocumentItem, DocumentType, DocumentStatus, ClientData, ProfileInfo } from '../types';
import { DocumentPreview } from './DocumentPreview';

interface DocumentGeneratorModuleProps {
  documents: DocumentData[];
  clients: ClientData[];
  profile: ProfileInfo;
  onSaveDocument: (doc: DocumentData) => void;
  onDeleteDocument: (docId: string) => void;
  onSelectClient?: (clientId: string) => void;
}

const PRESET_SERVICES = [
  { description: 'Tournage Spot Publicitaire 4K (Cadrage Sony FX6 / RED V-Raptor)', price: 6500 },
  { description: 'Direction de la Photographie & Chef Opérateur (Journée)', price: 7500 },
  { description: 'Montage Vidéo & Étalonnage Cinématographique DaVinci Resolve', price: 8000 },
  { description: 'Prises de vue Aériennes Drone FPV & 4K (Pilote certifié DGC)', price: 4500 },
  { description: 'Prestation Ingénieur du Son + Kit Micro HF & Boom', price: 3000 },
  { description: 'Location Kit Éclairage Studio & Projecteurs Aputure 600d', price: 3500 },
  { description: 'Sound Design, Mixage Audio & Musique Libre de Droits', price: 2500 },
  { description: 'Acompte de 40 % pour tournage et pré-production', price: 10000 },
];

export const DocumentGeneratorModule: React.FC<DocumentGeneratorModuleProps> = ({
  documents,
  clients,
  profile,
  onSaveDocument,
  onDeleteDocument,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(documents[0]?.id || null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'checklist' | 'edit'>('preview');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);

  const selectedDocument = documents.find((d) => d.id === selectedDocId) || documents[0];

  // Form State for creating/editing
  const [formType, setFormType] = useState<DocumentType>('DEVIS');
  const [formNumber, setFormNumber] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [formShootingDate, setFormShootingDate] = useState<string>('');
  const [showTrashOnly, setShowTrashOnly] = useState<boolean>(false);
  const [formClientId, setFormClientId] = useState<string>('');
  const [formClientName, setFormClientName] = useState<string>('');
  const [formClientCompany, setFormClientCompany] = useState<string>('');
  const [formClientIce, setFormClientIce] = useState<string>('');
  const [formClientAddress, setFormClientAddress] = useState<string>('');
  const [formItems, setFormItems] = useState<DocumentItem[]>([
    { id: 'i-1', description: 'Tournage Vidéo 4K - Journée', quantity: 1, unitPrice: 6500 },
  ]);
  const [formTvaRate, setFormTvaRate] = useState<number>(20);
  const [formAcompteRate, setFormAcompteRate] = useState<number>(30);
  const [formNotes, setFormNotes] = useState<string>('');

  // Move document to trash or restore/delete
  const handleMoveToTrash = (doc: DocumentData) => {
    const updated: DocumentData = { ...doc, isTrashed: true };
    onSaveDocument(updated);
  };

  const handleRestoreFromTrash = (doc: DocumentData) => {
    const updated: DocumentData = { ...doc, isTrashed: false };
    onSaveDocument(updated);
  };

  const handleDeletePermanently = (docId: string) => {
    if (confirm('Voulez-vous supprimer définitivement ce document ?')) {
      onDeleteDocument(docId);
    }
  };

  // Export document as HTML file
  const handleExportHtml = (doc: DocumentData) => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${doc.type} ${doc.number} - ${doc.clientCompany}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; }
    .card { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    h1 { color: #0f172a; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 12px; text-align: left; }
    th { background: #f1f5f9; font-size: 12px; }
    .total { font-weight: bold; font-size: 16px; color: #d97706; text-align: right; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${doc.type} - ${doc.number}</h1>
    <p><strong>Date :</strong> ${doc.date} | <strong>Client :</strong> ${doc.clientName} (${doc.clientCompany})</p>
    ${doc.shootingDate ? `<p><strong>Date de Tournage :</strong> ${doc.shootingDate}</p>` : ''}
    <table>
      <thead><tr><th>Description</th><th>Qté</th><th>Prix Unitaire</th><th>Total</th></tr></thead>
      <tbody>
        ${doc.items.map(i => `<tr><td>${i.description}</td><td>${i.quantity}</td><td>${i.unitPrice} MAD</td><td>${i.quantity * i.unitPrice} MAD</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="total">Total TTC : ${getDocTotalTTC(doc).toLocaleString('fr-FR')} MAD</div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.number}_${doc.clientCompany.replace(/\s+/g, '_')}.html`;
    a.click();
  };

  // Copy WhatsApp summary
  const handleCopyWhatsAppSummary = (doc: DocumentData) => {
    const text = `Bonjour ${doc.clientName},\nVoici le récapitulatif de votre ${doc.type} N° *${doc.number}* pour ${doc.clientCompany} :\n\n- Montant Total TTC : *${getDocTotalTTC(doc).toLocaleString('fr-FR')} MAD*\n- Statut : *${doc.status.toUpperCase()}*\n${doc.shootingDate ? `- Date de tournage : *${doc.shootingDate}*\n` : ''}\nRestant à votre disposition pour toute question !\nHafsi Prod / CineManage.`;
    navigator.clipboard.writeText(text);
    alert('✅ Résumé copié ! Vous pouvez le coller directement sur WhatsApp.');
  };

  // Handle printing document
  const handlePrint = () => {
    if (!selectedDocument) {
      alert('Veuillez sélectionner un document à imprimer.');
      return;
    }
    setIsEditing(false);
    setActiveTab('preview');
    setTimeout(() => {
      window.focus();
      window.print();
    }, 200);
  };

  // Open Form to create new document
  const handleOpenCreateForm = (type: DocumentType = 'DEVIS') => {
    const year = new Date().getFullYear();
    const count = documents.filter((d) => d.type === type).length + 1;
    const prefix = type === 'DEVIS' ? 'DEV' : type === 'FACTURE' ? 'FAC' : type === 'FACTURE_ACOMPTE' ? 'FAC-AC' : 'BL';
    const num = `${prefix}-${year}-${String(count).padStart(3, '0')}`;

    setFormType(type);
    setFormNumber(num);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (clients.length > 0) {
      const c = clients[0];
      setFormClientId(c.id);
      setFormClientName(c.name);
      setFormClientCompany(c.company);
      setFormClientIce(c.ice);
      setFormClientAddress(`${c.city}, Maroc`);
    }

    setFormItems([{ id: `item-${Date.now()}`, description: 'Prestation de tournage & réalisation', quantity: 1, unitPrice: 6000 }]);
    setFormTvaRate(20);
    setFormAcompteRate(type === 'FACTURE_ACOMPTE' ? 40 : 30);
    setFormNotes('Paiement par virement bancaire Attijariwafa Bank. ICE à mentionner.');

    setIsEditing(true);
    setActiveTab('edit');
  };

  // Populate form with selected client
  const handleSelectClientInForm = (clientId: string) => {
    setFormClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setFormClientName(client.name);
      setFormClientCompany(client.company);
      setFormClientIce(client.ice);
      setFormClientAddress(`${client.city}, Maroc`);
    }
  };

  // Add Item to form
  const handleAddItem = (preset?: { description: string; price: number }) => {
    setFormItems([
      ...formItems,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        description: preset ? preset.description : 'Nouvelle prestation',
        quantity: 1,
        unitPrice: preset ? preset.price : 2500,
      },
    ]);
  };

  // Remove item
  const handleRemoveItem = (id: string) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((item) => item.id !== id));
    }
  };

  // Save document handler
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    const newDoc: DocumentData = {
      id: selectedDocument && isEditing && selectedDocument.number === formNumber ? selectedDocument.id : `doc-${Date.now()}`,
      type: formType,
      number: formNumber,
      date: formDate,
      dueDate: formDueDate,
      shootingDate: formShootingDate || undefined,
      clientId: formClientId,
      clientName: formClientName,
      clientCompany: formClientCompany,
      clientIce: formClientIce,
      clientAddress: formClientAddress,
      items: formItems,
      tvaRate: formTvaRate,
      acompteRate: formAcompteRate,
      status: 'brouillon',
      checklist: selectedDocument?.checklist || {
        briefSent: false,
        bonAccordSigned: false,
        orderReceived: false,
        driveSaved: false,
        relanceSent: false,
      },
      notes: formNotes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSaveDocument(newDoc);
    setSelectedDocId(newDoc.id);
    setIsEditing(false);
    setActiveTab('preview');
  };

  // Duplicate as Facture or Facture d'acompte
  const handleDuplicateAs = (targetType: DocumentType) => {
    if (!selectedDocument) return;
    const year = new Date().getFullYear();
    const count = documents.filter((d) => d.type === targetType).length + 1;
    const prefix = targetType === 'DEVIS' ? 'DEV' : targetType === 'FACTURE' ? 'FAC' : targetType === 'FACTURE_ACOMPTE' ? 'FAC-AC' : 'BL';
    const newNum = `${prefix}-${year}-${String(count).padStart(3, '0')}`;

    const duplicated: DocumentData = {
      ...selectedDocument,
      id: `doc-${Date.now()}`,
      type: targetType,
      number: newNum,
      date: new Date().toISOString().split('T')[0],
      status: 'brouillon',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSaveDocument(duplicated);
    setSelectedDocId(duplicated.id);
    setActiveTab('preview');
  };

  // Toggle checklist item
  const handleToggleChecklist = (key: keyof DocumentData['checklist']) => {
    if (!selectedDocument) return;
    const updated: DocumentData = {
      ...selectedDocument,
      checklist: {
        ...selectedDocument.checklist,
        [key]: !selectedDocument.checklist[key],
      },
    };
    onSaveDocument(updated);
  };

  // Change document status
  const handleChangeStatus = (status: DocumentStatus) => {
    if (!selectedDocument) return;
    const updated: DocumentData = {
      ...selectedDocument,
      status,
    };
    onSaveDocument(updated);
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesTrash = showTrashOnly ? !!doc.isTrashed : !doc.isTrashed;
    const matchesType = filterType === 'ALL' || doc.type === filterType;
    const matchesSearch =
      doc.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clientCompany.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTrash && matchesType && matchesSearch;
  });

  // Calculate doc totals for summary list
  const getDocTotalTTC = (doc: DocumentData) => {
    const totalHT = doc.items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100), 0);
    return totalHT * (1 + doc.tvaRate / 100);
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'paye':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Payé</span>;
      case 'accorde':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><FileCheck className="w-3 h-3" /> Accordé</span>;
      case 'envoye':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1"><Send className="w-3 h-3" /> Envoyé</span>;
      case 'retard':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> En Retard</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-400 border border-slate-600 flex items-center gap-1"><Clock className="w-3 h-3" /> Brouillon</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-1">
            <FileText className="w-4 h-4" /> Module 1 • Conforme Normes Marocaines (ICE/IF/TP)
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Générateur de Devis & Factures</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Éditez des documents professionnels, suivez les acomptes, la TVA à 20% et l'automatisation du suivi client.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenCreateForm('DEVIS')}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nouveau Devis
          </button>
          <button
            onClick={() => handleOpenCreateForm('FACTURE')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nouvelle Facture
          </button>
          <button
            onClick={() => handleOpenCreateForm('FACTURE_ACOMPTE')}
            className="px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" /> Facture d'Acompte
          </button>
          <button
            onClick={() => handleOpenCreateForm('BON_LIVRAISON')}
            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700/80 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Bon de Livraison
          </button>
        </div>
      </div>

      {/* Main Workspace Grid: Document List (Left) + Document Viewer / Editor (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Document List & Filters */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-4">
          {/* Search & Type Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher N°, Client, Entreprise..."
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-bold">
              <div className="flex flex-wrap gap-1">
                {['ALL', 'DEVIS', 'FACTURE', 'FACTURE_ACOMPTE', 'BON_LIVRAISON'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      filterType === t
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {t === 'ALL'
                      ? 'Tous'
                      : t === 'DEVIS'
                      ? 'Devis'
                      : t === 'FACTURE'
                      ? 'Factures'
                      : t === 'FACTURE_ACOMPTE'
                      ? 'Acomptes'
                      : 'BL'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowTrashOnly(!showTrashOnly)}
                className={`px-2 py-1 rounded-lg border transition-all text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                  showTrashOnly
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Afficher la corbeille"
              >
                <Trash2 className="w-3 h-3 text-rose-400" /> {showTrashOnly ? 'Corbeille Active' : 'Corbeille'}
              </button>
            </div>
          </div>

          {/* Document List Stack */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredDocuments.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                {showTrashOnly ? 'La corbeille est vide.' : 'Aucun document trouvé.'}
              </div>
            ) : (
              filteredDocuments.map((doc) => {
                const isSelected = selectedDocument?.id === doc.id;
                const total = getDocTotalTTC(doc);

                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setIsEditing(false);
                      setActiveTab('preview');
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer group relative ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500/10 to-slate-900 border-amber-500/60 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black font-mono text-amber-400 tracking-wider">
                        {doc.number}
                      </span>
                      <div className="flex items-center gap-1">
                        {getStatusBadge(doc.status)}
                        {showTrashOnly ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreFromTrash(doc);
                              }}
                              className="p-1 hover:bg-emerald-950/80 text-emerald-400 rounded"
                              title="Raurer le document"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePermanently(doc.id);
                              }}
                              className="p-1 hover:bg-rose-950/80 text-rose-400 rounded"
                              title="Supprimer définitivement"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveToTrash(doc);
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded transition-all"
                            title="Mettre en corbeille"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-200 line-clamp-1">{doc.clientName}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{doc.clientCompany || 'Client Particulier'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-slate-100">
                          {doc.type === 'BON_LIVRAISON' ? 'BL' : `${total.toLocaleString('fr-MA')} MAD`}
                        </div>
                        <div className="text-[10px] text-slate-500">{doc.date}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Viewer & Actions or Form Editor */}
        <div className="lg:col-span-8 space-y-4">
          {/* Action Navigation Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setActiveTab('preview');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'preview' && !isEditing
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Prévisualisation PDF
              </button>
              <button
                onClick={() => {
                  if (selectedDocument) {
                    setFormType(selectedDocument.type);
                    setFormNumber(selectedDocument.number);
                    setFormDate(selectedDocument.date);
                    setFormDueDate(selectedDocument.dueDate || selectedDocument.date);
                    setFormClientId(selectedDocument.clientId);
                    setFormClientName(selectedDocument.clientName);
                    setFormClientCompany(selectedDocument.clientCompany);
                    setFormClientIce(selectedDocument.clientIce);
                    setFormClientAddress(selectedDocument.clientAddress);
                    setFormItems(selectedDocument.items);
                    setFormTvaRate(selectedDocument.tvaRate);
                    setFormAcompteRate(selectedDocument.acompteRate);
                    setFormNotes(selectedDocument.notes || '');
                    setIsEditing(true);
                    setActiveTab('edit');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isEditing
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit className="w-3.5 h-3.5" /> Éditer le Document
              </button>
              <button
                onClick={() => setActiveTab('checklist')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'checklist'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Checklist Automation
              </button>
            </div>

            {/* Print & Export PDF buttons */}
            <div className="flex flex-wrap items-center gap-2 no-print">
              {selectedDocument && (
                <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-xl text-[10px] font-bold">
                  <span className="text-slate-400 px-1">Statut :</span>
                  {(['paye', 'accorde', 'envoye', 'retard', 'brouillon'] as DocumentStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleChangeStatus(st)}
                      className={`px-2 py-0.5 rounded-lg transition-all capitalize cursor-pointer ${
                        selectedDocument.status === st
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st === 'paye' ? 'Payé' : st === 'accorde' ? 'Accordé' : st === 'envoye' ? 'Envoyé' : st === 'retard' ? 'En Retard' : 'Brouillon'}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-slate-600 transition-all flex items-center gap-1.5 cursor-pointer no-print shadow-sm"
                title="Imprimer ou Exporter en PDF"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" /> Imprimer / PDF
              </button>

              {selectedDocument && (
                <>
                  <button
                    onClick={() => handleExportHtml(selectedDocument)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1 cursor-pointer no-print"
                    title="Télécharger fichier HTML"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> HTML
                  </button>

                  <button
                    onClick={() => handleCopyWhatsAppSummary(selectedDocument)}
                    className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-800 transition-all flex items-center gap-1 cursor-pointer no-print"
                    title="Partager sur WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp
                  </button>
                </>
              )}

              <button
                onClick={() => setShowEmailModal(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1 cursor-pointer no-print"
                title="Générer email client"
              >
                <Mail className="w-3.5 h-3.5 text-sky-400" /> Mail Brief
              </button>
            </div>
          </div>

          {/* Edit Form View */}
          {isEditing ? (
            <form onSubmit={handleSaveForm} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-400" /> Édition du Document ({formNumber})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Document Meta Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Type de Document</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as DocumentType)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:border-amber-500 font-bold"
                  >
                    <option value="DEVIS">DEVIS</option>
                    <option value="FACTURE">FACTURE</option>
                    <option value="FACTURE_ACOMPTE">FACTURE D'ACOMPTE</option>
                    <option value="BON_LIVRAISON">BON DE LIVRAISON</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Numéro Document</label>
                  <input
                    type="text"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-amber-400 p-2.5 rounded-xl focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-400">Date d'Émission</label>
                    <button
                      type="button"
                      onClick={() => setFormDate(new Date().toISOString().split('T')[0])}
                      className="text-[10px] font-bold text-amber-400 hover:underline"
                    >
                      Aujourd'hui
                    </button>
                  </div>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">🎬 Date de Tournage (Optionnel)</label>
                  <input
                    type="date"
                    value={formShootingDate}
                    onChange={(e) => setFormShootingDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-amber-300 p-2.5 rounded-xl focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Client Selection Row */}
              <div className="bg-slate-950/80 p-4 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-amber-400" /> Informations Client (B2B Maroc)
                  </span>
                  <select
                    onChange={(e) => handleSelectClientInForm(e.target.value)}
                    value={formClientId}
                    className="bg-slate-900 border border-slate-700 text-xs text-amber-300 p-1.5 rounded-lg focus:outline-none"
                  >
                    <option value="">-- Choisir un client existant --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Nom du Client</label>
                    <input
                      type="text"
                      value={formClientName}
                      onChange={(e) => setFormClientName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Entreprise</label>
                    <input
                      type="text"
                      value={formClientCompany}
                      onChange={(e) => setFormClientCompany(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-amber-400 font-bold mb-0.5">ICE Client (Obligatoire)</label>
                    <input
                      type="text"
                      value={formClientIce}
                      onChange={(e) => setFormClientIce(e.target.value)}
                      placeholder="Ex: 002984123000088"
                      className="w-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-amber-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Adresse / Ville</label>
                    <input
                      type="text"
                      value={formClientAddress}
                      onChange={(e) => setFormClientAddress(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Items Table Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-amber-400" /> Détails des Éléments & Prestations
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Modèles Rapides:</span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const preset = PRESET_SERVICES[parseInt(e.target.value)];
                          if (preset) handleAddItem(preset);
                          e.target.value = '';
                        }
                      }}
                      className="bg-slate-950 border border-slate-800 text-[11px] text-amber-300 p-1.5 rounded-lg"
                    >
                      <option value="">+ Ajouter un forfait prédéfini</option>
                      {PRESET_SERVICES.map((p, idx) => (
                        <option key={idx} value={idx}>
                          {p.description} ({p.price} MAD)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  {formItems.map((item, index) => (
                    <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-950 p-2.5 border border-slate-800 rounded-xl">
                      <span className="text-xs font-mono font-bold text-slate-500 w-6 text-center">{index + 1}</span>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...formItems];
                          updated[index].description = e.target.value;
                          setFormItems(updated);
                        }}
                        placeholder="Description de la prestation..."
                        className="flex-1 bg-slate-900 border border-slate-800 text-xs text-white p-2 rounded-lg"
                        required
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-20">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...formItems];
                              updated[index].quantity = Math.max(1, parseInt(e.target.value) || 1);
                              setFormItems(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2 rounded-lg text-center font-mono"
                            title="Quantité"
                          />
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            step="100"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const updated = [...formItems];
                              updated[index].unitPrice = parseFloat(e.target.value) || 0;
                              setFormItems(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 text-xs text-amber-400 font-mono font-bold p-2 rounded-lg text-right"
                            title="Prix Unitaire HT (MAD)"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-rose-400 hover:text-rose-300 hover:bg-slate-900 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-400" /> Ajouter un élément personnalisé
                </button>
              </div>

              {/* Financial Calculations Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 border border-slate-800 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Taux TVA marocain</label>
                  <select
                    value={formTvaRate}
                    onChange={(e) => setFormTvaRate(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2 rounded-lg"
                  >
                    <option value={20}>20% (Standard SARL / Régime général)</option>
                    <option value={0}>0% (Exonéré / Plafond Auto-Entrepreneur)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Acompte à la commande (%)</label>
                  <select
                    value={formAcompteRate}
                    onChange={(e) => setFormAcompteRate(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2 rounded-lg"
                  >
                    <option value={0}>0% (Pas d'acompte)</option>
                    <option value={30}>30% en avance</option>
                    <option value={40}>40% en avance (Recommandé)</option>
                    <option value={50}>50% en avance</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20"
                >
                  Enregistrer le Document
                </button>
              </div>
            </form>
          ) : activeTab === 'checklist' ? (
            /* Automation Checklist View */
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" /> Checklist & Rappels d'Automatisation
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Suivez le workflow légal et commercial pour le document{' '}
                    <span className="font-mono text-amber-300 font-bold">{selectedDocument?.number}</span>
                  </p>
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Statut :</span>
                  <select
                    value={selectedDocument?.status || 'brouillon'}
                    onChange={(e) => handleChangeStatus(e.target.value as DocumentStatus)}
                    className="bg-slate-950 border border-slate-800 text-xs font-bold text-amber-300 p-2 rounded-xl"
                  >
                    <option value="brouillon">Brouillon</option>
                    <option value="envoye">Envoyé au client</option>
                    <option value="accorde">Bon pour Accord Signé</option>
                    <option value="paye">Payé & Réceptionné</option>
                    <option value="retard">En Retard de Paiement</option>
                  </select>
                </div>
              </div>

              {/* Checklist Tasks */}
              <div className="space-y-3">
                {[
                  {
                    key: 'briefSent' as const,
                    title: 'Envoyer mail de brief et conditions',
                    desc: 'Envoi des termes, acompte de 30-40% et spécifications techniques de tournage.',
                    icon: Mail,
                    actionText: 'Générer Email Client',
                    onAction: () => setShowEmailModal(true),
                  },
                  {
                    key: 'bonAccordSigned' as const,
                    title: 'Obtenir le Bon pour Accord + Cachet client',
                    desc: 'Validation écrite et tampon avec ICE de l’entreprise cliente.',
                    icon: FileCheck,
                  },
                  {
                    key: 'orderReceived' as const,
                    title: 'Réceptionner le Bon de Commande (PO)',
                    desc: 'Avoir la confirmation du département achat / finance.',
                    icon: FileText,
                  },
                  {
                    key: 'driveSaved' as const,
                    title: 'Enregistrer la copie dans Google Drive',
                    desc: 'Archiver le Devis/Facture et le Bon de Livraison signé dans le Cloud.',
                    icon: ExternalLink,
                  },
                  {
                    key: 'relanceSent' as const,
                    title: 'Relancer le paiement (Si retard)',
                    desc: 'Notification automatique pour les factures de plus de 30 jours.',
                    icon: AlertTriangle,
                  },
                ].map((item) => {
                  const isChecked = selectedDocument?.checklist?.[item.key] || false;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.key}
                      className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                        isChecked
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleChecklist(item.key)}
                        className={`mt-1 p-1 rounded-lg border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                            : 'bg-slate-900 border-slate-700 text-transparent hover:border-amber-500'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isChecked ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <h4 className={`text-sm font-bold ${isChecked ? 'text-white line-through opacity-80' : 'text-slate-200'}`}>
                            {item.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                      </div>

                      {item.actionText && (
                        <button
                          onClick={item.onAction}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-lg border border-slate-700 transition-all cursor-pointer"
                        >
                          {item.actionText}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Duplicate Quick Actions */}
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-300">Duplication & Conversion Rapide :</span>
                <div className="flex flex-wrap gap-2">
                  {selectedDocument?.type === 'DEVIS' && (
                    <>
                      <button
                        onClick={() => handleDuplicateAs('FACTURE_ACOMPTE')}
                        className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl hover:bg-amber-500/30 cursor-pointer"
                      >
                        ⚡ Générer Facture d'Acompte (40%)
                      </button>
                      <button
                        onClick={() => handleDuplicateAs('FACTURE')}
                        className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs rounded-xl hover:bg-emerald-500/30 cursor-pointer"
                      >
                        📄 Convertir en Facture Finale
                      </button>
                    </>
                  )}
                  {selectedDocument?.type !== 'BON_LIVRAISON' && (
                    <button
                      onClick={() => handleDuplicateAs('BON_LIVRAISON')}
                      className="px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl hover:bg-slate-700 cursor-pointer"
                    >
                      📦 Générer Bon de Livraison (BL)
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Printable PDF Live Preview Frame */
            <div className="space-y-4">
              {selectedDocument ? (
                <DocumentPreview document={selectedDocument} profile={profile} />
              ) : (
                <div className="bg-slate-900 border border-slate-800 p-12 text-center text-slate-400 rounded-2xl">
                  Sélectionnez ou créez un document pour afficher la prévisualisation.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Email Brief Generator Modal */}
      {showEmailModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-xl w-full p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-400" /> Modèle d'Email Brief Client ({selectedDocument.number})
              </h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 space-y-3 border border-slate-800 select-all">
              <p>
                <strong className="text-amber-400">Objet :</strong> {selectedDocument.type} N° {selectedDocument.number} - {profile.filmmakerName} ({selectedDocument.clientCompany})
              </p>
              <hr className="border-slate-800" />
              <p>Bonjour {selectedDocument.clientName},</p>
              <p>
                J'espère que vous allez bien. Suite à nos récents échanges concernant le projet audiovisual pour {selectedDocument.clientCompany}, veuillez trouver ci-joint notre {selectedDocument.type.toLowerCase()} N° {selectedDocument.number}.
              </p>
              <p>
                <strong>Montant Total TTC :</strong> {getDocTotalTTC(selectedDocument).toLocaleString('fr-MA')} MAD
                <br />
                <strong>Acompte (30-40%) :</strong> Par virement sur le RIB Attijariwafa Bank : {profile.rib}
              </p>
              <p>
                Afin de valider la date de tournage dans notre planning studio, merci de nous retourner ce document revêtu de votre cachet d'entreprise (ICE {selectedDocument.clientIce || 'à préciser'}) et de la mention "Bon pour Accord".
              </p>
              <p>
                Restant à votre entière disposition,
                <br />
                Cordialement,
                <br />
                <strong>{profile.filmmakerName}</strong> - {profile.title}
                <br />
                {profile.phone} | {profile.websiteUrl}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Bonjour ${selectedDocument.clientName},\n\nVeuillez trouver ci-joint notre ${selectedDocument.type} N° ${selectedDocument.number}.\nMontant TTC: ${getDocTotalTTC(selectedDocument).toLocaleString('fr-MA')} MAD.\nRIB: ${profile.rib}\n\nCordialement,\n${profile.filmmakerName}`);
                  alert('Email copié dans le presse-papier !');
                }}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4" /> Copier l'Email
              </button>
              <a
                href={`mailto:${selectedDocument.clientEmail || ''}?subject=${encodeURIComponent(`${selectedDocument.type} ${selectedDocument.number} - ${profile.filmmakerName}`)}`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Send className="w-4 h-4 text-sky-400" /> Ouvrir dans le logiciel Mail
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

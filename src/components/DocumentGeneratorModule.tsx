import React, { useState, useEffect } from 'react';
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
  RotateCcw,
  Video,
  Users,
  Camera,
  Layers,
  Cloud,
  CloudUpload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Loader2,
  SlidersHorizontal,
  Settings2,
  Save,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { DocumentData, DocumentItem, DocumentType, DocumentStatus, ClientData, ProfileInfo } from '../types';
import { DocumentPreview } from './DocumentPreview';
import cameraBannerImg from '../assets/images/regenerated_image_1786447227352.jpg';
import {
  autoUploadDocumentToDrive,
  setupHafsiProdFolders,
  getSubfolderNameForDocType,
  isDriveConnected
} from '../lib/googleDriveSync';

interface DocumentGeneratorModuleProps {
  documents: DocumentData[];
  clients: ClientData[];
  profile: ProfileInfo;
  onSaveDocument: (doc: DocumentData) => void;
  onDeleteDocument: (docId: string) => void;
  onSelectClient?: (clientId: string) => void;
}

const DEFAULT_DELIVERABLE_PRESETS = [
  '1 Master 4K 16:9 + 2 Reels 9:16 + Fichiers .SRT sous-titrés',
  'Film corporate 3min 4K + Teaser 30s version réseaux sociaux',
  '4 Capsules vidéo verticales 9:16 optimisées Instagram/TikTok',
  'Rushes vidéo bruts sans montage (Fichiers RAW / LOG bruts)',
];

const DEFAULT_CREW_PRESETS = [
  '1 Réalisateur / Cadreur FX6 + 1 Ingénieur du son',
  '1 Réalisateur, 1 Chef opérateur, 1 Pilote drone, 1 Ingé son',
  '1 Cadreur / Monteur autonome polyvalent',
  '1 Directeur de la photo (DP) + 1 1er Assistant Caméra (Focus Puller)',
];

const DEFAULT_GEAR_PRESETS = [
  'Sony FX6 Cinema Line + Optiques GM + DJI RS3 Pro + Kit Aputure + Micros HF',
  'Sony FX3 + Gimbal DJI Ronin + Kit Micro Sans Fil HF Rode + Panneaux LED',
  'Drone 4K Pro DJI + Sony FX6 Cinema + Kit Audio Zoom F6 & Micro Canon',
  'Kit Caméra Cinéma 4K/RAW + Optiques Anamorphiques + Pied Sachtler',
];

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

  // Technical Specs Presets State with LocalStorage Persistence
  const [deliverablePresets, setDeliverablePresets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cinemanage_presets_deliverables');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_DELIVERABLE_PRESETS;
  });

  const [crewPresets, setCrewPresets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cinemanage_presets_crew');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CREW_PRESETS;
  });

  const [gearPresets, setGearPresets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cinemanage_presets_gear');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_GEAR_PRESETS;
  });

  // Preset Manager Modal State
  const [manageModalPillar, setManageModalPillar] = useState<'deliverables' | 'crew' | 'gear' | null>(null);
  const [editingPresetIdx, setEditingPresetIdx] = useState<number | null>(null);
  const [editingPresetValue, setEditingPresetValue] = useState<string>('');
  const [newPresetValue, setNewPresetValue] = useState<string>('');
  const [presetFeedback, setPresetFeedback] = useState<string | null>(null);

  const saveDeliverablePresets = (list: string[]) => {
    setDeliverablePresets(list);
    try {
      localStorage.setItem('cinemanage_presets_deliverables', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const saveCrewPresets = (list: string[]) => {
    setCrewPresets(list);
    try {
      localStorage.setItem('cinemanage_presets_crew', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const saveGearPresets = (list: string[]) => {
    setGearPresets(list);
    try {
      localStorage.setItem('cinemanage_presets_gear', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCurrentAsPreset = (pillar: 'deliverables' | 'crew' | 'gear', text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (pillar === 'deliverables') {
      if (!deliverablePresets.includes(trimmed)) {
        const updated = [...deliverablePresets, trimmed];
        saveDeliverablePresets(updated);
        setPresetFeedback('Option enregistrée dans vos livrables !');
        setTimeout(() => setPresetFeedback(null), 3000);
      }
    } else if (pillar === 'crew') {
      if (!crewPresets.includes(trimmed)) {
        const updated = [...crewPresets, trimmed];
        saveCrewPresets(updated);
        setPresetFeedback('Option enregistrée dans vos équipes !');
        setTimeout(() => setPresetFeedback(null), 3000);
      }
    } else if (pillar === 'gear') {
      if (!gearPresets.includes(trimmed)) {
        const updated = [...gearPresets, trimmed];
        saveGearPresets(updated);
        setPresetFeedback('Option enregistrée dans vos équipements !');
        setTimeout(() => setPresetFeedback(null), 3000);
      }
    }
  };

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

  // Optional Production Technical Details (Devis) - Strictly Optional Toggle
  const [formHasProductionSpecs, setFormHasProductionSpecs] = useState<boolean>(false);
  const [formDeliverables, setFormDeliverables] = useState<string>('');
  const [formRevisionsAllowed, setFormRevisionsAllowed] = useState<number>(2);
  const [formExtraRevisionRate, setFormExtraRevisionRate] = useState<number>(500);
  const [formCrewAssigned, setFormCrewAssigned] = useState<string>('');
  const [formGearDeployed, setFormGearDeployed] = useState<string>('');
  const [formIncludeLegalClauses, setFormIncludeLegalClauses] = useState<boolean>(true);
  const [formCustomClauses, setFormCustomClauses] = useState<string>('');

  // Responsive Zoom & Preview Controls (Adaptive default for mobile & desktop)
  const [zoomScale, setZoomScale] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) return 0.45;
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return 0.70;
    return 0.85;
  });
  const [previewPageView, setPreviewPageView] = useState<'all' | 'page1' | 'page2'>('all');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [mobileViewTab, setMobileViewTab] = useState<'list' | 'preview' | 'edit'>('preview');

  // Helper to auto-fit document to current screen
  const handleAutoFitZoom = () => {
    if (typeof window === 'undefined') return;
    const screenW = window.innerWidth;
    if (screenW < 450) {
      setZoomScale(0.42);
    } else if (screenW < 640) {
      setZoomScale(0.48);
    } else if (screenW < 1024) {
      setZoomScale(0.68);
    } else if (screenW < 1440) {
      setZoomScale(0.85);
    } else {
      setZoomScale(1.0);
    }
  };

  // Google Drive Cloud Sync State
  const [isDriveUploading, setIsDriveUploading] = useState<boolean>(false);
  const [driveNotification, setDriveNotification] = useState<{
    status: 'idle' | 'uploading' | 'success' | 'error';
    message: string;
    link?: string;
    folderName?: string;
  }>({ status: 'idle', message: '' });

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

  // Helper to generate standalone A4 HTML template for printing / PDF export / Cloud sync
  const generateDocumentHtmlString = (doc: DocumentData) => {
    const totalHT = doc.items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100), 0);
    const tvaRate = doc.tvaRate ?? 20;
    const tvaAmount = (totalHT * tvaRate) / 100;
    const totalTTC = totalHT + tvaAmount;
    let acompteAmount = 0;
    if (doc.type === 'FACTURE_ACOMPTE') {
      acompteAmount = (doc.acompteRate && doc.acompteRate > 0) ? (totalTTC * doc.acompteRate) / 100 : totalTTC;
    } else if (doc.acompteRate && doc.acompteRate > 0) {
      acompteAmount = (totalTTC * doc.acompteRate) / 100;
    }
    const netAPayer = doc.type === 'FACTURE_ACOMPTE' ? (acompteAmount > 0 ? acompteAmount : totalTTC) : totalTTC;
    const formatMad = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202f/g, ' ');

    const typeTitle = doc.type === 'DEVIS' ? 'DEVIS' : doc.type === 'FACTURE_ACOMPTE' ? "FACTURE D'ACOMPTE" : doc.type === 'BON_LIVRAISON' ? 'BON DE LIVRAISON' : 'FACTURE';
    const bannerImage = profile.bannerUrl || cameraBannerImg;
    const docPillTitle = doc.type === 'DEVIS' ? 'DEVIS N° :' : doc.type === 'FACTURE_ACOMPTE' ? "FACTURE D'ACOMPTE DE DEVIS N° :" : doc.type === 'BON_LIVRAISON' ? 'BON DE LIVRAISON N° :' : 'FACTURE N° :';

    const hasTechnicalSpecs = doc.type === 'DEVIS' && doc.hasProductionSpecs !== false && Boolean(doc.deliverables || doc.crewAssigned || doc.gearDeployed);
    const hasLegalAnnex = doc.type === 'DEVIS' && doc.includeLegalClauses !== false;
    const revisionsCount = doc.revisionsAllowed ?? 2;
    const extraRate = doc.extraRevisionRate ?? 500;
    const acompteRate = doc.acompteRate || 40;

    const TOTAL_GRID_ROWS = doc.type === 'DEVIS' ? (hasTechnicalSpecs ? 3 : 4) : 5;
    const fillerRowCount = Math.max(0, TOTAL_GRID_ROWS - doc.items.length);

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.type} ${doc.number} - ${doc.clientCompany || doc.clientName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 0mm !important; }
    *, *::before, *::after { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; color: #0f172a; }
    .no-print { display: flex; gap: 12px; margin-bottom: 20px; }
    .btn { background: #f59e0b; color: #020617; font-weight: 800; padding: 12px 24px; border-radius: 8px; text-decoration: none; border: none; cursor: pointer; font-size: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.3); display: inline-flex; align-items: center; gap: 8px; }
    .btn:hover { background: #d97706; }
    .a4-sheet { width: 210mm; min-height: 297mm; height: 297mm; max-height: 297mm; background: #ffffff; color: #0f172a; margin: 0 auto 20px auto; box-shadow: 0 10px 40px rgba(0,0,0,0.6); display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; border-radius: 2px; }
    .page-break { page-break-before: always; }
    
    /* Vintage Cinema Header Banner */
    .banner { position: relative; height: 170px; background-color: #020617; color: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 24px; overflow: hidden; flex-shrink: 0; }
    .banner img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; opacity: 0.50; filter: contrast(125%) brightness(90%); }
    .banner .overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.80), rgba(0,0,0,0.40), rgba(0,0,0,0.90)); }
    .banner .inner { position: relative; z-index: 10; color: #ffffff; text-transform: uppercase; letter-spacing: 0.32em; display: flex; flex-direction: column; align-items: center; }
    .banner h1 { margin: 0; font-size: 32px; font-weight: 900; letter-spacing: 0.32em; color: #ffffff; text-shadow: 0 2px 6px rgba(0,0,0,0.6); }
    .banner p { margin: 4px 0 0 0; font-size: 13px; letter-spacing: 0.35em; color: #f1f5f9; font-weight: 800; text-transform: uppercase; background: rgba(0,0,0,0.5); padding: 3px 16px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.1); }
    .banner .badge { display: inline-block; background: rgba(34,34,37,0.95); border: 1px solid rgba(255,255,255,0.25); padding: 3px 18px; margin-top: 5px; font-size: 11.5px; font-weight: 900; letter-spacing: 0.28em; border-radius: 3px; color: #ffffff; }

    .content { padding: 14px 28px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
    .meta-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; gap: 20px; }
    .pill { display: inline-flex; flex-direction: column; background: #333336; color: #ffffff; font-weight: 800; padding: 6px 16px; font-size: 11.5px; letter-spacing: 0.05em; border-radius: 3px; text-transform: uppercase; min-width: 210px; }
    .pill-date { display: inline-block; background: #333336; color: #ffffff; font-weight: 800; padding: 6px 16px; font-size: 12px; letter-spacing: 0.2em; border-radius: 3px; text-transform: uppercase; }
    .issuer-info { font-size: 12px; color: #334155; margin-top: 5px; line-height: 1.45; }
    .client-info { font-size: 12px; text-align: right; margin-top: 5px; line-height: 1.45; }
    .client-title { font-weight: 800; color: #0f172a; text-transform: uppercase; font-size: 12.5px; }

    table { width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #cbd5e1; margin: 4px 0 8px 0; border-radius: 2px; overflow: hidden; }
    th { background: #333336; color: #ffffff; padding: 8px 14px; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; text-align: left; border-right: 1px solid #475569; }
    th:last-child { border-right: none; }
    td { padding: 8px 14px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; background: #ffffff; }
    td:last-child { border-right: none; }
    
    .tech-specs-box { border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 3px; padding: 7px 10px; margin-bottom: 8px; font-size: 11px; }
    .tech-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .tech-item-title { font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; margin-bottom: 2px; }
    .tech-item-desc { font-size: 10.5px; color: #334155; line-height: 1.35; }

    .grid-terms { display: grid; grid-template-columns: 7fr 5fr; gap: 18px; align-items: start; margin-top: 2px; }
    .term-box { font-size: 11.5px; line-height: 1.45; color: #334155; }
    .term-pill { display: inline-block; background: #333336; color: #ffffff; font-size: 10.5px; font-weight: 800; padding: 3px 10px; border-radius: 3px; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.12em; }
    
    .totals-box { font-size: 11.5px; }
    .total-line { display: flex; justify-content: space-between; padding: 3px 0; font-weight: 800; color: #475569; font-size: 11.5px; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
    .total-ttc { font-weight: 900; color: #0f172a; font-size: 13px; margin-top: 2px; padding-top: 3px; border-bottom: none; }
    
    .footer { padding: 10px 28px 16px 28px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; flex-shrink: 0; }
    .legal-box { background: #222225; color: #ffffff; padding: 9px 16px; border-radius: 3px; font-family: monospace; font-size: 10.5px; line-height: 1.45; max-width: 440px; width: 100%; }
    .legal-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .legal-label { color: #cbd5e1; }
    
    .net-box { border: 1px solid #0f172a; border-radius: 3px; display: flex; overflow: hidden; min-width: 220px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .net-label { background: #ffffff; color: #0f172a; font-weight: 900; font-size: 11px; padding: 6px 14px; display: flex; align-items: center; justify-content: center; letter-spacing: 0.1em; text-transform: uppercase; border-right: 1px solid #0f172a; }
    .net-val { background: #ffffff; flex: 1; text-align: right; padding: 6px 14px; font-weight: 900; font-size: 20px; color: #020617; font-family: monospace; }
    .signature { font-family: 'Caveat', cursive; font-size: 30px; font-weight: 700; color: #0f172a; text-align: right; margin-top: 2px; }

    /* Page 2 Legal Annex */
    .annex-box { border: 1px solid #cbd5e1; border-radius: 3px; padding: 14px 16px; background: #fafafa; font-size: 11px; line-height: 1.5; color: #1e293b; }
    .annex-clause { margin-bottom: 12px; }
    .annex-clause-title { font-weight: 900; text-transform: uppercase; color: #0f172a; font-size: 11px; letter-spacing: 0.05em; margin-bottom: 3px; display: flex; align-items: center; gap: 6px; }

    @media print {
      body { background: #ffffff !important; padding: 0 !important; margin: 0 !important; width: 210mm !important; }
      .no-print { display: none !important; }
      .a4-sheet { width: 210mm !important; height: 297mm !important; max-height: 297mm !important; min-height: 297mm !important; box-shadow: none !important; margin: 0 !important; border: none !important; border-radius: 0 !important; }
      .page-break { page-break-before: always !important; }
      .banner { height: 170px !important; background-color: #020617 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .banner img { opacity: 0.5 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .banner * { color: #ffffff !important; }
      .pill, .pill-date, .term-pill, th { background-color: #333336 !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .legal-box { background-color: #222225 !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .net-box, .net-label, .net-val { background-color: #ffffff !important; color: #020617 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn" onclick="window.print()">🖨️ Enregistrer en PDF / Imprimer A4</button>
  </div>
  
  <!-- PAGE 1: DEVIS / FACTURE -->
  <div class="a4-sheet">
    <div>
      <div class="banner">
        <img src="${bannerImage}" alt="Banner Camera" />
        <div class="overlay"></div>
        <div class="inner">
          <h1>${typeTitle}</h1>
          <p>${profile.filmmakerName || 'TAHA HAFSI'}</p>
          <div class="badge">${profile.title || 'AUDIOVISUELLE EXPERT'}</div>
        </div>
      </div>
      <div class="content">
        <div class="meta-row">
          <div>
            <div class="pill">
              <span>${docPillTitle}</span>
              <span style="font-family:monospace;font-weight:900;font-size:14px;padding-top:2px;">${doc.number}</span>
            </div>
            <div class="issuer-info">
              <div style="font-weight:700;color:#0f172a;font-size:12.5px;">${profile.address || '23 bd akid allam , casablanca'}</div>
              <div>${profile.phone || '+212698519895'}</div>
              <div>${profile.email || 'contact.hafsitaha@gmail.com'}</div>
              <div style="font-weight:700;text-decoration:underline;color:#0f172a;margin-top:2px;">
                <a href="${profile.websiteUrl || 'https://tahahafsi.vercel.app/'}" style="color:#0f172a;text-decoration:underline;">
                  ${profile.websiteUrl || 'https://tahahafsi.vercel.app/'}
                </a>
              </div>
            </div>
          </div>
          <div class="client-info">
            <div class="pill-date">DATE : ${doc.date}</div>
            <div style="margin-top:5px;">
              <div class="client-title">${doc.type === 'BON_LIVRAISON' ? 'POUR :' : doc.type === 'DEVIS' ? 'DEVIS POUR :' : 'FACTURE À :'} <span style="font-weight:900;font-size:13px;">${doc.clientName || 'NOM DE CLIENT'}</span></div>
              <div style="font-weight:700;">${doc.clientCompany || ''}</div>
              <div>${doc.clientAddress || ''}</div>
              <div style="font-weight:800;margin-top:2px;font-size:12.5px;">ICE : <span style="font-family:monospace;font-weight:700;">${doc.clientIce || '3456789'}</span></div>
              ${doc.shootingDate ? `<div style="color:#92400e;font-weight:700;font-size:11px;margin-top:2px;">🎬 Tournage prévu : ${doc.shootingDate}</div>` : ''}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:right;width:120px;">${doc.type === 'BON_LIVRAISON' ? 'Quantité' : 'Prix'}</th>
              <th style="text-align:right;width:120px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${doc.items.map(i => {
              const itemTotal = i.quantity * i.unitPrice * (1 - (i.discountPercent || 0) / 100);
              return `<tr>
                <td><strong style="font-size:12.5px;">${i.description}</strong>${i.discountPercent ? `<br><small style="color:#b45309;font-size:10.5px;">Remise : ${i.discountPercent}%</small>` : ''}</td>
                <td style="text-align:right;font-family:monospace;font-weight:700;font-size:12.5px;">${doc.type === 'BON_LIVRAISON' ? i.quantity : formatMad(i.unitPrice)}</td>
                <td style="text-align:right;font-family:monospace;font-weight:800;font-size:12.5px;">${doc.type === 'BON_LIVRAISON' ? 'LIVRÉ' : formatMad(itemTotal)}</td>
              </tr>`;
            }).join('')}
            ${Array.from({ length: fillerRowCount }).map(() => `
              <tr style="height:24px;">
                <td style="border-right:1px solid #e2e8f0;">&nbsp;</td>
                <td style="border-right:1px solid #e2e8f0;">&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${hasTechnicalSpecs ? `
          <div class="tech-specs-box">
            <div style="font-weight:900;text-transform:uppercase;color:#0f172a;letter-spacing:0.06em;font-size:10px;margin-bottom:5px;border-bottom:1px solid #cbd5e1;padding-bottom:3px;display:flex;justify-content:space-between;">
              <span>SPÉCIFICATIONS TECHNIQUES &amp; CADRAGE DE PRODUCTION</span>
              <span style="color:#64748b;">Annexe technique contractuelle</span>
            </div>
            <div class="tech-grid">
              <div>
                <div class="tech-item-title">📦 Livrables &amp; Formats</div>
                <div class="tech-item-desc">${doc.deliverables || '1 Master Vidéo 4K + Déclinaisons réseaux sociaux.'}</div>
                <div style="margin-top:2px;font-size:9.5px;color:#b45309;font-weight:700;">✓ ${revisionsCount} sessions de retouches incluses</div>
              </div>
              <div>
                <div class="tech-item-title">👥 Équipe Mobilisée</div>
                <div class="tech-item-desc">${doc.crewAssigned || 'Équipe technique certifiée.'}</div>
              </div>
              <div>
                <div class="tech-item-title">🎥 Matériel Déployé</div>
                <div class="tech-item-desc">${doc.gearDeployed || 'Matériel cinéma 4K calibré.'}</div>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="grid-terms">
          <div class="term-box">
            ${doc.type === 'FACTURE' && doc.dueDate ? `<div class="term-pill" style="margin-bottom: 7px;">PAYABLE AU PLUS TARD LE : ${doc.dueDate}</div>` : ''}
            ${doc.type === 'DEVIS' ? `<div class="term-pill" style="margin-bottom: 8px;">DEVIS VALABLE 30 JOURS</div>` : ''}
            ${doc.type !== 'BON_LIVRAISON' ? `
              <div style="margin-bottom: 8px;">
                <div class="term-pill" style="margin-bottom: 4px;">PAIEMENT :</div>
                <div style="margin-top: 3px; line-height: 1.45;">
                  <div style="color: #334155; margin-bottom: 3px;">Par virement bancaire</div>
                  <div><strong style="font-family: monospace; font-size: 11.5px; color: #0f172a; letter-spacing: 0.04em;">RIB : ${profile.rib || '230 780 3612259211026800 41'}</strong></div>
                </div>
              </div>
              ${doc.type === 'DEVIS' ? `
                <div style="margin-bottom: 8px;">
                  <div class="term-pill" style="margin-bottom: 4px;">ÉCHÉANCIER :</div>
                  <div style="margin-top: 3px; line-height: 1.45; color: #334155;">
                    <div style="margin-bottom: 2px;">${doc.acompteRate || 40}% à la commande (acompte bloquant le tournage)</div>
                    <div>${100 - (doc.acompteRate || 40)}% à la livraison finale</div>
                  </div>
                </div>
                <div style="margin-top: 8px; padding: 7px 9px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 4px; font-size: 10.5px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #cbd5e1;padding-bottom:3px;margin-bottom:3px;">
                    <strong style="text-transform:uppercase;color:#0f172a;letter-spacing:0.05em;font-size:10.5px;">BON POUR ACCORD &amp; COMMANDE</strong>
                    <span style="color:#64748b;font-size:9px;">Date &amp; Signature</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:flex-end;">
                    <div style="color:#475569;font-size:10px;line-height:1.35;">
                      <div>Mention : <em>« Bon pour accord »</em></div>
                      <div>Date : _____ / _____ / 202___</div>
                    </div>
                    <div style="width:125px;height:34px;border:1px dashed #94a3b8;background:#ffffff;border-radius:3px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
                      Cachet &amp; Signature
                    </div>
                  </div>
                </div>
              ` : ''}
            ` : `
              <div style="background:#f8fafc;border:1px solid #cbd5e1;padding:8px;border-radius:4px;font-size:11px;">
                <strong>PROCÈS-VERBAL DE RÉCEPTION &amp; VALIDATION :</strong><br>
                Le client reconnaît avoir vérifié et réceptionné l'ensemble des fichiers audiovisuels énumérés ci-dessus.
              </div>
            `}
          </div>
          ${doc.type !== 'BON_LIVRAISON' ? `
            <div class="totals-box">
              <div class="total-line"><span>TOTAL HT</span><span style="font-family:monospace;font-size:12px;">${formatMad(totalHT)}</span></div>
              <div class="total-line"><span>TVA ${tvaRate}%</span><span style="font-family:monospace;font-size:12px;">${formatMad(tvaAmount)}</span></div>
              <div class="total-line total-ttc"><span>TOTAL TTC</span><span style="font-family:monospace;font-size:14px;font-weight:900;">${formatMad(totalTTC)}</span></div>
              ${doc.acompteRate ? `<div style="text-align:right;margin-top:3px;"><span class="term-pill">L'ACOMPTE DE ${doc.acompteRate}%</span></div>` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="legal-box">
        <div class="legal-row"><span class="legal-label">Identifiant Commun de l'entreprise (ICE) :</span><strong>${profile.ice || '003142194000066'}</strong></div>
        <div class="legal-row"><span class="legal-label">Identifiant fiscal. :</span><strong>${profile.ifNumber || '52640537'}</strong></div>
        <div class="legal-row"><span class="legal-label">Taxe professionnelle. :</span><strong>${profile.taxePro || '32758577'}</strong></div>
        <div class="legal-row"><span class="legal-label">Numéro du dossier d'inscription :</span><strong>${profile.inscriptionNo || 'AE-240823-083244'}</strong></div>
        <div class="legal-row"><span class="legal-label">Numéro d'immatriculation CNSS. :</span><strong>${profile.cnssNo || '174204646'}</strong></div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;">
        ${doc.type !== 'BON_LIVRAISON' ? `
          <div class="net-box">
            <div class="net-label">NET À PAYER</div>
            <div class="net-val">${formatMad(netAPayer)} <span style="font-size:12px;letter-spacing:0.05em;">MAD</span></div>
          </div>
        ` : ''}
        <div class="signature">Merci pour votre confiance</div>
      </div>
    </div>
  </div>

  ${hasLegalAnnex ? `
  <!-- PAGE 2: ANNEXE JURIDIQUE & CONDITIONS GÉNÉRALES DE VENTE (CGV) -->
  <div class="a4-sheet page-break">
    <div>
      <div class="banner" style="height:140px;">
        <img src="${bannerImage}" alt="Banner Camera" />
        <div class="overlay"></div>
        <div class="inner">
          <h1 style="font-size:24px;">CONDITIONS GÉNÉRALES &amp; PROTECTION</h1>
          <p>ANNEXE LÉGALE CONTRACTUELLE — DEVIS N° ${doc.number}</p>
          <div class="badge">TAHA HAFSI — AUDIOVISUELLE EXPERT</div>
        </div>
      </div>

      <div class="content" style="padding:20px 32px;">
        <div class="annex-box">
          <div class="annex-clause">
            <div class="annex-clause-title">1. RÉSERVATION FERME &amp; RÉGIME DES ACOMPTES (ART. 288 &amp; 723 D.O.C. MAROC)</div>
            <div>
              Afin de garantir la disponibilité exclusive des dates de tournage et la mobilisation ferme du parc matériel et des équipes techniques (Art. 288 et 723 du D.O.C.), la validation de la commande s'accompagne d'un acompte de <strong>${acompteRate}% TTC</strong> à la signature du devis. Le solde restant (<strong>${100 - acompteRate}%</strong>) est exigible à la remise du livrable finalisé.
            </div>
          </div>

          <div class="annex-clause">
            <div class="annex-clause-title">2. CESSION DES DROITS PATRIMONIAUX D'EXPLOITATION (LOI 2-00 / 34-05)</div>
            <div>
              Conformément à la Loi marocaine n° 2-00 (modifiée par la Loi n° 34-05), la cession des droits patrimoniaux d'exploitation (diffusion web, réseaux sociaux, TV, affichage) est acquise au client dès le règlement intégral et effectif de la totalité du montant TTC facturé. Les droits moraux de l'auteur réalisateur (art. 10 Loi 2-00) demeurent perpétuels, inaliénables et imprescriptibles.
            </div>
          </div>

          <div class="annex-clause">
            <div class="annex-clause-title">3. PÉRIMÈTRE DU LIVRABLE &amp; PROPRIÉTÉ EXCLUSIVE DES RUSHES BRUTS (RAW)</div>
            <div>
              La prestation contractuelle comprend la livraison du master final étalonné et mixé aux formats convenus. Les fichiers sources bruts d'enregistrement (rushes vidéo RAW non étalonnés, profils LOG, pistes audio séparées) et projets logiciels de montage (DaVinci/Premiere) constituent les outils techniques de création du réalisateur et restent sa propriété intellectuelle et matérielle exclusive, sauf convention de cession de rushes spécifique stipulée au devis.
            </div>
          </div>

          <div class="annex-clause">
            <div class="annex-clause-title">4. ACCOMPAGNEMENT QUALITÉ &amp; SESSIONS DE RÉVISIONS (${revisionsCount} RÉVISIONS INCLUSES)</div>
            <div>
              Pour assurer un rendu esthétique irréprochable et un calendrier maîtrisé, le devis intègre forfaitairement <strong>${revisionsCount} session(s) d'ajustements et de retouches mineures</strong> (montage, titrages, étalonnage) sur la base du brief initial dans les 15 jours suivant la première livraison. Toute demande de réorientation majeure hors brief ou session additionnelle fait l'objet d'un accord préalable à <strong>${extraRate} MAD HT / heure</strong>.
            </div>
          </div>

          <div class="annex-clause">
            <div class="annex-clause-title">5. FLEXIBILITÉ DE CALENDRIER, REPORT &amp; DROIT À L'IMAGE (LOI 09-08 &amp; ART. 269 D.O.C.)</div>
            <div>
              En cas d'intempéries majeures (force majeure art. 269 D.O.C.), une date de repli est convenue sans pénalité. Tout report notifié à moins de 72h du tournage pour des motifs propres au client entraîne l'acquisition de l'acompte à titre d'indemnité forfaitaire d'immobilisation. Le client garantit disposer des accords de captation d'image des personnes et lieux filmés (Loi 09-08). Compétence : Tribunal de Commerce.
            </div>
          </div>

          ${doc.customClauses ? `
            <div class="annex-clause">
              <div class="annex-clause-title">6. CLAUSES PARTICULIÈRES COMPLÉMENTAIRES</div>
              <div style="color:#b45309;font-weight:700;">${doc.customClauses}</div>
            </div>
          ` : ''}
        </div>

        <div style="margin-top:16px;border:1px solid #0f172a;background:#f8fafc;padding:12px 18px;border-radius:4px;display:flex;justify-content:space-between;align-items:flex-end;">
          <div>
            <div style="font-weight:900;font-size:11.5px;color:#0f172a;text-transform:uppercase;letter-spacing:0.05em;">
              ACCEPTATION FORMELLE DES CONDITIONS GÉNÉRALES
            </div>
            <div style="font-size:10.5px;color:#475569;margin-top:4px;">
              Fait à Casablanca, le ${doc.date}<br>
              Mention manuscrite obligatoire : <em>« Lu et approuvé, bon pour accord »</em>
            </div>
          </div>
          <div style="display:flex;gap:20px;">
            <div style="text-align:center;">
              <div style="font-size:9.5px;font-weight:800;color:#64748b;text-transform:uppercase;margin-bottom:2px;">Pour le Réalisateur</div>
              <div style="width:140px;height:45px;border:1px dashed #cbd5e1;background:#ffffff;border-radius:3px;display:flex;align-items:center;justify-content:center;font-family:'Caveat',cursive;font-size:22px;color:#0f172a;">
                Taha Hafsi
              </div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:9.5px;font-weight:800;color:#0f172a;text-transform:uppercase;margin-bottom:2px;">Pour le Client (Cachet + Signature)</div>
              <div style="width:160px;height:45px;border:1px dashed #0f172a;background:#ffffff;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#94a3b8;font-weight:700;text-transform:uppercase;">
                Cachet &amp; Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="legal-box">
        <div class="legal-row"><span class="legal-label">ICE :</span><strong>${profile.ice || '003142194000066'}</strong></div>
        <div class="legal-row"><span class="legal-label">IF :</span><strong>${profile.ifNumber || '52640537'}</strong></div>
      </div>
      <div class="signature">Page 2 / 2 — Annexe Juridique</div>
    </div>
  </div>
  ` : ''}
</body>
</html>`;
  };

  // Export Document directly in PDF format (Standard A4 High-Res)
  const handleExportPdf = async (doc: DocumentData) => {
    setIsExportingPdf(true);
    const htmlContent = generateDocumentHtmlString(doc);
    const cleanClientName = (doc.clientCompany || doc.clientName || 'Client').replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
    const pdfFileName = `${doc.number}_${cleanClientName}.pdf`;

    // Create temporary off-screen container for crisp A4 PDF conversion
    const container = document.createElement('div');
    container.id = 'temp-pdf-export-container';
    container.style.position = 'fixed';
    container.style.left = '-99999px';
    container.style.top = '0';
    container.style.width = '210mm';
    container.style.background = '#ffffff';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    const opt = {
      margin: 0,
      filename: pdfFileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      },
      pagebreak: { mode: ['css', 'legacy'] },
    };

    try {
      const sheets = container.querySelectorAll('.a4-sheet');
      const target = sheets.length === 1 ? sheets[0] : container;

      await (html2pdf as any)().set(opt).from(target).save();

      // Cloud Sync to Google Drive
      setIsDriveUploading(true);
      const subfolderName = getSubfolderNameForDocType(doc.type);
      setDriveNotification({
        status: 'uploading',
        message: `PDF téléchargé ! Envoi automatique vers Google Drive (Dossier : hafsi prod / ${subfolderName})...`,
      });

      autoUploadDocumentToDrive(doc, htmlContent)
        .then((res) => {
          setIsDriveUploading(false);
          if (res.success) {
            setDriveNotification({
              status: 'success',
              message: `Document synchronisé sur Google Drive dans "${res.folderName}" !`,
              link: res.driveLink,
              folderName: res.folderName,
            });
            if (!doc.checklist.driveSaved) {
              const updated = {
                ...doc,
                checklist: {
                  ...doc.checklist,
                  driveSaved: true,
                },
              };
              onSaveDocument(updated);
            }
          } else {
            setDriveNotification({
              status: 'error',
              message: `Téléchargement PDF OK. Synchronisation Drive : ${res.message}`,
            });
          }
        })
        .catch((err) => {
          setIsDriveUploading(false);
          setDriveNotification({
            status: 'error',
            message: `Téléchargement PDF OK. Drive indisponible (${err.message}).`,
          });
        });
    } catch (err: any) {
      console.error('Erreur génération PDF avec html2pdf:', err);
      try {
        const printableDom = document.querySelector('.printable-document');
        if (printableDom) {
          await (html2pdf as any)().set(opt).from(printableDom).save();
        } else {
          handlePrint();
        }
      } catch (fallbackErr) {
        handlePrint();
      }
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      setIsExportingPdf(false);
    }
  };

  // Export document as high-fidelity standalone A4 HTML file (Optional secondary export)
  const handleExportHtml = (doc: DocumentData) => {
    const htmlContent = generateDocumentHtmlString(doc);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.number}_${(doc.clientCompany || doc.clientName).replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Manual Google Drive sync button handler (Full High-Resolution Document Upload)
  const handleManualDriveUpload = async (doc: DocumentData) => {
    setIsDriveUploading(true);
    const subfolderName = getSubfolderNameForDocType(doc.type);
    setDriveNotification({
      status: 'uploading',
      message: `Connexion & synchronisation avec Google Drive (Dossier : hafsi prod / ${subfolderName})...`,
    });

    try {
      const fullHtmlContent = generateDocumentHtmlString(doc);
      const res = await autoUploadDocumentToDrive(doc, fullHtmlContent);

      setIsDriveUploading(false);
      if (res.success) {
        setDriveNotification({
          status: 'success',
          message: `Document synchronisé sur Google Drive dans "${res.folderName}" !`,
          link: res.driveLink,
          folderName: res.folderName,
        });
        if (!doc.checklist.driveSaved) {
          onSaveDocument({
            ...doc,
            checklist: { ...doc.checklist, driveSaved: true },
          });
        }
      } else {
        setDriveNotification({
          status: 'error',
          message: `Notice Google Drive : ${res.message}`,
        });
      }
    } catch (err: any) {
      setIsDriveUploading(false);
      setDriveNotification({
        status: 'error',
        message: err.message || 'Erreur lors du transfert vers Google Drive.',
      });
    }
  };

  // WhatsApp Smart Share: Opens WhatsApp Web on PC, native WhatsApp App on Mobile/Smartphone
  const handleWhatsAppShare = (doc: DocumentData) => {
    const client = clients.find((c) => c.id === doc.clientId);
    const clientPhone = doc.clientPhone || client?.phone || '';
    const cleanPhone = clientPhone.replace(/[^0-9+]/g, '').replace(/^0/, '212');
    const totalTTC = getDocTotalTTC(doc).toLocaleString('fr-MA');
    const typeTitle = doc.type === 'DEVIS' ? 'Devis' : doc.type === 'FACTURE_ACOMPTE' ? "Facture d'Acompte" : doc.type === 'BON_LIVRAISON' ? 'Bon de Livraison' : 'Facture';

    let acompteMAD = '';
    if (doc.type === 'DEVIS' && doc.acompteRate && doc.acompteRate > 0) {
      const acAmount = (getDocTotalTTC(doc) * doc.acompteRate) / 100;
      acompteMAD = `\n• *Acompte (${doc.acompteRate}%) :* ${acAmount.toLocaleString('fr-MA')} MAD`;
    }

    const itemsSummary = doc.items.map((i) => `  • ${i.description} (${i.quantity}x)`).join('\n');

    const message = `*${profile.filmmakerName.toUpperCase()} — HAFSI PROD STUDIO*\n` +
      `Bonjour ${doc.clientName},\n\n` +
      `Voici les détails de votre *${typeTitle} N° ${doc.number}* pour *${doc.clientCompany || 'votre projet'}* :\n` +
      `${itemsSummary}\n\n` +
      `• *Montant Total TTC :* ${totalTTC} MAD${acompteMAD}\n` +
      `• *Validité de l'offre :* 30 jours\n` +
      `• *RIB Attijariwafa Bank :* ${profile.rib}\n\n` +
      `📄 _Le document officiel complet sous format PDF est prêt et vous est transmis ci-joint._\n\n` +
      `Restant à votre entière disposition pour planifier le tournage.\n` +
      `Bien cordialement,\n*${profile.filmmakerName}* | ${profile.title}\nTél : ${profile.phone}`;

    // Detect mobile device
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (typeof window !== 'undefined' && window.innerWidth < 768);

    // Copy to clipboard for easy manual paste
    navigator.clipboard?.writeText(message);

    if (isMobile) {
      // Mobile app protocol
      const appUrl = cleanPhone
        ? `whatsapp://send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(message)}`
        : `whatsapp://send?text=${encodeURIComponent(message)}`;
      
      const fallbackUrl = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(message)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

      window.location.href = appUrl;
      setTimeout(() => {
        window.open(fallbackUrl, '_blank');
      }, 1200);
    } else {
      // Desktop PC Web URL
      const webUrl = cleanPhone
        ? `https://web.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(message)}`
        : `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(webUrl, '_blank');
    }
  };

  const handleCopyWhatsAppSummary = handleWhatsAppShare;

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
    setFormShootingDate('');

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

    // Defaults for technical scope - strictly optional
    setFormHasProductionSpecs(false);
    setFormDeliverables('');
    setFormRevisionsAllowed(2);
    setFormExtraRevisionRate(500);
    setFormCrewAssigned('');
    setFormGearDeployed('');
    setFormIncludeLegalClauses(true);
    setFormCustomClauses('');

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
      hasProductionSpecs: formHasProductionSpecs,
      deliverables: formHasProductionSpecs ? (formDeliverables || undefined) : undefined,
      revisionsAllowed: formHasProductionSpecs ? (formRevisionsAllowed || 2) : 2,
      extraRevisionRate: formHasProductionSpecs ? (formExtraRevisionRate || 500) : 500,
      crewAssigned: formHasProductionSpecs ? (formCrewAssigned || undefined) : undefined,
      gearDeployed: formHasProductionSpecs ? (formGearDeployed || undefined) : undefined,
      includeLegalClauses: formIncludeLegalClauses,
      customClauses: formCustomClauses || undefined,
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl shadow-xl shadow-black/20">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-1.5">
            <FileText className="w-4 h-4" /> Module 1 • Conforme Normes Marocaines (ICE/IF/TP)
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Générateur de Devis & Factures</h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Éditez des documents professionnels, suivez les acomptes, la TVA à 20% et l'automatisation du suivi client.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenCreateForm('DEVIS')}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nouveau Devis
          </button>
          <button
            onClick={() => handleOpenCreateForm('FACTURE')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nouvelle Facture
          </button>
          <button
            onClick={() => handleOpenCreateForm('FACTURE_ACOMPTE')}
            className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4 text-amber-400" /> Facture d'Acompte
          </button>
          <button
            onClick={() => handleOpenCreateForm('BON_LIVRAISON')}
            className="px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
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
                    setFormShootingDate(selectedDocument.shootingDate || '');
                    setFormClientId(selectedDocument.clientId);
                    setFormClientName(selectedDocument.clientName);
                    setFormClientCompany(selectedDocument.clientCompany);
                    setFormClientIce(selectedDocument.clientIce);
                    setFormClientAddress(selectedDocument.clientAddress);
                    setFormItems(selectedDocument.items);
                    setFormTvaRate(selectedDocument.tvaRate);
                    setFormAcompteRate(selectedDocument.acompteRate);
                    setFormNotes(selectedDocument.notes || '');
                    const hasSpecs = selectedDocument.hasProductionSpecs ?? Boolean(selectedDocument.deliverables || selectedDocument.crewAssigned || selectedDocument.gearDeployed);
                    setFormHasProductionSpecs(hasSpecs);
                    setFormDeliverables(selectedDocument.deliverables || '');
                    setFormRevisionsAllowed(selectedDocument.revisionsAllowed ?? 2);
                    setFormExtraRevisionRate(selectedDocument.extraRevisionRate ?? 500);
                    setFormCrewAssigned(selectedDocument.crewAssigned || '');
                    setFormGearDeployed(selectedDocument.gearDeployed || '');
                    setFormIncludeLegalClauses(selectedDocument.includeLegalClauses !== false);
                    setFormCustomClauses(selectedDocument.customClauses || '');
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
                    onClick={() => handleExportPdf(selectedDocument)}
                    disabled={isExportingPdf}
                    className="px-3.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-extrabold text-xs rounded-xl border border-emerald-700/80 transition-all flex items-center gap-1.5 cursor-pointer no-print shadow-sm"
                    title="Télécharger le document en format PDF A4 + Synchroniser automatiquement sur Google Drive"
                  >
                    {isExportingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    {isExportingPdf ? 'Génération PDF...' : 'Télécharger (PDF)'}
                  </button>

                  <button
                    onClick={() => handleManualDriveUpload(selectedDocument)}
                    disabled={isDriveUploading}
                    className={`px-3.5 py-1.5 font-bold text-xs rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer no-print shadow-sm ${
                      isDriveUploading
                        ? 'bg-amber-950/60 border-amber-800 text-amber-300 animate-pulse'
                        : selectedDocument.checklist?.driveSaved
                        ? 'bg-sky-950/80 hover:bg-sky-900 text-sky-300 border-sky-700/80'
                        : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700'
                    }`}
                    title="Sauvegarder dans Google Drive (hafsi prod)"
                  >
                    <CloudUpload className="w-3.5 h-3.5 text-sky-400" />
                    {isDriveUploading ? 'Envoi Drive...' : selectedDocument.checklist?.driveSaved ? 'Drive Synchronisé ✓' : 'Google Drive'}
                  </button>

                  <button
                    onClick={() => handleCopyWhatsAppSummary(selectedDocument)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1 cursor-pointer no-print"
                    title="Partager le résumé sur WhatsApp"
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

              {/* Technical Production Scope & Legal Shield (Strictly Optional for Devis) */}
              {formType === 'DEVIS' && (
                <div className={`p-4 border rounded-xl space-y-4 transition-all ${
                  formHasProductionSpecs
                    ? 'bg-slate-950/90 border-amber-500/40 shadow-inner'
                    : 'bg-slate-950/40 border-slate-800'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !formHasProductionSpecs;
                          setFormHasProductionSpecs(nextState);
                          if (nextState && !formDeliverables && !formCrewAssigned && !formGearDeployed) {
                            setFormDeliverables('1 Master Vidéo 4K 16:9 + 2 Déclinaisons 9:16 (Reels/TikTok) + Fichiers .SRT sous-titres');
                            setFormCrewAssigned('1 Réalisateur / Cadreur FX6 + 1 Ingénieur du son / Assistant');
                            setFormGearDeployed('Pack Caméra Cinéma Sony FX6/FX3, Optiques GM, Gimbal DJI RS3 Pro, Kit Éclairage Aputure, Kit Son HF Sennheiser');
                          }
                        }}
                        className={`p-1 rounded-full transition-colors cursor-pointer flex items-center ${
                          formHasProductionSpecs ? 'text-amber-400' : 'text-slate-500'
                        }`}
                      >
                        {formHasProductionSpecs ? <ToggleRight className="w-7 h-7 text-amber-400" /> : <ToggleLeft className="w-7 h-7 text-slate-500" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                          <Video className="w-4 h-4" /> Spécifications Techniques &amp; Cadrage de Production
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {formHasProductionSpecs
                            ? 'Option activée : Les détails (livrable exact, équipe, matériel) apparaîtront sur le devis.'
                            : 'Option désactivée (Standard) : Le devis reste synthétique sans tableau technique de production.'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {formHasProductionSpecs ? (
                        <button
                          type="button"
                          onClick={() => {
                            setFormHasProductionSpecs(false);
                            setFormDeliverables('');
                            setFormCrewAssigned('');
                            setFormGearDeployed('');
                          }}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-bold bg-rose-950/30 px-2 py-1 rounded border border-rose-800/40 cursor-pointer"
                        >
                          Désactiver &amp; Effacer
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setFormHasProductionSpecs(true);
                            setFormDeliverables('1 Master Vidéo 4K 16:9 + 2 Déclinaisons 9:16 (Reels/TikTok) + Fichiers .SRT sous-titres');
                            setFormCrewAssigned('1 Réalisateur / Cadreur FX6 + 1 Ingénieur du son / Assistant');
                            setFormGearDeployed('Pack Caméra Cinéma Sony FX6/FX3, Optiques GM, Gimbal DJI RS3 Pro, Kit Éclairage Aputure, Kit Son HF Sennheiser');
                          }}
                          className="text-[10px] text-amber-300 font-bold bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/30 cursor-pointer flex items-center gap-1"
                        >
                          + Ajouter le Cadrage Technique
                        </button>
                      )}
                    </div>
                  </div>

                  {formHasProductionSpecs && (
                    <div className="space-y-2 pt-1">
                      {presetFeedback && (
                        <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg flex items-center gap-2 animate-fade-in font-bold">
                          <Check className="w-4 h-4 text-emerald-400" />
                          {presetFeedback}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* 1. Livrables & Revisions */}
                        <div className="space-y-2 bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-amber-400" /> Livrable Exact &amp; Formats
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setManageModalPillar('deliverables');
                                  setEditingPresetIdx(null);
                                  setNewPresetValue('');
                                }}
                                className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1 hover:bg-slate-800 px-1.5 py-0.5 rounded transition-colors"
                                title="Modifier, ajouter ou supprimer des options"
                              >
                                <Settings2 className="w-3 h-3" /> Gérer
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              value={formDeliverables}
                              onChange={(e) => setFormDeliverables(e.target.value)}
                              placeholder="Ex: 1 Master 4K 16:9 + 2 Reels 9:16 + Fichiers .SRT sous-titrés..."
                              className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-lg focus:border-amber-500"
                            />
                            {formDeliverables && !deliverablePresets.includes(formDeliverables.trim()) && (
                              <button
                                type="button"
                                onClick={() => handleSaveCurrentAsPreset('deliverables', formDeliverables)}
                                className="text-[9.5px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 px-2 py-1 rounded flex items-center gap-1 w-full justify-center"
                              >
                                <Save className="w-3 h-3" /> Sauvegarder comme option permanente
                              </button>
                            )}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold">Révisions incluses</label>
                                <select
                                  value={formRevisionsAllowed}
                                  onChange={(e) => setFormRevisionsAllowed(Number(e.target.value))}
                                  className="w-full bg-slate-950 border border-slate-800 text-xs text-amber-300 p-1.5 rounded font-bold"
                                >
                                  <option value={1}>1 session max</option>
                                  <option value={2}>2 sessions (Recommandé)</option>
                                  <option value={3}>3 sessions</option>
                                  <option value={4}>4 sessions</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold">Heure suppl. (DH HT)</label>
                                <input
                                  type="number"
                                  value={formExtraRevisionRate}
                                  onChange={(e) => setFormExtraRevisionRate(Number(e.target.value) || 0)}
                                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-1.5 rounded font-mono font-bold"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
                            <span className="text-[9.5px] text-slate-400 font-semibold block">Options enregistrées :</span>
                            <div className="flex flex-wrap gap-1">
                              {deliverablePresets.map((chip, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setFormDeliverables(chip)}
                                  className={`text-[9.5px] px-2 py-1 rounded border transition-all text-left truncate max-w-full ${
                                    formDeliverables === chip
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                                  }`}
                                  title={chip}
                                >
                                  + {chip.length > 32 ? chip.substring(0, 32) + '...' : chip}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 2. Equipe Mobilisee */}
                        <div className="space-y-2 bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-sky-400" /> Équipe à Mobiliser
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setManageModalPillar('crew');
                                  setEditingPresetIdx(null);
                                  setNewPresetValue('');
                                }}
                                className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1 hover:bg-slate-800 px-1.5 py-0.5 rounded transition-colors"
                                title="Modifier, ajouter ou supprimer des configurations d'équipe"
                              >
                                <Settings2 className="w-3 h-3" /> Gérer
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              value={formCrewAssigned}
                              onChange={(e) => setFormCrewAssigned(e.target.value)}
                              placeholder="Ex: 1 Réalisateur / Cadreur FX6, 1 Ingénieur du son, 1 Chef opérateur..."
                              className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-lg focus:border-amber-500"
                            />
                            {formCrewAssigned && !crewPresets.includes(formCrewAssigned.trim()) && (
                              <button
                                type="button"
                                onClick={() => handleSaveCurrentAsPreset('crew', formCrewAssigned)}
                                className="text-[9.5px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 px-2 py-1 rounded flex items-center gap-1 w-full justify-center"
                              >
                                <Save className="w-3 h-3" /> Sauvegarder comme option permanente
                              </button>
                            )}
                          </div>
                          <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
                            <span className="text-[9.5px] text-slate-400 font-semibold block">Options enregistrées :</span>
                            <div className="flex flex-wrap gap-1">
                              {crewPresets.map((chip, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setFormCrewAssigned(chip)}
                                  className={`text-[9.5px] px-2 py-1 rounded border transition-all text-left truncate max-w-full ${
                                    formCrewAssigned === chip
                                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold'
                                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                                  }`}
                                  title={chip}
                                >
                                  + {chip.length > 32 ? chip.substring(0, 32) + '...' : chip}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 3. Materiel Deploye */}
                        <div className="space-y-2 bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5 text-purple-400" /> Matériel à Déployer
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setManageModalPillar('gear');
                                  setEditingPresetIdx(null);
                                  setNewPresetValue('');
                                }}
                                className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1 hover:bg-slate-800 px-1.5 py-0.5 rounded transition-colors"
                                title="Modifier, ajouter ou supprimer des kits de tournage"
                              >
                                <Settings2 className="w-3 h-3" /> Gérer
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              value={formGearDeployed}
                              onChange={(e) => setFormGearDeployed(e.target.value)}
                              placeholder="Ex: Sony FX6 Cinema Line, Objectifs GM, Gimbal DJI RS3, Kit Aputure 600d, Micros HF..."
                              className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-lg focus:border-amber-500"
                            />
                            {formGearDeployed && !gearPresets.includes(formGearDeployed.trim()) && (
                              <button
                                type="button"
                                onClick={() => handleSaveCurrentAsPreset('gear', formGearDeployed)}
                                className="text-[9.5px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 px-2 py-1 rounded flex items-center gap-1 w-full justify-center"
                              >
                                <Save className="w-3 h-3" /> Sauvegarder comme option permanente
                              </button>
                            )}
                          </div>
                          <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
                            <span className="text-[9.5px] text-slate-400 font-semibold block">Options enregistrées :</span>
                            <div className="flex flex-wrap gap-1">
                              {gearPresets.map((chip, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setFormGearDeployed(chip)}
                                  className={`text-[9.5px] px-2 py-1 rounded border transition-all text-left truncate max-w-full ${
                                    formGearDeployed === chip
                                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold'
                                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                                  }`}
                                  title={chip}
                                >
                                  + {chip.length > 32 ? chip.substring(0, 32) + '...' : chip}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Legal Clauses & Protection Annex Toggle */}
                  <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIncludeLegalClauses}
                        onChange={(e) => setFormIncludeLegalClauses(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Générer l&apos;Annexe Page 2 : Conditions Générales &amp; Protection Juridique (Anti-Scope Creep, Acompte, Droits d&apos;auteur &amp; RAW)
                      </span>
                    </label>

                    {formIncludeLegalClauses && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        ✓ Annexe 5 clauses activée
                      </span>
                    )}
                  </div>

                  {formIncludeLegalClauses && (
                    <div className="space-y-1">
                      <label className="block text-[10.5px] text-slate-400 font-bold">
                        Clauses particulières additionnelles (Optionnel) :
                      </label>
                      <input
                        type="text"
                        value={formCustomClauses}
                        onChange={(e) => setFormCustomClauses(e.target.value)}
                        placeholder="Ex: Autorisation de diffusion préalable accordée pour festival, transport pris en charge par le client..."
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Financial Calculations Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 border border-slate-800 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Taux TVA marocain</label>
                  <select
                    value={formTvaRate}
                    onChange={(e) => setFormTvaRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2 rounded-lg"
                  >
                    <option value={20}>20% (Standard SARL / Régime général)</option>
                    <option value={2}>2% (Taux spécifique 2%)</option>
                    <option value={1}>1% (Taux réduit 1% / Auto-entrepreneur)</option>
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
              {/* Google Drive Status Banner */}
              {driveNotification.status !== 'idle' && (
                <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-bold transition-all ${
                  driveNotification.status === 'uploading'
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                    : driveNotification.status === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <Cloud className={`w-4 h-4 flex-shrink-0 ${driveNotification.status === 'uploading' ? 'animate-bounce text-amber-400' : 'text-emerald-400'}`} />
                    <span>{driveNotification.message}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {driveNotification.link && (
                      <a
                        href={driveNotification.link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-[11px] font-black flex items-center gap-1"
                      >
                        Ouvrir sur Drive <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setDriveNotification({ status: 'idle', message: '' })}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {selectedDocument ? (
                <div className="relative flex flex-col lg:flex-row items-start gap-4">
                  {/* Document Canvas (Centered with fluid responsive scaling) */}
                  <div className="flex-1 w-full overflow-x-auto overflow-y-visible p-1 sm:p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex justify-center shadow-inner min-h-[500px]">
                    <div
                      style={{
                        transform: `scale(${zoomScale})`,
                        transformOrigin: 'top center',
                        width: '794px',
                        marginBottom: `${Math.max(0, (zoomScale - 1) * 1150)}px`,
                        transition: 'transform 0.15s ease-out',
                      }}
                      className="shrink-0"
                    >
                      <DocumentPreview document={selectedDocument} profile={profile} />
                    </div>
                  </div>

                  {/* Right-Side Affichage Document Panel */}
                  <div className="w-full lg:w-52 shrink-0 lg:sticky lg:top-4 space-y-3 no-print">
                    <div className="bg-slate-900/95 border border-slate-800 p-3.5 rounded-2xl shadow-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-[11px] font-black text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <Eye className="w-3.5 h-3.5" /> Affichage A4
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {Math.round(zoomScale * 100)}%
                        </span>
                      </div>

                      {/* Auto-Fit Button */}
                      <button
                        type="button"
                        onClick={handleAutoFitZoom}
                        className="w-full py-1.5 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Adapter automatiquement la taille du document à votre écran"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Adapter à l'écran (Auto-Fit)</span>
                      </button>

                      {/* Zoom Presets Buttons */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Échelle du Document :</span>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setZoomScale(0.45)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                              zoomScale === 0.45
                                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                            }`}
                          >
                            <span>45%</span>
                            <span className="text-[10px] opacity-80">Page Entière</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setZoomScale(0.60)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                              zoomScale === 0.60
                                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                            }`}
                          >
                            <span>60%</span>
                            <span className="text-[10px] opacity-70">Compact</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setZoomScale(0.75)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                              zoomScale === 0.75
                                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                            }`}
                          >
                            <span>75%</span>
                            <span className="text-[10px] opacity-70">Aperçu Bureau</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setZoomScale(0.9)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                              zoomScale === 0.9
                                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                            }`}
                          >
                            <span>90%</span>
                            <span className="text-[10px] opacity-70">Confort</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setZoomScale(1)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                              zoomScale === 1
                                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                            }`}
                          >
                            <span>100%</span>
                            <span className="text-[10px] font-extrabold text-amber-400">A4 Réel</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setZoomScale(1.15)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                              zoomScale === 1.15
                                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                            }`}
                          >
                            <span>115%</span>
                            <span className="text-[10px] opacity-70">Détails HD</span>
                          </button>
                        </div>
                      </div>

                      {/* Step Zoom (+ / -) */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setZoomScale((prev) => Math.max(0.35, Number((prev - 0.1).toFixed(2))))}
                          className="flex-1 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white font-black text-xs rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Zoom arrière (-10%)"
                        >
                          <ZoomOut className="w-3.5 h-3.5" /> -
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomScale(1)}
                          className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400 font-mono text-[10px] rounded-xl border border-slate-800 transition-all cursor-pointer"
                          title="Réinitialiser à 100%"
                        >
                          1:1
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomScale((prev) => Math.min(1.5, Number((prev + 0.1).toFixed(2))))}
                          className="flex-1 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white font-black text-xs rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Zoom avant (+10%)"
                        >
                          <ZoomIn className="w-3.5 h-3.5" /> +
                        </button>
                      </div>

                      {/* Quick Print & Export Buttons inside Right Sidebar */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <button
                          type="button"
                          onClick={handlePrint}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-600 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" /> Imprimer / PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportPdf(selectedDocument)}
                          disabled={isExportingPdf}
                          className="w-full py-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-700/80 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          {isExportingPdf ? (
                            <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          {isExportingPdf ? 'Export PDF...' : 'Télécharger (PDF)'}
                        </button>
                      </div>

                      {/* Format Info Note */}
                      <div className="pt-2 border-t border-slate-800/80 text-center">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Format A4 Standard (210 × 297 mm)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 p-12 text-center text-slate-400 rounded-2xl">
                  Sélectionnez ou créez un document pour afficher la prévisualisation.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Email Brief Generator Modal (With full detailed items and legal clauses) */}
      {showEmailModal && selectedDocument && (() => {
        const totalHT = selectedDocument.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discountPercent || 0) / 100), 0);
        const tvaRate = selectedDocument.tvaRate ?? 20;
        const tvaAmount = (totalHT * tvaRate) / 100;
        const totalTTC = totalHT + tvaAmount;
        const acompteRate = selectedDocument.acompteRate || 40;
        const acompteAmount = (totalTTC * acompteRate) / 100;
        const formatMAD = (n: number) => n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const docTitle = selectedDocument.type === 'DEVIS' ? 'Devis' : selectedDocument.type === 'FACTURE_ACOMPTE' ? "Facture d'Acompte" : selectedDocument.type === 'BON_LIVRAISON' ? 'Bon de Livraison' : 'Facture';

        const itemsText = selectedDocument.items
          .map((item, idx) => `  ${idx + 1}. ${item.description} — ${item.quantity} x ${formatMAD(item.unitPrice)} MAD HT = ${formatMAD(item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100))} MAD HT`)
          .join('\n');

        const emailSubject = `${docTitle} N° ${selectedDocument.number} - ${profile.filmmakerName} (${selectedDocument.clientCompany || selectedDocument.clientName})`;

        const fullEmailBody = `Bonjour ${selectedDocument.clientName},

J'espère que vous allez bien.

Suite à nos échanges concernant votre projet audiovisuel pour ${selectedDocument.clientCompany || 'votre société'}, vous trouverez ci-joint notre ${docTitle.toLowerCase()} officiel N° ${selectedDocument.number}.

==================================================
📋 DÉTAIL DES PRESTATIONS CHIFFRÉES :
==================================================
${itemsText}

--------------------------------------------------
💰 RÉCAPITULATIF FINANCIER :
--------------------------------------------------
• Total Brut HT : ${formatMAD(totalHT)} MAD
• TVA (${tvaRate}%) : ${formatMAD(tvaAmount)} MAD
• TOTAL NET TTC : ${formatMAD(totalTTC)} MAD
• Acompte de réservation (${acompteRate}%) : ${formatMAD(acompteAmount)} MAD

💳 COORDONNÉES BANCAIRES POUR VIREMENT :
• Banque : Attijariwafa Bank
• Titulaire : ${profile.filmmakerName} (SARL AU)
• RIB : ${profile.rib}

${selectedDocument.hasProductionSpecs ? `==================================================
🎬 SPÉCIFICATIONS TECHNIQUES DE PRODUCTION :
==================================================
${selectedDocument.deliverables ? `• Livrables : ${selectedDocument.deliverables}\n` : ''}${selectedDocument.crewAssigned ? `• Équipe affectée : ${selectedDocument.crewAssigned}\n` : ''}${selectedDocument.gearDeployed ? `• Matériel déployé : ${selectedDocument.gearDeployed}\n` : ''}` : ''}
${selectedDocument.includeLegalClauses !== false ? `==================================================
⚖️ CLAUSES CONTRACTUELLES & DROIT MAROCAIN :
==================================================
1. RÉGIME DES ACOMPTES (Art. 288 & 723 D.O.C.) : La réservation ferme du planning studio et la mobilisation des techniciens sont subordonnées au règlement de l'acompte de ${acompteRate}% TTC et au retour du devis avec mention manuscrite « Bon pour accord », cachet commercial et ICE (${selectedDocument.clientIce || 'à mentionner'}).
2. CESSION DE DROITS (Loi 2-00 / 34-05) : La cession des droits patrimoniaux d'exploitation est strictement subordonnée au paiement intégral et effectif de la facture TTC. Les droits moraux du réalisateur demeurent inaliénables.
3. RUSHES RAW & PROJETS : Les rushes vidéo bruts (RAW/LOG) et projets de montage (DaVinci/Premiere) demeurent la propriété intellectuelle exclusive du réalisateur. Le livrable correspond au master final étalonné.
4. CADRAGE DES RÉVISIONS : Le devis comprend ${selectedDocument.revisionsAllowed ?? 2} session(s) de retouches mineures sous 15 jours. Au-delà, facturation au taux horaire de ${selectedDocument.extraRevisionRate ?? 500} MAD HT/heure.
5. REPORT & DROIT À L'IMAGE (Loi 09-08 CNDP) : Tout report à moins de 72h entraîne l'acquisition de l'acompte (art. 269 D.O.C.). Le client garantit disposer des autorisations d'image des personnes et lieux filmés. Compétence : Tribunal de Commerce.
${selectedDocument.customClauses ? `6. CLAUSES PARTICULIÈRES : ${selectedDocument.customClauses}\n` : ''}` : ''}
Pour confirmer la réservation dans notre planning studio, merci de nous retourner ce document revêtu de votre mention manuscrite « Bon pour Accord », date et cachet commercial avec ICE.

Restant à votre entière disposition pour toute question.

Bien cordialement,
--
${profile.filmmakerName}
${profile.title} — Hafsi Prod Studio
Tél : ${profile.phone} | ICE : ${profile.ice}
${profile.websiteUrl}`;

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full max-h-[90vh] flex flex-col p-5 sm:p-6 rounded-2xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-400" /> Modèle d'Email Brief Client & Clauses ({selectedDocument.number})
                </h3>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 space-y-3 border border-slate-800 select-all overflow-y-auto flex-1 max-h-[60vh]">
                <p>
                  <strong className="text-amber-400">Objet :</strong> {emailSubject}
                </p>
                <hr className="border-slate-800" />
                <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                  {fullEmailBody}
                </pre>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(fullEmailBody);
                    alert('✓ Email complet (avec détail des prestations et clauses) copié dans le presse-papier !');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <Copy className="w-4 h-4" /> Copier l'Email complet (avec Clauses)
                </button>
                <a
                  href={`mailto:${selectedDocument.clientEmail || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(fullEmailBody)}`}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700"
                >
                  <Send className="w-4 h-4 text-sky-400" /> Ouvrir dans le logiciel Mail
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Preset Manager Modal (Allows editing, adding, and deleting options for the 3 pillars) */}
      {manageModalPillar && (() => {
        const title =
          manageModalPillar === 'deliverables'
            ? 'Livrable Exact & Formats'
            : manageModalPillar === 'crew'
            ? 'Équipe à Mobiliser'
            : 'Matériel à Déployer';

        const currentList =
          manageModalPillar === 'deliverables'
            ? deliverablePresets
            : manageModalPillar === 'crew'
            ? crewPresets
            : gearPresets;

        const updateList = (newList: string[]) => {
          if (manageModalPillar === 'deliverables') saveDeliverablePresets(newList);
          else if (manageModalPillar === 'crew') saveCrewPresets(newList);
          else if (manageModalPillar === 'gear') saveGearPresets(newList);
        };

        const handleAddPreset = () => {
          const trimmed = newPresetValue.trim();
          if (!trimmed) return;
          if (!currentList.includes(trimmed)) {
            updateList([...currentList, trimmed]);
          }
          setNewPresetValue('');
        };

        const handleSaveEdit = (index: number) => {
          const trimmed = editingPresetValue.trim();
          if (!trimmed) return;
          const updated = [...currentList];
          updated[index] = trimmed;
          updateList(updated);
          setEditingPresetIdx(null);
          setEditingPresetValue('');
        };

        const handleDeletePreset = (index: number) => {
          const updated = currentList.filter((_, i) => i !== index);
          updateList(updated);
        };

        const handleResetDefaults = () => {
          if (confirm('Voulez-vous restaurer les options par défaut pour cette section ?')) {
            if (manageModalPillar === 'deliverables') saveDeliverablePresets(DEFAULT_DELIVERABLE_PRESETS);
            else if (manageModalPillar === 'crew') saveCrewPresets(DEFAULT_CREW_PRESETS);
            else if (manageModalPillar === 'gear') saveGearPresets(DEFAULT_GEAR_PRESETS);
          }
        };

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 max-w-xl w-full max-h-[85vh] flex flex-col p-5 sm:p-6 rounded-2xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                    Gestionnaire d'options : {title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modifiez, ajoutez ou supprimez vos options prédéfinies pour les futurs devis.
                  </p>
                </div>
                <button
                  onClick={() => setManageModalPillar(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add New Preset Input */}
              <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Ajouter une nouvelle option
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPresetValue}
                    onChange={(e) => setNewPresetValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPreset()}
                    placeholder={`Ex: Nouvelle configuration pour ${title.toLowerCase()}...`}
                    className="flex-1 bg-slate-900 border border-slate-800 text-xs text-white p-2 rounded-lg focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddPreset}
                    disabled={!newPresetValue.trim()}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 shadow cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" /> Ajouter
                  </button>
                </div>
              </div>

              {/* List of current presets */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[45vh]">
                {currentList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/70 border border-slate-800/90 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    {editingPresetIdx === idx ? (
                      <div className="flex-1 flex gap-2 items-center">
                        <input
                          type="text"
                          value={editingPresetValue}
                          onChange={(e) => setEditingPresetValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(idx)}
                          className="flex-1 bg-slate-900 border border-amber-500 text-xs text-white p-1.5 rounded-lg"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(idx)}
                          className="p-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-emerald-400"
                          title="Valider la modification"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPresetIdx(null);
                            setEditingPresetValue('');
                          }}
                          className="p-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700"
                          title="Annuler"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-slate-200 font-medium flex-1 break-words">
                          {item}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPresetIdx(idx);
                              setEditingPresetValue(item);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Modifier cette option"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePreset(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Supprimer cette option"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {currentList.length === 0 && (
                  <div className="text-center py-6 text-slate-500 text-xs italic">
                    Aucune option enregistrée pour le moment.
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurer options par défaut
                </button>
                <button
                  type="button"
                  onClick={() => setManageModalPillar(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

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
  ToggleRight
} from 'lucide-react';
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

  // Optional Production Technical Details (Devis) - Strictly Optional Toggle
  const [formHasProductionSpecs, setFormHasProductionSpecs] = useState<boolean>(false);
  const [formDeliverables, setFormDeliverables] = useState<string>('');
  const [formRevisionsAllowed, setFormRevisionsAllowed] = useState<number>(2);
  const [formExtraRevisionRate, setFormExtraRevisionRate] = useState<number>(500);
  const [formCrewAssigned, setFormCrewAssigned] = useState<string>('');
  const [formGearDeployed, setFormGearDeployed] = useState<string>('');
  const [formIncludeLegalClauses, setFormIncludeLegalClauses] = useState<boolean>(true);
  const [formCustomClauses, setFormCustomClauses] = useState<string>('');

  // Responsive Zoom & Preview Controls
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [previewPageView, setPreviewPageView] = useState<'all' | 'page1' | 'page2'>('all');

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

  // Export document as high-fidelity standalone A4 file for PC & Mobile
  const handleExportHtml = (doc: DocumentData) => {
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

    const TOTAL_GRID_ROWS = doc.type === 'DEVIS' ? (hasTechnicalSpecs ? 3 : 4) : 5;
    const fillerRowCount = Math.max(0, TOTAL_GRID_ROWS - doc.items.length);

    const htmlContent = `<!DOCTYPE html>
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
            ${doc.type === 'FACTURE' && doc.dueDate ? `<div class="term-pill">PAYABLE AU PLUS TARD LE : ${doc.dueDate}</div>` : ''}
            ${doc.type === 'DEVIS' ? `<div class="term-pill">DEVIS VALABLE 30 JOURS</div>` : ''}
            ${doc.type !== 'BON_LIVRAISON' ? `
              <div>
                <div class="term-pill">PAIEMENT :</div>
                <div style="margin-top:2px;">Par virement bancaire<br><strong style="font-family:monospace;font-size:12px;">RIB : ${profile.rib || '230 780 3612259211026800 41'}</strong></div>
              </div>
              ${doc.type === 'DEVIS' ? `
                <div style="margin-top:4px;">
                  <div class="term-pill">ÉCHÉANCIER :</div>
                  <div>40% à la commande (acompte bloquant le tournage)<br>60% à la livraison finale</div>
                </div>
                <div style="margin-top:6px;padding:7px 9px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:4px;font-size:10.5px;">
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
                <strong>PROCÈS-VERBAL DE RÉCEPTION & VALIDATION :</strong><br>
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
            <div class="annex-clause-title">1. VALIDATION DU DEVIS, ACOMPTE &amp; CALENDRIER DE TOURNAGE</div>
            <div>
              La réservation définitive des dates de tournage et la mobilisation des équipes et matériels ne sont effectives qu'à réception du présent devis revêtu de la mention <em>« Bon pour accord »</em>, du cachet commercial avec ICE du client, et du règlement de l'acompte de <strong>40%</strong>. Le solde de 60% est exigible à la livraison des fichiers finaux avant remise des masters haute définition sans filigrane.
            </div>
          </div>

          <div class="annex-clause">
            <div class="annex-clause-title">2. PÉRIMÈTRE DES MODIFICATIONS &amp; ANTI « SCOPE CREEP »</div>
            <div>
              Le montant forfaitaire convenu inclut strictement <strong>${revisionsCount} session(s) d'allers-retours de modifications mineures</strong> (ajustement de rythme, titrage, colorimétrie ou remplacement de plans tournés). Toute demande de modification majeure remettant en cause le scénario validé, un tournage additionnel ou des révisions au-delà des ${revisionsCount} sessions incluses fera l'objet d'une facturation complémentaire au tarif horaire de <strong>${extraRate} MAD HT / heure</strong> ou d'un avenant chiffré.
            </div>
          </div>

          <div class="annex-clause">
            <div class="annex-clause-title">3. PROPRIÉTÉ INTELLECTUELLE &amp; RUSHES BRUTS (FICHIERS RAW)</div>
            <div>
              Le prestataire cède au client les droits d'exploitation et de diffusion sur les livrables finaux exportés pour les supports et territoires convenus, <strong>exclusivement après encaissement de la totalité du montant TTC</strong>. Les rushes bruts (fichiers RAW de tournage), timelines et projets de montage (DaVinci Resolve / Premiere Pro) demeurent la propriété intellectuelle exclusive de l'auteur. La cession ou livraison des fichiers bruts non montés fait l'objet d'un accord financier spécifique distinct.
            </div>
          </div>

          <div class="annex-clause">
            <div class="annex-clause-title">4. CAS DE FORCE MAJEURE, MÉTÉO &amp; ANNULATION DU TOURNAGE</div>
            <div>
              En cas d'annulation ou de report du tournage à l'initiative du client moins de 48 heures avant la date convenue (hors intempéries météorologiques majeures incompatibles avec un tournage extérieur certifié), l'acompte versé reste acquis au titre des frais d'immobilisation de l'équipe et de réservation du matériel de tournage.
            </div>
          </div>

          ${doc.customClauses ? `
            <div class="annex-clause">
              <div class="annex-clause-title">5. CLAUSES PARTICULIÈRES SPÉCIFIQUES</div>
              <div style="color:#b45309;font-weight:700;">${doc.customClauses}</div>
            </div>
          ` : `
            <div class="annex-clause">
              <div class="annex-clause-title">5. AUTORISATION DE DROIT À L'IMAGE &amp; RÉFÉRENCE PORTFOLIO</div>
              <div>
                Le client garantit avoir obtenu les autorisations nécessaires de droit à l'image des personnes et des lieux filmés. Sauf refus écrit préalable, le réalisateur se réserve le droit de citer la réalisation et d'en intégrer des extraits dans sa bande-démo professionnelle (Showreel).
              </div>
            </div>
          `}
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

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.number}_${(doc.clientCompany || doc.clientName).replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);

    // Automatic Cloud Sync to Google Drive "hafsi prod" folder & subfolder
    setIsDriveUploading(true);
    const subfolderName = getSubfolderNameForDocType(doc.type);
    setDriveNotification({
      status: 'uploading',
      message: `Téléchargé en local ! Envoi automatique vers Google Drive (Dossier : hafsi prod / ${subfolderName})...`,
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
          // Update checklist for driveSaved
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
            message: `Téléchargement local OK. Synchronisation Drive : ${res.message}`,
          });
        }
      })
      .catch((err) => {
        setIsDriveUploading(false);
        setDriveNotification({
          status: 'error',
          message: `Téléchargement local OK. Drive indisponible (${err.message}).`,
        });
      });
  };

  // Manual Google Drive sync button handler
  const handleManualDriveUpload = async (doc: DocumentData) => {
    setIsDriveUploading(true);
    const subfolderName = getSubfolderNameForDocType(doc.type);
    setDriveNotification({
      status: 'uploading',
      message: `Synchronisation avec Google Drive (hafsi prod / ${subfolderName})...`,
    });

    try {
      // Build HTML string for the document
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
      const TOTAL_GRID_ROWS = doc.type === 'DEVIS' ? (hasTechnicalSpecs ? 3 : 4) : 5;
      const fillerRowCount = Math.max(0, TOTAL_GRID_ROWS - doc.items.length);

      // Re-use export generation logic
      const res = await autoUploadDocumentToDrive(doc, `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${doc.type} ${doc.number} - Hafsi Prod</title>
</head>
<body style="font-family:sans-serif;padding:20px;">
  <h2>${typeTitle} ${doc.number}</h2>
  <p>Client: ${doc.clientName} (${doc.clientCompany})</p>
  <p>Montant Net: ${formatMad(netAPayer)} MAD</p>
  <p>Généré via Hafsi Prod Studio</p>
</body>
</html>
      `);

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
          message: `Erreur: ${res.message}`,
        });
      }
    } catch (err: any) {
      setIsDriveUploading(false);
      setDriveNotification({
        status: 'error',
        message: err.message || 'Erreur lors du transfert Google Drive.',
      });
    }
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
                    onClick={() => handleExportHtml(selectedDocument)}
                    className="px-3.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-extrabold text-xs rounded-xl border border-emerald-700/80 transition-all flex items-center gap-1.5 cursor-pointer no-print shadow-sm"
                    title="Télécharger le document en local + Synchroniser automatiquement sur Google Drive"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> Télécharger &amp; Drive
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      {/* 1. Livrables & Revisions */}
                      <div className="space-y-1.5 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" /> Livrable Exact &amp; Formats
                          </label>
                        </div>
                        <textarea
                          rows={2}
                          value={formDeliverables}
                          onChange={(e) => setFormDeliverables(e.target.value)}
                          placeholder="Ex: 1 Master 4K 16:9 + 2 Reels 9:16 + Fichiers .SRT sous-titrés..."
                          className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-lg focus:border-amber-500"
                        />
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold">Révisions incluses</label>
                            <select
                              value={formRevisionsAllowed}
                              onChange={(e) => setFormRevisionsAllowed(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 text-xs text-amber-300 p-1.5 rounded"
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
                              className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-1.5 rounded font-mono"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {[
                            '1 Master 4K 16:9 + 2 Reels 9:16 + .SRT',
                            'Film corporate 3min 4K + Teaser 30s',
                            '4 Capsules verticales 9:16 sous-titrées'
                          ].map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => setFormDeliverables(chip)}
                              className="text-[9.5px] bg-slate-950 hover:bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700"
                            >
                              + {chip.split(' ')[0]} {chip.split(' ')[1]}...
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. Equipe Mobilisee */}
                      <div className="space-y-1.5 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                        <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> Équipe à Mobiliser
                        </label>
                        <textarea
                          rows={2}
                          value={formCrewAssigned}
                          onChange={(e) => setFormCrewAssigned(e.target.value)}
                          placeholder="Ex: 1 Réalisateur / Cadreur FX6, 1 Ingénieur du son, 1 Chef opérateur..."
                          className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-lg focus:border-amber-500"
                        />
                        <div className="flex flex-wrap gap-1 pt-1">
                          {[
                            '1 Réalisateur / Cadreur FX6 + 1 Ingénieur du son',
                            '1 Réalisateur, 1 Chef opérateur, 1 Pilote drone, 1 Ingé son',
                            '1 Cadreur / Monteur autonome'
                          ].map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => setFormCrewAssigned(chip)}
                              className="text-[9.5px] bg-slate-950 hover:bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700"
                            >
                              + {chip.split(' ')[0]} {chip.split(' ')[1]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3. Materiel Deploye */}
                      <div className="space-y-1.5 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                        <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5" /> Matériel à Déployer
                        </label>
                        <textarea
                          rows={2}
                          value={formGearDeployed}
                          onChange={(e) => setFormGearDeployed(e.target.value)}
                          placeholder="Ex: Sony FX6 Cinema Line, Objectifs GM, Gimbal DJI RS3, Kit Aputure 600d, Micros HF..."
                          className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-lg focus:border-amber-500"
                        />
                        <div className="flex flex-wrap gap-1 pt-1">
                          {[
                            'Sony FX6 / FX3 Cinema + Optiques GM + DJI RS3 Pro + Kit Aputure + Micros HF',
                            'Sony FX3 + DJI RS3 Pro + Micro Rode HF + Panneaux LED',
                            'Drone 4K Pro DJI + Sony FX6 + Kit Audio Zoom F6'
                          ].map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => setFormGearDeployed(chip)}
                              className="text-[9.5px] bg-slate-950 hover:bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700"
                            >
                              + {chip.split(' ')[0]} {chip.split(' ')[1]}
                            </button>
                          ))}
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

              {/* Responsive Zoom & View Toolbar */}
              {selectedDocument && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs no-print">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px] font-bold">Affichage Document :</span>
                    <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setZoomScale(0.75)}
                        className={`px-2 py-0.5 rounded font-bold transition-all ${zoomScale === 0.75 ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                      >
                        75%
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomScale(0.9)}
                        className={`px-2 py-0.5 rounded font-bold transition-all ${zoomScale === 0.9 ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                      >
                        90%
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomScale(1)}
                        className={`px-2 py-0.5 rounded font-bold transition-all ${zoomScale === 1 ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                      >
                        100% (A4 Réel)
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomScale(1.15)}
                        className={`px-2 py-0.5 rounded font-bold transition-all ${zoomScale === 1.15 ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                      >
                        115%
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-amber-300 font-mono font-bold">
                      Format A4 Haute Définition (Adaptatif tout écran)
                    </span>
                  </div>
                </div>
              )}

              {selectedDocument ? (
                <div className="overflow-x-auto p-2 sm:p-6 bg-slate-950/70 border border-slate-800 rounded-2xl flex justify-center shadow-inner min-h-[500px]">
                  <div
                    style={{
                      transform: `scale(${zoomScale})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.2s ease-in-out',
                    }}
                    className="w-full flex justify-center"
                  >
                    <DocumentPreview document={selectedDocument} profile={profile} />
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

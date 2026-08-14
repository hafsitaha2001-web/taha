import React from 'react';
import { DocumentData, ProfileInfo } from '../types';
import cameraBannerImg from '../assets/images/regenerated_image_1786447227352.jpg';
import { ShieldCheck, Video, Users, Camera, Layers, CheckCircle2 } from 'lucide-react';

interface DocumentPreviewProps {
  document: DocumentData;
  profile: ProfileInfo;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document, profile }) => {
  // Financial calculations
  const totalHT = document.items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
    return sum + itemTotal;
  }, 0);

  const tvaRate = document.tvaRate ?? 20;
  const tvaAmount = (totalHT * tvaRate) / 100;
  const totalTTC = totalHT + tvaAmount;

  // Acompte calculation
  let acompteAmount = 0;
  if (document.type === 'FACTURE_ACOMPTE') {
    acompteAmount = (document.acompteRate && document.acompteRate > 0)
      ? (totalTTC * document.acompteRate) / 100
      : totalTTC;
  } else if (document.acompteRate && document.acompteRate > 0) {
    acompteAmount = (totalTTC * document.acompteRate) / 100;
  }

  const netAPayer = document.type === 'FACTURE_ACOMPTE'
    ? (acompteAmount > 0 ? acompteAmount : totalTTC)
    : totalTTC;

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).replace(/\u202f/g, ' ');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const getDocTypeName = () => {
    switch (document.type) {
      case 'DEVIS':
        return 'DEVIS';
      case 'FACTURE':
        return 'FACTURE';
      case 'FACTURE_ACOMPTE':
        return "FACTURE D'ACOMPTE";
      case 'BON_LIVRAISON':
        return 'BON DE LIVRAISON';
      default:
        return 'FACTURE';
    }
  };

  const getDocPillTitle = () => {
    switch (document.type) {
      case 'DEVIS':
        return 'DEVIS N° :';
      case 'FACTURE':
        return 'FACTURE N° :';
      case 'FACTURE_ACOMPTE':
        return "FACTURE D'ACOMPTE DE DEVIS N° :";
      case 'BON_LIVRAISON':
        return 'BON DE LIVRAISON N° :';
      default:
        return 'FACTURE N° :';
    }
  };

  const getBannerSrc = () => {
    if (
      !profile.bannerImage ||
      profile.bannerImage.startsWith('http') ||
      profile.bannerImage.includes('unsplash') ||
      profile.bannerImage.startsWith('/src/')
    ) {
      return cameraBannerImg;
    }
    return profile.bannerImage;
  };

  // Has optional production technical details (Explicitly optional per user request)
  const hasProductionDetails = document.type === 'DEVIS' && document.hasProductionSpecs !== false && Boolean(
    document.deliverables || document.crewAssigned || document.gearDeployed
  );

  // Show Legal Clauses Annex (Page 2) for DEVIS when enabled (defaults to true if not explicitly false)
  const showLegalAnnex = document.type === 'DEVIS' && document.includeLegalClauses !== false;

  // Fixed table grid to guarantee clean single-sheet PDF visual balance
  const TOTAL_GRID_ROWS = document.type === 'DEVIS' ? (hasProductionDetails ? 3 : 4) : 5;
  const fillerRowCount = Math.max(0, TOTAL_GRID_ROWS - document.items.length);

  return (
    <div className="printable-document space-y-6 print:space-y-0">
      {/* ================= PAGE 1: OFFRE COMMERCIALE & DEVIS / FACTURE ================= */}
      <div
        id="a4-document-sheet"
        className="printable-page bg-white text-slate-900 w-[210mm] max-w-full min-h-[297mm] h-[297mm] mx-auto shadow-2xl rounded-sm overflow-hidden border border-slate-200 text-[12px] leading-normal font-sans flex flex-col justify-between p-0 box-border print:m-0 print:border-0 print:shadow-none relative"
        style={{ boxSizing: 'border-box' }}
      >
        {/* Top Half Content */}
        <div className="flex flex-col flex-1 justify-between">
          {/* 1. TOP CINEMA BANNER WITH VINTAGE CAMERA BACKGROUND */}
          <div className="cinema-banner relative h-40 sm:h-44 bg-[#020617] flex flex-col items-center justify-center text-center px-6 overflow-hidden rounded-t-sm shrink-0">
            <img
              src={getBannerSrc()}
              alt="Vintage Camera Banner"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = cameraBannerImg;
              }}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-50 filter contrast-125 brightness-90"
              style={{ mixBlendMode: 'normal' }}
            />
            <div className="cinema-overlay absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />

            <div className="relative z-10 text-white tracking-widest uppercase flex flex-col items-center justify-center space-y-1">
              <h1 className="text-3xl sm:text-4xl font-black tracking-[0.32em] font-sans text-white drop-shadow-lg">
                {getDocTypeName()}
              </h1>
              <p className="text-[12.5px] tracking-[0.35em] font-extrabold text-slate-100 uppercase bg-black/50 px-4 py-0.5 rounded-sm border border-white/10">
                {profile.filmmakerName || "TAHA HAFSI"}
              </p>
              <div className="mt-0.5 inline-block bg-[#222225]/95 border border-white/25 px-4 py-0.5 rounded text-[11px] font-black tracking-[0.28em] text-white uppercase shadow-md">
                {profile.title || "AUDIOVISUELLE EXPERT"}
              </div>
            </div>
          </div>

          {/* Document Body */}
          <div className="px-7 py-3.5 flex-1 flex flex-col justify-between">
            {/* 2. METADATA PILLS & CLIENT ADDRESS BLOCK */}
            <div className="flex justify-between items-start gap-6">
              {/* Left: Document Number Pill + Issuer Contact Info */}
              <div className="space-y-2">
                <div className="dark-pill inline-flex flex-col bg-[#333336] text-white font-extrabold px-3.5 py-1.5 rounded-sm tracking-widest uppercase text-[11.5px] shadow-sm leading-tight min-w-[210px]">
                  <span>{getDocPillTitle()}</span>
                  <span className="font-mono text-[14px] font-black text-white pt-0.5 tracking-wider">
                    {document.number}
                  </span>
                </div>

                <div className="text-[12px] text-slate-700 space-y-0.5 font-medium pt-0.5">
                  <p className="font-bold text-slate-950 text-[12.5px]">{profile.address || "23 bd akid allam , casablanca"}</p>
                  <p>{profile.phone || "+212698519895"}</p>
                  <p>{profile.email || "contact.hafsitaha@gmail.com"}</p>
                  {profile.websiteUrl && (
                    <p className="font-bold text-slate-950 underline pt-0.5">
                      <a href={profile.websiteUrl} target="_blank" rel="noreferrer">
                        {profile.websiteUrl}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Date Pill + Client Info Box */}
              <div className="text-right space-y-2">
                <div className="dark-pill inline-block bg-[#333336] text-white font-extrabold px-3.5 py-1.5 rounded-sm text-[12px] tracking-[0.2em] uppercase shadow-sm">
                  DATE : {formatDate(document.date)}
                </div>

                <div className="text-right text-[12px] space-y-0.5 pt-0.5">
                  <div className="font-bold text-slate-800 tracking-wider uppercase text-[12.5px]">
                    {document.type === 'BON_LIVRAISON'
                      ? 'POUR : '
                      : document.type === 'DEVIS'
                      ? 'DEVIS POUR : '
                      : 'FACTURE À : '}{' '}
                    <span className="font-black text-slate-950 text-[13px]">{document.clientName || 'NOM DE CLIENT'}</span>
                  </div>
                  {document.clientCompany && (
                    <div className="font-bold text-slate-800 uppercase">{document.clientCompany}</div>
                  )}
                  {document.clientAddress && (
                    <div className="text-slate-600">{document.clientAddress}</div>
                  )}
                  <div className="font-extrabold text-slate-900 tracking-wider uppercase text-[12.5px] pt-0.5">
                    ICE : <span className="font-mono font-bold text-slate-950">{document.clientIce || '3456789'}</span>
                  </div>
                  {document.shootingDate && (
                    <div className="text-amber-900 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mt-1">
                      🎬 Date de tournage : {formatDate(document.shootingDate)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. ITEMS TABLE */}
            <div className="my-2 overflow-hidden border border-slate-300 rounded-sm">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="table-header bg-[#333336] text-white uppercase tracking-wider font-extrabold text-[11.5px]">
                    <th className="py-2 px-3.5 border-r border-slate-600">Détails des Prestations</th>
                    <th className="py-2 px-3.5 text-right border-r border-slate-600 w-32">
                      {document.type === 'BON_LIVRAISON' ? 'Quantité' : 'Prix'}
                    </th>
                    <th className="py-2 px-3.5 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {document.items.map((item, index) => {
                    const itemTotal = item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
                    return (
                      <tr key={item.id || index} className="bg-white min-h-[30px]">
                        <td className="py-2 px-3.5 font-medium border-r border-slate-200">
                          <div className="text-slate-900 font-bold text-[12.5px]">{item.description}</div>
                          {item.discountPercent ? (
                            <div className="text-[10.5px] text-amber-700 font-bold">
                              Remise : {item.discountPercent}%
                            </div>
                          ) : null}
                        </td>
                        <td className="py-2 px-3.5 text-right border-r border-slate-200 font-mono font-bold text-slate-900 text-[12.5px]">
                          {document.type === 'BON_LIVRAISON' ? item.quantity : formatAmount(item.unitPrice)}
                        </td>
                        <td className="py-2 px-3.5 text-right font-bold font-mono text-slate-950 text-[12.5px]">
                          {document.type === 'BON_LIVRAISON' ? 'LIVRÉ' : formatAmount(itemTotal)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Blank filler rows */}
                  {Array.from({ length: fillerRowCount }).map((_, idx) => (
                    <tr key={`filler-${idx}`} className="h-6 bg-white">
                      <td className="border-r border-slate-200 py-1.5 px-3.5">&nbsp;</td>
                      <td className="border-r border-slate-200 py-1.5 px-3.5">&nbsp;</td>
                      <td className="py-1.5 px-3.5">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3.1 OPTIONAL TECHNICAL PRODUCTION SCOPE BOX (DEVIS ONLY) */}
            {hasProductionDetails && (
              <div className="my-1.5 p-2.5 bg-slate-50 border border-slate-300 rounded text-[11px] space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                  <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-slate-700" /> CADRAGE TECHNIQUE &amp; DÉTAIL DE PRODUCTION
                  </span>
                  <span className="text-[10px] text-slate-600 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                    Spécifications contractuelles
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5 text-slate-800">
                  {document.deliverables && (
                    <div className="space-y-0.5 bg-white p-2 rounded border border-slate-200">
                      <div className="font-bold text-slate-900 text-[10.5px] uppercase tracking-wide flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-700" /> Livrables &amp; Révisions :
                      </div>
                      <p className="text-slate-700 text-[10.5px] leading-tight font-medium">
                        {document.deliverables}
                      </p>
                      <div className="text-[9.5px] text-slate-500 font-bold pt-0.5">
                        • {document.revisionsAllowed ?? 2} allers-retours inclus
                        {document.extraRevisionRate ? ` (${document.extraRevisionRate} DH/h au-delà)` : ''}
                      </div>
                    </div>
                  )}

                  {document.crewAssigned && (
                    <div className="space-y-0.5 bg-white p-2 rounded border border-slate-200">
                      <div className="font-bold text-slate-900 text-[10.5px] uppercase tracking-wide flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-700" /> Équipe mobilisée :
                      </div>
                      <p className="text-slate-700 text-[10.5px] leading-tight font-medium">
                        {document.crewAssigned}
                      </p>
                    </div>
                  )}

                  {document.gearDeployed && (
                    <div className="space-y-0.5 bg-white p-2 rounded border border-slate-200">
                      <div className="font-bold text-slate-900 text-[10.5px] uppercase tracking-wide flex items-center gap-1">
                        <Camera className="w-3 h-3 text-slate-700" /> Matériel déployé :
                      </div>
                      <p className="text-slate-700 text-[10.5px] leading-tight font-medium">
                        {document.gearDeployed}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. PAYMENT TERMS & TOTALS */}
            <div className="grid grid-cols-12 gap-5 items-start">
              {/* Left Side: Terms & Payment Info */}
              <div className="col-span-7 space-y-1.5 text-[11.5px]">
                {document.type === 'FACTURE' && document.dueDate && (
                  <div className="dark-pill inline-block bg-[#333336] text-white px-3 py-1 font-extrabold text-[10.5px] uppercase tracking-widest rounded-sm">
                    PAYABLE AU PLUS TARD LE : {formatDate(document.dueDate)}
                  </div>
                )}

                {document.type === 'DEVIS' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="dark-pill inline-block bg-[#333336] text-white px-3 py-1 font-extrabold text-[10.5px] uppercase tracking-widest rounded-sm">
                      DEVIS VALABLE 30 JOURS
                    </div>
                    {showLegalAnnex && (
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                        • Voir Annexe CGV (Page 2)
                      </span>
                    )}
                  </div>
                )}

                {document.type === 'BON_LIVRAISON' ? (
                  <div className="bg-slate-50 border border-slate-300 p-2 rounded text-[11px] text-slate-700 uppercase space-y-1">
                    <div className="font-bold text-slate-900 border-b border-slate-300 pb-0.5 mb-0.5">
                      PROCÈS-VERBAL DE RÉCEPTION &amp; VALIDATION :
                    </div>
                    <p>
                      LE CLIENT RECONNAÎT AVOIR VÉRIFIÉ ET RÉCEPTIONNÉ L&apos;ENSEMBLE DES FICHIERS AUDIOVISUELS ÉNUMÉRÉS CI-DESSUS.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div>
                      <div className="dark-pill inline-block bg-[#333336] text-white px-3 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.2em] rounded-sm mb-0.5">
                        PAIEMENT :
                      </div>
                      <div className="text-[11.5px] text-slate-700 pl-0.5 space-y-0.5">
                        <p className="font-medium">Par virement bancaire</p>
                        <p className="font-mono font-bold text-slate-900 text-[12px]">
                          RIB : {profile.rib || "230 780 3612259211026800 41"}
                        </p>
                      </div>
                    </div>

                    {document.type === 'DEVIS' && (
                      <>
                        <div>
                          <div className="dark-pill inline-block bg-[#333336] text-white px-3 py-0.5 text-[10.5px] font-extrabold uppercase tracking-widest rounded-sm mb-0.5">
                            MODALITÉ DE PAIEMENT :
                          </div>
                          <div className="text-[11.5px] text-slate-700 font-medium pl-0.5 space-y-0.5">
                            <p>{document.acompteRate || 30}% d&apos;acompte à la signature du devis</p>
                            <p>{100 - (document.acompteRate || 30)}% solde à la livraison finale</p>
                          </div>
                        </div>

                        {/* BON POUR ACCORD - DEVIS ONLY */}
                        <div className="mt-1.5 p-2 border border-slate-300 rounded bg-slate-50/90 text-[10.5px] space-y-1">
                          <div className="flex justify-between items-center border-b border-slate-300 pb-0.5">
                            <span className="font-black text-slate-900 uppercase tracking-wider text-[10.5px]">
                              BON POUR ACCORD &amp; COMMANDE
                            </span>
                            <span className="text-[9px] text-slate-500 font-medium">
                              Date et signature
                            </span>
                          </div>
                          <div className="flex justify-between items-end pt-0.5">
                            <div className="text-slate-600 text-[10px] space-y-0.5">
                              <p className="font-medium">Mention manuscrite : <em>« Bon pour accord »</em></p>
                              <p>Date : _____ / _____ / 202___</p>
                            </div>
                            <div className="w-32 h-9 border border-dashed border-slate-400 bg-white rounded flex items-center justify-center text-[8.5px] text-slate-400 font-bold uppercase tracking-wider text-center">
                              Cachet &amp; Signature
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side: Totals */}
              {document.type !== 'BON_LIVRAISON' && (
                <div className="col-span-5 space-y-1.5 text-[11.5px]">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-slate-700 font-extrabold tracking-wider text-[11.5px] border-b border-slate-200 pb-1">
                      <span>TOTAL HT</span>
                      <span className="font-mono font-bold text-slate-900 text-[12px]">{formatAmount(totalHT)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700 font-extrabold tracking-wider text-[11.5px] border-b border-slate-200 pb-1">
                      <span>TVA {tvaRate}%</span>
                      <span className="font-mono font-bold text-slate-900 text-[12px]">{formatAmount(tvaAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-900 font-black tracking-wider text-[13px] pt-0.5">
                      <span>TOTAL TTC</span>
                      <span className="font-mono font-black text-[14px]">{formatAmount(totalTTC)}</span>
                    </div>
                  </div>

                  {/* Acompte Badge */}
                  {document.acompteRate && document.acompteRate > 0 && (
                    <div className="text-right pt-0.5">
                      <span className="dark-pill inline-block bg-[#333336] text-white text-[10.5px] font-extrabold px-3 py-1 rounded-sm uppercase tracking-widest">
                        ACOMPTE ({document.acompteRate}%) : {formatAmount((totalTTC * document.acompteRate) / 100)} MAD
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. FOOTER: LEGAL BLOCK ON LEFT, NET À PAYER + SIGNATURE ON RIGHT */}
        <div className="px-7 pb-4 pt-2 border-t border-slate-200 shrink-0">
          <div className="flex items-end justify-between gap-4">
            {/* Legal Regulatory Info Block (Left) */}
            <div className="legal-box bg-[#222225] text-white px-3.5 py-2 rounded-sm text-[10.5px] font-mono space-y-0.5 max-w-[430px] w-full">
              <div className="flex justify-between">
                <span className="text-slate-300">Identifiant Commun de l&apos;entreprise (ICE) :</span>
                <span className="font-bold text-white">{profile.ice || "003142194000066"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Identifiant fiscal :</span>
                <span className="font-bold text-white">{profile.ifNumber || "52640537"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Taxe professionnelle :</span>
                <span className="font-bold text-white">{profile.taxePro || "32758577"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Numéro de dossier d&apos;inscription :</span>
                <span className="font-bold text-white">{profile.inscriptionNo || "AE-240823-083244"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Numéro d&apos;immatriculation CNSS :</span>
                <span className="font-bold text-white">{profile.cnssNo || "174204646"}</span>
              </div>
            </div>

            {/* Right Bottom: NET À PAYER Box + Handwritten Signature */}
            <div className="flex flex-col items-end space-y-1.5">
              {document.type !== 'BON_LIVRAISON' && (
                <div className="border border-slate-900 rounded-sm overflow-hidden flex items-stretch shadow-sm bg-white min-w-[220px]">
                  <div className="net-box-label bg-white text-slate-950 font-black text-[11px] px-3.5 py-1.5 flex items-center justify-center tracking-widest uppercase shrink-0 border-r border-slate-900">
                    NET À PAYER
                  </div>
                  <div className="net-box-val bg-white flex-1 px-3.5 py-1.5 text-right flex items-center justify-end gap-1">
                    <span className="text-xl sm:text-2xl font-black font-mono text-slate-950 tracking-tight">
                      {formatAmount(netAPayer)}
                    </span>
                    <span className="text-xs font-black tracking-widest text-slate-950 uppercase">MAD</span>
                  </div>
                </div>
              )}

              {/* Handwritten Signature */}
              <div className="text-right">
                <span className="font-handwriting text-3xl sm:text-4xl text-slate-900 tracking-normal font-bold">
                  Merci pour votre confiance
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PAGE 2: CONDITIONS GÉNÉRALES & CLAUSES DE PROTECTION (DEVIS ONLY) ================= */}
      {showLegalAnnex && (
        <div
          id="a4-document-sheet-annex"
          className="printable-page bg-white text-slate-900 w-[210mm] max-w-full min-h-[297mm] h-[297mm] mx-auto shadow-2xl rounded-sm overflow-hidden border border-slate-200 text-[11.5px] leading-relaxed font-sans flex flex-col justify-between p-0 box-border print:m-0 print:border-0 print:shadow-none relative"
          style={{ boxSizing: 'border-box' }}
        >
          <div className="flex flex-col flex-1 justify-between">
            {/* Header Cinema Bar Page 2 */}
            <div className="cinema-banner relative h-28 bg-[#020617] flex flex-col items-center justify-center text-center px-6 overflow-hidden rounded-t-sm shrink-0">
              <img
                src={getBannerSrc()}
                alt="Vintage Camera Banner"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = cameraBannerImg;
                }}
                className="absolute inset-0 w-full h-full object-cover object-center opacity-40 filter contrast-125 brightness-90"
              />
              <div className="cinema-overlay absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90" />

              <div className="relative z-10 text-white tracking-widest uppercase flex flex-col items-center justify-center space-y-1">
                <div className="flex items-center gap-2 text-amber-400 text-[11px] font-extrabold tracking-widest">
                  <ShieldCheck className="w-4 h-4" /> ANNEXE JURIDIQUE &amp; SÉCURITÉ CONTRACTUELLE
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-[0.25em] font-sans text-white drop-shadow">
                  CONDITIONS GÉNÉRALES DE PRESTATION
                </h2>
                <p className="text-[10.5px] tracking-[0.2em] font-bold text-slate-300 uppercase">
                  ASSOCIÉES AU DEVIS N° <span className="font-mono text-white font-black">{document.number}</span> • CLIENT : {document.clientCompany || document.clientName}
                </p>
              </div>
            </div>

            {/* Clauses Content Grid */}
            <div className="px-8 py-5 flex-1 space-y-3.5">
              {/* Clause 1 */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-1">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="font-extrabold text-slate-950 uppercase tracking-wider text-[11.5px]">
                    1. Échéancier et Modalités de Règlement
                  </span>
                  <span className="text-[10px] font-bold bg-[#333336] text-white px-2 py-0.5 rounded">
                    Trésorerie &amp; Frais
                  </span>
                </div>
                <p className="text-slate-700 text-[11px]">
                  La réservation ferme des dates de tournage et l&apos;engagement des frais techniques (location de matériel, mobilisation de l&apos;équipe) sont conditionnés par le versement d&apos;un acompte de <strong>{document.acompteRate || 30}%</strong> à la signature du devis. Le solde restant (<strong>{100 - (document.acompteRate || 30)}%</strong>) est exigible dès la livraison de la version finale. En cas de retard de paiement au-delà de l&apos;échéance convenue, des pénalités de retard au taux légal en vigueur seront appliquées de plein droit.
                </p>
              </div>

              {/* Clause 2 */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-1">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="font-extrabold text-slate-950 uppercase tracking-wider text-[11.5px]">
                    2. Verrouillage des Retours &amp; Modifications (Anti-Scope Creep)
                  </span>
                  <span className="text-[10px] font-bold bg-[#333336] text-white px-2 py-0.5 rounded">
                    {document.revisionsAllowed || 2} Révisions Incluses
                  </span>
                </div>
                <p className="text-slate-700 text-[11px]">
                  Le présent devis inclut un maximum de <strong>{document.revisionsAllowed || 2} sessions d&apos;allers-retours / corrections mineures</strong> (montage, titrages, étalonnage léger) sur la base du script et du concept initialement validés. Toute modification majeure exigeant un tournage additionnel, un changement de scénario en cours de post-production ou toute session de révision au-delà des {document.revisionsAllowed || 2} sessions fera l&apos;objet d&apos;une facturation complémentaire au tarif horaire de <strong>{document.extraRevisionRate || 500} DH HT/h</strong> ou d&apos;un devis d&apos;avenant.
                </p>
              </div>

              {/* Clause 3 */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-1">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="font-extrabold text-slate-950 uppercase tracking-wider text-[11.5px]">
                    3. Propriété Intellectuelle &amp; Cession des Droits d&apos;Exploitation
                  </span>
                  <span className="text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded">
                    Paiement Intégral Requis
                  </span>
                </div>
                <p className="text-slate-700 text-[11px]">
                  Le transfert au client des droits d&apos;exploitation, de reproduction et de diffusion commerciale (web, réseaux sociaux, TV, cinéma) n&apos;est effectif <strong>qu&apos;après encaissement intégral et définitif du montant total TTC de la facture</strong>. Toute diffusion, publication ou exploitation commerciale préalable des œuvres avant le règlement du solde constitue une contrefaçon et une violation formelle du droit d&apos;auteur.
                </p>
              </div>

              {/* Clause 4 */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-1">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="font-extrabold text-slate-950 uppercase tracking-wider text-[11.5px]">
                    4. Statut des Fichiers Sources &amp; Rushs Bruts (RAW)
                  </span>
                  <span className="text-[10px] font-bold bg-[#333336] text-white px-2 py-0.5 rounded">
                    Propriété Exclusive
                  </span>
                </div>
                <p className="text-slate-700 text-[11px]">
                  Sauf accord écrit explicite stipulé sur le présent devis, les fichiers sources bruts (rushs RAW non étalonnés), les banques d&apos;effets audio/vidéo et les projets de montage (DaVinci Resolve / Premiere) restent la propriété exclusive de l&apos;auteur/réalisateur et ne sont pas cédés au client. Le client est exclusivement acquéreur du produit fini masterisé.
                </p>
              </div>

              {/* Clause 5 */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-1">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="font-extrabold text-slate-950 uppercase tracking-wider text-[11.5px]">
                    5. Modalités d&apos;Annulation ou de Report de Tournage
                  </span>
                  <span className="text-[10px] font-bold bg-[#333336] text-white px-2 py-0.5 rounded">
                    Délais de Prévenance
                  </span>
                </div>
                <p className="text-slate-700 text-[11px]">
                  Tout report de tournage notifié à plus de 7 jours ouvrés s&apos;effectue sans frais supplémentaires selon les disponibilités mutuelles de planning. En cas d&apos;annulation ou de report notifié à moins de 72 heures du tournage, l&apos;acompte perçu reste intégralement acquis au prestataire à titre d&apos;indemnité forfaitaire d&apos;immobilisation de l&apos;équipe et de réservation du matériel.
                </p>
              </div>

              {/* Custom Clauses (if added) */}
              {document.customClauses && (
                <div className="p-2.5 bg-amber-50/80 border border-amber-300 rounded space-y-0.5">
                  <div className="font-extrabold text-amber-950 uppercase tracking-wider text-[11px]">
                    Conditions Particulières Complémentaires :
                  </div>
                  <p className="text-slate-800 text-[10.5px]">
                    {document.customClauses}
                  </p>
                </div>
              )}
            </div>

            {/* Validation & Double Signatures */}
            <div className="px-8 pb-3">
              <div className="border border-slate-300 rounded p-3 bg-slate-50">
                <div className="text-[11px] text-slate-700 font-bold mb-2">
                  Mention manuscrite obligatoire : <em>« Lu, approuvé et accepté dans son intégralité sans réserve »</em>
                </div>
                <div className="grid grid-cols-2 gap-6 pt-1">
                  <div className="space-y-1 border-r border-slate-300 pr-4">
                    <div className="font-black text-slate-900 uppercase text-[11px]">Pour le Prestataire :</div>
                    <div className="text-[10.5px] text-slate-600">
                      {profile.filmmakerName || "TAHA HAFSI"} • {profile.title || "Audiovisuel Expert"}
                    </div>
                    <div className="pt-2 font-handwriting text-2xl text-slate-900 font-bold">
                      Taha Hafsi
                    </div>
                  </div>

                  <div className="space-y-1 pl-2">
                    <div className="font-black text-slate-900 uppercase text-[11px]">Pour le Client / Entreprise :</div>
                    <div className="text-[10.5px] text-slate-600">
                      Nom &amp; Qualité du signataire : ___________________________
                    </div>
                    <div className="pt-2 flex justify-between items-center">
                      <span className="text-[10px] text-slate-500">Date : ____ / ____ / 202___</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase border border-dashed border-slate-400 px-3 py-1 bg-white rounded">
                        Cachet &amp; Signature
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Bar Page 2 */}
          <div className="px-8 pb-4 pt-2 border-t border-slate-200 shrink-0">
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>{profile.filmmakerName || "TAHA HAFSI"} • ICE : {profile.ice || "003142194000066"} • IF : {profile.ifNumber || "52640537"}</span>
              <span>Annexe Contractuelle • Devis {document.number} • Page 2/2</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentPreview;



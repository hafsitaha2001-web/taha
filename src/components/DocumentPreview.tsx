import React from 'react';
import { DocumentData, ProfileInfo } from '../types';
import cameraBannerImg from '../assets/images/regenerated_image_1786447227352.jpg';

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

  // Fixed table grid to guarantee clean single-sheet PDF visual balance with larger header and fonts
  const TOTAL_GRID_ROWS = 5;
  const fillerRowCount = Math.max(0, TOTAL_GRID_ROWS - document.items.length);

  return (
    <div
      id="a4-document-sheet"
      className="printable-document bg-white text-slate-900 w-[210mm] max-w-full min-h-[297mm] h-[297mm] mx-auto shadow-2xl rounded-sm overflow-hidden border border-slate-200 text-[12.5px] leading-normal font-sans flex flex-col justify-between p-0 box-border print:m-0 print:border-0 print:shadow-none"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Top Half Content */}
      <div className="flex flex-col flex-1 justify-between">
        {/* 1. TOP CINEMA BANNER WITH VINTAGE CAMERA BACKGROUND (150% LARGER) */}
        <div className="cinema-banner relative h-44 sm:h-48 bg-[#020617] flex flex-col items-center justify-center text-center px-6 overflow-hidden rounded-t-sm shrink-0">
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

          <div className="relative z-10 text-white tracking-widest uppercase flex flex-col items-center justify-center space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-[0.32em] font-sans text-white drop-shadow-lg">
              {getDocTypeName()}
            </h1>
            <p className="text-[13px] tracking-[0.35em] font-extrabold text-slate-100 uppercase bg-black/50 px-4 py-1 rounded-sm border border-white/10">
              {profile.filmmakerName || "TAHA HAFSI"}
            </p>
            <div className="mt-1 inline-block bg-[#222225]/95 border border-white/25 px-5 py-1 rounded text-[11.5px] font-black tracking-[0.28em] text-white uppercase shadow-md">
              {profile.title || "AUDIOVISUELLE EXPERT"}
            </div>
          </div>
        </div>

        {/* Document Body */}
        <div className="px-8 py-4 flex-1 flex flex-col justify-between">
          {/* 2. METADATA PILLS & CLIENT ADDRESS BLOCK */}
          <div className="flex justify-between items-start gap-6">
            {/* Left: Document Number Pill + Issuer Contact Info */}
            <div className="space-y-2.5">
              <div className="dark-pill inline-flex flex-col bg-[#333336] text-white font-extrabold px-4 py-2 rounded-sm tracking-widest uppercase text-[12px] shadow-sm leading-tight min-w-[220px]">
                <span>{getDocPillTitle()}</span>
                <span className="font-mono text-[14.5px] font-black text-white pt-0.5 tracking-wider">
                  {document.number}
                </span>
              </div>

              <div className="text-[12.5px] text-slate-700 space-y-0.5 font-medium pt-1">
                <p className="font-bold text-slate-950 text-[13px]">{profile.address || "23 bd akid allam , casablanca"}</p>
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
            <div className="text-right space-y-2.5">
              <div className="dark-pill inline-block bg-[#333336] text-white font-extrabold px-4 py-2 rounded-sm text-[12.5px] tracking-[0.2em] uppercase shadow-sm">
                DATE : {formatDate(document.date)}
              </div>

              <div className="text-right text-[12.5px] space-y-0.5 pt-1">
                <div className="font-bold text-slate-800 tracking-wider uppercase text-[13px]">
                  {document.type === 'BON_LIVRAISON'
                    ? 'POUR : '
                    : document.type === 'DEVIS'
                    ? 'DEVIS POUR : '
                    : 'FACTURE À : '}{' '}
                  <span className="font-black text-slate-950 text-[13.5px]">{document.clientName || 'NOM DE CLIENT'}</span>
                </div>
                {document.clientCompany && (
                  <div className="font-bold text-slate-800 uppercase">{document.clientCompany}</div>
                )}
                {document.clientAddress && (
                  <div className="text-slate-600">{document.clientAddress}</div>
                )}
                <div className="font-extrabold text-slate-900 tracking-wider uppercase text-[13px] pt-0.5">
                  ICE : <span className="font-mono font-bold text-slate-950">{document.clientIce || '3456789'}</span>
                </div>
                {document.shootingDate && (
                  <div className="text-amber-800 font-bold text-[11.5px]">
                    Tournage prévu : {formatDate(document.shootingDate)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. ITEMS TABLE */}
          <div className="my-2 overflow-hidden border border-slate-300 rounded-sm">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead>
                <tr className="table-header bg-[#333336] text-white uppercase tracking-wider font-extrabold text-[12px]">
                  <th className="py-2.5 px-4 border-r border-slate-600">Description</th>
                  <th className="py-2.5 px-4 text-right border-r border-slate-600 w-32">
                    {document.type === 'BON_LIVRAISON' ? 'Quantité' : 'Prix'}
                  </th>
                  <th className="py-2.5 px-4 text-right w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {document.items.map((item, index) => {
                  const itemTotal = item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
                  return (
                    <tr key={item.id || index} className="bg-white min-h-[32px]">
                      <td className="py-2 px-4 font-medium border-r border-slate-200">
                        <div className="text-slate-900 font-semibold text-[13px]">{item.description}</div>
                        {item.discountPercent ? (
                          <div className="text-[11px] text-amber-700 font-bold">
                            Remise : {item.discountPercent}%
                          </div>
                        ) : null}
                      </td>
                      <td className="py-2 px-4 text-right border-r border-slate-200 font-mono font-bold text-slate-900 text-[13px]">
                        {document.type === 'BON_LIVRAISON' ? item.quantity : formatAmount(item.unitPrice)}
                      </td>
                      <td className="py-2 px-4 text-right font-bold font-mono text-slate-950 text-[13px]">
                        {document.type === 'BON_LIVRAISON' ? 'LIVRÉ' : formatAmount(itemTotal)}
                      </td>
                    </tr>
                  );
                })}

                {/* Blank filler rows to maintain constant PDF sheet structure */}
                {Array.from({ length: fillerRowCount }).map((_, idx) => (
                  <tr key={`filler-${idx}`} className="h-7 bg-white">
                    <td className="border-r border-slate-200 py-2 px-4">&nbsp;</td>
                    <td className="border-r border-slate-200 py-2 px-4">&nbsp;</td>
                    <td className="py-2 px-4">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. PAYMENT TERMS & TOTALS */}
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Left Side: Terms & Payment Info */}
            <div className="col-span-7 space-y-2 text-[12px]">
              {document.type === 'FACTURE' && document.dueDate && (
                <div className="dark-pill inline-block bg-[#333336] text-white px-3.5 py-1 font-extrabold text-[11px] uppercase tracking-widest rounded-sm">
                  PAYABLE AU PLUS TARD LE : {formatDate(document.dueDate)}
                </div>
              )}

              {document.type === 'DEVIS' && (
                <div className="dark-pill inline-block bg-[#333336] text-white px-3.5 py-1 font-extrabold text-[11px] uppercase tracking-widest rounded-sm">
                  DEVIS VALABLE 30 JOURS
                </div>
              )}

              {document.type === 'BON_LIVRAISON' ? (
                <div className="bg-slate-50 border border-slate-300 p-2.5 rounded text-[11.5px] text-slate-700 uppercase space-y-1">
                  <div className="font-bold text-slate-900 border-b border-slate-300 pb-0.5 mb-0.5">
                    PROCÈS-VERBAL DE RÉCEPTION &amp; VALIDATION :
                  </div>
                  <p>
                    LE CLIENT RECONNAÎT AVOIR VÉRIFIÉ ET RÉCEPTIONNÉ L&apos;ENSEMBLE DES FICHIERS AUDIOVISUELS ÉNUMÉRÉS CI-DESSUS.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <div className="dark-pill inline-block bg-[#333336] text-white px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] rounded-sm mb-1">
                      PAIEMENT :
                    </div>
                    <div className="text-[12px] text-slate-700 pl-0.5 space-y-0.5">
                      <p className="font-medium">Par virement bancaire</p>
                      <p className="font-mono font-bold text-slate-900 text-[12.5px]">
                        RIB : {profile.rib || "230 780 3612259211026800 41"}
                      </p>
                    </div>
                  </div>

                  {document.type === 'DEVIS' && (
                    <div>
                      <div className="dark-pill inline-block bg-[#333336] text-white px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest rounded-sm mb-0.5">
                        MODALITÉ DE PAIEMENT :
                      </div>
                      <div className="text-[12px] text-slate-700 font-medium pl-0.5 space-y-0.5">
                        <p>30% en avance</p>
                        <p>70% à la livraison</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side: Totals */}
            {document.type !== 'BON_LIVRAISON' && (
              <div className="col-span-5 space-y-1.5 text-[12px]">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-slate-700 font-extrabold tracking-wider text-[12px] border-b border-slate-200 pb-1">
                    <span>TOTAL HT</span>
                    <span className="font-mono font-bold text-slate-900 text-[12.5px]">{formatAmount(totalHT)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 font-extrabold tracking-wider text-[12px] border-b border-slate-200 pb-1">
                    <span>TVA {tvaRate}%</span>
                    <span className="font-mono font-bold text-slate-900 text-[12.5px]">{formatAmount(tvaAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 font-black tracking-wider text-[13.5px] pt-0.5">
                    <span>TOTAL TTC</span>
                    <span className="font-mono font-black text-[14.5px]">{formatAmount(totalTTC)}</span>
                  </div>
                </div>

                {/* Acompte Badge (if applicable) */}
                {document.acompteRate && document.acompteRate > 0 && (
                  <div className="text-right pt-0.5">
                    <span className="dark-pill inline-block bg-[#333336] text-white text-[11px] font-extrabold px-3 py-1 rounded-sm uppercase tracking-widest">
                      L&apos;ACOMPTE DE {document.acompteRate}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. FOOTER: LEGAL BLOCK ON LEFT, NET À PAYER + SIGNATURE ON RIGHT */}
      <div className="px-8 pb-5 pt-2.5 border-t border-slate-200 shrink-0">
        <div className="flex items-end justify-between gap-4">
          {/* Legal Regulatory Info Block (Left) */}
          <div className="legal-box bg-[#222225] text-white px-4 py-2.5 rounded-sm text-[11px] font-mono space-y-0.5 max-w-[450px] w-full">
            <div className="flex justify-between">
              <span className="text-slate-300">Identifiant Commun de l&apos;entreprise (ICE) :</span>
              <span className="font-bold text-white">{profile.ice || "003142194000066"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Identifiant fiscal. :</span>
              <span className="font-bold text-white">{profile.ifNumber || "52640537"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Taxe professionnelle. :</span>
              <span className="font-bold text-white">{profile.taxePro || "32758577"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Numéro du dossier d&apos;inscription :</span>
              <span className="font-bold text-white">{profile.inscriptionNo || "AE-240823-083244"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Numéro d&apos;immatriculation CNSS. :</span>
              <span className="font-bold text-white">{profile.cnssNo || "174204646"}</span>
            </div>
          </div>

          {/* Right Bottom: NET À PAYER Box + Handwritten Signature */}
          <div className="flex flex-col items-end space-y-2">
            {document.type !== 'BON_LIVRAISON' && (
              <div className="border border-slate-900 rounded-sm overflow-hidden flex items-stretch shadow-sm bg-white min-w-[230px]">
                <div className="net-box-label bg-white text-slate-950 font-black text-[11.5px] px-4 py-2 flex items-center justify-center tracking-widest uppercase shrink-0 border-r border-slate-900">
                  NET À PAYER
                </div>
                <div className="net-box-val bg-white flex-1 px-4 py-2 text-right flex items-center justify-end gap-1.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-slate-950 tracking-tight">
                    {formatAmount(netAPayer)}
                  </span>
                  <span className="text-sm font-black tracking-widest text-slate-950 uppercase">MAD</span>
                </div>
              </div>
            )}

            {/* Handwritten Signature */}
            <div className="text-right pt-0.5">
              <span className="font-handwriting text-3xl sm:text-4xl text-slate-900 tracking-normal font-bold">
                Merci pour votre confiance
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;



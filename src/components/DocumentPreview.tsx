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

  const tvaAmount = (totalHT * document.tvaRate) / 100;
  const totalTTC = totalHT + tvaAmount;

  // Acompte calculation
  let acompteAmount = 0;
  if (document.type === 'FACTURE_ACOMPTE') {
    acompteAmount = document.acompteRate > 0 ? (totalTTC * document.acompteRate) / 100 : totalTTC;
  } else if (document.acompteRate > 0) {
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

  return (
    <div className="printable-document bg-white text-slate-900 w-[210mm] max-w-full min-h-[297mm] mx-auto shadow-2xl rounded-sm overflow-hidden border border-slate-200 text-[11.5px] leading-snug font-sans flex flex-col justify-between p-0">
      <div>
        {/* 1. TOP CINEMA BANNER WITH VINTAGE CAMERA BACKGROUND */}
        <div className="relative h-44 bg-slate-950 flex flex-col items-center justify-center text-center px-4 overflow-hidden rounded-t-sm">
          <img
            src={getBannerSrc()}
            alt="Vintage Camera Banner"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = cameraBannerImg;
            }}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-60 mix-blend-luminosity filter contrast-125 brightness-110"
          />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

        <div className="relative z-10 text-white tracking-widest uppercase space-y-1">
          <h1 className="text-4xl font-extrabold tracking-[0.3em] font-sans text-white drop-shadow-lg">
            {getDocTypeName()}
          </h1>
          <p className="text-xs tracking-[0.35em] font-bold text-slate-300 uppercase">
            {profile.filmmakerName || "TAHA HAFSI"}
          </p>
          <div className="mt-2 inline-block bg-[#222225] border border-white/20 px-4 py-1 rounded-sm text-[11px] font-extrabold tracking-[0.2em] text-white uppercase shadow-md">
            {profile.title || "EXPERT AUDIOVISUEL"}
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* 2. METADATA PILLS & CLIENT ADDRESS BLOCK */}
        <div className="flex flex-wrap justify-between items-start gap-4">
          {/* Left: Document Number Pill + Issuer Contact Info */}
          <div className="space-y-3">
            <div className="inline-block bg-[#333336] text-white font-extrabold px-3 py-1.5 rounded-sm tracking-widest uppercase text-xs shadow-sm">
              {document.type === 'FACTURE_ACOMPTE'
                ? `FACTURE D'ACOMPTE N° : `
                : document.type === 'DEVIS'
                ? `DEVIS N° : `
                : document.type === 'BON_LIVRAISON'
                ? `BON DE LIVRAISON N° : `
                : `FACTURE N° : `}
              <span className="font-mono text-white">{document.number}</span>
            </div>

            <div className="text-xs text-slate-700 space-y-1 font-medium pt-1">
              <p>{profile.address || "23 Bd Akid Allam, Casablanca"}</p>
              <p>{profile.phone || "+212698519895"}</p>
              <p>{profile.email || "contact.hafsitaha@gmail.com"}</p>
              {profile.websiteUrl && (
                <p className="font-bold text-slate-900 underline">
                  <a href={profile.websiteUrl} target="_blank" rel="noreferrer">
                    {profile.websiteUrl}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Right: Date Pill + Client Info Box */}
          <div className="text-right space-y-3">
            <div className="inline-block bg-[#333336] text-white font-extrabold px-3 py-1.5 rounded-sm text-xs tracking-widest uppercase shadow-sm">
              DATE : {formatDate(document.date)}
            </div>

            <div className="text-right text-xs space-y-1 pt-1">
              <div className="font-extrabold text-slate-800 tracking-wider uppercase text-[11px]">
                {document.type === 'BON_LIVRAISON'
                  ? 'POUR :'
                  : document.type === 'DEVIS'
                  ? 'DEVIS À :'
                  : 'FACTURE À :'}{' '}
                <span className="font-black text-slate-900">{document.clientName || 'NOM DE CLIENT'}</span>
              </div>
              {document.clientCompany && (
                <div className="font-semibold text-slate-700 uppercase">{document.clientCompany}</div>
              )}
              {document.clientAddress && (
                <div className="text-slate-500">{document.clientAddress}</div>
              )}
              <div className="font-extrabold text-slate-800 tracking-wider uppercase text-[11px] pt-0.5">
                ICE : <span className="font-mono font-bold">{document.clientIce || '3456789'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. ITEMS TABLE */}
        <div className="overflow-hidden border border-slate-300 rounded-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#333336] text-white text-xs uppercase tracking-wider font-extrabold">
                <th className="py-2.5 px-4 border-r border-slate-600">Description</th>
                <th className="py-2.5 px-4 text-right border-r border-slate-600 w-28">
                  {document.type === 'BON_LIVRAISON' ? 'Quantité' : 'Prix'}
                </th>
                <th className="py-2.5 px-4 text-right w-28">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 text-xs">
              {document.items.map((item, index) => {
                const itemTotal = item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
                return (
                  <tr key={item.id || index} className="bg-white">
                    <td className="py-3 px-4 font-medium border-r border-slate-200">
                      <div>{item.description}</div>
                      {item.discountPercent ? (
                        <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                          Remise: {item.discountPercent}%
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4 text-right border-r border-slate-200 font-mono font-bold text-slate-900">
                      {document.type === 'BON_LIVRAISON' ? item.quantity : formatAmount(item.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-slate-950">
                      {document.type === 'BON_LIVRAISON' ? 'LIVRÉ' : formatAmount(itemTotal)}
                    </td>
                  </tr>
                );
              })}

              {/* Blank filler rows to match print template spacing */}
              {Array.from({ length: Math.max(0, 5 - document.items.length) }).map((_, idx) => (
                <tr key={`filler-${idx}`} className="h-9 bg-white">
                  <td className="border-r border-slate-200"></td>
                  <td className="border-r border-slate-200"></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. PAYMENT TERMS & TOTALS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Side: Terms & Conditions Badges */}
          <div className="md:col-span-7 space-y-3 text-xs">
            {document.type === 'FACTURE' && document.dueDate && (
              <div className="inline-block bg-[#333336] text-white px-3 py-1 font-extrabold text-[11px] uppercase tracking-widest rounded-sm">
                PAYABLE AU PLUS TARD LE : {formatDate(document.dueDate)}
              </div>
            )}

            {document.type === 'DEVIS' && (
              <div className="inline-block bg-[#333336] text-white px-3 py-1 font-extrabold text-[11px] uppercase tracking-widest rounded-sm">
                DEVIS VALABLE 30 JOURS
              </div>
            )}

            {document.type === 'BON_LIVRAISON' ? (
              <div className="bg-slate-50 border border-slate-300 p-3 rounded text-[10px] text-slate-700 uppercase space-y-1">
                <div className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-1">
                  PROCÈS-VERBAL DE RÉCEPTION &amp; VALIDATION :
                </div>
                <p>
                  LE CLIENT RECONNAÎT AVOIR VÉRIFIÉ ET RÉCEPTIONNÉ L&apos;ENSEMBLE DES FICHIERS AUDIOVISUELS ÉNUMÉRÉS CI-DESSUS.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div>
                  <div className="inline-block bg-[#333336] text-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-sm mb-1">
                    MODALITÉ DE PAIEMENT :
                  </div>
                  <div className="text-xs text-slate-700 font-medium pl-1 space-y-0.5">
                    <p>30% en avance</p>
                    <p>70% à la livraison</p>
                  </div>
                </div>

                <div>
                  <div className="inline-block bg-[#333336] text-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-sm mb-1">
                    PAIEMENT :
                  </div>
                  <div className="text-xs text-slate-700 pl-1 space-y-0.5">
                    <p>Par virement bancaire</p>
                    <p className="font-mono font-bold text-slate-900">
                      RIB : {profile.rib || "230 780 3612259211026800 41"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Totals & Net à Payer */}
          {document.type !== 'BON_LIVRAISON' && (
            <div className="md:col-span-5 space-y-3 text-xs">
              <div className="space-y-2 border-b border-slate-300 pb-3">
                <div className="flex justify-between items-center text-slate-700 font-extrabold tracking-wider">
                  <span>TOTAL HT</span>
                  <span className="font-mono font-bold text-slate-900">{formatAmount(totalHT)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 font-extrabold tracking-wider">
                  <span>TVA {document.tvaRate}%</span>
                  <span className="font-mono font-bold text-slate-900">{formatAmount(tvaAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-900 font-black tracking-wider text-sm pt-1 border-t border-slate-300">
                  <span>TOTAL TTC</span>
                  <span className="font-mono font-black">{formatAmount(totalTTC)}</span>
                </div>
              </div>

              {/* Acompte Badge */}
              <div className="text-right pt-1">
                <span className="inline-block bg-[#333336] text-white text-[10px] font-extrabold px-3 py-1 rounded-sm uppercase tracking-widest">
                  L&apos;ACOMPTE DE {document.acompteRate}%
                </span>
              </div>

              {/* NET À PAYER LARGE BOX */}
              <div className="border-2 border-slate-900 rounded-sm overflow-hidden flex items-stretch mt-2 shadow-sm bg-white">
                <div className="bg-[#222225] text-white font-black text-xs px-4 py-3 flex items-center justify-center tracking-widest uppercase min-w-[125px]">
                  NET À PAYER
                </div>
                <div className="bg-slate-50 flex-1 px-4 py-2.5 text-right flex items-center justify-end gap-2 border-l border-slate-900">
                  <span className="text-2xl md:text-3xl font-black font-mono text-slate-950 tracking-tight">
                    {formatAmount(netAPayer)}
                  </span>
                  <span className="text-sm font-black tracking-widest text-slate-950 uppercase">MAD</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. FOOTER: LEGAL BLOCK & HANDWRITTEN THANK YOU */}
        <div className="pt-6 flex flex-col md:flex-row items-end justify-between gap-4 border-t border-slate-200">
          {/* Legal Regulatory Info Block */}
          <div className="bg-[#222225] text-white p-3 rounded-sm text-[10px] font-mono space-y-1 max-w-[440px] w-full">
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
              <span className="text-slate-300">Numéro du dossier d&apos;inscription :</span>
              <span className="font-bold text-white">{profile.inscriptionNo || "AE-240823-083244"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Numéro d&apos;immatriculation CNSS :</span>
              <span className="font-bold text-white">{profile.cnssNo || "174204646"}</span>
            </div>
          </div>

          {/* Handwritten Signature */}
          <div className="text-right pb-2">
            <span className="font-handwriting text-3xl text-slate-900 tracking-wide font-bold">
              Merci pour votre confiance
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};


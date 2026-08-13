import React, { useState } from 'react';
import { Settings, X, Save, Building, ShieldCheck, Download, Upload, RotateCcw } from 'lucide-react';
import { ProfileInfo } from '../types';

interface StudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileInfo;
  onSaveProfile: (profile: ProfileInfo) => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const StudioSettingsModal: React.FC<StudioSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onResetData,
  onExportData,
  onImportData,
}) => {
  const [form, setForm] = useState<ProfileInfo>({ ...profile });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full p-6 rounded-2xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" /> Paramètres du Studio & Mentions Légales Maroc
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Nom du Réalisateur / Studio</label>
              <input
                type="text"
                value={form.filmmakerName}
                onChange={(e) => setForm({ ...form, filmmakerName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Titre / Spécialité</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-amber-400 font-bold mb-1">ICE (Identifiant Commun de l'Entreprise)</label>
              <input
                type="text"
                value={form.ice}
                onChange={(e) => setForm({ ...form, ice: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-amber-300 font-mono font-bold p-2.5 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Identifiant Fiscal (IF)</label>
              <input
                type="text"
                value={form.ifNumber}
                onChange={(e) => setForm({ ...form, ifNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-mono p-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Taxe Professionnelle (TP)</label>
              <input
                type="text"
                value={form.taxePro}
                onChange={(e) => setForm({ ...form, taxePro: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-mono p-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">N° Dossier Inscription (AE/SARL)</label>
              <input
                type="text"
                value={form.inscriptionNo}
                onChange={(e) => setForm({ ...form, inscriptionNo: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-mono p-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">N° Immatriculation CNSS</label>
              <input
                type="text"
                value={form.cnssNo}
                onChange={(e) => setForm({ ...form, cnssNo: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-mono p-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Nom de la Banque</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-amber-400 font-bold mb-1">Relevé d'Identité Bancaire (RIB 24 chiffres)</label>
              <input
                type="text"
                value={form.rib}
                onChange={(e) => setForm({ ...form, rib: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-amber-300 font-mono font-bold p-2.5 rounded-xl"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-bold mb-1">Adresse Professionnelle</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Téléphone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-bold mb-1">URL Site Web / Portfolio Vercel</label>
              <input
                type="url"
                value={form.websiteUrl}
                onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2 p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Préférences d'Affichage & Facturation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Thème d'Affichage</label>
                  <select
                    value={form.theme || 'dark'}
                    onChange={(e) => {
                      const newTheme = e.target.value as 'dark' | 'light';
                      setForm({ ...form, theme: newTheme });
                      if (newTheme === 'light') {
                        document.body.classList.add('light-theme');
                      } else {
                        document.body.classList.remove('light-theme');
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded-lg font-bold"
                  >
                    <option value="dark">🌙 Mode Nuit (Sombre)</option>
                    <option value="light">☀️ Mode Jour (Clair)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Devise par Défaut</label>
                  <select
                    value={form.defaultCurrency || 'MAD'}
                    onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded-lg font-bold"
                  >
                    <option value="MAD">Dirham Marocain (MAD)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">Dollar ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Taux TVA par Défaut</label>
                  <select
                    value={form.defaultTvaRate ?? 20}
                    onChange={(e) => setForm({ ...form, defaultTvaRate: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded-lg font-bold"
                  >
                    <option value={20}>20 % (Standard Maroc)</option>
                    <option value={10}>10 % (Prestations Spécifiques)</option>
                    <option value={0}>0 % (Exonéré / Auto-entrepreneur)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-bold mb-1">URL Image de Bannière En-tête Devis (Caméra)</label>
              <input
                type="url"
                value={form.bannerImage}
                onChange={(e) => setForm({ ...form, bannerImage: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 p-2.5 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onExportData}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg flex items-center gap-1"
                title="Exporter une sauvegarde JSON"
              >
                <Download className="w-3.5 h-3.5" /> Exporter JSON
              </button>

              <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg flex items-center gap-1 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Importer JSON
                <input type="file" accept=".json" onChange={onImportData} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Voulez-vous réinitialiser toutes les données avec les exemples marocains ?')) {
                    onResetData();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 font-bold rounded-lg flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Enregistrer le Profil
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  DollarSign,
  Compass,
  ArrowRight,
  Loader2,
  Trash2,
  Terminal,
  Zap,
} from 'lucide-react';
import {
  ProfileInfo,
  ClientData,
  DocumentData,
  ExpenseItem,
  DocumentType,
  DocumentStatus,
} from '../types';

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileInfo;
  clients: ClientData[];
  documents: DocumentData[];
  expenses: ExpenseItem[];
  activeModule: 'docs' | 'crm' | 'prod' | 'stats' | 'expert';
  setActiveModule: (mod: 'docs' | 'crm' | 'prod' | 'stats' | 'expert') => void;
  onSaveDocument: (doc: DocumentData) => void;
  onSaveClient: (client: ClientData) => void;
  onAddExpense: (expense: ExpenseItem) => void;
  onSaveProfile: (profile: ProfileInfo) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  executedActions?: {
    type: string;
    description: string;
  }[];
}

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({
  isOpen,
  onClose,
  profile,
  clients,
  documents,
  expenses,
  activeModule,
  setActiveModule,
  onSaveDocument,
  onSaveClient,
  onAddExpense,
  onSaveProfile,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content:
        'Bonjour ! Je suis votre Assistant IA Gemini pour CineManage Pro. Dites-moi ce que vous souhaitez accomplir (ex: "Crée un devis de 25 000 MAD pour Salma Bennis pour un tournage pub 2 jours", "Passe la facture FAC-2026-001 en statut Payé", "Ajoute un nouveau client", "Ouvre les statistiques", etc.).',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const quickPrompts = [
    {
      icon: FileText,
      label: 'Nouveau Devis',
      prompt:
        'Crée un Devis pour Salma Bennis (Maroc Luxury Hotel) d\'un montant de 22 000 MAD pour "Tournage Vidéo Promotionnelle 2 jours" avec un acompte de 30%.',
    },
    {
      icon: CheckCircle2,
      label: 'Marquer Payé',
      prompt: 'Passe la facture FAC-2026-001 en statut Payé.',
    },
    {
      icon: Users,
      label: 'Ajouter Client',
      prompt:
        'Ajoute un nouveau client: Havas Media Casablanca, ICE: 003142194000088, Contact: Amine Bennani, Email: a.bennani@havas.ma, Secteur: Agence Pub.',
    },
    {
      icon: DollarSign,
      label: 'Ajouter Dépense',
      prompt:
        'Enregistre une dépense de 4 500 MAD dans la catégorie MATERIEL pour "Location Optiques Anamorphiques Tournage Pub".',
    },
    {
      icon: Compass,
      label: 'Conseils SARL',
      prompt:
        'Analyse mon chiffre d\'affaires actuel par rapport au plafond Auto-Entrepreneur de 200k MAD et donne-moi tes recommandations pour passer en SARL AU.',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || promptInput;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setPromptInput('');
    setIsLoading(true);

    try {
      // Calculate context for Gemini
      const totalTurnoverHT = documents
        .filter((d) => d.status !== 'brouillon')
        .reduce(
          (sum, doc) =>
            sum +
            doc.items.reduce(
              (s, i) => s + i.quantity * i.unitPrice * (1 - (i.discountPercent || 0) / 100),
              0
            ),
          0
        );

      const contextPayload = {
        profile,
        documentsCount: documents.length,
        clientsCount: clients.length,
        expensesCount: expenses.length,
        totalCA: totalTurnoverHT,
        clientNames: clients.map((c) => `${c.name} (${c.company})`),
        recentDocs: documents.slice(0, 5).map((d) => `${d.number} (${d.clientName} - ${d.status})`),
      };

      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          history: messages
            .filter((m) => m.id !== 'msg_welcome')
            .map((m) => ({ role: m.role, content: m.content })),
          context: contextPayload,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération.');
      }

      const executedActions: { type: string; description: string }[] = [];

      // Process function calls executed by Gemini
      if (Array.isArray(data.functionCalls) && data.functionCalls.length > 0) {
        for (const call of data.functionCalls) {
          const { name, args } = call;

          if (name === 'createDocument') {
            const docType: DocumentType = (args.type as DocumentType) || 'DEVIS';
            const prefix =
              docType === 'DEVIS'
                ? 'DEV'
                : docType === 'FACTURE'
                ? 'FAC'
                : docType === 'FACTURE_ACOMPTE'
                ? 'FAC-AC'
                : 'BL';

            const year = new Date().getFullYear();
            const count = documents.filter((d) => d.type === docType).length + 1;
            const docNumber = `${prefix}-${year}-${String(count).padStart(3, '0')}`;

            const today = new Date().toISOString().split('T')[0];
            const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0];

            const existingClient = clients.find(
              (c) =>
                c.name.toLowerCase().includes((args.clientName || '').toLowerCase()) ||
                c.company.toLowerCase().includes((args.clientCompany || '').toLowerCase())
            );

            const items = Array.isArray(args.items)
              ? args.items.map((it: any, idx: number) => ({
                  id: `item_${Date.now()}_${idx}`,
                  description: it.description || 'Prestation audiovisuelle',
                  quantity: Number(it.quantity) || 1,
                  unitPrice: Number(it.unitPrice) || 0,
                }))
              : [
                  {
                    id: `item_${Date.now()}_0`,
                    description: 'Prestation audiovisuelle',
                    quantity: 1,
                    unitPrice: 10000,
                  },
                ];

            const newDoc: DocumentData = {
              id: `doc_${Date.now()}`,
              type: docType,
              number: docNumber,
              date: today,
              dueDate,
              clientId: existingClient ? existingClient.id : `cli_${Date.now()}`,
              clientName: args.clientName || existingClient?.name || 'Client',
              clientCompany: args.clientCompany || existingClient?.company || 'Entreprise Client',
              clientIce: args.clientIce || existingClient?.ice || '000000000000000',
              clientAddress: existingClient?.city || 'Casablanca, Maroc',
              clientEmail: args.clientEmail || existingClient?.email || '',
              clientPhone: args.clientPhone || existingClient?.phone || '',
              items,
              tvaRate: args.tvaRate !== undefined ? Number(args.tvaRate) : 20,
              acompteRate: args.acompteRate !== undefined ? Number(args.acompteRate) : 30,
              status: 'brouillon',
              checklist: {
                briefSent: true,
                bonAccordSigned: false,
                orderReceived: false,
                driveSaved: false,
                relanceSent: false,
              },
              notes: args.notes || '',
              createdAt: today,
            };

            onSaveDocument(newDoc);
            setActiveModule('docs');
            executedActions.push({
              type: 'Document Créé',
              description: `${docType} n° ${docNumber} créé pour ${newDoc.clientCompany}`,
            });
          }

          if (name === 'updateDocumentStatus') {
            const targetNumber = args.documentNumber?.toUpperCase();
            const newStatus = args.status?.toLowerCase() as DocumentStatus;

            const docToUpdate = documents.find(
              (d) => d.number.toUpperCase() === targetNumber || d.number.includes(targetNumber)
            );

            if (docToUpdate && newStatus) {
              const updated = { ...docToUpdate, status: newStatus };
              onSaveDocument(updated);
              executedActions.push({
                type: 'Statut Mis à Jour',
                description: `Document ${docToUpdate.number} passé au statut "${newStatus.toUpperCase()}"`,
              });
            }
          }

          if (name === 'createClient') {
            const newClient: ClientData = {
              id: `cli_${Date.now()}`,
              name: args.name || 'Nouveau Contact',
              company: args.company || 'Entreprise Client',
              photoUrl:
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
              ice: args.ice || '000000000000000',
              email: args.email || 'contact@client.ma',
              phone: args.phone || '+212 6 00 00 00 00',
              city: args.city || 'Casablanca',
              sector: (args.sector as any) || 'Agence Pub',
              acquisitionSource: args.acquisitionSource || 'Assistant Gemini AI',
              notes: args.notes || '',
              createdAt: new Date().toISOString().split('T')[0],
            };

            onSaveClient(newClient);
            setActiveModule('crm');
            executedActions.push({
              type: 'Client Ajouté',
              description: `Client "${newClient.company}" (${newClient.name}) enregistré dans le CRM`,
            });
          }

          if (name === 'addExpense') {
            const newExp: ExpenseItem = {
              id: `exp_${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              category: (args.category as any) || 'MATERIEL',
              description: args.description || 'Dépense studio',
              amountMAD: Number(args.amountMAD) || 0,
              deductibleTva: args.deductibleTva !== false,
            };

            onAddExpense(newExp);
            setActiveModule('stats');
            executedActions.push({
              type: 'Dépense Enregistrée',
              description: `Dépense "${newExp.description}" (${newExp.amountMAD} MAD) ajoutée`,
            });
          }

          if (name === 'navigateToModule') {
            const mod = args.module as any;
            if (['docs', 'crm', 'prod', 'stats', 'expert'].includes(mod)) {
              setActiveModule(mod);
              executedActions.push({
                type: 'Navigation',
                description: `Affichage du module ${mod.toUpperCase()}`,
              });
            }
          }

          if (name === 'updateProfile') {
            const updatedProfile = {
              ...profile,
              ...(args.filmmakerName ? { filmmakerName: args.filmmakerName } : {}),
              ...(args.ice ? { ice: args.ice } : {}),
              ...(args.ifNumber ? { ifNumber: args.ifNumber } : {}),
              ...(args.taxePro ? { taxePro: args.taxePro } : {}),
              ...(args.cnssNo ? { cnssNo: args.cnssNo } : {}),
              ...(args.rib ? { rib: args.rib } : {}),
              ...(args.bankName ? { bankName: args.bankName } : {}),
              ...(args.email ? { email: args.email } : {}),
              ...(args.phone ? { phone: args.phone } : {}),
            };
            onSaveProfile(updatedProfile);
            executedActions.push({
              type: 'Profil Mis à Jour',
              description: 'Paramètres du studio mis à jour avec succès',
            });
          }
        }
      }

      const assistantMessage: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        executedActions: executedActions.length > 0 ? executedActions : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Désolé, une erreur est survenue: ${err.message || 'Impossible d\'exécuter la commande.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 no-print animate-in fade-in duration-200">
      <div className="bg-[#0f0f12] border border-amber-500/30 rounded-2xl w-full max-w-4xl h-[90vh] max-h-[780px] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header Bar */}
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-[#E2B714] flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white tracking-tight italic uppercase">
                  Assistant Gemini AI
                </h3>
                <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Commande vocale/texte en langage naturel pour automatiser vos Devis, Factures, CRM et Suivi SARL.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0 flex items-center gap-1">
            <Terminal className="w-3 h-3 text-amber-400" /> Prompts Rapides :
          </span>
          {quickPrompts.map((q, idx) => {
            const Icon = q.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.prompt)}
                disabled={isLoading}
                className="bg-slate-800/80 hover:bg-amber-500/20 border border-slate-700/80 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 text-xs px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5 text-amber-400" />
                <span>{q.label}</span>
              </button>
            );
          })}
        </div>

        {/* Chat History Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-950/40">
          {messages.map((msg) => {
            const isAssistant = msg.role === 'assistant';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isAssistant
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-white border border-slate-700'
                  }`}
                >
                  {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className={`space-y-1.5 ${isAssistant ? 'text-left' : 'text-right'}`}>
                  <div
                    className={`inline-block p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isAssistant
                        ? 'bg-slate-900 border border-slate-800 text-slate-200 shadow-md'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium shadow-md'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>

                    {/* Executed Actions Cards */}
                    {msg.executedActions && msg.executedActions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Actions Exécutées dans l'Application :</span>
                        </div>
                        {msg.executedActions.map((act, i) => (
                          <div
                            key={i}
                            className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 p-2.5 rounded-xl text-xs flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-400">{act.type} :</span>
                              <span>{act.description}</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono px-1">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3 mr-auto max-w-lg">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>Gemini traite vos informations et met à jour les modules...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Ex: Crée un devis de 18 000 MAD pour Amine Chraibi, ou passe FAC-2026-002 en Payé..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500 text-white placeholder-slate-500 px-4 py-3 rounded-xl text-sm outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!promptInput.trim() || isLoading}
              className="bg-gradient-to-r from-amber-500 to-[#E2B714] text-slate-950 font-bold px-5 py-3 rounded-xl hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Envoyer</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

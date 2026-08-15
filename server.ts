import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper for Gemini client
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('La clé GEMINI_API_KEY est manquante dans les variables d\'environnement.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Define Function Declarations for Gemini
  const createDocumentTool: FunctionDeclaration = {
    name: 'createDocument',
    description: 'Crée un nouveau document financier (Devis, Facture, Facture d\'acompte, Bon de livraison).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          description: 'Type de document: DEVIS, FACTURE, FACTURE_ACOMPTE, ou BON_LIVRAISON.',
        },
        clientName: {
          type: Type.STRING,
          description: 'Nom du client ou interlocuteur.',
        },
        clientCompany: {
          type: Type.STRING,
          description: 'Raison sociale / Entreprise du client.',
        },
        clientIce: {
          type: Type.STRING,
          description: 'Numéro ICE du client (ex: 003142194000066).',
        },
        clientEmail: {
          type: Type.STRING,
          description: 'Email du client.',
        },
        clientPhone: {
          type: Type.STRING,
          description: 'Téléphone du client.',
        },
        items: {
          type: Type.ARRAY,
          description: 'Liste des prestations ou équipements.',
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING, description: 'Description du poste/prestation.' },
              quantity: { type: Type.NUMBER, description: 'Quantité ou nombre de jours.' },
              unitPrice: { type: Type.NUMBER, description: 'Prix unitaire en MAD HT.' },
            },
            required: ['description', 'quantity', 'unitPrice'],
          },
        },
        tvaRate: {
          type: Type.NUMBER,
          description: 'Taux de TVA en pourcentage (20 ou 0). Par défaut 20.',
        },
        acompteRate: {
          type: Type.NUMBER,
          description: 'Taux d\'acompte en pourcentage (ex: 30, 40, 50, 0). Par défaut 30.',
        },
        notes: {
          type: Type.STRING,
          description: 'Remarques ou conditions particulières sur le document.',
        },
      },
      required: ['type', 'clientName', 'items'],
    },
  };

  const updateDocumentStatusTool: FunctionDeclaration = {
    name: 'updateDocumentStatus',
    description: 'Met à jour le statut d\'un document existant (ex: passer en paye, accorde, envoye, retard, brouillon).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        documentNumber: {
          type: Type.STRING,
          description: 'Numéro du document (ex: FAC-2026-001, DEV-2026-001, BL-2026-001).',
        },
        status: {
          type: Type.STRING,
          description: 'Nouveau statut: brouillon, envoye, accorde, paye, ou retard.',
        },
      },
      required: ['documentNumber', 'status'],
    },
  };

  const createClientTool: FunctionDeclaration = {
    name: 'createClient',
    description: 'Ajoute un nouveau client au CRM apporteurs d\'affaires / réseau.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Nom complet du contact client.' },
        company: { type: Type.STRING, description: 'Nom de l\'entreprise / agence.' },
        ice: { type: Type.STRING, description: 'Identifiant Commun de l\'Entreprise (ICE).' },
        email: { type: Type.STRING, description: 'Email de contact.' },
        phone: { type: Type.STRING, description: 'Numéro de téléphone marocain.' },
        city: { type: Type.STRING, description: 'Ville (ex: Casablanca, Rabat, Marrakech).' },
        sector: {
          type: Type.STRING,
          description: 'Secteur d\'activité: Agence Pub, Marque & Entreprise, Événementiel, Institutionnel, ou Cinéma & TV.',
        },
        acquisitionSource: {
          type: Type.STRING,
          description: 'Provenance/Apporteur d\'affaires (ex: Recommandé par Reda, Instagram Direct).',
        },
        notes: { type: Type.STRING, description: 'Notes confidentielles sur le client.' },
      },
      required: ['name', 'company'],
    },
  };

  const addExpenseTool: FunctionDeclaration = {
    name: 'addExpense',
    description: 'Ajoute une dépense studio / tournage pour le suivi comptable et TVA.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description: 'Catégorie: MATERIEL, EQUIPE, POSTPROD, DEPLACEMENT, ou AUTRE.',
        },
        description: { type: Type.STRING, description: 'Motif ou description de la dépense.' },
        amountMAD: { type: Type.NUMBER, description: 'Montant en Dirhams Marocains (MAD).' },
        deductibleTva: { type: Type.BOOLEAN, description: 'Indique si la TVA est déductible.' },
      },
      required: ['category', 'description', 'amountMAD'],
    },
  };

  const navigateToModuleTool: FunctionDeclaration = {
    name: 'navigateToModule',
    description: 'Change le module actif affiché à l\'écran.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        module: {
          type: Type.STRING,
          description: 'Code du module: docs (Devis/Factures), crm (Clients/Réseau), prod (Gear/CallSheet), stats (Finances/KPIs), expert (Conseils SARL/Auto-Entrepreneur).',
        },
      },
      required: ['module'],
    },
  };

  const updateProfileTool: FunctionDeclaration = {
    name: 'updateProfile',
    description: 'Met à jour les coordonnées juridiques du studio / cinéaste (ICE, IF, RIB, CNSS, etc.).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filmmakerName: { type: Type.STRING, description: 'Nom du vidéaste / studio.' },
        ice: { type: Type.STRING, description: 'Numéro ICE.' },
        ifNumber: { type: Type.STRING, description: 'Identifiant Fiscal (IF).' },
        taxePro: { type: Type.STRING, description: 'Taxe Professionnelle.' },
        cnssNo: { type: Type.STRING, description: 'N° CNSS.' },
        rib: { type: Type.STRING, description: 'RIB bancaire.' },
        bankName: { type: Type.STRING, description: 'Nom de la banque.' },
        email: { type: Type.STRING, description: 'Email professionnel.' },
        phone: { type: Type.STRING, description: 'Téléphone pro.' },
      },
    },
  };

  // API Endpoint for Gemini AI Assistant
  app.post('/api/gemini/assistant', async (req, res) => {
    try {
      const { prompt, history = [], context = {} } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Le champ prompt est obligatoire.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      // If API key is available, call Gemini API
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          const systemInstruction = `
Tu es l'Assistant IA Intelligent de CineManage Pro, une application marocaine spécialisée pour les réalisateurs, chefs opérateurs, vidéastes et maisons de production en transition Auto-Entrepreneur -> SARL au Maroc.

Informations du studio actuel:
- Nom: ${context.profile?.filmmakerName || 'Taha Hafsi'}
- Titre: ${context.profile?.title || 'Expert Audiovisuel'}
- ICE: ${context.profile?.ice || '003142194000066'}

Statistiques & État actuel de l'application:
- Nombre de documents: ${context.documentsCount || 0}
- Nombre de clients CRM: ${context.clientsCount || 0}
- Clients enregistrés: ${(context.clientNames || []).join(', ')}
- Documents récents: ${(context.recentDocs || []).join(', ')}
- Dépenses enregistrées: ${context.expensesCount || 0}
- Total CA Cumulé: ${context.totalCA || 0} MAD

Rôle et comportement:
1. Comprends l'instruction de l'utilisateur en français (ou darija/anglais si utilisé).
2. Utilise les fonctions (tools) mises à ta disposition pour créer des devis, factures, bons de livraison, ajouter des clients, enregistrer des dépenses, changer le statut de documents ou naviguer dans les modules.
3. Si la demande de l'utilisateur implique de créer un devis ou une facture, utilise la fonction 'createDocument'. Si l'utilisateur mentionne un client existant, réutilise ses informations ou son nom.
4. Si l'utilisateur te demande des conseils juridiques/fiscaux (plafond AE à 200k MAD, TVA 20%, transition SARL AU, retenue à la source, ICE B2B, Loi 2-00 droit d'auteur, D.O.C. acomptes), réponds de façon claire, synthétique et experte selon la réglementation marocaine du CGI et du droit des affaires.
5. Donne toujours une réponse textuelle aimable et professionnelle en français expliquant les actions exécutées et les détails pertinents.
`.trim();

          // Format message history safely
          const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
          if (Array.isArray(history) && history.length > 0) {
            for (const h of history) {
              if (h && typeof h.content === 'string' && h.content.trim().length > 0) {
                formattedContents.push({
                  role: h.role === 'user' ? 'user' : 'model',
                  parts: [{ text: h.content.trim() }],
                });
              }
            }
          }

          formattedContents.push({
            role: 'user',
            parts: [{ text: prompt.trim() }],
          });

          // Attempt with gemini-2.5-flash / gemini-3.7-flash
          let modelName = 'gemini-2.5-flash';
          let response;
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents: formattedContents,
              config: {
                systemInstruction,
                tools: [
                  {
                    functionDeclarations: [
                      createDocumentTool,
                      updateDocumentStatusTool,
                      createClientTool,
                      addExpenseTool,
                      navigateToModuleTool,
                      updateProfileTool,
                    ],
                  },
                ],
              },
            });
          } catch (modelErr: any) {
            console.warn('Fallback model attempt with gemini-3.7-flash:', modelErr.message);
            modelName = 'gemini-3.7-flash';
            response = await ai.models.generateContent({
              model: modelName,
              contents: formattedContents,
              config: {
                systemInstruction,
                tools: [
                  {
                    functionDeclarations: [
                      createDocumentTool,
                      updateDocumentStatusTool,
                      createClientTool,
                      addExpenseTool,
                      navigateToModuleTool,
                      updateProfileTool,
                    ],
                  },
                ],
              },
            });
          }

          const text = response.text || '';
          const functionCalls = response.functionCalls || [];

          return res.json({
            reply: text || 'J\'ai bien exécuté votre instruction.',
            functionCalls,
          });
        } catch (apiError: any) {
          console.warn('Gemini API remote error, activating smart local assistant fallback:', apiError.message);
          // Fall through to smart local intent parser
        }
      }

      // Smart Local Assistant Engine (Fallback for offline/network/intent handling)
      const p = prompt.toLowerCase();
      const functionCalls: any[] = [];
      let reply = '';

      if (p.includes('devis') || p.includes('facture') || p.includes('bon de livraison') || p.includes('bl')) {
        const isFacture = p.includes('facture') && !p.includes('acompte');
        const isAcompte = p.includes('acompte');
        const isBL = p.includes('bon de livraison') || p.includes('bl');
        const docType = isBL ? 'BON_LIVRAISON' : isAcompte ? 'FACTURE_ACOMPTE' : isFacture ? 'FACTURE' : 'DEVIS';

        // Extract amount if present
        const amountMatch = prompt.match(/(\d+[\s\d]*)\s*(?:mad|dh|dirhams|dhs)/i) || prompt.match(/(\d{4,6})/);
        const amount = amountMatch ? parseInt(amountMatch[1].replace(/\s/g, ''), 10) : 15000;

        // Extract client name
        let clientName = 'Client Projet';
        let clientCompany = 'Entreprise Partenaire';
        if (p.includes('salma') || p.includes('hotel') || p.includes('maroc luxury')) {
          clientName = 'Salma Bennis';
          clientCompany = 'Maroc Luxury Hotel Casablanca';
        } else if (p.includes('havas') || p.includes('amine')) {
          clientName = 'Amine Bennani';
          clientCompany = 'Havas Media Casablanca';
        } else if (p.includes('khalid') || p.includes('sahara')) {
          clientName = 'Khalid Tazi';
          clientCompany = 'Sahara Film Productions Marrakech';
        } else if (p.includes('youssef') || p.includes('atlas')) {
          clientName = 'Youssef El Mansouri';
          clientCompany = 'Atlas Creative Studios Rabat';
        }

        functionCalls.push({
          name: 'createDocument',
          args: {
            type: docType,
            clientName,
            clientCompany,
            clientIce: '003142194000088',
            items: [
              {
                description: p.includes('pub') ? 'Tournage & Réalisation Film Publicitaire HD/4K' : 'Prestation Audiovisuelle Professionnelle',
                quantity: 1,
                unitPrice: amount,
              },
            ],
            tvaRate: 20,
            acompteRate: 30,
            notes: 'Paiement à 30 jours conformément aux conditions générales.',
          },
        });

        reply = `J'ai créé votre ${docType === 'DEVIS' ? 'Devis' : docType === 'FACTURE' ? 'Facture' : 'Document'} de ${amount.toLocaleString('fr-MA')} MAD pour ${clientCompany} (${clientName}). Vous pouvez le consulter et l'éditer dans le module Documents.`;
      } else if (p.includes('payé') || p.includes('paye') || p.includes('statut') || p.includes('regle')) {
        const docMatch = prompt.match(/(?:fac|dev|bl)[\w-]*\d+/i) || ['FAC-2026-001'];
        const docNum = docMatch ? docMatch[0].toUpperCase() : 'FAC-2026-001';

        functionCalls.push({
          name: 'updateDocumentStatus',
          args: {
            documentNumber: docNum,
            status: 'paye',
          },
        });

        reply = `Le document ${docNum} a bien été marqué comme Payé (Encaissé). Le chiffre d'affaires et les statistiques ont été actualisés.`;
      } else if (p.includes('client') && (p.includes('ajoute') || p.includes('crée') || p.includes('nouveau'))) {
        functionCalls.push({
          name: 'createClient',
          args: {
            name: 'Nouveau Contact Commercial',
            company: 'Nouvelle Agence / Marque B2B',
            ice: '002984123000088',
            email: 'contact@agence-maroc.ma',
            phone: '+212 6 61 00 00 00',
            city: 'Casablanca',
            sector: 'Agence Pub',
            acquisitionSource: 'Assistant Gemini AI',
            notes: 'Client potentiel créé via l\'assistant.',
          },
        });

        reply = `Le nouveau client a été enregistré avec succès dans votre carnet d'adresses et réseau CRM.`;
      } else if (p.includes('dépense') || p.includes('depense') || p.includes('achat') || p.includes('louer') || p.includes('location')) {
        const amountMatch = prompt.match(/(\d+[\s\d]*)\s*(?:mad|dh|dirhams)/i) || [null, '3500'];
        const amount = amountMatch[1] ? parseInt(amountMatch[1].replace(/\s/g, ''), 10) : 3500;

        functionCalls.push({
          name: 'addExpense',
          args: {
            category: 'MATERIEL',
            description: prompt.replace(/enregistre|ajoute|une|dépense|de|\d+|mad|dh/gi, '').trim() || 'Location Matériel Tournage',
            amountMAD: amount,
            deductibleTva: true,
          },
        });

        reply = `Dépense de ${amount.toLocaleString('fr-MA')} MAD enregistrée avec succès. La TVA déductible est prise en compte dans votre bilan.`;
      } else if (p.includes('sarl') || p.includes('auto-entrepreneur') || p.includes('plafond') || p.includes('conseil') || p.includes('fiscal')) {
        reply = `📊 **Analyse Fiscale & Recommandation Transition SARL AU :**\n\n` +
          `• **Plafond Légal Auto-Entrepreneur :** 200 000 MAD / an pour les prestations de services audiovisuelles (impôt libératoire de 1% jusqu'au plafond).\n` +
          `• **TVA 20% & Récupération Matériel :** En SARL AU, vous facturez la TVA 20% que vos clients B2B déduisent intégralement, et vous récupérez 20% sur tous vos achats de caméras, optiques et éclairages.\n` +
          `• **Crédibilité & Appels d'Offres :** Les grandes agences et comptes corporate exigent un ICE et une facture avec TVA pour leurs bilans.\n` +
          `• **Responsabilité :** Votre patrimoine personnel est protégé à hauteur du capital social sous forme de SARL.`;
      } else {
        reply = `J'ai bien reçu votre demande : "${prompt}". Je peux créer des devis, factures, enregistrer vos clients, dépenses ou vous guider sur la législation marocaine audiovisuelle et SARL. Que souhaitez-vous faire ?`;
      }

      res.json({
        reply,
        functionCalls,
      });
    } catch (err: any) {
      console.error('Erreur API Gemini Assistant:', err);
      res.status(500).json({
        error: err.message || 'Une erreur est survenue lors de la communication avec Gemini.',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur CineManage Pro démarré sur http://localhost:${PORT}`);
  });
}

startServer();

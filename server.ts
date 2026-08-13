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

      const ai = getAiClient();

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
4. Si l'utilisateur te demande des conseils juridiques/fiscaux (plafond AE à 200k MAD, TVA 20%, transition SARL AU, retenue à la source, ICE B2B), réponds de façon claire, synthétique et experte selon la réglementation marocaine du CGI.
5. Donne toujours une réponse textuelle aimable et professionnelle en français expliquant les actions exécutées et les détails pertinents.
`.trim();

      // Format message history
      const formattedContents = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const h of history) {
          formattedContents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          });
        }
      }

      formattedContents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
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

      const text = response.text || '';
      const functionCalls = response.functionCalls || [];

      res.json({
        reply: text || 'J\'ai bien pris en compte votre demande.',
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

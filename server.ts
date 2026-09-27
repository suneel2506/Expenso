import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON with higher limit for bill image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn('⚠️ GEMINI_API_KEY is not set. AI bill scanning will use fallback parser.');
}

// Helper to call Gemini with retry and fallback model for transient high-demand (503 / 429) errors
async function generateContentWithRetry(params: any, retries = 2, delayMs = 600): Promise<any> {
  if (!ai) {
    throw new Error('Gemini API is not initialized.');
  }

  const primaryModel = params.model || 'gemini-3.8-flash';
  const modelsToTry = [primaryModel, 'gemini-3.8-flash', 'gemini-3.1-flash-lite'].filter(
    (m, i, self) => Boolean(m) && self.indexOf(m) === i
  );

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMessage = err?.message || JSON.stringify(err) || '';
        const isTransient =
          errMessage.includes('503') ||
          errMessage.includes('429') ||
          errMessage.includes('404') ||
          errMessage.includes('UNAVAILABLE') ||
          errMessage.includes('high demand') ||
          errMessage.includes('Overloaded') ||
          errMessage.includes('not found');

        if (isTransient && attempt < retries) {
          console.warn(
            `[Gemini Retry] ${modelName} transient issue (attempt ${attempt + 1}/${retries}). Retrying...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
        } else {
          // Move to next fallback model
          break;
        }
      }
    }
  }

  throw lastError;
}

// In-memory / file backed data persistence
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStoredData(): { trips: any[] } {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading stored data:', err);
  }
  return { trips: [] };
}

function writeStoredData(data: { trips: any[] }) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing stored data:', err);
  }
}

// SSE Realtime Subscriptions
interface SSEClient {
  id: string;
  tripId: string;
  res: Response;
}

let sseClients: SSEClient[] = [];

// SSE Registration endpoint
app.get('/api/events', (req: Request, res: Response) => {
  const tripId = (req.query.tripId as string) || 'all';
  const clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId })}\n\n`);

  const client: SSEClient = { id: clientId, tripId, res };
  sseClients.push(client);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// Periodic heartbeat to prevent timeout
setInterval(() => {
  sseClients.forEach((client) => {
    try {
      client.res.write(`:ping\n\n`);
    } catch {
      // client disconnected
    }
  });
}, 25000);

// Broadcast an event to all clients watching a trip
app.post('/api/broadcast', (req: Request, res: Response) => {
  const { tripId, event, payload } = req.body;
  
  const relevantClients = sseClients.filter(
    (c) => c.tripId === tripId || c.tripId === 'all'
  );

  const message = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  relevantClients.forEach((client) => {
    try {
      client.res.write(`data: ${message}\n\n`);
    } catch (err) {
      console.error('SSE send error:', err);
    }
  });

  res.json({ success: true, recipients: relevantClients.length });
});

// API Routes for Trips
app.get('/api/trips', (_req: Request, res: Response) => {
  const data = readStoredData();
  res.json({ trips: data.trips });
});

app.post('/api/trips', (req: Request, res: Response) => {
  const trip = req.body;
  if (!trip || !trip.id) {
    return res.status(400).json({ error: 'Valid trip object with id is required' });
  }

  const data = readStoredData();
  const existingIndex = data.trips.findIndex((t) => t.id === trip.id);
  if (existingIndex >= 0) {
    data.trips[existingIndex] = trip;
  } else {
    data.trips.push(trip);
  }
  writeStoredData(data);

  res.json({ success: true, trip });
});

app.put('/api/trips/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const trip = req.body;

  const data = readStoredData();
  const existingIndex = data.trips.findIndex((t) => t.id === id);
  if (existingIndex >= 0) {
    data.trips[existingIndex] = { ...data.trips[existingIndex], ...trip, updatedAt: new Date().toISOString() };
    writeStoredData(data);
    res.json({ success: true, trip: data.trips[existingIndex] });
  } else {
    data.trips.push(trip);
    writeStoredData(data);
    res.json({ success: true, trip });
  }
});

app.delete('/api/trips', (_req: Request, res: Response) => {
  writeStoredData({ trips: [] });
  res.json({ success: true, message: 'All trips cleared' });
});

app.delete('/api/trips/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = readStoredData();
  data.trips = data.trips.filter((t) => t.id !== id);
  writeStoredData(data);
  res.json({ success: true, message: 'Trip deleted' });
});

// AI Bill Scanning Endpoint using @google/genai
app.post('/api/scan-bill', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 string is required' });
    }

    if (!ai) {
      console.warn('GEMINI_API_KEY is not set. Returning fallback scan response.');
      return res.json({
        success: true,
        data: {
          merchant: 'Scanned Receipt',
          amount: 0,
          currency: 'INR',
          date: new Date().toISOString().split('T')[0],
          tax: 0,
          category: 'Food',
          items: [],
          paymentMethod: 'UPI',
          suggestedDescription: 'Receipt attached (enter amount manually)',
          confidence: 0.7,
        },
      });
    }

    // Strip data URL header if included
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const promptText = `Analyze this receipt or bill image with high precision.
Extract the following information:
1. Merchant/Store/Restaurant/Vendor name
2. Grand Total Amount in Indian Rupees (INR) - find the final payable amount including taxes and discounts.
3. Date of the bill (formatted as YYYY-MM-DD, e.g. 2026-09-24). If year is missing, assume 2026.
4. Total Tax / GST / VAT amount if listed (or 0 if none).
5. Category: choose the closest match among: 'Food', 'Transport', 'Stay', 'Activities', 'Shopping', 'Snacks', 'Fuel', 'Medical', 'Other'.
6. Breakdown of individual purchased items (name, price, quantity) if visible.
7. Payment method if noted (e.g. UPI, Card, Cash).
8. A short, natural, friendly 1-sentence description suitable for friends on a trip (e.g., "Dinner for the crew at XYZ", "Cab ride to Pondicherry").

Be conservative with the total amount: find the true net total bill payable.`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: {
              type: Type.STRING,
              description: 'Name of the merchant, restaurant, hotel, or vendor',
            },
            amount: {
              type: Type.NUMBER,
              description: 'Total payable amount in INR (numbers only, no currency symbol)',
            },
            currency: {
              type: Type.STRING,
              description: 'Currency code, defaults to INR',
            },
            date: {
              type: Type.STRING,
              description: 'Date in YYYY-MM-DD format',
            },
            tax: {
              type: Type.NUMBER,
              description: 'Total tax / GST amount',
            },
            category: {
              type: Type.STRING,
              description: 'One of Food, Transport, Stay, Activities, Shopping, Snacks, Fuel, Medical, Other',
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  quantity: { type: Type.NUMBER },
                },
              },
            },
            paymentMethod: {
              type: Type.STRING,
            },
            suggestedDescription: {
              type: Type.STRING,
              description: 'Friendly 1-sentence group trip expense description',
            },
          },
        },
      },
    });

    const responseText = response.text?.trim() || '{}';
    const parsedData = JSON.parse(responseText);

    return res.json({
      success: true,
      data: {
        merchant: parsedData.merchant || 'Unknown Merchant',
        amount: Number(parsedData.amount) || 0,
        currency: parsedData.currency || 'INR',
        date: parsedData.date || new Date().toISOString().split('T')[0],
        tax: Number(parsedData.tax) || 0,
        category: parsedData.category || 'Food',
        items: parsedData.items || [],
        paymentMethod: parsedData.paymentMethod || 'UPI',
        suggestedDescription: parsedData.suggestedDescription || '',
        confidence: 0.95,
      },
    });
  } catch (err: any) {
    console.warn('[Bill Scan Fallback] AI model unavailable or busy:', err?.message || err);
    return res.json({
      success: true,
      data: {
        merchant: 'Scanned Bill',
        amount: 0,
        currency: 'INR',
        date: new Date().toISOString().split('T')[0],
        tax: 0,
        category: 'Food',
        items: [],
        paymentMethod: 'UPI',
        suggestedDescription: 'Scanned bill receipt attached',
        confidence: 0.6,
      },
    });
  }
});

// AI Description Generator Endpoint
app.post('/api/generate-description', async (req: Request, res: Response) => {
  try {
    const { merchant, amount, category, items, tripName, location } = req.body;

    if (!ai) {
      const fallbackDesc = merchant ? `${category || 'Expense'} at ${merchant}` : 'Group expense';
      return res.json({ description: fallbackDesc });
    }

    const prompt = `Write a short, fun, natural 1-sentence human description for a college/friends trip expense.
Context:
- Merchant: ${merchant || 'Unknown'}
- Amount: ₹${amount || 0}
- Category: ${category || 'General'}
- Trip: ${tripName || 'Travel Outing'}
- Location: ${location || 'India'}
- Items: ${items && items.length ? items.map((i: any) => i.name).join(', ') : 'None listed'}

Examples of tone:
- "Dinner for the crew at ABC Restaurant."
- "Cab ride from Chennai to Pondicherry."
- "Hotel accommodation for the crew at Ocean Spray."
- "Morning croissants and coffee at Auroville Bakery."

Return ONLY the sentence, with no surrounding quotes or extra commentary.`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const description = response.text?.trim() || `${category || 'Expense'} at ${merchant}`;
    res.json({ description });
  } catch (err: any) {
    console.error('Error generating description:', err);
    res.json({ description: `${req.body.category || 'Expense'} at ${req.body.merchant || 'Store'}` });
  }
});

// Setup Vite middleware in dev or serve static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: __dirname,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req: Request, res: Response, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Expenso server running at http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

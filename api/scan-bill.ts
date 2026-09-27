import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: any, res: any) {
  // CORS support
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 string is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY is not set on Vercel. Returning fallback data.');
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
        suggestedDescription: 'Receipt attached (please enter amount)',
        confidence: 0.5,
      },
      warning: 'GEMINI_API_KEY environment variable is not configured on Vercel.',
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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

    const modelsToTry = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let lastError: any = null;
    let response: any = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
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
        if (response && response.text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini Model Error] ${modelName} failed, trying next model:`, err?.message);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('No response from AI model');
    }

    const responseText = response.text.trim();
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
    console.error('Scan error:', err?.message || err);
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
        suggestedDescription: 'Scanned bill attached',
        confidence: 0.5,
      },
      warning: 'AI parsing unavailable. You can enter details manually.',
    });
  }
}

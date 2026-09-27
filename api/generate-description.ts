import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
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

  const { merchant, amount, category, items, tripName, location } = req.body || {};
  const defaultDesc = merchant ? `${category || 'Expense'} at ${merchant}` : 'Group expense';

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({ description: defaultDesc });
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const description = response.text?.trim() || defaultDesc;
    return res.json({ description });
  } catch (err: any) {
    console.error('Error generating description:', err?.message || err);
    return res.json({ description: defaultDesc });
  }
}

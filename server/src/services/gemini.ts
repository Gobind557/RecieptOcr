import fs from 'fs';
import { LLMReceipt, LLMReceiptSchema } from '../types';

const systemInstruction = `You are a receipt parsing expert. Your goal is to extract structured information from receipt images.
Return ONLY valid JSON.
Return exactly this JSON shape:
{
  "merchant": string | null,
  "date": "YYYY-MM-DD" | null,
  "subtotal": number | null,
  "tax": number | null,
  "tip": number | null,
  "discount": number | null,
  "total": number | null,
  "lineItems": [{ "name": string, "amount": number }],
  "confidence": number,
  "uncertainFields": string[]
}

Important:
- Line items should only be actual purchased items.
- Do NOT include taxes, tips, or discounts in the line items list.
- If a field is missing, return null for scalar fields and [] for arrays.
- Always include every top-level key.
- Use only numbers for money values, without currency symbols.
- Infer confidence based on image clarity and data consistency, such as whether line items sum up to subtotal.`;

function parseJsonResponse(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  return JSON.parse(cleaned);
}

type RawLineItem = {
  name?: unknown;
  item?: unknown;
  description?: unknown;
  amount?: unknown;
  price?: unknown;
  total?: unknown;
};

type RawReceipt = {
  merchant?: unknown;
  merchantName?: unknown;
  store?: unknown;
  date?: unknown;
  transactionDate?: unknown;
  subtotal?: unknown;
  tax?: unknown;
  tip?: unknown;
  discount?: unknown;
  total?: unknown;
  grandTotal?: unknown;
  lineItems?: unknown;
  items?: unknown;
  confidence?: unknown;
  uncertainFields?: unknown;
};

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeReceipt(raw: RawReceipt) {
  const rawItems = Array.isArray(raw.lineItems)
    ? raw.lineItems
    : Array.isArray(raw.items)
      ? raw.items
      : [];

  const lineItems = rawItems
    .map((item): { name: string; amount: number } | null => {
      const rawItem = item as RawLineItem;
      const name = toNullableString(rawItem.name ?? rawItem.item ?? rawItem.description);
      const amount = toNullableNumber(rawItem.amount ?? rawItem.price ?? rawItem.total);
      if (!name || amount === null) return null;
      return { name, amount };
    })
    .filter((item): item is { name: string; amount: number } => item !== null);

  const confidence = toNullableNumber(raw.confidence);

  return {
    merchant: toNullableString(raw.merchant ?? raw.merchantName ?? raw.store),
    date: toNullableString(raw.date ?? raw.transactionDate),
    subtotal: toNullableNumber(raw.subtotal),
    tax: toNullableNumber(raw.tax),
    tip: toNullableNumber(raw.tip),
    discount: toNullableNumber(raw.discount),
    total: toNullableNumber(raw.total ?? raw.grandTotal),
    lineItems,
    confidence: confidence === null ? 0.5 : Math.max(0, Math.min(1, confidence)),
    uncertainFields: Array.isArray(raw.uncertainFields)
      ? raw.uncertainFields.filter((field): field is string => typeof field === 'string')
      : [],
  };
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function parseReceiptImage(
  imagePath: string,
  mimeType = 'image/jpeg',
): Promise<LLMReceipt> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const base64Image = fs.readFileSync(imagePath, { encoding: 'base64' });
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      generationConfig: {
        responseMimeType: 'application/json',
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Extract data from this receipt image. Return JSON ONLY.',
            },
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
    }),
  });

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || 'Gemini request failed');
  }

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error('No response from Gemini');

  const parsed = normalizeReceipt(parseJsonResponse(content) as RawReceipt);
  return LLMReceiptSchema.parse(parsed);
}

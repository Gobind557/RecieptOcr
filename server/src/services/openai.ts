import OpenAI from 'openai';
import fs from 'fs';
import { LLMReceipt, LLMReceiptSchema } from '../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function parseReceiptImage(imagePath: string): Promise<LLMReceipt> {
  const base64Image = fs.readFileSync(imagePath, { encoding: 'base64' });
  const extension = imagePath.split('.').pop() || 'jpeg';

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a receipt parsing expert. Your goal is to extract structured information from receipt images.
        Return ONLY valid JSON. 
        Extract:
        - merchant name
        - date (YYYY-MM-DD)
        - subtotal, tax, tip, discount, total (as numbers)
        - line items (name and amount)
        - heuristic confidence (0-1)
        - uncertainFields: list of field names you are not sure about.
        
        Important:
        - Line items should only be actual purchased items.
        - Do NOT include taxes, tips, or discounts in the line items list.
        - If a field is missing, return null.
        - Infer confidence based on image clarity and data consistency (e.g., do line items sum up to subtotal?).`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract data from this receipt image. Return JSON ONLY."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/${extension};base64,${base64Image}`
            }
          }
        ]
      }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from OpenAI");

  const parsed = JSON.parse(content);
  return LLMReceiptSchema.parse(parsed);
}

import { z } from 'zod';

export const LineItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  amount: z.number(),
  confidence: z.number().optional().default(1.0)
});

export const ReceiptSchema = z.object({
  id: z.string().optional(),
  merchant: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  tax: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  tip: z.number().nullable().optional(),
  total: z.number().nullable().optional(),
  confidence: z.number().optional().default(1.0),
  lineItems: z.array(LineItemSchema).optional().default([]),
  status: z.string().optional().default('pending'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type LineItem = z.infer<typeof LineItemSchema>;
export type Receipt = z.infer<typeof ReceiptSchema>;

export const LLMReceiptSchema = z.object({
  merchant: z.string().describe("Name of the merchant or store"),
  date: z.string().describe("Date of the receipt in YYYY-MM-DD format if possible"),
  subtotal: z.number().nullable(),
  tax: z.number().nullable(),
  tip: z.number().nullable(),
  discount: z.number().nullable(),
  total: z.number().nullable(),
  lineItems: z.array(z.object({
    name: z.string(),
    amount: z.number()
  })),
  confidence: z.number().describe("Heuristic confidence score between 0 and 1"),
  uncertainFields: z.array(z.string()).describe("List of field names that were difficult to extract or uncertain")
});

export type LLMReceipt = z.infer<typeof LLMReceiptSchema>;

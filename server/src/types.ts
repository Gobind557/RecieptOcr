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
  merchant: z.string().nullable().optional().default(null).describe("Name of the merchant or store"),
  date: z.string().nullable().optional().default(null).describe("Date of the receipt in YYYY-MM-DD format if possible"),
  subtotal: z.number().nullable().optional().default(null),
  tax: z.number().nullable().optional().default(null),
  tip: z.number().nullable().optional().default(null),
  discount: z.number().nullable().optional().default(null),
  total: z.number().nullable().optional().default(null),
  lineItems: z.array(z.object({
    name: z.string(),
    amount: z.number()
  })).optional().default([]),
  confidence: z.number().optional().default(0.5).describe("Heuristic confidence score between 0 and 1"),
  uncertainFields: z.array(z.string()).optional().default([]).describe("List of field names that were difficult to extract or uncertain")
});

export type LLMReceipt = z.infer<typeof LLMReceiptSchema>;

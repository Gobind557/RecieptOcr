export interface LineItem {
  id?: string;
  name: string;
  amount: number;
  confidence?: number;
}

export interface Receipt {
  id?: string;
  merchant: string | null;
  date: string | null;
  subtotal: number | null;
  tax: number | null;
  discount: number | null;
  tip: number | null;
  total: number | null;
  confidence: number;
  lineItems: LineItem[];
  status?: 'pending' | 'saved';
  createdAt?: string;
  updatedAt?: string;
}

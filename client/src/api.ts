import { Receipt } from './types';

const API_BASE = 'http://localhost:3001/api';

export const api = {
  async parseReceipt(file: File): Promise<Receipt> {
    const formData = new FormData();
    formData.append('receipt', file);

    const response = await fetch(`${API_BASE}/parse-receipt`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to parse receipt');
    }

    return response.json();
  },

  async saveReceipt(receipt: Receipt): Promise<void> {
    const response = await fetch(`${API_BASE}/receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receipt),
    });

    if (!response.ok) throw new Error('Failed to save receipt');
  },

  async getReceipts(): Promise<Receipt[]> {
    const response = await fetch(`${API_BASE}/receipts`);
    if (!response.ok) throw new Error('Failed to fetch receipts');
    return response.json();
  },

  async getReceipt(id: string): Promise<Receipt> {
    const response = await fetch(`${API_BASE}/receipts/${id}`);
    if (!response.ok) throw new Error('Failed to fetch receipt');
    return response.json();
  }
};

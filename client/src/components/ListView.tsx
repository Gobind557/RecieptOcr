import React, { useEffect, useState } from 'react';
import { Calendar, ChevronRight, Clock, FileText, Loader2, Plus } from 'lucide-react';
import { api } from '../api';
import type { Receipt } from '../types';

interface Props {
  onSelect: (receipt: Receipt) => void;
  onNew: () => void;
}

export const ListView: React.FC<Props> = ({ onSelect, onNew }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.getReceipts();
      setReceipts(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (id: string) => {
    try {
      const receipt = await api.getReceipt(id);
      onSelect(receipt);
    } catch {
      setError(true);
    }
  };

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">My Receipts</h1>
          <p className="mt-1 text-sm text-slate-500">Open a saved receipt to review or correct it again.</p>
        </div>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-700"
        >
          <Plus size={16} />
          New Receipt
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
            <Loader2 className="animate-spin" size={18} />
            Loading receipts...
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <h2 className="text-sm font-medium text-slate-900">We could not load receipts.</h2>
            <p className="mt-1 text-sm text-slate-500">Check the server connection and try again.</p>
            <button
              onClick={loadReceipts}
              className="mt-4 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Retry
            </button>
          </div>
        ) : receipts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <FileText size={22} />
            </div>
            <h2 className="text-sm font-medium text-slate-900">No saved receipts yet</h2>
            <p className="mt-1 text-sm text-slate-500">Upload a receipt and save it after review.</p>
            <button
              onClick={onNew}
              className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Upload Receipt
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {receipts.map((receipt) => (
              <button
                key={receipt.id}
                onClick={() => receipt.id && handleSelect(receipt.id)}
                className="grid w-full grid-cols-1 gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 sm:grid-cols-[1fr_150px_32px] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-slate-950">
                        {receipt.merchant || 'Unknown Merchant'}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={13} />
                          {receipt.date || 'No date'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={13} />
                          {receipt.createdAt
                            ? new Date(receipt.createdAt).toLocaleDateString()
                            : 'Unknown save date'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-sm font-semibold text-slate-950">
                    ${Number(receipt.total || 0).toFixed(2)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{receipt.lineItems?.length || 0} items</div>
                </div>

                <ChevronRight className="hidden text-slate-300 sm:block" size={18} />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

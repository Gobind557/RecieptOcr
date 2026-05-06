import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import type { LineItem, Receipt } from '../types';
import { api } from '../api';
import { confidenceTone, UncertainHighlight } from './UncertainHighlight';

interface Props {
  receipt: Receipt;
  onBack: () => void;
  onSave: () => void;
}

const money = (value: number | null | undefined) => Number(value || 0).toFixed(2);

export const ReviewView: React.FC<Props> = ({ receipt: initialReceipt, onBack, onSave }) => {
  const [receipt, setReceipt] = useState<Receipt>(initialReceipt);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const updateField = <K extends keyof Receipt>(field: K, value: Receipt[K]) => {
    setReceipt((prev) => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  };

  const updateLineItem = <K extends keyof LineItem>(index: number, field: K, value: LineItem[K]) => {
    const newLineItems = [...receipt.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    setReceipt((prev) => ({ ...prev, lineItems: newLineItems }));
    setSaveStatus('idle');
  };

  const addLineItem = () => {
    setReceipt((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { name: '', amount: 0, confidence: 0.75 }],
    }));
  };

  const removeLineItem = (index: number) => {
    setReceipt((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
  };

  const subtotalFromItems = receipt.lineItems.reduce(
    (acc, item) => acc + (Number(item.amount) || 0),
    0,
  );
  const calculatedTotal =
    subtotalFromItems +
    (Number(receipt.tax) || 0) +
    (Number(receipt.tip) || 0) -
    (Number(receipt.discount) || 0);
  const isMismatch = Math.abs(calculatedTotal - (Number(receipt.total) || 0)) > 0.01;

  const reviewItems = useMemo(() => {
    const items: string[] = [];

    if (!receipt.merchant || confidenceTone(receipt.confidence) === 'low') {
      items.push('Merchant or receipt summary may need review.');
    }
    if (!receipt.date) items.push('Transaction date is missing.');
    if (!receipt.total) items.push('Total is missing or could not be read clearly.');
    if (isMismatch) items.push(`Line items calculate to $${money(calculatedTotal)} before saving.`);

    receipt.lineItems.forEach((item, index) => {
      if (!item.name || confidenceTone(item.confidence) === 'low' || !Number(item.amount)) {
        items.push(`Line item ${index + 1} may be incomplete.`);
      }
    });

    return items;
  }, [calculatedTotal, isMismatch, receipt]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await api.saveReceipt(receipt);
      setSaveStatus('success');
      setTimeout(onSave, 900);
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-md px-1 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Upload another
        </button>

        <div className="flex items-center gap-3">
          {saveStatus === 'success' && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
              <CheckCircle2 size={16} />
              Receipt saved successfully.
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm font-medium text-red-700">Unable to save. Please try again.</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-700 disabled:bg-slate-300"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {receipt.id && receipt.status === 'saved' ? 'Update Receipt' : 'Save Receipt'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-950">Receipt Review</h1>
              <p className="mt-1 text-sm text-slate-500">Review highlighted fields before saving.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {reviewItems.length
                ? `${reviewItems.length} ${reviewItems.length === 1 ? 'field' : 'fields'} may need review`
                : 'Ready to save'}
            </div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                label="Merchant"
                value={receipt.merchant || ''}
                confidence={receipt.confidence}
                onChange={(value) => updateField('merchant', value)}
              />
              <DateField
                label="Date"
                value={receipt.date || ''}
                confidence={receipt.date ? receipt.confidence : 0.6}
                onChange={(value) => updateField('date', value)}
              />
              <MoneyField
                label="Total"
                value={receipt.total}
                confidence={isMismatch || !receipt.total ? 0.65 : receipt.confidence}
                emphasis
                onChange={(value) => updateField('total', value)}
              />
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">Line Items</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Edit extracted rows directly. Add any missing items before saving.
                  </p>
                </div>
                <button
                  onClick={addLineItem}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Plus size={15} />
                  Add item
                </button>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full table-fixed">
                  <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="w-36 px-4 py-3 text-right">Amount</th>
                      <th className="w-12 px-2 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receipt.lineItems.map((item, index) => {
                      const itemNeedsReview =
                        !item.name || !Number(item.amount) || confidenceTone(item.confidence) === 'low';

                      return (
                        <tr key={item.id || index} className={itemNeedsReview ? 'bg-amber-50/50' : 'bg-white'}>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                              className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-slate-800 outline-none transition-colors focus:border-slate-300 focus:bg-white"
                              placeholder="Item description"
                            />
                            {itemNeedsReview && (
                              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-800">
                                <AlertTriangle size={12} />
                                Needs review
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center rounded-md border border-transparent px-2 py-1.5 focus-within:border-slate-300 focus-within:bg-white">
                              <span className="text-sm text-slate-400">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={item.amount}
                                onChange={(e) =>
                                  updateLineItem(index, 'amount', Number.parseFloat(e.target.value) || 0)
                                }
                                className="w-full bg-transparent text-right text-sm font-medium text-slate-800 outline-none"
                              />
                            </div>
                          </td>
                          <td className="px-2 py-2 text-right">
                            <button
                              onClick={() => removeLineItem(index)}
                              className="rounded-md p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600"
                              aria-label="Remove item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {receipt.lineItems.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-500">
                          No line items were extracted. Add items manually.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="border-t border-slate-200 bg-slate-50/70 p-6 lg:border-l lg:border-t-0">
            <section>
              <h2 className="text-sm font-semibold text-slate-950">Needs Review</h2>
              <div className="mt-3 space-y-2">
                {reviewItems.length ? (
                  reviewItems.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                    >
                      <AlertTriangle className="mt-0.5 shrink-0" size={15} />
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    <CheckCircle2 className="mt-0.5 shrink-0" size={15} />
                    No obvious issues found. A quick human check is still recommended.
                  </div>
                )}
              </div>
            </section>

            <section className="mt-6">
              <h2 className="text-sm font-semibold text-slate-950">Totals</h2>
              <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
                <CompactMoneyField
                  label="Subtotal"
                  value={receipt.subtotal}
                  onChange={(value) => updateField('subtotal', value)}
                />
                <CompactMoneyField
                  label="Tax"
                  value={receipt.tax}
                  onChange={(value) => updateField('tax', value)}
                />
                <CompactMoneyField
                  label="Tip"
                  value={receipt.tip}
                  onChange={(value) => updateField('tip', value)}
                />
                <CompactMoneyField
                  label="Discount"
                  value={receipt.discount}
                  onChange={(value) => updateField('discount', value)}
                />
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">Calculated</span>
                    <span className={`font-semibold ${isMismatch ? 'text-amber-700' : 'text-slate-900'}`}>
                      ${money(calculatedTotal)}
                    </span>
                  </div>
                  {isMismatch && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-amber-800">
                      <Calculator size={13} />
                      This differs from the saved total.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
};

interface FieldProps {
  label: string;
  value: string;
  confidence: number;
  onChange: (value: string) => void;
}

const TextField: React.FC<FieldProps> = ({ label, value, confidence, onChange }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
    <UncertainHighlight confidence={confidence} label="Check field">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-slate-400"
      />
    </UncertainHighlight>
  </label>
);

const DateField: React.FC<FieldProps> = ({ label, value, confidence, onChange }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
    <UncertainHighlight confidence={confidence} label="Check date">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-slate-400"
      />
    </UncertainHighlight>
  </label>
);

interface MoneyFieldProps {
  label: string;
  value: number | null;
  confidence: number;
  emphasis?: boolean;
  onChange: (value: number) => void;
}

const MoneyField: React.FC<MoneyFieldProps> = ({ label, value, confidence, emphasis, onChange }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
    <UncertainHighlight confidence={confidence} label="Check total">
      <div className="flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 focus-within:border-slate-400">
        <span className="text-sm text-slate-400">$</span>
        <input
          type="number"
          step="0.01"
          value={value || 0}
          onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)}
          className={`w-full bg-transparent text-right outline-none ${
            emphasis ? 'text-lg font-semibold text-slate-950' : 'text-sm font-medium text-slate-900'
          }`}
        />
      </div>
    </UncertainHighlight>
  </label>
);

interface CompactMoneyFieldProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
}

const CompactMoneyField: React.FC<CompactMoneyFieldProps> = ({ label, value, onChange }) => (
  <label className="flex items-center justify-between gap-3 text-sm">
    <span className="text-slate-500">{label}</span>
    <div className="flex w-28 items-center rounded-md border border-slate-200 px-2 py-1 focus-within:border-slate-400">
      <span className="text-xs text-slate-400">$</span>
      <input
        type="number"
        step="0.01"
        value={value || 0}
        onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)}
        className="w-full bg-transparent text-right text-sm font-medium text-slate-900 outline-none"
      />
    </div>
  </label>
);

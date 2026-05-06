import React, { useState, useEffect } from 'react';
import { 
  Save, Trash2, Plus, ArrowLeft, 
  AlertCircle, CheckCircle2, Calculator 
} from 'lucide-react';
import { Receipt, LineItem } from '../types';
import { api } from '../api';
import { UncertainHighlight } from './UncertainHighlight';

interface Props {
  receipt: Receipt;
  onBack: () => void;
  onSave: () => void;
}

export const ReviewView: React.FC<Props> = ({ receipt: initialReceipt, onBack, onSave }) => {
  const [receipt, setReceipt] = useState<Receipt>(initialReceipt);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const updateField = (field: keyof Receipt, value: any) => {
    setReceipt(prev => ({ ...prev, [field]: value }));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newLineItems = [...receipt.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    setReceipt(prev => ({ ...prev, lineItems: newLineItems }));
  };

  const addLineItem = () => {
    setReceipt(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { name: '', amount: 0, confidence: 1.0 }]
    }));
  };

  const removeLineItem = (index: number) => {
    setReceipt(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.saveReceipt(receipt);
      setSaveStatus('success');
      setTimeout(onSave, 1500);
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const subtotalFromItems = receipt.lineItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const calculatedTotal = subtotalFromItems + (Number(receipt.tax) || 0) + (Number(receipt.tip) || 0) - (Number(receipt.discount) || 0);
  const isMismatch = Math.abs(calculatedTotal - (Number(receipt.total) || 0)) > 0.01;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Upload</span>
        </button>
        <div className="flex items-center gap-4">
          {saveStatus === 'success' && (
            <span className="text-green-600 flex items-center gap-1 text-sm font-medium">
              <CheckCircle2 size={16} /> Saved Successfully
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all
              ${isSaving ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'}
            `}
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {receipt.id && receipt.status === 'saved' ? 'Update Receipt' : 'Save Receipt'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Summary Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Merchant Info</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Merchant Name</label>
                <UncertainHighlight confidence={receipt.confidence} label="Check name">
                  <input 
                    type="text"
                    value={receipt.merchant || ''}
                    onChange={(e) => updateField('merchant', e.target.value)}
                    className="w-full bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none py-1 text-lg font-semibold"
                  />
                </UncertainHighlight>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Transaction Date</label>
                <UncertainHighlight confidence={receipt.confidence} label="Check date">
                  <input 
                    type="date"
                    value={receipt.date || ''}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="w-full bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none py-1"
                  />
                </UncertainHighlight>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">Summary Totals</h3>
            
            <div className="space-y-4">
              <SummaryField 
                label="Subtotal" 
                value={receipt.subtotal} 
                onChange={(v) => updateField('subtotal', v)} 
                confidence={receipt.confidence}
              />
              <SummaryField 
                label="Tax" 
                value={receipt.tax} 
                onChange={(v) => updateField('tax', v)} 
                confidence={receipt.confidence}
              />
              <SummaryField 
                label="Tip" 
                value={receipt.tip} 
                onChange={(v) => updateField('tip', v)} 
                confidence={receipt.confidence}
              />
              <SummaryField 
                label="Discount" 
                value={receipt.discount} 
                onChange={(v) => updateField('discount', v)} 
                confidence={receipt.confidence}
                isNegative
              />
              
              <div className="pt-4 border-t border-gray-100 mt-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Grand Total</label>
                <UncertainHighlight confidence={receipt.confidence} label="Check total">
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.01"
                      value={receipt.total || 0}
                      onChange={(e) => updateField('total', parseFloat(e.target.value))}
                      className={`
                        w-full bg-transparent border-b outline-none py-1 text-2xl font-bold
                        ${isMismatch ? 'text-red-600 border-red-300' : 'text-blue-600 border-gray-200'}
                      `}
                    />
                    {isMismatch && (
                      <div className="absolute right-0 top-1 text-red-500" title="Arithmetic mismatch">
                        <AlertCircle size={20} />
                      </div>
                    )}
                  </div>
                </UncertainHighlight>
                
                {isMismatch && (
                  <div className="mt-2 text-[10px] text-red-500 flex items-center gap-1">
                    <Calculator size={10} /> Calculated: ${calculatedTotal.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Line Items */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Line Items</h3>
              <button 
                onClick={addLineItem}
                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
            
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-3 font-medium">Item Name</th>
                  <th className="px-6 py-3 font-medium w-32">Amount</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {receipt.lineItems.map((item, index) => (
                  <tr key={item.id || index} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <UncertainHighlight confidence={item.confidence || 1.0} label="Verify item">
                        <input 
                          type="text"
                          value={item.name}
                          onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                          className="w-full bg-transparent outline-none text-sm text-gray-700 focus:text-blue-600"
                          placeholder="Item description..."
                        />
                      </UncertainHighlight>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-sm">$</span>
                        <input 
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => updateLineItem(index, 'amount', parseFloat(e.target.value))}
                          className="w-full bg-transparent outline-none text-sm font-medium text-gray-700 text-right"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => removeLineItem(index)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {receipt.lineItems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic text-sm">
                      No items extracted. Use "Add Item" to add them manually.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SummaryFieldProps {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  confidence: number;
  isNegative?: boolean;
}

const SummaryField: React.FC<SummaryFieldProps> = ({ label, value, onChange, confidence, isNegative }) => (
  <div>
    <label className="block text-[10px] font-medium text-gray-400 mb-0.5">{label}</label>
    <UncertainHighlight confidence={confidence} threshold={0.85}>
      <div className="flex items-center gap-1">
        <span className="text-gray-400 text-sm">{isNegative ? '-' : '+'}$</span>
        <input 
          type="number"
          step="0.01"
          value={value || 0}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full bg-transparent border-b border-gray-100 focus:border-blue-300 outline-none py-0.5 text-sm"
        />
      </div>
    </UncertainHighlight>
  </div>
);

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

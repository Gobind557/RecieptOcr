import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Receipt } from '../types';
import { 
  FileText, Calendar, DollarSign, 
  ChevronRight, Search, Receipt as ReceiptIcon,
  Clock
} from 'lucide-react';

interface Props {
  onSelect: (receipt: Receipt) => void;
  onNew: () => void;
}

export const ListView: React.FC<Props> = ({ onSelect, onNew }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const data = await api.getReceipts();
      setReceipts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (id: string) => {
    try {
      const receipt = await api.getReceipt(id);
      onSelect(receipt);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Receipts</h2>
          <p className="text-gray-500 text-sm mt-1">Manage and edit your saved receipt extractions</p>
        </div>
        <button 
          onClick={onNew}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> New Receipt
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading receipts...</div>
        ) : receipts.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <ReceiptIcon size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-700">No receipts yet</h3>
            <p className="text-gray-500 text-sm mb-6">Upload your first receipt to get started</p>
            <button 
              onClick={onNew}
              className="text-blue-600 font-medium hover:underline"
            >
              Upload now &rarr;
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {receipts.map((receipt) => (
              <div 
                key={receipt.id}
                onClick={() => receipt.id && handleSelect(receipt.id)}
                className="group p-6 hover:bg-gray-50/50 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {receipt.merchant || 'Unknown Merchant'}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> {receipt.date || 'No date'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {receipt.createdAt ? new Date(receipt.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 flex items-center justify-end">
                      <DollarSign size={16} />{receipt.total?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                      {receipt.lineItems?.length || 0} items
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Plus = ({ className, size }: { className?: string, size?: number }) => (
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
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

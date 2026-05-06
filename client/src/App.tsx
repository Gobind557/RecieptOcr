import { useState } from 'react';
import { ReceiptText } from 'lucide-react';
import { UploadView } from './components/UploadView';
import { ReviewView } from './components/ReviewView';
import { ListView } from './components/ListView';
import type { Receipt } from './types';

type View = 'upload' | 'review' | 'list';

function App() {
  const [currentView, setCurrentView] = useState<View>('upload');
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);

  const handleParseSuccess = (receipt: Receipt) => {
    setActiveReceipt(receipt);
    setCurrentView('review');
  };

  const handleSaveSuccess = () => {
    setCurrentView('list');
  };

  const handleSelectReceipt = (receipt: Receipt) => {
    setActiveReceipt(receipt);
    setCurrentView('review');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div
            className="flex cursor-pointer items-center gap-2"
            onClick={() => setCurrentView('upload')}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm">
              <ReceiptText size={16} />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">ReceiptOCR</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentView('upload')}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                currentView === 'upload'
                  ? 'bg-slate-100 text-slate-950'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Upload Receipt
            </button>
            <button
              onClick={() => setCurrentView('list')}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                currentView === 'list'
                  ? 'bg-slate-100 text-slate-950'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              My Receipts
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {currentView === 'upload' && <UploadView onSuccess={handleParseSuccess} />}

        {currentView === 'review' && activeReceipt && (
          <ReviewView
            receipt={activeReceipt}
            onBack={() => setCurrentView('upload')}
            onSave={handleSaveSuccess}
          />
        )}

        {currentView === 'list' && (
          <ListView onSelect={handleSelectReceipt} onNew={() => setCurrentView('upload')} />
        )}
      </main>
    </div>
  );
}

export default App;

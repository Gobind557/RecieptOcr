import { useState } from 'react';
import { UploadView } from './components/UploadView';
import { ReviewView } from './components/ReviewView';
import { ListView } from './components/ListView';
import type { Receipt } from './types';
import { Receipt as ReceiptIcon, List, Upload } from 'lucide-react';

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
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setCurrentView('upload')}
          >
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
              <ReceiptIcon size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-800">RecieptOcr</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setCurrentView('upload')}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${currentView === 'upload' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Upload size={18} /> Upload
            </button>
            <button 
              onClick={() => setCurrentView('list')}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${currentView === 'list' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <List size={18} /> My Receipts
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {currentView === 'upload' && (
          <UploadView onSuccess={handleParseSuccess} />
        )}
        
        {currentView === 'review' && activeReceipt && (
          <ReviewView 
            receipt={activeReceipt} 
            onBack={() => setCurrentView('upload')} 
            onSave={handleSaveSuccess}
          />
        )}

        {currentView === 'list' && (
          <ListView 
            onSelect={handleSelectReceipt} 
            onNew={() => setCurrentView('upload')}
          />
        )}
      </main>

      {/* Footer / Info */}
      <footer className="mt-auto py-12 text-center text-gray-400 text-xs">
        <p>© 2026 RecieptOcr — Built with GPT-4o-mini & SQLite</p>
        <p className="mt-1">“AI assists first, human verifies second.”</p>
      </footer>
    </div>
  );
}

export default App;

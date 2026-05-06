import React, { useState, useCallback } from 'react';
import { Upload, FileType, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { Receipt } from '../types';

interface Props {
  onSuccess: (receipt: Receipt) => void;
}

export const UploadView: React.FC<Props> = ({ onSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG/PNG)');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await api.parseReceipt(file);
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-all
          ${isUploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'}
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-500" size={48} />
            <h3 className="text-xl font-medium text-gray-800">Analyzing Receipt...</h3>
            <p className="text-gray-500">GPT-4o-mini is extracting structured data.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-medium text-gray-800">Upload Receipt</h3>
            <p className="text-gray-500">Drag and drop your receipt image here, or click to browse</p>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              className="hidden"
              id="file-upload"
            />
            <label 
              htmlFor="file-upload"
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
            >
              Select File
            </label>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
              <div className="flex items-center gap-1"><FileType size={14} /> JPG</div>
              <div className="flex items-center gap-1"><FileType size={14} /> PNG</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-700">
          <AlertTriangle className="shrink-0" size={20} />
          <div>
            <p className="font-medium">Parsing Failed</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      <div className="mt-8 bg-gray-50 border border-gray-100 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Product Philosophy</h4>
        <p className="text-sm text-gray-600 leading-relaxed italic">
          “AI assists first, human verifies second.” 
          Upload a receipt to see how the system identifies likely extraction errors and helps you correct them quickly.
        </p>
      </div>
    </div>
  );
};

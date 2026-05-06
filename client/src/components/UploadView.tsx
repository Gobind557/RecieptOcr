import React, { useCallback, useState } from 'react';
import { AlertTriangle, ImagePlus, Loader2, Upload } from 'lucide-react';
import { api } from '../api';
import type { Receipt } from '../types';

interface Props {
  onSuccess: (receipt: Receipt) => void;
}

export const UploadView: React.FC<Props> = ({ onSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a JPG or PNG receipt image.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await api.parseReceipt(file);
      onSuccess(result);
    } catch {
      setError("We couldn't confidently parse this receipt. Try uploading a clearer image.");
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
    <section className="mx-auto max-w-xl pt-10">
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Upload Receipt</h1>
        <p className="mt-2 text-sm text-slate-500">
          Extract the first pass, then review highlighted fields before saving.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={`rounded-md border border-dashed p-8 text-center transition-colors ${
            isUploading
              ? 'border-slate-300 bg-slate-50'
              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-slate-500" size={28} />
              <div>
                <h2 className="text-sm font-medium text-slate-900">Extracting receipt details...</h2>
                <p className="mt-1 text-sm text-slate-500">
                  We will mark fields that may need review.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <ImagePlus size={24} />
              </div>
              <div>
                <h2 className="text-base font-medium text-slate-950">Drop image here or browse</h2>
                <p className="mt-1 text-sm text-slate-500">Supports JPG and PNG</p>
              </div>
              <input
                id="file-upload"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
              >
                <Upload size={16} />
                Select File
              </label>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="text-sm font-medium">Receipt needs a clearer image</p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </section>
  );
};

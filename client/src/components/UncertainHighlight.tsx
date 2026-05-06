import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  confidence?: number;
  threshold?: number;
  children: React.ReactNode;
  label?: string;
}

export const confidenceTone = (confidence?: number, threshold = 0.8) => {
  if (confidence === undefined || confidence === null) return 'medium';
  if (confidence < threshold) return 'low';
  if (confidence < 0.92) return 'medium';
  return 'high';
};

export const UncertainHighlight: React.FC<Props> = ({
  confidence,
  threshold = 0.8,
  children,
  label = 'Needs review',
}) => {
  const tone = confidenceTone(confidence, threshold);
  const needsReview = tone === 'low';

  return (
    <div className="relative">
      <div
        className={`rounded-md transition-colors ${
          needsReview ? 'bg-amber-50 ring-1 ring-amber-200' : ''
        }`}
      >
        {children}
      </div>
      {needsReview && (
        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          <AlertTriangle size={12} />
          {label}
        </div>
      )}
    </div>
  );
};

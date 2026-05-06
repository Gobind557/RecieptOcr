import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  confidence: number;
  threshold?: number;
  children: React.ReactNode;
  label?: string;
}

export const UncertainHighlight: React.FC<Props> = ({ 
  confidence, 
  threshold = 0.8, 
  children,
  label 
}) => {
  const isUncertain = confidence < threshold;

  return (
    <div className="relative group">
      <div className={`
        transition-all duration-200 rounded-md
        ${isUncertain ? 'ring-2 ring-yellow-400/50 bg-yellow-50/50 p-1 -m-1' : ''}
      `}>
        {children}
      </div>
      {isUncertain && (
        <div className="absolute -top-2 -right-2 hidden group-hover:block z-10">
          <div className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded shadow-sm border border-yellow-200 flex items-center gap-1">
            <AlertCircle size={10} />
            {label || 'Needs review'}
          </div>
        </div>
      )}
    </div>
  );
};

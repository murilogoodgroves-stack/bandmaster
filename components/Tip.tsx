import React from 'react';
import { InfoIcon } from './icons';

interface TipProps {
  onDismiss: () => void;
  children: React.ReactNode;
}

export const Tip: React.FC<TipProps> = ({ onDismiss, children }) => {
  return (
    <div className="bg-blue-900/50 border border-blue-700 text-blue-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
      <div className="flex items-start">
        <InfoIcon className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
        <div className="flex-1 text-sm">
          <strong className="font-bold">Pro Tip: </strong>
          {children}
        </div>
        <button
          onClick={onDismiss}
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
          aria-label="Dismiss"
        >
          <span className="text-2xl font-light">&times;</span>
        </button>
      </div>
    </div>
  );
};
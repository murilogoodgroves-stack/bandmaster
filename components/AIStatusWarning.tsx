import React, { useState, useEffect } from 'react';
import { subscribeToAIStatus, AIStatus } from '../services/aiService';
import { AlertTriangleIcon, InfoIcon, CheckCircleIcon } from './icons';

export const AIStatusWarning: React.FC = () => {
    const [status, setStatus] = useState<AIStatus | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToAIStatus((newStatus) => {
            setStatus(newStatus);
            // Only show if it's a fallback or error
            if (newStatus.status === 'fallback' || newStatus.status === 'error') {
                setIsVisible(true);
                // Auto-hide after 10 seconds if it's just a fallback
                if (newStatus.status === 'fallback') {
                    const timer = setTimeout(() => setIsVisible(false), 10000);
                    return () => clearTimeout(timer);
                }
            } else {
                setIsVisible(false);
            }
        });
        return unsubscribe;
    }, []);

    if (!isVisible || !status) return null;

    const isError = status.status === 'error';

    return (
        <div className={`fixed top-4 right-4 z-[100] max-w-md animate-in fade-in slide-in-from-top-4 duration-300`}>
            <div className={`p-4 rounded-lg border shadow-lg flex items-start gap-3 ${
                isError 
                ? 'bg-red-500/10 border-red-500/50 text-red-200' 
                : 'bg-amber-500/10 border-amber-500/50 text-amber-200'
            }`}>
                <div className="mt-0.5">
                    {isError ? (
                        <AlertTriangleIcon className="h-5 w-5 text-red-400" />
                    ) : (
                        <InfoIcon className="h-5 w-5 text-amber-400" />
                    )}
                </div>
                <div className="flex-grow">
                    <h4 className="font-bold text-sm uppercase tracking-wider mb-1">
                        {isError ? 'AI Service Failure' : 'AI Provider Fallback'}
                    </h4>
                    <p className="text-sm opacity-90 leading-relaxed">
                        {status.message || (isError ? 'All AI providers are currently unavailable.' : `Primary provider failed. Currently using ${status.provider}.`)}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] opacity-50 font-mono">
                            {status.lastUsed ? new Date(status.lastUsed).toLocaleTimeString() : ''}
                        </span>
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="text-[10px] uppercase font-bold hover:underline tracking-widest"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { subscribeToAIStatus, AIStatus } from '../services/aiService';
import { AlertTriangleIcon, InfoIcon, CheckCircleIcon, SlashIcon } from './icons';

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
        <div className={`fixed bottom-4 right-20 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className={`px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-2 backdrop-blur-md ${
                isError 
                ? 'bg-red-500/20 border-red-500/50 text-red-200' 
                : 'bg-amber-500/20 border-amber-500/50 text-amber-200'
            }`}>
                {isError ? (
                    <AlertTriangleIcon className="h-3.5 w-3.5 text-red-400" />
                ) : (
                    <InfoIcon className="h-3.5 w-3.5 text-amber-400" />
                )}
                <span className="text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">
                    {isError ? 'AI Offline' : `AI: ${status.provider}`}
                </span>
                <button 
                    onClick={() => setIsVisible(false)}
                    className="ml-1 p-0.5 hover:bg-white/10 rounded-full transition-colors"
                    title="Dismiss"
                >
                    <SlashIcon className="h-3 w-3 rotate-45" />
                </button>
            </div>
        </div>
    );
};

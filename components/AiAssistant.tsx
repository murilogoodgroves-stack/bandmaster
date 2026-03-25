
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { WizardChatMessage, Task, CalendarEvent, Transaction, MerchItem, Release, Tour, BandProfile } from '../types';
import { getWizardInsight } from '../services/aiService';
import { BotIcon, SendIcon, ExternalLinkIcon } from './icons';
import { Tip } from './Tip';

interface AiAssistantProps {
    onClose: () => void;
    activeBandId: string;
    bands: BandProfile[];
    tasks: Task[];
    events: CalendarEvent[];
    transactions: Transaction[];
    merch: MerchItem[];
    releases: Release[];
    tours: Tour[];
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ 
    onClose, activeBandId, bands, tasks: allTasks, events: allEvents, 
    transactions: allTransactions, merch: allMerch, releases: allReleases, tours: allTours 
}) => {
    const [messages, setMessages] = useState<WizardChatMessage[]>([
        { id: '1', sender: 'wizard', text: "Hello! I'm your band's Wizard. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const [showTip, setShowTip] = useState(true);

    const activeBand = useMemo(() => bands.find(b => b.id === activeBandId) || bands[0], [bands, activeBandId]);
    
    const appContext = useMemo(() => {
        const tasks = allTasks.filter(t => t.bandId === activeBandId);
        const events = allEvents.filter(e => e.bandId === activeBandId);
        const transactions = allTransactions.filter(t => t.bandId === activeBandId);
        const merch = allMerch.filter(m => m.bandId === activeBandId);
        const releases = allReleases.filter(r => r.bandId === activeBandId);
        const tours = allTours.filter(t => t.bandId === activeBandId);
        return { tasks, events, transactions, merch, releases, tours };
    }, [activeBandId, allTasks, allEvents, allTransactions, allMerch, allReleases, allTours]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (query?: string) => {
        const userQuery = query || input;
        if (!userQuery.trim()) return;

        const newUserMessage: WizardChatMessage = { id: Date.now().toString(), sender: 'user', text: userQuery };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        const { answer, sources } = await getWizardInsight(userQuery, appContext, activeBand);
        
        const newAiMessage: WizardChatMessage = { 
            id: (Date.now() + 1).toString(), 
            sender: 'wizard', 
            text: answer,
            sources: sources && sources.length > 0 ? sources : undefined,
        };
        setMessages(prev => [...prev, newAiMessage]);
        setIsLoading(false);
    };

    const suggestionPrompts = [
        "What are my most critical tasks?",
        "What are current music marketing trends?",
        "Any low stock on merchandise?",
        "When is our next gig?",
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg h-[70vh] flex flex-col">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center">
                        <BotIcon className="w-6 h-6 text-purple-400 mr-3"/>
                        <h2 className="text-lg font-bold">Wizard</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </header>
                
                <main className="flex-grow p-4 overflow-y-auto space-y-4">
                    {showTip && (
                        <Tip onDismiss={() => setShowTip(false)}>
                            I can answer questions about your band's data (like tasks or finances) AND search the web for up-to-date info on things like marketing or copyright!
                        </Tip>
                    )}
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                             {msg.sender === 'wizard' && <BotIcon className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1"/>}
                             <div className={`p-3 rounded-lg max-w-sm ${msg.sender === 'wizard' ? 'bg-gray-700 text-gray-200' : 'bg-purple-600 text-white'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-600">
                                        <h4 className="text-xs font-semibold text-gray-400 mb-2">Sources:</h4>
                                        <ul className="space-y-1.5">
                                            {msg.sources.map((source, index) => (
                                                <li key={index} className="flex items-center">
                                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs truncate" title={source.uri}>
                                                        {source.title || source.uri}
                                                    </a>
                                                    <ExternalLinkIcon className="w-3 h-3 text-gray-500 ml-1.5 flex-shrink-0" />
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                             </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-2.5">
                            <BotIcon className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1"/>
                            <div className="p-3 rounded-lg bg-gray-700 text-gray-200">
                                <span className="animate-pulse">...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>
                
                <footer className="p-4 border-t border-gray-700 flex-shrink-0">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        {suggestionPrompts.map(prompt => (
                             <button key={prompt} onClick={() => handleSend(prompt)} className="text-xs text-left p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300">
                                {prompt}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            className="flex-1 bg-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button type="submit" disabled={isLoading} className="bg-purple-600 p-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-600">
                            <SendIcon className="w-5 h-5"/>
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

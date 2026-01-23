import React, { useState } from 'react';
import { searchWeb } from '../services/geminiService';
import type { SearchResult } from '../types';
import { SearchIcon } from './icons';

const ResourceCard: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-purple-400 mb-4">{title}</h2>
        <div className="space-y-3 text-gray-300">
            {children}
        </div>
    </div>
);

// New Web Searcher Component
const WebSearcher: React.FC = () => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<SearchResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setResult(null);
        
        const taskId = `task-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Searching the web...', estimatedDuration: 20 } }));
        
        try {
            const searchResult = await searchWeb(query);
            setResult(searchResult);
        } finally {
            setIsLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Search the Web</h2>
            <p className="text-gray-400 mb-4">Have a question? Ask about anything from marketing strategies to the history of a music genre.</p>
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., How to get on Spotify playlists?"
                    className="flex-1 bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    <SearchIcon className="h-5 w-5 mr-2"/>
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {isLoading && <div className="text-center text-gray-400 p-4">Searching the web... Check the progress bar at the top of the page.</div>}

            {result && (
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-gray-100">Answer:</h3>
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{result.answer}</p>
                    
                    {result.sources.length > 0 && (
                        <div className="mt-6">
                            <h4 className="font-semibold text-gray-200 mb-2">Sources:</h4>
                            <ul className="list-disc list-inside space-y-2">
                                {result.sources.map((source, index) => (
                                    <li key={index}>
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                            {source.title || source.uri}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


export const Resources: React.FC = () => {
  return (
    <div>
        <h1 className="text-4xl font-bold mb-8">Knowledge Hub</h1>
        
        <WebSearcher />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <ResourceCard title="Releasing Music Checklist">
                <p>A successful release requires careful planning. Here's a simplified timeline:</p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <li><span className="font-bold">12+ Weeks Out:</span> Finish writing, recording, mixing, and mastering.</li>
                    <li><span className="font-bold">8 Weeks Out:</span> Finalize artwork and plan music videos/content.</li>
                    <li><span className="font-bold">6 Weeks Out:</span> Submit your music to a digital distributor (e.g., DistroKid, TuneCore).</li>
                    <li><span className="font-bold">4-5 Weeks Out:</span> Pitch your song to editorial playlists on Spotify for Artists.</li>
                    <li><span className="font-bold">2-4 Weeks Out:</span> Announce the release and launch a pre-save campaign.</li>
                    <li><span className="font-bold">Release Week:</span> Promote heavily on social media, email lists, and engage with fans.</li>
                </ul>
            </ResourceCard>

            <ResourceCard title="Tour Planning Basics">
                <p>Booking a tour can be complex. Start with these steps:</p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <li><span className="font-bold">Budget Everything:</span> Estimate costs for gas, food, lodging, and venue fees. Don't forget a buffer for emergencies.</li>
                    <li><span className="font-bold">Route Smartly:</span> Plan your route to minimize driving time between cities. Avoid backtracking.</li>
                    <li><span className="font-bold">Contact Venues:</span> Send a concise email with your band's info, links to music, and potential dates. Follow up politely.</li>
                    <li><span className="font-bold">Promote Locally:</span> Work with the venue and local bands to promote the show. Use social media to target fans in that city.</li>
                    <li><span className="font-bold">Prepare a Tech Rider:</span> Even a simple one-page document listing your inputs and stage plot is professional.</li>
                </ul>
            </ResourceCard>
            
            <ResourceCard title="Understanding Royalties">
                <p>It's crucial to know where your money comes from. The two main types of royalties for songwriters are:</p>
                <div className="mt-2">
                    <h3 className="font-bold text-lg text-gray-100">1. Performance Royalties</h3>
                    <p className="pl-4">Generated when your music is performed publicly - on the radio, on TV, in venues, or streamed online. Collected by Performing Rights Organizations (PROs) like ASCAP, BMI, and SESAC.</p>
                </div>
                 <div className="mt-2">
                    <h3 className="font-bold text-lg text-gray-100">2. Mechanical Royalties</h3>
                    <p className="pl-4">Generated from the reproduction of your song, such as on vinyl, CDs, or digital streams/downloads. In the US, these are often collected by agencies like The MLC or Harry Fox Agency.</p>
                </div>
            </ResourceCard>
            
            <ResourceCard title="Marketing Your Band">
                 <p>Getting heard is key. Focus your marketing efforts:</p>
                 <ul className="list-disc list-inside space-y-2 pl-2">
                     <li><span className="font-bold">Build a Mailing List:</span> It's the most direct way to contact your fans. Offer a free download in exchange for an email address.</li>
                     <li><span className="font-bold">Consistent Social Media:</span> You don't need to be on every platform. Pick 1-2 where your fans are and post consistently. Show behind-the-scenes content.</li>
                     <li><span className="font-bold">High-Quality Press Kit:</span> Have a simple Electronic Press Kit (EPK) ready with a bio, high-res photos, links to music, and contact info.</li>
                     <li><span className="font-bold">Collaborate:</span> Work with other bands in your scene. Play shows together, cross-promote on social media.</li>
                 </ul>
            </ResourceCard>
        </div>
    </div>
  );
};
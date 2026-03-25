
import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { analyzeArtistSoundProfile, findOpportunitiesFromProfile } from '../services/aiService';
import type { SoundProfileAnalysis, SoundMatchOpportunity, PressContact, RadioContact } from '../types';
import { initialPressContacts, initialRadioContacts } from '../data/initialData';
import { BotIcon, SearchIcon, SaveIcon, ExternalLinkIcon, RadioIcon, PressIcon, WandIcon } from './icons';
import { Tip } from './Tip';
import { ContactTier } from '../types';


type SoundMatchStep = 'input' | 'analyze' | 'confirm' | 'search' | 'results';

interface SoundMatchProps {
    pressContacts: PressContact[];
    setPressContacts: React.Dispatch<React.SetStateAction<PressContact[]>>;
    radioContacts: RadioContact[];
    setRadioContacts: React.Dispatch<React.SetStateAction<RadioContact[]>>;
    activeBandId: string;
}

export const SoundMatch: React.FC<SoundMatchProps> = ({ pressContacts: allPressContacts, setPressContacts: setAllPressContacts, radioContacts: allRadioContacts, setRadioContacts: setAllRadioContacts, activeBandId }) => {
    const [step, setStep] = useState<SoundMatchStep>('input');
    const [artistUrl, setArtistUrl] = useState('');
    
    // Persist analysis and opportunities per band so they don't disappear on navigation
    const [analysis, setAnalysis] = useLocalStorage<SoundProfileAnalysis | null>(`soundMatchAnalysis_${activeBandId}`, null);
    const [opportunities, setOpportunities] = useLocalStorage<{ press: SoundMatchOpportunity[], radio: SoundMatchOpportunity[] }>(`soundMatchOpps_${activeBandId}`, { press: [], radio: [] });
    
    const [error, setError] = useState('');
    const [notification, setNotification] = useState('');
    
    const pressContacts = useMemo(() => allPressContacts.filter(c => c.bandId === activeBandId), [allPressContacts, activeBandId]);
    const radioContacts = useMemo(() => allRadioContacts.filter(c => c.bandId === activeBandId), [allRadioContacts, activeBandId]);

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const handleAnalyze = async () => {
        if (!artistUrl.trim()) return;
        
        const spotifyRegex = /(?:https?:\/\/open\.spotify\.com\/artist\/|spotify:artist:)([a-zA-Z0-9]{22})/;
        const match = artistUrl.match(spotifyRegex);

        if (!match || !match[1]) {
            setError("Please enter a valid Spotify Artist URL or URI (e.g., open.spotify.com/artist/... or spotify:artist:...).");
            return;
        }

        const artistId = match[1];

        setStep('analyze');
        setError('');
        const taskId = `task-sound-analysis-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Analyzing your sound profile...', estimatedDuration: 25 } }));
        try {
            const result = await analyzeArtistSoundProfile(artistId);
            setAnalysis(result);
            setStep('confirm');
        } catch (e: any) {
            setError(e.message);
            setStep('input');
        } finally {
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };
    
    const handleFindOpportunities = async () => {
        if (!analysis) return;
        setStep('search');
        setError('');
        const taskId = `task-sound-match-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Finding matched opportunities...', estimatedDuration: 90 } }));
        try {
            const results = await findOpportunitiesFromProfile(analysis, pressContacts, radioContacts);
            setOpportunities(results);
            setStep('results');
        } catch (e: any) {
            setError(e.message);
            setStep('confirm');
        } finally {
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };
    
    const handleSaveContact = (opp: SoundMatchOpportunity) => {
        if (opp.type === 'press') {
            if (allPressContacts.some(c => c.email === opp.email && c.bandId === activeBandId)) {
                showNotification('Contact already exists in your Press list.');
                return;
            }
            const newContact: PressContact = {
                id: `sm-press-${Date.now()}`,
                name: opp.name,
                outlet: opp.outlet,
                email: opp.email,
                tier: ContactTier.C,
                country: opp.country,
                sourceUrl: opp.url,
                notes: `Found via Sound Match. Similar to: ${opp.sourceArtist}`,
                bandId: activeBandId,
            };
            setAllPressContacts(prev => [...prev, newContact]);
        } else {
             if (allRadioContacts.some(c => c.email === opp.email && c.bandId === activeBandId)) {
                showNotification('Contact already exists in your Radio list.');
                return;
            }
            const newContact: RadioContact = {
                id: `sm-radio-${Date.now()}`,
                name: opp.name,
                stationName: opp.outlet,
                email: opp.email,
                country: opp.country,
                submissionUrl: opp.url,
                notes: `Found via Sound Match. Similar to: ${opp.sourceArtist}`,
                bandId: activeBandId,
            };
            setAllRadioContacts(prev => [...prev, newContact]);
        }
        showNotification(`${opp.name} saved!`);
    };
    
    const allSavedEmails = useMemo(() => new Set([...pressContacts.map(c => c.email), ...radioContacts.map(c => c.email)]), [pressContacts, radioContacts]);

    // Auto-advance step if data exists
    React.useEffect(() => {
        if (step === 'input' && analysis) {
            if (opportunities.press.length > 0 || opportunities.radio.length > 0) {
                setStep('results');
            } else {
                setStep('confirm');
            }
        }
    }, [analysis, opportunities]);

    return (
        <div>
            <h1 className="text-4xl font-bold mb-2">Sound Match Opportunity Finder</h1>
            <p className="text-gray-400 mb-6">Let AI analyze your sound and find contacts who have featured genuinely similar artists.</p>
            
            <div className="max-w-4xl mx-auto">
                {step === 'input' && (
                    <div className="bg-brand-bg-card p-8 rounded-xl text-center">
                        <WandIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Enter Your Spotify Artist URL</h2>
                        <p className="text-gray-400 mb-4">The AI will analyze public information to understand your unique sound.</p>
                        <div className="flex gap-2 max-w-lg mx-auto">
                            <input type="text" value={artistUrl} onChange={e => setArtistUrl(e.target.value)} placeholder="https://open.spotify.com/artist/... or spotify:artist:..." className="flex-grow bg-brand-bg-content p-3 rounded-lg ring-brand-accent"/>
                            <button onClick={handleAnalyze} disabled={!artistUrl} className="bg-brand-accent hover:bg-brand-accent-dark text-white font-bold px-6 py-3 rounded-lg disabled:bg-gray-600">Analyze My Sound</button>
                        </div>
                        {error && <p className="text-red-400 mt-4">{error}</p>}
                    </div>
                )}

                {(step === 'analyze' || step === 'search') && (
                    <div className="bg-brand-bg-card p-8 rounded-xl text-center">
                        <div className="animate-pulse flex flex-col items-center">
                            <BotIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-2">{step === 'analyze' ? 'Analyzing Sound Profile...' : 'Searching for Opportunities...'}</h2>
                            <p className="text-gray-400 mb-4">This may take a minute. Check the progress bar at the top of the screen.</p>
                        </div>
                    </div>
                )}
                
                {step === 'confirm' && analysis && (
                    <div className="bg-brand-bg-card p-8 rounded-xl text-center">
                        <h2 className="text-2xl font-bold mb-4">Analysis for "{analysis.artistName}"</h2>
                        <div className="bg-brand-bg-content p-6 rounded-lg text-left max-w-3xl mx-auto space-y-4">
                            <div>
                                <strong className="text-gray-400 block mb-2">AI Analysis of Similar Artists:</strong>
                                <p className="italic text-gray-300">"{analysis.reasoning || analysis.summary}"</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-brand-border">
                                <div>
                                    <strong className="text-gray-400 block mb-2">Your Sound Profile:</strong>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.genres.map(g => <span key={g} className="text-xs font-medium bg-gray-600 text-gray-200 rounded-full px-2 py-1 inline-block">{g}</span>)}
                                        {analysis.moods.map(m => <span key={m} className="text-xs font-medium bg-gray-600 text-gray-200 rounded-full px-2 py-1 inline-block">{m}</span>)}
                                    </div>
                                </div>
                                <div>
                                    <strong className="text-gray-400 block mb-2">Similar Artists Found:</strong>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.similarArtists.map(a => <span key={a} className="text-xs font-medium bg-purple-600/50 text-purple-200 rounded-full px-2 py-1 inline-block">{a}</span>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 justify-center mt-6">
                            <button onClick={() => { setStep('input'); setAnalysis(null); }} className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-6 py-3 rounded-lg">Start Over</button>
                            <button onClick={handleFindOpportunities} className="bg-brand-accent hover:bg-brand-accent-dark text-white font-bold px-6 py-3 rounded-lg">Yes, Find Opportunities</button>
                        </div>
                    </div>
                )}
                
                {step === 'results' && <OpportunityResults results={opportunities} onSave={handleSaveContact} savedEmails={allSavedEmails} onBack={() => setStep('confirm')} />}
            </div>

            {notification && (
                <div className="fixed bottom-10 right-10 bg-spotify-green text-white py-2 px-5 rounded-lg shadow-lg">
                    {notification}
                </div>
            )}
        </div>
    );
};


const OpportunityResults: React.FC<{
    results: { press: SoundMatchOpportunity[], radio: SoundMatchOpportunity[] },
    onSave: (opp: SoundMatchOpportunity) => void,
    savedEmails: Set<string>,
    onBack: () => void
}> = ({ results, onSave, savedEmails, onBack }) => {
    const [activeTab, setActiveTab] = useState<'press' | 'radio'>('press');
    const hasResults = results.press.length > 0 || results.radio.length > 0;

    if (!hasResults) {
        return (
            <div className="bg-brand-bg-card p-8 rounded-xl text-center">
                 <h2 className="text-2xl font-bold mb-2">No Opportunities Found</h2>
                 <p className="text-gray-400 mb-6">The AI couldn't find any new contacts based on your sound profile. This can sometimes happen for very unique sounds. Try starting over with a slightly different Spotify URL if you have one.</p>
                 <button onClick={onBack} className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-6 py-3 rounded-lg">Go Back</button>
            </div>
        );
    }
    
    const currentResults = activeTab === 'press' ? results.press : results.radio;

    return (
        <div className="bg-brand-bg-card p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
                <div className="flex border-b border-brand-border">
                    <button onClick={() => setActiveTab('press')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === 'press' ? 'border-b-2 border-brand-accent text-white' : 'text-gray-400'}`}>
                        <PressIcon className="w-5 h-5"/> Press & Blogs ({results.press.length})
                    </button>
                    <button onClick={() => setActiveTab('radio')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === 'radio' ? 'border-b-2 border-brand-accent text-white' : 'text-gray-400'}`}>
                        <RadioIcon className="w-5 h-5"/> Radio ({results.radio.length})
                    </button>
                </div>
                <button onClick={onBack} className="text-sm text-gray-400 hover:text-white">Back to Analysis</button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {currentResults.map((opp, i) => {
                    const isSaved = opp.email && savedEmails.has(opp.email);
                    return (
                        <div key={i} className="bg-brand-bg-content p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-white">{opp.name}</p>
                                    <p className="text-sm text-gray-400">{opp.outlet}</p>
                                    <p className="text-sm text-purple-300">{opp.email}</p>
                                </div>
                                <button onClick={() => onSave(opp)} disabled={isSaved} className="flex items-center text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed">
                                    <SaveIcon className="w-4 h-4 mr-1.5"/>{isSaved ? 'Saved' : 'Save'}
                                </button>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-700/50">
                                <p className="text-xs text-gray-500">Found because they featured a similar artist: <strong className="text-gray-400">{opp.sourceArtist}</strong></p>
                                <a href={opp.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center mt-1">Source Article/Link <ExternalLinkIcon className="w-3 h-3 ml-1"/></a>
                            </div>
                        </div>
                    );
                })}
                 {currentResults.length === 0 && <p className="text-center text-gray-500 py-8">No {activeTab} opportunities found.</p>}
            </div>
        </div>
    );
};
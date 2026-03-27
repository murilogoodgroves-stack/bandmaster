



import React, { useState, useRef, useMemo, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { RadioContact, RadioOpportunity, BandProfile, LastSearchParams, PressContact } from '../types';
import { ContactTier } from '../types';
import { PlusIcon, TrashIcon, CopyIcon, SearchIcon, ExternalLinkIcon, BotIcon, SaveIcon, RadioIcon, EditIcon } from './icons';
import { generateEmail, EmailTone, EmailLength, findRadioContacts } from '../services/aiService';
import { initialRadioContacts, initialBandProfiles } from '../data/initialData';
import { Tip } from './Tip';

// Reusable AI Email Modal for pitching
const AiEmailModal: React.FC<{ contact: PressContact, onClose: () => void, bandProfile: BandProfile }> = ({ contact, onClose, bandProfile }) => {
    const [prompt, setPrompt] = useState(`Write a professional but friendly email to ${contact.name} at ${contact.outlet}, introducing my band and our music. Ask if they are accepting music submissions for radio play.`);
    const [tone, setTone] = useState<EmailTone>('Professional');
    const [length, setLength] = useState<EmailLength>('Standard');
    const [generatedEmail, setGeneratedEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setGeneratedEmail('');
        const result = await generateEmail(prompt, contact.name, tone, length, bandProfile, false);
        setGeneratedEmail(result);
        setIsLoading(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedEmail);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }
    
    React.useEffect(() => { handleGenerate() }, []);
    React.useEffect(() => { handleGenerate() }, [tone, length]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-white">AI Pitch to <span className="text-purple-400">{contact.outlet}</span></h2>
                 <div className="grid grid-cols-2 gap-4 my-4">
                    <select value={tone} onChange={e => setTone(e.target.value as EmailTone)} className="w-full bg-gray-700 p-2 rounded-lg text-sm"><option>Professional</option><option>Casual</option><option>Enthusiastic</option></select>
                    <select value={length} onChange={e => setLength(e.target.value as EmailLength)} className="w-full bg-gray-700 p-2 rounded-lg text-sm"><option>Brief</option><option>Standard</option><option>Detailed</option></select>
                </div>
                <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600">
                    {isLoading ? 'Regenerating...' : 'Regenerate'}
                </button>
                <div className="mt-4 flex-grow overflow-y-auto bg-gray-900 rounded-lg p-4">
                    {isLoading && <div className="text-center p-8 text-gray-400">AI is writing...</div>}
                    {generatedEmail && <textarea readOnly value={generatedEmail} className="w-full h-full bg-transparent text-gray-300 border-none focus:ring-0 resize-y"></textarea>}
                </div>
                <div className="flex justify-end gap-4 mt-4 flex-shrink-0">
                    {generatedEmail && <button onClick={handleCopy} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"><CopyIcon className="w-4 h-4 mr-2"/> {isCopied ? 'Copied!' : 'Copy Text'}</button>}
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Close</button>
                </div>
            </div>
        </div>
    );
};

// Component for finding new radio contacts
const RadioFinder: React.FC<{ onAddContact: (contact: RadioOpportunity, query: string) => void, savedContacts: RadioContact[], saveSearchResults?: (searchTerm: string, source: string, results: any[]) => void, getSearchResults?: (source: string, searchTerm?: string) => any }> = ({ onAddContact, savedContacts, saveSearchResults, getSearchResults }) => {
    const [genre, setGenre] = useState('');
    const [country, setCountry] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
    const [results, setResults] = useState<RadioOpportunity[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const existingEmails = new Set(savedContacts.map(l => l.email));

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!genre.trim()) return;
        setIsLoading(true);
        setHasSearched(true);
        setResults([]);
        
        const taskId = `task-radio-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Researching radio stations...', estimatedDuration: 45 } }));
        
        try {
            const contacts = await findRadioContacts(genre, country, savedContacts);
            setResults(contacts);
            if (saveSearchResults) {
              saveSearchResults(genre, 'radio', contacts);
            }
        } finally {
            setIsLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };
    
    const handleLoadMore = async () => {
        if (!genre.trim()) return;
        setIsLoadMoreLoading(true);
        
        const taskId = `task-radio-more-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Finding more radio stations...', estimatedDuration: 30 } }));
        
        try {
            const newContacts = await findRadioContacts(genre, country, [...savedContacts, ...results.map(r => ({...r, id: '', bandId: '', stationName: r.stationName, name: r.contactName, email: r.email}))]);
            setResults(prev => [...prev, ...newContacts]);
        } finally {
            setIsLoadMoreLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-lg">
            <h3 className="text-xl font-bold mb-2">Find Radio Stations</h3>
            <p className="text-sm text-gray-400 mb-4">Discover radio stations, shows, and DJs that play your style of music.</p>
            <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2"><label className="text-sm text-gray-400">Genre(s)</label><input type="text" value={genre} onChange={e => setGenre(e.target.value)} placeholder="e.g., indie rock, college radio" className="w-full bg-gray-700 p-2 rounded-lg mt-1" required /></div>
                    <div><label className="text-sm text-gray-400">Country (opt.)</label><input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g., USA, Germany" className="w-full bg-gray-700 p-2 rounded-lg mt-1"/></div>
                </div>
                 <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-600">
                    <SearchIcon className="h-5 w-5 mr-2" />{isLoading ? 'Researching...' : 'Find Radio Contacts'}
                </button>
            </form>

            {isLoading && <div className="text-center py-4 text-gray-400">Researching... Check the progress bar at the top of the page.</div>}
            {!isLoading && hasSearched && results.length === 0 && <p className="text-center py-4 text-gray-500">No contacts found matching your criteria.</p>}
            
            {results.length > 0 && (
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-2">
                    {results.map((contact, i) => {
                        const isExisting = contact.email && existingEmails.has(contact.email);
                        return (
                        <div key={i} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{contact.stationName} <span className="text-gray-400 font-normal">({contact.country})</span></p>
                                <a href={contact.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center">Website <ExternalLinkIcon className="w-3 h-3 ml-1" /></a>
                                <p className="text-xs text-gray-300 mt-1">{contact.description}</p>
                                {contact.email ? <p className="text-xs text-purple-300 mt-1">{contact.contactName}: {contact.email}</p> : <p className="text-xs text-gray-500 italic mt-1">No verified email found</p>}
                            </div>
                            <button onClick={() => onAddContact(contact, genre)} disabled={isExisting || !contact.email} className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed">
                                {isExisting ? 'Saved' : 'Save'}
                            </button>
                        </div>
                    )})}
                </div>
            )}
            
            {results.length > 0 && !isLoading && (
                 <div className="mt-4 text-center">
                    <button onClick={handleLoadMore} disabled={isLoadMoreLoading} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-600">
                        {isLoadMoreLoading ? 'Researching...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
};

interface RadioOutreachProps {
    bands: BandProfile[];
    radioContacts: RadioContact[];
    setRadioContacts: React.Dispatch<React.SetStateAction<RadioContact[]>>;
    activeBandId: string;
    saveSearchResults?: (searchTerm: string, source: string, results: any[]) => void;
    getSearchResults?: (source: string, searchTerm?: string) => any;
}

// Main Component
export const RadioOutreach: React.FC<RadioOutreachProps> = ({ bands, radioContacts: allSavedContacts, setRadioContacts: setSavedContacts, activeBandId, saveSearchResults, getSearchResults }) => {
  const savedContacts = useMemo(() => allSavedContacts.filter(l => l.bandId === activeBandId), [allSavedContacts, activeBandId]);
  const bandProfile = useMemo(() => bands.find(b => b.id === activeBandId) || bands[0], [bands, activeBandId]);
  
  const [editingContact, setEditingContact] = useState<RadioContact | null>(null);
  const [contactForEmail, setContactForEmail] = useState<PressContact | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveContact = (contact: RadioContact) => {
    const exists = allSavedContacts.some(c => c.id === contact.id);
    if(exists) {
        setSavedContacts(prev => prev.map(c => c.id === contact.id ? contact : c));
    } else {
        setSavedContacts(prev => [contact, ...prev]);
    }
    setEditingContact(null);
  };

  const handleAddFoundContact = (foundContact: RadioOpportunity, query: string) => {
      if (foundContact.email && savedContacts.some(c => c.email === foundContact.email)) {
          showNotification('Contact with this email already exists.');
          return;
      }
      const contact: RadioContact = {
          id: Date.now().toString(),
          name: foundContact.contactName,
          stationName: foundContact.stationName,
          email: foundContact.email,
          country: foundContact.country,
          city: foundContact.city,
          submissionUrl: foundContact.url,
          genres: foundContact.description,
          notes: `Found via AI research for genre: "${query}"`,
          bandId: activeBandId,
      };
      setSavedContacts(prev => [contact, ...prev]);
      showNotification(`${contact.stationName} saved to your list!`);
  };
  
  const deleteContact = (id: string) => setSavedContacts(prev => prev.filter(c => c.id !== id));
  
  const handlePitch = (radio: RadioContact) => {
    const contact: PressContact = {
        id: radio.id,
        name: radio.name,
        outlet: radio.stationName,
        email: radio.email,
        tier: ContactTier.A,
        bandId: radio.bandId,
    };
    setContactForEmail(contact);
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold flex items-center gap-3"><RadioIcon className="w-8 h-8"/> Radio Outreach</h1>
            <button onClick={() => setEditingContact({} as RadioContact)} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">
                <PlusIcon className="h-5 w-5 mr-2"/>Add Contact Manually
            </button>
        </div>
        
        {notification && (
            <div className="fixed top-5 right-5 z-50 p-4 text-sm rounded-lg shadow-lg bg-green-800 text-green-200">
                {notification}
            </div>
        )}

        {showTip && (
          <Tip onDismiss={() => setShowTip(false)}>Use the AI-powered finder to discover radio stations and DJs that match your genre.</Tip>
        )}

        <RadioFinder onAddContact={handleAddFoundContact} savedContacts={savedContacts} saveSearchResults={saveSearchResults} getSearchResults={getSearchResults} />

        <div className="bg-gray-800 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold p-4">My Radio Database ({savedContacts.length})</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-700/50">
                        <tr className="border-b border-gray-700">
                            <th className="p-3 text-sm font-semibold text-gray-300">Station</th>
                            <th className="p-3 text-sm font-semibold text-gray-300">Contact</th>
                            <th className="p-3 text-sm font-semibold text-gray-300">Email</th>
                            <th className="p-3 text-right text-sm font-semibold text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {savedContacts.map(contact => (
                            <tr key={contact.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                                <td className="p-3 font-semibold">{contact.stationName}</td>
                                <td className="p-3 text-gray-300">{contact.name}</td>
                                <td className="p-3 text-gray-300">{contact.email}</td>
                                <td className="p-3 text-right flex gap-2 justify-end">
                                    <a href={contact.submissionUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded-md text-sm"><ExternalLinkIcon className="w-4 h-4 mr-1"/>Website</a>
                                    <button onClick={() => handlePitch(contact)} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-md text-sm"><BotIcon className="w-4 h-4 mr-1"/>AI Pitch</button>
                                    <button onClick={() => setEditingContact(contact)} className="p-1 rounded-full hover:bg-gray-600"><EditIcon className="w-5 h-5 text-gray-400"/></button>
                                    <button onClick={() => deleteContact(contact.id)} className="p-1 rounded-full hover:bg-gray-600"><TrashIcon className="w-5 h-5 text-red-500"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {savedContacts.length === 0 && <p className="text-center text-gray-500 py-8">No radio contacts saved yet.</p>}
        </div>

        {contactForEmail && <AiEmailModal contact={contactForEmail} onClose={() => setContactForEmail(null)} bandProfile={bandProfile} />}
        {editingContact && <RadioContactModal contact={editingContact} onClose={() => setEditingContact(null)} onSave={handleSaveContact} activeBandId={activeBandId} />}
    </div>
  );
};

const RadioContactModal: React.FC<{contact: RadioContact, onClose: () => void, onSave: (contact: RadioContact) => void, activeBandId: string}> = ({ contact, onClose, onSave, activeBandId }) => {
    const [data, setData] = useState(contact);
    const isNew = !contact.id;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...data, id: data.id || Date.now().toString(), bandId: activeBandId, name: data.name || `${data.stationName} Music Dept.` });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{isNew ? 'Add Radio Contact' : 'Edit Radio Contact'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Station Name" value={data.stationName || ''} onChange={e => setData({...data, stationName: e.target.value})} className="bg-gray-700 p-2 rounded" required />
                        <input type="email" placeholder="Contact Email" value={data.email || ''} onChange={e => setData({...data, email: e.target.value})} className="bg-gray-700 p-2 rounded" required />
                        <input type="text" placeholder="Contact Person (DJ, etc)" value={data.name || ''} onChange={e => setData({...data, name: e.target.value})} className="bg-gray-700 p-2 rounded" />
                        <input type="text" placeholder="Country" value={data.country || ''} onChange={e => setData({...data, country: e.target.value})} className="bg-gray-700 p-2 rounded" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">Cancel</button>
                        <button type="submit" className="bg-spotify-green hover:bg-green-500 px-4 py-2 rounded">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { PressContact, FoundPressContact, BandProfile, LastSearchParams } from '../types';
import { ContactTier } from '../types';
import { PlusIcon, TrashIcon, CopyIcon, UploadCloudIcon, SearchIcon, ExternalLinkIcon } from './icons';
import { generateEmail, EmailTone, EmailLength, findPressContacts } from '../services/aiService';
import { Tip } from './Tip';
import useLocalStorage from '../hooks/useLocalStorage';
import { getUserScopedItem, removeUserScopedItem } from '../state/userStorageScope';

interface AiEmailModalProps {
    contacts: PressContact[];
    onClose: () => void;
    bandProfile: BandProfile;
}

const AiEmailModal: React.FC<AiEmailModalProps> = ({ contacts, onClose, bandProfile }) => {
    const [prompt, setPrompt] = useState('');
    const [tone, setTone] = useState<EmailTone>('Professional');
    const [length, setLength] = useState<EmailLength>('Standard');
    const [generatedEmail, setGeneratedEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState('');
    
    const isBulk = contacts.length > 1;
    const targetDisplay = isBulk ? `${contacts.length} contacts` : contacts[0]?.name;


    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setGeneratedEmail('');
        setError('');
        try {
            const result = await generateEmail(prompt, contacts[0]?.name || '', tone, length, bandProfile, isBulk);
            setGeneratedEmail(result);
        } catch (error) {
            console.error('Could not generate the press email:', error);
            setError(error instanceof Error ? error.message : 'The email could not be generated. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedEmail);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            console.error('Could not copy the press email:', error);
            setError('Could not access the clipboard. Select and copy the generated text manually.');
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white">Generate Email for <span className="text-purple-400">{targetDisplay}</span></h2>
                    {isBulk && <p className="text-gray-400 mb-4 text-xs">The email will be personalized for each contact using placeholders like {'`{{name}}`'} and {'`{{outlet}}`'}.</p>}
                    <p className="text-gray-400 mb-4 text-sm">Describe the email you want to send. e.g., "Announce our new single 'Cosmic Echoes' coming out next month."</p>
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Your prompt..." rows={3} className="w-full bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 ring-spotify-green"></textarea>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                           <label className="text-xs text-gray-400">Tone</label>
                           <select value={tone} onChange={e => setTone(e.target.value as EmailTone)} className="w-full bg-gray-700 p-2 rounded-lg text-sm">
                               <option>Professional</option><option>Casual</option><option>Enthusiastic</option><option>Minimalist</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-xs text-gray-400">Length</label>
                           <select value={length} onChange={e => setLength(e.target.value as EmailLength)} className="w-full bg-gray-700 p-2 rounded-lg text-sm">
                               <option>Brief</option><option>Standard</option><option>Detailed</option>
                           </select>
                        </div>
                        <button onClick={handleGenerate} disabled={isLoading || !prompt} className="self-end bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                            {isLoading ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex-grow overflow-y-auto bg-gray-900 rounded-lg p-4">
                    {isLoading && <div className="text-center p-8 text-gray-400">AI is writing...</div>}
                    {generatedEmail && (
                        <textarea readOnly value={generatedEmail} className="w-full h-full bg-transparent text-gray-300 border-none focus:ring-0 resize-none"></textarea>
                    )}
                    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
                </div>

                <div className="flex justify-end gap-4 mt-4 flex-shrink-0">
                    {generatedEmail && <button onClick={handleCopy} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"><CopyIcon className="w-4 h-4 mr-2"/> {isCopied ? 'Copied!' : 'Copy Text'}</button>}
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Close</button>
                </div>
            </div>
        </div>
    );
};

const ContactFinder: React.FC<{ onAddContact: (contact: FoundPressContact, artistQuery: string) => void, existingEmails: Set<string>, activeBandId: string, saveSearchResults?: (searchTerm: string, source: string, results: any[]) => void, getSearchResults?: (source: string, searchTerm?: string) => any }> = ({ onAddContact, existingEmails, activeBandId, saveSearchResults, getSearchResults }) => {
    const [artistQuery, setArtistQuery] = useState('');
    const [pubType, setPubType] = useState('any');
    const [country, setCountry] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
    const [results, setResults] = useState<FoundPressContact[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [, setLastSearches] = useLocalStorage<LastSearchParams>(`lastSearches_${activeBandId}`, {});

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!artistQuery.trim()) return;
        setIsLoading(true);
        setHasSearched(true);
        setResults([]);
        setLastSearches(prev => ({ ...prev, press: { artistName: artistQuery, pubType, country } }));
        
        const taskId = `task-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: `Finding contacts for '${artistQuery}'...`, estimatedDuration: 45 } }));

        try {
            const contacts = await findPressContacts(artistQuery, pubType, country);
            setResults(contacts);
            if (saveSearchResults) {
              saveSearchResults(artistQuery, 'press', contacts);
            }
        } finally {
            setIsLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    }
    
     const handleLoadMore = async () => {
        if (!artistQuery.trim()) return;
        setIsLoadMoreLoading(true);
        const taskId = `task-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: `Finding more contacts...`, estimatedDuration: 30 } }));
        try {
            const newContacts = await findPressContacts(artistQuery, pubType, country, results);
            setResults(prev => [...prev, ...newContacts]);
        } finally {
            setIsLoadMoreLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-lg">
            <h3 className="text-xl font-bold mb-2">Find New Contacts</h3>
            <p className="text-sm text-gray-400 mb-4">Enter an artist with a similar sound to find journalists who might be interested in your music.</p>
            <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={artistQuery}
                        onChange={e => setArtistQuery(e.target.value)}
                        placeholder="e.g., Tame Impala, Beach House..."
                        className="flex-1 bg-gray-700 p-3 rounded-lg"
                    />
                    <button type="submit" disabled={isLoading} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-600">
                        <SearchIcon className="h-5 w-5 mr-2" />
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400">Publication Type</label>
                        <select value={pubType} onChange={e => setPubType(e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg mt-1 text-sm">
                            <option value="any">Any</option>
                            <option value="Blog">Blog</option>
                            <option value="Magazine">Magazine</option>
                            <option value="Playlist Curator">Playlist Curator</option>
                        </select>
                    </div>
                     <div>
                        <label className="text-xs text-gray-400">Country (optional)</label>
                        <input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g., USA, Germany" className="w-full bg-gray-700 p-2 rounded-lg mt-1 text-sm"/>
                    </div>
                </div>
            </form>

            {isLoading && (
                 <div className="text-center py-4 text-gray-400">
                    <p>Finding contacts... Check the progress bar at the top of the page.</p>
                </div>
            )}
            
            {!isLoading && hasSearched && results.length === 0 && <p className="text-center py-4 text-gray-500">No recent articles found for that artist.</p>}
            
            {results.length > 0 && (
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-2">
                    {results.map((contact, i) => {
                        const isExisting = contact.email && existingEmails.has(contact.email);
                        return (
                        <div key={i} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{contact.name} <span className="text-gray-400 font-normal">({contact.outlet}, {contact.country})</span></p>
                                <a href={contact.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center">Article Link <ExternalLinkIcon className="w-3 h-3 ml-1" /></a>
                                {contact.email ? <p className="text-xs text-purple-300">{contact.email}</p> : <p className="text-xs text-gray-500 italic">No verified email found</p>}
                            </div>
                            <button 
                                onClick={() => onAddContact(contact, artistQuery)}
                                disabled={isExisting || !contact.email}
                                className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                {isExisting ? 'Added' : 'Add'}
                            </button>
                        </div>
                    )})}
                </div>
            )}
            
            {!isLoading && results.length > 0 && (
                <div className="mt-4 text-center">
                    <button 
                        onClick={handleLoadMore} 
                        disabled={isLoadMoreLoading}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoadMoreLoading ? 'Researching...' : 'Load More Contacts'}
                    </button>
                </div>
            )}

        </div>
    );
};

interface PressOutreachProps {
    bands: BandProfile[];
    activeBandId: string;
    pressContacts: PressContact[];
    setPressContacts: React.Dispatch<React.SetStateAction<PressContact[]>>;
    saveSearchResults?: (searchTerm: string, source: string, results: any[]) => void;
    getSearchResults?: (source: string, searchTerm?: string) => any;
}

export const PressOutreach: React.FC<PressOutreachProps> = ({ bands, activeBandId, pressContacts: allContacts, setPressContacts: setContacts, saveSearchResults, getSearchResults }) => {
  const activeBand = useMemo(() => bands.find(b => b.id === activeBandId) || bands[0], [bands, activeBandId]);
  
  const contacts = useMemo(() => allContacts.filter(c => c.bandId === activeBandId), [allContacts, activeBandId]);
  
  const [showForm, setShowForm] = useState(false);
  const [newContact, setNewContact] = useState<Omit<PressContact, 'id' | 'bandId'>>({
      name: '', outlet: '', email: '', tier: ContactTier.C, socials: '', notes: ''
  });
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [contactsForEmail, setContactsForEmail] = useState<PressContact[]>([]);
  const [showTip, setShowTip] = useState(true);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('All');

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = searchQuery === '' ||
            contact.name.toLowerCase().includes(searchLower) ||
            contact.outlet.toLowerCase().includes(searchLower) ||
            contact.email.toLowerCase().includes(searchLower);
        
        const matchesTier = tierFilter === 'All' || contact.tier === tierFilter;

        return matchesSearch && matchesTier;
    });
  }, [contacts, searchQuery, tierFilter]);


  useEffect(() => {
    // Check for AI suggestion data on mount
    const suggestionDataRaw = getUserScopedItem('wizard_suggestion_data');
    if (suggestionDataRaw) {
        try {
            const foundContacts: FoundPressContact[] = JSON.parse(suggestionDataRaw);
            if (Array.isArray(foundContacts) && foundContacts[0]?.outlet) { // Simple check to ensure it's press data
                let addedCount = 0;
                foundContacts.forEach(fc => {
                    if (fc.email && !contacts.some(c => c.email === fc.email)) {
                       handleAddFoundContact(fc, "your last search");
                       addedCount++;
                    }
                });
                if (addedCount > 0) {
                    setNotification({ message: `Added ${addedCount} new contacts from your dashboard suggestion!`, type: 'success' });
                }
                // Only remove if it was processed successfully
                removeUserScopedItem('wizard_suggestion_data');
            }
        } catch (e) {
            console.error("Could not parse AI suggestion data for Press Outreach", e);
        }
    }
  }, []);

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.email) return;
    setContacts(prev => [{ id: Date.now().toString(), ...newContact, bandId: activeBandId }, ...prev]);
    setNewContact({ name: '', outlet: '', email: '', tier: ContactTier.C, socials: '', notes: '' });
    setShowForm(false);
  };

  const handleAddFoundContact = (foundContact: FoundPressContact, artistQuery: string) => {
      if (foundContact.email && contacts.some(c => c.email === foundContact.email)) {
          setNotification({ message: 'Contact with this email already exists.', type: 'error' });
          setTimeout(() => setNotification(null), 3000);
          return;
      }
      const contact: PressContact = {
          id: Date.now().toString(),
          name: foundContact.name,
          outlet: foundContact.outlet,
          email: foundContact.email,
          country: foundContact.country,
          city: foundContact.city,
          sourceUrl: foundContact.url,
          tier: ContactTier.C,
          notes: `Found via Sound Match search for artists similar to "${artistQuery}".`,
          bandId: activeBandId,
      };
      setContacts(prev => [contact, ...prev]);
      setNotification({ message: `${contact.name} added to your list!`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
  };
  
  const deleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    setSelectedContacts(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
    });
  };

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(contactId)) {
            newSet.delete(contactId);
        } else {
            newSet.add(contactId);
        }
        return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
    } else {
        setSelectedContacts(new Set());
    }
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) throw new Error("CSV file is empty or has no data rows.");

            const header = lines[0].split(',').map(h => h.trim().toLowerCase());
            const requiredHeaders = ['name', 'outlet', 'email'];
            if (!requiredHeaders.every(h => header.includes(h))) {
                throw new Error('CSV must include name, outlet, and email columns.');
            }
            
            const existingEmails = new Set(contacts.map(c => c.email));
            let importedCount = 0;
            let skippedCount = 0;
            
            const newContacts = lines.slice(1).map((line, i) => {
                const values = line.split(',');
                const contactData: any = {};
                header.forEach((h, index) => contactData[h] = values[index]?.trim().replace(/"/g, '') || '');

                if (!contactData.email || existingEmails.has(contactData.email)) {
                    skippedCount++;
                    return null;
                }
                
                importedCount++;
                existingEmails.add(contactData.email);

                const contact: PressContact = {
                    id: `imported-${Date.now()}-${i}`,
                    name: contactData.name || 'N/A',
                    outlet: contactData.outlet || 'N/A',
                    email: contactData.email,
                    tier: Object.values(ContactTier).includes(contactData.tier) ? contactData.tier : ContactTier.C,
                    socials: contactData.socials || '',
                    notes: contactData.notes || '',
                    bandId: activeBandId,
                };
                return contact;
            }).filter((c): c is PressContact => c !== null);

            setContacts(prev => [...prev, ...newContacts]);
            setNotification({ message: `Successfully imported ${importedCount} contacts. Skipped ${skippedCount} duplicates.`, type: 'success' });
        } catch (error: any) {
            setNotification({ message: error.message || 'Failed to parse CSV.', type: 'error' });
        } finally {
             setTimeout(() => setNotification(null), 5000);
             if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };
  
  const existingEmailsSet = new Set(contacts.map(c => c.email).filter(Boolean));

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Press Outreach</h1>
            <div className="flex items-center gap-4">
                 <button onClick={() => setShowForm(!showForm)} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    <PlusIcon className="h-5 w-5 mr-2"/>
                    {showForm ? 'Cancel' : 'Add Contact'}
                </button>
            </div>
        </div>
        
        {notification && (
            <div className={`fixed top-5 right-5 z-50 p-4 text-sm rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
                {notification.message}
            </div>
        )}

        <Tip onDismiss={() => setShowTip(false)}>
            Use the "Find New Contacts" tool below to discover journalists who cover artists like you. Your searches will now power the AI assistant on the dashboard!
        </Tip>

        <ContactFinder onAddContact={handleAddFoundContact} existingEmails={existingEmailsSet} activeBandId={activeBandId} saveSearchResults={saveSearchResults} getSearchResults={getSearchResults} />

        {showForm && (
            <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-lg">
                <form onSubmit={handleAddContact} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Contact Name" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} className="bg-gray-700 p-3 rounded-lg ring-spotify-green" />
                        <input type="text" placeholder="Outlet (e.g., Blog Name)" value={newContact.outlet} onChange={e => setNewContact({...newContact, outlet: e.target.value})} className="bg-gray-700 p-3 rounded-lg ring-spotify-green" />
                        <input type="email" placeholder="Email Address" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} className="bg-gray-700 p-3 rounded-lg ring-spotify-green" />
                        <input type="text" placeholder="Social Media Handle" value={newContact.socials} onChange={e => setNewContact({...newContact, socials: e.target.value})} className="bg-gray-700 p-3 rounded-lg ring-spotify-green" />
                    </div>
                    <select value={newContact.tier} onChange={e => setNewContact({...newContact, tier: e.target.value as ContactTier})} className="w-full bg-gray-700 p-3 rounded-lg ring-spotify-green">
                        {Object.values(ContactTier).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <textarea placeholder="Notes (e.g., submission guidelines)" value={newContact.notes} onChange={e => setNewContact({...newContact, notes: e.target.value})} className="w-full bg-gray-700 p-3 rounded-lg ring-spotify-green" rows={2}></textarea>
                    <button type="submit" className="w-full bg-spotify-green hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-colors">Save Contact</button>
                </form>
            </div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-lg">
            <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-700">
                <h3 className="text-xl font-bold">My Contact List ({filteredContacts.length})</h3>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-gray-700 p-2 pl-10 rounded-lg text-sm w-full" />
                    </div>
                    <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="bg-gray-700 p-2 rounded-lg text-sm">
                        <option value="All">All Tiers</option>
                        {Object.values(ContactTier).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            <div className="p-4 flex justify-end items-center">
                {selectedContacts.size > 0 && (
                    <button 
                        onClick={() => setContactsForEmail(allContacts.filter(c => selectedContacts.has(c.id)))}
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        AI Email to {selectedContacts.size} Selected
                    </button>
                )}
                 <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv" className="hidden" />
                <button onClick={handleImportClick} className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors ml-4">
                    <UploadCloudIcon className="h-5 w-5 mr-2" />
                    Import CSV
                </button>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-700/50">
                        <tr className="border-b border-gray-700">
                            <th className="p-3 w-4">
                                <input 
                                    type="checkbox"
                                    className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-spotify-green ring-spotify-green"
                                    checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="p-3 text-sm font-semibold text-gray-300">Name</th>
                            <th className="p-3 text-sm font-semibold text-gray-300">Outlet</th>
                            <th className="p-3 text-sm font-semibold text-gray-300">Email</th>
                            <th className="p-3 text-sm font-semibold text-gray-300">Tier</th>
                            <th className="p-3 text-right text-sm font-semibold text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredContacts.map(contact => (
                            <tr key={contact.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50 transition-colors">
                                <td className="p-3">
                                    <input 
                                        type="checkbox"
                                        className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-spotify-green ring-spotify-green"
                                        checked={selectedContacts.has(contact.id)}
                                        onChange={() => handleSelectContact(contact.id)}
                                    />
                                </td>
                                <td className="p-3 font-semibold">{contact.name}</td>
                                <td className="p-3 text-gray-300">{contact.outlet} {contact.country && <span className="text-xs text-gray-500">({contact.country})</span>}</td>
                                <td className="p-3 text-gray-300">{contact.email}</td>
                                <td className="p-3 text-gray-300">{contact.tier}</td>
                                <td className="p-3 text-right flex gap-2 justify-end">
                                    <button onClick={() => setContactsForEmail([contact])} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-3 rounded-md text-sm">AI Email</button>
                                    <button onClick={() => deleteContact(contact.id)} className="p-1 rounded-full hover:bg-gray-600"><TrashIcon className="w-5 h-5 text-red-500"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filteredContacts.length === 0 && <p className="text-center text-gray-500 py-8">No contacts match your filters. Start building your press list!</p>}
        </div>

        {contactsForEmail.length > 0 && <AiEmailModal contacts={contactsForEmail} onClose={() => setContactsForEmail([])} bandProfile={activeBand} />}
    </div>
  );
};

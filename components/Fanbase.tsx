import React, { useState, useRef, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { FanContact } from '../types';
import { initialFanContacts } from '../data/initialData';
import { PlusIcon, TrashIcon, UploadCloudIcon, CodeIcon, UsersIcon, SearchIcon, CopyIcon, EditIcon, SaveIcon, SlashIcon } from './icons';
import { Tip } from './Tip';

// Website Integration Modal
const WebsiteIntegrationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [isCopied, setIsCopied] = useState(false);
    const codeSnippet = `<!-- BandHQ Fan Signup Form -->
<style>
  #bandhq-signup-form { font-family: sans-serif; max-width: 320px; }
  #bandhq-signup-form input { width: 100%; padding: 8px; margin-bottom: 8px; box-sizing: border-box; }
  #bandhq-signup-form button { width: 100%; padding: 10px; background-color: #1DB954; color: white; border: none; cursor: pointer; }
</style>
<form id="bandhq-signup-form">
  <h3>Join our Mailing List!</h3>
  <input type="email" id="bandhq-email" placeholder="Your email" required>
  <input type="text" id="bandhq-name" placeholder="Your name (optional)">
  <button type="submit">Subscribe</button>
</form>
<script>
  document.getElementById('bandhq-signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('bandhq-email').value;
    const name = document.getElementById('bandhq-name').value;
    const newSubscriber = { name, email, origin: 'Website Signup', dateAdded: new Date().toISOString() };
    
    try {
      let subscribers = JSON.parse(localStorage.getItem('bandhq-subscribers') || '[]');
      if (!subscribers.find(s => s.email === email)) {
        subscribers.push(newSubscriber);
        localStorage.setItem('bandhq-subscribers', JSON.stringify(subscribers));
        alert('Thanks for subscribing!');
      } else {
        alert('You are already subscribed!');
      }
      document.getElementById('bandhq-signup-form').reset();
    } catch (error) {
      console.error('BandHQ Signup Error:', error);
      alert('Could not subscribe. Please try again later.');
    }
  });
<\/script>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(codeSnippet);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Website Integration</h2>
                <p className="text-sm text-gray-400 mb-4">Copy and paste this HTML snippet into your band's website to start collecting emails. New signups will be saved in the browser's local storage. You can then use the "Sync from Website" button in the app to import them.</p>
                <div className="bg-gray-900 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <pre><code className="text-xs text-gray-300">{codeSnippet}</code></pre>
                </div>
                <div className="flex justify-end gap-4 mt-4">
                    <button onClick={handleCopy} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                        <CopyIcon className="w-4 h-4 mr-2" /> {isCopied ? 'Copied!' : 'Copy Code'}
                    </button>
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Close</button>
                </div>
            </div>
        </div>
    );
};

interface FanbaseProps {
    activeBandId: string;
    fanContacts: FanContact[];
    setFanContacts: React.Dispatch<React.SetStateAction<FanContact[]>>;
}

// Main Component
export const Fanbase: React.FC<FanbaseProps> = ({ activeBandId, fanContacts: allFanContacts, setFanContacts }) => {
    const fanContacts = useMemo(() => allFanContacts.filter(f => f.bandId === activeBandId), [allFanContacts, activeBandId]);
    
    const [showForm, setShowForm] = useState(false);
    const [newContact, setNewContact] = useState<Omit<FanContact, 'id' | 'dateAdded' | 'bandId'>>({ name: '', email: '', origin: 'Manual' });
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [showWebsiteModal, setShowWebsiteModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [originFilter, setOriginFilter] = useState('All');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedData, setEditedData] = useState<Partial<FanContact>>({});

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const handleAddContact = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newContact.email) return;
        setFanContacts(prev => [{ id: `fan-${Date.now()}`, ...newContact, dateAdded: new Date().toISOString(), bandId: activeBandId }, ...prev]);
        setNewContact({ name: '', email: '', origin: 'Manual' });
        setShowForm(false);
        showNotification('Fan added successfully.', 'success');
    };

    const deleteContact = (id: string) => {
        setFanContacts(prev => prev.filter(c => c.id !== id));
    };

    const handleStartEditing = (contact: FanContact) => {
        setEditingId(contact.id);
        setEditedData({ name: contact.name, email: contact.email });
    };

    const handleSaveEditing = () => {
        if (!editingId) return;
        setFanContacts(prev => prev.map(c => c.id === editingId ? { ...c, ...editedData } as FanContact : c));
        setEditingId(null);
        setEditedData({});
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
                const emailIndex = header.indexOf('email');
                if (emailIndex === -1) throw new Error('CSV must include an "email" column.');

                const nameIndex = header.indexOf('name');
                const originIndex = header.indexOf('origin');

                const existingEmails = new Set(fanContacts.map(c => c.email));
                let importedCount = 0;
                let skippedCount = 0;
                
                const newFans = lines.slice(1).map((line, i) => {
                    const values = line.split(',');
                    const email = values[emailIndex]?.trim().replace(/"/g, '');

                    if (!email || existingEmails.has(email)) {
                        skippedCount++;
                        return null;
                    }
                    
                    importedCount++;
                    existingEmails.add(email);

                    return {
                        id: `imported-${Date.now()}-${i}`,
                        name: nameIndex > -1 ? values[nameIndex]?.trim().replace(/"/g, '') || '' : '',
                        email,
                        origin: originIndex > -1 ? values[originIndex]?.trim().replace(/"/g, '') || 'CSV Import' : 'CSV Import',
                        dateAdded: new Date().toISOString(),
                        bandId: activeBandId,
                    };
                }).filter((c): c is FanContact => c !== null);

                setFanContacts(prev => [...prev, ...newFans]);
                showNotification(`Successfully imported ${importedCount} fans. Skipped ${skippedCount} duplicates.`, 'success');
            } catch (error: any) {
                showNotification(error.message || 'Failed to parse CSV.', 'error');
            } finally {
                 if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };
    
    const handleWebsiteSync = () => {
        try {
            const websiteSubsRaw = localStorage.getItem('bandhq-subscribers');
            if (!websiteSubsRaw) {
                showNotification("No website subscribers found in local storage. Make sure your form is working.", 'error');
                return;
            }
            const websiteSubs = JSON.parse(websiteSubsRaw);
            const existingEmails = new Set(fanContacts.map(c => c.email));
            let newCount = 0;

            const newFans: FanContact[] = websiteSubs.map((sub: any) => {
                if(sub.email && !existingEmails.has(sub.email)) {
                    newCount++;
                    return {
                        id: `web-${Date.now()}-${sub.email}`,
                        name: sub.name || '',
                        email: sub.email,
                        origin: 'Website Signup',
                        dateAdded: sub.dateAdded || new Date().toISOString(),
                        bandId: activeBandId,
                    }
                }
                return null;
            }).filter(Boolean);

            if (newFans.length > 0) {
                setFanContacts(prev => [...prev, ...newFans]);
            }
            showNotification(`Synced ${newCount} new subscribers from your website!`, 'success');
        } catch (error) {
            showNotification("Failed to sync from website. Data might be corrupted.", 'error');
            console.error("Website Sync Error:", error);
        }
    };
    
    const uniqueOrigins = useMemo(() => {
        const origins = new Set(fanContacts.map(c => c.origin));
        return ['All', ...Array.from(origins)];
    }, [fanContacts]);

    const filteredContacts = useMemo(() => {
        return fanContacts.filter(c => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = searchQuery === '' ||
                c.name.toLowerCase().includes(searchLower) ||
                c.email.toLowerCase().includes(searchLower);
            
            const matchesOrigin = originFilter === 'All' || c.origin === originFilter;
            
            return matchesSearch && matchesOrigin;
        });
    }, [fanContacts, searchQuery, originFilter]);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold flex items-center gap-3"><UsersIcon className="w-8 h-8"/> Fanbase</h1>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowForm(!showForm)} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
                        <PlusIcon className="h-5 w-5 mr-2"/>{showForm ? 'Cancel' : 'Add Fan'}
                    </button>
                </div>
            </div>

            {notification && (
                <div className={`fixed top-5 right-5 z-50 p-4 text-sm rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
                    {notification.message}
                </div>
            )}
            
            <Tip onDismiss={() => {}}>Build your mailing list by adding fans manually, importing a CSV, or integrating a signup form on your website.</Tip>

            {showForm && (
                <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-lg">
                    <form onSubmit={handleAddContact} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="text" placeholder="Full Name (optional)" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} className="bg-gray-700 p-3 rounded-lg" />
                            <input type="email" placeholder="Email Address" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} className="bg-gray-700 p-3 rounded-lg" required />
                            <input type="text" placeholder="Origin (e.g., Merch Table)" value={newContact.origin} onChange={e => setNewContact({...newContact, origin: e.target.value})} className="bg-gray-700 p-3 rounded-lg" required/>
                        </div>
                        <button type="submit" className="w-full bg-spotify-green hover:bg-green-500 text-white font-bold py-3 rounded-lg">Save Fan</button>
                    </form>
                </div>
            )}

            <div className="bg-gray-800 rounded-xl shadow-lg">
                <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-700">
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-grow">
                        <div className="relative flex-grow">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input type="text" placeholder="Search fans..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-700 p-2 pl-10 rounded-lg"/>
                        </div>
                        <select value={originFilter} onChange={e => setOriginFilter(e.target.value)} className="bg-gray-700 p-2 rounded-lg text-sm">
                            {uniqueOrigins.map(o => <option key={o} value={o}>{o === 'All' ? 'All Origins' : o}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv" className="hidden" />
                        <button onClick={handleImportClick} className="flex items-center text-sm bg-gray-600 hover:bg-gray-700 py-2 px-3 rounded-lg"><UploadCloudIcon className="h-4 w-4 mr-2" />Import CSV</button>
                        <button onClick={() => setShowWebsiteModal(true)} className="flex items-center text-sm bg-gray-600 hover:bg-gray-700 py-2 px-3 rounded-lg"><CodeIcon className="h-4 w-4 mr-2" />Website Integration</button>
                        <button onClick={handleWebsiteSync} className="flex items-center text-sm bg-blue-600 hover:bg-blue-700 py-2 px-3 rounded-lg">Sync from Website</button>
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700/50">
                            <tr className="border-b border-gray-700">
                                <th className="p-3 text-sm font-semibold text-gray-300">Name</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Email</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Origin</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Date Added</th>
                                <th className="p-3 text-right text-sm font-semibold text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContacts.map(contact => (
                                <tr key={contact.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                                    {editingId === contact.id ? (
                                        <>
                                            <td className="p-2"><input value={editedData.name} onChange={e => setEditedData({...editedData, name: e.target.value})} className="bg-gray-900 p-1 rounded-md w-full"/></td>
                                            <td className="p-2"><input value={editedData.email} onChange={e => setEditedData({...editedData, email: e.target.value})} className="bg-gray-900 p-1 rounded-md w-full"/></td>
                                            <td className="p-3 text-gray-300">{contact.origin}</td>
                                            <td className="p-3 text-gray-400">{new Date(contact.dateAdded).toLocaleDateString()}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={handleSaveEditing} className="p-1 rounded-full hover:bg-gray-600"><SaveIcon className="w-5 h-5 text-green-500"/></button>
                                                <button onClick={() => setEditingId(null)} className="p-1 rounded-full hover:bg-gray-600"><SlashIcon className="w-5 h-5 text-gray-500"/></button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-3 font-semibold">{contact.name || <span className="text-gray-500 italic">No name</span>}</td>
                                            <td className="p-3 text-gray-300">{contact.email}</td>
                                            <td className="p-3 text-gray-300">{contact.origin}</td>
                                            <td className="p-3 text-gray-400">{new Date(contact.dateAdded).toLocaleDateString()}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => handleStartEditing(contact)} className="p-1 rounded-full hover:bg-gray-600"><EditIcon className="w-5 h-5 text-gray-500"/></button>
                                                <button onClick={() => deleteContact(contact.id)} className="p-1 rounded-full hover:bg-gray-600"><TrashIcon className="w-5 h-5 text-red-500"/></button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredContacts.length === 0 && <p className="text-center text-gray-500 py-8">No fans match your filters.</p>}
            </div>

            {showWebsiteModal && <WebsiteIntegrationModal onClose={() => setShowWebsiteModal(false)} />}
        </div>
    );
};

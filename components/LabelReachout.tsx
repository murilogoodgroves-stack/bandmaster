
import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { LabelContact, LabelOpportunity, BandProfile, LastSearchParams, PressContact } from '../types';
import { ContactTier } from '../types';
import { PlusIcon, TrashIcon, CopyIcon, SearchIcon, ExternalLinkIcon, BotIcon, SaveIcon, BuildingIcon, EditIcon, InstagramIcon, TwitterIcon, FacebookIcon, BandcampIcon, UploadCloudIcon } from './icons';
import { generateEmail, EmailTone, EmailLength, findLabelContacts } from '../services/aiService';
import { Tip } from './Tip';

const normalizeLabelKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const parseCsvRow = (row: string) => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < row.length; index += 1) {
        const character = row[index];
        if (character === '"') {
            if (inQuotes && row[index + 1] === '"') {
                current += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (character === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += character;
        }
    }

    values.push(current.trim());
    return values;
};

const parseCsvContacts = (fileText: string): Partial<LabelContact>[] => {
    const rows = fileText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map(parseCsvRow);

    if (rows.length < 2) return [];

    const headers = rows[0].map((header) => normalizeLabelKey(header));
    const parsed: Partial<LabelContact>[] = [];

    rows.slice(1).forEach((row) => {
        const record: Record<string, string> = {};
        headers.forEach((header, index) => {
            record[header] = row[index] || '';
        });

        const labelName = record.labelname || record.label || record.company || record.brand || record['recordlabel'] || '';
        const name = record.contact || record.name || record.person || record['contactname'] || record['labelmanager'] || '';
        const email = record.email || record['emailaddress'] || record['contactemail'] || '';
        const country = record.country || record.location || record.region || '';
        const city = record.city || record['citystate'] || '';
        const website = record.website || record.link || record.url || record['submissionurl'] || '';
        const role = record.role || record.title || record.position || '';
        const notes = record.notes || record['notesdetails'] || '';

        if (!labelName && !name && !email) return;

        parsed.push({
            labelName: labelName || 'Imported Label',
            name: name || 'Label Contact',
            email: email || '',
            country: country || undefined,
            city: city || undefined,
            submissionUrl: website || undefined,
            role: role || undefined,
            notes: notes || undefined,
            website: website || undefined,
            source: 'csv',
        });
    });

    return parsed;
};

const extractLabelDataFromText = (rawText: string): Partial<LabelContact> => {
    const text = String(rawText || '').replace(/\r/g, '');
    const emails = [...text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map((match) => match[0]);
    const urls = [...text.matchAll(/https?:\/\/[^\s]+/gi)].map((match) => match[0]);
    const lines = text
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);

    const labelLine = lines.find((line) => /label|records|music|studio|agency|imprint|group/i.test(line)) || lines[0] || 'Imported Label';
    const contactLine = lines.find((line) => /name|contact|person|manager|a&r|director|coordinator|owner|booking|team/i.test(line)) || lines[1] || 'Label Contact';
    const cityMatch = text.match(/city\s*[:\-]\s*([A-Za-z .'-]+)/i) || text.match(/location\s*[:\-]\s*([A-Za-z .'-]+)/i);
    const countryMatch = text.match(/country\s*[:\-]\s*([A-Za-z .'-]+)/i) || text.match(/nation\s*[:\-]\s*([A-Za-z .'-]+)/i);
    const roleMatch = text.match(/(A&R|Manager|Director|Coordinator|Owner|Head|Booking|Marketing|Label Manager|Reception|Team)/i);

    const cleanLabel = labelLine
        .replace(/^(label|company|record label|music label|label name|name)\s*[:\-]?\s*/i, '')
        .trim();

    const cleanContact = contactLine
        .replace(/^(name|contact|person|manager|director|coordinator|owner|booking|team|a&r)\s*[:\-]?\s*/i, '')
        .trim();

    return {
        labelName: cleanLabel || 'Imported Label',
        name: cleanContact || 'Label Contact',
        email: emails[0] || '',
        website: urls[0] || '',
        submissionUrl: urls[0] || '',
        city: cityMatch ? cityMatch[1].trim() : undefined,
        country: countryMatch ? countryMatch[1].trim() : undefined,
        role: roleMatch ? roleMatch[1].trim() : undefined,
        notes: lines.slice(0, 4).join(' | '),
        source: 'paste',
    };
};

const buildImportedLabelContact = (partial: Partial<LabelContact>, bandId: string, index: number): LabelContact => {
    const safeEmail = (partial.email || '').trim();
    return {
        id: partial.id || `label-import-${Date.now()}-${index}`,
        name: partial.name || 'Label Contact',
        labelName: partial.labelName || 'Imported Label',
        email: safeEmail || `not-listed-${index}@import.local`,
        country: partial.country || '',
        city: partial.city || '',
        genres: partial.genres || '',
        submissionUrl: partial.submissionUrl || partial.website || '',
        notes: partial.notes || 'Imported from uploaded list',
        website: partial.website || partial.submissionUrl || '',
        role: partial.role || '',
        phone: partial.phone || '',
        address: partial.address || '',
        source: partial.source || 'manual',
        lastVerifiedAt: new Date().toISOString(),
        socials: partial.socials || {},
        bandId,
    };
};

// Reusable AI Email Modal for pitching
const AiEmailModal: React.FC<{ contact: PressContact, onClose: () => void, bandProfile: BandProfile }> = ({ contact, onClose, bandProfile }) => {
    const [prompt, setPrompt] = useState(`Write a professional email to ${contact.name} at ${contact.outlet}, submitting our latest demo for consideration. Briefly introduce the band.`);
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

// Component for finding new labels
const LabelFinder: React.FC<{ onAddLabel: (label: LabelOpportunity, query: string) => void, savedLabels: LabelContact[], activeBandId: string, saveSearchResults?: (searchTerm: string, source: string, results: any[]) => void, getSearchResults?: (source: string, searchTerm?: string) => any }> = ({ onAddLabel, savedLabels, activeBandId, saveSearchResults, getSearchResults }) => {
    const [genre, setGenre] = useState('');
    const [country, setCountry] = useState('');
    const [size, setSize] = useState('any');
    const [labelName, setLabelName] = useState('');
    const [similarToLabel, setSimilarToLabel] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
    const [results, setResults] = useState<LabelOpportunity[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const existingEmails = new Set(savedLabels.map(l => l.email));
    const [, setLastSearches] = useLocalStorage<LastSearchParams>(`lastSearches_${activeBandId}`, {});


    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!genre.trim() && !labelName.trim() && !similarToLabel.trim()) {
            alert("Please enter a genre, label name, or a 'similar to' label to search.");
            return;
        }
        setIsLoading(true);
        setHasSearched(true);
        setResults([]);
        setLastSearches(prev => ({ ...prev, labels: { genre, country, size, labelName, similarToLabel } }));
        
        const searchDesc = similarToLabel ? `labels similar to ${similarToLabel}` : 'labels';
        const taskId = `task-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: `Researching ${searchDesc}...`, estimatedDuration: 45 } }));
        
        try {
            const labels = await findLabelContacts(genre, country, size, labelName, savedLabels, similarToLabel);
            setResults(labels);
            if (saveSearchResults) {
              const searchKey = similarToLabel ? `similar:${similarToLabel}` : (labelName || genre);
              saveSearchResults(searchKey, 'labels', labels);
            }
        } finally {
            setIsLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };
    
    const handleLoadMore = async () => {
        if (!genre.trim() && !labelName.trim() && !similarToLabel.trim()) return;
        setIsLoadMoreLoading(true);
        
        const taskId = `task-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Finding more labels...', estimatedDuration: 30 } }));

        try {
            const newLabels = await findLabelContacts(genre, country, size, labelName, savedLabels, similarToLabel);
            setResults(prev => [...prev, ...newLabels.filter(n => !prev.some(p => p.url === n.url))]);
        } finally {
            setIsLoadMoreLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-lg">
            <h3 className="text-xl font-bold mb-2">Find New Labels</h3>
            <p className="text-sm text-gray-400 mb-4">Discover labels by genre, location, or find labels similar to ones you love.</p>
            <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" value={genre} onChange={e => setGenre(e.target.value)} placeholder="Genre (e.g., indie rock, electronic)" className="w-full bg-gray-700 p-2 rounded-lg" />
                    <input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country (optional)" className="w-full bg-gray-700 p-2 rounded-lg" />
                    <select value={size} onChange={e => setSize(e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg">
                        <option value="any">Any Size</option>
                        <option value="Major">Major</option>
                        <option value="Independent">Independent</option>
                        <option value="Boutique">Boutique</option>
                    </select>
                    <input type="text" value={labelName} onChange={e => setLabelName(e.target.value)} placeholder="Specific Label Name (e.g. Sub Pop)" className="w-full bg-gray-700 p-2 rounded-lg" />
                </div>
                <div className="border-t border-gray-700 pt-4 mt-2">
                    <label className="text-sm text-purple-400 font-semibold mb-1 block">Find Similar Labels</label>
                    <input type="text" value={similarToLabel} onChange={e => setSimilarToLabel(e.target.value)} placeholder="Type a label name to find similar ones (e.g., 'Matador Records')" className="w-full bg-gray-700 p-2 rounded-lg ring-1 ring-purple-500/50 focus:ring-purple-500" />
                </div>
                 <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-600">
                    <SearchIcon className="h-5 w-5 mr-2" />{isLoading ? 'Researching...' : 'Find Labels'}
                </button>
            </form>

            {isLoading && <div className="text-center py-4 text-gray-400">Researching... Check the progress bar at the top of the page.</div>}
            {!isLoading && hasSearched && results.length === 0 && <p className="text-center py-4 text-gray-500">No labels found matching your criteria.</p>}
            
            {results.length > 0 && (
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-2">
                    {results.map((label, i) => {
                        const isExisting = label.email && existingEmails.has(label.email);
                        const query = similarToLabel ? `Similar to ${similarToLabel}` : (genre || labelName);
                        return (
                        <div key={i} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{label.labelName} <span className="text-gray-400 font-normal">({label.country})</span></p>
                                <p className="text-xs text-gray-300 mt-1">{label.description}</p>
                                {label.email ? <p className="text-xs text-purple-300 mt-1">{label.contactName}: {label.email}</p> : <p className="text-xs text-gray-500 italic mt-1">No verified email found</p>}
                                <div className="flex gap-2 mt-2">
                                    {label.socials?.instagram && <a href={label.socials.instagram} target="_blank" rel="noopener noreferrer"><InstagramIcon className="w-4 h-4 text-gray-400 hover:text-white" /></a>}
                                    {label.socials?.twitter && <a href={label.socials.twitter} target="_blank" rel="noopener noreferrer"><TwitterIcon className="w-4 h-4 text-gray-400 hover:text-white" /></a>}
                                    {label.socials?.facebook && <a href={label.socials.facebook} target="_blank" rel="noopener noreferrer"><FacebookIcon className="w-4 h-4 text-gray-400 hover:text-white" /></a>}
                                    {label.socials?.bandcamp && <a href={label.socials.bandcamp} target="_blank" rel="noopener noreferrer"><BandcampIcon className="w-4 h-4 text-gray-400 hover:text-white" /></a>}
                                </div>
                            </div>
                            <button onClick={() => onAddLabel(label, query)} disabled={isExisting || !label.email} className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed">
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

interface LabelReachoutProps {
    bands: BandProfile[];
    labelContacts: LabelContact[];
    setLabelContacts: React.Dispatch<React.SetStateAction<LabelContact[]>>;
    activeBandId: string;
    saveSearchResults?: (searchTerm: string, source: string, results: any[]) => void;
    getSearchResults?: (source: string, searchTerm?: string) => any;
}

const BulkLabelImportModal: React.FC<{ open: boolean, bandId: string, onClose: () => void, onSave: (contacts: LabelContact[]) => void }> = ({ open, bandId, onClose, onSave }) => {
    const [textValue, setTextValue] = useState('');
    const [preview, setPreview] = useState<LabelContact[]>([]);
    const [error, setError] = useState<string | null>(null);

    const parseAndPreview = (rawText: string) => {
        const trimmed = rawText.trim();
        if (!trimmed) {
            setPreview([]);
            setError('Paste text or import a file before saving.');
            return;
        }

        const records = trimmed.includes(',') && /email/i.test(trimmed)
            ? parseCsvContacts(trimmed)
            : [extractLabelDataFromText(trimmed)];

        const normalized = records
            .filter((record) => record.email || record.labelName || record.name)
            .map((record, index) => buildImportedLabelContact(record, bandId, index));

        setPreview(normalized);
        setError(normalized.length ? null : 'The data could not be parsed into label records.');
    };

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const fileText = await file.text();
        const importData = file.name.toLowerCase().endsWith('.csv') ? parseCsvContacts(fileText) : [extractLabelDataFromText(fileText)];
        const nextPreview = importData
            .filter((record) => record.email || record.labelName || record.name)
            .map((record, index) => buildImportedLabelContact(record, bandId, index));

        setPreview(nextPreview);
        setTextValue(fileText);
        setError(nextPreview.length ? null : 'The file was uploaded but no usable label records were detected.');
        event.target.value = '';
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Import label contacts</h2>
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded">Close</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Paste a list or CSV text</label>
                        <textarea value={textValue} onChange={(event) => { setTextValue(event.target.value); parseAndPreview(event.target.value); }} className="w-full h-52 bg-gray-700 p-3 rounded-lg" placeholder="Example:&#10;Sable Records&#10;Contact: Maya Chen&#10;A&R Manager&#10;maya@sablerecords.com&#10;City: London&#10;Country: UK" />
                    </div>

                    <div className="flex flex-col justify-between bg-gray-900 rounded-xl p-4">
                        <div>
                            <p className="text-sm text-gray-400 mb-3">Upload a .csv or .txt file to auto-map fields.</p>
                            <input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={handleFileImport} className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500" />
                        </div>
                        <button onClick={() => parseAndPreview(textValue)} className="mt-4 flex items-center justify-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">
                            <SearchIcon className="w-4 h-4 mr-2" />Parse Data
                        </button>
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

                {preview.length > 0 && (
                    <div className="mb-4 bg-gray-900 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-700/80">
                                <tr>
                                    <th className="p-2">Label</th>
                                    <th className="p-2">Contact</th>
                                    <th className="p-2">Email</th>
                                    <th className="p-2">Country</th>
                                    <th className="p-2">Website</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.map((contact) => (
                                    <tr key={contact.id} className="border-t border-gray-700">
                                        <td className="p-2">{contact.labelName}</td>
                                        <td className="p-2">{contact.name}</td>
                                        <td className="p-2">{contact.email}</td>
                                        <td className="p-2">{contact.country || '—'}</td>
                                        <td className="p-2 break-all">{contact.website || contact.submissionUrl || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">Cancel</button>
                    <button type="button" onClick={() => { onSave(preview); onClose(); }} disabled={!preview.length} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:bg-gray-600 disabled:cursor-not-allowed">Save Imported Contacts</button>
                </div>
            </div>
        </div>
    );
};

export const LabelReachout: React.FC<LabelReachoutProps> = ({ bands, labelContacts: allSavedLabels, setLabelContacts: setSavedLabels, activeBandId, saveSearchResults, getSearchResults }) => {
  const savedLabels = useMemo(() => allSavedLabels.filter(l => l.bandId === activeBandId), [allSavedLabels, activeBandId]);
  const bandProfile = useMemo(() => bands.find(b => b.id === activeBandId) || bands[0], [bands, activeBandId]);
  
  const [editingLabel, setEditingLabel] = useState<LabelContact | null>(null);
  const [contactForEmail, setContactForEmail] = useState<PressContact | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showTip, setShowTip] = useState(true);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveLabel = (label: LabelContact) => {
    const exists = allSavedLabels.some(l => l.id === label.id);
    if(exists) {
        setSavedLabels(prev => prev.map(l => l.id === label.id ? label : l));
    } else {
        setSavedLabels(prev => [label, ...prev]);
    }
    setEditingLabel(null);
  };

  const handleAddFoundLabel = (foundLabel: LabelOpportunity, query: string) => {
      if (foundLabel.email && savedLabels.some(l => l.email === foundLabel.email)) {
          showNotification('Label with this email already exists.');
          return;
      }
      const label: LabelContact = {
          id: Date.now().toString(),
          name: foundLabel.contactName,
          labelName: foundLabel.labelName,
          email: foundLabel.email,
          country: foundLabel.country,
          city: foundLabel.city,
          submissionUrl: foundLabel.url,
          website: foundLabel.website || foundLabel.url,
          socials: foundLabel.socials,
          notes: `Found via AI research for: "${query}"`,
          source: 'search',
          lastVerifiedAt: new Date().toISOString(),
          bandId: activeBandId,
      };
      setSavedLabels(prev => [label, ...prev]);
      showNotification(`${label.labelName} saved to your list!`);
  };

  const handleBulkImport = (contacts: LabelContact[]) => {
    const deduped = contacts.filter((contact) => contact.email && contact.email.includes('@'));
    if (!deduped.length) {
      showNotification('No valid label contacts were ready to save.');
      return;
    }

    setSavedLabels((prev) => {
      const next = [...prev];
      deduped.forEach((contact) => {
        const index = next.findIndex((existing) => existing.email.toLowerCase() === contact.email.toLowerCase() || (existing.labelName === contact.labelName && existing.name === contact.name));
        if (index >= 0) {
          next[index] = { ...next[index], ...contact, bandId: activeBandId };
        } else {
          next.unshift({ ...contact, bandId: activeBandId });
        }
      });
      return next;
    });

    showNotification(`${deduped.length} label contacts saved to your database.`);
  };
  
  const deleteLabel = (id: string) => setSavedLabels(prev => prev.filter(l => l.id !== id));
  
  const handlePitch = (label: LabelContact) => {
    const contact: PressContact = {
        id: label.id,
        name: label.name,
        outlet: label.labelName,
        email: label.email,
        tier: ContactTier.A,
        bandId: label.bandId,
    };
    setContactForEmail(contact);
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold flex items-center gap-3"><BuildingIcon className="w-8 h-8"/> Label Reachout</h1>
            <div className="flex items-center gap-3">
                <button onClick={() => setShowBulkImport(true)} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
                    <UploadCloudIcon className="h-5 w-5 mr-2"/>Upload CSV/TXT
                </button>
                <button onClick={() => setEditingLabel({} as LabelContact)} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">
                    <PlusIcon className="h-5 w-5 mr-2"/>Add Label Manually
                </button>
            </div>
        </div>
        
        {notification && (
            <div className="fixed top-5 right-5 z-50 p-4 text-sm rounded-lg shadow-lg bg-green-800 text-green-200">
                {notification}
            </div>
        )}

        {showTip && (
          <Tip onDismiss={() => setShowTip(false)}>Use the AI-powered finder to discover record labels that fit your genre and size. You can also upload a CSV or paste a list to populate the database in one step.</Tip>
        )}

        <LabelFinder onAddLabel={handleAddFoundLabel} savedLabels={savedLabels} activeBandId={activeBandId} saveSearchResults={saveSearchResults} getSearchResults={getSearchResults} />

        <div className="bg-gray-800 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold p-4">My Label Database ({savedLabels.length})</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-700/50">
                        <tr className="border-b border-gray-700">
                            <th className="p-3 text-sm font-semibold text-gray-300">Label</th>
                            <th className="p-3 text-sm font-semibold text-gray-300">Contact</th>
                            <th className="p-3 text-sm font-semibold text-gray-300">Email</th>
                            <th className="p-3 text-sm font-semibold text-gray-300">Location</th>
                            <th className="p-3 text-right text-sm font-semibold text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {savedLabels.map(label => (
                            <tr key={label.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                                <td className="p-3 font-semibold">{label.labelName}</td>
                                <td className="p-3 text-gray-300">{label.name}</td>
                                <td className="p-3 text-gray-300">{label.email}</td>
                                <td className="p-3 text-gray-300">{label.city || label.country ? `${label.city || ''}${label.city && label.country ? ', ' : ''}${label.country || ''}` : '—'}</td>
                                <td className="p-3 text-right flex gap-2 justify-end">
                                    <a href={label.submissionUrl || label.website || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded-md text-sm"><ExternalLinkIcon className="w-4 h-4 mr-1"/>Website</a>
                                    <button onClick={() => handlePitch(label)} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-md text-sm"><BotIcon className="w-4 h-4 mr-1"/>AI Pitch</button>
                                    <button onClick={() => setEditingLabel(label)} className="p-1 rounded-full hover:bg-gray-600"><EditIcon className="w-5 h-5 text-gray-400"/></button>
                                    <button onClick={() => deleteLabel(label.id)} className="p-1 rounded-full hover:bg-gray-600"><TrashIcon className="w-5 h-5 text-red-500"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {savedLabels.length === 0 && <p className="text-center text-gray-500 py-8">No labels saved yet.</p>}
        </div>

        {contactForEmail && <AiEmailModal contact={contactForEmail} onClose={() => setContactForEmail(null)} bandProfile={bandProfile} />}
        {editingLabel && <LabelContactModal label={editingLabel} onClose={() => setEditingLabel(null)} onSave={handleSaveLabel} activeBandId={activeBandId} />}
        <BulkLabelImportModal open={showBulkImport} bandId={activeBandId} onClose={() => setShowBulkImport(false)} onSave={handleBulkImport} />
    </div>
  );
};

const LabelContactModal: React.FC<{label: LabelContact, onClose: () => void, onSave: (label: LabelContact) => void, activeBandId: string}> = ({ label, onClose, onSave, activeBandId }) => {
    const [data, setData] = useState(label);
    const isNew = !label.id;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...data, id: data.id || Date.now().toString(), bandId: activeBandId, name: data.name || 'A&R Team', lastVerifiedAt: data.lastVerifiedAt || new Date().toISOString(), source: data.source || 'manual' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{isNew ? 'Add Label Contact' : 'Edit Label Contact'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Label Name" value={data.labelName || ''} onChange={e => setData({...data, labelName: e.target.value})} className="bg-gray-700 p-2 rounded" required />
                        <input type="email" placeholder="Contact Email" value={data.email || ''} onChange={e => setData({...data, email: e.target.value})} className="bg-gray-700 p-2 rounded" required />
                        <input type="text" placeholder="Contact Person" value={data.name || ''} onChange={e => setData({...data, name: e.target.value})} className="bg-gray-700 p-2 rounded" />
                        <input type="text" placeholder="Role" value={data.role || ''} onChange={e => setData({...data, role: e.target.value})} className="bg-gray-700 p-2 rounded" />
                        <input type="text" placeholder="Country" value={data.country || ''} onChange={e => setData({...data, country: e.target.value})} className="bg-gray-700 p-2 rounded" />
                        <input type="text" placeholder="City" value={data.city || ''} onChange={e => setData({...data, city: e.target.value})} className="bg-gray-700 p-2 rounded" />
                        <input type="url" placeholder="Website" value={data.website || data.submissionUrl || ''} onChange={e => setData({...data, website: e.target.value, submissionUrl: e.target.value})} className="bg-gray-700 p-2 rounded col-span-2" />
                    </div>
                    <textarea value={data.notes || ''} onChange={e => setData({...data, notes: e.target.value})} placeholder="Notes / tags / relationship info" className="w-full bg-gray-700 p-2 rounded" rows={3}></textarea>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">Cancel</button>
                        <button type="submit" className="bg-spotify-green hover:bg-green-500 px-4 py-2 rounded">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


import React, { useState, useMemo } from 'react';
import { findResidencies } from '../services/geminiService';
import type { ResidencyOpportunity, SavedResidency, CalendarEvent, User } from '../types';
import { EventType } from '../types';
import { SearchIcon, ExternalLinkIcon, SaveIcon, TrashIcon, PlusIcon, CalendarIcon, HomeIcon } from './icons';
import { Tip } from './Tip';

const ResidencyCard: React.FC<{ 
    residency: ResidencyOpportunity, 
    onSave: () => void, 
    isSaved: boolean, 
    onAddToCalendar: () => void 
}> = ({ residency, onSave, isSaved, onAddToCalendar }) => {
    
    // Determine badge color based on costType
    let costBadgeClass = "bg-gray-700 text-gray-300";
    if (residency.costType === 'Paid/Stipend') costBadgeClass = "bg-green-600/30 text-green-300 border border-green-600/50";
    else if (residency.costType === 'Free') costBadgeClass = "bg-blue-600/30 text-blue-300 border border-blue-600/50";
    else if (residency.costType === 'Fee Required') costBadgeClass = "bg-yellow-600/30 text-yellow-300 border border-yellow-600/50";

    return (
        <div className="bg-brand-bg-card p-5 rounded-lg shadow-md border-l-4 border-brand-accent transition-transform hover:scale-[1.02] duration-300 flex flex-col justify-between h-full">
            <div>
                <h3 className="text-xl font-medium text-white">{residency.name}</h3>
                <p className="text-sm text-gray-400 mb-2">{residency.location}</p>
                <p className="text-gray-300 my-2 text-sm line-clamp-3">{residency.description}</p>
                
                <div className="flex flex-wrap gap-2 my-3">
                    <span className={`text-xs font-medium rounded-full px-2 py-1 ${costBadgeClass}`}>
                        {residency.costType}
                    </span>
                    {residency.discipline && (
                        <span className="text-xs font-medium bg-purple-600/30 text-purple-300 border border-purple-600/50 rounded-full px-2 py-1">
                            {residency.discipline}
                        </span>
                    )}
                    {residency.deadline && (
                        <span className="text-xs font-medium bg-gray-700 text-gray-300 rounded-full px-2 py-1">
                            Deadline: {residency.deadline}
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-brand-border">
                <a
                    href={residency.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-blue-400 hover:underline"
                >
                    Visit Website <ExternalLinkIcon className="h-3 w-3 ml-1" />
                </a>
                <div className="flex gap-2">
                    <button 
                        onClick={onAddToCalendar} 
                        className="p-1.5 bg-brand-bg-content hover:bg-gray-700 text-white rounded-md"
                        title="Add Deadline to Calendar"
                    >
                        <CalendarIcon className="w-4 h-4"/>
                    </button>
                    <button 
                        onClick={onSave} 
                        disabled={isSaved} 
                        className={`flex items-center text-xs font-bold py-1.5 px-3 rounded-md transition-colors ${isSaved ? 'bg-green-600 text-white cursor-default' : 'bg-brand-accent hover:bg-brand-accent-dark text-white'}`}
                    >
                        {isSaved ? 'Saved' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ResidencyModal: React.FC<{
    onClose: () => void;
    onSave: (res: Omit<SavedResidency, 'id' | 'bandId'>) => void;
}> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [deadline, setDeadline] = useState('');
    const [costType, setCostType] = useState<ResidencyOpportunity['costType']>('Unknown');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        onSave({ name, location, description, url, deadline, costType, discipline: 'Music' });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-brand-bg-card p-6 rounded-xl shadow-lg w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4">Add Residency Manually</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Residency Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg" required />
                    <input type="text" placeholder="Location (City, Country)" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg" />
                    <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-brand-bg-content p-3 rounded-lg" />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Deadline (YYYY-MM-DD)" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg" />
                        <select value={costType} onChange={e => setCostType(e.target.value as any)} className="w-full bg-brand-bg-content p-3 rounded-lg">
                            <option value="Unknown">Unknown Cost</option>
                            <option value="Paid/Stipend">Paid/Stipend</option>
                            <option value="Free">Free</option>
                            <option value="Fee Required">Fee Required</option>
                        </select>
                    </div>
                    <input type="url" placeholder="Website URL" value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg" />
                    
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-brand-accent hover:bg-brand-accent-dark text-white font-bold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ResidenciesProps {
    users: User[]; 
    activeBandId: string;
    events: CalendarEvent[];
    setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
    savedResidencies: SavedResidency[];
    setSavedResidencies: React.Dispatch<React.SetStateAction<SavedResidency[]>>;
}

export const Residencies: React.FC<ResidenciesProps> = ({ users, activeBandId, events, setEvents, savedResidencies: allSaved, setSavedResidencies }) => {
    const [discipline, setDiscipline] = useState('Music Composition');
    const [locationQuery, setLocationQuery] = useState('');
    const [costPreference, setCostPreference] = useState('all');
    const [results, setResults] = useState<ResidencyOpportunity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
    const [notification, setNotification] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const savedResidencies = useMemo(() => allSaved.filter(r => r.bandId === activeBandId), [allSaved, activeBandId]);

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 4000);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setResults([]);
        
        const taskId = `task-residencies-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Finding residencies...', estimatedDuration: 40 } }));

        try {
            const resResults = await findResidencies(discipline, locationQuery, costPreference, savedResidencies);
            setResults(resResults);
        } finally {
            setIsLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    const handleLoadMore = async () => {
        setIsLoadMoreLoading(true);
        const taskId = `task-residencies-more-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Finding more residencies...', estimatedDuration: 30 } }));
        
        try {
            const newResidencies = await findResidencies(discipline, locationQuery, costPreference, [...savedResidencies, ...results]);
            setResults(prev => [...prev, ...newResidencies]);
        } finally {
            setIsLoadMoreLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    const handleSaveResidency = (res: ResidencyOpportunity) => {
        if (savedResidencies.some(s => s.name === res.name)) {
            showNotification('Already saved.');
            return;
        }
        const newRes: SavedResidency = {
            id: `res-${Date.now()}`,
            bandId: activeBandId,
            ...res
        };
        setSavedResidencies(prev => [newRes, ...prev]);
        showNotification(`${res.name} saved!`);
    };

    const handleDeleteSaved = (id: string) => {
        setSavedResidencies(prev => prev.filter(r => r.id !== id));
    };

    const handleAddToCalendar = (res: ResidencyOpportunity) => {
        const deadlineStr = res.deadline;
        if (!deadlineStr || deadlineStr.toLowerCase() === 'ongoing') {
            showNotification('Ongoing deadline. Cannot add specific date to calendar.');
            return;
        }
        
        const deadline = new Date(deadlineStr);
        if (isNaN(deadline.getTime())) {
            showNotification('Invalid deadline date format.');
            return;
        }

        const reminders = [
            { offset: 42, title: `Prepare application for ${res.name}` }, // 6 weeks
            { offset: 14, title: `Finalize materials for ${res.name}` }, // 2 weeks
            { offset: 7, title: `Submit application for ${res.name}` }, // 1 week
        ];

        const newEvents: CalendarEvent[] = reminders.map(r => {
            const d = new Date(deadline);
            d.setDate(d.getDate() - r.offset);
            return {
                id: `res-cal-${res.name.replace(/\s/g,'')}-${r.offset}-${Date.now()}`,
                title: r.title,
                date: d.toISOString(),
                type: EventType.Deadline,
                notes: `Residency: ${res.name}. Location: ${res.location}. URL: ${res.url}`,
                attendeeIds: [],
                bandId: activeBandId
            };
        });

        // Add actual deadline
        newEvents.push({
            id: `res-deadline-${res.name.replace(/\s/g,'')}-${Date.now()}`,
            title: `DEADLINE: ${res.name} Residency`,
            date: deadline.toISOString(),
            type: EventType.FundingDeadline, // Reusing similar color scheme
            notes: `Submission deadline today! ${res.url}`,
            attendeeIds: [],
            bandId: activeBandId
        });

        setEvents(prev => [...prev, ...newEvents]);
        showNotification(`Added deadline & reminders for ${res.name}`);
    };

    return (
        <div>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-medium tracking-wider uppercase mb-6 flex items-center gap-3">
                    <HomeIcon className="w-8 h-8 text-brand-accent"/> Artistic Residencies
                </h1>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-brand-accent hover:bg-brand-accent-dark text-white font-bold py-2 px-4 rounded-lg -mt-6">
                    <PlusIcon className="h-5 w-5 mr-2" /> Add Manually
                </button>
            </div>

            <Tip onDismiss={() => {}}>
                Residencies are a great way to focus on creative work. Use the "Financial Model" filter to find opportunities that pay you (Stipend) vs those that are just free to attend.
            </Tip>

            {/* Search Section */}
            <div className="bg-brand-bg-card p-6 rounded-xl shadow-lg mb-8">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-normal text-gray-300 mb-2 block">Focus / Discipline</label>
                            <input 
                                type="text" 
                                value={discipline} 
                                onChange={e => setDiscipline(e.target.value)} 
                                className="w-full bg-brand-bg-content text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-normal text-gray-300 mb-2 block">Location (Optional)</label>
                            <input 
                                type="text" 
                                value={locationQuery} 
                                onChange={e => setLocationQuery(e.target.value)} 
                                placeholder="e.g. Europe, USA, Remote"
                                className="w-full bg-brand-bg-content text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-normal text-gray-300 mb-2 block">Financial Model</label>
                            <select 
                                value={costPreference} 
                                onChange={e => setCostPreference(e.target.value)} 
                                className="w-full bg-brand-bg-content text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            >
                                <option value="all">Any</option>
                                <option value="Paid/Stipend">Paid / Stipend Provided</option>
                                <option value="Free">Free (No Fee)</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={isLoading} className="flex items-center bg-brand-accent hover:bg-brand-accent-dark text-white font-medium py-3 px-6 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed">
                            <SearchIcon className="h-5 w-5 mr-2"/>
                            {isLoading ? 'Searching...' : 'Find Residencies'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Results */}
            {results.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-xl font-bold mb-4">Search Results</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map((res, i) => (
                            <ResidencyCard 
                                key={i} 
                                residency={res} 
                                onSave={() => handleSaveResidency(res)} 
                                isSaved={savedResidencies.some(s => s.name === res.name)} 
                                onAddToCalendar={() => handleAddToCalendar(res)}
                            />
                        ))}
                    </div>
                    {!isLoading && (
                        <div className="mt-8 text-center">
                            <button onClick={handleLoadMore} disabled={isLoadMoreLoading} className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg disabled:bg-gray-600">
                                {isLoadMoreLoading ? 'Loading...' : 'Load More Results'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Saved Residencies */}
            <div className="bg-brand-bg-card p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold mb-4">My Saved Residencies ({savedResidencies.length})</h2>
                <div className="space-y-3">
                    {savedResidencies.map(res => (
                        <div key={res.id} className="bg-brand-bg-content p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-lg">{res.name}</h4>
                                <p className="text-sm text-gray-400">{res.location} • <span className={res.costType === 'Paid/Stipend' ? 'text-green-400' : res.costType === 'Free' ? 'text-blue-400' : 'text-gray-400'}>{res.costType}</span></p>
                                <p className="text-xs text-yellow-500 mt-1">Deadline: {res.deadline}</p>
                            </div>
                            <div className="flex gap-2">
                                <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full" title="Visit Website"><ExternalLinkIcon className="w-4 h-4"/></a>
                                <button onClick={() => handleAddToCalendar(res)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full" title="Add to Calendar"><CalendarIcon className="w-4 h-4"/></button>
                                <button onClick={() => handleDeleteSaved(res.id)} className="p-2 bg-gray-700 hover:bg-red-900 rounded-full text-red-400" title="Remove"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                    {savedResidencies.length === 0 && <p className="text-center text-gray-500 py-4">No residencies saved yet.</p>}
                </div>
            </div>

            {notification && (
                <div className="fixed bottom-10 right-10 bg-brand-accent text-white py-2 px-5 rounded-lg shadow-lg z-50">
                    {notification}
                </div>
            )}

            {isModalOpen && <ResidencyModal onClose={() => setIsModalOpen(false)} onSave={(res) => {
                handleSaveResidency({ ...res, costType: res.costType as any });
                setIsModalOpen(false);
            }} />}
        </div>
    );
};

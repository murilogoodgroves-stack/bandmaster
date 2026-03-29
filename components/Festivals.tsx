
import React, { useState, useMemo, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { researchFestivals, getEuropeanIndieFestivals } from '../services/aiService';
import type { Festival, FestivalOpportunity, CalendarEvent, FestivalDirectoryEntry, User } from '../types';
import { EventType } from '../types';
import { SearchIcon, ExternalLinkIcon, PlusIcon, TrashIcon, SaveIcon, CalendarIcon, CheckCircleIcon, BotIcon, RefreshCwIcon } from './icons';
import { Tip } from './Tip';

const FestivalCard: React.FC<{ 
    festival: FestivalOpportunity; 
    onAddToCalendar: (festival: FestivalOpportunity) => void; 
    onSaveFestival: (festival: FestivalOpportunity) => void;
    isSaved: boolean;
}> = ({ festival, onAddToCalendar, onSaveFestival, isSaved }) => (
  <div className="bg-brand-bg-card p-5 rounded-lg shadow-md border-l-4 border-brand-accent transition-transform hover:scale-[1.02] duration-300 flex flex-col justify-between">
    <div>
      <h3 className="text-xl font-medium text-white">{festival.name}</h3>
      <p className="text-sm text-gray-400 mb-2">{festival.country}</p>
      <p className="text-gray-300 my-2 text-sm">{festival.description}</p>
      <div className="my-3">
        <p className="text-xs font-medium bg-gray-700 text-gray-300 rounded-full px-2 py-1 inline-block mr-2">
            Genre: {festival.genre}
        </p>
        <p className="text-xs font-medium bg-yellow-500/20 text-yellow-300 rounded-full px-2 py-1 inline-block">
            Deadline: {festival.deadline}
        </p>
      </div>
    </div>
    <div className="flex items-center justify-between mt-4">
      <a
        href={festival.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm font-medium text-brand-accent hover:text-rose-500"
        aria-label={`Learn more about ${festival.name}`}
      >
        Visit Website
        <ExternalLinkIcon className="h-4 w-4 ml-1.5" />
      </a>
       <div className="flex items-center gap-2">
        <button
            onClick={() => onAddToCalendar(festival)}
            className="inline-flex items-center text-sm font-medium bg-brand-accent hover:bg-brand-accent-dark text-white py-1.5 px-3 rounded-lg"
        >
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Calendar
        </button>
        <button
            onClick={() => onSaveFestival(festival)}
            disabled={isSaved}
            className="inline-flex items-center text-sm font-medium bg-gray-600 hover:bg-gray-500 text-white py-1.5 px-3 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
            <SaveIcon className="h-4 w-4 mr-1.5" />
            {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  </div>
);

const FestivalModal: React.FC<{
    onClose: () => void;
    onSave: (festival: Omit<Festival, 'id' | 'bandId'>) => void;
}> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [country, setCountry] = useState('');
    const [submissionDeadline, setSubmissionDeadline] = useState('');
    const [url, setUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !url) return;
        onSave({ name, country, submissionOpenDate: '', submissionDeadline, url });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-brand-bg-card p-6 rounded-xl shadow-lg w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4">Add Festival</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Festival Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg" required />
                    <input type="text" placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg" />
                    <input type="text" placeholder="Submission Deadline (e.g., YYYY-MM-DD or 'See Website')" value={submissionDeadline} onChange={e => setSubmissionDeadline(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg" />
                    <input type="url" placeholder="Website URL" value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg" required />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg">Save Festival</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const Festivals: React.FC<{ 
    users: User[], 
    activeBandId: string,
    events: CalendarEvent[],
    setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>,
    savedFestivals: Festival[],
    setSavedFestivals: React.Dispatch<React.SetStateAction<Festival[]>>
}> = ({ users, activeBandId, events, setEvents, savedFestivals: allSavedFestivals, setSavedFestivals }) => {
    const [genreQuery, setGenreQuery] = useState('');
    const [locationQuery, setLocationQuery] = useState('');
    const [deadlineWindow, setDeadlineWindow] = useState('anytime');
    const [results, setResults] = useState<FestivalOpportunity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [showTip, setShowTip] = useState(true);
    const [notification, setNotification] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const savedFestivals = useMemo(() => allSavedFestivals.filter(f => f.bandId === activeBandId), [allSavedFestivals, activeBandId]);
    
    const [savedFestivalsFilter, setSavedFestivalsFilter] = useState('');
    
    // State for the new directory
    const [directoryFestivals, setDirectoryFestivals] = useLocalStorage<{ data: FestivalDirectoryEntry[], timestamp: number }>('festivalDirectoryCache', { data: [], timestamp: 0 });
    const [isDirectoryLoading, setIsDirectoryLoading] = useState(false);
    const [monthFilter, setMonthFilter] = useState<number | 'all'>('all');


    const fetchDirectory = async () => {
        const now = Date.now();
        setIsDirectoryLoading(true);
        const taskId = `task-fest-dir-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Updating festival directory...', estimatedDuration: 45 } }));
        try {
            const festivals = await getEuropeanIndieFestivals();
            setDirectoryFestivals({ data: festivals, timestamp: now });
        } catch (error) {
            console.error("Failed to fetch festival directory:", error);
        } finally {
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
            setIsDirectoryLoading(false);
        }
    };

    useEffect(() => {
        // Initial load from cache is already handled by useLocalStorage default value
        // We don't want to auto-fetch anymore to save tokens
    }, []);

    const filteredDirectory = useMemo(() => {
        if (monthFilter === 'all') return directoryFestivals.data;
        return directoryFestivals.data.filter(f => f.typicalMonth === monthFilter);
    }, [directoryFestivals.data, monthFilter]);

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 4000);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!genreQuery.trim()) return;

        setIsLoading(true);
        setHasSearched(true);
        setResults([]);
        
        const taskId = `task-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Finding festivals...', estimatedDuration: 40 } }));

        try {
            const festivalResults = await researchFestivals(genreQuery, locationQuery, deadlineWindow);
            setResults(festivalResults);
        } finally {
            setIsLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    const handleLoadMore = async () => {
        if (!genreQuery.trim()) return;
        setIsLoadMoreLoading(true);

        const taskId = `task-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Finding more festivals...', estimatedDuration: 30 } }));
        
        try {
            const newFestivals = await researchFestivals(genreQuery, locationQuery, deadlineWindow, results);
            setResults(prev => [...prev, ...newFestivals]);
        } finally {
            setIsLoadMoreLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    const handleAddToCalendar = (festival: FestivalOpportunity) => {
        const deadlineDate = new Date(festival.deadline);
        if (isNaN(deadlineDate.getTime())) {
            showNotification(`Could not add '${festival.name}' to calendar: The deadline "${festival.deadline}" is not a specific date.`);
            return;
        }

        const deadlineEvent: CalendarEvent = {
            id: `festival-deadline-${festival.name.replace(/\s/g, '')}-${Date.now()}`,
            title: `Submission Deadline: ${festival.name}`,
            date: deadlineDate.toISOString(),
            type: EventType.Deadline,
            notes: `Don't miss the deadline for ${festival.name}! Apply here: ${festival.url}`,
            attendeeIds: users.map(u => u.id),
            bandId: activeBandId,
        };
        
        setEvents(prev => [...prev.filter(e => e.title !== deadlineEvent.title), deadlineEvent]);
        showNotification(`'${festival.name}' deadline added to your calendar!`);
    };

    const savedFestivalNames = useMemo(() => new Set(savedFestivals.map(f => `${f.name}-${f.country}`)), [savedFestivals]);

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handleTrackDirectoryEntry = (festival: FestivalDirectoryEntry) => {
        // 1. Add to Calendar
        const now = new Date();
        const currentMonth = now.getMonth(); // 0-11
        const currentYear = now.getFullYear();
        
        // Try to find the next occurrence of the festival
        let festivalYear = currentYear;
        // If the typical month has passed this year (e.g. now is Aug(7), festival is Feb(1)), it's next year.
        // typicalMonth is 1-12.
        if ((festival.typicalMonth - 1) < currentMonth) {
            festivalYear += 1;
        }
        
        const festivalDate = new Date(festivalYear, festival.typicalMonth - 1, 1); // 1st of festival month
        
        // Set reminder for 5 months prior
        const reminderDate = new Date(festivalDate);
        reminderDate.setMonth(reminderDate.getMonth() - 5); 
        
        // Adjust logic: if we missed the 5-month reminder window but are still before the festival
        if (reminderDate < now) {
             if (now < festivalDate) {
                 // Urgent reminder: set for today
                 reminderDate.setTime(now.getTime());
             } else {
                 // Should ideally not happen given the year logic above, but safe fallback to next year's cycle
                 const nextFestivalDate = new Date(festivalYear + 1, festival.typicalMonth - 1, 1);
                 reminderDate.setTime(nextFestivalDate.getTime());
                 reminderDate.setMonth(reminderDate.getMonth() - 5);
             }
        }
    
        const newEvent: CalendarEvent = {
            id: `fest-dir-cal-${festival.name.replace(/\s/g, '')}-${Date.now()}`,
            title: `Apply to ${festival.name}`,
            date: reminderDate.toISOString(),
            type: EventType.Deadline,
            notes: `The festival is typically held in ${months[festival.typicalMonth - 1]}. Check their website for exact submission dates: ${festival.url}`,
            attendeeIds: users.map(u => u.id),
            bandId: activeBandId,
        };
    
        setEvents(prev => [...prev, newEvent]);

        // 2. Add to Saved Festivals
        const festivalKey = `${festival.name}-${festival.country}`;
        if (!savedFestivalNames.has(festivalKey)) {
             const newFestival: Festival = {
                id: `fest-dir-${Date.now()}`,
                name: festival.name,
                country: festival.country,
                submissionOpenDate: '',
                submissionDeadline: 'See Website',
                url: festival.url,
                bandId: activeBandId,
            };
            setSavedFestivals(prev => [newFestival, ...prev]);
            showNotification(`Added ${festival.name} to calendar & saved festivals!`);
        } else {
            showNotification(`Reminder added for ${festival.name}!`);
        }
    };

    const handleSaveFestival = (festival: FestivalOpportunity) => {
        const festivalKey = `${festival.name}-${festival.country}`;
        const savedFestivalKeys = new Set(savedFestivals.map(f => `${f.name}-${f.country}`));

        if (savedFestivalKeys.has(festivalKey)) {
            showNotification(`${festival.name} is already in your database.`);
            return;
        }

        const newFestival: Festival = {
            id: `fest-${Date.now()}`,
            name: festival.name,
            country: festival.country,
            submissionOpenDate: '', // Not provided by search API
            submissionDeadline: festival.deadline,
            url: festival.url,
            bandId: activeBandId,
        };

        setSavedFestivals(prev => [newFestival, ...prev]);
        showNotification(`${festival.name} saved to your database!`);
    };
    
    const handleSaveManualFestival = (festivalData: Omit<Festival, 'id' | 'bandId'>) => {
        const newFestival: Festival = {
            id: `fest-manual-${Date.now()}`,
            bandId: activeBandId,
            ...festivalData,
        };
        setSavedFestivals(prev => [newFestival, ...prev]);
        showNotification(`${festivalData.name} saved!`);
    };

    const handleDeleteSavedFestival = (id: string) => {
        setSavedFestivals(prev => prev.filter(f => f.id !== id));
    };
    
    const filteredSavedFestivals = useMemo(() => {
        if (!savedFestivalsFilter) return savedFestivals;
        return savedFestivals.filter(f => 
            f.name.toLowerCase().includes(savedFestivalsFilter.toLowerCase()) ||
            f.country.toLowerCase().includes(savedFestivalsFilter.toLowerCase())
        );
    }, [savedFestivals, savedFestivalsFilter]);

    const isDeadlineExpired = (deadline: string) => {
        if (!deadline || deadline.toLowerCase().includes('see website') || deadline.toLowerCase().includes('ongoing')) return false;
        const parsed = Date.parse(deadline);
        if (isNaN(parsed)) return false;
        return new Date(parsed) < new Date();
    };

    return (
        <div>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-medium tracking-wider uppercase mb-6">Festival Opportunities</h1>
                 <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg -mt-6">
                    <PlusIcon className="h-5 w-5 mr-2" /> Add Manually
                </button>
            </div>
            
            {showTip && (
                <Tip onDismiss={() => setShowTip(false)}>
                    Save festivals to your personal database to track them over time. The dashboard will now proactively notify you when it's a good time to apply to these festivals.
                </Tip>
            )}

            {/* AI Search for open submissions */}
            <div className="bg-brand-bg-card p-6 rounded-xl shadow-lg mb-8">
                <form onSubmit={handleSearch} className="space-y-4">
                    <h3 className="text-xl font-medium text-white">Search for Festivals with Open Submissions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="festival-genres" className="text-sm font-normal text-gray-300 mb-2 block">
                                Genres
                            </label>
                            <input
                                id="festival-genres"
                                type="text"
                                value={genreQuery}
                                onChange={(e) => setGenreQuery(e.target.value)}
                                placeholder="e.g., indie rock, dream pop"
                                className="w-full bg-brand-bg-content text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="festival-location" className="text-sm font-normal text-gray-300 mb-2 block">
                                Location (Optional)
                            </label>
                            <input
                                id="festival-location"
                                type="text"
                                value={locationQuery}
                                onChange={(e) => setLocationQuery(e.target.value)}
                                placeholder="e.g., UK, Germany, Europe"
                                className="w-full bg-brand-bg-content text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            />
                        </div>
                        <div>
                             <label htmlFor="festival-deadline" className="text-sm font-normal text-gray-300 mb-2 block">
                                Submission Window
                            </label>
                            <select
                                id="festival-deadline"
                                value={deadlineWindow}
                                onChange={e => setDeadlineWindow(e.target.value)}
                                className="w-full bg-brand-bg-content text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            >
                                <option value="anytime">Anytime</option>
                                <option value="30days">Next 30 days</option>
                                <option value="3months">Next 3 months</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading || !genreQuery.trim()}
                            className="flex items-center bg-brand-accent hover:bg-brand-accent-dark text-white font-medium py-3 px-5 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            <SearchIcon className="h-5 w-5 mr-2" />
                            {isLoading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Search Results */}
            <div>
                {isLoading && <div className="text-center text-gray-400 py-8"><p>Finding festivals... Check the progress bar at the top of the page.</p></div>}
                {!isLoading && hasSearched && results.length === 0 && <div className="text-center text-gray-500 py-8"><p>No open festival submissions found. Try a different filter.</p></div>}
                {results.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map((item, index) => {
                             const isSaved = savedFestivalNames.has(`${item.name}-${item.country}`);
                             return <FestivalCard key={index} festival={item} onAddToCalendar={handleAddToCalendar} onSaveFestival={handleSaveFestival} isSaved={isSaved} />;
                        })}
                    </div>
                     {!isLoading && results.length > 0 && (
                        <div className="mt-8 text-center"><button onClick={handleLoadMore} disabled={isLoadMoreLoading} className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg disabled:bg-gray-600"> {isLoadMoreLoading ? 'Searching...' : 'Load More'} </button> </div>
                    )}
                  </>
                )}
            </div>
            
            <div className="my-8 border-t-2 border-dashed border-brand-border"></div>

            {/* My Saved Festivals */}
            <div className="bg-brand-bg-card p-6 rounded-xl shadow-lg mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-medium text-white">My Saved Festivals ({savedFestivals.length})</h3>
                    <div className="relative w-1/3">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="text" placeholder="Filter by name or country..." value={savedFestivalsFilter} onChange={e => setSavedFestivalsFilter(e.target.value)} className="w-full bg-brand-bg-content p-2 pl-10 rounded-lg text-sm"/>
                    </div>
                </div>
                 <div className="max-h-[500px] overflow-y-auto pr-2">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-brand-bg-card">
                            <tr className="border-b border-brand-border">
                                <th className="p-2 font-normal text-gray-400 uppercase tracking-wider">Name</th><th className="p-2 font-normal text-gray-400 uppercase tracking-wider">Country</th><th className="p-2 font-normal text-gray-400 uppercase tracking-wider">Deadline</th><th className="p-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSavedFestivals.map(festival => (
                                <tr key={festival.id} className="hover:bg-white/5">
                                    <td className="p-2 font-medium">{festival.name}</td>
                                    <td className="p-2">{festival.country}</td>
                                    <td className="p-2 text-yellow-300">
                                        {festival.submissionDeadline}
                                        {isDeadlineExpired(festival.submissionDeadline) && (
                                            <span className="ml-2 inline-flex items-center text-xs font-semibold text-red-300 bg-red-900/40 px-2 py-1 rounded-full">Expired</span>
                                        )}
                                    </td>
                                    <td className="p-2 text-right">
                                        <a href={festival.url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-600 rounded-full inline-block mr-2" title="Visit Website"><ExternalLinkIcon className="w-4 h-4 text-blue-400"/></a>
                                        <button onClick={() => handleDeleteSavedFestival(festival.id)} className="p-1 hover:bg-gray-600 rounded-full" title="Delete"><TrashIcon className="w-4 h-4 text-red-500"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredSavedFestivals.length === 0 && <p className="text-center text-gray-500 py-8">No saved festivals match your filter.</p>}
                 </div>
            </div>

            <div className="my-8 border-t-2 border-dashed border-brand-border"></div>

            {/* European Indie Festival Directory */}
            <div className="bg-brand-bg-card p-6 rounded-xl shadow-lg mt-8">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-medium text-white flex items-center">
                        <BotIcon className="w-6 h-6 mr-3 text-purple-400" />
                        European Indie Festival Directory
                     </h3>
                     <div className="flex items-center gap-4">
                        <button 
                            onClick={fetchDirectory}
                            disabled={isDirectoryLoading}
                            className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 px-3 rounded-md flex items-center transition-colors disabled:bg-gray-600"
                        >
                            <RefreshCwIcon className={`w-3 h-3 mr-1.5 ${isDirectoryLoading ? 'animate-spin' : ''}`}/> 
                            {isDirectoryLoading ? 'Updating...' : 'Refresh Directory'}
                        </button>
                        <div>
                            <label htmlFor="month-filter" className="text-sm text-gray-400 mr-2">Filter by month:</label>
                            <select id="month-filter" value={monthFilter} onChange={e => setMonthFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-brand-bg-content text-white p-2 rounded-lg text-sm">
                                <option value="all">All Months</option>
                                {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                            </select>
                        </div>
                     </div>
                </div>
                 {isDirectoryLoading ? (
                     <div className="text-center text-gray-400 py-8"><p>AI is populating the festival directory... Check progress at the top.</p></div>
                 ) : filteredDirectory.length > 0 ? (
                     <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
                        {filteredDirectory.map((festival, index) => {
                            const isTracked = savedFestivalNames.has(`${festival.name}-${festival.country}`);
                            return (
                            <div key={index} className="bg-brand-bg-content p-3 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-white">{festival.name} <span className="text-gray-400 font-normal">({festival.country})</span></p>
                                        <p className="text-xs text-purple-300">Typically held in: {months[festival.typicalMonth - 1]}</p>
                                    </div>
                                    <button
                                        onClick={() => handleTrackDirectoryEntry(festival)}
                                        disabled={isTracked}
                                        className={`text-xs font-medium py-1 px-2 rounded flex items-center transition-colors ${isTracked ? 'bg-green-600 text-white cursor-default' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                                        title={isTracked ? "Already tracking" : "Add application reminder to calendar & save"}
                                    >
                                        {isTracked ? <CheckCircleIcon className="w-3 h-3 mr-1" /> : <CalendarIcon className="w-3 h-3 mr-1" />}
                                        {isTracked ? "Tracked" : "Track"}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    Contact: {festival.contactName}
                                    {festival.contactEmail && (
                                        <> - <a href={`mailto:${festival.contactEmail}`} className="text-blue-400 hover:underline">{festival.contactEmail}</a></>
                                    )}
                                    <span className="mx-1">•</span>
                                    <a href={festival.url} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">Website</a>
                                </p>
                            </div>
                        )})}
                     </div>
                 ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-xl">
                        <p className="text-gray-500 italic mb-4">The directory is currently empty.</p>
                        <button 
                            onClick={fetchDirectory}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                            Fetch Festival Directory
                        </button>
                    </div>
                 )}
            </div>

            {notification && (
                <div className="fixed bottom-10 right-10 bg-brand-accent text-white py-2 px-5 rounded-lg shadow-lg">
                    {notification}
                </div>
            )}
            {isModalOpen && <FestivalModal onClose={() => setIsModalOpen(false)} onSave={handleSaveManualFestival} />}
        </div>
    );
};

import React, { useState, useMemo } from 'react';
import { researchFunding } from '../services/aiService';
import type { FundingOpportunity, SavedFundingOpportunity, CalendarEvent } from '../types';
import { EventType } from '../types';
import { initialSavedFundingOpps } from '../data/initialData';
import { SearchIcon, ExternalLinkIcon, SaveIcon, TrashIcon, PlusIcon, CalendarIcon } from './icons';
import { Tip } from './Tip';

const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    // The API returns YYYY-MM-DD. Treat this as a UTC date to avoid timezone shifts.
    const parts = dateString.split('-');
    if (parts.length === 3 && parts.every(p => !isNaN(parseInt(p)))) {
        const [year, month, day] = parts;
        return `${day}.${month}.${year}`;
    }
    return dateString; // Return as-is if not in YYYY-MM-DD format (e.g., "Ongoing")
};

const FundingCard: React.FC<{ funding: FundingOpportunity, onSave: () => void, isSaved: boolean, onAddToCalendar: () => void }> = ({ funding, onSave, isSaved, onAddToCalendar }) => (
  <div className="bg-gray-800 p-5 rounded-lg shadow-md border-l-4 border-purple-500 transition-transform hover:scale-105 duration-300 flex flex-col justify-between">
    <div>
        <h3 className="text-xl font-bold text-white">{funding.name}</h3>
        <p className="text-gray-300 my-2 text-sm">{funding.description}</p>
        {funding.deadline && (
        <p className="text-xs font-semibold bg-yellow-500/20 text-yellow-300 rounded-full px-2 py-1 inline-block mb-3">
            Deadline: {formatDate(funding.deadline)}
        </p>
        )}
    </div>
    <div className="flex justify-between items-center mt-4">
      <a
        href={funding.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm font-semibold text-purple-400 hover:text-purple-300"
        aria-label={`Learn more about ${funding.name}`}
      >
        Visit Website
        <ExternalLinkIcon className="h-4 w-4 ml-1.5" />
      </a>
      <div className="flex items-center gap-2">
        <button onClick={onAddToCalendar} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-3 rounded-md text-sm">
            <CalendarIcon className="w-4 h-4 mr-1.5"/> Calendar
        </button>
        <button onClick={onSave} disabled={isSaved} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md text-sm disabled:bg-gray-500 disabled:cursor-not-allowed">
            <SaveIcon className="w-4 h-4 mr-1.5"/> {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  </div>
);

const FundingModal: React.FC<{
    onClose: () => void;
    onSave: (opp: Omit<SavedFundingOpportunity, 'id' | 'bandId'>) => void;
}> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [deadline, setDeadline] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !url) return;
        onSave({ name, description, url, deadline });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4">Add Funding Opportunity</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Funding Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg" required />
                    <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-gray-700 p-3 rounded-lg" />
                    <input type="url" placeholder="Website URL" value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg" required />
                    <input type="text" placeholder="Deadline (e.g., YYYY-MM-DD or Ongoing)" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg" />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg">Save Opportunity</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface FundingProps {
    activeBandId: string;
    savedFundingOpps: SavedFundingOpportunity[];
    setSavedFundingOpps: React.Dispatch<React.SetStateAction<SavedFundingOpportunity[]>>;
    setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
}

export const Funding: React.FC<FundingProps> = ({ activeBandId, savedFundingOpps: allSavedOpps, setSavedFundingOpps: setSavedOpps, setEvents }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FundingOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [notification, setNotification] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const savedOpps = useMemo(() => allSavedOpps.filter(opp => opp.bandId === activeBandId), [allSavedOpps, activeBandId]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleAddToCalendar = (opp: FundingOpportunity) => {
    const deadlineStr = opp.deadline;
    if (!deadlineStr || deadlineStr.toLowerCase() === 'ongoing') {
        showNotification(`'${opp.name}' has an ongoing deadline and cannot be automatically added to the calendar.`);
        return;
    }

    const deadline = new Date(deadlineStr);
    if (isNaN(deadline.getTime())) {
        showNotification(`Could not parse the deadline for '${opp.name}'. Please add reminders manually.`);
        return;
    }

    const reminders = [
        { offset: 42, title: `Start drafting application for ${opp.name}` },
        { offset: 28, title: `Review first draft for ${opp.name}` },
        { offset: 14, title: `Finalize documents for ${opp.name}` },
        { offset: 3, title: `Final check & submit application for ${opp.name}` },
    ];

    const newEvents: CalendarEvent[] = [];

    reminders.forEach(reminder => {
        const reminderDate = new Date(deadline);
        reminderDate.setUTCDate(reminderDate.getUTCDate() - reminder.offset);
        if (reminderDate > new Date()) { // Only add future reminders
            newEvents.push({
                id: `funding-${opp.name.replace(/\s/g, '')}-${reminder.offset}`,
                title: reminder.title,
                date: reminderDate.toISOString(),
                type: EventType.Deadline,
                notes: `Related to funding opportunity: ${opp.name}. Deadline is on ${deadline.toLocaleDateString()}. URL: ${opp.url}`,
                attendeeIds: [],
                bandId: activeBandId,
            });
        }
    });

    // Add the deadline event itself
    newEvents.push({
        id: `funding-deadline-${opp.name.replace(/\s/g, '')}`,
        title: `DEADLINE: ${opp.name}`,
        date: deadline.toISOString(),
        type: EventType.FundingDeadline,
        notes: `Final submission deadline for ${opp.name}. URL: ${opp.url}`,
        attendeeIds: [],
        bandId: activeBandId,
    });
    
    setEvents(prev => {
        const updatedEvents = [...prev];
        newEvents.forEach(newEvent => {
            const existingIndex = updatedEvents.findIndex(e => e.id === newEvent.id);
            if (existingIndex !== -1) {
                updatedEvents[existingIndex] = newEvent; // Update existing event
            } else {
                updatedEvents.push(newEvent); // Add new event
            }
        });
        return updatedEvents;
    });

    showNotification(`Added ${newEvents.length} reminders for '${opp.name}' to your calendar.`);
};

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setResults([]);

    const taskId = `task-${Date.now()}`;
    window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Researching funding...', estimatedDuration: 30 } }));

    try {
        const fundingResults = await researchFunding(query);
        setResults(fundingResults);
    } finally {
        setIsLoading(false);
        window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
    }
  };

  const handleLoadMore = async () => {
    if (!query.trim()) return;
    setIsLoadMoreLoading(true);

    const taskId = `task-${Date.now()}`;
    window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Finding more funding...', estimatedDuration: 30 } }));

    try {
        const newOpportunities = await researchFunding(query, results);
        setResults(prev => [...prev, ...newOpportunities]);
    } finally {
        setIsLoadMoreLoading(false);
        window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
    }
  };

  const handleSaveOpp = (opp: FundingOpportunity) => {
      if (savedOpps.some(s => s.url === opp.url)) {
          showNotification("This opportunity is already saved.");
          return;
      }
      const newSavedOpp: SavedFundingOpportunity = {
          id: `fund-${Date.now()}`,
          bandId: activeBandId,
          ...opp
      };
      setSavedOpps(prev => [newSavedOpp, ...prev]);
      showNotification(`${opp.name} saved!`);
  };
  
   const handleSaveManualOpp = (oppData: Omit<SavedFundingOpportunity, 'id' | 'bandId'>) => {
        const newSavedOpp: SavedFundingOpportunity = {
            id: `fund-manual-${Date.now()}`,
            bandId: activeBandId,
            ...oppData,
        };
        setSavedOpps(prev => [newSavedOpp, ...prev]);
        showNotification(`${oppData.name} saved!`);
    };

  const handleDeleteSavedOpp = (id: string) => {
      setSavedOpps(prev => prev.filter(s => s.id !== id));
  };
  
  const savedOppUrls = useMemo(() => new Set(savedOpps.map(s => s.url)), [savedOpps]);

  const suggestionQueries = ["album production", "tour support", "music video", "artist development"];

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Funding Research (Germany)</h1>
         <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">
            <PlusIcon className="h-5 w-5 mr-2" /> Add Manually
        </button>
      </div>
      <p className="text-gray-400 mt-2 mb-6">
        Describe what you need funding for, and our AI assistant will search for relevant programs.
      </p>

      {showTip && (
        <Tip onDismiss={() => setShowTip(false)}>
          Be specific with your search! Terms like "album production," "tour support," or "music video grants" will yield the best results from the AI.
        </Tip>
      )}

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
        <form onSubmit={handleSearch}>
          <label htmlFor="funding-query" className="text-lg font-semibold text-white mb-2 block">
            I need funding for...
          </label>
          <div className="flex gap-2 mb-4">
            <input
              id="funding-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., my next EP recording"
              className="flex-1 bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              <SearchIcon className="h-5 w-5 mr-2" />
              {isLoading ? 'Researching...' : 'Search'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-400 mr-2">Suggestions:</span>
            {suggestionQueries.map(suggestion => (
                <button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-gray-300 transition-colors"
                >
                    {suggestion}
                </button>
            ))}
          </div>
        </form>
      </div>

      <div>
        {isLoading && (
          <div className="text-center text-gray-400 py-8">
            <p>Researching funding opportunities... Check the progress bar at the top of the page.</p>
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>No funding opportunities found for that query. Try a different term.</p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((item, index) => (
                <FundingCard key={index} funding={item} onSave={() => handleSaveOpp(item)} isSaved={savedOppUrls.has(item.url)} onAddToCalendar={() => handleAddToCalendar(item)} />
              ))}
            </div>
             {!isLoading && results.length > 0 && (
                <div className="mt-8 text-center">
                    <button 
                        onClick={handleLoadMore} 
                        disabled={isLoadMoreLoading}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoadMoreLoading ? 'Researching...' : 'Load More'}
                    </button>
                </div>
            )}
          </>
        )}
      </div>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg mt-8">
        <h2 className="text-2xl font-bold mb-4">My Saved Opportunities</h2>
        <div className="space-y-3">
            {savedOpps.map(opp => (
                <div key={opp.id} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="font-semibold">{opp.name}</p>
                        <p className="text-xs text-yellow-300">Deadline: {formatDate(opp.deadline)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <a href={opp.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-600 rounded-full"><ExternalLinkIcon className="w-4 h-4 text-blue-400"/></a>
                         <button onClick={() => handleDeleteSavedOpp(opp.id)} className="p-2 hover:bg-gray-600 rounded-full"><TrashIcon className="w-4 h-4 text-red-500"/></button>
                    </div>
                </div>
            ))}
            {savedOpps.length === 0 && <p className="text-center text-gray-500 py-4">No saved opportunities yet. Use the search tool to find and save them!</p>}
        </div>
      </div>

      {notification && (
        <div className="fixed bottom-10 right-10 bg-spotify-green text-white py-2 px-5 rounded-lg shadow-lg">
            {notification}
        </div>
      )}

      {isModalOpen && <FundingModal onClose={() => setIsModalOpen(false)} onSave={handleSaveManualOpp} />}
    </div>
  );
};
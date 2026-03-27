
import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { Tour, Show, Setlist, Venue } from '../types';
import { PlusIcon, TrashIcon, WandIcon, CheckCircleIcon, PlusCircleIcon } from './icons';
import { initialTours, initialSetlists, initialVenues } from '../data/initialData';
import { findTourDatesForArtist, findVenueContactInfo } from '../services/aiService';

type FoundShow = { date: string, city: string, venue: string };

const ImportTourModal: React.FC<{
    onClose: () => void;
    setTours: React.Dispatch<React.SetStateAction<Tour[]>>;
    setVenues: React.Dispatch<React.SetStateAction<Venue[]>>;
    activeBandId: string;
    venues: Venue[];
}> = ({ onClose, setTours, setVenues, activeBandId, venues }) => {
    const [step, setStep] = useState(1);
    const [artistName, setArtistName] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [continent, setContinent] = useState('any');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [foundShows, setFoundShows] = useState<FoundShow[]>([]);
    const [selectedShows, setSelectedShows] = useState<Set<number>>(new Set());

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!artistName.trim() || !year.trim()) return;
        setIsLoading(true);
        setError('');
        const taskId = `task-tour-import-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: `Finding tour dates for ${artistName}...`, estimatedDuration: 60 } }));
        try {
            const results = await findTourDatesForArtist(artistName, year, continent);
            if (results.length === 0) {
                setError(`No tour dates found for ${artistName} in ${year}. Try a different artist or year.`);
            } else {
                setFoundShows(results);
                setSelectedShows(new Set(results.map((_, index) => index)));
                setStep(2);
            }
        } catch (err) {
            setError('An error occurred while searching. Please try again.');
        } finally {
            setIsLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    const enrichAndSaveNewVenues = async (shows: FoundShow[]) => {
        // Scoped check: Only check against venues for the CURRENT band
        const existingVenueKeys = new Set(venues.filter(v => v.bandId === activeBandId).map(v => `${v.name.trim().toLowerCase()}|${v.city.trim().toLowerCase()}`));
        
        const uniqueNewVenues = shows.reduce((acc: {name: string, city: string}[], show) => {
            const venueKey = `${show.venue.trim().toLowerCase()}|${show.city.trim().toLowerCase()}`;
            if (!existingVenueKeys.has(venueKey) && !acc.some(v => v.name.trim().toLowerCase() === show.venue.trim().toLowerCase() && v.city.trim().toLowerCase() === show.city.trim().toLowerCase())) {
                acc.push({ name: show.venue, city: show.city });
            }
            return acc;
        }, []);

        if (uniqueNewVenues.length === 0) return;

        const taskId = `task-venue-enrich-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: `Enriching ${uniqueNewVenues.length} new venues...`, estimatedDuration: uniqueNewVenues.length * 20 } }));

        try {
            const enrichedVenuesPromises = uniqueNewVenues.map(venueInfo => 
                findVenueContactInfo(venueInfo.name, venueInfo.city)
            );
            const enrichedVenuesData = await Promise.all(enrichedVenuesPromises);
            
            const newVenueObjects: Venue[] = enrichedVenuesData.map(data => ({
                id: `venue-import-${Date.now()}-${Math.random()}`,
                name: data.name || 'Unknown Venue',
                city: data.city || 'Unknown City',
                description: data.description || '',
                capacity: data.capacity,
                contactUrl: data.contactUrl || '',
                bookingEmail: data.bookingEmail,
                generalEmail: data.generalEmail,
                notes: `Imported from ${artistName} tour search.`,
                bandId: activeBandId,
            }));

            if (newVenueObjects.length > 0) {
                setVenues(prev => [...prev, ...newVenueObjects]);
            }
        } catch (err) {
            console.error("Error enriching venue data:", err);
        } finally {
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };


    const handleImport = () => {
        const showsToImport = foundShows.filter((_, index) => selectedShows.has(index));
        if (showsToImport.length === 0) return;

        // 1. Create new Tour
        const newTour: Tour = {
            id: `tour-import-${Date.now()}`,
            name: `${artistName} ${year} Tour (Imported)`,
            startDate: showsToImport[0]?.date || new Date().toISOString().substring(0, 10),
            endDate: showsToImport[showsToImport.length - 1]?.date || new Date().toISOString().substring(0, 10),
            shows: showsToImport.map(s => ({
                id: `show-import-${Date.now()}-${Math.random()}`,
                date: s.date,
                city: s.city,
                venue: s.venue,
                status: 'Planning' as const,
                schedule: [],
            })),
            bandId: activeBandId,
        };
        setTours(prev => [...prev, newTour]);
        
        // 2. Enrich and add new Venues in the background
        enrichAndSaveNewVenues(showsToImport);

        setStep(3);
    };

    const toggleShowSelection = (index: number) => {
        setSelectedShows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl">
                {step === 1 && (
                    <>
                        <h2 className="text-2xl font-bold mb-4 flex items-center"><WandIcon className="mr-3 text-purple-400"/>Import Tour Plan</h2>
                        <p className="text-sm text-gray-400 mb-4">Enter an artist and year to find their tour schedule. The AI will search the web for dates, venues, and cities.</p>
                        <form onSubmit={handleSearch} className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" value={artistName} onChange={e => setArtistName(e.target.value)} placeholder="Artist Name (e.g., Radiohead)" className="w-full bg-gray-700 p-3 rounded-lg" required />
                                <input type="text" value={year} onChange={e => setYear(e.target.value)} placeholder="Year (e.g., 2008)" className="w-full bg-gray-700 p-3 rounded-lg" required />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">Continent (optional)</label>
                                <select value={continent} onChange={e => setContinent(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg mt-1">
                                    <option value="any">Any</option>
                                    <option value="North America">North America</option>
                                    <option value="Europe">Europe</option>
                                    <option value="Asia">Asia</option>
                                    <option value="South America">South America</option>
                                    <option value="Australia">Australia</option>
                                </select>
                            </div>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                                <button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                                    {isLoading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {step === 2 && (
                     <>
                        <h2 className="text-2xl font-bold mb-4">Select Shows to Import</h2>
                        <div className="max-h-96 overflow-y-auto space-y-2 pr-2 mb-4">
                            {foundShows.map((show, index) => (
                                <div key={index} className="bg-gray-700/50 p-3 rounded-lg flex items-center gap-4 cursor-pointer" onClick={() => toggleShowSelection(index)}>
                                    <input type="checkbox" checked={selectedShows.has(index)} readOnly className="h-5 w-5 text-purple-500 bg-gray-800 border-gray-600 rounded focus:ring-purple-600"/>
                                    <div>
                                        <p className="font-semibold">{new Date(show.date).toLocaleDateString('en-US', {timeZone: 'UTC'})} - {show.venue}</p>
                                        <p className="text-sm text-gray-400">{show.city}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                         <div className="flex justify-between items-center pt-4">
                            <p className="text-sm text-gray-400">{selectedShows.size} of {foundShows.length} shows selected.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setStep(1)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Back</button>
                                <button onClick={handleImport} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">Import Selected</button>
                            </div>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <div className="text-center p-8">
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4"/>
                        <h2 className="text-2xl font-bold mb-2">Import Successful!</h2>
                        <p className="text-gray-400 mb-6">Your new tour plan has been created. The AI is now enriching venue data in the background.</p>
                        <button onClick={onClose} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">Done</button>
                    </div>
                )}
            </div>
        </div>
    );
};


interface ToursProps {
  activeBandId: string;
  tours: Tour[];
  setTours: React.Dispatch<React.SetStateAction<Tour[]>>;
  setlists: Setlist[];
  venues: Venue[];
  setVenues: React.Dispatch<React.SetStateAction<Venue[]>>;
}

export const Tours: React.FC<ToursProps> = ({ activeBandId, tours: allTours, setTours, setlists, venues, setVenues }) => {
  const tours = useMemo(() => allTours.filter(t => t.bandId === activeBandId), [allTours, activeBandId]);
  
  const [showForm, setShowForm] = useState(false);
  const [newTourName, setNewTourName] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showTip, setShowTip] = useState(true);

  const handleAddTour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourName) return;
    const tour: Tour = {
      id: Date.now().toString(),
      name: newTourName,
      startDate: new Date().toISOString().substring(0, 10),
      endDate: new Date().toISOString().substring(0, 10),
      shows: [],
      bandId: activeBandId,
    };
    setTours(prev => [...prev, tour]);
    setNewTourName('');
    setShowForm(false);
  };

  const deleteTour = (id: string) => {
    setTours(prev => prev.filter(t => t.id !== id));
  };
  
    const updateTourName = (tourId: string, name: string) => {
        setTours(prev => prev.map(t => t.id === tourId ? { ...t, name } : t));
    };

    const handleAddShow = (tourId: string) => {
        setTours(prev => prev.map(t => {
            if (t.id === tourId) {
                const newShow: Show = {
                    id: Date.now().toString(),
                    date: new Date().toISOString().substring(0, 10),
                    city: '',
                    venue: '',
                    status: 'Planning',
                    schedule: []
                };
                return { ...t, shows: [...t.shows, newShow] };
            }
            return t;
        }));
    };

    const deleteShow = (tourId: string, showId: string) => {
        setTours(prev => prev.map(t => {
            if (t.id === tourId) {
                return { ...t, shows: t.shows.filter(s => s.id !== showId) };
            }
            return t;
        }));
    };

    const updateShow = (tourId: string, updatedShow: Show) => {
        setTours(prev => prev.map(t => {
            if (t.id === tourId) {
                return { ...t, shows: t.shows.map(s => s.id === updatedShow.id ? updatedShow : s) };
            }
            return t;
        }));
    };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Tours</h1>
        <div className="flex gap-4">
             <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
                <WandIcon className="h-5 w-5 mr-2"/>
                Import Tour Plan
            </button>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">
                <PlusIcon className="h-5 w-5 mr-2" />
                {showForm ? 'Cancel' : 'New Tour'}
            </button>
        </div>
      </div>

       {isImportModalOpen && <ImportTourModal onClose={() => setIsImportModalOpen(false)} setTours={setTours} setVenues={setVenues} activeBandId={activeBandId} venues={venues} />}

      {showTip && (
        <Tip onDismiss={() => setShowTip(false)}>
          Organize your shows by tour. Add venues, dates, timeslots, and view your full touring schedule. Link setlists to each show.
        </Tip>
      )}

      {showForm && (
        <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-lg">
          <form onSubmit={handleAddTour} className="flex gap-4">
            <input
              type="text"
              placeholder="Tour Name (e.g., Summer West Coast Tour)"
              value={newTourName}
              onChange={e => setNewTourName(e.target.value)}
              className="flex-1 bg-gray-700 p-3 rounded-lg"
              required
            />
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg">Create Tour</button>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {tours.map(tour => (
          <TourDetails
            key={tour.id}
            tour={tour}
            onDelete={deleteTour}
            onUpdateName={updateTourName}
            onAddShow={handleAddShow}
            onDeleteShow={deleteShow}
            onUpdateShow={updateShow}
            setlists={setlists}
          />
        ))}
      </div>
    </div>
  );
};

const TourDetails: React.FC<{
    tour: Tour,
    onDelete: (id: string) => void,
    onUpdateName: (tourId: string, name: string) => void,
    onAddShow: (tourId: string) => void,
    onDeleteShow: (tourId: string, showId: string) => void,
    onUpdateShow: (tourId: string, show: Show) => void,
    setlists: Setlist[]
}> = ({ tour, onDelete, onUpdateName, onAddShow, onDeleteShow, onUpdateShow, setlists }) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(tour.name);
    
    const handleNameSave = () => {
        onUpdateName(tour.id, editedName);
        setIsEditingName(false);
    };

    return (
         <div className="bg-gray-800 p-5 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                {isEditingName ? (
                    <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} onBlur={handleNameSave} onKeyDown={e => e.key === 'Enter' && handleNameSave} className="text-2xl font-bold bg-gray-700 rounded p-1 -m-1" autoFocus/>
                ) : (
                    <h2 className="text-2xl font-bold" onClick={() => setIsEditingName(true)}>{tour.name}</h2>
                )}
                <button onClick={() => onDelete(tour.id)} className="p-2 rounded-full hover:bg-gray-700"><TrashIcon className="h-5 w-5 text-red-500" /></button>
            </div>
             <div className="space-y-3">
                {tour.shows.map(show => <ShowEditor key={show.id} show={show} onDelete={() => onDeleteShow(tour.id, show.id)} onUpdate={(updatedShow) => onUpdateShow(tour.id, updatedShow)} setlists={setlists}/>)}
            </div>
            <button onClick={() => onAddShow(tour.id)} className="flex items-center text-sm text-purple-400 hover:underline mt-4"><PlusCircleIcon className="w-5 h-5 mr-2"/> Add Show</button>
        </div>
    );
};

const ShowEditor: React.FC<{show: Show, onDelete: () => void, onUpdate: (show: Show) => void, setlists: Setlist[]}> = ({ show, onDelete, onUpdate, setlists }) => {
    const [data, setData] = useState(show);
    const handleUpdate = () => onUpdate(data);
    const handleChange = (field: keyof Show, value: any) => setData(prev => ({...prev, [field]: value}));

    return (
        <div className="bg-gray-700/50 p-3 rounded-lg flex items-center gap-2">
            <input type="date" value={data.date} onChange={e => handleChange('date', e.target.value)} onBlur={handleUpdate} className="bg-gray-800 p-2 rounded w-40"/>
            <input type="text" placeholder="City" value={data.city} onChange={e => handleChange('city', e.target.value)} onBlur={handleUpdate} className="bg-gray-800 p-2 rounded flex-1"/>
            <input type="text" placeholder="Venue" value={data.venue} onChange={e => handleChange('venue', e.target.value)} onBlur={handleUpdate} className="bg-gray-800 p-2 rounded flex-1"/>
            <select value={data.setlistId || ''} onChange={e => handleChange('setlistId', e.target.value)} onBlur={handleUpdate} className="bg-gray-800 p-2 rounded flex-1">
                <option value="">No Setlist</option>
                {setlists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={data.status} onChange={e => handleChange('status', e.target.value)} onBlur={handleUpdate} className="bg-gray-800 p-2 rounded flex-1">
                <option>Planning</option><option>Confirmed</option><option>Done</option>
            </select>
            <button onClick={onDelete} className="p-2 rounded-full hover:bg-gray-600"><TrashIcon className="h-5 w-5 text-gray-500"/></button>
        </div>
    )
};

export default Tours;
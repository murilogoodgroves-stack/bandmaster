import React, { useState, useMemo } from 'react';
import type { Gig, Venue, OpeningSlotOpportunity, Invoice, Transaction, BandSettings } from '../types';
import { initialGigs, initialVenues, initialOpeningSlots } from '../data/initialData';
import { PlusIcon, TrashIcon, SearchIcon, ExternalLinkIcon, SaveIcon, MapPinIcon, InvoiceIcon, BarChartIcon, UsersIcon } from './icons';
import { searchVenues, findOpeningSlotOpportunities } from '../services/geminiService';
import { Tip } from './Tip';

interface GigsProps {
    gigs: Gig[];
    setGigs: React.Dispatch<React.SetStateAction<Gig[]>>;
    venues: Venue[];
    setVenues: React.Dispatch<React.SetStateAction<Venue[]>>;
    openingSlots: OpeningSlotOpportunity[];
    setOpeningSlots: React.Dispatch<React.SetStateAction<OpeningSlotOpportunity[]>>;
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    bandSettings: BandSettings;
    activeBandId: string;
}

export const Gigs: React.FC<GigsProps> = ({ gigs: allGigs, setGigs, venues: allVenues, setVenues, activeBandId }) => {
    const gigs = useMemo(() => allGigs.filter(g => g.bandId === activeBandId), [allGigs, activeBandId]);
    const venues = useMemo(() => allVenues.filter(v => v.bandId === activeBandId), [allVenues, activeBandId]);

    const [activeTab, setActiveTab] = useState<'pipeline' | 'gigs' | 'venues' | 'openings'>('pipeline');
    const [venueSearch, setVenueSearch] = useState({ city: '', style: '', capacity: '100-300' });
    const [foundVenues, setFoundVenues] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearchVenues = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        const results = await searchVenues(venueSearch.style, venueSearch.city, venueSearch.capacity, venues);
        setFoundVenues(results);
        setIsSearching(false);
    };

    const handleSaveVenue = (v: any) => {
        const newVenue: Venue = {
            id: `v-${Date.now()}`,
            name: v.name,
            city: v.city,
            description: v.description,
            capacity: v.capacity,
            contactUrl: v.contactUrl || '',
            bookingEmail: v.bookingEmail,
            bandId: activeBandId,
            generalEmail: ''
        };
        setVenues(prev => [...prev, newVenue]);
    };

    const handleCreateGigFromOpening = (opp: OpeningSlotOpportunity) => {
        const newGig: Gig = {
            id: `gig-opp-${Date.now()}`,
            clientName: opp.promoterName !== 'Unknown' ? opp.promoterName : opp.headlinerArtist,
            eventName: `Opening for ${opp.headlinerArtist}`,
            date: opp.date,
            location: `${opp.venue}, ${opp.city}`,
            status: 'Lead',
            fee: 0,
            roles: [],
            notes: `Source: ${opp.sourceUrl}. Promoter Email: ${opp.promoterEmail}`,
            bandId: activeBandId,
            headlinerArtist: opp.headlinerArtist,
            sourceUrl: opp.sourceUrl
        };
        setGigs(prev => [...prev, newGig]);
        setActiveTab('pipeline');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Gigs & Booking</h1>
            </div>
            
            <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
                <button onClick={() => setActiveTab('pipeline')} className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap ${activeTab === 'pipeline' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-400'}`}>
                    <BarChartIcon className="w-4 h-4" /> Gig Pipeline
                </button>
                <button onClick={() => setActiveTab('gigs')} className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap ${activeTab === 'gigs' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-400'}`}>
                    <MapPinIcon className="w-4 h-4" /> All Gigs (List)
                </button>
                <button onClick={() => setActiveTab('openings')} className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap ${activeTab === 'openings' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-400'}`}>
                    <UsersIcon className="w-4 h-4" /> Opening Slots
                </button>
                <button onClick={() => setActiveTab('venues')} className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap ${activeTab === 'venues' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-400'}`}>
                    <SearchIcon className="w-4 h-4" /> Venue Finder
                </button>
            </div>

            {activeTab === 'pipeline' && (
                <GigPipeline gigs={gigs} setGigs={setGigs} />
            )}

            {activeTab === 'gigs' && (
                <div className="grid gap-4">
                    {gigs.map(gig => (
                        <div key={gig.id} className="bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">{gig.eventName || gig.location}</h3>
                                <p className="text-gray-400">{new Date(gig.date).toLocaleDateString()} - {gig.status}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-green-400">${gig.fee}</p>
                            </div>
                        </div>
                    ))}
                    {gigs.length === 0 && <p className="text-gray-500">No gigs scheduled.</p>}
                </div>
            )}

            {activeTab === 'openings' && (
                <OpeningSlotsFinder onAddLead={handleCreateGigFromOpening} />
            )}

            {activeTab === 'venues' && (
                <div>
                    <div className="bg-gray-800 p-6 rounded-lg mb-6">
                        <h3 className="text-xl font-bold mb-4">Find Venues</h3>
                        <form onSubmit={handleSearchVenues} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="text" placeholder="City" value={venueSearch.city} onChange={e => setVenueSearch({...venueSearch, city: e.target.value})} className="bg-gray-700 p-2 rounded" />
                            <input type="text" placeholder="Style (e.g. Indie Rock)" value={venueSearch.style} onChange={e => setVenueSearch({...venueSearch, style: e.target.value})} className="bg-gray-700 p-2 rounded" />
                            <input type="text" placeholder="Capacity" value={venueSearch.capacity} onChange={e => setVenueSearch({...venueSearch, capacity: e.target.value})} className="bg-gray-700 p-2 rounded" />
                            <button type="submit" disabled={isSearching} className="bg-purple-600 p-2 rounded text-white md:col-span-3">
                                {isSearching ? 'Searching...' : 'Search'}
                            </button>
                        </form>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {foundVenues.map((v, i) => {
                            const isSaved = venues.some(saved => saved.name === v.name);
                            return (
                                <div key={i} className="bg-gray-800 p-4 rounded-lg">
                                    <h4 className="font-bold text-lg">{v.name}</h4>
                                    <p className="text-sm text-gray-400">{v.city} • Cap: {v.capacity}</p>
                                    <p className="text-sm text-gray-300 mt-2">{v.description}</p>
                                    <div className="flex justify-between items-center mt-4">
                                        {v.contactUrl && <a href={v.contactUrl} target="_blank" rel="noreferrer" className="text-blue-400 text-sm flex items-center">Website <ExternalLinkIcon className="w-3 h-3 ml-1"/></a>}
                                        <button onClick={() => handleSaveVenue(v)} disabled={isSaved} className="bg-green-600 px-3 py-1 rounded text-sm disabled:bg-gray-600">
                                            {isSaved ? 'Saved' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Sub-Components ---

const GigPipeline: React.FC<{ gigs: Gig[], setGigs: React.Dispatch<React.SetStateAction<Gig[]>> }> = ({ gigs, setGigs }) => {
    const columns = ['Lead', 'Offered', 'Confirmed', 'Done'];
    
    const updateStatus = (gigId: string, newStatus: Gig['status']) => {
        setGigs(prev => prev.map(g => g.id === gigId ? { ...g, status: newStatus } : g));
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map(status => (
                <div key={status} className="bg-gray-900/50 p-3 rounded-xl min-w-[280px] w-full">
                    <h3 className="font-bold mb-4 text-center border-b border-gray-700 pb-2">{status}</h3>
                    <div className="space-y-3">
                        {gigs.filter(g => g.status === status).map(gig => (
                            <div key={gig.id} className="bg-gray-800 p-3 rounded-lg shadow-md border-l-4 border-purple-500">
                                <p className="font-bold text-sm text-white">{gig.eventName}</p>
                                <p className="text-xs text-gray-400 mb-2">{new Date(gig.date).toLocaleDateString()} @ {gig.location}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-green-400">${gig.fee}</span>
                                    <div className="flex gap-1">
                                        {status !== 'Lead' && <button onClick={() => updateStatus(gig.id, columns[columns.indexOf(status)-1] as any)} className="text-xs bg-gray-700 p-1 rounded hover:bg-gray-600">&lt;</button>}
                                        {status !== 'Done' && <button onClick={() => updateStatus(gig.id, columns[columns.indexOf(status)+1] as any)} className="text-xs bg-gray-700 p-1 rounded hover:bg-gray-600">&gt;</button>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {gigs.filter(g => g.status === status).length === 0 && <p className="text-center text-gray-600 text-sm py-4">No gigs</p>}
                    </div>
                </div>
            ))}
        </div>
    );
};

const OpeningSlotsFinder: React.FC<{ onAddLead: (opp: OpeningSlotOpportunity) => void }> = ({ onAddLead }) => {
    const [city, setCity] = useState('');
    const [genre, setGenre] = useState('');
    const [dateRange, setDateRange] = useState('Next 3 months');
    const [results, setResults] = useState<OpeningSlotOpportunity[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const taskId = `find-openings-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Finding opening slots...', estimatedDuration: 45 } }));
        try {
            const data = await findOpeningSlotOpportunities(genre, city, dateRange);
            setResults(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    return (
        <div>
            <Tip onDismiss={() => {}}>Find touring bands playing mid-sized venues in your city. Add them to your pipeline to pitch yourself as the support act.</Tip>
            <div className="bg-gray-800 p-6 rounded-lg mb-6">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div><label className="text-xs text-gray-400">Target City</label><input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full bg-gray-700 p-2 rounded mt-1" placeholder="e.g. Berlin" required/></div>
                    <div><label className="text-xs text-gray-400">Genre</label><input type="text" value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-gray-700 p-2 rounded mt-1" placeholder="e.g. Indie Rock" required/></div>
                    <div><label className="text-xs text-gray-400">Timing</label><select value={dateRange} onChange={e => setDateRange(e.target.value)} className="w-full bg-gray-700 p-2 rounded mt-1"><option>Next month</option><option>Next 3 months</option><option>Next 6 months</option></select></div>
                    <button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-600">{isLoading ? 'Searching...' : 'Find Opportunities'}</button>
                </form>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((opp, i) => (
                    <div key={i} className="bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">
                        <h4 className="font-bold text-lg text-white">{opp.headlinerArtist}</h4>
                        <p className="text-sm text-gray-300">{new Date(opp.date).toLocaleDateString()} @ {opp.venue}</p>
                        <p className="text-xs text-gray-400 mt-2">Promoter: {opp.promoterName}</p>
                        <div className="flex justify-between items-center mt-4">
                            {opp.sourceUrl && <a href={opp.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-400 text-xs hover:underline">Event Link</a>}
                            <button onClick={() => onAddLead(opp)} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-3 rounded">Save as Lead</button>
                        </div>
                    </div>
                ))}
            </div>
            {!isLoading && results.length === 0 && <p className="text-center text-gray-500 py-8">No opportunities loaded. Try a search!</p>}
        </div>
    );
};
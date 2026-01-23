import React, { useState, useMemo } from 'react';
import type { Gig, Venue, OpeningSlotOpportunity, Invoice, Transaction, BandSettings } from '../types';
import { initialGigs, initialVenues, initialOpeningSlots } from '../data/initialData';
import { PlusIcon, TrashIcon, SearchIcon, ExternalLinkIcon, SaveIcon, MapPinIcon, InvoiceIcon } from './icons';
import { searchVenues } from '../services/geminiService';
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

    const [activeTab, setActiveTab] = useState<'gigs' | 'venues'>('gigs');
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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Gigs & Booking</h1>
            </div>
            
            <div className="flex border-b border-gray-700 mb-6">
                <button onClick={() => setActiveTab('gigs')} className={`px-4 py-2 ${activeTab === 'gigs' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-400'}`}>My Gigs</button>
                <button onClick={() => setActiveTab('venues')} className={`px-4 py-2 ${activeTab === 'venues' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-400'}`}>Venue Finder</button>
            </div>

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

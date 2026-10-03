import React, { useState, useMemo } from 'react';
import type { Gig, Venue, OpeningSlotOpportunity, Invoice, Transaction, BandSettings, BandProfile, EmailTemplate, InvoiceStatus } from '../types';
import { initialGigs, initialVenues, initialOpeningSlots } from '../data/initialData';
import { PlusIcon, TrashIcon, SearchIcon, ExternalLinkIcon, SaveIcon, MapPinIcon, InvoiceIcon, BarChartIcon, UsersIcon, MailIcon, FileTextIcon, EditIcon, WandIcon, SendIcon } from './icons';
import { searchVenues, findOpeningSlotOpportunities, generateGigEmail, createEmailTemplate, EmailTone, EmailLength } from '../services/aiService';
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
    bands: BandProfile[];
    emailTemplates?: EmailTemplate[];
    setEmailTemplates?: React.Dispatch<React.SetStateAction<EmailTemplate[]>>;
}

export const Gigs: React.FC<GigsProps> = ({ gigs: allGigs, setGigs, venues: allVenues, setVenues, activeBandId, bands, setInvoices, bandSettings, emailTemplates, setEmailTemplates }) => {
    const gigs = useMemo(() => allGigs.filter(g => g.bandId === activeBandId), [allGigs, activeBandId]);
    const venues = useMemo(() => allVenues.filter(v => v.bandId === activeBandId), [allVenues, activeBandId]);
    const activeBand = useMemo(() => bands.find(b => b.id === activeBandId) || { name: 'Unknown Band', genre: 'Unknown', id: activeBandId }, [bands, activeBandId]);

    const [activeTab, setActiveTab] = useState<'pipeline' | 'gigs' | 'venues' | 'openings'>('pipeline');
    const [venueSearch, setVenueSearch] = useState({ city: '', style: '', capacity: '100-300' });
    const [foundVenues, setFoundVenues] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [venueSearchError, setVenueSearchError] = useState('');
    const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    const handleSearchVenues = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        setVenueSearchError('');
        setFoundVenues([]);
        try {
            const results = await searchVenues(venueSearch.style, venueSearch.city, venueSearch.capacity, venues);
            setFoundVenues(results);
        } catch (error) {
            console.error('Could not search for venues:', error);
            setVenueSearchError(error instanceof Error ? error.message : 'Venue search failed. Please try again.');
        } finally {
            setIsSearching(false);
        }
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
                <GigPipeline gigs={gigs} setGigs={setGigs} onSelectGig={setSelectedGig} />
            )}

            {activeTab === 'gigs' && (
                <div className="grid gap-4">
                    {gigs.map(gig => (
                        <div key={gig.id} onClick={() => setSelectedGig(gig)} className="bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center cursor-pointer hover:bg-gray-750 transition-colors">
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

            {selectedGig && (
                <GigDetailModal 
                    gig={selectedGig} 
                    activeBand={activeBand}
                    bandSettings={bandSettings}
                    setInvoices={setInvoices}
                    onClose={() => setSelectedGig(null)} 
                    onUpdate={(updated) => setGigs(prev => prev.map(g => g.id === updated.id ? updated : g))}
                    onDelete={(id) => { setGigs(prev => prev.filter(g => g.id !== id)); setSelectedGig(null); }}
                    onOpenEmail={() => setIsEmailModalOpen(true)}
                />
            )}

            {isEmailModalOpen && selectedGig && (
                <GigEmailModal 
                    gig={selectedGig} 
                    bandProfile={activeBand}
                    onClose={() => setIsEmailModalOpen(false)} 
                    emailTemplates={emailTemplates}
                    setEmailTemplates={setEmailTemplates}
                />
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
                        {venueSearchError && <p role="alert" className="mt-3 text-sm text-red-300">{venueSearchError}</p>}
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

const GigPipeline: React.FC<{ gigs: Gig[], setGigs: React.Dispatch<React.SetStateAction<Gig[]>>, onSelectGig: (gig: Gig) => void }> = ({ gigs, setGigs, onSelectGig }) => {
    const columns = ['Lead', 'Offered', 'Confirmed', 'Done'];
    
    const updateStatus = (e: React.MouseEvent, gigId: string, newStatus: Gig['status']) => {
        e.stopPropagation();
        setGigs(prev => prev.map(g => g.id === gigId ? { ...g, status: newStatus } : g));
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map(status => (
                <div key={status} className="bg-gray-900/50 p-3 rounded-xl min-w-[280px] w-full">
                    <h3 className="font-bold mb-4 text-center border-b border-gray-700 pb-2">{status}</h3>
                    <div className="space-y-3">
                        {gigs.filter(g => g.status === status).map(gig => (
                            <div key={gig.id} onClick={() => onSelectGig(gig)} className="bg-gray-800 p-3 rounded-lg shadow-md border-l-4 border-purple-500 cursor-pointer hover:bg-gray-750 transition-colors">
                                <p className="font-bold text-sm text-white">{gig.eventName}</p>
                                <p className="text-xs text-gray-400 mb-2">{new Date(gig.date).toLocaleDateString()} @ {gig.location}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-green-400">${gig.fee}</span>
                                    <div className="flex gap-1">
                                        {status !== 'Lead' && <button onClick={(e) => updateStatus(e, gig.id, columns[columns.indexOf(status)-1] as any)} className="text-xs bg-gray-700 p-1 rounded hover:bg-gray-600">&lt;</button>}
                                        {status !== 'Done' && <button onClick={(e) => updateStatus(e, gig.id, columns[columns.indexOf(status)+1] as any)} className="text-xs bg-gray-700 p-1 rounded hover:bg-gray-600">&gt;</button>}
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

const GigDetailModal: React.FC<{ 
    gig: Gig; 
    activeBand: BandProfile;
    bandSettings: BandSettings;
    setInvoices?: React.Dispatch<React.SetStateAction<Invoice[]>>;
    onClose: () => void; 
    onUpdate: (gig: Gig) => void;
    onDelete: (id: string) => void;
    onOpenEmail: () => void;
}> = ({ gig, activeBand, bandSettings, setInvoices, onClose, onUpdate, onDelete, onOpenEmail }) => {
    const [edited, setEdited] = useState<Gig>(gig);

    const handleSave = () => {
        onUpdate(edited);
        onClose();
    };

    const handleGenerateInvoice = () => {
        if (!setInvoices) return;

        const newInvoice: Invoice = {
            id: `inv-${Date.now()}`,
            transactionId: '',
            bandId: gig.bandId,
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'Draft',
            issuer: {
                name: bandSettings.issuerName,
                address: bandSettings.issuerAddress,
                taxId: bandSettings.issuerTaxId,
                bankDetails: bandSettings.issuerBankDetails,
            },
            recipient: {
                name: gig.clientName || gig.location,
                address: '',
            },
            items: [
                {
                    description: `Performance Fee: ${gig.eventName}`,
                    quantity: 1,
                    unitPrice: gig.fee || 0
                }
            ],
            total: gig.fee || 0,
            notes: `Gig Date: ${gig.date}. ${gig.notes || ''}`
        };

        setInvoices(prev => [...prev, newInvoice]);
        alert(`Draft ${newInvoice.invoiceNumber} created. Review the invoice details before using it; PDF export is not available yet.`);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
                    <h2 className="text-2xl font-bold text-white">Gig Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <PlusIcon className="w-6 h-6 rotate-45" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Event Name</label>
                            <input 
                                type="text" 
                                value={edited.eventName} 
                                onChange={e => setEdited({...edited, eventName: e.target.value})}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</label>
                            <select 
                                value={edited.status} 
                                onChange={e => setEdited({...edited, status: e.target.value as any})}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="Lead">Lead</option>
                                <option value="Offered">Offered</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Done">Done</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
                            <input 
                                type="date" 
                                value={edited.date} 
                                onChange={e => setEdited({...edited, date: e.target.value})}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fee ($)</label>
                            <input 
                                type="number" 
                                value={edited.fee} 
                                onChange={e => setEdited({...edited, fee: Number(e.target.value)})}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</label>
                            <input 
                                type="text" 
                                value={edited.location} 
                                onChange={e => setEdited({...edited, location: e.target.value})}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        {edited.headlinerArtist && (
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Headliner Artist</label>
                                <input 
                                    type="text" 
                                    value={edited.headlinerArtist} 
                                    onChange={e => setEdited({...edited, headlinerArtist: e.target.value})}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                        )}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notes</label>
                            <textarea 
                                value={edited.notes} 
                                onChange={e => setEdited({...edited, notes: e.target.value})}
                                rows={4}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-800">
                        <button onClick={onOpenEmail} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">
                            <MailIcon className="w-4 h-4" /> Outreach Email
                        </button>
                        <button onClick={handleGenerateInvoice} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold transition-colors">
                            <FileTextIcon className="w-4 h-4" /> Generate Invoice
                        </button>
                        <button onClick={() => onDelete(gig.id)} className="flex items-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-4 py-2 rounded-lg font-bold transition-colors ml-auto">
                            <TrashIcon className="w-4 h-4" /> Delete Gig
                        </button>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-800 flex justify-end gap-4 sticky bottom-0 bg-gray-900 z-10">
                    <button onClick={onClose} className="px-6 py-2 text-gray-400 hover:text-white font-bold transition-colors">Cancel</button>
                    <button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-purple-900/20">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const GigEmailModal: React.FC<{ 
    gig: Gig; 
    bandProfile: BandProfile;
    onClose: () => void;
    emailTemplates?: EmailTemplate[];
    setEmailTemplates?: React.Dispatch<React.SetStateAction<EmailTemplate[]>>;
}> = ({ gig, bandProfile, onClose, emailTemplates, setEmailTemplates }) => {
    const [tone, setTone] = useState<EmailTone>('Professional');
    const [length, setLength] = useState<EmailLength>('Standard');
    const [customPrompt, setCustomPrompt] = useState('');
    const [generatedEmail, setGeneratedEmail] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [generationError, setGenerationError] = useState('');
    const [copyError, setCopyError] = useState('');
    const [copyStatus, setCopyStatus] = useState('');

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGenerationError('');
        setGeneratedEmail('');
        try {
            const email = await generateGigEmail(gig, bandProfile, tone, length, customPrompt);
            setGeneratedEmail(email);
        } catch (error) {
            console.error('Could not generate the gig outreach email:', error);
            setGenerationError(error instanceof Error ? error.message : 'The email could not be generated. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyEmail = async () => {
        try {
            await navigator.clipboard.writeText(generatedEmail);
            setCopyError('');
            setCopyStatus('Draft copied. Send it using your email provider; Bandmaster does not send this email.');
        } catch (error) {
            console.error('Could not copy the gig outreach email:', error);
            setCopyStatus('');
            setCopyError('Could not access the clipboard. Select and copy the generated email manually.');
        }
    };

    const handleSaveTemplate = async () => {
        if (!generatedEmail || !setEmailTemplates) return;
        setIsSavingTemplate(true);
        try {
            const templateBody = await createEmailTemplate(generatedEmail, bandProfile);
            const newTemplate: EmailTemplate = {
                id: `temp-${Date.now()}`,
                name: `Booking: ${gig.eventName} (${tone})`,
                body: templateBody,
                bandId: bandProfile.id,
                category: 'Booking'
            };
            setEmailTemplates(prev => [...prev, newTemplate]);
            alert("Template saved successfully! You can find it in the Campaigns section.");
        } catch (error) {
            console.error(error);
            alert("Failed to save template.");
        } finally {
            setIsSavingTemplate(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[60] backdrop-blur-md">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                            <MailIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">AI Outreach Assistant</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <PlusIcon className="w-6 h-6 rotate-45" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Controls */}
                    <div className="w-full md:w-80 p-6 border-r border-gray-800 space-y-6 overflow-y-auto bg-gray-900/50">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Email Settings</h3>
                            
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-bold">Tone</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['Professional', 'Casual', 'Enthusiastic', 'Minimalist'] as EmailTone[]).map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => setTone(t)}
                                            className={`px-2 py-1.5 rounded text-xs font-bold transition-all ${tone === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-bold">Length</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['Brief', 'Standard', 'Detailed'] as EmailLength[]).map(l => (
                                        <button 
                                            key={l}
                                            onClick={() => setLength(l)}
                                            className={`px-2 py-1.5 rounded text-xs font-bold transition-all ${length === l ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-bold">Custom Instructions</label>
                                <textarea 
                                    value={customPrompt}
                                    onChange={e => setCustomPrompt(e.target.value)}
                                    placeholder="e.g. Mention we're touring with a similar band..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                                />
                            </div>

                            <button 
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                            >
                                {isGenerating ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <WandIcon className="w-5 h-5" />
                                )}
                                {isGenerating ? 'Drafting...' : 'Generate Draft'}
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="flex-1 p-6 flex flex-col bg-gray-950/50 relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Email Draft</h3>
                            {generatedEmail && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleCopyEmail}
                                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-gray-800 px-2 py-1 rounded"
                                    >
                                        Copy
                                    </button>
                                    <button 
                                        onClick={handleSaveTemplate}
                                        disabled={isSavingTemplate}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-900/20 px-2 py-1 rounded"
                                    >
                                        {isSavingTemplate ? 'Processing...' : 'Save as Template'}
                                    </button>
                                </div>
                            )}
                        </div>
                        {generationError && <p role="alert" className="text-sm text-red-300 mb-3">{generationError}</p>}
                        {copyError && <p role="alert" className="text-sm text-red-300 mb-3">{copyError}</p>}
                        {copyStatus && <p role="status" className="text-sm text-blue-300 mb-3">{copyStatus}</p>}
                        
                        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-6 overflow-y-auto font-serif text-lg leading-relaxed text-gray-300">
                            {generatedEmail ? (
                                <div className="whitespace-pre-wrap">{generatedEmail}</div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                                    <MailIcon className="w-16 h-16 opacity-20" />
                                    <p className="text-center max-w-xs">Set your preferences and click generate to create a personalized outreach email.</p>
                                </div>
                            )}
                        </div>

                        {generatedEmail && (
                            <div className="mt-4 flex justify-end">
                                <button type="button" disabled title="Email sending is not available. Copy the draft and send it using your email provider." className="bg-gray-700 text-gray-400 font-bold py-2 px-6 rounded-lg flex items-center gap-2 cursor-not-allowed">
                                    <SendIcon className="w-4 h-4" /> Sending unavailable
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const OpeningSlotsFinder: React.FC<{ onAddLead: (opp: OpeningSlotOpportunity) => void }> = ({ onAddLead }) => {
    const [city, setCity] = useState('');
    const [genre, setGenre] = useState('');
    const [dateRange, setDateRange] = useState('Next 3 months');
    const [results, setResults] = useState<OpeningSlotOpportunity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [showTip, setShowTip] = useState(true);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSearchError('');
        setResults([]);
        const taskId = `find-openings-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Finding opening slots...', estimatedDuration: 45 } }));
        try {
            const data = await findOpeningSlotOpportunities(genre, city, dateRange);
            setResults(data);
        } catch (error) {
            console.error('Could not find opening slot opportunities:', error);
            setSearchError(error instanceof Error ? error.message : 'Opportunity search failed. Please try again.');
        } finally {
            setIsLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    return (
        <div>
            {showTip && <Tip onDismiss={() => setShowTip(false)}>Find touring bands playing mid-sized venues in your city. Add them to your pipeline to pitch yourself as the support act.</Tip>}
            <div className="bg-gray-800 p-6 rounded-lg mb-6">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div><label className="text-xs text-gray-400">Target City</label><input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full bg-gray-700 p-2 rounded mt-1" placeholder="e.g. Berlin" required/></div>
                    <div><label className="text-xs text-gray-400">Genre</label><input type="text" value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-gray-700 p-2 rounded mt-1" placeholder="e.g. Indie Rock" required/></div>
                    <div><label className="text-xs text-gray-400">Timing</label><select value={dateRange} onChange={e => setDateRange(e.target.value)} className="w-full bg-gray-700 p-2 rounded mt-1"><option>Next month</option><option>Next 3 months</option><option>Next 6 months</option></select></div>
                    <button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-600">{isLoading ? 'Searching...' : 'Find Opportunities'}</button>
                </form>
            </div>
            {searchError && <p role="alert" className="mb-4 text-sm text-red-300">{searchError}</p>}
            
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
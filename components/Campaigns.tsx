
import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { EmailCampaign, PressContact, Venue, Promoter, BandProfile, CalendarEvent, User, Release, Tour, Show, LabelContact, RadioContact, ProductionProject, FanContact, EmailFollowUp } from '../types';
import { CampaignType, EventType } from '../types';
import { initialCampaigns, initialPressContacts, initialPromoters, initialBandProfiles, initialEvents, initialUsers, initialReleases, initialTours, initialLabelContacts, initialRadioContacts, initialProductionProjects, initialFanContacts, initialVenues } from '../data/initialData';
import { PlusIcon, TrashIcon, MailIcon, BotIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon, MousePointerClickIcon, CalendarIcon, ClockIcon } from './icons';
import { generateEmail, EmailTone, EmailLength, generateEmailFromEPK } from '../services/geminiService';

type CampaignView = 'list' | 'create';
type CreateStep = 1 | 2 | 3 | 4;

interface CampaignsProps {
    users: User[];
    activeBandId: string;
    campaigns: EmailCampaign[];
    setCampaigns: React.Dispatch<React.SetStateAction<EmailCampaign[]>>;
    pressContacts: PressContact[];
    venues: Venue[];
    promoters: Promoter[];
    labelContacts: LabelContact[];
    radioContacts: RadioContact[];
    fanContacts: FanContact[];
    projects: ProductionProject[];
}

export const Campaigns: React.FC<CampaignsProps> = ({ users, activeBandId, campaigns: allCampaigns, setCampaigns, pressContacts, venues, promoters, labelContacts, radioContacts, fanContacts, projects }) => {
    const campaigns = useMemo(() => allCampaigns.filter(c => c.bandId === activeBandId), [allCampaigns, activeBandId]);
    
    const [view, setView] = useState<CampaignView>('list');
    const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
    const [notification, setNotification] = useState('');

    const handleCreateNew = () => {
        const newCampaign: EmailCampaign = {
            id: `camp-${Date.now()}`,
            name: '',
            type: CampaignType.General,
            subject: '',
            body: '',
            status: 'Draft',
            recipientIds: [],
            bandId: activeBandId,
        };
        setEditingCampaign(newCampaign);
        setView('create');
    };

    const handleEdit = (campaign: EmailCampaign) => {
        setEditingCampaign(campaign);
        setView('create');
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this campaign?")) {
            setCampaigns(prev => prev.filter(c => c.id !== id));
        }
    };
    
    const handleSaveCampaign = (campaignToSave: EmailCampaign) => {
        setCampaigns(prev => {
            const exists = prev.some(c => c.id === campaignToSave.id);
            if (exists) {
                return prev.map(c => (c.id === campaignToSave.id ? campaignToSave : c));
            }
            return [...prev, campaignToSave];
        });

        setEditingCampaign(null);
        setView('list');
        if (campaignToSave.status === 'Sent') {
            setNotification('Campaign sent successfully!');
            setTimeout(() => setNotification(''), 3000);
        } else if (campaignToSave.status === 'Scheduled') {
            setNotification('Campaign scheduled successfully!');
            setTimeout(() => setNotification(''), 3000);
        }
    };

    if (view === 'create' && editingCampaign) {
        return <CampaignCreator 
            campaign={editingCampaign} 
            onSave={handleSaveCampaign} 
            onBack={() => setView('list')} 
            users={users} 
            activeBandId={activeBandId}
            pressContacts={pressContacts}
            venues={venues}
            promoters={promoters}
            labelContacts={labelContacts}
            radioContacts={radioContacts}
            fanContacts={fanContacts}
            projects={projects}
        />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Email Campaigns</h1>
                <button onClick={handleCreateNew} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">
                    <PlusIcon className="h-5 w-5 mr-2" /> New Campaign
                </button>
            </div>
            
            {notification && (
                <div className="fixed top-5 right-5 z-50 p-4 text-sm rounded-lg shadow-lg bg-green-800 text-green-200">
                    {notification}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map(campaign => (
                    <div key={campaign.id} className="bg-gray-800 p-5 rounded-lg shadow-md flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold text-white mb-1">{campaign.name}</h3>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                    campaign.status === 'Sent' ? 'bg-green-500/20 text-green-300' :
                                    campaign.status === 'Scheduled' ? 'bg-blue-500/20 text-blue-300' :
                                    'bg-gray-600 text-gray-300'
                                }`}>
                                    {campaign.status}
                                </span>
                            </div>
                            <p className="text-xs font-medium text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded-full inline-block mb-2">{campaign.type}</p>
                            <p className="text-sm text-gray-400 truncate" title={campaign.subject}>Subject: {campaign.subject}</p>
                            <p className="text-sm text-gray-400">Recipients: {campaign.recipientIds.length}</p>
                            {campaign.status === 'Sent' && 
                                <div className="text-sm text-gray-400 mt-2 flex gap-4">
                                    <span className="flex items-center gap-1.5"><EyeIcon className="w-4 h-4 text-gray-500"/> {campaign.openRate?.toFixed(0)}%</span>
                                    <span className="flex items-center gap-1.5"><MousePointerClickIcon className="w-4 h-4 text-gray-500"/> {campaign.clickRate?.toFixed(0)}%</span>
                                </div>
                            }
                            {campaign.status === 'Scheduled' && campaign.scheduledDate &&
                                <div className="text-sm text-blue-300 mt-2 flex items-center gap-1.5"><ClockIcon className="w-4 h-4"/> Sends: {new Date(campaign.scheduledDate).toLocaleString()}</div>
                            }
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end gap-2">
                            {campaign.status === 'Draft' || campaign.status === 'Scheduled' ? 
                                <button onClick={() => handleEdit(campaign)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md">Edit</button>
                                : <button className="text-sm bg-gray-600 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded-md">View Report</button>
                            }
                            <button onClick={() => handleDelete(campaign.id)} className="text-sm bg-red-800 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
            {campaigns.length === 0 && <p className="text-center text-gray-500 py-16">No campaigns created yet. Click "New Campaign" to start!</p>}
        </div>
    );
};

interface CampaignCreatorProps {
    campaign: EmailCampaign;
    onSave: (campaign: EmailCampaign) => void;
    onBack: () => void;
    users: User[];
    activeBandId: string;
    pressContacts: PressContact[];
    venues: Venue[];
    promoters: Promoter[];
    labelContacts: LabelContact[];
    radioContacts: RadioContact[];
    fanContacts: FanContact[];
    projects: ProductionProject[];
}


const CampaignCreator: React.FC<CampaignCreatorProps> = ({ campaign, onSave, onBack, users, activeBandId, ...contactProps }) => {
    const [step, setStep] = useState<CreateStep>(1);
    const [campaignData, setCampaignData] = useState<EmailCampaign>(campaign);
    
    const [schedule, setSchedule] = useState(!!campaign.scheduledDate);
    
    // Format date for datetime-local input
    const formatDateTimeLocal = (isoString: string | undefined) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };
    
    const [scheduleDate, setScheduleDate] = useState(formatDateTimeLocal(campaign.scheduledDate));

    const handleSaveDraft = () => onSave({ 
        ...campaignData, 
        status: 'Draft',
        scheduledDate: schedule && scheduleDate ? new Date(scheduleDate).toISOString() : undefined,
    });
    
    const handleSend = () => {
        const action = schedule ? 'schedule' : 'send';
        if (window.confirm(`This will ${action} the campaign to ${campaignData.recipientIds.length} recipients. Continue?`)) {
            if (schedule && scheduleDate) {
                onSave({ ...campaignData, status: 'Scheduled', scheduledDate: new Date(scheduleDate).toISOString() });
            } else {
                const openRate = Math.floor(Math.random() * (75 - 25 + 1)) + 25; // 25-75%
                const clickRate = Math.floor(Math.random() * (openRate * 0.4 - 2 + 1)) + 2; // 2-40% of opens
                onSave({
                    ...campaignData,
                    status: 'Sent',
                    sentDate: new Date().toISOString(),
                    openRate,
                    clickRate
                });
            }
        }
    };
    
    const nextStep = () => setStep(prev => Math.min(prev + 1, 4) as CreateStep);
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1) as CreateStep);
    
    return (
        <div>
            <button onClick={onBack} className="flex items-center text-sm text-purple-400 hover:underline mb-4"><ChevronLeftIcon className="w-4 h-4 mr-1" /> Back to Campaigns</button>
            <h1 className="text-3xl font-bold mb-2">{campaign.name || 'Create New Campaign'}</h1>
            <div className="flex justify-between items-center mb-8 p-4 bg-gray-800 rounded-lg">
                {([1,2,3,4] as CreateStep[]).map(s => (
                    <React.Fragment key={s}>
                        <div className={`flex items-center ${step >= s ? 'text-spotify-green' : 'text-gray-500'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= s ? 'bg-spotify-green text-black border-spotify-green' : 'border-gray-500'}`}>{s}</div>
                            <span className="ml-2 text-sm hidden sm:inline">{['Setup', 'Recipients', 'Compose', 'Review & Send'][s-1]}</span>
                        </div>
                        {s < 4 && <div className={`flex-1 h-0.5 mx-4 ${step > s ? 'bg-spotify-green' : 'bg-gray-600'}`}></div>}
                    </React.Fragment>
                ))}
            </div>
            
            <div className="bg-gray-800 p-6 rounded-xl">
                {step === 1 && <Step1 data={campaignData} setData={setCampaignData} activeBandId={activeBandId} projects={contactProps.projects} />}
                {step === 2 && <Step2 data={campaignData} setData={setCampaignData} activeBandId={activeBandId} {...contactProps} />}
                {step === 3 && <Step3 data={campaignData} setData={setCampaignData} activeBandId={activeBandId} />}
                {step === 4 && <Step4 data={campaignData} schedule={schedule} setSchedule={setSchedule} scheduleDate={scheduleDate} setScheduleDate={setScheduleDate} users={users} />}
                
                <div className="mt-6 flex justify-between items-center">
                    <div>
                        {step > 1 && <button onClick={prevStep} className="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg">Back</button>}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleSaveDraft} className="bg-blue-600 hover:bg-blue-700 font-bold py-2 px-4 rounded-lg">Save Draft</button>
                        {step < 4 ? 
                            <button onClick={nextStep} className="bg-spotify-green hover:bg-green-500 font-bold py-2 px-4 rounded-lg">Next</button> :
                            <button onClick={handleSend} disabled={campaignData.recipientIds.length === 0} className="bg-spotify-green hover:bg-green-500 font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                                {schedule && scheduleDate ? 'Schedule Campaign' : 'Send Now'}
                            </button>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};


const Step1: React.FC<{ data: EmailCampaign, setData: React.Dispatch<React.SetStateAction<EmailCampaign>>, activeBandId: string, projects: ProductionProject[] }> = ({ data, setData, activeBandId, projects }) => {
    const projectsForBand = useMemo(() => projects.filter(p => p.bandId === activeBandId), [projects, activeBandId]);
    
    return (
    <div>
        <h2 className="text-2xl font-bold mb-4">1. Campaign Setup</h2>
        <div className="space-y-4">
            <div><label className="text-gray-400">Campaign Name (for internal use)</label><input type="text" value={data.name} onChange={e => setData({...data, name: e.target.value})} className="w-full bg-gray-700 p-2 rounded-lg mt-1" /></div>
            <div>
                <label className="text-gray-400">Campaign Type</label>
                <select value={data.type} onChange={e => setData({...data, type: e.target.value as CampaignType, recipientIds: [] })} className="w-full bg-gray-700 p-2 rounded-lg mt-1">
                    {Object.values(CampaignType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
             {data.type === CampaignType.LabelPitch && (
                <div>
                    <label className="text-gray-400">Link to Production Project</label>
                    <select value={data.projectId} onChange={e => setData({...data, projectId: e.target.value })} className="w-full bg-gray-700 p-2 rounded-lg mt-1">
                        <option value="">Select a project...</option>
                        {projectsForBand.filter(p => p.type !== 'Other').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
             )}
            <div><label className="text-gray-400">Email Subject Line</label><input type="text" value={data.subject} onChange={e => setData({...data, subject: e.target.value})} className="w-full bg-gray-700 p-2 rounded-lg mt-1" /></div>
        </div>
    </div>
)};

const Step2: React.FC<{ data: EmailCampaign, setData: React.Dispatch<React.SetStateAction<EmailCampaign>>, activeBandId: string } & Omit<CampaignCreatorProps, 'campaign' | 'onSave' | 'onBack' | 'users'>> = ({ data, setData, activeBandId, pressContacts, venues, promoters, labelContacts, radioContacts, fanContacts }) => {
    
    const pressContactsForBand = useMemo(() => pressContacts.filter(c => c.bandId === activeBandId), [pressContacts, activeBandId]);
    const venuesForBand = useMemo(() => venues.filter(v => v.bandId === activeBandId), [venues, activeBandId]);
    const promotersForBand = useMemo(() => promoters.filter(p => p.bandId === activeBandId), [promoters, activeBandId]);
    const labelContactsForBand = useMemo(() => labelContacts.filter(l => l.bandId === activeBandId), [labelContacts, activeBandId]);
    const radioContactsForBand = useMemo(() => radioContacts.filter(r => r.bandId === activeBandId), [radioContacts, activeBandId]);
    const fanContactsForBand = useMemo(() => fanContacts.filter(f => f.bandId === activeBandId), [fanContacts, activeBandId]);
    
    const availableContacts = useMemo(() => {
        let contacts: {id: string, name: string, subtext: string, email?: string}[] = [];
        switch(data.type) {
            case CampaignType.PressPromotion:
                contacts = pressContactsForBand.map(c => ({ id: `p_${c.id}`, name: c.name, subtext: c.outlet, email: c.email }));
                break;
            case CampaignType.VenueOutreach:
                 contacts = venuesForBand.map(v => ({ id: `v_${v.id}`, name: v.name, subtext: v.city, email: v.bookingEmail || v.generalEmail }));
                break;
            case CampaignType.TourAnnouncement:
                 contacts = promotersForBand.map(p => ({ id: `pr_${p.id}`, name: p.name, subtext: p.source, email: p.email }));
                break;
            case CampaignType.LabelPitch:
                contacts = labelContactsForBand.map(l => ({ id: `l_${l.id}`, name: l.name, subtext: l.labelName, email: l.email }));
                break;
            case CampaignType.RadioOutreach:
                contacts = radioContactsForBand.map(r => ({ id: `r_${r.id}`, name: r.name, subtext: r.stationName, email: r.email }));
                break;
            case CampaignType.Newsletter:
                 contacts = fanContactsForBand.map(c => ({ id: `f_${c.id}`, name: c.name || 'Fan', subtext: c.origin, email: c.email }));
                break;
            case CampaignType.General:
                const allContacts = new Map<string, {id: string, name: string, subtext: string, email?: string}>();
                fanContactsForBand.forEach(c => c.email && allContacts.set(c.email, { id: `f_${c.id}`, name: c.name || 'Fan', subtext: `Fan: ${c.origin}`, email: c.email }));
                pressContactsForBand.forEach(c => c.email && allContacts.set(c.email, { id: `p_${c.id}`, name: c.name, subtext: `Press: ${c.outlet}`, email: c.email }));
                venuesForBand.forEach(v => (v.bookingEmail || v.generalEmail) && allContacts.set((v.bookingEmail || v.generalEmail)!, { id: `v_${v.id}`, name: v.name, subtext: `Venue: ${v.city}`, email: v.bookingEmail || v.generalEmail }));
                promotersForBand.forEach(p => p.email && allContacts.set(p.email, { id: `pr_${p.id}`, name: p.name, subtext: `Promoter: ${p.source}`, email: p.email }));
                labelContactsForBand.forEach(l => l.email && allContacts.set(l.email, { id: `l_${l.id}`, name: l.name, subtext: `Label: ${l.labelName}`, email: l.email }));
                radioContactsForBand.forEach(r => r.email && allContacts.set(r.email, { id: `r_${r.id}`, name: r.name, subtext: `Radio: ${r.stationName}`, email: r.email }));
                contacts = Array.from(allContacts.values());
                break;
        }
        return contacts.filter(c => c.email);
    }, [data.type, pressContactsForBand, venuesForBand, promotersForBand, labelContactsForBand, radioContactsForBand, fanContactsForBand]);

    const handleSelect = (id: string) => {
        setData(prev => ({
            ...prev,
            recipientIds: prev.recipientIds.includes(id) ? prev.recipientIds.filter(rid => rid !== id) : [...prev.recipientIds, id]
        }));
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">2. Select Recipients ({data.recipientIds.length} / {availableContacts.length})</h2>
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
            {availableContacts.length === 0 && <p className="text-gray-500 text-center p-4">No contacts found for this campaign type. Please add some in the appropriate section.</p>}
            {availableContacts.map(contact => (
                <div key={contact.id} className="bg-gray-700/50 p-3 rounded-lg flex items-center gap-4">
                    <input type="checkbox" checked={data.recipientIds.includes(contact.id)} onChange={() => handleSelect(contact.id)} className="w-5 h-5 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-600"/>
                    <div>
                        <p className="font-semibold text-white">{contact.name}</p>
                        <p className="text-sm text-gray-400">{contact.subtext} - {contact.email}</p>
                    </div>
                </div>
            ))}
            </div>
        </div>
    );
};

const Step3: React.FC<{ data: EmailCampaign, setData: React.Dispatch<React.SetStateAction<EmailCampaign>>, activeBandId: string }> = ({ data, setData, activeBandId }) => {
    const [releases] = useLocalStorage<Release[]>('releases', initialReleases);
    const [tours] = useLocalStorage<Tour[]>('tours', initialTours);
    const [projects] = useLocalStorage<ProductionProject[]>('productionProjects', initialProductionProjects);
    const [bio] = useLocalStorage('bandBio', "LOVNIS are an indie rock quartet...");
    const [bands] = useLocalStorage<BandProfile[]>('bands', initialBandProfiles);
    const bandProfile = useMemo(() => bands.find(b => b.id === activeBandId) || bands[0], [bands, activeBandId]);
    
    const linkedProject = projects.find(p => p.id === data.projectId);

    const suggestedPrompt = useMemo(() => {
        const latestRelease = [...releases].sort((a,b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())[0];
        const latestTour = [...tours].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

        switch(data.type) {
            case CampaignType.Newsletter:
                return `Write a newsletter for our fans. Announce our new release "${latestRelease?.title || 'our new music'}" and our upcoming tour "${latestTour?.name || 'our next shows'}". Keep it exciting and thank them for their support.`;
            case CampaignType.PressPromotion:
                return `Announce our new release, "${latestRelease?.title || 'our new music'}", coming out on ${latestRelease ? new Date(latestRelease.releaseDate).toLocaleDateString() : 'an upcoming date'}. Ask for a feature or review.`;
            case CampaignType.VenueOutreach:
                return "Introduce our band and ask for an available slot to play a show in the coming months. Mention our genre and link to our music.";
            case CampaignType.TourAnnouncement:
                return `Announce our upcoming "${latestTour?.name || 'tour'}" from ${latestTour ? new Date(latestTour.startDate).toLocaleDateString() : 'a start date'} to ${latestTour ? new Date(latestTour.endDate).toLocaleDateString() : 'an end date'}. Include a call to action.`;
            case CampaignType.LabelPitch:
                if (linkedProject) {
                    return `Pitch our upcoming project "${linkedProject.name}" for consideration. Mention it's a ${linkedProject.type} and briefly describe it. Ask if they are accepting demos.`;
                }
                return `Introduce our band and our music. Ask if they are accepting demos and what the best way to submit is.`
            default:
                return "Write a general newsletter update for our fans.";
        }
    }, [data.type, releases, tours, linkedProject]);

    const [prompt, setPrompt] = useState(suggestedPrompt);
    const [tone, setTone] = useState<EmailTone>('Professional');
    const [length, setLength] = useState<EmailLength>('Standard');
    const [isLoading, setIsLoading] = useState(false);
    const [isEpkLoading, setIsEpkLoading] = useState(false);
    
    const [showFollowUp, setShowFollowUp] = useState(!!data.followUp);

    const handleFollowUpChange = (field: keyof EmailFollowUp, value: any) => {
        setData(prev => ({
            ...prev,
            followUp: {
                ...(prev.followUp || { delayDays: 7, subject: `Re: ${prev.subject}`, body: '' }),
                [field]: value,
            }
        }));
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        const result = await generateEmail(prompt, '{{name}}', tone, length, bandProfile, true, linkedProject);
        setData({...data, body: result });
        setIsLoading(false);
    };
    
    const handleImportFromEpk = async () => {
        setIsEpkLoading(true);

        const latestRelease = [...releases].sort((a,b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())[0];
        const upcomingShows = tours.flatMap(t => t.shows).filter(s => new Date(s.date) >= new Date()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);

        const epkData = { bio, latestRelease, upcomingShows };
        
        const result = await generateEmailFromEPK(epkData, bandProfile);
        setData({...data, body: result });
        setIsEpkLoading(false);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">3. Compose Email</h2>
            <div className="bg-gray-900 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold flex items-center"><BotIcon className="w-5 h-5 mr-2 text-purple-400"/> AI Content Generation</h3>
                
                <div className="mt-2 p-3 border border-gray-700 rounded-lg">
                    <h4 className="text-md font-semibold mb-2">Generate from a prompt</h4>
                    <p className="text-xs text-gray-400 mb-2">Describe the email you want. Based on your campaign type, we've suggested a prompt below.</p>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} className="w-full bg-gray-700 text-white p-2 rounded-lg text-sm"></textarea>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        <select value={tone} onChange={e => setTone(e.target.value as EmailTone)} className="w-full bg-gray-700 p-2 rounded-lg text-xs"><option>Professional</option><option>Casual</option><option>Enthusiastic</option></select>
                        <select value={length} onChange={e => setLength(e.target.value as EmailLength)} className="w-full bg-gray-700 p-2 rounded-lg text-xs"><option>Brief</option><option>Standard</option><option>Detailed</option></select>
                        <button onClick={handleGenerate} disabled={isLoading || !prompt} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 text-sm">
                            {isLoading ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </div>
                
                <div className="text-center my-2 text-gray-500 text-sm font-bold">OR</div>

                <div className="p-3 border border-gray-700 rounded-lg">
                    <h4 className="text-md font-semibold mb-2">Generate from your EPK</h4>
                    <p className="text-xs text-gray-400 mb-3">The AI will use your bio, latest release, and upcoming shows to draft a professional outreach email.</p>
                    <button onClick={handleImportFromEpk} disabled={isEpkLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg disabled:bg-gray-600 text-sm">
                        {isEpkLoading ? 'Importing & Generating...' : 'Import from EPK'}
                    </button>
                </div>
            </div>
            <textarea value={data.body} onChange={e => setData({...data, body: e.target.value})} className="w-full bg-gray-700 p-3 rounded-lg h-64 resize-y" placeholder="Your email content will appear here..." />
             <div className="mt-4 p-4 border-t border-gray-700">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={showFollowUp} onChange={e => {
                        setShowFollowUp(e.target.checked);
                        if (!e.target.checked) setData(prev => ({ ...prev, followUp: undefined }));
                    }} className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-spotify-green ring-spotify-green"/>
                    <span className="font-semibold text-white">Add automated follow-up if no reply</span>
                </label>
                {showFollowUp && (
                    <div className="mt-4 pl-8 space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Send after</span>
                            <input type="number" value={data.followUp?.delayDays || 7} onChange={e => handleFollowUpChange('delayDays', parseInt(e.target.value))} min="1" className="w-20 bg-gray-700 p-2 rounded-lg text-sm" />
                            <span className="text-sm">days</span>
                        </div>
                        <input type="text" value={data.followUp?.subject || ''} onChange={e => handleFollowUpChange('subject', e.target.value)} placeholder="Follow-up Subject" className="w-full bg-gray-700 p-2 rounded-lg" />
                        <textarea value={data.followUp?.body || ''} onChange={e => handleFollowUpChange('body', e.target.value)} rows={4} placeholder="Follow-up email body..." className="w-full bg-gray-700 p-2 rounded-lg text-sm"></textarea>
                    </div>
                )}
            </div>
        </div>
    );
};

const Step4: React.FC<{ 
    data: EmailCampaign;
    schedule: boolean;
    setSchedule: (val: boolean) => void;
    scheduleDate: string;
    setScheduleDate: (val: string) => void;
    users: User[];
}> = ({ data, schedule, setSchedule, scheduleDate, setScheduleDate, users }) => {
    
    const minDate = new Date();
    minDate.setMinutes(minDate.getMinutes() - minDate.getTimezoneOffset());
    const minDateString = minDate.toISOString().slice(0, 16);

    const handleTestSend = () => {
        const userEmail = users[0]?.email;
        if (userEmail) {
            alert(`A test email has been sent to ${userEmail}. (This is a simulation)`);
        } else {
            alert("No user email found to send a test.");
        }
    };

    return (
    <div>
        <h2 className="text-2xl font-bold mb-4">4. Review & Send</h2>
        <div className="space-y-4">
            <p><strong className="text-gray-400 w-32 inline-block">Campaign Name:</strong> {data.name}</p>
            <p><strong className="text-gray-400 w-32 inline-block">Total Recipients:</strong> {data.recipientIds.length}</p>
            <p><strong className="text-gray-400 w-32 inline-block">Subject:</strong> {data.subject}</p>
            
            <div className="border-t border-b border-gray-700 py-4">
                <h4 className="text-gray-400 mb-2">Email Preview:</h4>
                <div className="bg-gray-900 p-4 rounded-lg max-h-48 overflow-y-auto text-sm text-gray-300 whitespace-pre-wrap">{data.body || "No content yet."}</div>
            </div>
            
            <div>
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center"><CalendarIcon className="w-5 h-5 mr-2 text-purple-400" /> Schedule Send</h4>
                <div className="flex items-center gap-4 bg-gray-700/50 p-3 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={schedule} onChange={e => setSchedule(e.target.checked)} className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-spotify-green ring-spotify-green"/>
                        Schedule for a future date
                    </label>
                    {schedule && (
                        <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} min={minDateString} className="bg-gray-700 p-2 rounded-lg" required />
                    )}
                </div>
            </div>
            <div className="pt-4">
                 <button onClick={handleTestSend} className="text-sm text-purple-300 border border-purple-300/50 rounded-lg px-4 py-2 hover:bg-purple-300/10">
                    Send Test Email
                </button>
            </div>
        </div>
    </div>
)};

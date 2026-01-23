
import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import useLocalStorage from '../hooks/useLocalStorage';
import { initialUsers, initialBandProfiles } from '../data/initialData';
import { BotIcon, DownloadIcon, PlusIcon, TrashIcon, CopyIcon, FileTextIcon, StageIcon, WandIcon } from './icons';
import type { User, BandProfile } from '../types';

type StagePlotTab = 'map' | 'rider';
type Member = { id: number; name: string; instrument: string; position: string; notes: string };
type InputListItem = { id: number; channel: string; instrument: string; mic_di: string; stand: string };

interface StagePlotProps {
    users: User[];
    bands: BandProfile[];
    activeBandId: string;
}

export const StagePlot: React.FC<StagePlotProps> = ({ users, bands, activeBandId }) => {
    const [activeTab, setActiveTab] = useState<StagePlotTab>('map');

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Stage Plot & Tech Rider</h1>
            </div>
            <div className="flex border-b border-brand-border mb-6">
                <button onClick={() => setActiveTab('map')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === 'map' ? 'border-b-2 border-brand-accent text-white' : 'text-gray-400'}`}>
                    <StageIcon className="w-5 h-5" /> AI Stage Map Generator
                </button>
                <button onClick={() => setActiveTab('rider')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === 'rider' ? 'border-b-2 border-brand-accent text-white' : 'text-gray-400'}`}>
                    <FileTextIcon className="w-5 h-5" /> Tech Rider Generator
                </button>
            </div>
            {activeTab === 'map' ? <StageMapGenerator users={users} activeBandId={activeBandId} /> : <TechRiderGenerator users={users} bands={bands} activeBandId={activeBandId} />}
        </div>
    );
};

const StageMapGenerator: React.FC<{ users: User[], activeBandId: string }> = ({ users, activeBandId }) => {
    // Persist members configuration
    const [members, setMembers] = useLocalStorage<Member[]>(`stagePlot_members_${activeBandId}`, users.map((u, i) => ({ id: i + 1, name: u.name, instrument: u.primaryRole, position: 'Center', notes: '1x Vocal Mic, 1x Monitor Wedge' })));
    // Persist stage notes
    const [stageNotes, setStageNotes] = useLocalStorage<string>(`stagePlot_notes_${activeBandId}`, 'Standard 4-piece rock band setup.');
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMapUrl, setGeneratedMapUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleMemberChange = (id: number, field: keyof Member, value: string) => {
        setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const handleGenerateMap = async () => {
        setIsGenerating(true);
        setGeneratedMapUrl(null);
        setError(null);

        const memberDetails = members.map(m => `- ${m.instrument} (${m.name}) at ${m.position}. Technical needs: ${m.notes}.`).join('\n');
        
        const prompt = `Create a simple, clear, professional, top-down, black and white stage plot diagram for a live music performance.
        The audience is at the bottom of the image. The back of the stage is at the top.
        The band consists of the following members and instruments:
        ${memberDetails}
        General notes: ${stageNotes}
        Use simple, universally understood icons for instruments (drum kit, guitar, bass, keyboard), amplifiers, vocal microphones on stands, and monitor wedges.
        Clearly label each main instrument position on the stage (e.g., "Drums", "Vocals", "Guitar").
        The style must be a clean, technical diagram. Absolutely no color, shading, or 3D effects. Black lines and shapes on a white background.`;

        const taskId = `task-stagemap-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Generating AI Stage Plot...', estimatedDuration: 25 } }));

        try {
            if (!process.env.API_KEY) throw new Error("API key not configured.");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            
            const part = response.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData) {
                setGeneratedMapUrl(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            } else {
                throw new Error("The AI did not return an image. Please try refining your prompt.");
            }
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
            setIsGenerating(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    const stagePositions = ['Downstage Center', 'Downstage Left', 'Downstage Right', 'Center Stage', 'Stage Left', 'Stage Right', 'Upstage Center', 'Upstage Left', 'Upstage Right'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-brand-bg-card p-6 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">1. Define Your Setup</h2>
                {members.map(member => (
                    <div key={member.id} className="bg-brand-bg-content p-3 rounded-lg mb-3">
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" value={member.instrument} onChange={e => handleMemberChange(member.id, 'instrument', e.target.value)} placeholder="Instrument" className="bg-brand-bg-card p-2 rounded text-sm w-full" />
                            <select value={member.position} onChange={e => handleMemberChange(member.id, 'position', e.target.value)} className="bg-brand-bg-card p-2 rounded text-sm w-full">
                                {stagePositions.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <input type="text" value={member.notes} onChange={e => handleMemberChange(member.id, 'notes', e.target.value)} placeholder="Mic, Monitors, Amps..." className="bg-brand-bg-card p-2 rounded text-sm w-full mt-2" />
                    </div>
                ))}
                <textarea value={stageNotes} onChange={e => setStageNotes(e.target.value)} placeholder="General notes for the AI..." rows={2} className="w-full bg-brand-bg-content p-2 rounded-lg mt-4 text-sm" />
                <button onClick={handleGenerateMap} disabled={isGenerating} className="w-full mt-4 flex items-center justify-center bg-brand-accent hover:bg-brand-accent-dark text-white font-bold py-3 rounded-lg disabled:bg-gray-600">
                    <BotIcon className="w-5 h-5 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Stage Map'}
                </button>
            </div>
            <div className="bg-brand-bg-card p-6 rounded-xl flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold mb-4">2. Generated Plot</h2>
                <div className="w-full aspect-video bg-brand-bg-content rounded-lg flex items-center justify-center">
                    {isGenerating && <p className="text-gray-400">AI is drawing your stage plot...</p>}
                    {error && <p className="text-red-400 p-4">{error}</p>}
                    {generatedMapUrl && <img src={generatedMapUrl} alt="AI generated stage plot" className="w-full h-full object-contain" />}
                    {!isGenerating && !generatedMapUrl && !error && <p className="text-gray-500">Your image will appear here</p>}
                </div>
                {generatedMapUrl && (
                    <a href={generatedMapUrl} download="stage_plot.png" className="w-full mt-4 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Download Image
                    </a>
                )}
            </div>
        </div>
    );
};

const TechRiderGenerator: React.FC<{ users: User[], bands: BandProfile[], activeBandId: string }> = ({ users, bands, activeBandId }) => {
    const activeBand = useMemo(() => bands.find(b => b.id === activeBandId) || bands[0], [bands, activeBandId]);

    const [contact, setContact] = useState({ name: users.find(u => u.systemRole === 'Manager')?.name || users[0]?.name || '', email: 'booking@cosmicechoes.band', phone: '123-456-7890' });
    const [personnel, setPersonnel] = useState(users.map(u => `${u.name} - ${u.primaryRole}`).join('\n'));
    const [inputList, setInputList] = useState<InputListItem[]>([
        { id: 1, channel: 'Kick', instrument: 'Drums', mic_di: 'Beta 52A', stand: 'Short' },
        { id: 2, channel: 'Snare', instrument: 'Drums', mic_di: 'SM57', stand: 'Short' },
        { id: 3, channel: 'Bass', instrument: 'Bass Guitar', mic_di: 'DI Box', stand: '' },
        { id: 4, channel: 'Guitar', instrument: 'Electric Guitar', mic_di: 'SM57 on Amp', stand: 'Short' },
        { id: 5, channel: 'Vox', instrument: 'Lead Vocals', mic_di: 'SM58', stand: 'Boom' },
    ]);
    const [monitors, setMonitors] = useState('4 separate monitor mixes across the front of the stage.');
    const [backline, setBackline] = useState('Band will provide all guitars, basses, amps, and effects. Venue to provide a standard 4-piece drum kit (kick, snare, rack tom, floor tom, cymbals).');
    const [hospitality, setHospitality] = useState('4x bottles of water, 1x case of beer. Vegetarian meal option if possible.');

    const [generatedRider, setGeneratedRider] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerateRider = () => {
        const inputListText = inputList.map(item => `| ${item.channel.padEnd(10)} | ${item.instrument.padEnd(15)} | ${item.mic_di.padEnd(20)} | ${item.stand.padEnd(10)} |`).join('\n');
        
        const riderText = `
TECHNICAL RIDER - ${activeBand.name.toUpperCase()}

Last Updated: ${new Date().toLocaleDateString()}

========================================
CONTACT
========================================
Name: ${contact.name}
Email: ${contact.email}
Phone: ${contact.phone}

========================================
PERSONNEL
========================================
${personnel}

========================================
INPUT LIST
========================================
| Channel    | Instrument      | Mic / DI             | Stand      |
|------------|-----------------|----------------------|------------|
${inputListText}

========================================
STAGE & MONITOR REQUIREMENTS
========================================
${monitors}

========================================
BACKLINE
========================================
${backline}

========================================
HOSPITALITY
========================================
${hospitality}

========================================
Thank you for your cooperation!
`;
        setGeneratedRider(riderText);
    };

    const handleCopyRider = () => {
        navigator.clipboard.writeText(generatedRider);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    const handleInputListChange = (id: number, field: keyof InputListItem, value: string) => {
        setInputList(inputList.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const addInputListItem = () => {
        setInputList([...inputList, { id: Date.now(), channel: '', instrument: '', mic_di: '', stand: '' }]);
    };
    
    const removeInputListItem = (id: number) => {
        setInputList(inputList.filter(item => item.id !== id));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-brand-bg-card p-6 rounded-xl space-y-4">
                <h2 className="text-2xl font-bold mb-4">1. Rider Details</h2>
                
                {/* Contact */}
                <div>
                    <h3 className="text-lg font-bold mb-2">Contact Info</h3>
                    <div className="space-y-2">
                        <input value={contact.name} onChange={e => setContact({...contact, name: e.target.value})} placeholder="Contact Name" className="w-full bg-brand-bg-content p-2 rounded text-sm"/>
                        <input value={contact.email} onChange={e => setContact({...contact, email: e.target.value})} placeholder="Contact Email" className="w-full bg-brand-bg-content p-2 rounded text-sm"/>
                        <input value={contact.phone} onChange={e => setContact({...contact, phone: e.target.value})} placeholder="Contact Phone" className="w-full bg-brand-bg-content p-2 rounded text-sm"/>
                    </div>
                </div>

                {/* Personnel */}
                <div>
                    <h3 className="text-lg font-bold mb-2">Personnel</h3>
                    <textarea value={personnel} onChange={e => setPersonnel(e.target.value)} rows={users.length} className="w-full bg-brand-bg-content p-2 rounded text-sm" />
                </div>

                {/* Input List */}
                <div>
                    <h3 className="text-lg font-bold mb-2">Input List</h3>
                    <div className="space-y-2">
                        {inputList.map(item => (
                            <div key={item.id} className="grid grid-cols-5 gap-1 items-center">
                                <input value={item.channel} onChange={e => handleInputListChange(item.id, 'channel', e.target.value)} placeholder="Channel" className="col-span-1 bg-brand-bg-content p-1 rounded text-xs"/>
                                <input value={item.instrument} onChange={e => handleInputListChange(item.id, 'instrument', e.target.value)} placeholder="Instrument" className="col-span-1 bg-brand-bg-content p-1 rounded text-xs"/>
                                <input value={item.mic_di} onChange={e => handleInputListChange(item.id, 'mic_di', e.target.value)} placeholder="Mic/DI" className="col-span-2 bg-brand-bg-content p-1 rounded text-xs"/>
                                <input value={item.stand} onChange={e => handleInputListChange(item.id, 'stand', e.target.value)} placeholder="Stand" className="col-span-1 bg-brand-bg-content p-1 rounded text-xs"/>
                                <button onClick={() => removeInputListItem(item.id)} className="-ml-6"><TrashIcon className="w-4 h-4 text-red-500"/></button>
                            </div>
                        ))}
                    </div>
                    <button onClick={addInputListItem} className="text-xs text-purple-400 hover:underline mt-2">Add Input Item</button>
                </div>
                
                {/* Monitors, Backline, Hospitality */}
                <div><h3 className="text-lg font-bold mb-2">Monitors</h3><textarea value={monitors} onChange={e => setMonitors(e.target.value)} rows={2} className="w-full bg-brand-bg-content p-2 rounded text-sm" /></div>
                <div><h3 className="text-lg font-bold mb-2">Backline</h3><textarea value={backline} onChange={e => setBackline(e.target.value)} rows={3} className="w-full bg-brand-bg-content p-2 rounded text-sm" /></div>
                <div><h3 className="text-lg font-bold mb-2">Hospitality</h3><textarea value={hospitality} onChange={e => setHospitality(e.target.value)} rows={2} className="w-full bg-brand-bg-content p-2 rounded text-sm" /></div>

                <button onClick={handleGenerateRider} className="w-full mt-4 flex items-center justify-center bg-brand-accent hover:bg-brand-accent-dark text-white font-bold py-3 rounded-lg">
                    <WandIcon className="w-5 h-5 mr-2" />
                    Generate Tech Rider Text
                </button>
            </div>
            <div className="bg-brand-bg-card p-6 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">2. Generated Rider</h2>
                <textarea readOnly value={generatedRider} className="w-full h-96 bg-brand-bg-content p-3 rounded-lg text-sm text-gray-300 font-mono" />
                {generatedRider && (
                    <button onClick={handleCopyRider} className="w-full mt-4 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">
                        <CopyIcon className="w-5 h-5 mr-2" />
                        {isCopied ? 'Copied!' : 'Copy Rider Text'}
                    </button>
                )}
            </div>
        </div>
    );
};

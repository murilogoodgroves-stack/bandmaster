
import React, { useState, useMemo, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { ReleaseType, TaskStatus } from '../types';
import type { Release, ReleaseChecklistItem, PressContact, User, BandProfile, ProductionProject, Task } from '../types';
import { releasePlanTemplate } from '../data/releasePlanTemplate';
import { PlusIcon, TrashIcon, ChevronDownIcon, UploadCloudIcon, BotIcon, SlashIcon, InfoIcon, CopyIcon } from './icons';
import { generateEmail, EmailTone, EmailLength, generateReleasePlan } from '../services/aiService';
import { Tip } from './Tip';
import { initialBandProfiles, initialPressContacts } from '../data/initialData';

const priorityColors: { [key in 'Critical' | 'High' | 'Medium' | 'Low']: string } = {
    'Critical': 'border-red-500',
    'High': 'border-orange-500',
    'Medium': 'border-yellow-500',
    'Low': 'border-blue-500',
};

interface ReleasesProps {
    users: User[];
    bands: BandProfile[];
    activeBandId: string;
    releases: Release[];
    setReleases: React.Dispatch<React.SetStateAction<Release[]>>;
    pressContacts: PressContact[];
    projects: ProductionProject[];
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

// Main Component
export const Releases: React.FC<ReleasesProps> = ({ users, bands, activeBandId, releases: allReleases, setReleases, projects, tasks, setTasks, pressContacts: allPressContacts }) => {
  const releases = useMemo(() => allReleases.filter(r => r.bandId === activeBandId), [allReleases, activeBandId]);
  const activeBand = useMemo(() => bands.find(b => b.id === activeBandId) || bands[0], [bands, activeBandId]);
  const pressContacts = useMemo(() => allPressContacts.filter(c => c.bandId === activeBandId), [allPressContacts, activeBandId]);
  
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTip, setShowTip] = useState(true);

  useEffect(() => {
    const handleHashChange = () => {
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const releaseId = params.get('releaseId');
        if (releaseId) {
            const releaseToSelect = allReleases.find(r => r.id === releaseId && r.bandId === activeBandId);
            if (releaseToSelect) {
                handleSelectRelease(releaseToSelect);
            }
        }
    };
    handleHashChange(); // on mount
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [allReleases, activeBandId]);
  
  const handleSelectRelease = (release: Release) => {
    setSelectedRelease(release);
    setView('detail');
  };

  const handleCreateNew = () => {
      setIsModalOpen(true);
  };
  
  const handleSaveRelease = (newReleaseData: Omit<Release, 'id' | 'bandId' | 'artist'> & { audioFiles: File[], projectId?: string }) => {
      const newReleaseId = Date.now().toString();

      const newTasks: Task[] = [];
      const checklistWithLinkedIds = newReleaseData.checklist.map((item, index) => {
          const taskId = `task-${newReleaseId}-${item.id || index}`;
          const deadline = new Date(newReleaseData.releaseDate);
          deadline.setDate(deadline.getDate() + item.deadlineOffsetDays);

          const newTask: Task = {
              id: taskId,
              title: item.text,
              assignedToId: item.assignedToId || '',
              dueDate: deadline.toISOString().substring(0, 10),
              status: item.completed ? TaskStatus.Done : TaskStatus.ToDo,
              priority: item.priority,
              projectId: newReleaseData.projectId || 'p-general',
              releaseId: newReleaseId,
              bandId: activeBandId,
          };
          newTasks.push(newTask);
          return { ...item, linkedTaskId: taskId };
      });

      setTasks(prev => [...prev, ...newTasks]);

      const newRelease: Release = {
          id: newReleaseId,
          ...newReleaseData,
          artist: activeBand.name,
          audioFiles: newReleaseData.audioFiles.map(f => ({ name: f.name, url: '#' })),
          bandId: activeBandId,
          checklist: checklistWithLinkedIds,
      }
      setReleases(prev => [...prev, newRelease]);
      setIsModalOpen(false);
      handleSelectRelease(newRelease);
  }

    const updateRelease = (updater: (prev: Release) => Release) => {
        setSelectedRelease(prevSelected => {
            if (!prevSelected) return null;
            const newSelectedRelease = updater(prevSelected);
            setReleases(prevAllReleases => 
                prevAllReleases.map(r => r.id === newSelectedRelease.id ? newSelectedRelease : r)
            );
            return newSelectedRelease;
        });
    };
  
  const deleteRelease = (id: string) => {
      if (!window.confirm("Are you sure you want to permanently delete this entire release plan?")) return;
      setReleases(prev => prev.filter(r => r.id !== id));
      setTasks(prev => prev.filter(t => t.releaseId !== id));
      setView('list');
      setSelectedRelease(null);
  }

  if (view === 'detail' && selectedRelease) {
      return <ReleaseDetail release={selectedRelease} onBack={() => setView('list')} onUpdate={updateRelease} onDelete={deleteRelease} users={users} tasks={tasks} setTasks={setTasks} pressContacts={pressContacts} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Release Planner</h1>
        <button onClick={handleCreateNew} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          <PlusIcon className="h-5 w-5 mr-2"/>
          Plan New Release
        </button>
      </div>
      {showTip && <Tip onDismiss={() => setShowTip(false)}>This is your command center for all music releases. Click "Plan New Release" to start a comprehensive, multi-phase rollout plan.</Tip>}
      <ReleaseList releases={releases} onSelectRelease={handleSelectRelease} />
      {isModalOpen && <NewReleaseModal onClose={() => setIsModalOpen(false)} onSave={handleSaveRelease} activeBand={activeBand} projects={projects} />}
    </div>
  );
};

// List of all releases
const ReleaseList: React.FC<{ releases: Release[], onSelectRelease: (release: Release) => void }> = ({ releases, onSelectRelease }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {releases.sort((a,b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()).map(release => {
                 const totalTasks = release.checklist.filter(t => !t.isNA).length;
                 const completedTasks = release.checklist.filter(t => t.completed && !t.isNA).length;
                 const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                 const daysUntil = Math.ceil((new Date(release.releaseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                return (
                    <div key={release.id} onClick={() => onSelectRelease(release)} className="bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:shadow-purple-500/20 hover:-translate-y-1 transition-all">
                        <div className="w-full h-40 bg-gray-700 rounded-t-lg flex items-center justify-center">
                            {release.coverArtUrl ? <p className="text-gray-500 text-sm">(Cover Art: {release.coverArtUrl})</p> : <p className="text-gray-500">No Cover Art</p>}
                        </div>
                        <div className="p-4">
                            <p className="text-xs text-purple-400">{release.type}</p>
                            <h3 className="text-xl font-bold text-white">{release.title}</h3>
                            <p className="text-sm text-gray-400">{daysUntil > 0 ? `Releases in ${daysUntil} days` : daysUntil === 0 ? `Releases Today!` : `Released ${-daysUntil} days ago`}</p>
                             <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
                                <div className="bg-purple-600 h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// Detailed view for a single release
const ReleaseDetail: React.FC<{ release: Release, onBack: () => void, onUpdate: (updater: (prev: Release) => Release) => void, onDelete: (id: string) => void, users: User[], tasks: Task[], setTasks: React.Dispatch<React.SetStateAction<Task[]>>, pressContacts: PressContact[] }> = ({ release, onBack, onUpdate, onDelete, users, tasks, setTasks, pressContacts }) => {
    const phases = useMemo(() => {
        const grouped: { [key: string]: ReleaseChecklistItem[] } = {};
        release.checklist.forEach(item => {
            if (!grouped[item.phase]) {
                grouped[item.phase] = [];
            }
            grouped[item.phase].push(item);
        });
        const orderedPhases = releasePlanTemplate.map(item => item.phase)
          .filter((value, index, self) => self.indexOf(value) === index);
        
        return orderedPhases.map((phaseName): [string, ReleaseChecklistItem[]] => [phaseName, grouped[phaseName] || []]);
    }, [release.checklist]);
    
    const [openPhases, setOpenPhases] = useState<Set<string>>(new Set(phases[0]?.[0] ? [phases[0][0]] : []));

    const togglePhase = (phaseName: string) => {
        setOpenPhases(prev => {
            const newSet = new Set(prev);
            if (newSet.has(phaseName)) newSet.delete(phaseName);
            else newSet.add(phaseName);
            return newSet;
        });
    }

    const handleChecklistItemChange = (itemId: string, updatedValues: Partial<ReleaseChecklistItem>) => {
        onUpdate(prevRelease => {
            const updatedChecklist = prevRelease.checklist.map(item =>
                item.id === itemId ? { ...item, ...updatedValues } : item
            );
            const changedItemForTaskUpdate = updatedChecklist.find(item => item.id === itemId);

            if (changedItemForTaskUpdate && changedItemForTaskUpdate.linkedTaskId) {
                if ('completed' in updatedValues) {
                    const newStatus = updatedValues.completed ? TaskStatus.Done : TaskStatus.ToDo;
                    setTasks(prevTasks => prevTasks.map(task =>
                        task.id === changedItemForTaskUpdate!.linkedTaskId ? { ...task, status: newStatus } : task
                    ));
                }
                if ('assignedToId' in updatedValues) {
                    setTasks(prevTasks => prevTasks.map(task =>
                        task.id === changedItemForTaskUpdate!.linkedTaskId ? { ...task, assignedToId: updatedValues.assignedToId || '' } : task
                    ));
                }
            }
            return { ...prevRelease, checklist: updatedChecklist };
        });
    }


    return (
        <div>
            <div className="flex justify-between items-start mb-6">
                <div>
                     <button onClick={onBack} className="text-sm text-purple-400 hover:underline mb-2">&larr; Back to All Releases</button>
                    <h1 className="text-4xl font-bold">{release.title}</h1>
                    <p className="text-gray-400">Release Date: {new Date(release.releaseDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                 <button onClick={() => onDelete(release.id)} className="flex items-center bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
                    <TrashIcon className="h-5 w-5 mr-2"/> Delete Plan
                </button>
            </div>

            {release.strategySummary && (
                <div className="bg-gray-900/50 border border-purple-800 p-4 rounded-lg my-4">
                    <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2"><BotIcon className="w-5 h-5" /> AI Strategy Summary</h3>
                    <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{release.strategySummary}</p>
                    {release.budget !== undefined && release.budget > 0 && (
                        <p className="text-xs text-gray-500 mt-3">This plan was generated with a budget of ${release.budget.toLocaleString()}.</p>
                    )}
                </div>
            )}
            
            <div className="space-y-4">
                {phases.map(([phaseName, items]) => (
                    <ReleasePhase 
                        key={phaseName as string} 
                        phaseName={phaseName as string} 
                        items={items as ReleaseChecklistItem[]} 
                        releaseDate={release.releaseDate}
                        isOpen={openPhases.has(phaseName as string)}
                        onToggle={() => togglePhase(phaseName as string)}
                        onItemChange={handleChecklistItemChange}
                        users={users}
                        pressContacts={pressContacts}
                    />
                ))}
            </div>
        </div>
    );
}

// Accordion for each phase
const ReleasePhase: React.FC<{ phaseName: string, items: ReleaseChecklistItem[], releaseDate: string, isOpen: boolean, onToggle: () => void, onItemChange: (itemId: string, updatedValues: Partial<ReleaseChecklistItem>) => void, users: User[], pressContacts: PressContact[] }> = ({ phaseName, items, releaseDate, isOpen, onToggle, onItemChange, users, pressContacts }) => {
    const activeItems = items.filter(i => !i.isNA);
    const completed = activeItems.filter(i => i.completed).length;
    const total = activeItems.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    
    return (
        <div className="bg-gray-800 rounded-lg">
            <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left">
                <div>
                    <h2 className="text-xl font-bold">{phaseName}</h2>
                    <p className="text-sm text-gray-400">{completed} of {total} tasks complete</p>
                </div>
                <div className="flex items-center gap-4">
                     <div className="w-32 bg-gray-700 rounded-full h-2.5">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
                    </div>
                    <ChevronDownIcon className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-700">
                    <div className="space-y-2">
                        {items.sort((a,b) => a.deadlineOffsetDays - b.deadlineOffsetDays).map(item => (
                            <ChecklistItem key={item.id} item={item} releaseDate={releaseDate} onChange={onItemChange} users={users} pressContacts={pressContacts} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// A single checklist item
const ChecklistItem: React.FC<{ item: ReleaseChecklistItem, releaseDate: string, onChange: (itemId: string, updatedValues: Partial<ReleaseChecklistItem>) => void, users: User[], pressContacts: PressContact[] }> = ({ item, releaseDate, onChange, users, pressContacts }) => {
    const [isPitching, setIsPitching] = useState(false);

    const deadline = new Date(releaseDate);
    deadline.setDate(deadline.getDate() + item.deadlineOffsetDays);
    
    const isOverdue = new Date() > deadline && !item.completed;
    const isNA = item.isNA;
    
    const isUploadTask = item.text.toLowerCase().includes('upload');
    const isPitchTask = item.text.toLowerCase().includes('pitch') || item.text.toLowerCase().includes('submissions sent');

    return (
        <div className={`p-3 rounded-lg flex items-center gap-4 ${isNA ? 'bg-gray-800 opacity-50' : 'bg-gray-700/50'} border-l-4 ${isNA ? 'border-gray-600' : priorityColors[item.priority]}`}>
            <input type="checkbox" checked={item.completed} onChange={e => onChange(item.id, { completed: e.target.checked })} disabled={isNA} className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-600"/>
            <div className="flex-1">
                <p className={`text-white ${item.completed || isNA ? 'line-through' : ''}`}>{item.text}</p>
                <p className={`text-xs ${isOverdue ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                    Due: {deadline.toLocaleDateString('en-US')}
                </p>
            </div>
             <select value={item.assignedToId || ''} onChange={e => onChange(item.id, { assignedToId: e.target.value || null })} disabled={isNA} className="bg-gray-700 text-sm p-1 rounded">
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            {isUploadTask && !isNA && (
                <label className="cursor-pointer p-2 bg-blue-600/50 hover:bg-blue-600 rounded-lg text-xs flex items-center gap-1">
                    <UploadCloudIcon className="w-4 h-4" />
                    {item.fileUrl || 'Upload'}
                    <input type="file" className="hidden" onChange={e => onChange(item.id, { fileUrl: e.target.files?.[0].name })} />
                </label>
            )}
            {isPitchTask && !isNA && (
                <button onClick={() => setIsPitching(true)} className="p-2 bg-green-600/50 hover:bg-green-600 rounded-lg text-xs flex items-center gap-1">
                    <BotIcon className="w-4 h-4"/> Pitch
                </button>
            )}
            <button onClick={() => onChange(item.id, { isNA: !item.isNA })} title="Mark N/A" className="p-2 hover:bg-gray-600 rounded-full"><SlashIcon className="w-4 h-4 text-gray-500" /></button>
            {isPitching && <PitchingModal releaseTitle={releaseDate} itemText={item.text} onClose={() => setIsPitching(false)} pressContacts={pressContacts} />}
        </div>
    );
};

// Modal for creating a new release
const NewReleaseModal: React.FC<{ onClose: () => void, onSave: (data: any) => void, activeBand: BandProfile, projects: ProductionProject[] }> = ({ onClose, onSave, activeBand, projects }) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<ReleaseType>(ReleaseType.Album);
    const [releaseDate, setReleaseDate] = useState('');
    const [trackCount, setTrackCount] = useState(10);
    const [leadSingle, setLeadSingle] = useState('');
    const [coverArt, setCoverArt] = useState<File | null>(null);
    const [audioFiles, setAudioFiles] = useState<File[]>([]);
    const [useAiPlan, setUseAiPlan] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // New state for AI context
    const [budget, setBudget] = useState(0);
    const [strategyFocus, setStrategyFocus] = useState('');
    const [projectId, setProjectId] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);

        let checklistTemplate: Omit<ReleaseChecklistItem, 'id' | 'completed' | 'isNA' | 'notes' | 'fileUrl' | 'linkUrl'>[];
        let strategySummary: string | undefined = undefined;

        if (useAiPlan) {
            const taskId = `ai-plan-${Date.now()}`;
            window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Generating AI release plan...', estimatedDuration: 25 } }));
            try {
                const aiResult = await generateReleasePlan(
                    { title, type, releaseDate },
                    activeBand,
                    { budget: budget > 0 ? budget : undefined, strategyFocus: strategyFocus || undefined }
                );

                if (aiResult && aiResult.checklist && aiResult.checklist.length > 0) {
                    strategySummary = aiResult.strategySummary;
                    checklistTemplate = aiResult.checklist.map(item => ({ ...item, assignedToId: null }));
                } else {
                    console.info("AI plan generation returned empty list or failed silently. Falling back to the default template.");
                    checklistTemplate = releasePlanTemplate.map(item => ({ ...item, assignedToId: null }));
                    if (aiResult?.strategySummary) {
                        strategySummary = aiResult.strategySummary; // Capture specific error/quota messages if returned
                    }
                }
            } catch (error) {
                console.error("An error occurred during AI plan generation:", error);
                checklistTemplate = releasePlanTemplate.map(item => ({ ...item, assignedToId: null }));
            } finally {
                window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
            }
        } else {
            checklistTemplate = releasePlanTemplate.map(item => ({ ...item, assignedToId: null }));
        }

        const checklist = checklistTemplate.map((item, index) => ({
            ...item,
            id: `${Date.now()}-${index}`,
            completed: false,
            isNA: false,
            notes: '',
            fileUrl: '',
            linkUrl: '',
        }));

        onSave({
            title, type, releaseDate, trackCount, leadSingle, coverArtUrl: coverArt?.name, audioFiles, checklist,
            budget, strategySummary, projectId: projectId || undefined
        });
        setIsGenerating(false);
    };
    
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 28); // Minimum 4 weeks

    return (
       <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Plan a New Release</h2>
                <div className="bg-blue-900/50 border border-blue-700 text-blue-200 px-4 py-3 rounded-lg relative mb-4 text-sm">
                    <strong className="font-bold">Pro Tip:</strong> Release on a Friday! For best results with playlisting, set your release date at least 6-8 weeks in the future. The minimum is 4 weeks.
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Release Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg" required />
                    <div className="grid grid-cols-2 gap-4">
                        <select value={type} onChange={e => setType(e.target.value as ReleaseType)} className="w-full bg-gray-700 p-3 rounded-lg">
                            {[ReleaseType.Album, ReleaseType.EP, ReleaseType.Mixtape, ReleaseType.Single, ReleaseType.MusicVideo].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} min={minDate.toISOString().split('T')[0]} className="w-full bg-gray-700 p-3 rounded-lg" required />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="Total Track Count" value={trackCount} onChange={e => setTrackCount(parseInt(e.target.value))} min="1" className="w-full bg-gray-700 p-3 rounded-lg" required />
                        <input type="text" placeholder="Lead Single Title" value={leadSingle} onChange={e => setLeadSingle(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <label className="p-3 bg-gray-700 rounded-lg flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white"><UploadCloudIcon className="w-5 h-5" />{coverArt ? coverArt.name : 'Upload Cover Art (3000x3000)'}<input type="file" className="hidden" accept="image/jpeg,image/png" onChange={e => setCoverArt(e.target.files?.[0] || null)}/></label>
                        <label className="p-3 bg-gray-700 rounded-lg flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white"><UploadCloudIcon className="w-5 h-5" />{audioFiles.length > 0 ? `${audioFiles.length} audio files` : 'Upload Audio (.WAV)'}<input type="file" className="hidden" accept=".wav" multiple onChange={e => setAudioFiles(Array.from(e.target.files || []))}/></label>
                    </div>
                    <div>
                        <label className="text-gray-400">Link to Production Project (optional)</label>
                        <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg mt-1">
                            <option value="">None</option>
                            {projects.filter(p => p.type !== 'Other').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                     <div className="pt-2">
                        <label className="flex items-center gap-3 cursor-pointer text-sm">
                            <input type="checkbox" checked={useAiPlan} onChange={e => setUseAiPlan(e.target.checked)} className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-purple-500 focus:ring-purple-500" />
                            <span className="flex items-center gap-1.5">Generate strategic marketing plan with AI <BotIcon className="w-4 h-4 text-purple-400" /></span>
                        </label>
                         {useAiPlan && (
                            <div className="grid grid-cols-2 gap-4 mt-3 pl-8">
                                <div>
                                    <label className="text-xs text-gray-400">Promotional Budget ($)</label>
                                    <input type="number" placeholder="e.g., 500" value={budget} onChange={e => setBudget(Number(e.target.value))} min="0" className="w-full bg-gray-700 p-2 rounded-lg mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Main Strategy Focus</label>
                                    <input type="text" placeholder="e.g., TikTok growth, Spotify playlists" value={strategyFocus} onChange={e => setStrategyFocus(e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg mt-1" />
                                </div>
                            </div>
                         )}
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isGenerating} className="bg-spotify-green hover:bg-green-500 font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 min-w-[140px]">
                           {isGenerating ? 'Generating...' : 'Create Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Modal for pitching to press contacts
const PitchingModal: React.FC<{ releaseTitle: string, itemText: string, onClose: () => void, pressContacts: PressContact[] }> = ({ releaseTitle, itemText, onClose, pressContacts }) => {
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
    const [emailModalOpen, setEmailModalOpen] = useState(false);

    const [bands] = useLocalStorage<BandProfile[]>('bands', initialBandProfiles);
    const [activeBandId] = useLocalStorage<string>('activeBandId', 'b1');
    const activeBand = useMemo(() => bands.find(b => b.id === activeBandId) || bands[0], [bands, activeBandId]);


    const handleSelect = (id: string) => {
        setSelectedContacts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    }
    
    const contactsToEmail = pressContacts.filter(c => selectedContacts.has(c.id));
    const releaseDate = new Date(releaseTitle);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4">Pitch for Release on {releaseDate.toLocaleDateString('en-US')}</h2>
                <p className="text-gray-400 mb-4">Select contacts to pitch to for the task: "{itemText}"</p>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {pressContacts.map(contact => (
                        <div key={contact.id} className="bg-gray-700 p-3 rounded-lg flex items-center gap-4">
                            <input type="checkbox" checked={selectedContacts.has(contact.id)} onChange={() => handleSelect(contact.id)} className="w-5 h-5 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-600"/>
                            <div>
                                <p className="font-semibold">{contact.name}</p>
                                <p className="text-sm text-gray-400">{contact.outlet}</p>
                            </div>
                        </div>
                    ))}
                    {pressContacts.length === 0 && <p className="text-center text-gray-500 py-4">No press contacts found. Add some in the 'Press Outreach' tab.</p>}
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={() => setEmailModalOpen(true)} disabled={selectedContacts.size === 0} className="bg-spotify-green hover:bg-green-500 font-bold py-2 px-4 rounded-lg disabled:bg-gray-600">
                        Draft Email to {selectedContacts.size} Selected
                    </button>
                </div>
            </div>
            {emailModalOpen && <AiEmailModal contacts={contactsToEmail} releaseTitle={releaseTitle} bandProfile={activeBand} onClose={() => setEmailModalOpen(false)} />}
        </div>
    );
};

// Reusable AI Email Modal
const AiEmailModal: React.FC<{ contacts: PressContact[], releaseTitle: string, bandProfile: BandProfile, onClose: () => void }> = ({ contacts, releaseTitle, bandProfile, onClose }) => {
    const [tone, setTone] = useState<EmailTone>('Professional');
    const [length, setLength] = useState<EmailLength>('Standard');
    const [generatedEmail, setGeneratedEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copyStatus, setCopyStatus] = useState('');
    
    const isBulk = contacts.length > 1;
    const targetDisplay = isBulk ? `${contacts.length} contacts` : contacts[0]?.name;
    const releaseDateObj = new Date(releaseTitle);
    const prompt = `Draft a pitch email for our new album releasing on ${releaseDateObj.toLocaleDateString('en-US')}.`;
    
    const handleGenerate = async () => {
        setIsLoading(true);
        setGeneratedEmail('');
        setError('');
        try {
            const result = await generateEmail(prompt, contacts[0]?.name || '', tone, length, bandProfile, isBulk);
            setGeneratedEmail(result);
        } catch (error) {
            console.error('Could not generate the release pitch:', error);
            setError(error instanceof Error ? error.message : 'The release pitch could not be generated. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedEmail);
            setCopyStatus('Draft copied. Send it using your email provider; Bandmaster does not send this pitch.');
        } catch (error) {
            console.error('Could not copy the release pitch:', error);
            setCopyStatus('Could not access the clipboard. Select and copy the draft manually.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[60]">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold">AI Email Draft for <span className="text-purple-400">{targetDisplay}</span></h2>
                <div className="grid grid-cols-2 gap-4 my-4">
                    <select value={tone} onChange={e => setTone(e.target.value as EmailTone)} className="w-full bg-gray-800 p-2 rounded-lg text-sm"><option>Professional</option><option>Casual</option><option>Enthusiastic</option></select>
                    <select value={length} onChange={e => setLength(e.target.value as EmailLength)} className="w-full bg-gray-800 p-2 rounded-lg text-sm"><option>Brief</option><option>Standard</option><option>Detailed</option></select>
                </div>
                <button onClick={handleGenerate} disabled={isLoading} className="mb-4 rounded-lg bg-purple-600 px-4 py-2 font-bold text-white hover:bg-purple-700 disabled:bg-gray-600">{isLoading ? 'Generating...' : generatedEmail ? 'Regenerate draft' : 'Generate draft'}</button>
                <div className="flex-grow overflow-y-auto bg-gray-800 rounded-lg p-4 min-h-[200px]">
                    {isLoading ? <p className="text-center p-8 text-gray-400">AI is writing...</p> : <textarea readOnly value={generatedEmail} className="w-full h-full bg-transparent text-gray-300 border-none focus:ring-0 resize-none"></textarea>}
                    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
                    {copyStatus && <p role="status" className="text-sm text-blue-300">{copyStatus}</p>}
                </div>
                <div className="flex justify-end gap-4 mt-4">
                    {generatedEmail && <button onClick={handleCopy} className="flex items-center bg-blue-600 hover:bg-blue-700 font-bold py-2 px-4 rounded-lg"><CopyIcon className="w-4 h-4 mr-2"/>Copy draft</button>}
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg">Close draft</button>
                </div>
            </div>
        </div>
    );
};

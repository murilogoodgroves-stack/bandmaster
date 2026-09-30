
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ensureStorageVersion, makeEqualSplit, resolveValidBandId, resolveValidUserId, sanitizeBandScopedList, validBandIds, STORAGE_VERSION, STORAGE_VERSION_KEY } from './state/appStateIntegrity';
import { Dashboard } from './components/Dashboard';
import { Projects } from './components/Projects';
import { Calendar } from './components/Calendar';
import { Financials } from './components/Financials';
import { PressOutreach } from './components/PressOutreach';
import { Merchandise } from './components/Merchandise';
import { Releases } from './components/Releases';
import { Tours } from './components/Tours';
import { Setlists } from './components/Setlists';
import { Collaborators } from './components/Collaborators';
import { Resources } from './components/Resources';
import { Sidebar } from './components/Sidebar';
import { Settings } from './components/Settings';
import { AiAssistant } from './components/AiAssistant';
import { BotIcon } from './components/icons';
import type { Page, EmailCampaign, BandProfile, User, Task, ProductionProject, CalendarEvent, Transaction, MerchItem, Release, Tour, Setlist, Collaborator, PressContact, LabelContact, RadioContact, Venue, OpeningSlotOpportunity, FanContact, Gig, FundingApplication, Festival, BandGoal, MediaAsset, RoyaltyStatement, Song, Budget, LockedDate, PublishedArticle, SaasSubscription, Promoter, ReportConfig, Invoice, BandSettings, CashHolding, MemberTransaction, SavedFundingOpportunity, SavedResidency, EmailTemplate } from './types';
import { TaskStatus, TaskPriority, EventType } from './types';
import { Production } from './components/Production';
import { Funding } from './components/Funding';
import { Festivals } from './components/Festivals';
import { Goals } from './components/Goals';
import { MediaArchive } from './components/MediaArchive';
import { EPK } from './components/EPK';
import { Royalties } from './components/Royalties';
import { Gigs } from './components/Gigs';
import { Campaigns } from './components/Campaigns';
import { LabelReachout } from './components/LabelReachout';
import { RadioOutreach } from './components/RadioOutreach';
import { Reports } from './components/Reports';
import { Fanbase } from './components/Fanbase';
import { StagePlot } from './components/StagePlot';
import { SocialStudio } from './components/SocialStudio';
import { SoundMatch } from './components/SoundMatch';
import { Invoices } from './components/Invoices';
import { Residencies } from './components/Residencies';
import { SystemStatus } from './components/SystemStatus';
import { AIStatusWarning } from './components/AIStatusWarning';
import { HelpCenter } from './components/HelpCenter';
import { UserHintManager } from './components/UserHintManager';
import useLocalStorage from './hooks/useLocalStorage';
import { 
    initialCampaigns, initialBandProfiles, initialUsers, initialTasks, initialProductionProjects, initialEvents, 
    initialTransactions, initialMerch, initialReleases, initialTours, initialSetlists, initialCollaborators, 
    initialPressContacts, initialLabelContacts, initialRadioContacts, initialVenues, initialOpeningSlots, 
    initialFanContacts, initialGigs, initialFundingApplications, initialFestivals, initialGoals, initialMediaAssets, 
    initialRoyalties, initialSongs, initialBudgets, initialLockedDates, initialPublishedArticles, initialSaasSubscriptions, 
    initialPromoters, initialReports, initialInvoices, initialBandSettings, initialCashHoldings, initialMemberTransactions, 
    initialSavedFundingOpps, initialSavedResidencies 
} from './data/initialData';

type BackgroundTask = {
  id: string;
  name: string;
  startTime: number;
  estimatedDuration: number; // in seconds
};

const BackgroundTaskBar: React.FC<{ tasks: BackgroundTask[] }> = ({ tasks }) => {
  const [progress, setProgress] = useState<Record<string, { p: number; remaining: number }>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newProgress: Record<string, { p: number; remaining: number }> = {};
      tasks.forEach(task => {
        const elapsed = (now - task.startTime) / 1000;
        // Progress should not exceed 99% to indicate it's still running
        const calculatedProgress = Math.min((elapsed / task.estimatedDuration) * 100, 99);
        const timeRemaining = Math.max(0, Math.ceil(task.estimatedDuration - elapsed));
        newProgress[task.id] = { p: calculatedProgress, remaining: timeRemaining };
      });
      setProgress(newProgress);
    }, 500);

    return () => clearInterval(interval);
  }, [tasks]);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-64 right-0 bg-brand-bg-card border-b border-brand-border backdrop-blur-sm text-white p-2 z-50 flex items-center gap-6">
      {tasks.map(task => {
        const currentProgress = progress[task.id] || { p: 0, remaining: task.estimatedDuration };
        return (
          <div key={task.id} className="flex items-center gap-3 w-80">
            <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse flex-shrink-0"></div>
            <div className="flex-grow overflow-hidden">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-medium text-xs truncate" title={task.name}>{task.name}</span>
                <span className="text-gray-400 text-xs flex-shrink-0 ml-2">{currentProgress.remaining}s left</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-1.5">
                <div 
                  className="bg-brand-accent h-1.5 rounded-full transition-all duration-500 ease-linear" 
                  style={{ width: `${currentProgress.p}%` }}>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  );
};

const defaultShowActions = [
  'Publish on Bandsintown',
  'Create Facebook event',
  'Send to Berlin gigs group',
  'Schedule social post plan',
  'Confirm venue and rider',
  'Share reminder with the crew',
];

const ensureBandStateIntegrity = <T,>(bandId: string, value: T | undefined, fallback: T): T => value ?? fallback;

const addDays = (dateString: string, offsetDays: number) => {
  const base = new Date(dateString || new Date().toISOString());
  base.setDate(base.getDate() + offsetDays);
  return base.toISOString().slice(0, 10);
};

const parseShowEntries = (value: string) => {
  if (!value.trim()) return [];

  return value
    .split(/\n|;|\|/)
    .map(item => item.trim())
    .filter(Boolean)
    .map((item, index) => {
      const dateMatch = item.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|[A-Z][a-z]{2,9}\s+\d{1,2},?\s+\d{4})/);
      const date = dateMatch ? new Date(dateMatch[0]).toISOString().slice(0, 10) : addDays(new Date().toISOString().slice(0, 10), index * 7 + 14);
      const title = item.replace(dateMatch?.[0] || '', '').replace(/^[\-•\s]+/, '').trim() || `Show ${index + 1}`;
      return { title: title || `Show ${index + 1}`, date };
    });
};

const generateBandPlan = (band: BandProfile, assignedUserId: string) => {
  const tasks: Task[] = [];
  const events: CalendarEvent[] = [];
  const showActions = band.showActions?.length ? band.showActions : defaultShowActions;
  const releaseDate = band.nextReleaseDate || addDays(new Date().toISOString().slice(0, 10), 30);

  if (band.releaseStatus === 'upcoming' || band.releaseStatus === 'in-production' || band.releaseStatus === 'released') {
    const releaseTasks = [
      { title: 'Finalize release assets and master', dueDate: addDays(releaseDate, -21) },
      { title: 'Confirm launch day promo schedule', dueDate: addDays(releaseDate, -14) },
      { title: 'Prepare press and playlist outreach', dueDate: addDays(releaseDate, -10) },
      { title: 'Launch teaser and pre-save campaign', dueDate: addDays(releaseDate, -7) },
      { title: 'Publish release-day social plan and reminders', dueDate: addDays(releaseDate, 0) },
      { title: 'Check release merch and sales materials', dueDate: addDays(releaseDate, -3) },
    ];

    tasks.push(...releaseTasks.map(task => ({
      id: `release-task-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title: `${band.releaseTitle || band.name} — ${task.title}`,
      assignedToId: assignedUserId || 'system',
      dueDate: task.dueDate,
      status: TaskStatus.ToDo,
      priority: TaskPriority.High,
      projectId: `band-plan-${band.id}`,
      bandId: band.id,
      notes: 'Generated from band onboarding and release status.',
    })));

    events.push({
      id: `release-event-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title: `${band.releaseTitle || band.name} release`,
      date: releaseDate,
      type: EventType.ReleaseDate,
      notes: 'Release launch timeline and reminders generated from onboarding data.',
      attendeeIds: [],
      bandId: band.id,
    });
  }

  const showEntries = parseShowEntries(band.upcomingShows || band.gigsUpcoming || '');
  if (showEntries.length > 0) {
    showEntries.forEach((show, index) => {
      events.push({
        id: `show-event-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        title: `${band.name} — ${show.title}`,
        date: show.date,
        type: EventType.Gig,
        notes: `Show checklist: ${showActions.join('; ')}`,
        attendeeIds: [],
        bandId: band.id,
      });

      showActions.forEach((action, actionIndex) => {
        tasks.push({
          id: `show-task-${Date.now()}-${index}-${actionIndex}`,
          title: `${action} — ${show.title}`,
          assignedToId: assignedUserId || 'system',
          dueDate: addDays(show.date, -Math.max(7 - actionIndex, 2)),
          status: TaskStatus.ToDo,
          priority: actionIndex < 2 ? TaskPriority.High : TaskPriority.Medium,
          projectId: `band-plan-${band.id}`,
          bandId: band.id,
          notes: 'Generated from the band onboarding checklist for upcoming live shows.',
        });
      });
    });
  } else if (showActions.length) {
    const fallbackDate = addDays(new Date().toISOString().slice(0, 10), 12);
    showActions.forEach((action, actionIndex) => {
      tasks.push({
        id: `show-task-${Date.now()}-${actionIndex}`,
        title: `${action} — Live promotion plan`,
        assignedToId: assignedUserId || 'system',
        dueDate: addDays(fallbackDate, -Math.max(7 - actionIndex, 2)),
        status: TaskStatus.ToDo,
        priority: actionIndex < 2 ? TaskPriority.High : TaskPriority.Medium,
        projectId: `band-plan-${band.id}`,
        bandId: band.id,
        notes: 'Generated from the band onboarding checklist for upcoming live promo work.',
      });
    });
  }

  return { tasks, events };
};

const NewBandModal: React.FC<{
    onClose: () => void;
    onSave: (band: Omit<BandProfile, 'id'>) => void;
    initialBand?: BandProfile | null;
}> = ({ onClose, onSave, initialBand }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState(initialBand?.name || '');
    const [genre, setGenre] = useState(initialBand?.genre || '');
    const [city, setCity] = useState(initialBand?.city || '');
    const [country, setCountry] = useState(initialBand?.country || '');
    const [currentStatus, setCurrentStatus] = useState<BandProfile['currentStatus']>(initialBand?.currentStatus || 'planning');
    const [releaseStatus, setReleaseStatus] = useState<BandProfile['releaseStatus']>(initialBand?.releaseStatus || 'no-release');
    const [releaseTitle, setReleaseTitle] = useState(initialBand?.releaseTitle || '');
    const [nextReleaseDate, setNextReleaseDate] = useState(initialBand?.nextReleaseDate || '');
    const [tourStatus, setTourStatus] = useState<BandProfile['tourStatus']>(initialBand?.tourStatus || 'none');
    const [gigsUpcoming, setGigsUpcoming] = useState(initialBand?.gigsUpcoming || initialBand?.upcomingShows || '');
    const [upcomingShows, setUpcomingShows] = useState(initialBand?.upcomingShows || initialBand?.gigsUpcoming || '');
    const [showActions, setShowActions] = useState<string[]>(initialBand?.showActions?.length ? initialBand.showActions : defaultShowActions);
    const [focus, setFocus] = useState(initialBand?.focus || '');
    const [bio, setBio] = useState(initialBand?.bio || '');
    const [notes, setNotes] = useState(initialBand?.notes || '');

    const isEditMode = Boolean(initialBand);
    const canContinue = name.trim() && genre.trim();

    const buildBandData = (): Omit<BandProfile, 'id'> => ({
        name: name.trim() || 'My Band',
        genre: genre.trim() || 'Unspecified',
        city: city.trim(),
        country: country.trim(),
        currentStatus,
        releaseStatus,
        releaseTitle: releaseTitle.trim(),
        nextReleaseDate: nextReleaseDate.trim(),
        tourStatus,
        gigsUpcoming: gigsUpcoming.trim(),
        upcomingShows: upcomingShows.trim() || gigsUpcoming.trim(),
        showActions,
        releaseChecklist: releaseStatus === 'upcoming' || releaseStatus === 'in-production' || releaseStatus === 'released'
          ? [
              'Finalize release assets and master',
              'Confirm launch-day promo schedule',
              'Prepare press and playlist outreach',
              'Launch teaser and pre-save campaign',
              'Check merch and sales materials',
            ]
          : [],
        focus: focus.trim(),
        bio: bio.trim(),
        notes: notes.trim(),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() && !genre.trim()) return;
        onSave(buildBandData());
        onClose();
    };

    const handleSkip = () => {
        onSave(buildBandData());
        onClose();
    };

    const statusOptions = [
        { value: 'planning', label: 'Planning' },
        { value: 'recording', label: 'Recording' },
        { value: 'releasing', label: 'Releasing' },
        { value: 'touring', label: 'Touring' },
        { value: 'promoting', label: 'Promoting' },
        { value: 'paused', label: 'Paused' },
    ];

    const releaseOptions = [
        { value: 'no-release', label: 'No release yet' },
        { value: 'released', label: 'Released music' },
        { value: 'upcoming', label: 'Upcoming release' },
        { value: 'in-production', label: 'In production' },
    ];

    const tourOptions = [
        { value: 'none', label: 'No active tour' },
        { value: 'active', label: 'Touring now' },
        { value: 'upcoming', label: 'Tour coming soon' },
        { value: 'planning', label: 'Planning a tour' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-brand-bg-card rounded-xl shadow-2xl p-6 w-full max-w-2xl">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-medium">{isEditMode ? 'Band Profile Interview' : 'Band Setup Interview'}</h2>
                        <p className="text-sm text-gray-400">Tell us where the band is right now so the system can start with real context.</p>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-gray-400">Step {step} / 4</span>
                </div>
                <div className="mb-6 h-2 rounded-full bg-gray-700 overflow-hidden">
                    <div className="h-full bg-brand-accent transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }}></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {step === 1 && (
                        <>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Band / project name</label>
                                <input type="text" placeholder="ex: The Velvet Echo" value={name} onChange={e => setName(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent" required />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Genre / sound</label>
                                <input type="text" placeholder="ex: indie rock, dream pop, shoegaze" value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">City</label>
                                    <input type="text" placeholder="ex: São Paulo" value={city} onChange={e => setCity(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Country</label>
                                    <input type="text" placeholder="ex: Brazil" value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent" />
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">What best describes the band right now?</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {statusOptions.map(option => (
                                        <button
                                            type="button"
                                            key={option.value}
                                            onClick={() => setCurrentStatus(option.value as BandProfile['currentStatus'])}
                                            className={`rounded-lg border px-3 py-2 text-sm transition ${currentStatus === option.value ? 'border-brand-accent bg-brand-accent/10 text-white' : 'border-brand-border bg-brand-bg-content text-gray-300 hover:border-brand-accent/40'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Release status</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {releaseOptions.map(option => (
                                        <button
                                            type="button"
                                            key={option.value}
                                            onClick={() => setReleaseStatus(option.value as BandProfile['releaseStatus'])}
                                            className={`rounded-lg border px-3 py-2 text-sm transition ${releaseStatus === option.value ? 'border-brand-accent bg-brand-accent/10 text-white' : 'border-brand-border bg-brand-bg-content text-gray-300 hover:border-brand-accent/40'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {(releaseStatus === 'released' || releaseStatus === 'upcoming' || releaseStatus === 'in-production') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm text-gray-300 mb-1">Release title</label>
                                        <input type="text" placeholder="ex: Afterglow EP" value={releaseTitle} onChange={e => setReleaseTitle(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent" />
                                    </div>
                                    {(releaseStatus === 'upcoming' || releaseStatus === 'in-production') && (
                                        <div className="md:col-span-2">
                                            <label className="block text-sm text-gray-300 mb-1">Expected date</label>
                                            <input type="date" value={nextReleaseDate} onChange={e => setNextReleaseDate(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Tour / live status</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {tourOptions.map(option => (
                                        <button
                                            type="button"
                                            key={option.value}
                                            onClick={() => setTourStatus(option.value as BandProfile['tourStatus'])}
                                            className={`rounded-lg border px-3 py-2 text-sm transition ${tourStatus === option.value ? 'border-brand-accent bg-brand-accent/10 text-white' : 'border-brand-border bg-brand-bg-content text-gray-300 hover:border-brand-accent/40'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Upcoming shows / current live calendar</label>
                                <textarea rows={4} placeholder="Example: Berlin — 12 Oct 2026 — venue / Hamburg — 15 Oct 2026 — club / 1 festival in November" value={upcomingShows || gigsUpcoming} onChange={e => { setUpcomingShows(e.target.value); setGigsUpcoming(e.target.value); }} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent resize-none" />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Default show actions to keep on the task list</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {defaultShowActions.map(option => {
                                        const active = showActions.includes(option);
                                        return (
                                            <button
                                                type="button"
                                                key={option}
                                                onClick={() => setShowActions(prev => prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option])}
                                                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${active ? 'border-brand-accent bg-brand-accent/10 text-white' : 'border-brand-border bg-brand-bg-content text-gray-300 hover:border-brand-accent/40'}`}
                                            >
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}

                    {step === 4 && (
                        <>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Current focus</label>
                                <input type="text" placeholder="ex: festival run, new EP, merch launch, booking support" value={focus} onChange={e => setFocus(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Band story / short bio</label>
                                <textarea rows={5} placeholder="Tell the story of the band, key influences, recent milestones and what matters right now." value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Extra notes</label>
                                <textarea rows={3} placeholder="Use this for the next steps, booking goals, team info or internal notes." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent resize-none" />
                            </div>
                            <div className="rounded-lg border border-brand-border bg-brand-bg-content/50 p-3 text-sm text-gray-300">
                                You can always skip and fill this later from the subtle edit icon next to the band name.
                            </div>
                        </>
                    )}

                    <div className="flex justify-between gap-4 pt-4">
                        <button type="button" onClick={handleSkip} className="text-gray-400 hover:text-white font-medium py-2 px-4 rounded-lg">Skip for now</button>
                        {step < 4 ? (
                            <button type="button" onClick={() => canContinue && setStep(prev => prev + 1)} disabled={!canContinue} className="bg-brand-accent hover:bg-brand-accent-dark text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                        ) : (
                            <button type="submit" className="bg-brand-accent hover:bg-brand-accent-dark text-white font-medium py-2 px-4 rounded-lg">Save band</button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};


const CurrentUserSetupModal: React.FC<{ onSave: (user: { name: string; email: string; systemRole: 'Admin' | 'Member' | 'Manager'; primaryRole: string }) => void; }> = ({ onSave }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [primaryRole, setPrimaryRole] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSave({ name: name.trim(), email: email.trim(), systemRole: 'Admin', primaryRole: primaryRole.trim() || 'Band Member' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[90]">
      <div className="bg-brand-bg-card rounded-xl shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Welcome to Bandmate</h2>
        <p className="text-sm text-gray-400 mb-6">Before you begin, set up the current user. It is simple and does not require email confirmation for now.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Your name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg" placeholder="e.g. John Smith" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Your email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg" placeholder="you@email.com" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Primary role</label>
            <input type="text" value={primaryRole} onChange={e => setPrimaryRole(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg" placeholder="e.g. Vocals / Guitar / Manager" />
          </div>

          <button type="submit" className="w-full bg-brand-accent hover:bg-brand-accent-dark text-white font-bold py-3 rounded-lg">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // Fix: Initialize page state by splitting query params to ensure deep links work correctly on refresh
  const [page, setPage] = useState<Page>(() => (window.location.hash.substring(1).split('?')[0] || 'dashboard') as Page);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [isNewBandModalOpen, setIsNewBandModalOpen] = useState(false);
  const [editingBandId, setEditingBandId] = useState<string | null>(null);
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([]);
  
  // --- Centralized State Management ---
  // Core
  // SAFETY: the app now boots in a blank state by default. Demo placeholders were removed so the onboarding wizard can collect real band data instead of forcing fake content.
  const [bands, setBands] = useLocalStorage<BandProfile[]>('bands', []);
  const [activeBandId, setActiveBandId] = useLocalStorage<string>('activeBandId', bands[0]?.id || '');
  const [users, setUsers] = useLocalStorage<User[]>('users', initialUsers);
  const [currentUserId, setCurrentUserId] = useLocalStorage<string>('currentUserId', users[0]?.id || '');
  const currentUser = useMemo(() => users.find(u => u.id === currentUserId) || users[0] || null, [users, currentUserId]);
  const resolvedActiveBandId = useMemo(() => resolveValidBandId(bands, activeBandId), [bands, activeBandId]);
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', initialTasks);
  const [projects, setProjects] = useLocalStorage<ProductionProject[]>('productionProjects', initialProductionProjects);
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>('events', initialEvents);
  const [lockedDates, setLockedDates] = useLocalStorage<LockedDate[]>('lockedDates', initialLockedDates);

  // Business
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', initialTransactions);
  const [memberTransactions, setMemberTransactions] = useLocalStorage<MemberTransaction[]>('memberTransactions', initialMemberTransactions);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', initialInvoices);
  const [emailTemplates, setEmailTemplates] = useLocalStorage<EmailTemplate[]>('emailTemplates', []);
  // Band Settings Map - Keyed by Band ID to prevent data leakage
  const fallbackBandId = bands[0]?.id || 'band-1';
  const [bandSettingsMap, setBandSettingsMap] = useLocalStorage<{[bandId: string]: BandSettings}>('bandSettingsMap', {
      [fallbackBandId]: initialBandSettings
  });
  const [royalties, setRoyalties] = useLocalStorage<RoyaltyStatement[]>('royalties', initialRoyalties);
  const [gigs, setGigs] = useLocalStorage<Gig[]>('gigs', initialGigs);
  const [tours, setTours] = useLocalStorage<Tour[]>('tours', initialTours);
  const [merch, setMerch] = useLocalStorage<MerchItem[]>('merch', initialMerch);
  const [pressContacts, setPressContacts] = useLocalStorage<PressContact[]>('contacts', initialPressContacts);
  const [radioContacts, setRadioContacts] = useLocalStorage<RadioContact[]>('radioContacts', initialRadioContacts);
  const [labelContacts, setLabelContacts] = useLocalStorage<LabelContact[]>('labelContacts', initialLabelContacts);
  const [campaigns, setCampaigns] = useLocalStorage<EmailCampaign[]>('campaigns', initialCampaigns);
  const [fanContacts, setFanContacts] = useLocalStorage<FanContact[]>('fanContacts', initialFanContacts);
  const [promoters, setPromoters] = useLocalStorage<Promoter[]>('promoters', initialPromoters);
  const [venues, setVenues] = useLocalStorage<Venue[]>('venues', initialVenues);
  const [openingSlots, setOpeningSlots] = useLocalStorage<OpeningSlotOpportunity[]>('openingSlots', initialOpeningSlots);
  
  // Financials Specific - Mapped by Band ID for isolation
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('budgets', initialBudgets);
  const [splitsMap, setSplitsMap] = useLocalStorage<{[bandId: string]: {[userId: string]: number}}>('splitsMap', {
      [fallbackBandId]: initialUsers.reduce((acc, user) => ({ ...acc, [user.id]: initialUsers.length ? 100 / initialUsers.length : 0 }), {})
  });
  const [cashOnHandMap, setCashOnHandMap] = useLocalStorage<{[bandId: string]: number}>('cashOnHandMap', {
      [fallbackBandId]: 0
  });

  // Creation
  const [songs, setSongs] = useLocalStorage<Song[]>('productionSongs', initialSongs);
  const [releases, setReleases] = useLocalStorage<Release[]>('releases', initialReleases);
  const [setlists, setSetlists] = useLocalStorage<Setlist[]>('setlists', initialSetlists);
  
  // Growth
  const [goals, setGoals] = useLocalStorage<BandGoal[]>('goals', initialGoals);
  const [fundingApps, setFundingApps] = useLocalStorage<FundingApplication[]>('fundingApplications', initialFundingApplications);
  const [savedFundingOpps, setSavedFundingOpps] = useLocalStorage<SavedFundingOpportunity[]>('savedFundingOpps', initialSavedFundingOpps);
  const [savedResidencies, setSavedResidencies] = useLocalStorage<SavedResidency[]>('savedResidencies', initialSavedResidencies);
  const [festivals, setFestivals] = useLocalStorage<Festival[]>('festivals', initialFestivals);
  const [collaborators, setCollaborators] = useLocalStorage<Collaborator[]>('collaborators', initialCollaborators);

  // Management
  const [media, setMedia] = useLocalStorage<MediaAsset[]>('media', initialMediaAssets);
  const [articles, setArticles] = useLocalStorage<PublishedArticle[]>('articles', initialPublishedArticles);

  // EPK-specific state - Mapped by Band ID
  const [bandBioMap, setBandBioMap] = useLocalStorage<{[bandId: string]: string}>('bandBiosMap', {
      [fallbackBandId]: ""
  });
  const [epkPhotoIdMap, setEpkPhotoIdMap] = useLocalStorage<{[bandId: string]: string}>('epkPhotoIdsMap', {});
  const [epkVideoIdMap, setEpkVideoIdMap] = useLocalStorage<{[bandId: string]: string}>('epkVideoIdsMap', {});

  // --- Derived State & Setters for Active Band ---
  
  const splits = useMemo(() => splitsMap[resolvedActiveBandId] || {}, [splitsMap, resolvedActiveBandId]);
  const setSplits = useCallback((value: any) => {
      setSplitsMap(prev => {
          const currentVal = prev[resolvedActiveBandId] || {};
          const newVal = typeof value === 'function' ? value(currentVal) : value;
          return { ...prev, [resolvedActiveBandId]: newVal };
      });
  }, [resolvedActiveBandId, setSplitsMap]);

  const cashOnHand = useMemo(() => cashOnHandMap[resolvedActiveBandId] ?? 0, [cashOnHandMap, resolvedActiveBandId]);
  const setCashOnHand = useCallback((value: any) => {
      setCashOnHandMap(prev => {
          const currentVal = prev[resolvedActiveBandId] ?? 0;
          const newVal = typeof value === 'function' ? value(currentVal) : value;
          return { ...prev, [resolvedActiveBandId]: newVal };
      });
  }, [resolvedActiveBandId, setCashOnHandMap]);

  useEffect(() => {
    setBandSettingsMap(prev => {
      const next = { ...prev };
      bands.forEach((band) => {
        next[band.id] = ensureBandStateIntegrity(band.id, next[band.id], { ...initialBandSettings, issuerName: band.name });
      });
      return next;
    });

    setCashOnHandMap(prev => {
      const next = { ...prev };
      bands.forEach((band) => {
        if (typeof next[band.id] !== 'number') {
          next[band.id] = 0;
        }
      });
      return next;
    });

    setSplitsMap(prev => {
      const next = { ...prev };
      bands.forEach((band) => {
        next[band.id] = ensureBandStateIntegrity(band.id, next[band.id], users.reduce((acc, user) => ({ ...acc, [user.id]: users.length ? 100 / users.length : 0 }), {}));
      });
      return next;
    });

    setBandBioMap(prev => {
      const next = { ...prev };
      bands.forEach((band) => {
        next[band.id] = ensureBandStateIntegrity(band.id, next[band.id], band.bio || '');
      });
      return next;
    });
  }, [bands, users, setBandSettingsMap, setCashOnHandMap, setSplitsMap, setBandBioMap]);

  const bandBio = useMemo(() => bandBioMap[resolvedActiveBandId] || "", [bandBioMap, resolvedActiveBandId]);
  const setBandBio = useCallback((value: any) => {
      setBandBioMap(prev => {
          const currentVal = prev[resolvedActiveBandId] || "";
          const newVal = typeof value === 'function' ? value(currentVal) : value;
          return { ...prev, [resolvedActiveBandId]: newVal };
      });
  }, [resolvedActiveBandId, setBandBioMap]);

  const epkPhotoId = useMemo(() => epkPhotoIdMap[resolvedActiveBandId] || "", [epkPhotoIdMap, resolvedActiveBandId]);
  const setEpkPhotoId = useCallback((value: any) => {
      setEpkPhotoIdMap(prev => {
          const currentVal = prev[resolvedActiveBandId] || "";
          const newVal = typeof value === 'function' ? value(currentVal) : value;
          return { ...prev, [resolvedActiveBandId]: newVal };
      });
  }, [resolvedActiveBandId, setEpkPhotoIdMap]);

  const epkVideoId = useMemo(() => epkVideoIdMap[resolvedActiveBandId] || "", [epkVideoIdMap, resolvedActiveBandId]);
  const setEpkVideoId = useCallback((value: any) => {
      setEpkVideoIdMap(prev => {
          const currentVal = prev[resolvedActiveBandId] || "";
          const newVal = typeof value === 'function' ? value(currentVal) : value;
          return { ...prev, [resolvedActiveBandId]: newVal };
      });
  }, [resolvedActiveBandId, setEpkVideoIdMap]);

  const bandSettings = useMemo(() => bandSettingsMap[resolvedActiveBandId] || initialBandSettings, [bandSettingsMap, resolvedActiveBandId]);
  const setBandSettings = useCallback((value: any) => {
      setBandSettingsMap(prev => {
          const currentVal = prev[resolvedActiveBandId] || initialBandSettings;
          const newVal = typeof value === 'function' ? value(currentVal) : value;
          return { ...prev, [resolvedActiveBandId]: newVal };
      });
  }, [resolvedActiveBandId, setBandSettingsMap]);

  // Search Persistence State - for storing search results across navigation
  interface SearchCacheItem {
    searchTerm: string;
    source: 'press' | 'radio' | 'labels' | 'funding' | 'festivals' | 'venues' | 'other';
    results: any[];
    timestamp: number;
  }
  
  const [searchCache, setSearchCache] = useLocalStorage<SearchCacheItem[]>('searchCache', []);
  
  const saveSearchResults = useCallback((searchTerm: string, source: string, results: any[]) => {
    setSearchCache(prev => {
      const filtered = prev.filter(item => !(item.source === source && item.searchTerm === searchTerm));
      return [{
        searchTerm,
        source: source as any,
        results,
        timestamp: Date.now()
      }, ...filtered].slice(0, 20); // Keep only last 20 searches
    });
  }, [setSearchCache]);

  const getSearchResults = useCallback((source: string, searchTerm?: string) => {
    if (!searchTerm) return null;
    return searchCache.find(item => item.source === source && item.searchTerm === searchTerm);
  }, [searchCache]);


  const handleBandChange = (id: string) => {
    setActiveBandId(id);
  };

  const handleCreateCurrentUser = ({ name, email, systemRole, primaryRole }: { name: string; email: string; systemRole: 'Admin' | 'Member' | 'Manager'; primaryRole: string }) => {
    const normalizedEmail = email.trim();
    const existingUser = users.find(user => user.email.toLowerCase() === normalizedEmail.toLowerCase());
    const effectiveUser = existingUser || {
      id: `u-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      systemRole,
      primaryRole: primaryRole.trim() || 'Band Member',
      secondaryRoles: [],
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(normalizedEmail)}`,
    } as User;

    if (!existingUser) {
      setUsers(prev => [...prev, effectiveUser]);
    }
    setCurrentUserId(effectiveUser.id);
  };
  
  const handleSaveBand = (bandData: Omit<BandProfile, 'id'>) => {
      const normalizedBand = {
          ...bandData,
          name: bandData.name?.trim() || 'My Band',
          genre: bandData.genre?.trim() || 'Unspecified',
          city: bandData.city?.trim() || '',
          country: bandData.country?.trim() || '',
          focus: bandData.focus?.trim() || '',
          bio: bandData.bio?.trim() || '',
          notes: bandData.notes?.trim() || '',
          releaseTitle: bandData.releaseTitle?.trim() || '',
          nextReleaseDate: bandData.nextReleaseDate?.trim() || '',
          gigsUpcoming: bandData.gigsUpcoming?.trim() || '',
          upcomingShows: bandData.upcomingShows?.trim() || bandData.gigsUpcoming?.trim() || '',
          showActions: bandData.showActions?.length ? bandData.showActions : defaultShowActions,
          releaseChecklist: bandData.releaseChecklist?.length ? bandData.releaseChecklist : [],
      };

      const assignedUserId = currentUserId || users[0]?.id || 'system';
      const plan = generateBandPlan({ id: editingBandId || `b-${Date.now()}`, ...normalizedBand } as BandProfile, assignedUserId);

      if (editingBandId) {
          setBands(prev => prev.map(band =>
              band.id === editingBandId ? { ...band, ...normalizedBand } : band
          ));
          setTasks(prev => [
            ...prev.filter(task => task.bandId !== editingBandId),
            ...plan.tasks.filter(task => task.bandId === editingBandId)
          ]);
          setEvents(prev => [
            ...prev.filter(event => event.bandId !== editingBandId),
            ...plan.events.filter(event => event.bandId === editingBandId)
          ]);
          setActiveBandId(editingBandId);
          setEditingBandId(null);
          setIsNewBandModalOpen(false);
          return;
      }

      const newBand: BandProfile = {
          id: `b-${Date.now()}`,
          ...normalizedBand,
      };
      setBands(prev => [...prev, newBand]);
      setTasks(prev => [
        ...prev.filter(task => task.bandId !== newBand.id),
        ...plan.tasks.filter(task => task.bandId === newBand.id)
      ]);
      setEvents(prev => [
        ...prev.filter(event => event.bandId !== newBand.id),
        ...plan.events.filter(event => event.bandId === newBand.id)
      ]);
      
          const newBandSplits = makeEqualSplit(users.map((user) => user.id));

      setCashOnHandMap(prev => ({...prev, [newBand.id]: 0}));
      setSplitsMap(prev => ({...prev, [newBand.id]: newBandSplits}));
      setBandBioMap(prev => ({...prev, [newBand.id]: normalizedBand.bio || `Welcome to ${newBand.name}.`}));
      setBandSettingsMap(prev => ({...prev, [newBand.id]: { ...initialBandSettings, issuerName: newBand.name }}));
      
      setActiveBandId(newBand.id);
      setEditingBandId(null);
      setIsNewBandModalOpen(false);
  };

  useEffect(() => {
    ensureStorageVersion();
  }, []);

  useEffect(() => {
    if (bands.length === 0) {
      setIsNewBandModalOpen(true);
      setActiveBandId('');
      return;
    }

    if (!bands.some((band) => band.id === activeBandId)) {
      setActiveBandId(bands[0].id);
    }
  }, [bands, activeBandId, setActiveBandId]);

  useEffect(() => {
    if (users.length === 0) {
      setCurrentUserId('');
      return;
    }

    const nextUserId = resolveValidUserId(users, currentUserId);
    if (nextUserId !== currentUserId) {
      setCurrentUserId(nextUserId);
    }
  }, [users, currentUserId, setCurrentUserId]);

  useEffect(() => {
    const validIds = validBandIds(bands);

    setTasks((prev) => sanitizeBandScopedList(prev, validIds));
    setEvents((prev) => sanitizeBandScopedList(prev, validIds));
    setTransactions((prev) => sanitizeBandScopedList(prev, validIds));
    setMemberTransactions((prev) => sanitizeBandScopedList(prev, validIds));
    setMerch((prev) => sanitizeBandScopedList(prev, validIds));
    setReleases((prev) => sanitizeBandScopedList(prev, validIds));
    setGigs((prev) => sanitizeBandScopedList(prev, validIds));
    setTours((prev) => sanitizeBandScopedList(prev, validIds));
    setGoals((prev) => sanitizeBandScopedList(prev, validIds));
    setFundingApps((prev) => sanitizeBandScopedList(prev, validIds));
    setFestivals((prev) => sanitizeBandScopedList(prev, validIds));
    setMedia((prev) => sanitizeBandScopedList(prev, validIds));
    setArticles((prev) => sanitizeBandScopedList(prev, validIds));
    setSongs((prev) => sanitizeBandScopedList(prev, validIds));
    setCampaigns((prev) => sanitizeBandScopedList(prev, validIds));
    setPromoters((prev) => sanitizeBandScopedList(prev, validIds));
    setFanContacts((prev) => sanitizeBandScopedList(prev, validIds));
    setPressContacts((prev) => sanitizeBandScopedList(prev, validIds));
    setRadioContacts((prev) => sanitizeBandScopedList(prev, validIds));
    setLabelContacts((prev) => sanitizeBandScopedList(prev, validIds));
  }, [bands, setTasks, setEvents, setTransactions, setMemberTransactions, setMerch, setReleases, setGigs, setTours, setGoals, setFundingApps, setFestivals, setMedia, setArticles, setSongs, setCampaigns, setPromoters, setFanContacts, setPressContacts, setRadioContacts, setLabelContacts]);

  // Effect for hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      setPage((window.location.hash.substring(1).split('?')[0] || 'dashboard') as Page);
    };
    window.addEventListener('hashchange', handleHashChange);
    // Set initial page in case there's a hash on load
    handleHashChange();
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  // Effect for background task management
  useEffect(() => {
    const handleStartTask = (e: Event) => {
      const { id, name, estimatedDuration } = (e as CustomEvent).detail;
      // Use a default duration if not provided
      setBackgroundTasks(prev => [...prev, { id, name, startTime: Date.now(), estimatedDuration: estimatedDuration || 30 }]);
    };

    const handleEndTask = (e: Event) => {
      const { id } = (e as CustomEvent).detail;
      setBackgroundTasks(prev => prev.filter(task => task.id !== id));
    };

    window.addEventListener('start-task', handleStartTask);
    window.addEventListener('end-task', handleEndTask);

    return () => {
      window.removeEventListener('start-task', handleStartTask);
      window.removeEventListener('end-task', handleEndTask);
    };
  }, []);

  // Effect to handle scheduled campaigns & follow-ups
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCampaigns(prevCampaigns => {
        let campaignsUpdated = false;
        const updatedCampaigns = prevCampaigns.map(c => {
          let campaign = { ...c };
          let hasChanged = false;
          
          // Handle initial send
          if (campaign.status === 'Scheduled' && campaign.scheduledDate && new Date(campaign.scheduledDate) <= now) {
            hasChanged = true;
            // Simulate stats on send
            const openRate = Math.floor(Math.random() * (75 - 25 + 1)) + 25;
            const clickRate = Math.floor(Math.random() * (openRate * 0.4 - 2 + 1)) + 2;
            campaign = {
              ...campaign,
              status: 'Sent',
              sentDate: new Date().toISOString(),
              openRate,
              clickRate,
            };
          }
          
          // Handle follow-up send
          if (campaign.status === 'Sent' && campaign.sentDate && campaign.followUp && !campaign.followUpSentDate) {
              const sentDate = new Date(campaign.sentDate);
              // Create a new date object to avoid mutating the original `sentDate`
              const followUpDate = new Date(sentDate);
              followUpDate.setDate(followUpDate.getDate() + campaign.followUp.delayDays);
              if (now >= followUpDate) {
                  hasChanged = true;
                  campaign = { ...campaign, followUpSentDate: now.toISOString() };
              }
          }
          
          if(hasChanged) campaignsUpdated = true;
          return campaign;
        });
        
        return campaignsUpdated ? updatedCampaigns : prevCampaigns;
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [setCampaigns]);


  const renderPage = () => {
    const allProps = { activeBandId, bands, users, setUsers, setBands, emailTemplates, setEmailTemplates };
    
    switch (page) {
      case 'dashboard':
        return <Dashboard 
            {...allProps} 
            setActivePage={(p: Page) => window.location.hash = p} 
            tasks={tasks} setTasks={setTasks}
            projects={projects}
            events={events} setEvents={setEvents}
            transactions={transactions}
            merch={merch}
            releases={releases}
            tours={tours}
            pressContacts={pressContacts}
            labelContacts={labelContacts}
            fundingApplications={fundingApps}
            festivals={festivals}
            savedFestivals={festivals} setSavedFestivals={setFestivals}
            venues={venues}
            openingSlots={openingSlots}
        />;
      case 'projects':
        return <Projects {...allProps} tasks={tasks} setTasks={setTasks} projects={projects} setProjects={setProjects} releases={releases} setReleases={setReleases} />;
      case 'calendar':
        return <Calendar 
            {...allProps} 
            events={events} setEvents={setEvents} 
            tasks={tasks} setTasks={setTasks}
            releases={releases} 
            tours={tours} 
            festivals={festivals} setFestivals={setFestivals}
            fundingApplications={fundingApps} setFundingApplications={setFundingApps}
            lockedDates={lockedDates} 
            projects={projects} 
        />;
      case 'reports':
        return <Reports 
            {...allProps} 
            tasks={tasks} 
            transactions={transactions} 
            tours={tours} 
            releases={releases} 
            projects={projects} 
        />;
      case 'financials':
        return <Financials 
            {...allProps} 
            transactions={transactions} setTransactions={setTransactions} 
            budgets={budgets} setBudgets={setBudgets}
            splits={splits} setSplits={setSplits}
            cashOnHand={cashOnHand} setCashOnHand={setCashOnHand}
            merch={merch} setMerch={setMerch}
            memberTransactions={memberTransactions} setMemberTransactions={setMemberTransactions}
            users={users}
        />;
      case 'invoices':
        return <Invoices {...allProps} invoices={invoices} bandSettings={bandSettings} />;
      case 'press':
        return <PressOutreach {...allProps} pressContacts={pressContacts} setPressContacts={setPressContacts} saveSearchResults={saveSearchResults} getSearchResults={getSearchResults} />;
      case 'radio':
        return <RadioOutreach {...allProps} radioContacts={radioContacts} setRadioContacts={setRadioContacts} saveSearchResults={saveSearchResults} getSearchResults={getSearchResults} />;
      case 'label':
        return <LabelReachout {...allProps} labelContacts={labelContacts} setLabelContacts={setLabelContacts} saveSearchResults={saveSearchResults} getSearchResults={getSearchResults} />;
      case 'merch':
        return <Merchandise {...allProps} merch={merch} setMerch={setMerch} transactions={transactions} setTransactions={setTransactions} cashOnHand={cashOnHand} setCashOnHand={setCashOnHand} />;
      case 'releases':
        return <Releases {...allProps} releases={releases} setReleases={setReleases} pressContacts={pressContacts} projects={projects} tasks={tasks} setTasks={setTasks} />;
      case 'tours':
        return <Tours {...allProps} tours={tours} setTours={setTours} setlists={setlists} venues={venues} setVenues={setVenues} />;
      case 'setlists':
        return <Setlists {...allProps} setlists={setlists} setSetlists={setSetlists} />;
      case 'collaborators':
        return <Collaborators {...allProps} collaborators={collaborators} setCollaborators={setCollaborators} />;
      case 'resources':
        return <Resources />;
      case 'settings':
        return <Settings {...allProps} bandSettings={bandSettings} setBandSettings={setBandSettings} />;
      case 'production':
        return <Production {...allProps} songs={songs} setSongs={setSongs} projects={projects} setProjects={setProjects} tasks={tasks} setTasks={setTasks} />;
      case 'funding':
        return <Funding {...allProps} savedFundingOpps={savedFundingOpps} setSavedFundingOpps={setSavedFundingOpps} setEvents={setEvents} saveSearchResults={saveSearchResults} getSearchResults={getSearchResults} />;
      case 'residencies':
        return <Residencies {...allProps} events={events} setEvents={setEvents} savedResidencies={savedResidencies} setSavedResidencies={setSavedResidencies} />;
      case 'system-status':
        return <SystemStatus />;
      case 'festivals':
        return <Festivals {...allProps} events={events} setEvents={setEvents} savedFestivals={festivals} setSavedFestivals={setFestivals} />;
      case 'goals':
        return <Goals {...allProps} goals={goals} setGoals={setGoals} />;
      case 'media':
        return <MediaArchive {...allProps} media={media} setMedia={setMedia} />;
      case 'epk':
        return <EPK 
            {...allProps} 
            releases={releases} 
            media={media} 
            articles={articles} 
            tours={tours} 
            bandBio={bandBio} setBandBio={setBandBio}
            epkPhotoId={epkPhotoId} setEpkPhotoId={setEpkPhotoId}
            epkVideoId={epkVideoId} setEpkVideoId={setEpkVideoId}
        />;
      case 'royalties':
        return <Royalties {...allProps} royalties={royalties} setRoyalties={setRoyalties} />;
      case 'gigs':
        return <Gigs {...allProps} gigs={gigs} setGigs={setGigs} venues={venues} setVenues={setVenues} openingSlots={openingSlots} setOpeningSlots={setOpeningSlots} invoices={invoices} setInvoices={setInvoices} transactions={transactions} setTransactions={setTransactions} bandSettings={bandSettings} />;
      case 'campaigns':
        return <Campaigns {...allProps} campaigns={campaigns} setCampaigns={setCampaigns} pressContacts={pressContacts} venues={venues} promoters={promoters} labelContacts={labelContacts} radioContacts={radioContacts} fanContacts={fanContacts} projects={projects} />;
      case 'fanbase':
        return <Fanbase {...allProps} fanContacts={fanContacts} setFanContacts={setFanContacts} />;
      case 'stage':
        return <StagePlot {...allProps} />;
      case 'social':
        return <SocialStudio {...allProps} />;
      case 'sound-match':
        return <SoundMatch {...allProps} pressContacts={pressContacts} setPressContacts={setPressContacts} radioContacts={radioContacts} setRadioContacts={setRadioContacts} />;
      default:
        return <Dashboard 
            {...allProps} 
            setActivePage={(p: Page) => window.location.hash = p} 
            tasks={tasks} setTasks={setTasks}
            projects={projects}
            events={events} setEvents={setEvents}
            transactions={transactions}
            merch={merch}
            releases={releases}
            tours={tours}
            pressContacts={pressContacts}
            labelContacts={labelContacts}
            fundingApplications={fundingApps}
            festivals={festivals}
            savedFestivals={festivals} setSavedFestivals={setFestivals}
            venues={venues}
            openingSlots={openingSlots}
        />;
    }
  };

  return (
    <div className="flex min-h-screen bg-brand-bg-outer text-gray-200">
      <AIStatusWarning />
      <Sidebar 
        currentPage={page} 
        bands={bands}
        activeBandId={activeBandId}
        onBandChange={handleBandChange}
        onNewBandClick={() => { setEditingBandId(null); setIsNewBandModalOpen(true); }}
        onEditBandClick={() => { setEditingBandId(activeBandId); setIsNewBandModalOpen(true); }}
        onHelpClick={() => setIsHelpCenterOpen(true)}
        users={users}
        currentUser={currentUser || users[0] || null}
        setUsers={setUsers}
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative pt-16 bg-brand-bg-content m-4 rounded-lg">
        <BackgroundTaskBar tasks={backgroundTasks} />
        {renderPage()}
      </main>

      {/* AI Assistant */}
      <div className="fixed bottom-6 right-6 z-50">
          <button 
              onClick={() => setIsAiAssistantOpen(true)}
              className="bg-brand-accent text-white rounded-full p-4 shadow-lg hover:bg-brand-accent-dark transition-transform transform hover:scale-110"
              aria-label="Open AI Assistant"
          >
              <BotIcon className="h-6 w-6" />
          </button>
      </div>
      {(!currentUser || users.length === 0) && <CurrentUserSetupModal onSave={handleCreateCurrentUser} />}
      {isAiAssistantOpen && <AiAssistant onClose={() => setIsAiAssistantOpen(false)} 
        tasks={tasks} 
        events={events} 
        transactions={transactions} 
        merch={merch} 
        releases={releases} 
        tours={tours}
        activeBandId={activeBandId}
        bands={bands}
      />}
      {isNewBandModalOpen && <NewBandModal onClose={() => { setIsNewBandModalOpen(false); setEditingBandId(null); }} onSave={handleSaveBand} initialBand={editingBandId ? bands.find(band => band.id === editingBandId) ?? null : null} />}
      {isHelpCenterOpen && <HelpCenter isOpen={isHelpCenterOpen} onClose={() => setIsHelpCenterOpen(false)} />}
      <UserHintManager
        user={currentUser}
        page={page}
        bands={bands}
        merchCount={merch.filter(item => item.bandId === activeBandId).length}
        cashOnHand={cashOnHand}
        hasTransactions={transactions.some(item => item.bandId === activeBandId)}
      />
    </div>
  );
};

export default App;

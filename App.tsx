
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ensureStorageVersion, makeEqualSplit, resolveValidBandId, resolveValidUserId, sanitizeBandScopedList, validBandIds, STORAGE_VERSION, STORAGE_VERSION_KEY } from './state/appStateIntegrity';
import { canShowBandSetupPrompt, canSyncRemoteState, shouldUseRemoteState } from './state/appStateHydration';
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
import { BotIcon, UploadIcon } from './components/icons';
import type { Page, EmailCampaign, BandProfile, User, Task, ProductionProject, CalendarEvent, Transaction, MerchItem, Release, Tour, Setlist, Collaborator, PressContact, LabelContact, RadioContact, Venue, OpeningSlotOpportunity, FanContact, Gig, FundingApplication, Festival, BandGoal, MediaAsset, RoyaltyStatement, Song, Budget, LockedDate, PublishedArticle, SaasSubscription, Promoter, ReportConfig, Invoice, BandSettings, CashHolding, MemberTransaction, SavedFundingOpportunity, SavedResidency, EmailTemplate } from './types';
import { APP_PAGES, TaskStatus, TaskPriority, EventType, ContactTier } from './types';
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
import { BandMateWizard } from './components/BandMateWizard';
import { LinksDatabase } from './components/LinksDatabase';
import { AuthScreen } from './components/AuthScreen';
import useLocalStorage from './hooks/useLocalStorage';
import { authenticatedFetch, isSupabaseAuthConfigured, supabaseClient, type Session } from './services/supabaseClient';
import { setUserStorageScope, setUserScopedItem } from './state/userStorageScope';
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
    <div className="fixed top-0 left-0 lg:left-64 right-0 bg-brand-bg-card border-b border-brand-border backdrop-blur-sm text-white p-2 z-50 flex items-center gap-6 overflow-x-auto">
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
                                <input type="text" placeholder="e.g. The Velvet Echo" value={name} onChange={e => setName(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent" required />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Genre / sound</label>
                                <input type="text" placeholder="e.g. indie rock, dream pop, shoegaze" value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">City</label>
                                    <input type="text" placeholder="e.g. Berlin" value={city} onChange={e => setCity(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Country</label>
                                    <input type="text" placeholder="e.g. Germany" value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent" />
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

const APP_STATE_KEY = 'bandmate-app-state';

const PAGE_META: Record<Page, { title: string; summary: string }> = {
  dashboard: { title: 'Dashboard', summary: 'Band overview and the next move' },
  wizard: { title: 'Band setup', summary: 'Keep onboarding and plans moving' },
  links: { title: 'Links database', summary: 'Keep your key URLs and references ready' },
  projects: { title: 'Projects', summary: 'Production tasks and milestones' },
  calendar: { title: 'Calendar', summary: 'Shows, deadlines, and sessions' },
  financials: { title: 'Financials', summary: 'Cash, expenses, and ledger tracking' },
  press: { title: 'Press outreach', summary: 'Contacts and media outreach' },
  merch: { title: 'Merch', summary: 'Merch inventory and sales' },
  releases: { title: 'Releases', summary: 'Release strategy and planning' },
  tours: { title: 'Tours', summary: 'Tour planning and logistics' },
  setlists: { title: 'Setlists', summary: 'Set order and performance prep' },
  collaborators: { title: 'Collaborators', summary: 'People and teams in the project' },
  resources: { title: 'Resources', summary: 'Templates, notes, and references' },
  settings: { title: 'Settings', summary: 'Band settings and configuration' },
  production: { title: 'Production', summary: 'Songs, production tasks, and delivery' },
  funding: { title: 'Funding', summary: 'Opportunities and grant pipeline' },
  festivals: { title: 'Festivals', summary: 'Festivals and opportunities' },
  goals: { title: 'Goals', summary: 'Vision and tracking milestones' },
  media: { title: 'Media archive', summary: 'Artwork, assets, and media library' },
  epk: { title: 'EPK', summary: 'Press kit and artist profile' },
  royalties: { title: 'Royalties', summary: 'Revenue split and earnings' },
  gigs: { title: 'Gigs', summary: 'Bookings and venue coordination' },
  campaigns: { title: 'Campaigns', summary: 'Newsletter and outreach flow' },
  label: { title: 'Label reachout', summary: 'Labels, contacts, and outreach' },
  reports: { title: 'Reports', summary: 'Insights and summaries' },
  fanbase: { title: 'Fanbase', summary: 'Audience and fan management' },
  stage: { title: 'Stage plot', summary: 'Stage and show planning' },
  radio: { title: 'Radio outreach', summary: 'Radio pitching and media work' },
  social: { title: 'Social studio', summary: 'Social content and brand' },
  'sound-match': { title: 'Sound match', summary: 'Find similar artists and partners' },
  invoices: { title: 'Invoices', summary: 'Billing and payment tracking' },
  residencies: { title: 'Residencies', summary: 'Residency pipeline' },
  'system-status': { title: 'System status', summary: 'Operational health and app status' },
};

const normalizePage = (value?: string | null): Page => {
  const candidate = value?.split('?')[0]?.trim() || '';
  return APP_PAGES.includes(candidate as Page) ? (candidate as Page) : 'dashboard';
};

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Could not read the selected file.'));
  reader.readAsDataURL(file);
});

const readFileAsText = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Could not read the selected file as text.'));
  reader.readAsText(file);
});

const persistUploadedFile = async (file: File) => {
  const dataUrl = await readFileAsDataUrl(file);

  try {
    const response = await authenticatedFetch('/api/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, dataUrl, kind: 'general-intake' }),
    });

    const result = await response.json();
    if (!response.ok || result.status !== 'ok') {
      throw new Error(result?.message || 'Server upload failed');
    }

    const uploadedUrl = result.path ? `${window.location.origin}${result.path}` : dataUrl;
    return {
      url: uploadedUrl,
      storageMode: result.storageMode || 'server-local',
      contentType: result.contentType || file.type || 'application/octet-stream',
    };
  } catch (error) {
    if (import.meta.env.PROD) {
      throw error;
    }
    console.warn('Server-side file intake unavailable; saving file locally in browser memory instead.', error);
    return {
      url: dataUrl,
      storageMode: 'browser' as const,
      contentType: file.type || 'application/octet-stream',
    };
  }
};

const extractEmail = (value: string) => {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].trim() : '';
};

const parseCsvLikeRows = (text: string) => {
  if (!text.trim()) return [];
  return text
    .split(/\r?\n/)
    .map(line => line.split(/[\t,;|]/).map(cell => cell.trim()).filter(Boolean))
    .filter(row => row.length > 0 && (row.some(cell => /@/.test(cell)) || row.some(cell => /name|email|label|station|outlet|contact|city|country/i.test(cell))));
};

const classifyUpload = (file: File, text: string) => {
  const nameLower = `${file.name} ${text}`.toLowerCase();
  if (/\.(csv|tsv|txt)$/i.test(file.name) || /(mailing|newsletter|fan list|lead list|contacts|subscribers)/i.test(nameLower)) {
    return 'mailing-list';
  }
  if (/(label|record label|artists? manager|imprint|label list)/i.test(nameLower) || /^label/i.test(nameLower)) {
    return 'label-list';
  }
  if (/(radio|station|dj|music director|playlist)/i.test(nameLower)) {
    return 'radio-list';
  }
  if (/(press|journalist|outlet|publication|media|writer)/i.test(nameLower)) {
    return 'press-list';
  }
  if (/(invoice|receipt|expense|bank|cash|revenue|profit|p&l|ledger|financial|budget)/i.test(nameLower) || /(amount|total|invoice|expense)/i.test(text)) {
    return 'financial';
  }
  if (/\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name) || /^data:image\//.test(file.type || '')) {
    return 'media';
  }
  return 'document';
};

const BandmateWorkspace: React.FC = () => {
  // Fix: Initialize page state by splitting query params to ensure deep links work correctly on refresh
  const [page, setPage] = useState<Page>(() => normalizePage(window.location.hash.substring(1)));
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [isNewBandModalOpen, setIsNewBandModalOpen] = useState(false);
  const [isHydratingRemoteState, setIsHydratingRemoteState] = useState(true);
  const [databaseConfigured, setDatabaseConfigured] = useState(false);
  const [remoteSyncError, setRemoteSyncError] = useState('');
  const [hasResolvedRemoteConfig, setHasResolvedRemoteConfig] = useState(false);
  const [hasHydratedRemoteState, setHasHydratedRemoteState] = useState(false);
  const [remoteSnapshotIsTrusted, setRemoteSnapshotIsTrusted] = useState(false);
  const [editingBandId, setEditingBandId] = useState<string | null>(null);
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([]);
  const [globalUploadStatus, setGlobalUploadStatus] = useState<string | null>(null);
  const globalUploadInputRef = useRef<HTMLInputElement | null>(null);
  
  // --- Centralized State Management ---
  // Core
  // SAFETY: the app now boots in a blank state by default. Demo placeholders were removed so the onboarding wizard can collect real band data instead of forcing fake content.
  const [bands, setBands] = useLocalStorage<BandProfile[]>('bands', []);
  const [activeBandId, setActiveBandId] = useLocalStorage<string>('activeBandId', bands[0]?.id || '');
  const [users, setUsers] = useLocalStorage<User[]>('users', initialUsers);
  const [currentUserId, setCurrentUserId] = useLocalStorage<string>('currentUserId', users[0]?.id || '');
  const currentUser = useMemo(() => users.find(u => u.id === currentUserId) || users[0] || null, [users, currentUserId]);
  const resolvedActiveBandId = useMemo(() => resolveValidBandId(bands, activeBandId), [bands, activeBandId]);
  const resumeStorageKey = useMemo(() => `bandmate-resume-${resolvedActiveBandId || activeBandId || 'default'}`, [resolvedActiveBandId, activeBandId]);
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
      const next = Object.fromEntries(Object.entries(prev).map(([bandId, settings]) => {
        const safeSettings = { ...settings };
        delete safeSettings.mailchimpApiKey;
        return [bandId, safeSettings];
      }));
      bands.forEach((band) => {
        next[band.id] = ensureBandStateIntegrity(band.id, next[band.id], { ...initialBandSettings, issuerName: band.name });
      });
      return next as Record<string, BandSettings>;
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

  const appStateSnapshot = useMemo(() => ({
    bands,
    activeBandId,
    users,
    currentUserId,
    tasks,
    projects,
    events,
    lockedDates,
    transactions,
    memberTransactions,
    invoices,
    emailTemplates,
    bandSettingsMap,
    royalties,
    gigs,
    tours,
    merch,
    pressContacts,
    radioContacts,
    labelContacts,
    campaigns,
    fanContacts,
    promoters,
    venues,
    openingSlots,
    budgets,
    splitsMap,
    cashOnHandMap,
    songs,
    releases,
    setlists,
    goals,
    fundingApps,
    savedFundingOpps,
    savedResidencies,
    festivals,
    collaborators,
    media,
    articles,
    bandBioMap,
    epkPhotoIdMap,
    epkVideoIdMap,
    searchCache,
  }), [
    activeBandId,
    articles,
    bandBioMap,
    bandSettingsMap,
    bands,
    budgets,
    campaigns,
    cashOnHandMap,
    collaborators,
    currentUserId,
    emailTemplates,
    epkPhotoIdMap,
    events,
    fanContacts,
    festivals,
    fundingApps,
    gigs,
    goals,
    invoices,
    labelContacts,
    lockedDates,
    media,
    memberTransactions,
    merch,
    openingSlots,
    pressContacts,
    projects,
    promoters,
    radioContacts,
    releases,
    royalties,
    savedFundingOpps,
    savedResidencies,
    searchCache,
    setlists,
    songs,
    splitsMap,
    tasks,
    tours,
    transactions,
    users,
    venues,
  ]);

  useEffect(() => {
    if (!canSyncRemoteState(hasResolvedRemoteConfig, databaseConfigured, hasHydratedRemoteState, remoteSnapshotIsTrusted)) {
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const response = await authenticatedFetch('/api/app-state', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: APP_STATE_KEY,
            payload: appStateSnapshot,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server rejected app sync with status ${response.status}`);
        }
      } catch (error) {
        console.warn('Neon app-state sync failed; local browser storage remains active.', error);
        setRemoteSyncError('Cloud sync failed. Your changes remain in this browser and are not backed up remotely.');
      }
    }, 1500);

    return () => clearTimeout(handler);
  }, [appStateSnapshot, databaseConfigured, hasHydratedRemoteState, hasResolvedRemoteConfig, remoteSnapshotIsTrusted]);

  useEffect(() => {
    const checkRemoteConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (!response.ok) {
          setDatabaseConfigured(false);
          setHasResolvedRemoteConfig(true);
          setHasHydratedRemoteState(true);
          setIsHydratingRemoteState(false);
          return;
        }

        const data = await response.json();
        const isConfigured = Boolean(data?.database?.configured);
        setDatabaseConfigured(isConfigured);
        setHasResolvedRemoteConfig(true);
        if (!isConfigured && isSupabaseAuthConfigured) {
          setRemoteSyncError('Cloud persistence is not configured. Changes are saved only in this browser.');
        }
        if (!isConfigured) {
          setHasHydratedRemoteState(true);
          setIsHydratingRemoteState(false);
        }
      } catch (error) {
        console.warn('Could not read remote database configuration.', error);
        setDatabaseConfigured(false);
        setHasResolvedRemoteConfig(true);
        setHasHydratedRemoteState(true);
        setIsHydratingRemoteState(false);
      }
    };

    checkRemoteConfig();
  }, []);

  useEffect(() => {
    const hydrateFromNeon = async () => {
      if (!databaseConfigured || hasHydratedRemoteState) {
        return;
      }

      setIsHydratingRemoteState(true);

      try {
        const response = await authenticatedFetch(`/api/app-state?key=${encodeURIComponent(APP_STATE_KEY)}`);
        if (response.status === 404) {
          setRemoteSnapshotIsTrusted(true);
          setHasHydratedRemoteState(true);
          return;
        }
        if (!response.ok) {
          throw new Error(`Remote state hydration failed with status ${response.status}.`);
        }

        const data = await response.json();
        const payload = data?.payload;
        if (!payload || typeof payload !== 'object') {
          throw new Error('Remote state response did not contain a valid snapshot.');
        }

        if (shouldUseRemoteState(true, databaseConfigured, true)) {
          if (Array.isArray(payload.bands)) setBands(payload.bands);
          if (Array.isArray(payload.users)) setUsers(payload.users);
          if (payload.activeBandId) setActiveBandId(String(payload.activeBandId));
          if (payload.currentUserId) setCurrentUserId(String(payload.currentUserId));
          if (Array.isArray(payload.tasks)) setTasks(payload.tasks);
          if (Array.isArray(payload.projects)) setProjects(payload.projects);
          if (Array.isArray(payload.events)) setEvents(payload.events);
          if (Array.isArray(payload.lockedDates)) setLockedDates(payload.lockedDates);
          if (Array.isArray(payload.transactions)) setTransactions(payload.transactions);
          if (Array.isArray(payload.memberTransactions)) setMemberTransactions(payload.memberTransactions);
          if (Array.isArray(payload.invoices)) setInvoices(payload.invoices);
          if (Array.isArray(payload.emailTemplates)) setEmailTemplates(payload.emailTemplates);
          if (Array.isArray(payload.royalties)) setRoyalties(payload.royalties);
          if (Array.isArray(payload.merch)) setMerch(payload.merch);
          if (Array.isArray(payload.pressContacts)) setPressContacts(payload.pressContacts);
          if (Array.isArray(payload.radioContacts)) setRadioContacts(payload.radioContacts);
          if (Array.isArray(payload.labelContacts)) setLabelContacts(payload.labelContacts);
          if (Array.isArray(payload.fanContacts)) setFanContacts(payload.fanContacts);
          if (Array.isArray(payload.promoters)) setPromoters(payload.promoters);
          if (Array.isArray(payload.venues)) setVenues(payload.venues);
          if (Array.isArray(payload.openingSlots)) setOpeningSlots(payload.openingSlots);
          if (Array.isArray(payload.budgets)) setBudgets(payload.budgets);
          if (Array.isArray(payload.songs)) setSongs(payload.songs);
          if (Array.isArray(payload.releases)) setReleases(payload.releases);
          if (Array.isArray(payload.setlists)) setSetlists(payload.setlists);
          if (Array.isArray(payload.tours)) setTours(payload.tours);
          if (Array.isArray(payload.gigs)) setGigs(payload.gigs);
          if (Array.isArray(payload.campaigns)) setCampaigns(payload.campaigns);
          if (Array.isArray(payload.media)) setMedia(payload.media);
          if (Array.isArray(payload.articles)) setArticles(payload.articles);
          if (Array.isArray(payload.goals)) setGoals(payload.goals);
          if (Array.isArray(payload.fundingApps)) setFundingApps(payload.fundingApps);
          if (Array.isArray(payload.savedFundingOpps)) setSavedFundingOpps(payload.savedFundingOpps);
          if (Array.isArray(payload.savedResidencies)) setSavedResidencies(payload.savedResidencies);
          if (Array.isArray(payload.festivals)) setFestivals(payload.festivals);
          if (Array.isArray(payload.collaborators)) setCollaborators(payload.collaborators);
          if (Array.isArray(payload.searchCache)) setSearchCache(payload.searchCache);
          if (payload.bandSettingsMap && typeof payload.bandSettingsMap === 'object') setBandSettingsMap(payload.bandSettingsMap as Record<string, BandSettings>);
          if (payload.cashOnHandMap && typeof payload.cashOnHandMap === 'object') setCashOnHandMap(payload.cashOnHandMap as Record<string, number>);
          if (payload.splitsMap && typeof payload.splitsMap === 'object') setSplitsMap(payload.splitsMap as Record<string, Record<string, number>>);
          if (payload.bandBioMap && typeof payload.bandBioMap === 'object') setBandBioMap(payload.bandBioMap as Record<string, string>);
          if (payload.epkPhotoIdMap && typeof payload.epkPhotoIdMap === 'object') setEpkPhotoIdMap(payload.epkPhotoIdMap as Record<string, string>);
          if (payload.epkVideoIdMap && typeof payload.epkVideoIdMap === 'object') setEpkVideoIdMap(payload.epkVideoIdMap as Record<string, string>);
          setRemoteSnapshotIsTrusted(true);
        }
      } catch (error) {
        console.warn('Could not hydrate app state from Neon.', error);
        setRemoteSyncError('Could not load the cloud workspace. Cloud sync is paused to avoid overwriting remote data.');
      } finally {
        setHasHydratedRemoteState(true);
        setIsHydratingRemoteState(false);
      }
    };

    hydrateFromNeon();
  }, [databaseConfigured, hasHydratedRemoteState, setBands, setUsers, setActiveBandId, setCurrentUserId, setTasks, setProjects, setEvents, setLockedDates, setTransactions, setMemberTransactions, setInvoices, setEmailTemplates, setRoyalties, setMerch, setPressContacts, setRadioContacts, setLabelContacts, setFanContacts, setPromoters, setVenues, setOpeningSlots, setBudgets, setSongs, setReleases, setSetlists, setTours, setGigs, setCampaigns, setMedia, setArticles, setGoals, setFundingApps, setSavedFundingOpps, setSavedResidencies, setFestivals, setCollaborators, setSearchCache, setBandSettingsMap, setCashOnHandMap, setSplitsMap, setBandBioMap, setEpkPhotoIdMap, setEpkVideoIdMap]);
  
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
            ...prev.filter(task => task.bandId !== editingBandId || task.projectId !== `band-plan-${editingBandId}`),
            ...plan.tasks.filter(task => task.bandId === editingBandId)
          ]);
          setEvents(prev => [
            ...prev.filter(event => event.bandId !== editingBandId || (!event.id.startsWith('release-event-') && !event.id.startsWith('show-event-'))),
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
    if (canShowBandSetupPrompt(bands.length, isHydratingRemoteState)) {
      setIsNewBandModalOpen(true);
      setActiveBandId('');
      return;
    }

    if (bands.length > 0 && !bands.some((band) => band.id === activeBandId)) {
      setActiveBandId(bands[0].id);
    }
  }, [bands, activeBandId, isHydratingRemoteState, setActiveBandId]);

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
      const nextPage = normalizePage(window.location.hash.substring(1));
      setPage(prevPage => (prevPage === nextPage ? prevPage : nextPage));
    };
    window.addEventListener('hashchange', handleHashChange);
    // Set initial page in case there's a hash on load
    handleHashChange();
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const meta = PAGE_META[page] || { title: 'Dashboard', summary: 'Band overview and the next move' };
    setUserScopedItem(
      resumeStorageKey,
      JSON.stringify({
        page,
        title: meta.title,
        summary: meta.summary,
        timestamp: new Date().toISOString(),
      })
    );
  }, [page, resumeStorageKey]);
  
  // Effect for background task management
  useEffect(() => {
    const handleStartTask = (e: Event) => {
      const { id, name, estimatedDuration } = (e as CustomEvent).detail;
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

  const handleGlobalUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    const targetBandId = resolvedActiveBandId || activeBandId || bands[0]?.id || 'default-band';
    setGlobalUploadStatus('Saving and categorizing uploads...');

    try {
      for (const file of files) {
        const text = await readFileAsText(file).catch(() => '');
        const kind = classifyUpload(file, text);
        const uploaded = await persistUploadedFile(file);

        const asset: MediaAsset = {
          id: `media-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          name: file.name,
          type: kind === 'media' ? 'Photo' : 'Link',
          location: 'Universal Intake',
          folderPath: uploaded.url,
          tags: [kind, 'imported', 'persistent'],
          imageDataUrl: kind === 'media' ? uploaded.url : undefined,
          storageMode: uploaded.storageMode,
          assetPath: uploaded.url,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          bandId: targetBandId,
        };

        setMedia(prev => [asset, ...prev]);

        if (kind === 'mailing-list' || kind === 'press-list' || kind === 'radio-list' || kind === 'label-list') {
          const rows = parseCsvLikeRows(text || file.name);
          const records: Array<{ name: string; email: string; labelName?: string; stationName?: string; outlet?: string; source: 'csv' | 'paste'; bandId: string }> = [];

          for (const row of rows) {
            const emailFound = row.find((cell) => extractEmail(cell));
            const email = emailFound ? extractEmail(emailFound) : '';
            if (!email) continue;

            const nameCell = row.find((cell) => !/@/.test(cell) && !/email|name|label|station|outlet|city|country|website/i.test(cell));
            const name = (nameCell || email.split('@')[0].replace(/[._-]/g, ' ')).trim() || 'Imported Contact';
            let contact: { name: string; email: string; labelName?: string; stationName?: string; outlet?: string; source: 'csv' | 'paste'; bandId: string } | null = null;

            if (kind === 'label-list') {
              contact = {
                name,
                email,
                labelName: row.find((cell) => /label|imprint|company|record/i.test(cell)) || 'Imported Label',
                source: 'csv',
                bandId: targetBandId,
              };
            } else if (kind === 'radio-list') {
              contact = {
                name,
                email,
                stationName: row.find((cell) => /radio|station|fm|playlist|show/i.test(cell)) || 'Imported Station',
                source: 'csv',
                bandId: targetBandId,
              };
            } else if (kind === 'press-list') {
              contact = {
                name,
                email,
                outlet: row.find((cell) => /press|outlet|publication|journal|magazine|blog/i.test(cell)) || 'Imported Outlet',
                source: 'csv',
                bandId: targetBandId,
              };
            } else {
              contact = {
                name,
                email,
                source: 'csv',
                bandId: targetBandId,
              };
            }

            if (contact) {
              records.push(contact);
            }
          }

          const dedupe = (value: string) => value.trim().toLowerCase();

          if (kind === 'label-list') {
            const nextItems = records.filter(record => record.email && !labelContacts.some(existing => dedupe(existing.email) === dedupe(record.email) && existing.bandId === targetBandId)).map(record => ({
              id: `label-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
              name: record.name,
              labelName: record.labelName || 'Imported Label',
              email: record.email,
              country: '',
              city: '',
              genres: '',
              submissionUrl: '',
              notes: 'Imported from universal upload intake.',
              website: '',
              role: '',
              phone: '',
              address: '',
              source: 'csv' as const,
              lastVerifiedAt: new Date().toISOString(),
              socials: {},
              bandId: targetBandId,
            }));
            if (nextItems.length) setLabelContacts(prev => [...prev, ...nextItems]);
          }

          if (kind === 'radio-list') {
            const nextItems = records.filter(record => record.email && !radioContacts.some(existing => dedupe(existing.email) === dedupe(record.email) && existing.bandId === targetBandId)).map(record => ({
              id: `radio-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
              name: record.name,
              stationName: record.stationName || 'Imported Station',
              email: record.email,
              country: '',
              city: '',
              genres: '',
              submissionUrl: '',
              notes: 'Imported from universal upload intake.',
              bandId: targetBandId,
            }));
            if (nextItems.length) setRadioContacts(prev => [...prev, ...nextItems]);
          }

          if (kind === 'press-list') {
            const nextItems = records.filter(record => record.email && !pressContacts.some(existing => dedupe(existing.email) === dedupe(record.email) && existing.bandId === targetBandId)).map(record => ({
              id: `press-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
              name: record.name,
              outlet: record.outlet || 'Imported Outlet',
              email: record.email,
              tier: ContactTier.C,
              socials: '',
              notes: 'Imported from universal upload intake.',
              country: '',
              city: '',
              sourceUrl: '',
              bandId: targetBandId,
            }));
            if (nextItems.length) setPressContacts(prev => [...prev, ...nextItems]);
          }

          if (kind === 'mailing-list') {
            const nextItems = records.filter(record => record.email && !fanContacts.some(existing => dedupe(existing.email) === dedupe(record.email) && existing.bandId === targetBandId)).map(record => ({
              id: `fan-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
              name: record.name,
              email: record.email,
              origin: 'CSV Import' as const,
              consentStatus: 'pending_review' as const,
              dateAdded: new Date().toISOString(),
              bandId: targetBandId,
            }));
            if (nextItems.length) setFanContacts(prev => [...prev, ...nextItems]);
          }
        }
      }

      const fileCount = files.length;
      setGlobalUploadStatus(`${fileCount} file${fileCount > 1 ? 's' : ''} saved and classified successfully.`);
    } catch (error) {
      console.error('Global upload intake failed:', error);
      setGlobalUploadStatus('Upload failed. Please try again with a different file.');
    } finally {
      if (globalUploadInputRef.current) {
        globalUploadInputRef.current.value = '';
      }
      window.setTimeout(() => setGlobalUploadStatus(null), 3500);
    }
  }, [activeBandId, bands, fanContacts, labelContacts, pressContacts, radioContacts, resolvedActiveBandId, setFanContacts, setLabelContacts, setMedia, setPressContacts, setRadioContacts]);

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
      case 'wizard':
        return <BandMateWizard activeBandId={activeBandId} bands={bands} currentUser={currentUser} />;
      case 'links':
        return <LinksDatabase activeBandId={activeBandId} bands={bands} searchCache={searchCache} />;
      case 'projects':
        return <Projects {...allProps} tasks={tasks} setTasks={setTasks} projects={projects} setProjects={setProjects} releases={releases} setReleases={setReleases} />;
      case 'calendar':
        return <Calendar 
            {...allProps} 
            events={events} setEvents={setEvents} 
            tasks={tasks} setTasks={setTasks}
            releases={releases} 
            tours={tours} 
            gigs={gigs} setGigs={setGigs}
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
        return <Campaigns {...allProps} campaigns={campaigns} setCampaigns={setCampaigns} pressContacts={pressContacts} venues={venues} promoters={promoters} labelContacts={labelContacts} radioContacts={radioContacts} fanContacts={fanContacts} projects={projects} bandSettings={bandSettings} />;
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
      {remoteSyncError && (
        <div role="alert" className="fixed bottom-4 left-4 z-[90] max-w-md rounded-lg border border-amber-500/50 bg-amber-950 p-4 text-sm text-amber-100 shadow-xl">
          {remoteSyncError}
        </div>
      )}
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
      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2">
        {globalUploadStatus && (
          <div className="max-w-xs rounded-lg border border-brand-accent/40 bg-brand-bg-card/95 px-3 py-2 text-xs text-gray-100 shadow-xl backdrop-blur-sm">
            {globalUploadStatus}
          </div>
        )}
        <button
          type="button"
          onClick={() => globalUploadInputRef.current?.click()}
          className="flex items-center justify-center h-14 w-14 rounded-full bg-brand-accent text-white shadow-lg transition hover:scale-105 hover:bg-brand-accent-dark"
          aria-label="Upload a file to the universal intake"
          title="Upload files to the universal intake"
        >
          <UploadIcon className="h-6 w-6" />
        </button>
        <input
          ref={globalUploadInputRef}
          type="file"
          accept=".csv,.txt,.pdf,.doc,.docx,.xlsx,.xls,.json,.png,.jpg,.jpeg,.gif,.webp,.mp4,.mov,.wav,.mp3"
          multiple
          onChange={handleGlobalUpload}
          className="hidden"
        />
      </div>
      <main className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative ${backgroundTasks.length > 0 ? 'pt-16' : ''} bg-brand-bg-content m-4 rounded-lg`}>
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

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isResolvingSession, setIsResolvingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!supabaseClient) {
      setUserStorageScope(null);
      setIsResolvingSession(false);
      return;
    }

    let isMounted = true;
    let authEventReceived = false;
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, nextSession) => {
      authEventReceived = true;
      setUserStorageScope(nextSession?.user.id || null);
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      if (event === 'SIGNED_OUT') setIsPasswordRecovery(false);
      setSessionError('');
      setIsResolvingSession(false);
    });

    supabaseClient.auth.getSession().then(({ data, error }) => {
      if (!isMounted || authEventReceived) return;
      if (error) {
        setSessionError(error.message);
      } else {
        setUserStorageScope(data.session?.user.id || null);
        setSession(data.session);
      }
      setIsResolvingSession(false);
    }).catch((error: unknown) => {
      if (!isMounted || authEventReceived) return;
      setSessionError(error instanceof Error ? error.message : 'Could not read the sign-in session.');
      setIsResolvingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isResolvingSession) {
    return <main className="min-h-screen flex items-center justify-center bg-brand-bg-outer text-gray-300">Checking account session…</main>;
  }

  if (!isSupabaseAuthConfigured) {
    if (import.meta.env.PROD) return <AuthScreen />;
    return <BandmateWorkspace />;
  }

  if (!session) {
    return (
      <>
        {sessionError && <p role="alert" className="fixed left-1/2 top-3 z-[100] -translate-x-1/2 rounded bg-red-900 px-4 py-2 text-sm text-white">{sessionError}</p>}
        <AuthScreen />
      </>
    );
  }

  if (isPasswordRecovery) {
    return <AuthScreen passwordRecovery onPasswordUpdated={() => setIsPasswordRecovery(false)} />;
  }

  return (
    <>
      <BandmateWorkspace key={session.user.id} />
      {sessionError && <p role="alert" className="fixed left-1/2 top-3 z-[100] -translate-x-1/2 rounded bg-red-900 px-4 py-2 text-sm text-white">{sessionError}</p>}
      <button
        type="button"
        onClick={() => {
          void supabaseClient?.auth.signOut().then(({ error }) => {
            if (error) setSessionError(`Could not sign out: ${error.message}`);
          });
        }}
        className="fixed right-3 top-3 z-[80] rounded-lg border border-white/20 bg-black/80 px-3 py-2 text-xs text-white hover:bg-black"
      >
        Sign out
      </button>
    </>
  );
};

export default App;

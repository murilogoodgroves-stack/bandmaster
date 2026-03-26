
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

const NewBandModal: React.FC<{
    onClose: () => void;
    onSave: (band: Omit<BandProfile, 'id'>) => void;
}> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [genre, setGenre] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name.trim() || !genre.trim()) return;
        onSave({ name, genre });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-brand-bg-card rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-medium mb-4">Create New Band</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Band Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent" required />
                    <input type="text" placeholder="Genre(s)" value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-brand-bg-content p-3 rounded-lg ring-brand-accent" required />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-brand-accent hover:bg-brand-accent-dark text-white font-medium py-2 px-4 rounded-lg">Create Band</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  // Fix: Initialize page state by splitting query params to ensure deep links work correctly on refresh
  const [page, setPage] = useState<Page>(() => (window.location.hash.substring(1).split('?')[0] || 'dashboard') as Page);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isNewBandModalOpen, setIsNewBandModalOpen] = useState(false);
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([]);
  
  // --- Centralized State Management ---
  // Core
  const [bands, setBands] = useLocalStorage<BandProfile[]>('bands', initialBandProfiles);
  const [activeBandId, setActiveBandId] = useLocalStorage<string>('activeBandId', bands[0]?.id || 'b1');
  const [users, setUsers] = useLocalStorage<User[]>('users', initialUsers);
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', initialTasks);
  const [projects, setProjects] = useLocalStorage<ProductionProject[]>('productionProjects', initialProductionProjects);
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>('events', initialEvents);
  const [lockedDates, setLockedDates] = useLocalStorage<LockedDate[]>('lockedDates', initialLockedDates);

  // Business
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', initialTransactions);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', initialInvoices);
  const [emailTemplates, setEmailTemplates] = useLocalStorage<EmailTemplate[]>('emailTemplates', []);
  // Band Settings Map - Keyed by Band ID to prevent data leakage
  const [bandSettingsMap, setBandSettingsMap] = useLocalStorage<{[bandId: string]: BandSettings}>('bandSettingsMap', {
      [initialBandProfiles[0].id]: initialBandSettings
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
      [initialBandProfiles[0].id]: initialUsers.reduce((acc, user) => ({...acc, [user.id]: 100/initialUsers.length}), {})
  });
  const [cashOnHandMap, setCashOnHandMap] = useLocalStorage<{[bandId: string]: number}>('cashOnHandMap', {
      [initialBandProfiles[0].id]: 500
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
      [initialBandProfiles[0].id]: "LOVNIS are an indie rock quartet..."
  });
  const [epkPhotoIdMap, setEpkPhotoIdMap] = useLocalStorage<{[bandId: string]: string}>('epkPhotoIdsMap', {});
  const [epkVideoIdMap, setEpkVideoIdMap] = useLocalStorage<{[bandId: string]: string}>('epkVideoIdsMap', {});

  // --- Derived State & Setters for Active Band ---
  
  const splits = useMemo(() => splitsMap[activeBandId] || {}, [splitsMap, activeBandId]);
  const setSplits = useCallback((value: any) => {
      setSplitsMap(prev => {
          const currentVal = prev[activeBandId] || {};
          const newVal = typeof value === 'function' ? value(currentVal) : value;
          return { ...prev, [activeBandId]: newVal };
      });
  }, [activeBandId, setSplitsMap]);

  const cashOnHand = useMemo(() => cashOnHandMap[activeBandId] ?? 0, [cashOnHandMap, activeBandId]);
  const setCashOnHand = useCallback((value: any) => {
      setCashOnHandMap(prev => {
          const currentVal = prev[activeBandId] ?? 0;
          const newVal = typeof value === 'function' ? value(currentVal) : value;
          return { ...prev, [activeBandId]: newVal };
      });
  }, [activeBandId, setCashOnHandMap]);

  const bandBio = useMemo(() => bandBioMap[activeBandId] || "", [bandBioMap, activeBandId]);
  const setBandBio = useCallback((value: any) => {
      setBandBioMap(prev => {
          const currentVal = prev[activeBandId] || "";
          const newVal = typeof value === 'function' ? value(currentVal) : value;
          return { ...prev, [activeBandId]: newVal };
      });
  }, [activeBandId, setBandBioMap]);

  const epkPhotoId = useMemo(() => epkPhotoIdMap[activeBandId] || "", [epkPhotoIdMap, activeBandId]);
  const setEpkPhotoId = useCallback((value: any) => {
      setEpkPhotoIdMap(prev => {
          const currentVal = prev[activeBandId] || "";
          const newVal = typeof value === 'function' ? value(currentVal) : value;
          return { ...prev, [activeBandId]: newVal };
      });
  }, [activeBandId, setEpkPhotoIdMap]);

  const epkVideoId = useMemo(() => epkVideoIdMap[activeBandId] || "", [epkVideoIdMap, activeBandId]);
  const setEpkVideoId = useCallback((value: any) => {
      setEpkVideoIdMap(prev => {
          const currentVal = prev[activeBandId] || "";
          const newVal = typeof value === 'function' ? value(currentVal) : value;
          return { ...prev, [activeBandId]: newVal };
      });
  }, [activeBandId, setEpkVideoIdMap]);

  const bandSettings = useMemo(() => bandSettingsMap[activeBandId] || initialBandSettings, [bandSettingsMap, activeBandId]);
  const setBandSettings = useCallback((value: any) => {
      setBandSettingsMap(prev => {
          const currentVal = prev[activeBandId] || initialBandSettings;
          const newVal = typeof value === 'function' ? value(currentVal) : value;
          return { ...prev, [activeBandId]: newVal };
      });
  }, [activeBandId, setBandSettingsMap]);


  const handleBandChange = (id: string) => {
    setActiveBandId(id);
  };
  
  const handleSaveBand = (bandData: Omit<BandProfile, 'id'>) => {
      const newBand: BandProfile = {
          id: `b-${Date.now()}`,
          ...bandData
      };
      setBands(prev => [...prev, newBand]);
      
      // Automatically calculate equal splits for current users for the new band
      const equalSplit = users.length > 0 ? 100 / users.length : 100;
      const newBandSplits = users.reduce((acc, user) => ({...acc, [user.id]: equalSplit}), {});

      // Initialize maps for new band
      setCashOnHandMap(prev => ({...prev, [newBand.id]: 0}));
      setSplitsMap(prev => ({...prev, [newBand.id]: newBandSplits}));
      setBandBioMap(prev => ({...prev, [newBand.id]: `Biography for ${newBand.name}`}));
      setBandSettingsMap(prev => ({...prev, [newBand.id]: initialBandSettings}));
      
      setActiveBandId(newBand.id); // Switch to new band
      setIsNewBandModalOpen(false);
  };

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
        />;
      case 'invoices':
        return <Invoices {...allProps} invoices={invoices} bandSettings={bandSettings} />;
      case 'press':
        return <PressOutreach {...allProps} pressContacts={pressContacts} setPressContacts={setPressContacts} />;
      case 'radio':
        return <RadioOutreach {...allProps} radioContacts={radioContacts} setRadioContacts={setRadioContacts} />;
      case 'label':
        return <LabelReachout {...allProps} labelContacts={labelContacts} setLabelContacts={setLabelContacts} />;
      case 'merch':
        return <Merchandise {...allProps} merch={merch} setMerch={setMerch} transactions={transactions} setTransactions={setTransactions} />;
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
        return <Funding {...allProps} savedFundingOpps={savedFundingOpps} setSavedFundingOpps={setSavedFundingOpps} setEvents={setEvents} />;
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
        onNewBandClick={() => setIsNewBandModalOpen(true)}
        users={users}
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
      {isNewBandModalOpen && <NewBandModal onClose={() => setIsNewBandModalOpen(false)} onSave={handleSaveBand} />}
    </div>
  );
};

export default App;

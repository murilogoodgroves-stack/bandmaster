
import React, { useEffect, useState, useMemo } from 'react';
import type { Page, Task, ProductionProject, CalendarEvent, Transaction, MerchItem, Release, Tour, PressContact, LabelContact, FundingApplication, Festival, Venue, OpeningSlotOpportunity, WizardSuggestion, LastSearchParams, User } from '../types';
import { APP_PAGES, TaskStatus, EventType, TransactionType } from '../types';
import { CheckCircleIcon, ClockIcon, PlusIcon, BotIcon, RefreshCwIcon, ArrowRightIcon, LinkIcon, CalendarIcon, ReleaseIcon, MegaphoneIcon, DashboardIcon, SaveIcon } from './icons';
import { findLabelContacts } from '../services/aiService';
import useLocalStorage from '../hooks/useLocalStorage';

interface DashboardProps {
    users: User[];
    activeBandId: string;
    setActivePage: (page: Page) => void;
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    projects: ProductionProject[];
    events: CalendarEvent[];
    setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
    transactions: Transaction[];
    merch: MerchItem[];
    releases: Release[];
    tours: Tour[];
    pressContacts: PressContact[];
    labelContacts: LabelContact[];
    fundingApplications: FundingApplication[];
    festivals: Festival[];
    savedFestivals: Festival[];
    setSavedFestivals: React.Dispatch<React.SetStateAction<Festival[]>>;
    venues: Venue[];
    openingSlots: OpeningSlotOpportunity[];
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    users, activeBandId, setActivePage, tasks: allTasks, setTasks, projects: allProjects, 
    events: allEvents, setEvents, transactions: allTransactions, merch: allMerch, releases: allReleases, 
    tours: allTours, pressContacts: allPressContacts, labelContacts: allLabelContacts
}) => {
    const tasks = useMemo(() => allTasks.filter(t => t.bandId === activeBandId), [allTasks, activeBandId]);
    const projects = useMemo(() => allProjects.filter(p => p.bandId === activeBandId), [allProjects, activeBandId]);
    const events = useMemo(() => allEvents.filter(e => e.bandId === activeBandId), [allEvents, activeBandId]);
    const transactions = useMemo(() => allTransactions.filter(t => t.bandId === activeBandId), [allTransactions, activeBandId]);
    const releases = useMemo(() => allReleases.filter(r => r.bandId === activeBandId), [allReleases, activeBandId]);
    const tours = useMemo(() => allTours.filter(t => t.bandId === activeBandId), [allTours, activeBandId]);
    const bandLabels = useMemo(() => allLabelContacts.filter(l => l.bandId === activeBandId), [allLabelContacts, activeBandId]);

    const [suggestions, setSuggestions] = useState<WizardSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [lastSearches] = useLocalStorage<LastSearchParams>(`lastSearches_${activeBandId}`, {});
    const [resumeState] = useLocalStorage<{ page: Page; title: string; summary: string; timestamp: string } | null>(`bandmate-resume-${activeBandId}`, null);

    const formatTimeAgo = (iso: string) => {
        const diffMs = Date.now() - new Date(iso).getTime();
        const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
        if (diffMinutes < 60) return `${diffMinutes} min ago`;
        const diffHours = Math.round(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} hr ago`;
        const diffDays = Math.round(diffHours / 24);
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    };

    const generateSuggestions = async () => {
        setIsLoadingSuggestions(true);
        const newSuggestions: WizardSuggestion[] = [];
        const tasksToRun: (() => Promise<void>)[] = [];

        if (lastSearches.labels) {
            tasksToRun.push(async () => {
                const newLabels = await findLabelContacts(
                    lastSearches.labels!.genre,
                    lastSearches.labels!.country,
                    lastSearches.labels!.size,
                    lastSearches.labels!.labelName,
                    bandLabels,
                    lastSearches.labels!.similarToLabel || ''
                );
                if (newLabels.length > 0) {
                    const searchText = lastSearches.labels?.similarToLabel ? `labels similar to '${lastSearches.labels.similarToLabel}'` : `'${lastSearches.labels?.genre || lastSearches.labels?.labelName}'`;
                    newSuggestions.push({ id: `sugg-labels-${Date.now()}`, type: 'new_labels', text: `Found ${newLabels.length} new record label(s) matching your search for ${searchText}.`, action: { page: 'label', data: newLabels } });
                }
            });
        }

        await Promise.all(tasksToRun.map(t => t()));
        setSuggestions(newSuggestions);
        setIsLoadingSuggestions(false);
    };

    const navigateToSection = (page: Page) => {
        if (APP_PAGES.includes(page)) {
            setActivePage(page);
            return;
        }
        setActivePage('dashboard');
    };

    const handleSuggestionClick = (suggestion: WizardSuggestion) => {
        if (suggestion.action.data) {
            localStorage.setItem('wizard_suggestion_data', JSON.stringify(suggestion.action.data));
        }
        navigateToSection(suggestion.action.page);
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    };

    const upcomingEvents = events
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

    const pendingTasks = tasks
        .filter(t => t.status !== TaskStatus.Done)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);

    const activeProject = projects.filter(p => p.status !== 'Released' && p.status !== 'On Hold')[0];
    const nextRelease = releases.filter(r => new Date(r.releaseDate) >= new Date()).sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime())[0];
    const nextTour = tours.filter(t => new Date(t.startDate) >= new Date()).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

    const incomeThisMonth = transactions
        .filter(t => t.type === TransactionType.Income && new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + t.amount, 0);
    const expenseThisMonth = transactions
        .filter(t => t.type === TransactionType.Expense && new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + t.amount, 0);

    const recentMomentum = useMemo(() => {
        const items = [
            ...tasks.slice().sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).slice(0, 2).map(task => ({
                label: 'Task',
                title: task.title,
                meta: `${task.status} • ${new Date(task.dueDate).toLocaleDateString()}`,
                page: 'projects' as Page
            })),
            ...projects.slice().sort((a, b) => new Date(b.targetReleaseDate).getTime() - new Date(a.targetReleaseDate).getTime()).slice(0, 2).map(project => ({
                label: 'Project',
                title: project.name,
                meta: `${project.status} • ${project.type}`,
                page: 'projects' as Page
            })),
            ...releases.slice().sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()).slice(0, 2).map(release => ({
                label: 'Release',
                title: release.title,
                meta: new Date(release.releaseDate).toLocaleDateString(),
                page: 'releases' as Page
            })),
            ...events.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 2).map(event => ({
                label: 'Event',
                title: event.title,
                meta: `${event.type} • ${new Date(event.date).toLocaleDateString()}`,
                page: 'calendar' as Page
            }))
        ];

        return items.slice(0, 6);
    }, [events, projects, releases, tasks]);

    const sectionCards = [
        { title: 'Projects', subtitle: activeProject ? activeProject.name : 'Start your next release', page: 'projects', icon: <DashboardIcon className="w-5 h-5" /> },
        { title: 'Calendar', subtitle: upcomingEvents[0] ? upcomingEvents[0].title : 'Schedule your next move', page: 'calendar', icon: <CalendarIcon className="w-5 h-5" /> },
        { title: 'Releases', subtitle: nextRelease ? nextRelease.title : 'Plan the next launch', page: 'releases', icon: <ReleaseIcon className="w-5 h-5" /> },
        { title: 'Links', subtitle: 'Keep your most important URLs close', page: 'links', icon: <LinkIcon className="w-5 h-5" /> },
        { title: 'Campaigns', subtitle: 'Send newsletters and outreach', page: 'campaigns', icon: <MegaphoneIcon className="w-5 h-5" /> },
        { title: 'Wizard', subtitle: 'Stay aligned with your plan', page: 'wizard', icon: <BotIcon className="w-5 h-5" /> },
    ] as const;

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold">Dashboard</h1>
                <p className="text-gray-400">Your band pulse: priorities, momentum, and the next moves to keep the work moving.</p>
            </div>

            {resumeState && (
                <div className="rounded-2xl border border-brand-accent/40 bg-gradient-to-r from-brand-accent/10 via-gray-800 to-gray-900 p-5 shadow-lg">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-brand-accent">Continue where you stopped</p>
                            <h2 className="mt-2 text-2xl font-bold text-white">{resumeState.title}</h2>
                            <p className="mt-1 text-sm text-gray-300">{resumeState.summary}</p>
                            <p className="mt-2 text-xs text-gray-400">Last activity: {formatTimeAgo(resumeState.timestamp)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigateToSection(resumeState.page)}
                            className="inline-flex items-center justify-center rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent-dark"
                        >
                            Resume this section <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {(suggestions.length > 0 || isLoadingSuggestions || Object.keys(lastSearches).length > 0) && (
                <div className="bg-purple-900/40 border border-purple-500/30 p-4 rounded-xl mb-8 animate-fade-in">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-bold text-purple-300 flex items-center">
                            {isLoadingSuggestions ? <RefreshCwIcon className="w-5 h-5 mr-2 animate-spin"/> : <BotIcon className="w-5 h-5 mr-2"/>}
                            {isLoadingSuggestions ? 'AI is looking for new opportunities...' : 'AI Opportunities'}
                        </h3>
                        {suggestions.length === 0 && !isLoadingSuggestions && Object.keys(lastSearches).length > 0 && (
                            <button 
                                onClick={generateSuggestions}
                                className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 px-3 rounded-md flex items-center transition-colors"
                            >
                                <RefreshCwIcon className="w-3 h-3 mr-1.5"/> Generate Suggestions
                            </button>
                        )}
                    </div>
                    
                    {suggestions.length > 0 ? (
                        <div className="space-y-2">
                            {suggestions.map(s => (
                                <div key={s.id} className="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                                    <p className="text-sm text-gray-200">{s.text}</p>
                                    <button onClick={() => handleSuggestionClick(s)} className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 px-3 rounded-md flex items-center">
                                        View <ArrowRightIcon className="w-3 h-3 ml-1"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : !isLoadingSuggestions && (
                        <p className="text-sm text-gray-400 italic">
                            {Object.keys(lastSearches).length > 0 
                                ? "Click 'Generate Suggestions' to see how AI can help based on your recent activity."
                                : 'Start searching for labels or press to see AI suggestions here.'}
                        </p>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-xl p-5 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Tasks due</p>
                    <p className="mt-3 text-3xl font-bold text-white">{pendingTasks.length}</p>
                    <p className="mt-2 text-sm text-gray-400">Next action: {pendingTasks[0] ? pendingTasks[0].title : 'Everything is clear'}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-5 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Next release</p>
                    <p className="mt-3 text-xl font-bold text-white">{nextRelease ? nextRelease.title : 'No release set'}</p>
                    <p className="mt-2 text-sm text-gray-400">{nextRelease ? `${Math.ceil((new Date(nextRelease.releaseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left` : 'Plan your launch timeline'}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-5 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Upcoming show</p>
                    <p className="mt-3 text-xl font-bold text-white">{upcomingEvents[0] ? upcomingEvents[0].title : 'No show booked'}</p>
                    <p className="mt-2 text-sm text-gray-400">{upcomingEvents[0] ? new Date(upcomingEvents[0].date).toLocaleDateString() : 'Set the next booking'}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-5 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Monthly cash</p>
                    <p className="mt-3 text-3xl font-bold text-green-400">+${incomeThisMonth.toFixed(0)}</p>
                    <p className="mt-2 text-sm text-red-400">-${expenseThisMonth.toFixed(0)} expenses</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Follow-up queue</h2>
                        <button onClick={() => navigateToSection('projects')} className="text-sm text-purple-400 hover:underline">Open tasks</button>
                    </div>
                    {pendingTasks.length > 0 ? (
                        <ul className="space-y-3">
                            {pendingTasks.map(task => (
                                <li key={task.id} className="flex items-center gap-3 bg-gray-700/50 p-3 rounded-lg">
                                    <button 
                                        onClick={() => setTasks(tasks.map(t => t.id === task.id ? {...t, status: TaskStatus.Done} : t))}
                                        className="text-gray-500 hover:text-green-500 transition-colors"
                                    >
                                        <div className="w-5 h-5 border-2 border-gray-500 rounded-full"></div>
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{task.title}</p>
                                        <p className="text-xs text-gray-400">Due {new Date(task.dueDate).toLocaleDateString()} • {task.priority}</p>
                                    </div>
                                    <span className={`w-2 h-2 rounded-full ${task.priority === 'Critical' ? 'bg-red-500' : task.priority === 'High' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                            <p>Everything in the queue is complete.</p>
                        </div>
                    )}
                </div>

                <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <ClockIcon className="w-5 h-5 text-purple-400" />
                        <h2 className="text-xl font-bold">Momentum</h2>
                    </div>
                    <div className="space-y-3">
                        {recentMomentum.map((item, index) => (
                            <button
                                key={`${item.label}-${index}`}
                                type="button"
                                onClick={() => navigateToSection(item.page)}
                                className="w-full flex items-start justify-between gap-3 rounded-lg border border-gray-700 bg-gray-700/40 p-3 text-left hover:border-brand-accent/40"
                            >
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-brand-accent">{item.label}</p>
                                    <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
                                    <p className="text-xs text-gray-400 mt-1">{item.meta}</p>
                                </div>
                                <ArrowRightIcon className="w-4 h-4 text-gray-400 mt-1" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sectionCards.map((card) => (
                    <button
                        key={card.title}
                        type="button"
                        onClick={() => navigateToSection(card.page)}
                        className="group flex items-start justify-between gap-3 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-5 text-left shadow-lg border border-gray-700 transition-all hover:border-brand-accent/60 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.4)] hover:-translate-y-0.5"
                    >
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">{card.title}</p>
                            <p className="mt-2 text-base font-bold text-white group-hover:text-brand-accent">{card.subtitle}</p>
                        </div>
                        <div className="rounded-xl bg-brand-accent/10 p-2.5 text-brand-accent transition group-hover:bg-brand-accent/15">{card.icon}</div>
                    </button>
                ))}
            </div>

            {nextRelease && (
                <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <ClockIcon className="w-8 h-8 text-purple-500"/>
                        <div>
                            <p className="text-gray-400 text-sm">Next Release</p>
                            <h3 className="text-xl font-bold">{nextRelease.title}</h3>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-white">{Math.ceil((new Date(nextRelease.releaseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Days</p>
                        <p className="text-xs text-gray-500">until {new Date(nextRelease.releaseDate).toLocaleDateString()}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

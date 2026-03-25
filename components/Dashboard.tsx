
import React, { useEffect, useState, useMemo } from 'react';
import type { Page, Task, ProductionProject, CalendarEvent, Transaction, MerchItem, Release, Tour, PressContact, LabelContact, FundingApplication, Festival, Venue, OpeningSlotOpportunity, WizardSuggestion, LastSearchParams, BandProfile, User } from '../types';
import { TaskStatus, EventType, TransactionType } from '../types';
import { CheckCircleIcon, ClockIcon, PlusIcon, BotIcon, RefreshCwIcon, ArrowRightIcon } from './icons';
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
    // Filter data for active band
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

    useEffect(() => {
        const generateSuggestions = async () => {
            setIsLoadingSuggestions(true);
            const newSuggestions: WizardSuggestion[] = [];
            const tasksToRun: (() => Promise<void>)[] = [];

            // 1. Labels
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

            // Execute all background tasks
            await Promise.all(tasksToRun.map(t => t()));
            
            setSuggestions(newSuggestions);
            setIsLoadingSuggestions(false);
        };

        // Only run if we have some search history
        if (Object.keys(lastSearches).length > 0) {
            generateSuggestions();
        }
    }, [lastSearches, activeBandId]);

    const handleSuggestionClick = (suggestion: WizardSuggestion) => {
        if (suggestion.action.data) {
            // Store data in local storage to be picked up by the target page
            localStorage.setItem('wizard_suggestion_data', JSON.stringify(suggestion.action.data));
        }
        setActivePage(suggestion.action.page);
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    };

    const upcomingEvents = events
        .filter(e => new Date(e.date) >= new Date())
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

    const pendingTasks = tasks
        .filter(t => t.status !== TaskStatus.Done)
        .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);

    const activeProject = projects.filter(p => p.status !== 'Released' && p.status !== 'On Hold')[0];
    const nextRelease = releases.filter(r => new Date(r.releaseDate) >= new Date()).sort((a,b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime())[0];
    
    // Financial Snapshot
    const incomeThisMonth = transactions
        .filter(t => t.type === TransactionType.Income && new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + t.amount, 0);
    const expenseThisMonth = transactions
        .filter(t => t.type === TransactionType.Expense && new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
            
            {/* AI Suggestions Area */}
            {(suggestions.length > 0 || isLoadingSuggestions) && (
                <div className="bg-purple-900/40 border border-purple-500/30 p-4 rounded-xl mb-8 animate-fade-in">
                    <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center">
                        {isLoadingSuggestions ? <RefreshCwIcon className="w-5 h-5 mr-2 animate-spin"/> : <BotIcon className="w-5 h-5 mr-2"/>}
                        {isLoadingSuggestions ? "AI is looking for new opportunities..." : "New Opportunities Found"}
                    </h3>
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
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Immediate Actions / Tasks */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Priority Tasks</h2>
                        <button onClick={() => setActivePage('projects')} className="text-sm text-purple-400 hover:underline">View All</button>
                    </div>
                    {pendingTasks.length > 0 ? (
                        <ul className="space-y-3">
                            {pendingTasks.map(task => (
                                <li key={task.id} className="flex items-center gap-3 bg-gray-700/50 p-2 rounded-lg">
                                    <button 
                                        onClick={() => setTasks(tasks.map(t => t.id === task.id ? {...t, status: TaskStatus.Done} : t))}
                                        className="text-gray-500 hover:text-green-500 transition-colors"
                                    >
                                        <div className="w-5 h-5 border-2 border-gray-500 rounded-full"></div>
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{task.title}</p>
                                        <p className="text-xs text-gray-400">{new Date(task.dueDate).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`w-2 h-2 rounded-full ${task.priority === 'Critical' ? 'bg-red-500' : task.priority === 'High' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                            <p>All caught up!</p>
                        </div>
                    )}
                </div>

                {/* Upcoming Schedule */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Upcoming</h2>
                        <button onClick={() => setActivePage('calendar')} className="text-sm text-purple-400 hover:underline">Calendar</button>
                    </div>
                    {upcomingEvents.length > 0 ? (
                        <ul className="space-y-3">
                            {upcomingEvents.map(event => (
                                <li key={event.id} className="flex gap-3 items-start bg-gray-700/50 p-2 rounded-lg">
                                    <div className="bg-gray-800 p-2 rounded text-center min-w-[50px]">
                                        <span className="block text-xs text-purple-400 font-bold">{new Date(event.date).toLocaleDateString('en-US', {month: 'short'}).toUpperCase()}</span>
                                        <span className="block text-lg font-bold">{new Date(event.date).getDate()}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{event.title}</p>
                                        <p className="text-xs text-gray-400">{event.type} {event.type === EventType.Gig ? '🎸' : ''}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-center py-8">Nothing scheduled soon.</p>
                    )}
                </div>

                {/* Quick Stats & Active Project */}
                <div className="space-y-6">
                    {/* Active Project Card */}
                    <div className="bg-gradient-to-br from-purple-900 to-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-lg font-bold text-purple-200 mb-2">Current Focus</h2>
                        {activeProject ? (
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">{activeProject.name}</h3>
                                <p className="text-sm text-purple-300 mb-4">{activeProject.status} &bull; {activeProject.type}</p>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    {/* Placeholder progress calculation */}
                                    <div className="bg-purple-500 h-2 rounded-full" style={{width: '45%'}}></div>
                                </div>
                                <p className="text-right text-xs text-purple-300 mt-1">45% Complete</p>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-400 mb-4">No active projects.</p>
                                <button onClick={() => setActivePage('projects')} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg text-sm">Start a Project</button>
                            </div>
                        )}
                    </div>

                    {/* Mini Financials */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-lg font-bold mb-4">This Month</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Income</p>
                                <p className="text-xl font-bold text-green-400">+${incomeThisMonth.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Expenses</p>
                                <p className="text-xl font-bold text-red-400">-${expenseThisMonth.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Next Release Countdown */}
            {nextRelease && (
                <div className="mt-8 bg-gray-900 border border-gray-700 p-4 rounded-xl flex items-center justify-between">
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

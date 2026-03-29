
import React, { useState, useEffect, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { Page, Task, Transaction, Show, Release, BandProfile, ProductionProject, Insight, ReportConfig, ReportDataSource, Tour, ReportDisplay as ReportDisplayType, User } from '../types';
import { generateReportInsights, generateReportConfigFromPrompt } from '../services/aiService';
import { BarChartIcon, BotIcon, LightbulbIcon, PlusIcon, SearchIcon } from './icons';
import { TaskStatus, TransactionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// --- Reusable Components ---
const StatCard: React.FC<{ title: string; value: string | number; subtext?: string; colorClass: string }> = ({ title, value, subtext, colorClass }) => (
    <div className={`bg-gray-800 p-4 rounded-xl shadow-lg border-l-4 ${colorClass}`}>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-bold mt-1 text-white">{value}</p>
        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
);

const InsightCard: React.FC<{ insight: Insight; onClick: (insight: Insight) => void }> = ({ insight, onClick }) => {
    const severityClasses = {
        info: 'border-blue-500',
        warning: 'border-yellow-500',
        opportunity: 'border-spotify-green',
    };
    return (
        <div className={`bg-gray-800/50 p-4 rounded-lg border-l-4 ${severityClasses[insight.severity]} flex justify-between items-center`}>
            <div className="flex items-start">
                <LightbulbIcon className="w-5 h-5 mr-3 mt-1 flex-shrink-0 text-yellow-300" />
                <p className="text-sm text-gray-300">{insight.text}</p>
            </div>
            <button onClick={() => onClick(insight)} className="text-xs bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1 px-3 rounded-md ml-4 flex-shrink-0">
                {insight.action.label}
            </button>
        </div>
    );
};

const ReportDisplay: React.FC<{ report: { config: ReportConfig, data: any[] } }> = ({ report }) => {
    const { config, data } = report;

    if (data.length === 0) {
        return <p className="text-gray-500">No data available for this report.</p>;
    }

    switch (config.displayAs) {
        case 'Table':
            const headers = Object.keys(data[0] || {}).filter(key => key !== 'id' && key !== 'bandId');
            return (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700/50">
                            <tr>
                                {headers.map(h => <th key={h} className="p-2 text-sm capitalize">{h.replace(/([A-Z])/g, ' $1')}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i} className="border-b border-gray-700 last:border-b-0">
                                    {headers.map(h => <td key={h} className="p-2 text-sm">{typeof row[h] === 'object' ? JSON.stringify(row[h]) : String(row[h])}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        case 'List':
            return (
                <ul className="space-y-2">
                    {data.map((item, i) => (
                        <li key={i} className="bg-gray-700/50 p-2 rounded-md text-sm">{item.title || item.description || item.name || JSON.stringify(item)}</li>
                    ))}
                </ul>
            );
        case 'BarChart':
            // Prepare data for bar chart
            const barData = data.map((item, index) => ({
                name: item.title || item.description || item.name || `Item ${index + 1}`,
                value: item.amount || item.count || item.id ? 1 : 0
            }));
            return (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                labelStyle={{ color: '#e2e8f0' }}
                            />
                            <Bar dataKey="value" fill="#8b5cf6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            );
        case 'PieChart':
            // Prepare data for pie chart
            const pieData = data.map((item, index) => ({
                name: item.title || item.description || item.name || `Item ${index + 1}`,
                value: item.amount || item.count || 1
            }));
            const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
            return (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                labelStyle={{ color: '#e2e8f0' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            );
        default:
            return <pre className="text-xs bg-gray-900 p-4 rounded-md overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>;
    }
};

// Main Component
export const Reports: React.FC<{ 
    bands: BandProfile[], 
    activeBandId: string,
    tasks: Task[],
    transactions: Transaction[],
    tours: Tour[],
    releases: Release[],
    projects: ProductionProject[],
    users: User[] 
}> = ({ bands, activeBandId, tasks: allTasks, transactions: allTransactions, tours: allTours, releases: allReleases, projects: allProjects, users }) => {
    // Data hooks from props
    const bandProfile = useMemo(() => bands.find(b => b.id === activeBandId) || bands[0], [bands, activeBandId]);

    const tasks = useMemo(() => allTasks.filter(t => t.bandId === activeBandId), [allTasks, activeBandId]);
    const transactions = useMemo(() => allTransactions.filter(t => t.bandId === activeBandId), [allTransactions, activeBandId]);
    const tours = useMemo(() => allTours.filter(t => t.bandId === activeBandId), [allTours, activeBandId]);
    const releases = useMemo(() => allReleases.filter(r => r.bandId === activeBandId), [allReleases, activeBandId]);
    const projects = useMemo(() => allProjects.filter(p => p.bandId === activeBandId), [allProjects, activeBandId]);

    const [insights, setInsights] = useState<Insight[]>([]);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<{ config: ReportConfig, data: any[] } | null>(null);

    const appContext = { tasks, transactions, tours, releases, projects };

    const handleInsightClick = (insight: Insight) => {
        let hash = `${insight.action.page}`;
        if (insight.action.params) {
            const params = new URLSearchParams(insight.action.params);
            hash += `?${params.toString()}`;
        }
        window.location.hash = hash;
    };

    const fetchInsights = async () => {
        setIsLoadingInsights(true);
        const taskId = `insights-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Generating AI insights...', estimatedDuration: 25 } }));
        try {
            const result = await generateReportInsights(appContext, bandProfile);
            setInsights(result);
        } finally {
            setIsLoadingInsights(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    const handleGenerateReport = (config: ReportConfig) => {
        let data: any[] = [];
        // This is a simplified data processing step. A real app might have more complex logic.
        switch(config.dataSource) {
            case 'Tasks': data = tasks; break;
            case 'Transactions': data = transactions; break;
            case 'Shows': data = tours.flatMap(t => t.shows); break;
            case 'Releases': data = releases; break;
        }

        // Apply filters (simplified example)
        if(config.filters.status) data = data.filter(d => d.status === config.filters.status);
        if(config.filters.type) data = data.filter(d => d.type === config.filters.type);
        if(config.filters.category) data = data.filter(d => d.category === config.filters.category);
        if(config.filters.projectId) data = data.filter(d => d.projectId === config.filters.projectId);

        setGeneratedReport({ config, data });
        setIsBuilderOpen(false);
    };

    // --- Dashboard KPI Calculations ---
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.Done).length;
    const taskCompletionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) + '%' : 'N/A';

    const incomeLast30Days = transactions
        .filter(t => t.type === TransactionType.Income && new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, t) => sum + t.amount, 0);

    const expenseLast30Days = transactions
        .filter(t => t.type === TransactionType.Expense && new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, t) => sum + t.amount, 0);

    const songsCompletedThisQuarter = releases
        .filter(r => new Date(r.releaseDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
        .reduce((sum, r) => sum + r.trackCount, 0);

    // Chart data calculations
    const taskCompletionOverTime = useMemo(() => {
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date.toISOString().split('T')[0];
        });

        return last30Days.map(date => {
            const tasksOnDate = tasks.filter(t => t.createdAt?.startsWith(date) || t.dueDate === date);
            const completedOnDate = tasksOnDate.filter(t => t.status === TaskStatus.Done);
            return {
                date: new Date(date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
                completed: completedOnDate.length,
                total: tasksOnDate.length
            };
        });
    }, [tasks]);

    const incomeVsExpenses = useMemo(() => {
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const dataByMonth = months.map(m => ({ month: m, income: 0, expense: 0 }));
        transactions.forEach(tx => {
            const monthIndex = new Date(tx.date).getMonth();
            if (tx.type === TransactionType.Income) dataByMonth[monthIndex].income += tx.amount;
            else dataByMonth[monthIndex].expense += tx.amount;
        });
        return dataByMonth;
    }, [transactions]);


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Reports & Analytics</h1>
                <button onClick={() => setIsBuilderOpen(true)} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">
                    <PlusIcon className="h-5 w-5 mr-2" /> Create Report
                </button>
            </div>
            
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard title="Task Completion" value={taskCompletionRate} subtext={`${completedTasks}/${totalTasks} done`} colorClass="border-blue-500"/>
                <StatCard title="Income (30d)" value={`$${incomeLast30Days.toFixed(2)}`} colorClass="border-green-500"/>
                <StatCard title="Expenses (30d)" value={`$${expenseLast30Days.toFixed(2)}`} colorClass="border-red-500"/>
                <StatCard title="Songs Released (90d)" value={songsCompletedThisQuarter} colorClass="border-purple-500"/>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-xl font-bold mb-4">Conclusão de Tarefas ao Longo do Tempo</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={taskCompletionOverTime}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis dataKey="date" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                    labelStyle={{ color: '#e2e8f0' }}
                                />
                                <Line type="monotone" dataKey="completed" stroke="#10b981" name="Concluídas" />
                                <Line type="monotone" dataKey="total" stroke="#8b5cf6" name="Criadas" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-xl font-bold mb-4">Receita vs Despesas</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={incomeVsExpenses}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis dataKey="month" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                    labelStyle={{ color: '#e2e8f0' }}
                                />
                                <Bar dataKey="income" fill="#10b981" name="Receita" />
                                <Bar dataKey="expense" fill="#ef4444" name="Despesa" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gray-800 p-6 rounded-xl mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold flex items-center"><BotIcon className="w-6 h-6 mr-3 text-purple-400" /> AI Insights</h2>
                    {insights.length === 0 && !isLoadingInsights && (
                        <button 
                            onClick={fetchInsights}
                            className="text-sm bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
                        >
                            <LightbulbIcon className="w-4 h-4 mr-2"/> Generate Insights
                        </button>
                    )}
                </div>
                {isLoadingInsights ? (
                    <p className="text-gray-400">Analyzing your data... check the progress bar at the top.</p>
                ) : (
                    <div className="space-y-3">
                        {insights.length > 0 ? insights.map(insight => (
                            <InsightCard key={insight.id} insight={insight} onClick={handleInsightClick} />
                        )) : <p className="text-gray-500 italic">Click 'Generate Insights' to have AI analyze your band's performance and find opportunities.</p>}
                    </div>
                )}
            </div>

            {/* Generated Report */}
            {generatedReport && (
                 <div className="bg-gray-800 p-6 rounded-xl">
                    <h2 className="text-2xl font-bold mb-4">{generatedReport.config.name}</h2>
                    <ReportDisplay report={generatedReport} />
                 </div>
            )}

            {isBuilderOpen && <ReportBuilderModal projects={projects} users={users} onClose={() => setIsBuilderOpen(false)} onGenerate={handleGenerateReport} activeBandId={activeBandId} />}
        </div>
    );
};

// --- Report Builder Modal ---
const ReportBuilderModal: React.FC<{
    projects: ProductionProject[],
    users: User[],
    onClose: () => void,
    onGenerate: (config: ReportConfig) => void,
    activeBandId: string
}> = ({ projects, users, onClose, onGenerate, activeBandId }) => {
    const [prompt, setPrompt] = useState('');
    const [isPromptLoading, setIsPromptLoading] = useState(false);
    const [config, setConfig] = useState<Partial<ReportConfig>>({
        dataSource: 'Tasks',
        displayAs: 'Table',
        filters: {}
    });

    const handlePromptGenerate = async () => {
        if(!prompt) return;
        setIsPromptLoading(true);
        const taskId = `report-config-${Date.now()}`;
        window.dispatchEvent(new CustomEvent('start-task', { detail: { id: taskId, name: 'Building report from prompt...', estimatedDuration: 10 } }));
        try {
            const generatedConfig = await generateReportConfigFromPrompt(prompt, projects, users);
            if (generatedConfig) {
                setConfig(prev => ({...prev, ...generatedConfig}));
            }
        } finally {
            setIsPromptLoading(false);
            window.dispatchEvent(new CustomEvent('end-task', { detail: { id: taskId } }));
        }
    };

    const handleFinalGenerate = () => {
        const fullConfig: ReportConfig = {
            id: `rep-${Date.now()}`,
            name: prompt || `${config.dataSource} Report`,
            dataSource: config.dataSource || 'Tasks',
            displayAs: config.displayAs || 'Table',
            filters: config.filters || {},
            groupBy: config.groupBy,
            bandId: activeBandId,
        };
        onGenerate(fullConfig);
    };
    
    const setFilter = (key: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            filters: { ...prev.filters, [key]: value }
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Create a New Report</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </header>

                <main className="flex-grow p-6 overflow-y-auto space-y-6">
                    {/* AI Prompt Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-purple-400 mb-2">1. Ask the AI (Easiest)</h3>
                         <div className="flex gap-2">
                            <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g., 'Show my gear expenses this year'" className="flex-1 bg-gray-700 p-2 rounded-lg text-sm"/>
                            <button onClick={handlePromptGenerate} disabled={isPromptLoading} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg text-sm disabled:bg-gray-600">
                                <SearchIcon className="w-4 h-4 mr-1"/>
                                {isPromptLoading ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>

                    <div className="text-center text-gray-500 font-bold">OR</div>

                    {/* Manual Builder */}
                    <div>
                         <h3 className="text-lg font-semibold text-gray-300 mb-2">2. Build Manually</h3>
                         <div className="space-y-4 bg-gray-800 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400">Data Source</label>
                                    <select value={config.dataSource} onChange={e => setConfig({...config, dataSource: e.target.value as ReportDataSource})} className="w-full bg-gray-700 p-2 rounded-lg mt-1 text-sm">
                                        <option value="Tasks">Tasks</option>
                                        <option value="Transactions">Transactions</option>
                                        <option value="Shows">Shows</option>
                                        <option value="Releases">Releases</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">Display As</label>
                                    <select value={config.displayAs} onChange={e => setConfig({...config, displayAs: e.target.value as ReportDisplayType})} className="w-full bg-gray-700 p-2 rounded-lg mt-1 text-sm">
                                        <option value="Table">Table</option>
                                        <option value="List">List</option>
                                        <option value="BarChart">Bar Chart</option>
                                        <option value="PieChart">Pie Chart</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-md font-semibold text-gray-400 mb-2">Filters</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {config.dataSource === 'Tasks' && (
                                        <>
                                            <select onChange={e => setFilter('projectId', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg text-xs"><option value="">All Projects</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                            <select onChange={e => setFilter('status', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg text-xs"><option value="">All Statuses</option>{Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}</select>
                                        </>
                                    )}
                                     {config.dataSource === 'Transactions' && (
                                        <>
                                            <select onChange={e => setFilter('type', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg text-xs"><option value="">All Types</option>{Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}</select>
                                            <input onChange={e => setFilter('category', e.target.value)} placeholder="Category..." className="w-full bg-gray-700 p-2 rounded-lg text-xs"/>
                                        </>
                                    )}
                                </div>
                            </div>
                         </div>
                    </div>
                </main>

                <footer className="p-4 border-t border-gray-700 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={handleFinalGenerate} className="bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Generate Report</button>
                </footer>
            </div>
        </div>
    );
};

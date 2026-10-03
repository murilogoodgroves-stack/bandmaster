
import React, { useState, useMemo, useCallback } from 'react';
import type { Song, ProductionProject, Task, User, ProjectMilestone, ProjectDeliverable } from '../types';
import { SongStatus, ProjectType, Daw, ProductionProjectStatus, TaskStatus, TaskPriority } from '../types';
import { songChecklistTemplate } from '../data/initialData';
import { PlusIcon, TrashIcon, EditIcon, ChevronDownIcon, FolderIcon, MusicIcon, ChevronLeftIcon, SaveIcon } from './icons';
import { Tip } from './Tip';
import { ProjectModal } from './modals/ProjectModal';
import { calculateProjectProgress, summarizeProjectPlanning, createDefaultProjectPlan } from '../projectPlanning';


// Helper function to calculate song progress
const calculateSongProgress = (song: Song, allTasks: Task[]) => {
    const songTasks = allTasks.filter(t => t.songId === song.id);
    if(songTasks.length === 0) return song.status === SongStatus.Released ? 100 : 0;
    const completed = songTasks.filter(t => t.status === TaskStatus.Done).length;
    return Math.round((completed / songTasks.length) * 100);
};

// Helper function to calculate project progress
const calculateProjectProgressForBoard = (project: ProductionProject, allTasks: Task[]) => {
    const planningProgress = calculateProjectProgress(project);
    const projectTasks = allTasks.filter(t => t.projectId === project.id && !t.songId);
    if (projectTasks.length === 0) return planningProgress;
    const completedTasks = projectTasks.filter(t => t.status === TaskStatus.Done).length;
    const taskProgress = Math.round((completedTasks / projectTasks.length) * 100);
    return Math.min(100, Math.round((planningProgress * 0.7) + (taskProgress * 0.3)));
};

interface ProductionProps {
    users: User[];
    activeBandId: string;
    songs: Song[];
    setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
    projects: ProductionProject[];
    setProjects: React.Dispatch<React.SetStateAction<ProductionProject[]>>;
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

// Main Component
export const Production: React.FC<ProductionProps> = ({ users, activeBandId, songs: allSongs, setSongs, projects: allProjects, setProjects, tasks: allTasks, setTasks }) => {
    const songs = useMemo(() => allSongs.filter(s => s.bandId === activeBandId), [allSongs, activeBandId]);
    const projects = useMemo(() => allProjects.filter(p => p.bandId === activeBandId), [allProjects, activeBandId]);
    const tasks = useMemo(() => allTasks.filter(t => t.bandId === activeBandId), [allTasks, activeBandId]);

    const [view, setView] = useState<'projects' | 'projectDetail'>('projects');
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isSongModalOpen, setIsSongModalOpen] = useState(false);
    const [editingSong, setEditingSong] = useState<Song | null>(null);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProductionProject | null>(null);
    
    const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

    const handleSaveSong = useCallback((songData: Song) => {
        const exists = allSongs.some(s => s.id === songData.id);
        
        if (!exists) {
            const newTasks = songChecklistTemplate.map(templateItem => ({
                ...templateItem,
                id: `task-${songData.id}-${templateItem.title.replace(/\s/g, '')}`,
                songId: songData.id,
                projectId: songData.projectId,
                bandId: activeBandId,
                dueDate: new Date().toISOString().substring(0, 10)
            }));
            setTasks(prev => [...prev, ...newTasks]);
        }

        setSongs(prevSongs => {
            if (exists) {
                return prevSongs.map(s => s.id === songData.id ? songData : s);
            }
            return [...prevSongs, songData];
        });

        if (songData.projectId && !projects.find(p => p.id === songData.projectId)?.songIds.includes(songData.id)) {
            setProjects(prev => prev.map(p => p.id === songData.projectId ? { ...p, songIds: [...p.songIds, songData.id] } : p));
        }

        setIsSongModalOpen(false);
        setEditingSong(null);
    }, [allSongs, setSongs, setTasks, projects, setProjects, activeBandId]);
    
    const handleDeleteSong = useCallback((songId: string) => {
        if (window.confirm("Are you sure you want to permanently delete this song and its tasks? This action cannot be undone.")) {
            setSongs(prev => prev.filter(s => s.id !== songId));
            setTasks(prev => prev.filter(t => t.songId !== songId));
            setProjects(prev => prev.map(p => ({ ...p, songIds: p.songIds.filter(id => id !== songId) })));
        }
    }, [setSongs, setTasks, setProjects]);

    const handleSaveProject = useCallback((projectData: ProductionProject) => {
        setProjects(prev => {
            const exists = prev.some(p => p.id === projectData.id);
            if (exists) {
                return prev.map(p => p.id === projectData.id ? projectData : p);
            }
            return [...prev, projectData];
        });
        setIsProjectModalOpen(false);
        setEditingProject(null);
    }, [setProjects]);
    
    const handleDeleteProject = useCallback((projectId: string) => {
        if (window.confirm("Are you sure you want to permanently delete this project? This will also remove its associated tasks but will keep the songs. This action cannot be undone.")) {
            setProjects(prev => prev.filter(p => p.id !== projectId));
            setTasks(prev => prev.filter(t => t.projectId !== projectId));
            setSongs(prev => prev.map(s => s.projectId === projectId ? { ...s, projectId: undefined } : s));

            if (selectedProjectId === projectId) {
                setView('projects');
                setSelectedProjectId(null);
            }
        }
    }, [setProjects, setTasks, setSongs, selectedProjectId]);


    const openNewSongModal = () => {
        const newSong: Song = {
            id: `song-${Date.now()}`, title: '', workingTitles: [], composerSplits: [], dateCreated: new Date().toISOString().substring(0, 10),
            genre: [], tempo: 120, keySignature: 'C Major', status: SongStatus.Idea, projectId: selectedProjectId || undefined,
            instrumentTracking: [],
            bandId: activeBandId,
        };
        setEditingSong(newSong);
        setIsSongModalOpen(true);
    };

    const openEditSongModal = (song: Song) => {
        setEditingSong(song);
        setIsSongModalOpen(true);
    };

    const openNewProjectModal = () => {
        const targetDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString().slice(0, 10);
        const projectDefaults = createDefaultProjectPlan('New project', ProjectType.Album, targetDate);
        const newProject: ProductionProject = {
            id: `proj-${Date.now()}`, name: '', type: ProjectType.Album, status: ProductionProjectStatus.Planning, targetReleaseDate: targetDate,
            songIds: [], description: '', teamMemberIds: [], priority: TaskPriority.Medium, ownerId: users[0]?.id || '',
            milestones: projectDefaults.milestones, deliverables: projectDefaults.deliverables,
            bandId: activeBandId,
        };
        setEditingProject(newProject);
        setIsProjectModalOpen(true);
    };
    
    const openEditProjectModal = (project: ProductionProject) => {
        setEditingProject(project);
        setIsProjectModalOpen(true);
    }

    const selectProject = (projectId: string) => {
        setSelectedProjectId(projectId);
        setView('projectDetail');
    };

    const renderContent = () => {
        if (view === 'projectDetail' && selectedProject) {
            return <ProjectDetailView 
                        project={selectedProject} 
                        songs={songs}
                        setSongs={setSongs}
                        tasks={tasks}
                        setTasks={setTasks}
                        users={users}
                        onBack={() => setView('projects')} 
                        onEditProject={openEditProjectModal}
                        onNewSong={openNewSongModal}
                        onEditSong={openEditSongModal}
                        onDeleteSong={handleDeleteSong}
                        onUpdateProject={(updater) => setProjects(prev => prev.map(p => p.id === selectedProject.id ? updater(p) : p))}
                    />;
        }
        return <ProjectLibraryView projects={projects} tasks={tasks} onSelectProject={selectProject} onNewProject={openNewProjectModal} onDeleteProject={handleDeleteProject} onEditProject={openEditProjectModal} />;
    };

    return (
        <div>
            {renderContent()}
            {isSongModalOpen && editingSong && (
                <SongDetailModal song={editingSong} onClose={() => { setIsSongModalOpen(false); setEditingSong(null); }} onSave={handleSaveSong} />
            )}
            {isProjectModalOpen && editingProject && (
                <ProjectModal project={editingProject} onClose={() => { setIsProjectModalOpen(false); setEditingProject(null); }} onSave={handleSaveProject} />
            )}
        </div>
    );
};

// View for showing all projects
const ProjectLibraryView: React.FC<{ projects: ProductionProject[], tasks: Task[], onSelectProject: (id: string) => void, onNewProject: () => void, onDeleteProject: (id: string) => void, onEditProject: (project: ProductionProject) => void }> = ({ projects, tasks, onSelectProject, onNewProject, onDeleteProject, onEditProject }) => {
    const [showTip, setShowTip] = useState(true);
    return <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold">Production Studio</h1>
            <button onClick={onNewProject} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">
                <PlusIcon className="h-5 w-5 mr-2" /> New Project
            </button>
        </div>
        {showTip && <Tip onDismiss={() => setShowTip(false)}>This is your central hub for music creation. All projects and their tasks are now synced with the main Projects board.</Tip>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.filter(p => p.type !== ProjectType.Other).map(p => (
                <ProjectCard key={p.id} project={p} progress={calculateProjectProgressForBoard(p, tasks)} onSelect={() => onSelectProject(p.id)} onDelete={() => onDeleteProject(p.id)} onEdit={() => onEditProject(p)} />
            ))}
        </div>
    </div>;
};

const ProjectCard: React.FC<{ project: ProductionProject, progress: number, onSelect: () => void, onDelete: () => void, onEdit: () => void }> = ({ project, progress, onSelect, onDelete, onEdit }) => {
    const summary = summarizeProjectPlanning(project);
    return (
        <div onClick={onSelect} className="bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:shadow-purple-500/20 hover:-translate-y-1 transition-all group relative">
            <div className="absolute top-3 right-3 flex gap-2 z-10">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-1.5 bg-gray-900/50 rounded-full text-purple-400 hover:bg-purple-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit Project"
                >
                    <EditIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-1.5 bg-gray-900/50 rounded-full text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Project"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="w-full h-40 bg-gray-700 rounded-t-lg flex items-center justify-center">
                {project.artworkUrl ? <p className="text-gray-500 text-sm">(Artwork)</p> : <FolderIcon className="w-16 h-16 text-gray-600" />}
            </div>
            <div className="p-4">
                <p className="text-xs text-purple-400">{project.type}</p>
                <h3 className="text-xl font-bold text-white truncate">{project.name}</h3>
                <p className="text-sm text-gray-400">Due: {new Date(project.targetReleaseDate).toLocaleDateString()}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-300">
                    <span>{summary.doneMilestones}/{summary.totalMilestones} milestones</span>
                    <span>{summary.doneDeliverables}/{summary.totalDeliverables} deliverables</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-right text-xs text-gray-500 mt-1">{progress}% Complete</p>
            </div>
        </div>
    );
};


// View for a single project's details
const ProjectDetailView: React.FC<{
    project: ProductionProject;
    songs: Song[];
    setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    users: User[];
    onBack: () => void;
    onEditProject: (project: ProductionProject) => void;
    onNewSong: () => void;
    onEditSong: (song: Song) => void;
    onDeleteSong: (songId: string) => void;
    onUpdateProject: (updater: (project: ProductionProject) => ProductionProject) => void;
}> = ({ project, songs, setSongs, tasks, setTasks, users, onBack, onEditProject, onNewSong, onEditSong, onDeleteSong, onUpdateProject }) => {
    const [selectedSongId, setSelectedSongId] = useState<string | null>(project.songIds[0] || null);

    const projectSongs = useMemo(() => songs.filter(s => project.songIds.includes(s.id)), [songs, project.songIds]);
    const projectTasks = useMemo(() => tasks.filter(t => t.projectId === project.id && !t.songId), [tasks, project.id]);
    
    const selectedSong = useMemo(() => songs.find(s => s.id === selectedSongId), [songs, selectedSongId]);
    const songTasks = useMemo(() => tasks.filter(t => t.songId === selectedSongId), [tasks, selectedSongId]);

    const handleSelectSong = (songId: string) => {
        setSelectedSongId(current => current === songId ? null : songId);
    };

    const updateTask = (taskId: string, newValues: Partial<Task>) => {
        setTasks(prevTasks => prevTasks.map(task => 
            task.id === taskId ? { ...task, ...newValues } : task
        ));
    };

    const updateSong = (songId: string, newValues: Partial<Song>) => {
        setSongs(prevSongs => prevSongs.map(song => 
            song.id === songId ? { ...song, ...newValues } : song
        ));
    };

    const handleAddTask = (title: string, isSongTask: boolean) => {
        if (!title.trim()) return;
        const newTask: Task = {
            id: `task-${Date.now()}`,
            title,
            assignedToId: '',
            dueDate: new Date().toISOString().substring(0, 10),
            status: TaskStatus.ToDo,
            priority: TaskPriority.Medium,
            projectId: project.id,
            songId: isSongTask ? selectedSongId! : undefined,
            bandId: project.bandId,
        };
        setTasks(prev => [...prev, newTask]);
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const planningSummary = summarizeProjectPlanning(project);
    const updateMilestoneStatus = (milestoneId: string, nextStatus: ProjectMilestone['status']) => {
        onUpdateProject((currentProject) => ({
            ...currentProject,
            milestones: (currentProject.milestones ?? []).map((milestone) =>
                milestone.id === milestoneId ? { ...milestone, status: nextStatus } : milestone
            )
        }));
    };

    const updateDeliverableStatus = (deliverableId: string, nextStatus: ProjectDeliverable['status']) => {
        onUpdateProject((currentProject) => ({
            ...currentProject,
            deliverables: (currentProject.deliverables ?? []).map((deliverable) =>
                deliverable.id === deliverableId ? { ...deliverable, status: nextStatus } : deliverable
            )
        }));
    };

    return (
        <div>
            <button onClick={onBack} className="flex items-center text-sm text-purple-400 hover:underline mb-4">
                <ChevronLeftIcon className="w-4 h-4 mr-1" /> Back to All Projects
            </button>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-4xl font-bold">{project.name}</h1>
                    <p className="text-gray-400">{project.type} &bull; Target Release: {new Date(project.targetReleaseDate).toLocaleDateString()}</p>
                </div>
                <button onClick={() => onEditProject(project)} className="flex items-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                    <EditIcon className="h-5 h-5 mr-2" /> Edit Project
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-xl">
                    <p className="text-xs uppercase text-gray-500">Progress</p>
                    <p className="text-2xl font-bold text-purple-300">{planningSummary.progress}%</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl">
                    <p className="text-xs uppercase text-gray-500">Milestones</p>
                    <p className="text-2xl font-bold text-blue-300">{planningSummary.doneMilestones}/{planningSummary.totalMilestones}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl">
                    <p className="text-xs uppercase text-gray-500">Next milestone</p>
                    <p className="text-md font-semibold text-green-300">{planningSummary.nextMilestone?.title ?? 'No milestone scheduled'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Tracklist songs={projectSongs} onNewSong={onNewSong} onEditSong={onEditSong} onDeleteSong={onDeleteSong} onSelectSong={handleSelectSong} selectedSongId={selectedSongId} allTasks={tasks} />
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-800 p-4 rounded-xl">
                        <h2 className="text-xl font-bold mb-3">Project Planning</h2>
                        <div className="space-y-3">
                            {(project.milestones ?? []).map((milestone) => (
                                <div key={milestone.id} className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-white">{milestone.title}</p>
                                            <p className="text-xs text-gray-400">Due {new Date(milestone.dueDate).toLocaleDateString()}</p>
                                        </div>
                                        <select
                                            value={milestone.status}
                                            onChange={(e) => updateMilestoneStatus(milestone.id, e.target.value as ProjectMilestone['status'])}
                                            className="bg-gray-700 text-xs text-white p-1.5 rounded-md"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Deliverables: {milestone.deliverables.join(', ') || 'None yet'}</p>
                                </div>
                            ))}
                        </div>
                        {(project.milestones ?? []).length === 0 && <p className="text-sm text-gray-500">No milestones configured yet.</p>}
                    </div>

                    <div className="bg-gray-800 p-4 rounded-xl">
                        <h2 className="text-xl font-bold mb-3">Deliverables</h2>
                        <div className="space-y-3">
                            {(project.deliverables ?? []).map((deliverable) => (
                                <div key={deliverable.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                                    <div>
                                        <p className="font-medium text-white">{deliverable.title}</p>
                                        {deliverable.dueDate && <p className="text-xs text-gray-400">Due {new Date(deliverable.dueDate).toLocaleDateString()}</p>}
                                    </div>
                                    <select
                                        value={deliverable.status}
                                        onChange={(e) => updateDeliverableStatus(deliverable.id, e.target.value as ProjectDeliverable['status'])}
                                        className="bg-gray-700 text-xs text-white p-1.5 rounded-md"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in-progress">In progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                        {(project.deliverables ?? []).length === 0 && <p className="text-sm text-gray-500">No deliverables configured yet.</p>}
                    </div>

                    {selectedSong && (
                        <>
                            <ChecklistDisplay 
                                title={`${selectedSong.title} Checklist`} 
                                tasks={songTasks} 
                                users={users} 
                                onUpdateTask={updateTask} 
                                onAddTask={(title) => handleAddTask(title, true)}
                                onDeleteTask={handleDeleteTask}
                            />
                            <CommentsBox song={selectedSong} onUpdateSong={updateSong} />
                        </>
                    )}
                    <ChecklistDisplay 
                        title="Album Production Checklist" 
                        tasks={projectTasks} 
                        users={users} 
                        onUpdateTask={updateTask}
                        onAddTask={(title) => handleAddTask(title, false)}
                        onDeleteTask={handleDeleteTask}
                    />
                </div>
            </div>
        </div>
    );
};

const Tracklist: React.FC<{ songs: Song[], allTasks: Task[], onNewSong: () => void, onEditSong: (song: Song) => void, onDeleteSong: (songId: string) => void, onSelectSong: (songId: string) => void, selectedSongId: string | null }> = ({ songs, allTasks, onNewSong, onEditSong, onDeleteSong, onSelectSong, selectedSongId }) => (
    <div className="bg-gray-800 p-4 rounded-xl">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Tracklist ({songs.length})</h2>
            <button onClick={onNewSong} className="flex items-center text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-3 rounded-lg"><PlusIcon className="h-4 h-4 mr-1"/> Add Song</button>
        </div>
        <div className="space-y-2">
            {songs.map(song => <SongCard key={song.id} song={song} isSelected={selectedSongId === song.id} onSelect={() => onSelectSong(song.id)} onEdit={() => onEditSong(song)} onDelete={() => onDeleteSong(song.id)} allTasks={allTasks} />)}
            {songs.length === 0 && <p className="text-center text-gray-500 py-8">No songs added to this project yet.</p>}
        </div>
    </div>
);

const SongCard: React.FC<{ song: Song, allTasks: Task[], isSelected: boolean, onSelect: () => void, onEdit: () => void, onDelete: () => void }> = ({ song, allTasks, isSelected, onSelect, onEdit, onDelete }) => {
    const progress = calculateSongProgress(song, allTasks);
    return (
        <div onClick={onSelect} className={`p-3 rounded-lg flex items-center gap-4 cursor-pointer transition-all ${isSelected ? 'bg-purple-800/50 ring-2 ring-purple-500' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
            <MusicIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-grow">
                <p className="font-semibold text-white">{song.title}</p>
                <p className="text-xs text-gray-400">{song.status}</p>
                <div className="w-full bg-gray-600 rounded-full h-1.5 mt-1">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{width: `${progress}%`}}></div>
                </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 hover:bg-gray-600 rounded-full"><EditIcon className="w-4 h-4 text-gray-400"/></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 hover:bg-gray-600 rounded-full"><TrashIcon className="w-4 h-4 text-red-500"/></button>
        </div>
    );
};

const ChecklistDisplay: React.FC<{ title: string; tasks: Task[]; users: User[]; onUpdateTask: (taskId: string, values: Partial<Task>) => void; onAddTask: (title: string) => void; onDeleteTask: (taskId: string) => void; }> = ({ title, tasks, users, onUpdateTask, onAddTask, onDeleteTask }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');

    const completed = tasks.filter(t => t.status === TaskStatus.Done).length;
    const total = tasks.length;

    const handleAddTask = () => {
        onAddTask(newTaskTitle);
        setNewTaskTitle('');
        setIsAdding(false);
    };

    const handleStartEdit = (task: Task) => {
        setEditingTaskId(task.id);
        setEditingText(task.title);
    };

    const handleSaveEdit = () => {
        if (editingTaskId) {
            onUpdateTask(editingTaskId, { title: editingText });
        }
        setEditingTaskId(null);
        setEditingText('');
    };
    
    return (
        <div className="bg-gray-800 p-4 rounded-xl">
            <h2 className="text-xl font-bold mb-1">{title}</h2>
            <p className="text-sm text-gray-400 mb-4">{completed} of {total} tasks complete</p>
            <div className="space-y-2">
                {tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-md group">
                        <input type="checkbox" checked={task.status === TaskStatus.Done} onChange={e => onUpdateTask(task.id, { status: e.target.checked ? TaskStatus.Done : TaskStatus.ToDo })} className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-600"/>
                        {editingTaskId === task.id ? (
                            <input type="text" value={editingText} onChange={e => setEditingText(e.target.value)} onBlur={handleSaveEdit} onKeyDown={e => e.key === 'Enter' && handleSaveEdit()} className="flex-grow text-sm bg-gray-800 p-1 rounded-md" autoFocus/>
                        ) : (
                            <p className={`flex-grow text-sm ${task.status === TaskStatus.Done ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</p>
                        )}
                        <select value={task.assignedToId || ''} onChange={e => onUpdateTask(task.id, { assignedToId: e.target.value })} className="bg-gray-700 text-xs p-1 rounded">
                            <option value="">Unassigned</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name.split(' ')[0]}</option>)}
                        </select>
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button onClick={() => handleStartEdit(task)} className="p-1 hover:bg-gray-600 rounded-full"><EditIcon className="w-4 h-4 text-gray-400"/></button>
                            <button onClick={() => onDeleteTask(task.id)} className="p-1 hover:bg-gray-600 rounded-full"><TrashIcon className="w-4 h-4 text-red-500"/></button>
                        </div>
                    </div>
                ))}
            </div>
             <div className="mt-4">
                {isAdding ? (
                    <div className="flex gap-2">
                        <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="New task..." className="flex-grow bg-gray-700 p-2 rounded-lg text-sm" autoFocus />
                        <button onClick={handleAddTask} className="bg-spotify-green text-white font-bold py-1 px-3 rounded-lg text-sm">Add</button>
                        <button onClick={() => setIsAdding(false)} className="bg-gray-600 text-white font-bold py-1 px-3 rounded-lg text-sm">Cancel</button>
                    </div>
                ) : (
                    <button onClick={() => setIsAdding(true)} className="w-full flex items-center justify-center p-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-colors">
                        <PlusIcon className="h-4 h-4 mr-2"/> Add Checklist Item
                    </button>
                )}
            </div>
        </div>
    );
};

const CommentsBox: React.FC<{ song: Song, onUpdateSong: (songId: string, values: Partial<Song>) => void }> = ({ song, onUpdateSong }) => {
    const [comments, setComments] = useState(song.comments || '');
    const handleSave = () => onUpdateSong(song.id, { comments });
    return (
        <div className="bg-gray-800 p-4 rounded-xl">
            <h2 className="text-xl font-bold mb-4">Comments & Notes</h2>
            <textarea 
                value={comments} 
                onChange={e => setComments(e.target.value)} 
                onBlur={handleSave} // Auto-save on blur
                rows={5} 
                className="w-full bg-gray-700 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" 
                placeholder="Add production notes, lyric ideas, or feedback here... (Auto-saves)"
            />
            <div className="flex justify-end mt-2">
                <button onClick={handleSave} className="flex items-center text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-4 rounded-lg">
                    <SaveIcon className="h-4 h-4 mr-2" /> Save Comments
                </button>
            </div>
        </div>
    );
};

// MODALS
const SongDetailModal: React.FC<{ song: Song, onClose: () => void, onSave: (song: Song) => void }> = ({ song, onClose, onSave }) => {
    const [editedSong, setEditedSong] = useState<Song>(song);
    const handleSave = () => onSave(editedSong);
    const handleFieldChange = (field: keyof Song, value: any) => setEditedSong(prev => ({ ...prev, [field]: value }));

    return (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-gray-700 flex-shrink-0">
                    <input type="text" value={editedSong.title} onChange={e => handleFieldChange('title', e.target.value)} placeholder="New Song Title" className="text-2xl font-bold bg-transparent w-full focus:outline-none"/>
                </header>
                <main className="flex-grow p-6 overflow-y-auto space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <label className="block"><span className="text-gray-400 text-sm">Status</span>
                            <select value={editedSong.status} onChange={e => handleFieldChange('status', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg mt-1">
                                {Object.values(SongStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </label>
                        <label className="block"><span className="text-gray-400 text-sm">Genre(s)</span>
                            <input type="text" value={editedSong.genre.join(', ')} onChange={e => handleFieldChange('genre', e.target.value.split(',').map(s => s.trim()))} placeholder="pop, rock" className="w-full bg-gray-700 p-2 rounded-lg mt-1" />
                        </label>
                    </div>
                </main>
                 <footer className="p-4 border-t border-gray-700 flex justify-end gap-4 flex-shrink-0">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={handleSave} className="bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Save Song</button>
                </footer>
            </div>
        </div>
    );
};

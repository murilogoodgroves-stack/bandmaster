
import React, { useState, useMemo, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { Task, ProductionProject, User, Release } from '../types';
import { TaskStatus, TaskPriority, ProjectType, ProductionProjectStatus } from '../types';
import { PlusIcon, TrashIcon, EditIcon } from './icons';
import { initialTasks, initialProductionProjects, initialUsers } from '../data/initialData';
import { Tip } from './Tip';
import { ProjectModal } from './modals/ProjectModal';

interface ProjectsProps {
    activeBandId: string;
    users: User[];
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    projects: ProductionProject[];
    setProjects: React.Dispatch<React.SetStateAction<ProductionProject[]>>;
    releases: Release[];
    setReleases: React.Dispatch<React.SetStateAction<Release[]>>;
}

const AddTaskModal: React.FC<{
    onClose: () => void;
    onSave: (task: Omit<Task, 'id' | 'bandId'>) => void;
    projects: ProductionProject[];
    users: User[];
    defaultProjectId: string;
}> = ({ onClose, onSave, projects, users, defaultProjectId }) => {
    const [title, setTitle] = useState('');
    const [projectId, setProjectId] = useState(defaultProjectId || (projects.length > 0 ? projects[0].id : ''));
    const [assignedToId, setAssignedToId] = useState(users.length > 0 ? users[0].id : '');
    const [dueDate, setDueDate] = useState(new Date().toISOString().substring(0, 10));
    const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
    const [status, setStatus] = useState<TaskStatus>(TaskStatus.ToDo);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !projectId || !dueDate) return;
        onSave({
            title,
            projectId,
            assignedToId,
            dueDate,
            priority,
            status
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-brand-bg-card rounded-xl shadow-2xl p-6 w-full max-w-lg">
                <h2 className="text-2xl font-medium mb-4">Add New Task</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea value={title} onChange={e => setTitle(e.target.value)} placeholder="Task description..." rows={3} className="w-full bg-brand-bg-content p-3 rounded-lg" required />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400">Project</label>
                            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full bg-brand-bg-content p-2 rounded-lg mt-1">
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400">Assign To</label>
                            <select value={assignedToId} onChange={e => setAssignedToId(e.target.value)} className="w-full bg-brand-bg-content p-2 rounded-lg mt-1">
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400">Due Date</label>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-brand-bg-content p-2 rounded-lg mt-1" required />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400">Priority</label>
                            <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className="w-full bg-brand-bg-content p-2 rounded-lg mt-1">
                                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="text-xs text-gray-400">Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} className="w-full bg-brand-bg-content p-2 rounded-lg mt-1">
                                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-brand-accent hover:bg-brand-accent-dark text-white font-medium py-2 px-4 rounded-lg">Add Task</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TaskCard: React.FC<{ 
    task: Task, 
    users: User[], 
    onDelete: (id: string) => void,
    onEdit: (task: Task) => void,
    onStatusChange: (id: string, status: TaskStatus) => void,
    onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void,
    isDragging: boolean
}> = ({ task, users, onDelete, onEdit, onStatusChange, onDragStart, isDragging }) => {
    const assignee = users.find(u => u.id === task.assignedToId);
    
    const priorityClasses = {
        [TaskPriority.Critical]: { border: 'border-red-500', bg: 'bg-red-500' },
        [TaskPriority.High]:    { border: 'border-orange-500', bg: 'bg-orange-500' },
        [TaskPriority.Medium]:  { border: 'border-yellow-500', bg: 'bg-yellow-500' },
        [TaskPriority.Low]:     { border: 'border-blue-500', bg: 'bg-blue-500' },
    };

    const { border, bg } = priorityClasses[task.priority];

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(task.id);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(task);
    };

    return (
        <div 
            draggable="true"
            onDragStart={(e) => onDragStart(e, task.id)}
            className={`bg-gray-800 p-3 rounded-lg shadow-md mb-3 border-l-4 cursor-grab group ${border} ${isDragging ? 'opacity-50' : ''}`}
        >
            <div className="flex justify-between items-start gap-2 relative">
                <div className="flex items-start gap-2 flex-grow">
                    <input 
                        type="checkbox" 
                        checked={task.status === TaskStatus.Done}
                        onChange={(e) => onStatusChange(task.id, e.target.checked ? TaskStatus.Done : TaskStatus.ToDo)}
                        className="mt-1 h-4 w-4 rounded bg-gray-700 border-gray-500 text-purple-600 focus:ring-purple-600 cursor-pointer flex-shrink-0"
                        onClick={(e) => e.stopPropagation()} 
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                    />
                    <p className={`font-semibold text-sm leading-tight ${task.status === TaskStatus.Done ? 'line-through text-gray-500' : 'text-white'}`}>
                        {task.title}
                    </p>
                </div>
                <div className="flex-shrink-0 flex gap-1 z-10 relative">
                    <button 
                        onClick={handleEditClick} 
                        onMouseDown={(e) => e.stopPropagation()} 
                        onMouseUp={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white" 
                        title="Edit"
                    >
                        <EditIcon className="w-4 h-4"/>
                    </button>
                    <button 
                        onClick={handleDelete} 
                        onMouseDown={(e) => e.stopPropagation()} 
                        onMouseUp={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-full hover:bg-gray-700 text-red-500 hover:text-red-400" 
                        title="Delete"
                    >
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                </div>
            </div>
            <div className="flex justify-between items-center mt-3 pl-6">
                <div className="flex items-center">
                    {assignee && <img src={assignee.avatar} alt={assignee.name} title={assignee.name} className="h-6 w-6 rounded-full ring-2 ring-gray-600"/>}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${bg}`}>{task.priority}</span>
                </div>
                <p className="text-xs text-gray-400">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
            </div>
        </div>
    );
};

const ProjectColumn: React.FC<{ 
    status: TaskStatus, 
    tasks: Task[], 
    users: User[], 
    onDeleteTask: (id: string) => void,
    onEditTask: (task: Task) => void,
    onStatusChange: (id: string, status: TaskStatus) => void,
    onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void,
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void,
    onDragEnter: (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => void,
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void,
    onDrop: (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => void,
    isDragOver: boolean,
    draggedTaskId: string | null,
    isFormVisible: boolean,
    onShowForm: () => void,
    onCancelForm: () => void,
    onSaveTask: () => void,
    newTaskData: { title: string; assignedToId: string; dueDate: string; priority: TaskPriority; },
    setNewTaskData: (data: any) => void
}> = ({ status, tasks, users, onDeleteTask, onEditTask, onStatusChange, onDragStart, onDragOver, onDragEnter, onDragLeave, onDrop, isDragOver, draggedTaskId, isFormVisible, onShowForm, onCancelForm, onSaveTask, newTaskData, setNewTaskData }) => {
    const statusColors = {
        [TaskStatus.ToDo]: 'text-yellow-400',
        [TaskStatus.InProgress]: 'text-blue-400',
        [TaskStatus.Done]: 'text-green-400',
    };
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveTask();
    };

    return (
        <div 
            onDragOver={onDragOver}
            onDragEnter={(e) => onDragEnter(e, status)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, status)}
            className={`bg-gray-900/50 rounded-lg p-3 w-80 flex-shrink-0 flex flex-col transition-all duration-300 ${isDragOver ? 'bg-purple-900/50 ring-2 ring-purple-500' : ''}`}
        >
            <h3 className={`font-bold mb-4 px-1 ${statusColors[status]}`}>{status} <span className="text-gray-500 text-sm font-normal">{tasks.length}</span></h3>
            <div className="flex-grow space-y-3 min-h-[100px] overflow-y-auto pr-1">
                {tasks.map(task => 
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        users={users} 
                        onDelete={onDeleteTask} 
                        onEdit={onEditTask}
                        onStatusChange={onStatusChange}
                        onDragStart={onDragStart}
                        isDragging={draggedTaskId === task.id}
                    />
                )}
            </div>
             <div className="mt-2 flex-shrink-0">
                {isFormVisible ? (
                    <form onSubmit={handleFormSubmit} className="bg-gray-800 p-2 rounded-lg space-y-2">
                        <textarea
                            value={newTaskData.title}
                            onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                            placeholder="Task title..."
                            rows={2}
                            className="w-full bg-gray-700 text-white p-2 rounded-md text-sm resize-none"
                            autoFocus
                            required
                        />
                        <div className="flex gap-2">
                            <select value={newTaskData.assignedToId} onChange={(e) => setNewTaskData({ ...newTaskData, assignedToId: e.target.value })} className="flex-1 bg-gray-700 p-1 rounded-md text-xs">
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                             <select value={newTaskData.priority} onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value as TaskPriority })} className="flex-1 bg-gray-700 p-1 rounded-md text-xs">
                                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                         <input type="date" value={newTaskData.dueDate} onChange={(e) => setNewTaskData({ ...newTaskData, dueDate: e.target.value })} className="w-full bg-gray-700 p-1 rounded-md text-xs" required />
                        <div className="flex gap-2">
                            <button type="button" onClick={onCancelForm} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1 px-2 rounded-md text-sm">Cancel</button>
                            <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-1 px-2 rounded-md text-sm">Add</button>
                        </div>
                    </form>
                ) : (
                    <button onClick={onShowForm} className="w-full flex items-center justify-center p-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
                        <PlusIcon className="h-4 w-4 mr-2" /> Add Task
                    </button>
                )}
            </div>
        </div>
    );
};

const EditTaskModal: React.FC<{
    task: Task,
    users: User[],
    onClose: () => void,
    onSave: (task: Task) => void
}> = ({ task, users, onClose, onSave }) => {
    const [editedTask, setEditedTask] = useState(task);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(editedTask);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Edit Task</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <textarea value={editedTask.title} onChange={e => setEditedTask({...editedTask, title: e.target.value})} rows={3} className="w-full bg-gray-700 p-2 rounded-lg" />
                    <div className="grid grid-cols-2 gap-4">
                        <select value={editedTask.assignedToId} onChange={e => setEditedTask({...editedTask, assignedToId: e.target.value})} className="bg-gray-700 p-2 rounded-lg">
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <select value={editedTask.priority} onChange={e => setEditedTask({...editedTask, priority: e.target.value as TaskPriority})} className="bg-gray-700 p-2 rounded-lg">
                            {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <input type="date" value={editedTask.dueDate} onChange={e => setEditedTask({...editedTask, dueDate: e.target.value})} className="w-full bg-gray-700 p-2 rounded-lg" />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-spotify-green hover:bg-green-500 font-bold py-2 px-4 rounded-lg">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const Projects: React.FC<ProjectsProps> = ({ activeBandId, users, tasks, setTasks, projects: allProjects, setProjects: setAllProjects, releases, setReleases }) => {
    
    const projects = useMemo(() => allProjects.filter(p => p.bandId === activeBandId), [allProjects, activeBandId]);

    const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
    const [showTip, setShowTip] = useState(true);

    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

    // State for the new task form
    const [formVisibleForStatus, setFormVisibleForStatus] = useState<TaskStatus | null>(null);
    const [newTaskData, setNewTaskData] = useState({
        title: '',
        assignedToId: users[0]?.id || '',
        dueDate: new Date().toISOString().substring(0, 10),
        priority: TaskPriority.Medium,
    });
    
    // State for editing task
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // State for project modal
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProductionProject | null>(null);

    // State for Add Task modal
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

    useEffect(() => {
        const handleHashChange = () => {
            const params = new URLSearchParams(window.location.hash.split('?')[1]);
            const projectId = params.get('projectId');
            if (projectId && projects.some(p => p.id === projectId)) {
                setSelectedProjectId(projectId);
            }
        };
        handleHashChange(); // on mount
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [projects]);

    const selectedProject = projects.find(p => p.id === selectedProjectId);
    
    const deleteTask = (id: string) => {
        // Removed window.confirm to make deletion instant and less error-prone on touch/drag
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const handleSaveNewTask = (taskData: Omit<Task, 'id' | 'bandId'>) => {
        const newTask: Task = {
            id: `task-${Date.now()}`,
            bandId: activeBandId,
            ...taskData
        };
        setTasks(prev => [...prev, newTask]);
        setIsAddTaskModalOpen(false);
    };

    const handleAddTask = (status: TaskStatus) => {
        if (!newTaskData.title || !newTaskData.dueDate || !selectedProjectId) return;
    
        const newTask: Task = {
            id: `t-${Date.now()}`,
            projectId: selectedProjectId,
            bandId: activeBandId,
            title: newTaskData.title,
            assignedToId: newTaskData.assignedToId,
            dueDate: newTaskData.dueDate,
            status: status,
            priority: newTaskData.priority,
        };
    
        setTasks(prevTasks => [...prevTasks, newTask]);
    
        // Reset and hide form
        setNewTaskData({
            title: '',
            assignedToId: users[0]?.id || '',
            dueDate: new Date().toISOString().substring(0, 10),
            priority: TaskPriority.Medium,
        });
        setFormVisibleForStatus(null);
    };

    const handleSaveTask = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        setEditingTask(null);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.setData('text/plain', taskId); // Necessary for Firefox
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Allow drop
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        e.preventDefault();
        setDragOverStatus(status);
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOverStatus(null);
    };

    const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
        // 1. Update the tasks state
        setTasks(prevTasks => {
            return prevTasks.map(t => {
                if (t.id === taskId) {
                    return { ...t, status: newStatus };
                }
                return t;
            });
        });

        // 2. Perform side effects (updating releases) outside the reducer
        // We find the task from the current 'tasks' prop to check relations
        // Note: The task in 'tasks' prop still has old status, which is fine for checking IDs
        const relatedTask = tasks.find(t => t.id === taskId);
        
        if (relatedTask && relatedTask.releaseId) {
            setReleases(prevReleases => prevReleases.map(release => {
                if (release.id === relatedTask.releaseId) {
                    return {
                        ...release,
                        checklist: release.checklist.map(item =>
                            item.linkedTaskId === relatedTask.id ? { ...item, completed: newStatus === TaskStatus.Done } : item
                        )
                    };
                }
                return release;
            }));
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, destinationStatus: TaskStatus) => {
        e.preventDefault();
        if (!draggedTaskId) return;
        handleStatusChange(draggedTaskId, destinationStatus);
        setDraggedTaskId(null);
        setDragOverStatus(null);
    };

    const handleSaveProject = (projectData: ProductionProject) => {
        setAllProjects(prev => {
            const exists = prev.some(p => p.id === projectData.id);
            if (exists) {
                return prev.map(p => p.id === projectData.id ? projectData : p);
            }
            return [...prev, projectData];
        });
        // if it's a new project, select it
        if (!projects.some(p => p.id === projectData.id)) {
            setSelectedProjectId(projectData.id);
        }
        setIsProjectModalOpen(false);
        setEditingProject(null);
    };

    const openNewProjectModal = () => {
        const newProject: ProductionProject = {
            id: `proj-${Date.now()}`, name: '', type: ProjectType.Album, status: ProductionProjectStatus.Planning, targetReleaseDate: '',
            songIds: [], description: '', teamMemberIds: [],
            bandId: activeBandId,
        };
        setEditingProject(newProject);
        setIsProjectModalOpen(true);
    };
    
    const openEditProjectModal = (project: ProductionProject) => {
        setEditingProject(project);
        setIsProjectModalOpen(true);
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h1 className="text-4xl font-bold">Projects</h1>
                    <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="bg-gray-800 text-white p-1 rounded-md mt-2 border border-gray-700">
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                 <div className="flex items-center gap-4">
                    <button onClick={() => setIsAddTaskModalOpen(true)} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
                        <PlusIcon className="h-5 w-5 mr-2" /> Add Task
                    </button>
                    <button onClick={openNewProjectModal} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">
                        <PlusIcon className="h-5 w-5 mr-2" /> New Project
                    </button>
                 </div>
            </div>

            {showTip && (
                <Tip onDismiss={() => setShowTip(false)}>
                    Drag and drop tasks between columns or use the checkbox to mark as Done. You can also delete items directly from the card.
                </Tip>
            )}
            
            {selectedProject ? (
                <div className="flex-grow flex gap-4 overflow-x-auto pb-4">
                    {Object.values(TaskStatus).map(status => {
                        const columnTasks = tasks
                            .filter(task => task.bandId === activeBandId && task.projectId === selectedProjectId && task.status === status)
                            .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

                        return <ProjectColumn 
                            key={status} 
                            status={status} 
                            tasks={columnTasks} 
                            users={users} 
                            onDeleteTask={deleteTask}
                            onEditTask={setEditingTask}
                            onStatusChange={handleStatusChange}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            isDragOver={dragOverStatus === status}
                            draggedTaskId={draggedTaskId}
                            isFormVisible={formVisibleForStatus === status}
                            onShowForm={() => {
                                setNewTaskData(prev => ({ ...prev, dueDate: new Date().toISOString().substring(0,10) }));
                                setFormVisibleForStatus(status);
                            }}
                            onCancelForm={() => setFormVisibleForStatus(null)}
                            onSaveTask={() => handleAddTask(status)}
                            newTaskData={newTaskData}
                            setNewTaskData={setNewTaskData}
                        />;
                    })}
                </div>
            ) : (
                <p className="text-center text-gray-500">Select a project to view the board.</p>
            )}
            {editingTask && (
                <EditTaskModal 
                    task={editingTask} 
                    users={users} 
                    onClose={() => setEditingTask(null)} 
                    onSave={handleSaveTask}
                />
            )}
            {isAddTaskModalOpen && (
                <AddTaskModal
                    onClose={() => setIsAddTaskModalOpen(false)}
                    onSave={handleSaveNewTask}
                    projects={projects}
                    users={users}
                    defaultProjectId={selectedProjectId}
                />
            )}
            {editingProject && isProjectModalOpen && (
                <ProjectModal 
                    project={editingProject} 
                    onClose={() => { setIsProjectModalOpen(false); setEditingProject(null); }}
                    onSave={handleSaveProject}
                />
            )}
        </div>
    );
};

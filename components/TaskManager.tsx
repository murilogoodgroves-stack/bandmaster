import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { Task, User, BandProfile, ProductionProject } from '../types';
import { TaskStatus, TaskPriority } from '../types';
import { PlusIcon, TrashIcon, EditIcon, CheckCircleIcon, ClockIcon } from './icons';
import { Tip } from './Tip';

interface TaskModalProps {
  task?: Task;
  users: User[];
  projects: ProductionProject[];
  activeBandId: string;
  onClose: () => void;
  onSave: (task: Task) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, users, projects, activeBandId, onClose, onSave }) => {
  const [formData, setFormData] = useState<Task>(
    task || {
      id: Date.now().toString(),
      title: '',
      assignedToId: users[0]?.id || '',
      dueDate: new Date().toISOString().split('T')[0],
      status: TaskStatus.ToDo,
      priority: TaskPriority.Medium,
      projectId: projects.find(p => p.bandId === activeBandId)?.id || '',
      bandId: activeBandId,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    onSave(formData);
  };

  const projectsForBand = useMemo(
    () => projects.filter(p => p.bandId === activeBandId),
    [projects, activeBandId]
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{task ? 'Edit' : 'Create'} Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-gray-700 p-2 rounded-lg focus:ring-2 ring-purple-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full bg-gray-700 p-2 rounded-lg text-sm"
              >
                {Object.values(TaskStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="w-full bg-gray-700 p-2 rounded-lg text-sm"
              >
                {Object.values(TaskPriority).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Assigned To</label>
            <select
              value={formData.assignedToId}
              onChange={e => setFormData({ ...formData, assignedToId: e.target.value })}
              className="w-full bg-gray-700 p-2 rounded-lg text-sm"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Project</label>
            <select
              value={formData.projectId}
              onChange={e => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full bg-gray-700 p-2 rounded-lg text-sm"
            >
              {projectsForBand.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full bg-gray-700 p-2 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-700 p-2 rounded-lg h-20 text-sm resize-none"
              placeholder="Add notes..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              {task ? 'Update' : 'Create'} Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface TaskManagerProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  users: User[];
  bands: BandProfile[];
  projects: ProductionProject[];
  activeBandId: string;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks: allTasks,
  setTasks: setAllTasks,
  users,
  bands,
  projects,
  activeBandId,
}) => {
  const tasks = useMemo(
    () => allTasks.filter(t => t.bandId === activeBandId),
    [allTasks, activeBandId]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [showTip, setShowTip] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | string>('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const statusMatch = statusFilter === 'all' || task.status === statusFilter;
      const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
      const assigneeMatch = assigneeFilter === 'all' || task.assignedToId === assigneeFilter;
      return statusMatch && priorityMatch && assigneeMatch;
    });
  }, [tasks, statusFilter, priorityFilter, assigneeFilter]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      [TaskStatus.ToDo]: [],
      [TaskStatus.InProgress]: [],
      [TaskStatus.Review]: [],
      [TaskStatus.Done]: [],
    };
    filteredTasks.forEach(task => {
      grouped[task.status].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  const handleSaveTask = (task: Task) => {
    setAllTasks(prev => {
      const exists = prev.some(t => t.id === task.id);
      if (exists) {
        return prev.map(t => (t.id === task.id ? task : t));
      }
      return [...prev, task];
    });
    setIsModalOpen(false);
    setEditingTask(undefined);
  };

  const handleDeleteTask = (id: string) => {
    setAllTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setAllTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    );
  };

  const getAssignedUser = (userId: string) => users.find(u => u.id === userId)?.name || 'Unassigned';
  const getProject = (projectId: string) => projects.find(p => p.id === projectId)?.name || 'General';
  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();

  const priorityColors: Record<TaskPriority, string> = {
    [TaskPriority.Low]: 'text-blue-400',
    [TaskPriority.Medium]: 'text-yellow-400',
    [TaskPriority.High]: 'text-orange-400',
    [TaskPriority.Critical]: 'text-red-400',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Task Manager</h1>
        <button
          onClick={() => {
            setEditingTask(undefined);
            setIsModalOpen(true);
          }}
          className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Task
        </button>
      </div>

      {showTip && (
        <Tip onDismiss={() => setShowTip(false)}>
          Tasks can be created automatically from release checklists, funding deadlines, and tour dates. Organize work by status, priority, and team member.
        </Tip>
      )}

      {isModalOpen && (
        <TaskModal
          task={editingTask}
          users={users}
          projects={projects}
          activeBandId={activeBandId}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTask}
        />
      )}

      <div className="bg-gray-800 p-4 rounded-xl mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full bg-gray-700 p-2 rounded text-sm"
            >
              <option value="all">All Statuses</option>
              {Object.values(TaskStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Priority</label>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as any)}
              className="w-full bg-gray-700 p-2 rounded text-sm"
            >
              <option value="all">All Priorities</option>
              {Object.values(TaskPriority).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Assigned To</label>
            <select
              value={assigneeFilter}
              onChange={e => setAssigneeFilter(e.target.value)}
              className="w-full bg-gray-700 p-2 rounded text-sm"
            >
              <option value="all">All Team Members</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-400">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {(Object.values(TaskStatus) as TaskStatus[]).map(status => (
          <div key={status} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h3 className="font-bold text-sm mb-4 text-gray-300">{status} ({tasksByStatus[status].length})</h3>
            <div className="space-y-3">
              {tasksByStatus[status].map(task => (
                <div
                  key={task.id}
                  className={`bg-gray-800 p-3 rounded-lg border-l-4 ${
                    isOverdue(task.dueDate) ? 'border-red-500' : 'border-purple-500'
                  } hover:bg-gray-700/80 transition`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-semibold text-sm flex-1 text-white truncate">{task.title}</h4>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="text-gray-400 hover:text-purple-400 p-1"
                        title="Edit"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-gray-400 hover:text-red-400 p-1"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-gray-400 mb-2">
                    <p className={priorityColors[task.priority]}>Priority: {task.priority}</p>
                    <p className={isOverdue(task.dueDate) ? 'text-red-400 font-semibold' : ''}>
                      {isOverdue(task.dueDate) && '⚠️ '}Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                    <p>For: {getProject(task.projectId)}</p>
                    <p>Assigned: {getAssignedUser(task.assignedToId)}</p>
                  </div>

                  {task.notes && (
                    <p className="text-xs text-gray-500 italic mb-3 line-clamp-2">{task.notes}</p>
                  )}

                  <div className="flex gap-2">
                    {status !== TaskStatus.Done && (
                      <button
                        onClick={() => handleStatusChange(task.id, TaskStatus.Done)}
                        className="flex-1 flex items-center justify-center gap-1 bg-green-600/30 hover:bg-green-600/50 text-green-400 text-xs py-1 rounded transition"
                      >
                        <CheckCircleIcon className="w-3 h-3" />
                        Done
                      </button>
                    )}
                    {status !== TaskStatus.InProgress && (
                      <button
                        onClick={() => handleStatusChange(task.id, TaskStatus.InProgress)}
                        className="flex-1 flex items-center justify-center gap-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 text-xs py-1 rounded transition"
                      >
                        <ClockIcon className="w-3 h-3" />
                        Start
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {tasksByStatus[status].length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No tasks</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No tasks match your filters.</p>
          <button
            onClick={() => {
              setEditingTask(undefined);
              setIsModalOpen(true);
            }}
            className="mt-4 text-purple-400 hover:underline font-semibold"
          >
            Create your first task
          </button>
        </div>
      )}
    </div>
  );
};

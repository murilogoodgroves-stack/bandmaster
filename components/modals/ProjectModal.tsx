import React, { useState } from 'react';
import type { ProductionProject, ProjectMilestone, ProjectDeliverable } from '../../types';
import { ProjectType, ProductionProjectStatus, TaskPriority } from '../../types';

interface ProjectModalProps {
    project: ProductionProject;
    onClose: () => void;
    onSave: (project: ProductionProject) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose, onSave }) => {
    const [editedProject, setEditedProject] = useState<ProductionProject>({
        ...project,
        milestones: project.milestones ?? [],
        deliverables: project.deliverables ?? [],
    });

    const handleSave = () => {
        if (!editedProject.name) return;
        onSave({
            ...editedProject,
            milestones: editedProject.milestones ?? [],
            deliverables: editedProject.deliverables ?? [],
        });
    };

    const handleFieldChange = (field: keyof ProductionProject, value: any) => setEditedProject(prev => ({...prev, [field]: value}));

    const addMilestone = () => {
        const newMilestone: ProjectMilestone = {
            id: `milestone-${Date.now()}`,
            title: `Milestone ${Math.max((editedProject.milestones ?? []).length + 1, 1)}`,
            dueDate: editedProject.targetReleaseDate || new Date().toISOString().slice(0, 10),
            status: 'pending',
            dependencies: [],
            deliverables: [],
        };
        setEditedProject(prev => ({ ...prev, milestones: [...(prev.milestones ?? []), newMilestone] }));
    };

    const addDeliverable = () => {
        const newDeliverable: ProjectDeliverable = {
            id: `deliverable-${Date.now()}`,
            title: `Deliverable ${Math.max((editedProject.deliverables ?? []).length + 1, 1)}`,
            dueDate: editedProject.targetReleaseDate || new Date().toISOString().slice(0, 10),
            status: 'pending',
        };
        setEditedProject(prev => ({ ...prev, deliverables: [...(prev.deliverables ?? []), newDeliverable] }));
    };

    const updateMilestone = (milestoneId: string, field: keyof ProjectMilestone, value: any) => {
        setEditedProject(prev => ({
            ...prev,
            milestones: (prev.milestones ?? []).map((milestone) =>
                milestone.id === milestoneId ? { ...milestone, [field]: value } : milestone
            )
        }));
    };

    const updateDeliverable = (deliverableId: string, field: keyof ProjectDeliverable, value: any) => {
        setEditedProject(prev => ({
            ...prev,
            deliverables: (prev.deliverables ?? []).map((deliverable) =>
                deliverable.id === deliverableId ? { ...deliverable, [field]: value } : deliverable
            )
        }));
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-gray-700">
                    <h2 className="text-2xl font-bold">{project.name ? 'Edit Project' : 'New Project'}</h2>
                </header>
                <main className="flex-grow p-6 overflow-y-auto space-y-6">
                     <label className="block"><span className="text-gray-400 text-sm">Project Name</span>
                        <input type="text" value={editedProject.name} onChange={e => handleFieldChange('name', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg mt-1" required />
                    </label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <label className="block"><span className="text-gray-400 text-sm">Project Type</span>
                             <select value={editedProject.type} onChange={e => handleFieldChange('type', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg mt-1">
                                {Object.values(ProjectType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </label>
                        <label className="block"><span className="text-gray-400 text-sm">Status</span>
                            <select value={editedProject.status} onChange={e => handleFieldChange('status', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg mt-1">
                                {Object.values(ProductionProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </label>
                        <label className="block"><span className="text-gray-400 text-sm">Priority</span>
                            <select value={editedProject.priority ?? TaskPriority.Medium} onChange={e => handleFieldChange('priority', e.target.value as TaskPriority)} className="w-full bg-gray-700 p-2 rounded-lg mt-1">
                                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </label>
                         <label className="block"><span className="text-gray-400 text-sm">Target Release Date</span>
                             <input type="date" value={editedProject.targetReleaseDate} onChange={e => handleFieldChange('targetReleaseDate', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg mt-1" />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block"><span className="text-gray-400 text-sm">Project Owner</span>
                            <input type="text" value={editedProject.ownerId ?? ''} onChange={e => handleFieldChange('ownerId', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg mt-1" placeholder="Owner name or team member" />
                        </label>
                        <label className="block"><span className="text-gray-400 text-sm">Budget</span>
                            <input type="number" min="0" value={editedProject.budget ?? ''} onChange={e => handleFieldChange('budget', e.target.value === '' ? undefined : Number(e.target.value))} className="w-full bg-gray-700 p-2 rounded-lg mt-1" placeholder="0" />
                        </label>
                    </div>

                     <label className="block"><span className="text-gray-400 text-sm">Strategic Goal</span>
                        <textarea
                            value={editedProject.strategicGoal || ''}
                            onChange={e => handleFieldChange('strategicGoal', e.target.value)}
                            rows={2}
                            className="w-full bg-gray-700 p-2 rounded-lg mt-1"
                            placeholder="Example: build momentum around release, expand fan reach, or secure press coverage."
                        />
                    </label>

                    <label className="block"><span className="text-gray-400 text-sm">What more can I do?</span>
                        <textarea
                            value={editedProject.whatMoreCanIDo || ''}
                            onChange={e => handleFieldChange('whatMoreCanIDo', e.target.value)}
                            rows={3}
                            className="w-full bg-gray-700 p-2 rounded-lg mt-1"
                            placeholder="Tell us anything you want us to research online, verify, or help with—press ideas, similar artists, outreach needs, launch support, or any missing tasks."
                        />
                    </label>

                     <label className="block"><span className="text-gray-400 text-sm">Description</span>
                        <textarea value={editedProject.description || ''} onChange={e => handleFieldChange('description', e.target.value)} rows={3} className="w-full bg-gray-700 p-2 rounded-lg mt-1" />
                    </label>

                    <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold">Milestones</h3>
                            <button type="button" onClick={addMilestone} className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm">Add milestone</button>
                        </div>
                        <div className="space-y-3">
                            {(editedProject.milestones ?? []).map((milestone) => (
                                <div key={milestone.id} className="bg-gray-900 border border-gray-700 rounded-lg p-3 space-y-2">
                                    <input type="text" value={milestone.title} onChange={e => updateMilestone(milestone.id, 'title', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="date" value={milestone.dueDate} onChange={e => updateMilestone(milestone.id, 'dueDate', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg" />
                                        <select value={milestone.status} onChange={e => updateMilestone(milestone.id, 'status', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg">
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>
                                    <textarea value={milestone.deliverables.join(', ')} onChange={e => updateMilestone(milestone.id, 'deliverables', e.target.value.split(',').map(item => item.trim()).filter(Boolean))} rows={2} className="w-full bg-gray-700 p-2 rounded-lg" placeholder="comma-separated deliverables" />
                                </div>
                            ))}
                            {(editedProject.milestones ?? []).length === 0 && <p className="text-sm text-gray-500">No milestones yet.</p>}
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold">Deliverables</h3>
                            <button type="button" onClick={addDeliverable} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm">Add deliverable</button>
                        </div>
                        <div className="space-y-3">
                            {(editedProject.deliverables ?? []).map((deliverable) => (
                                <div key={deliverable.id} className="bg-gray-900 border border-gray-700 rounded-lg p-3 space-y-2">
                                    <input type="text" value={deliverable.title} onChange={e => updateDeliverable(deliverable.id, 'title', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="date" value={deliverable.dueDate ?? ''} onChange={e => updateDeliverable(deliverable.id, 'dueDate', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg" />
                                        <select value={deliverable.status} onChange={e => updateDeliverable(deliverable.id, 'status', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg">
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                            {(editedProject.deliverables ?? []).length === 0 && <p className="text-sm text-gray-500">No deliverables yet.</p>}
                        </div>
                    </div>
                </main>
                 <footer className="p-4 border-t border-gray-700 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="button" onClick={handleSave} className="bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Save Project</button>
                </footer>
            </div>
        </div>
    )
};

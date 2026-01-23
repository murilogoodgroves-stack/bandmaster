import React, { useState } from 'react';
import type { ProductionProject } from '../../types';
import { ProjectType, ProductionProjectStatus } from '../../types';

interface ProjectModalProps {
    project: ProductionProject;
    onClose: () => void;
    onSave: (project: ProductionProject) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose, onSave }) => {
    const [editedProject, setEditedProject] = useState<ProductionProject>(project);
    const handleSave = () => {
        if (!editedProject.name) return;
        onSave(editedProject);
    };
    const handleFieldChange = (field: keyof ProductionProject, value: any) => setEditedProject(prev => ({...prev, [field]: value}));

    return (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-gray-700">
                    <h2 className="text-2xl font-bold">{project.name ? 'Edit Project' : 'New Project'}</h2>
                </header>
                <main className="flex-grow p-6 overflow-y-auto space-y-4">
                     <label className="block"><span className="text-gray-400 text-sm">Project Name</span>
                        <input type="text" value={editedProject.name} onChange={e => handleFieldChange('name', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg mt-1" required />
                    </label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                         <label className="block"><span className="text-gray-400 text-sm">Target Release Date</span>
                             <input type="date" value={editedProject.targetReleaseDate} onChange={e => handleFieldChange('targetReleaseDate', e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg mt-1" />
                        </label>
                    </div>
                     <label className="block"><span className="text-gray-400 text-sm">Description</span>
                        <textarea value={editedProject.description || ''} onChange={e => handleFieldChange('description', e.target.value)} rows={3} className="w-full bg-gray-700 p-2 rounded-lg mt-1" />
                    </label>
                </main>
                 <footer className="p-4 border-t border-gray-700 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="button" onClick={handleSave} className="bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Save Project</button>
                </footer>
            </div>
        </div>
    )
};


import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { Collaborator } from '../types';
import { PlusIcon, TrashIcon, EditIcon, SearchIcon } from './icons';
import { initialCollaborators } from '../data/initialData';

const collaboratorRoles = ["Producer", "Mixing Engineer", "Mastering Engineer", "Photographer", "Videographer", "Graphic Designer", "Session Musician"];

const CollaboratorModal: React.FC<{
    onClose: () => void,
    onSave: (collaborator: Collaborator) => void,
    collaborator?: Collaborator,
    activeBandId: string,
}> = ({ onClose, onSave, collaborator, activeBandId }) => {
    const [collabData, setCollabData] = useState<Omit<Collaborator, 'id' | 'bandId'>>({
        name: collaborator?.name || '',
        role: collaborator?.role || collaboratorRoles[0],
        email: collaborator?.email || '',
        notes: collaborator?.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!collabData.name) return;
        const newCollaborator: Collaborator = {
            id: collaborator?.id || Date.now().toString(),
            bandId: activeBandId,
            ...collabData,
        };
        onSave(newCollaborator);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">{collaborator ? 'Edit' : 'Add'} Collaborator</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" placeholder="Name" value={collabData.name} onChange={e => setCollabData({...collabData, name: e.target.value})} className="bg-gray-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required/>
                        <select value={collabData.role} onChange={e => setCollabData({...collabData, role: e.target.value})} className="bg-gray-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            {collaboratorRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <input type="email" placeholder="Email" value={collabData.email} onChange={e => setCollabData({...collabData, email: e.target.value})} className="bg-gray-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    </div>
                    <textarea placeholder="Notes (e.g., portfolio link, rates)" value={collabData.notes} onChange={e => setCollabData({...collabData, notes: e.target.value})} className="w-full bg-gray-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" rows={3}></textarea>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Save Collaborator</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface CollaboratorsProps {
    activeBandId: string;
    collaborators: Collaborator[];
    setCollaborators: React.Dispatch<React.SetStateAction<Collaborator[]>>;
}

export const Collaborators: React.FC<CollaboratorsProps> = ({ activeBandId, collaborators: allCollaborators, setCollaborators }) => {
  const collaborators = useMemo(() => allCollaborators.filter(c => c.bandId === activeBandId), [allCollaborators, activeBandId]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | undefined>(undefined);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const filteredCollaborators = useMemo(() => {
    return collaborators.filter(collab => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = searchQuery === '' ||
            collab.name.toLowerCase().includes(searchLower) ||
            collab.email.toLowerCase().includes(searchLower);
        
        const matchesRole = roleFilter === 'All' || collab.role === roleFilter;

        return matchesSearch && matchesRole;
    });
  }, [collaborators, searchQuery, roleFilter]);


  const handleSaveCollaborator = (collaborator: Collaborator) => {
    setCollaborators(prev => {
        const exists = prev.some(c => c.id === collaborator.id);
        if (exists) {
            return prev.map(c => (c.id === collaborator.id ? collaborator : c));
        }
        return [...prev, collaborator];
    });
    setIsModalOpen(false);
    setEditingCollaborator(undefined);
  };
  
  const deleteCollaborator = (id: string) => {
      setCollaborators(prev => prev.filter(c => c.id !== id));
  };

  const handleOpenModal = (collaborator?: Collaborator) => {
      setEditingCollaborator(collaborator);
      setIsModalOpen(true);
  };
  
  return (
    <div>
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Collaborators</h1>
            <button onClick={() => handleOpenModal()} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <PlusIcon className="h-5 w-5 mr-2"/>
                Add Collaborator
            </button>
        </div>

        {isModalOpen && (
            <CollaboratorModal
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveCollaborator}
                collaborator={editingCollaborator}
                activeBandId={activeBandId}
            />
        )}
        
        <div className="bg-gray-800 p-4 rounded-xl mb-8 flex items-center gap-4">
            <div className="relative flex-grow">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-700 p-2 pl-10 rounded-lg"
                />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-gray-700 p-2 rounded-lg text-sm">
                <option value="All">All Roles</option>
                {collaboratorRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollaborators.map(collab => (
                <div key={collab.id} className="bg-gray-800 p-5 rounded-lg shadow-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-white">{collab.name}</h3>
                            <p className="text-purple-400 font-semibold">{collab.role}</p>
                            <p className="text-sm text-gray-400 mt-1">{collab.email}</p>
                        </div>
                        <div className="flex">
                            <button onClick={() => handleOpenModal(collab)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                                <EditIcon className="h-5 w-5 text-gray-400"/>
                            </button>
                            <button onClick={() => deleteCollaborator(collab.id)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                                <TrashIcon className="h-5 w-5 text-red-500"/>
                            </button>
                        </div>
                    </div>
                    {collab.notes && <p className="text-gray-300 mt-3 whitespace-pre-wrap border-t border-gray-700 pt-3">{collab.notes}</p>}
                </div>
            ))}
        </div>
        {filteredCollaborators.length === 0 && <p className="text-center text-gray-500 mt-8 col-span-full">No collaborators found matching your filters.</p>}
    </div>
  );
};

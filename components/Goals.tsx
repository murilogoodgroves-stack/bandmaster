import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { BandGoal } from '../types';
import { initialGoals } from '../data/initialData';
import { PlusIcon, TrashIcon, TrophyIcon, CheckCircleIcon, EditIcon } from './icons';

const GoalModal: React.FC<{
    onClose: () => void;
    onSave: (goal: Omit<BandGoal, 'id' | 'achieved' | 'bandId'>) => void;
    goal?: BandGoal;
}> = ({ onClose, onSave, goal }) => {
    const [description, setDescription] = useState(goal?.description || '');
    const [targetDate, setTargetDate] = useState(goal?.targetDate || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !targetDate) return;
        onSave({ description, targetDate });
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4">{goal ? 'Edit Goal' : 'Set a New Goal'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea
                        placeholder="What do you want to achieve? (e.g., 'Play at the main stage of a festival')"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full bg-gray-700 p-3 rounded-lg ring-spotify-green"
                        rows={2}
                        required
                    />
                    <div className="flex items-center gap-4">
                    <label htmlFor="targetDate" className="text-gray-400">Target Date:</label>
                    <input
                        id="targetDate"
                        type="date"
                        value={targetDate}
                        onChange={e => setTargetDate(e.target.value)}
                        className="bg-gray-700 p-3 rounded-lg ring-spotify-green"
                        required
                    />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg">Save Goal</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface GoalsProps {
    activeBandId: string;
    goals: BandGoal[];
    setGoals: React.Dispatch<React.SetStateAction<BandGoal[]>>;
}

export const Goals: React.FC<GoalsProps> = ({ activeBandId, goals: allGoals, setGoals }) => {
  const goals = useMemo(() => allGoals.filter(g => g.bandId === activeBandId), [allGoals, activeBandId]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<BandGoal | null>(null);

  const handleSaveGoal = (goalData: Omit<BandGoal, 'id' | 'achieved' | 'bandId'>) => {
    if (editingGoal) {
        // Update existing goal
        setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, ...goalData } as BandGoal : g));
    } else {
        // Add new goal
        const goal: BandGoal = {
          id: Date.now().toString(),
          ...goalData,
          achieved: false,
          bandId: activeBandId,
        };
        setGoals(prev => [...prev, goal]);
    }
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const toggleAchieved = (id: string) => {
    setGoals(prev => prev.map(g =>
      g.id === id ? { ...g, achieved: !g.achieved, achievedDate: !g.achieved ? new Date().toISOString().substring(0,10) : undefined } : g
    ));
  };
  
  const activeGoals = goals.filter(g => !g.achieved).sort((a,b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  const achievedGoals = goals.filter(g => g.achieved).sort((a,b) => new Date(b.achievedDate || 0).getTime() - new Date(a.achievedDate || 0).getTime());

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Band Goals</h1>
        <button onClick={() => { setEditingGoal(null); setIsModalOpen(true); }} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          <PlusIcon className="h-5 w-5 mr-2"/>
          Set New Goal
        </button>
      </div>
      
      {isModalOpen && <GoalModal onClose={() => setIsModalOpen(false)} onSave={handleSaveGoal} goal={editingGoal || undefined}/>}

      {/* Active Goals */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-4">Active Goals</h2>
        <div className="space-y-4">
          {activeGoals.map(goal => {
            const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div key={goal.id} className="bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-white">{goal.description}</p>
                  <p className={`text-sm mt-1 ${daysLeft < 7 ? 'text-red-400' : 'text-gray-400'}`}>
                    Target: {new Date(goal.targetDate).toLocaleDateString('en-US')} ({daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingGoal(goal); setIsModalOpen(true); }} className="p-2 bg-purple-600/20 text-purple-300 rounded-full hover:bg-purple-600/40 transition-colors" title="Edit Goal">
                    <EditIcon className="h-5 w-5"/>
                  </button>
                  <button onClick={() => toggleAchieved(goal.id)} className="p-2 bg-green-600/20 text-green-300 rounded-full hover:bg-green-600/40 transition-colors" title="Mark as Achieved">
                    <CheckCircleIcon className="h-5 w-5"/>
                  </button>
                   <button onClick={() => deleteGoal(goal.id)} className="p-2 bg-red-600/20 text-red-300 rounded-full hover:bg-red-600/40 transition-colors" title="Delete Goal">
                    <TrashIcon className="h-5 w-5"/>
                  </button>
                </div>
              </div>
            );
          })}
          {activeGoals.length === 0 && <p className="text-center text-gray-500 py-4">No active goals. Set a new one to get started!</p>}
        </div>
      </div>

      {/* Achieved Goals */}
      <div>
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-2"><TrophyIcon className="text-yellow-400"/> Trophy Case</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievedGoals.map(goal => (
            <div key={goal.id} className="bg-gray-800/50 p-4 rounded-lg border-l-4 border-yellow-500 flex items-center justify-between gap-4 opacity-80">
              <div>
                <p className="font-semibold text-gray-300 line-through">{goal.description}</p>
                <p className="text-sm text-gray-400 mt-1">Achieved on: {new Date(goal.achievedDate!).toLocaleDateString('en-US')}</p>
              </div>
               <button onClick={() => deleteGoal(goal.id)} className="p-2 rounded-full hover:bg-gray-700" title="Remove">
                <TrashIcon className="h-5 w-5 text-gray-500"/>
              </button>
            </div>
          ))}
          {achievedGoals.length === 0 && <p className="text-center text-gray-500 py-4 col-span-full">No completed goals yet. Keep working!</p>}
        </div>
      </div>

    </div>
  );
};
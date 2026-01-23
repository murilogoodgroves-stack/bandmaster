import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { RoyaltyStatement } from '../types';
import { RoyaltySource } from '../types';
import { initialRoyalties } from '../data/initialData';
import { PlusIcon, TrashIcon, EditIcon, SaveIcon, SlashIcon } from './icons';
import { Tip } from './Tip';

const StatCard: React.FC<{ title: string, value: string | number, colorClass: string }> = ({ title, value, colorClass }) => (
    <div className={`bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 ${colorClass}`}>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
        <p className="text-4xl font-bold mt-2 text-white">{value}</p>
    </div>
);

interface RoyaltiesProps {
    activeBandId: string;
    royalties: RoyaltyStatement[];
    setRoyalties: React.Dispatch<React.SetStateAction<RoyaltyStatement[]>>;
}


export const Royalties: React.FC<RoyaltiesProps> = ({ activeBandId, royalties: allStatements, setRoyalties: setStatements }) => {
    const statements = useMemo(() => allStatements.filter(s => s.bandId === activeBandId), [allStatements, activeBandId]);
    
    const [showForm, setShowForm] = useState(false);
    const [newStatement, setNewStatement] = useState<Omit<RoyaltyStatement, 'id' | 'bandId'>>({
        source: RoyaltySource.GEMA,
        statementDate: new Date().toISOString().substring(0, 10),
        period: '',
        amount: 0,
        notes: ''
    });
    const [showTip, setShowTip] = useState(true);
    
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedData, setEditedData] = useState<RoyaltyStatement | null>(null);

    const handleAddStatement = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStatement.period || newStatement.amount <= 0) return;
        setStatements(prev => [...prev, { id: Date.now().toString(), ...newStatement, bandId: activeBandId }]);
        setNewStatement({
            source: RoyaltySource.GEMA,
            statementDate: new Date().toISOString().substring(0, 10),
            period: '',
            amount: 0,
            notes: ''
        });
        setShowForm(false);
    };

    const deleteStatement = (id: string) => {
        setStatements(prev => prev.filter(s => s.id !== id));
    };

    const handleStartEditing = (stmt: RoyaltyStatement) => {
        setEditingId(stmt.id);
        setEditedData(stmt);
    };

    const handleCancelEditing = () => {
        setEditingId(null);
        setEditedData(null);
    };

    const handleSaveEditing = () => {
        if (!editedData) return;
        setStatements(prev => prev.map(s => s.id === editingId ? editedData : s));
        handleCancelEditing();
    };

    const totalRoyalties = useMemo(() => statements.reduce((sum, s) => sum + s.amount, 0), [statements]);

    const royaltiesBySource = useMemo(() => {
        const sourceMap = new Map<RoyaltySource, number>();
        for (const statement of statements) {
            const currentTotal = sourceMap.get(statement.source) || 0;
            sourceMap.set(statement.source, currentTotal + statement.amount);
        }
        return Array.from(sourceMap.entries()).sort((a,b) => b[1] - a[1]);
    }, [statements]);
    
    const maxSourceValue = Math.max(...royaltiesBySource.map(s => s[1]), 0);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Royalties</h1>
                <button onClick={() => setShowForm(!showForm)} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {showForm ? 'Cancel' : 'Add Statement'}
                </button>
            </div>
            
            {showTip && (
                <Tip onDismiss={() => setShowTip(false)}>
                    Track all your earnings from different platforms here. This helps you understand where your music generates the most income.
                </Tip>
            )}

            {showForm && (
                <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-lg">
                    <h3 className="text-xl font-bold mb-4">New Royalty Statement</h3>
                    <form onSubmit={handleAddStatement} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <select value={newStatement.source} onChange={e => setNewStatement({ ...newStatement, source: e.target.value as RoyaltySource })} className="bg-gray-700 p-3 rounded-lg">
                                {Object.values(RoyaltySource).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input type="text" placeholder="Period (e.g., Q1 2024)" value={newStatement.period} onChange={e => setNewStatement({ ...newStatement, period: e.target.value })} className="bg-gray-700 p-3 rounded-lg" required />
                            <input type="number" placeholder="Amount" min="0" step="0.01" value={newStatement.amount} onChange={e => setNewStatement({ ...newStatement, amount: parseFloat(e.target.value) || 0 })} className="bg-gray-700 p-3 rounded-lg" required />
                            <input type="date" value={newStatement.statementDate} onChange={e => setNewStatement({ ...newStatement, statementDate: e.target.value })} className="bg-gray-700 p-3 rounded-lg" />
                        </div>
                        <input type="text" placeholder="Notes (optional)" value={newStatement.notes} onChange={e => setNewStatement({ ...newStatement, notes: e.target.value })} className="w-full bg-gray-700 p-3 rounded-lg" />
                        <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg">Save Statement</button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Statements List */}
                <div className="lg:col-span-2 bg-gray-800 p-4 rounded-xl shadow-lg">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-gray-700">
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-gray-300">Date</th>
                                    <th className="p-3 text-sm font-semibold text-gray-300">Source</th>
                                    <th className="p-3 text-sm font-semibold text-gray-300">Period</th>
                                    <th className="p-3 text-sm font-semibold text-gray-300 text-right">Amount</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {statements.sort((a,b) => new Date(b.statementDate).getTime() - new Date(a.statementDate).getTime()).map(st => {
                                    if (editingId === st.id && editedData) {
                                        return (
                                            <tr key={st.id} className="bg-gray-700/50">
                                                <td className="p-2"><input type="date" value={editedData.statementDate} onChange={e => setEditedData({...editedData, statementDate: e.target.value})} className="bg-gray-800 p-1 rounded w-full"/></td>
                                                <td className="p-2"><select value={editedData.source} onChange={e => setEditedData({...editedData, source: e.target.value as RoyaltySource})} className="bg-gray-800 p-1 rounded w-full">{Object.values(RoyaltySource).map(s => <option key={s} value={s}>{s}</option>)}</select></td>
                                                <td className="p-2"><input type="text" value={editedData.period} onChange={e => setEditedData({...editedData, period: e.target.value})} className="bg-gray-800 p-1 rounded w-full"/></td>
                                                <td className="p-2"><input type="number" value={editedData.amount} onChange={e => setEditedData({...editedData, amount: parseFloat(e.target.value) || 0})} className="bg-gray-800 p-1 rounded w-full text-right"/></td>
                                                <td className="p-3 text-right flex gap-2 justify-end">
                                                    <button onClick={handleSaveEditing} className="p-1 rounded-full hover:bg-gray-600"><SaveIcon className="w-5 h-5 text-green-500"/></button>
                                                    <button onClick={handleCancelEditing} className="p-1 rounded-full hover:bg-gray-600"><SlashIcon className="w-5 h-5 text-gray-500"/></button>
                                                </td>
                                            </tr>
                                        )
                                    }
                                    return (
                                        <tr key={st.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                                            <td className="p-3 text-gray-400">{new Date(st.statementDate).toLocaleDateString('en-US')}</td>
                                            <td className="p-3 font-semibold">{st.source}</td>
                                            <td className="p-3 text-gray-300">{st.period}</td>
                                            <td className="p-3 font-bold text-green-400 text-right">${st.amount.toFixed(2)}</td>
                                            <td className="p-3 text-right flex gap-1 justify-end">
                                                <button onClick={() => handleStartEditing(st)} className="p-1 rounded-full hover:bg-gray-600"><EditIcon className="w-5 h-5 text-gray-500"/></button>
                                                <button onClick={() => deleteStatement(st.id)} className="p-1 rounded-full hover:bg-gray-600"><TrashIcon className="w-5 h-5 text-red-500"/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                     {statements.length === 0 && <p className="text-center text-gray-500 py-8">No royalty statements added yet.</p>}
                </div>

                {/* Summary */}
                <div className="space-y-6">
                    <StatCard title="Total Royalties" value={`$${totalRoyalties.toFixed(2)}`} colorClass="border-green-500" />
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-bold mb-4">By Source</h3>
                        <div className="space-y-3">
                            {royaltiesBySource.map(([source, amount]) => (
                                <div key={source}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-semibold text-gray-300">{source}</span>
                                        <span className="text-gray-400">${amount.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(amount / maxSourceValue) * 100}%`}}></div>
                                    </div>
                                </div>
                            ))}
                             {royaltiesBySource.length === 0 && <p className="text-sm text-gray-500">No data to display.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
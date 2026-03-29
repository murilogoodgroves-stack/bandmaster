
import React, { useState, useMemo } from 'react';
import type { Transaction, Budget, User } from '../types';
import { TransactionType } from '../types';
import { PlusIcon, TrashIcon, EditIcon, SaveIcon, SlashIcon, RefreshCwIcon } from './icons';
import { Tip } from './Tip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const incomeCategories = ["Gig", "Merch", "Streaming", "Other"];
const expenseCategories = ["Gear", "Studio", "Travel", "Marketing", "Other"];

const BarChart: React.FC<{data: {label: string, income: number, expense: number}[]}> = ({data}) => {
    return (
        <div className="bg-gray-900 p-4 rounded-lg h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
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
    );
};

const ResetModal: React.FC<{ onClose: () => void, onSave: (newCash: number) => void, currentCash: number }> = ({ onClose, onSave, currentCash }) => {
    const [newCash, setNewCash] = useState(currentCash);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(newCash);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Reset Balances</h2>
                <p className="text-sm text-gray-400 mb-4">Set a new starting point for your finances by updating the 'Cash on Hand' value. This does not affect your transaction history.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">New Cash on Hand ($)</label>
                        <input
                            type="number"
                            value={newCash}
                            onChange={e => setNewCash(parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full bg-gray-700 p-3 rounded-lg mt-1"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Set New Value</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface FinancialsProps {
    users: User[];
    activeBandId: string;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    budgets: Budget[];
    setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
    splits: {[key: string]: number};
    setSplits: React.Dispatch<React.SetStateAction<{[key: string]: number}>>;
    cashOnHand: number;
    setCashOnHand: React.Dispatch<React.SetStateAction<number>>;
}

export const Financials: React.FC<FinancialsProps> = ({ 
    users, activeBandId, 
    transactions: allTransactions, setTransactions: setAllTransactions,
    budgets: allBudgets, setBudgets: setAllBudgets,
    splits, setSplits,
    cashOnHand, setCashOnHand
}) => {

  const transactions = useMemo(() => allTransactions.filter(t => t.bandId === activeBandId), [allTransactions, activeBandId]);
  const budgets = useMemo(() => allBudgets.filter(b => b.bandId === activeBandId), [allBudgets, activeBandId]);
  
  const [view, setView] = useState<'overview' | 'reports'>('overview');
  const [showForm, setShowForm] = useState(false);
  
  // Fix: Use local date string instead of ISO (UTC) to prevent "tomorrow" bugs
  const getLocalDateString = () => {
      const d = new Date();
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().split('T')[0];
  };

  const [newTx, setNewTx] = useState({
    description: '', amount: '', type: TransactionType.Income, category: incomeCategories[0], date: getLocalDateString()
  });
  const [showTip, setShowTip] = useState(true);
  
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editedTxData, setEditedTxData] = useState<Transaction | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleStartEditing = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditedTxData(tx);
  };

  const handleCancelEditing = () => {
      setEditingTxId(null);
      setEditedTxData(null);
  };

  const handleSaveEditing = () => {
      if (!editingTxId || !editedTxData) return;
      setAllTransactions(prev => prev.map(tx => tx.id === editingTxId ? editedTxData : tx));
      handleCancelEditing();
  };
  
  const handleEditDataChange = (field: keyof Transaction, value: any) => {
      if (editedTxData) {
          setEditedTxData({ ...editedTxData, [field]: value });
      }
  };


  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.description || !newTx.amount) return;
    const tx: Transaction = {
      id: Date.now().toString(),
      description: newTx.description,
      amount: parseFloat(newTx.amount),
      type: newTx.type,
      category: newTx.category,
      date: newTx.date,
      bandId: activeBandId,
    };
    setAllTransactions(prev => [...prev, tx]);
    setNewTx({ description: '', amount: '', type: TransactionType.Income, category: incomeCategories[0], date: getLocalDateString() });
    setShowForm(false);
  };
  
  const deleteTransaction = (id: string) => setAllTransactions(prev => prev.filter(t => t.id !== id));
  
  const totalIncome = useMemo(() => transactions.filter(t => t.type === TransactionType.Income).reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpenses = useMemo(() => transactions.filter(t => t.type === TransactionType.Expense).reduce((s, t) => s + t.amount, 0), [transactions]);
  const balance = totalIncome - totalExpenses;
  const totalBalance = cashOnHand + balance;

  const chartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dataByMonth = months.map(m => ({label: m, income: 0, expense: 0}));
    transactions.forEach(tx => {
        const monthIndex = new Date(tx.date).getMonth();
        if (tx.type === TransactionType.Income) dataByMonth[monthIndex].income += tx.amount;
        else dataByMonth[monthIndex].expense += tx.amount;
    });
    return dataByMonth;
  }, [transactions]);
  
  const totalSplit = (Object.values(splits) as number[]).reduce((sum, s) => sum + s, 0);

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold">Financials</h1>
             <button onClick={() => setShowForm(!showForm)} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <PlusIcon className="h-5 w-5 mr-2"/>{showForm ? 'Cancel' : 'Add Transaction'}
            </button>
        </div>

        {showTip && (
            <Tip onDismiss={() => setShowTip(false)}>
                Set your band's starting 'Cash on Hand' to get a complete picture of your total funds. Use 'Member Splits' to see each person's calculated earnings.
            </Tip>
        )}
        
        {/* Tabs */}
        <div className="flex justify-between items-center border-b border-gray-700 mb-6">
            <div className="flex">
                <button onClick={() => setView('overview')} className={`px-4 py-2 text-sm font-medium ${view === 'overview' ? 'border-b-2 border-spotify-green text-white' : 'text-gray-400'}`}>Overview</button>
                <button onClick={() => setView('reports')} className={`px-4 py-2 text-sm font-medium ${view === 'reports' ? 'border-b-2 border-spotify-green text-white' : 'text-gray-400'}`}>Reports</button>
            </div>
            <button onClick={() => setIsResetModalOpen(true)} className="flex items-center text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 font-semibold py-1 px-3 rounded-md">
                <RefreshCwIcon className="h-4 w-4 mr-2" /> Reset Balances
            </button>
        </div>
        
        {showForm && (
             <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-lg">
                <form onSubmit={handleAddTransaction} className="space-y-4">
                    <input type="text" placeholder="Description" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} className="w-full bg-gray-700 p-3 rounded-lg ring-spotify-green" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input type="number" placeholder="Amount" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} className="bg-gray-700 p-3 rounded-lg ring-spotify-green" />
                         <select value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value as TransactionType, category: e.target.value === TransactionType.Income ? incomeCategories[0] : expenseCategories[0]})} className="bg-gray-700 p-3 rounded-lg ring-spotify-green">
                            {Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} className="bg-gray-700 p-3 rounded-lg ring-spotify-green">
                            {(newTx.type === TransactionType.Income ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                         <input type="date" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} className="bg-gray-700 p-3 rounded-lg ring-spotify-green" />
                    </div>
                    <button type="submit" className="w-full bg-spotify-green hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">Save Transaction</button>
                </form>
            </div>
        )}

        {view === 'overview' && (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm text-gray-400">Cash on Hand</h3><p className="text-2xl font-bold">${cashOnHand.toFixed(2)}</p></div>
                <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm text-green-300">Total Income</h3><p className="text-2xl font-bold">${totalIncome.toFixed(2)}</p></div>
                <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm text-red-300">Total Expenses</h3><p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p></div>
                <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm text-blue-300">Total Balance</h3><p className="text-2xl font-bold">${totalBalance.toFixed(2)}</p></div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Monthly Overview</h2>
                <BarChart data={chartData}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-gray-800 p-4 rounded-xl shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="border-b border-gray-700"><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3 text-right">Amount</th><th className="p-3"></th></tr></thead>
                            <tbody>
                                {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => {
                                    const isEditing = editingTxId === tx.id;
                                    if (isEditing && editedTxData) {
                                        return (
                                            <tr key={tx.id} className="bg-gray-700/50">
                                                <td className="p-3 text-gray-400">{new Date(tx.date).toLocaleDateString('en-US')}</td>
                                                <td className="p-2 space-y-1">
                                                    <input type="text" value={editedTxData.description} onChange={e => handleEditDataChange('description', e.target.value)} className="w-full bg-gray-900 p-1 rounded text-sm"/>
                                                    <select value={editedTxData.category} onChange={e => handleEditDataChange('category', e.target.value)} className="w-full bg-gray-900 p-1 rounded text-xs">
                                                        {(tx.type === TransactionType.Income ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </td>
                                                <td className="p-2 text-right">
                                                    <input type="number" value={editedTxData.amount} onChange={e => handleEditDataChange('amount', parseFloat(e.target.value))} className="w-24 bg-gray-900 p-1 rounded text-right"/>
                                                </td>
                                                <td className="p-3 text-right flex gap-2 justify-end">
                                                    <button onClick={handleSaveEditing} className="p-1 rounded-full hover:bg-gray-600"><SaveIcon className="w-5 h-5 text-green-500"/></button>
                                                    <button onClick={handleCancelEditing} className="p-1 rounded-full hover:bg-gray-600"><SlashIcon className="w-5 h-5 text-gray-500"/></button>
                                                </td>
                                            </tr>
                                        )
                                    }
                                    return (
                                        <tr key={tx.id} className="border-b border-gray-700 last:border-b-0">
                                            <td className="p-3 text-gray-400">{new Date(tx.date).toLocaleDateString('en-US')}</td>
                                            <td className="p-3 font-semibold">{tx.description} <span className="text-xs text-gray-500">({tx.category})</span></td>
                                            <td className={`p-3 text-right font-bold ${tx.type === TransactionType.Income ? 'text-green-400' : 'text-red-400'}`}>{tx.type === TransactionType.Income ? '+' : '-'}${tx.amount.toFixed(2)}</td>
                                            <td className="p-3 text-right flex gap-1 justify-end">
                                                <button onClick={() => handleStartEditing(tx)} className="p-1 rounded-full hover:bg-gray-700"><EditIcon className="w-5 h-5 text-gray-500"/></button>
                                                <button onClick={() => deleteTransaction(tx.id)} className="p-1 rounded-full hover:bg-gray-700"><TrashIcon className="w-5 h-5 text-gray-500"/></button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    {transactions.length === 0 && <p className="text-center text-gray-500 py-8">No transactions logged yet.</p>}
                </div>
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4">Member Splits <span className={`text-sm font-normal ${totalSplit !== 100 ? 'text-red-500' : 'text-green-500'}`}>({totalSplit.toFixed(1)}%)</span></h2>
                    <div className="space-y-4">
                        {users.map(user => (
                            <div key={user.id}>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="font-semibold text-sm">{user.name}</label>
                                    <div className="flex items-center">
                                        <input type="number" value={splits[user.id] || 0} onChange={e => setSplits({...splits, [user.id]: parseFloat(e.target.value) || 0})} className="w-20 bg-gray-700 text-right rounded p-1"/>
                                        <span className="text-sm ml-1">%</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                    <div className="bg-purple-600 h-2.5 rounded-full" style={{width: `${splits[user.id] || 0}%`}}></div>
                                </div>
                                <p className="text-xs text-right mt-1 text-green-400 font-semibold">Earned: ${(balance * (((splits[user.id] as number) || 0)/100)).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>)}
        
        {view === 'reports' && (
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Profit & Loss Statement</h2>
                 <div className="overflow-x-auto">
                    <table className="w-full">
                        <tbody>
                            <tr className="border-b-2 border-gray-600"><td className="font-bold text-lg p-2">Income</td><td></td></tr>
                            {incomeCategories.map(cat => {
                                const total = transactions.filter(t => t.type === TransactionType.Income && t.category === cat).reduce((s,t) => s+t.amount, 0);
                                if (total === 0) return null;
                                return <tr key={cat} className="border-b border-gray-700"><td className="p-2 pl-6">{cat}</td><td className="text-right p-2">${total.toFixed(2)}</td></tr>
                            })}
                            <tr className="border-b border-gray-700"><td className="p-2 font-bold text-green-400">Total Income</td><td className="text-right p-2 font-bold text-green-400">${totalIncome.toFixed(2)}</td></tr>
                            
                            <tr className="border-b-2 border-gray-600 mt-4"><td className="font-bold text-lg p-2 pt-6">Expenses</td><td></td></tr>
                            {expenseCategories.map(cat => {
                                const total = transactions.filter(t => t.type === TransactionType.Expense && t.category === cat).reduce((s,t) => s+t.amount, 0);
                                if (total === 0) return null;
                                return <tr key={cat} className="border-b border-gray-700"><td className="p-2 pl-6">{cat}</td><td className="text-right p-2">(${total.toFixed(2)})</td></tr>
                            })}
                            <tr className="border-b border-gray-700"><td className="p-2 font-bold text-red-400">Total Expenses</td><td className="text-right p-2 font-bold text-red-400">(${totalExpenses.toFixed(2)})</td></tr>
                            
                            <tr className="bg-gray-700/50"><td className="p-2 font-bold text-xl">Net Profit</td><td className={`text-right p-2 font-bold text-xl ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>${balance.toFixed(2)}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        {isResetModalOpen && <ResetModal onClose={() => setIsResetModalOpen(false)} onSave={setCashOnHand} currentCash={cashOnHand} />}
    </div>
  );
};

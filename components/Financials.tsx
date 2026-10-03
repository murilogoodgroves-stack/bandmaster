
import React, { useState, useMemo } from 'react';
import Tesseract from 'tesseract.js';
import useLocalStorage from '../hooks/useLocalStorage';
import type { Transaction, Budget, User, MerchItem, MemberTransaction, FinanceAccountType } from '../types';
import { TransactionType, MemberTransactionType } from '../types';
import { PlusIcon, TrashIcon, EditIcon, SaveIcon, SlashIcon, RefreshCwIcon, UploadCloudIcon } from './icons';
import { Tip } from './Tip';
import { FinanceMerchImportAssistant } from './FinanceMerchImportAssistant';
import { parseReceiptAmount, parseReceiptDate } from '../state/receiptParsing';

interface FinanceImportRecord {
    id: string;
    sourceFileName: string;
    sourceType: 'receipt' | 'manual';
    timestamp: string;
    ocrText: string;
    parsedSummary: {
        description: string;
        amount: number;
        type: TransactionType;
        category: string;
        date: string;
        accountType: FinanceAccountType;
        ownerId?: string;
    };
    createdTransactionId?: string;
    warnings: string[];
}

const incomeCategories = ["Gig", "Merch", "Streaming", "Other"];
const expenseCategories = ["Gear", "Studio", "Travel", "Marketing", "Other"];
const accountOptions: FinanceAccountType[] = ['Cash', 'Bank', 'PayPal', 'Card', 'Other'];

const parseMoneyValue = (text: string) => {
    return parseReceiptAmount(text);
};

const parseDateValue = (text: string) => {
    return parseReceiptDate(text);
};

const inferReceiptData = (ocrText: string, users: User[]): {
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    ownerId: string;
    accountType: FinanceAccountType;
    source: string;
    notes: string;
} => {
    const cleanedText = ocrText.replace(/\s+/g, ' ');
    const amount = parseMoneyValue(cleanedText);
    const date = parseDateValue(cleanedText);
    const ownerId = users.find((user) => {
        const firstName = user.name.trim().split(/\s+/)[0]?.toLowerCase();
        return firstName && cleanedText.toLowerCase().includes(firstName);
    })?.id || '';
    const type = /\b(sale|revenue|income|received|refund|profit)\b|\bcredit\b(?!\s+card)/i.test(cleanedText) ? TransactionType.Income : TransactionType.Expense;
    const accountType: FinanceAccountType = /paypal/i.test(cleanedText) ? 'PayPal' : /bank|wire|transfer/i.test(cleanedText) ? 'Bank' : /card|visa|mastercard|amex/i.test(cleanedText) ? 'Card' : 'Cash';
    const category = /(merch|shirt|vinyl|\bcd\b|hoodie|tee|poster|product|print)/i.test(cleanedText) ? 'Merch' : /(travel|flight|hotel|uber|taxi|fuel|mileage)/i.test(cleanedText) ? 'Travel' : /(studio|mix|master|record)/i.test(cleanedText) ? 'Studio' : /(gig|show|performance|festival)/i.test(cleanedText) ? 'Gig' : 'Other';
    const description = ocrText
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .find((line) => line.length > 6 && !/[$£€]\s*\d|\d{2,4}-\d{1,2}-\d{1,2}|\b(total|subtotal|tax|change|cash|card)\b/i.test(line))
        || 'Receipt import';

    return {
        description: description.trim().slice(0, 120) || 'Receipt import',
        amount,
        type,
        category,
        date,
        ownerId,
        accountType,
        source: 'Receipt OCR import',
        notes: `Automatic receipt parse from uploaded image. ${cleanedText.slice(0, 240)}`,
    };
};

const BarChart: React.FC<{data: {label: string, income: number, expense: number}[]}> = ({data}) => {
    const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);
    return (
        <div className="bg-gray-900 p-4 rounded-lg h-64 flex items-end justify-around gap-4">
            {data.map(({label, income, expense}) => (
                <div key={label} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex justify-center items-end gap-1 h-full">
                        <div className="w-1/2 bg-spotify-green rounded-t-sm transition-all duration-300" style={{height: `${(income/maxVal)*100}%`}} title={`Income: $${income.toFixed(2)}`}></div>
                        <div className="w-1/2 bg-red-500 rounded-t-sm transition-all duration-300" style={{height: `${(expense/maxVal)*100}%`}} title={`Expense: $${expense.toFixed(2)}`}></div>
                    </div>
                    <span className="text-xs text-gray-400 mt-2">{label}</span>
                </div>
            ))}
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
    merch?: MerchItem[];
    setMerch?: React.Dispatch<React.SetStateAction<MerchItem[]>>;
    memberTransactions?: MemberTransaction[];
    setMemberTransactions?: React.Dispatch<React.SetStateAction<MemberTransaction[]>>;
}

export const Financials: React.FC<FinancialsProps> = ({ 
    users, activeBandId,
    transactions: allTransactions, setTransactions: setAllTransactions,
    budgets: allBudgets, setBudgets: setAllBudgets,
    splits, setSplits,
    cashOnHand, setCashOnHand,
    merch = [], setMerch = () => undefined,
    memberTransactions = [], setMemberTransactions = () => undefined,
}) => {

  const transactions = useMemo(() => allTransactions.filter(t => t.bandId === activeBandId), [allTransactions, activeBandId]);
  const budgets = useMemo(() => allBudgets.filter(b => b.bandId === activeBandId), [allBudgets, activeBandId]);

  const [view, setView] = useState<'overview' | 'reports'>('overview');
  const [showForm, setShowForm] = useState(false);
  const [showReceiptImport, setShowReceiptImport] = useState(false);
  const [receiptImportStatus, setReceiptImportStatus] = useState('');
  const [receiptSourceFileName, setReceiptSourceFileName] = useState('');
  const [isReceiptProcessing, setIsReceiptProcessing] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<ReturnType<typeof inferReceiptData> | null>(null);
  const [receiptImportError, setReceiptImportError] = useState<string | null>(null);
  const [financeImportHistory, setFinanceImportHistory] = useLocalStorage<FinanceImportRecord[]>('financeImportHistory', []);

  const getLocalDateString = () => {
      const d = new Date();
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().split('T')[0];
  };

  const [newTx, setNewTx] = useState({
    description: '',
    amount: '',
    type: TransactionType.Income,
    category: incomeCategories[0],
    date: getLocalDateString(),
    ownerId: users[0]?.id || '',
    accountType: 'Cash' as FinanceAccountType,
    source: '',
    notes: '',
  });
  const [showTip, setShowTip] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

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

    const trimmedDescription = newTx.description.trim();
    const amountValue = Number(newTx.amount);

    if (!trimmedDescription) {
      setFormError('Add a transaction description before saving.');
      return;
    }

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setFormError('Amount must be a valid number greater than zero.');
      return;
    }

    const tx: Transaction = {
      id: Date.now().toString(),
      description: trimmedDescription,
      amount: amountValue,
      type: newTx.type,
      category: newTx.category,
      date: newTx.date || getLocalDateString(),
      bandId: activeBandId,
      ownerId: newTx.ownerId || users[0]?.id,
      accountType: newTx.accountType,
      source: newTx.source.trim() || 'Manual entry',
      notes: newTx.notes.trim(),
    };

    setAllTransactions(prev => [...prev, tx]);
    setFormError(null);
    setNewTx({
      description: '',
      amount: '',
      type: TransactionType.Income,
      category: incomeCategories[0],
      date: getLocalDateString(),
      ownerId: users[0]?.id || '',
      accountType: 'Cash',
      source: '',
      notes: '',
    });
    setShowForm(false);
  };

  const deleteTransaction = (id: string) => setAllTransactions(prev => prev.filter(t => t.id !== id));

  const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setReceiptImportError(null);
    setReceiptImportStatus('Reading receipt and extracting ledger details...');
    setReceiptPreview(null);
    setReceiptSourceFileName(file.name);
    setIsReceiptProcessing(true);

    try {
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: (progress) => {
          if (progress.status === 'recognizing text') {
            setReceiptImportStatus(`Processing receipt... ${Math.round(progress.progress * 100)}%`);
          }
        },
      });

      const parsed = inferReceiptData(data.text, users);
      setReceiptPreview(parsed);
      setReceiptImportStatus('Receipt parsed. Review and correct the details before saving; inventory is not changed automatically.');
      setReceiptImportError(null);
    } catch (error) {
      console.error('Receipt OCR failed:', error);
      setReceiptImportError('The receipt image could not be processed. Please try a clearer photo or re-upload.');
      setReceiptImportStatus('');
    } finally {
      setIsReceiptProcessing(false);
      event.target.value = '';
    }
  };

  const handleSaveReceiptImport = () => {
    if (!receiptPreview) return;
    if (!receiptPreview.description.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(receiptPreview.date)) {
      setReceiptImportError('Enter a description and valid date before saving this transaction.');
      return;
    }
    const normalizedDescription = receiptPreview.description.trim().toLowerCase();
    const duplicate = transactions.find((tx) => tx.description.trim().toLowerCase() === normalizedDescription
      && Math.round(tx.amount * 100) === Math.round(receiptPreview.amount * 100)
      && tx.date === receiptPreview.date);
    if (duplicate) {
      setReceiptImportError('This receipt matches an existing transaction. Check the ledger instead of importing it again; use a manual transaction if it is genuinely separate.');
      return;
    }
    if (!Number.isFinite(receiptPreview.amount) || receiptPreview.amount <= 0) {
      setReceiptImportError('No valid receipt total was recognized. Re-upload a clearer image or enter the transaction manually.');
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      description: receiptPreview.description,
      amount: receiptPreview.amount,
      type: receiptPreview.type,
      category: receiptPreview.category,
      date: receiptPreview.date,
      bandId: activeBandId,
      ownerId: receiptPreview.ownerId || users[0]?.id || '',
      accountType: receiptPreview.accountType,
      source: receiptPreview.source,
      notes: receiptPreview.notes,
    };

    setAllTransactions((prev) => [...prev, newTransaction]);

    const importRecord: FinanceImportRecord = {
      id: `receipt-${Date.now()}`,
      sourceFileName: receiptSourceFileName || 'receipt-import',
      sourceType: 'receipt',
      timestamp: new Date().toISOString(),
      ocrText: receiptPreview.notes,
      parsedSummary: {
        description: newTransaction.description,
        amount: newTransaction.amount,
        type: newTransaction.type,
        category: newTransaction.category,
        date: newTransaction.date,
        accountType: newTransaction.accountType || 'Cash',
        ownerId: newTransaction.ownerId,
      },
      createdTransactionId: newTransaction.id,
      warnings: ['Merch inventory was not changed automatically; review any stock adjustment in Merchandise.'],
    };

    setFinanceImportHistory((prev) => [importRecord, ...prev].slice(0, 50));
    setShowReceiptImport(false);
    setReceiptPreview(null);
    setReceiptImportStatus('Receipt saved to the ledger and retained in the import history.');
  };

  const totalIncome = useMemo(() => transactions.filter(t => t.type === TransactionType.Income).reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpenses = useMemo(() => transactions.filter(t => t.type === TransactionType.Expense).reduce((s, t) => s + t.amount, 0), [transactions]);
  const balance = totalIncome - totalExpenses;
  const totalBalance = cashOnHand + balance;

  const accountTotals = useMemo(() => {
    const totals: Record<FinanceAccountType, number> = { Cash: 0, Bank: 0, PayPal: 0, Card: 0, Other: 0 };
    transactions.forEach((tx) => {
      const account = tx.accountType || 'Cash';
      if (tx.type === TransactionType.Income) totals[account] += tx.amount;
      else totals[account] -= tx.amount;
    });
    return totals;
  }, [transactions]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dataByMonth = months.map(m => ({label: m, income: 0, expense: 0}));
    transactions.forEach(tx => {
        const monthIndex = new Date(tx.date).getMonth();
        if (tx.type === TransactionType.Income) dataByMonth[monthIndex].income += tx.amount;
        else dataByMonth[monthIndex].expense += tx.amount;
    });
    return dataByMonth;
  }, [transactions]);

  const totalSplit = (Object.values(splits) as number[]).reduce((sum, s) => sum + s, 0);

  const memberBalances = useMemo(() => {
    return users.map(user => {
      let balances = 0;
      memberTransactions
        .filter(entry => entry.memberId === user.id && entry.bandId === activeBandId)
        .forEach(entry => {
          if (entry.type === MemberTransactionType.Contribution) balances += entry.amount;
          if (entry.type === MemberTransactionType.Withdrawal) balances -= entry.amount;
          if (entry.type === MemberTransactionType.Settlement) balances += entry.amount;
        });

      const assignedFiat = transactions
        .filter(tx => tx.ownerId === user.id && tx.bandId === activeBandId)
        .reduce((sum, tx) => sum + (tx.type === TransactionType.Income ? tx.amount : -tx.amount), 0);

      return { user, balance: balances + assignedFiat };
    }).filter(item => item.balance !== 0 || users.some(user => user.id === item.user.id));
  }, [users, memberTransactions, transactions, activeBandId]);

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold">Financials</h1>
            <div className="flex items-center gap-3">
             <button onClick={() => setShowReceiptImport(true)} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <UploadCloudIcon className="h-5 w-5 mr-2"/>Upload Receipt
            </button>
             <button onClick={() => setShowForm(!showForm)} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <PlusIcon className="h-5 w-5 mr-2"/>{showForm ? 'Cancel' : 'Add Transaction'}
            </button>
            </div>
        </div>

        {showTip && (
            <Tip onDismiss={() => setShowTip(false)}>
                Track cash flow with ownership, account type, and merch impact. Each income or expense can be tied to a member and a real account so the band finances stay transparent.
            </Tip>
        )}

        {receiptImportStatus && (
            <div className="mb-4 rounded-lg border border-purple-500/40 bg-purple-900/20 p-3 text-sm text-purple-100">
                {receiptImportStatus}
            </div>
        )}

        <FinanceMerchImportAssistant
            activeBandId={activeBandId}
            merch={merch}
            setMerch={setMerch as React.Dispatch<React.SetStateAction<MerchItem[]>>}
            transactions={allTransactions}
            setTransactions={setAllTransactions}
            memberTransactions={memberTransactions}
            setMemberTransactions={setMemberTransactions as React.Dispatch<React.SetStateAction<MemberTransaction[]>>}
            users={users}
            cashOnHand={cashOnHand}
            setCashOnHand={(value) => setCashOnHand(value as number)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
            <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm text-gray-400">Cash on Hand</h3><p className="text-2xl font-bold">${cashOnHand.toFixed(2)}</p></div>
            <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm text-green-300">Total Income</h3><p className="text-2xl font-bold">${totalIncome.toFixed(2)}</p></div>
            <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm text-red-300">Total Expenses</h3><p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p></div>
            <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm text-blue-300">Net Profit</h3><p className="text-2xl font-bold">${balance.toFixed(2)}</p></div>
            <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm text-purple-300">Band Balance</h3><p className="text-2xl font-bold">${totalBalance.toFixed(2)}</p></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {accountOptions.map((account) => (
            <div key={account} className="bg-gray-800 p-4 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">{account}</h3>
                <span className={`${accountTotals[account] >= 0 ? 'text-green-400' : 'text-red-400'} font-bold`}>${Math.abs(accountTotals[account]).toFixed(2)}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-700">
                <div className="h-2 rounded-full bg-gradient-to-r from-brand-accent to-purple-500" style={{ width: `${Math.min(100, Math.abs(accountTotals[account]) / Math.max(totalIncome || 1, totalExpenses || 1) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {memberBalances.length > 0 && (
            <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Member cash ledger</h2>
                <div className="space-y-3">
                    {memberBalances.map(({ user, balance }) => (
                        <div key={user.id} className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                            <span>{user.name}</span>
                            <span className={balance >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                {balance >= 0 ? '+$' : '-$'}{Math.abs(balance).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )}

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
                    {formError && (
                        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                            {formError}
                        </div>
                    )}
                    <input type="text" placeholder="Description" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} className="w-full bg-gray-700 p-3 rounded-lg ring-spotify-green" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <input type="number" placeholder="Amount" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} className="bg-gray-700 p-3 rounded-lg ring-spotify-green" />
                        <select value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value as TransactionType, category: e.target.value === TransactionType.Income ? incomeCategories[0] : expenseCategories[0]})} className="bg-gray-700 p-3 rounded-lg ring-spotify-green">
                            {Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} className="bg-gray-700 p-3 rounded-lg ring-spotify-green">
                            {(newTx.type === TransactionType.Income ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select value={newTx.ownerId} onChange={e => setNewTx({...newTx, ownerId: e.target.value})} className="bg-gray-700 p-3 rounded-lg ring-spotify-green">
                            <option value="">Unassigned</option>
                            {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </select>
                        <select value={newTx.accountType} onChange={e => setNewTx({...newTx, accountType: e.target.value as FinanceAccountType})} className="bg-gray-700 p-3 rounded-lg ring-spotify-green">
                            {accountOptions.map(account => <option key={account} value={account}>{account}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Source / origin (gig, merch, paypal, etc.)" value={newTx.source} onChange={e => setNewTx({...newTx, source: e.target.value})} className="bg-gray-700 p-3 rounded-lg ring-spotify-green" />
                        <input type="date" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} className="bg-gray-700 p-3 rounded-lg ring-spotify-green" />
                    </div>
                    <textarea value={newTx.notes} onChange={e => setNewTx({...newTx, notes: e.target.value})} rows={3} placeholder="Notes / assignment / cash origin" className="w-full bg-gray-700 p-3 rounded-lg ring-spotify-green" />
                    <button type="submit" className="w-full bg-spotify-green hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">Save Transaction</button>
                </form>
            </div>
        )}

        {showReceiptImport && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Upload receipt image</h2>
                        <button type="button" onClick={() => { setShowReceiptImport(false); setReceiptPreview(null); setReceiptImportError(null); }} className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded">Close</button>
                    </div>

                    <div className="bg-gray-900 rounded-xl p-4 mb-4">
                        <label className="block text-sm text-gray-300 mb-2">Choose a handwritten or printed receipt image</label>
                        <input type="file" accept="image/*" onChange={handleReceiptUpload} disabled={isReceiptProcessing} className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 disabled:opacity-50" />
                    </div>

                    {receiptImportStatus && <p role="status" className="text-sm text-purple-200 mb-3">{receiptImportStatus}</p>}
                    {receiptImportError && <p className="text-red-400 text-sm mb-3">{receiptImportError}</p>}

                    {receiptPreview && (
                        <div className="bg-gray-900 rounded-xl p-4 mb-4 space-y-3">
                            {transactions.some((tx) => tx.description.trim().toLowerCase() === receiptPreview.description.trim().toLowerCase() && Math.round(tx.amount * 100) === Math.round(receiptPreview.amount * 100) && tx.date === receiptPreview.date) && <p role="alert" className="text-sm text-amber-300">This appears to match an existing transaction. Check the ledger before importing it again.</p>}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <label className="text-gray-400">Description<input value={receiptPreview.description} onChange={(event) => setReceiptPreview({ ...receiptPreview, description: event.target.value })} className="mt-1 block w-full rounded bg-gray-800 p-2 text-white" /></label>
                                <label className="text-gray-400">Amount<input type="number" min="0" step="0.01" value={receiptPreview.amount} onChange={(event) => setReceiptPreview({ ...receiptPreview, amount: Number(event.target.value) || 0 })} className="mt-1 block w-full rounded bg-gray-800 p-2 text-white" /></label>
                                <label className="text-gray-400">Date<input type="date" value={receiptPreview.date} onChange={(event) => setReceiptPreview({ ...receiptPreview, date: event.target.value })} className="mt-1 block w-full rounded bg-gray-800 p-2 text-white" /></label>
                                <label className="text-gray-400">Account<select value={receiptPreview.accountType} onChange={(event) => setReceiptPreview({ ...receiptPreview, accountType: event.target.value as FinanceAccountType })} className="mt-1 block w-full rounded bg-gray-800 p-2 text-white">{accountOptions.map((account) => <option key={account}>{account}</option>)}</select></label>
                                <label className="text-gray-400">Transaction type<select value={receiptPreview.type} onChange={(event) => setReceiptPreview({ ...receiptPreview, type: event.target.value as TransactionType })} className="mt-1 block w-full rounded bg-gray-800 p-2 text-white"><option value={TransactionType.Income}>Income</option><option value={TransactionType.Expense}>Expense</option></select></label>
                            </div>
                            <div className="text-xs text-gray-400">Type: {receiptPreview.type} · Category: {receiptPreview.category} · Owner: {users.find((user) => user.id === receiptPreview.ownerId)?.name || 'Unassigned'}</div>
                            <div className="text-xs text-amber-300">{receiptPreview.notes}</div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => { setShowReceiptImport(false); setReceiptPreview(null); }} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">Cancel</button>
                        <button type="button" onClick={handleSaveReceiptImport} disabled={!receiptPreview || isReceiptProcessing || receiptPreview.amount <= 0 || transactions.some((tx) => tx.description.trim().toLowerCase() === receiptPreview.description.trim().toLowerCase() && Math.round(tx.amount * 100) === Math.round(receiptPreview.amount * 100) && tx.date === receiptPreview.date)} className="bg-spotify-green hover:bg-green-500 px-4 py-2 rounded disabled:bg-gray-600 disabled:cursor-not-allowed">Save to ledger</button>
                    </div>
                </div>
            </div>
        )}

        {financeImportHistory.length > 0 && (
            <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Receipt import history</h2>
                <div className="space-y-3">
                    {financeImportHistory.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="bg-gray-900 rounded-lg p-3 text-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">{entry.parsedSummary.description}</span>
                                <span className="text-green-400">${entry.parsedSummary.amount.toFixed(2)}</span>
                            </div>
                            <div className="text-gray-400">{new Date(entry.timestamp).toLocaleString()} · {entry.parsedSummary.date}</div>
                            {entry.warnings.length > 0 && <div className="text-amber-300 mt-2">{entry.warnings.join(' ')}</div>}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {view === 'overview' && (
        <>
            <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Monthly Overview</h2>
                <BarChart data={chartData}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-gray-800 p-4 rounded-xl shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="border-b border-gray-700"><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Owner</th><th className="p-3">Account</th><th className="p-3 text-right">Amount</th><th className="p-3"></th></tr></thead>
                            <tbody>
                                {transactions.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => {
                                    const isEditing = editingTxId === tx.id;
                                    const owner = users.find(u => u.id === tx.ownerId);
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
                                                <td className="p-2">
                                                    <select value={editedTxData.ownerId || ''} onChange={e => handleEditDataChange('ownerId', e.target.value || undefined)} className="w-full bg-gray-900 p-1 rounded text-xs">
                                                        <option value="">Unassigned</option>
                                                        {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                    <select value={editedTxData.accountType || 'Cash'} onChange={e => handleEditDataChange('accountType', e.target.value as FinanceAccountType)} className="w-full bg-gray-900 p-1 rounded text-xs">
                                                        {accountOptions.map(option => <option key={option} value={option}>{option}</option>)}
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
                                            <td className="p-3 font-semibold">{tx.description}<div className="text-xs text-gray-500">{tx.source || tx.category}</div></td>
                                            <td className="p-3">{owner ? owner.name : 'Unassigned'}</td>
                                            <td className="p-3">{tx.accountType || 'Cash'}</td>
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

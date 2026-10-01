import React, { useState, useMemo, useRef } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { MerchItem, Transaction, MerchVariant } from '../types';
import { TransactionType } from '../types';
import { PlusIcon, TrashIcon, ChevronDownIcon, EditIcon } from './icons';
import { initialMerch, initialTransactions } from '../data/initialData';
import { FinanceMerchImportAssistant } from './FinanceMerchImportAssistant';

const merchTypes = ["T-Shirt", "Vinyl", "CD", "Poster", "Other"];

const createDefaultMerchVariants = (): { [key: string]: MerchVariant[] } => ({
  Size: [{ id: `size-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, name: 'Default', stock: 0 }],
});

const normalizeMerchVariants = (variants?: { [key: string]: MerchVariant[] }) => {
  if (!variants || !Object.keys(variants).length) return createDefaultMerchVariants();

  const next = { ...variants };
  if (!next.Size || !Array.isArray(next.Size) || next.Size.length === 0) {
    next.Size = [{ id: `size-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, name: 'Default', stock: 0 }];
  }

  return next;
};

const LogStockModal: React.FC<{
  item: MerchItem;
  variant: MerchVariant;
  onClose: () => void;
  onLog: (quantity: number, totalCost: number) => void;
}> = ({ item, variant, onClose, onLog }) => {
    const [quantity, setQuantity] = useState(1);
    const [totalCost, setTotalCost] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity > 0 && totalCost > 0) {
            onLog(quantity, totalCost);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-2">Log Stock Purchase</h2>
                <p className="text-gray-400 mb-4">For: <span className="font-semibold text-white">{item.name} ({variant.name})</span></p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Quantity Added</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                            min="1"
                            className="w-full bg-gray-700 p-3 rounded-lg mt-1"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Total Cost ($)</label>
                        <input
                            type="number"
                            value={totalCost}
                            onChange={e => setTotalCost(parseFloat(e.target.value) || 0)}
                            min="0.01"
                            step="0.01"
                            className="w-full bg-gray-700 p-3 rounded-lg mt-1"
                            placeholder="e.g., 150.00"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Log Purchase</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const Merchandise: React.FC<{
    merch: MerchItem[];
    setMerch: React.Dispatch<React.SetStateAction<MerchItem[]>>;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    activeBandId: string;
    cashOnHand: number;
    setCashOnHand: (value: number) => void;
}> = ({ merch: allMerch, setMerch: setAllMerch, transactions: allTransactions, setTransactions: setAllTransactions, activeBandId, cashOnHand, setCashOnHand }) => {
  
  const merch = useMemo(() => allMerch.filter(m => m.bandId === activeBandId), [allMerch, activeBandId]);
  
  const [showForm, setShowForm] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const priceInputRef = useRef<HTMLInputElement | null>(null);
  const [newItem, setNewItem] = useState<Omit<MerchItem, 'id' | 'bandId'>>({
    name: '', type: merchTypes[0], cost: 0, price: 0, variants: { Size: [{ id: 'v_s', name: 'S', stock: 0 }, { id: 'v_m', name: 'M', stock: 0 }, { id: 'v_l', name: 'L', stock: 0 }] }
  });
  const [sale, setSale] = useState({ itemId: '', variantId: '', quantity: 1 });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [stockModalInfo, setStockModalInfo] = useState<{ item: MerchItem, variant: MerchVariant } | null>(null);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null);

  const handleAddItem = (e?: React.FormEvent | React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault?.();

    const liveName = nameInputRef.current?.value ?? newItem.name;
    const livePrice = Number(priceInputRef.current?.value ?? newItem.price);
    const trimmedName = liveName.trim();
    const nextPrice = Number.isFinite(livePrice) ? livePrice : Number(newItem.price) || 0;
    const nextCost = Number(newItem.cost) || 0;

    if (!trimmedName) return;
    if (nextPrice < 0 || nextCost < 0) return;

    const normalizedItem: Omit<MerchItem, 'id' | 'bandId'> = {
      ...newItem,
      name: trimmedName,
      cost: nextCost,
      price: nextPrice,
      variants: normalizeMerchVariants(newItem.variants),
    };

    setAllMerch(prev => [...prev, { id: `merch-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, ...normalizedItem, bandId: activeBandId }]);
    setNewItem({
      name: '',
      type: merchTypes[0],
      cost: 0,
      price: 0,
      variants: { Size: [{ id: 'v_s', name: 'S', stock: 0 }, { id: 'v_m', name: 'M', stock: 0 }, { id: 'v_l', name: 'L', stock: 0 }] },
    });
    setShowForm(false);
  };

  const updateNewItemVariant = (index: number, field: 'name' | 'stock', value: string | number) => {
    setNewItem(prev => {
      const nextVariants = { ...prev.variants };
      const currentSizeList = [...(nextVariants.Size || [])];
      currentSizeList[index] = {
        ...currentSizeList[index],
        name: field === 'name' ? String(value) : currentSizeList[index]?.name || 'Default',
        stock: field === 'stock' ? Number(value) || 0 : currentSizeList[index]?.stock || 0,
      };
      nextVariants.Size = currentSizeList;
      return { ...prev, variants: nextVariants };
    });
  };
  
  const deleteItem = (id: string) => setAllMerch(prev => prev.filter(i => i.id !== id));

  const handleLogSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale.itemId || !sale.variantId || sale.quantity <= 0) return;

    // To prevent stale state issues, we perform the update inside the functional `setAllMerch`
    setAllMerch(prevMerch => {
        const item = prevMerch.find(i => i.id === sale.itemId);
        if (!item) {
            console.error("Item for sale not found in latest state");
            return prevMerch;
        }

        let variantName = '';
        const allVariants = Object.values(item.variants).flat() as MerchVariant[];
        const soldVariant = allVariants.find(v => v.id === sale.variantId);
        if (soldVariant) {
            variantName = soldVariant.name;
        }

        const newTransaction: Transaction = {
            id: Date.now().toString(),
            description: `Merch Sale: ${sale.quantity}x ${item.name} (${variantName})`,
            amount: item.price * sale.quantity,
            type: TransactionType.Income,
            category: 'Merch',
            date: new Date().toISOString().substring(0,10),
            bandId: activeBandId,
        };
        // It's safe to call another state setter here because React batches updates from event handlers
        setAllTransactions(prev => [...prev, newTransaction]);
        
        // Return the updated merch state
        return prevMerch.map(i => {
            if (i.id === sale.itemId) {
                const updatedVariants: {[key: string]: MerchVariant[]} = {};
                for (const key in i.variants) {
                    updatedVariants[key] = i.variants[key].map(v => 
                        v.id === sale.variantId ? {...v, stock: v.stock - sale.quantity} : v
                    );
                }
                return {...i, variants: updatedVariants};
            }
            return i;
        });
    });

    setSale({ itemId: '', variantId: '', quantity: 1 });
};
  
  const toggleExpand = (itemId: string) => {
      setExpandedItems(prev => {
          const newSet = new Set(prev);
          if (newSet.has(itemId)) {
              newSet.delete(itemId);
          } else {
              newSet.add(itemId);
          }
          return newSet;
      });
  };

  const handleStockChange = (itemId: string, variantId: string, newStock: number) => {
    if (isNaN(newStock) || newStock < 0) return;

    setAllMerch(prevMerch => prevMerch.map(item => {
      if (item.id === itemId) {
        const newVariants = { ...item.variants };
        for (const key in newVariants) {
          newVariants[key] = newVariants[key].map(variant =>
            variant.id === variantId ? { ...variant, stock: newStock } : variant
          );
        }
        return { ...item, variants: newVariants };
      }
      return item;
    }));
  };
  
  const handleLogStockPurchase = (quantity: number, totalCost: number) => {
    if (!stockModalInfo) return;
    const { item, variant } = stockModalInfo;

    // 1. Update stock
    handleStockChange(item.id, variant.id, variant.stock + quantity);

    // 2. Create financial transaction
    const newTransaction: Transaction = {
        id: Date.now().toString(),
        description: `Stock Purchase: ${quantity}x ${item.name} (${variant.name})`,
        amount: totalCost,
        type: TransactionType.Expense,
        category: 'Merch',
        date: new Date().toISOString().substring(0,10),
        bandId: activeBandId,
    };
    setAllTransactions(prev => [newTransaction, ...prev]);
    
    setStockModalInfo(null);
  };

  const handleNameSave = () => {
    if (editingItem && editingItem.name.trim()) {
        setAllMerch(prev => prev.map(i => i.id === editingItem.id ? { ...i, name: editingItem.name.trim() } : i));
    }
    setEditingItem(null);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleNameSave();
      } else if (e.key === 'Escape') {
          setEditingItem(null);
      }
  };

  const selectedItemForSale = merch.find(i => i.id === sale.itemId);
  const saleVariants: MerchVariant[] = selectedItemForSale ? Object.values(selectedItemForSale.variants).flat() as MerchVariant[] : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Merchandise</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          <PlusIcon className="h-5 w-5 mr-2"/>
          {showForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      <FinanceMerchImportAssistant
        activeBandId={activeBandId}
        merch={allMerch}
        setMerch={setAllMerch}
        transactions={allTransactions}
        setTransactions={setAllTransactions}
        cashOnHand={cashOnHand}
        setCashOnHand={setCashOnHand}
      />

      {showForm && (
        <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-lg">
          <h3 className="text-xl font-bold mb-4">New Merch Item</h3>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input ref={nameInputRef} type="text" placeholder="Item Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="bg-gray-700 p-3 rounded-lg" />
                <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})} className="bg-gray-700 p-3 rounded-lg">
                    {merchTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="number" placeholder="Cost per item" min="0" step="0.01" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: parseFloat(e.target.value) || 0})} className="bg-gray-700 p-3 rounded-lg" />
                <input ref={priceInputRef} type="number" placeholder="Sale Price" min="0" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} className="bg-gray-700 p-3 rounded-lg" />
            </div>
            {/* Simple variant handling for now */}
            <div>
                <label className="text-gray-400 text-sm">Variants (e.g., Size, Color)</label>
                <p className="text-xs text-gray-500 mb-2">For this demo, we'll stick with sizes. Edit data/initialData.ts for more complex variants.</p>
                <div className="space-y-2">
                 {(newItem.variants?.Size || []).map((variant, index) => (
                    <div key={`${variant.id || index}`} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => updateNewItemVariant(index, 'name', e.target.value)}
                          placeholder="Size (e.g. 'S')"
                          className="bg-gray-700 p-2 rounded-lg w-1/3"
                        />
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => updateNewItemVariant(index, 'stock', Number(e.target.value || 0))}
                          placeholder="Stock"
                          className="bg-gray-700 p-2 rounded-lg w-1/3"
                        />
                    </div>
                 ))}
                </div>
            </div>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleAddItem(e as unknown as React.MouseEvent<HTMLButtonElement>);
              }}
              onClick={() => handleAddItem()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Save Item
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gray-800 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold p-4">Inventory</h2>
            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-700/50">
                    <tr className="border-b border-gray-700"><th className="p-3"></th><th className="p-3">Item</th><th className="p-3">Total Stock</th><th className="p-3">Price</th><th className="p-3"></th></tr>
                </thead>
                <tbody>
                    {merch.map(item => {
                        const allVariants = Object.values(item.variants).flat() as MerchVariant[];
                        const totalStock = allVariants.reduce((sum, v) => sum + v.stock, 0);
                        const isLowStock = allVariants.some(v => v.stock < 10);
                        const isEditing = editingItem?.id === item.id;

                        return (
                        <React.Fragment key={item.id}>
                            <tr className="border-b border-gray-700">
                                <td className="p-3"><button onClick={() => toggleExpand(item.id)}><ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedItems.has(item.id) ? 'rotate-180' : ''}`} /></button></td>
                                <td className="p-3 font-semibold">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editingItem.name}
                                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                            onBlur={handleNameSave}
                                            onKeyDown={handleNameKeyDown}
                                            className="bg-gray-900 text-white p-1 rounded-md w-full focus:ring-2 ring-purple-500 outline-none"
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="flex items-center group">
                                            <span>{item.name} <span className="text-xs text-gray-500">({item.type})</span></span>
                                            <button onClick={() => setEditingItem({ id: item.id, name: item.name })} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-700">
                                                <EditIcon className="w-4 h-4 text-purple-400" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td className={`p-3 font-bold ${isLowStock && totalStock > 0 ? 'text-red-500' : ''}`}>{totalStock} {isLowStock && totalStock > 0 && '(Low!)'}</td>
                                <td className="p-3">${item.price.toFixed(2)}</td>
                                <td className="p-3 text-right"><button onClick={() => deleteItem(item.id)} className="p-1 rounded-full hover:bg-gray-700"><TrashIcon className="w-5 h-5 text-gray-500"/></button></td>
                            </tr>
                            {expandedItems.has(item.id) && (
                                <tr className="bg-gray-900/70">
                                    <td colSpan={5} className="p-3">
                                        <div className="grid grid-cols-3 gap-y-2 gap-x-4 text-sm px-4">
                                            <div className="font-bold text-gray-400">Variant</div>
                                            <div className="font-bold text-gray-400 text-center col-span-2">Stock</div>
                                             {allVariants.map(v => (
                                                <React.Fragment key={v.id}>
                                                    <div className="text-gray-300 flex items-center">{v.name}</div>
                                                    <div className="text-right flex items-center justify-end gap-2 col-span-2">
                                                        <input
                                                            type="number"
                                                            value={v.stock}
                                                            onChange={(e) => handleStockChange(item.id, v.id, parseInt(e.target.value))}
                                                            className={`bg-gray-700 p-1 rounded-md w-20 text-right ${v.stock < 10 && v.stock > 0 ? 'text-red-400 font-bold' : 'text-gray-300'}`}
                                                        />
                                                        <button onClick={() => setStockModalInfo({item, variant: v})} className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-md" title="Log Stock Purchase">
                                                            <PlusIcon className="w-4 h-4 text-white" />
                                                        </button>
                                                    </div>
                                                </React.Fragment>
                                             ))}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    )})}
                </tbody>
            </table>
            </div>
            {merch.length === 0 && <p className="text-center text-gray-500 py-8">No merchandise added yet.</p>}
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg h-fit">
            <h2 className="text-2xl font-bold mb-4">Log a Sale</h2>
            <form onSubmit={handleLogSale} className="space-y-4">
                <select value={sale.itemId} onChange={e => setSale({itemId: e.target.value, variantId: '', quantity: 1})} className="w-full bg-gray-700 p-3 rounded-lg" required>
                    <option value="">Select an item...</option>
                    {merch.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                {selectedItemForSale && (
                <select value={sale.variantId} onChange={e => setSale({...sale, variantId: e.target.value})} className="w-full bg-gray-700 p-3 rounded-lg" required>
                    <option value="">Select a variant...</option>
                    {saleVariants.map(v => <option key={v.id} value={v.id}>{v.name} (Stock: {v.stock})</option>)}
                </select>
                )}
                <input type="number" placeholder="Quantity" min="1" value={sale.quantity} onChange={e => setSale({...sale, quantity: parseInt(e.target.value)})} className="w-full bg-gray-700 p-3 rounded-lg" required />
                <button type="submit" disabled={!sale.itemId || !sale.variantId} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-600">Record Sale</button>
            </form>
        </div>
      </div>
      {stockModalInfo && (
          <LogStockModal
              item={stockModalInfo.item}
              variant={stockModalInfo.variant}
              onClose={() => setStockModalInfo(null)}
              onLog={handleLogStockPurchase}
          />
      )}
    </div>
  );
};
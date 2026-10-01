import React, { useMemo, useState } from 'react';
import type { MerchItem, MerchVariant, Transaction, User, MemberTransaction } from '../types';
import { TransactionType, MemberTransactionType } from '../types';

const productKeywords = ['shirt', 't-shirt', 'tee', 'vinyl', 'cd', 'poster', 'merch', 'hoodie', 'cap', 'sticker', 'mug', 'tape', 'bag', 'print'];

export type ParsedMerchSuggestion = {
  name: string;
  type: string;
  cost: number;
  price: number;
  stock: number;
};

export type ParsedTransactionSuggestion = {
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
};

export type ParsedMemberTransactionSuggestion = {
  memberId: string;
  type: MemberTransactionType;
  amount: number;
  description: string;
  date: string;
};

export type ParsedImportSummary = {
  cashOnHand: number;
  merch: ParsedMerchSuggestion[];
  transactions: ParsedTransactionSuggestion[];
  memberTransactions: ParsedMemberTransactionSuggestion[];
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const canonicalMerchName = (value: string): string => {
  const cleaned = value
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const aliases: Record<string, string> = {
    'vinyl': 'Vinyl',
    'vinyl lathe cut': 'Vinyl',
    'lathe cut': 'Vinyl',
    'lathe-cut': 'Vinyl',
    't shirt': 'T-Shirt',
    't-shirt': 'T-Shirt',
    'tee': 'T-Shirt',
    'shirt': 'T-Shirt',
    'shirt(s)': 'T-Shirt',
    'print': 'Print',
    'poster': 'Print',
    'prints': 'Print',
    'tape': 'Tape',
    'cassette': 'Tape',
    'bag': 'Bag',
    'hoodie': 'Hoodie',
    'hoodies': 'Hoodie',
  };

  if (aliases[cleaned]) return aliases[cleaned];

  const normalized = cleaned.replace(/s$/, '');
  return normalized
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const merchPriceDefaults: Record<string, number> = {
  Vinyl: 30,
  'T-Shirt': 15,
  Tape: 10,
  Bag: 10,
  Print: 20,
};

const moneyFromText = (value: string): number => {
  const cleaned = value
    .replace(/[$€£]/g, '')
    .replace(/,/g, '.')
    .trim();

  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return 0;

  return Number(match[0]);
};

const cleanLabel = (value: string): string => {
  return value
    .replace(/^(?:merch|item|produto|produto:|item:|product:|merchandise:)/i, '')
    .replace(/\s*[:|-]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const extractMappedPrices = (rawText: string): Record<string, number> => {
  const result: Record<string, number> = {};
  const names = Object.keys(merchPriceDefaults);

  for (const name of names) {
    const pattern = new RegExp(`\\b${escapeRegExp(name)}\\b[^\\d\\n]*([€$£]?\\s*\\d+(?:[.,]\\d{1,2})?)`, 'i');
    const match = rawText.match(pattern);
    if (match) {
      result[name] = moneyFromText(match[1] || match[0]);
    }
  }

  const quantityPattern = /(?:(\d+)\s*[×x]\s*([A-Za-z][A-Za-z\s-]+?))\s*(?:\((?:€|£|\$)?\s*(\d+(?:[.,]\d{1,2})?)\)|(?:=|for|@)\s*(?:€|£|\$)?\s*(\d+(?:[.,]\d{1,2})?))/gi;
  let quantityMatch: RegExpExecArray | null;

  while ((quantityMatch = quantityPattern.exec(rawText)) !== null) {
    const rawItemName = quantityMatch[2];
    const itemName = canonicalMerchName(rawItemName);
    const priceCandidate = quantityMatch[3] || quantityMatch[4];

    if (itemName && priceCandidate) {
      result[itemName] = moneyFromText(priceCandidate);
    }
  }

  return result;
};

const inferMerchType = (name: string): string => {
  const normalized = name.toLowerCase();
  if (normalized.includes('vinyl')) return 'Vinyl';
  if (normalized.includes('t-shirt') || normalized.includes('shirt') || normalized.includes('tee')) return 'T-Shirt';
  if (normalized.includes('tape') || normalized.includes('cassette')) return 'Tape';
  if (normalized.includes('bag')) return 'Bag';
  if (normalized.includes('print') || normalized.includes('poster')) return 'Print';
  return 'Other';
};

export const parseCompactImport = (rawText: string, users: User[] = [], merchCatalog: string[] = []): ParsedImportSummary => {
  const lines = rawText
    .replace(/\r/g, '')
    .split(/\n|;|\./)
    .map(line => line.trim())
    .filter(Boolean);

  const merch: ParsedMerchSuggestion[] = [];
  const transactions: ParsedTransactionSuggestion[] = [];
  const memberTransactions: ParsedMemberTransactionSuggestion[] = [];
  let cashOnHand = 0;

  const resolveMerchCatalogName = (text: string): string => {
    const normalizedText = text.toLowerCase();
    const match = merchCatalog.find((catalogName) => normalizedText.includes(catalogName.toLowerCase()));
    return match || '';
  };

  const resolveMemberId = (text: string): string | null => {
    const normalizedText = text.toLowerCase();
    const match = users.find(user => normalizedText.includes(user.name.toLowerCase()));
    return match ? match.id : null;
  };

  const maybeAddMemberTransaction = (line: string) => {
    const amount = moneyFromText(line);
    if (!amount || amount <= 0) return;

    const isContribution = /(invested|investment|paid|pagou|gastou|covered|cobriu|contributed|contribuiu|cash paid|put in|apoiou|financiou)/i.test(line);
    const isWithdrawal = /(withdraw|retirou|took cash|cash out|remove|saque|tirou|debitou)/i.test(line);

    if (!isContribution && !isWithdrawal) return;

    const memberId = resolveMemberId(line);
    if (!memberId) return;

    memberTransactions.push({
      memberId,
      type: isContribution ? MemberTransactionType.Contribution : MemberTransactionType.Withdrawal,
      amount,
      description: cleanLabel(line.replace(/^(?:member|user|membro|integrante)\s*:*/i, '')) || 'Member funding update',
      date: new Date().toISOString().slice(0, 10),
    });
  };

  const upsertMerch = (item: ParsedMerchSuggestion) => {
    const normalizedName = canonicalMerchName(item.name);
    const existing = merch.find(entry => canonicalMerchName(entry.name) === normalizedName);
    if (existing) {
      existing.type = item.type || existing.type;
      existing.cost = item.cost || existing.cost;
      existing.price = item.price || existing.price;
      existing.stock = Math.max(existing.stock, item.stock);
      return;
    }

    merch.push({ ...item, name: normalizedName });
  };

  const mappedPrices = extractMappedPrices(rawText);

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (/(cash on hand|caixa|dinheiro em caixa|starting cash|saldo inicial|cash available)/i.test(line)) {
      const priceMatch = line.match(/(?:€|\$|£)?\s*-?\d+(?:[.,]\d{1,2})/g);
      cashOnHand = priceMatch ? Number((priceMatch[priceMatch.length - 1] || '0').replace(/[$€£,]/g, '')) : cashOnHand;
      continue;
    }

    if (/(sold|vendeu|vendido|sale|venta|sales|received|revenue|cash revenue)/i.test(line)) {
      const amount = moneyFromText(line);
      const itemMatch = line.match(/(?:\b(?:\d+)\s*[×x]\s*)?([A-Za-z][A-Za-z\s-]+?)(?:\s*\((?:€|£|\$)\s*\d+(?:[.,]\d{1,2})?\)|\s*(?:for|@|=)\s*(?:€|£|\$)?\s*\d+(?:[.,]\d{1,2})?)/i);
      const itemName = itemMatch ? canonicalMerchName(itemMatch[1]) : 'Merch sale';
      if (amount > 0) {
        transactions.push({
          description: `Merch sale: ${itemName}`,
          amount,
          type: TransactionType.Income,
          category: 'Merch',
          date: new Date().toISOString().slice(0, 10),
        });
      }
      continue;
    }

    if (/(bought|comprou|purchase|stock|custo|cost|paid|gasto|expenses)/i.test(line)) {
      const amount = moneyFromText(line);
      const itemMatch = line.match(/(?:\b(?:\d+)\s*[×x]\s*)?([A-Za-z][A-Za-z\s-]+?)(?:\s*\((?:€|£|\$)\s*\d+(?:[.,]\d{1,2})?\)|\s*(?:for|@|=)\s*(?:€|£|\$)?\s*\d+(?:[.,]\d{1,2})?)/i);
      const itemName = itemMatch ? canonicalMerchName(itemMatch[1]) : 'Merch purchase';
      if (amount > 0) {
        transactions.push({
          description: `Merch purchase: ${itemName}`,
          amount,
          type: TransactionType.Expense,
          category: 'Merch',
          date: new Date().toISOString().slice(0, 10),
        });
      }
      continue;
    }

    if (/(invested|paid|received|send|sent|refunded|returned|spent|cover|paid to|received from)/i.test(line)) {
      maybeAddMemberTransaction(line);
    }

    const hasProductKeyword = productKeywords.some(keyword => lower.includes(keyword));
    if (!hasProductKeyword) continue;

    const productPattern = /(?:(?:\b\d+\s*[×x]\s*)?([A-Za-z][A-Za-z\s-]+?))(?:\s*\((?:€|£|\$)\s*(\d+(?:[.,]\d{1,2})?)\)|\s*(?:@|=|for|price|priced)\s*(?:€|£|\$)?\s*(\d+(?:[.,]\d{1,2})?)|\s*(?:€|£|\$)\s*(\d+(?:[.,]\d{1,2})?))/i;
    const directMatch = productPattern.exec(line);
    const quantityMatch = line.match(/(\d+)\s*[×x]\s*([A-Za-z][A-Za-z\s-]+?)/i);

    if (directMatch) {
      const catalogName = resolveMerchCatalogName(directMatch[1].trim());
      const itemName = canonicalMerchName(catalogName || directMatch[1].trim());
      const priceCandidate = directMatch[2] || directMatch[3] || directMatch[4];
      const unitPrice = priceCandidate ? moneyFromText(priceCandidate) : mappedPrices[itemName] || merchPriceDefaults[itemName] || 0;
      const quantity = quantityMatch ? Number(quantityMatch[1]) : 0;

      if (itemName && unitPrice > 0) {
        upsertMerch({
          name: itemName,
          type: inferMerchType(itemName),
          cost: Math.max(0, unitPrice * 0.5),
          price: unitPrice,
          stock: quantity || 0,
        });
      }
    }

    const listPriceKey = Object.keys(merchPriceDefaults).find(key => lower.includes(key.toLowerCase()));
    if (listPriceKey && !directMatch) {
      const unitPrice = mappedPrices[listPriceKey] || merchPriceDefaults[listPriceKey];
      if (unitPrice) {
        upsertMerch({
          name: canonicalMerchName(listPriceKey),
          type: inferMerchType(listPriceKey),
          cost: Math.max(0, unitPrice * 0.5),
          price: unitPrice,
          stock: 0,
        });
      }
    }
  }

  return { cashOnHand, merch, transactions, memberTransactions };
};

const formatMoney = (value: number) => `€${value.toFixed(2)}`;

interface FinanceMerchImportAssistantProps {
  activeBandId: string;
  merch: MerchItem[];
  setMerch: React.Dispatch<React.SetStateAction<MerchItem[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  memberTransactions?: MemberTransaction[];
  setMemberTransactions?: React.Dispatch<React.SetStateAction<MemberTransaction[]>>;
  users?: User[];
  cashOnHand: number;
  setCashOnHand: (value: number) => void;
}

export const FinanceMerchImportAssistant: React.FC<FinanceMerchImportAssistantProps> = ({
  activeBandId,
  merch,
  setMerch,
  transactions,
  setTransactions,
  memberTransactions,
  setMemberTransactions,
  users = [],
  cashOnHand,
  setCashOnHand,
}) => {
  const [importText, setImportText] = useState('');
  const [parsed, setParsed] = useState<ParsedImportSummary | null>(null);
  const [merchDraft, setMerchDraft] = useState<ParsedMerchSuggestion[]>([]);
  const [transactionsDraft, setTransactionsDraft] = useState<ParsedTransactionSuggestion[]>([]);
  const merchCatalogNames = useMemo(() => merch.map((item) => item.name).filter(Boolean), [merch]);

  const parsedCount = useMemo(() => {
    if (!parsed) return 0;
    return parsed.merch.length + parsed.transactions.length;
  }, [parsed]);

  const parseCurrentText = () => {
    const next = parseCompactImport(importText, users, merchCatalogNames);
    setParsed(next);
    setMerchDraft(next.merch);
    setTransactionsDraft(next.transactions);
  };

  const updateMerchDraft = (index: number, field: keyof ParsedMerchSuggestion, value: string | number) => {
    setMerchDraft(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  const updateTransactionDraft = (index: number, field: keyof ParsedTransactionSuggestion, value: string | number) => {
    setTransactionsDraft(prev => prev.map((tx, txIndex) => txIndex === index ? { ...tx, [field]: value } : tx));
  };

  const applyImport = () => {
    if (!parsed) return;

    const nextMerchItems = merchDraft.map((item) => ({
      id: `ai-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      name: canonicalMerchName(item.name.trim() || 'Custom merch item'),
      type: item.type || inferMerchType(item.name),
      cost: Number(item.cost) || 0,
      price: Number(item.price) || 0,
      bandId: activeBandId,
      variants: {
        Size: [
          { id: `v-${Date.now()}-s`, name: 'Default', stock: Number(item.stock) || 0 },
        ],
      } as { [key: string]: MerchVariant[] },
    }));

    const mergedItems = [...merch];
    nextMerchItems.forEach((candidate) => {
      const matchIndex = mergedItems.findIndex((existing) => canonicalMerchName(existing.name) === canonicalMerchName(candidate.name));

      if (matchIndex >= 0) {
        const existing = mergedItems[matchIndex];
        mergedItems[matchIndex] = {
          ...existing,
          name: canonicalMerchName(candidate.name),
          type: candidate.type || existing.type,
          cost: candidate.cost > 0 ? candidate.cost : existing.cost,
          price: candidate.price > 0 ? candidate.price : existing.price,
          variants: {
            ...existing.variants,
            Size: [
              {
                id: existing.variants?.Size?.[0]?.id || `v-${Date.now()}-s`,
                name: existing.variants?.Size?.[0]?.name || 'Default',
                stock: Math.max(existing.variants?.Size?.[0]?.stock || 0, Number(candidate.variants?.Size?.[0]?.stock || 0)),
              },
            ],
          },
        };
        return;
      }

      mergedItems.push(candidate);
    });

    setMerch(mergedItems);

    const newTransactions = transactionsDraft.map((tx) => ({
      id: `ai-tx-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      description: tx.description,
      amount: Number(tx.amount) || 0,
      type: tx.type,
      category: tx.category,
      date: tx.date || new Date().toISOString().slice(0, 10),
      bandId: activeBandId,
    } as Transaction));

    const newMemberTransactions = parsed.memberTransactions.map((tx) => ({
      id: `ai-member-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      memberId: tx.memberId,
      type: tx.type,
      amount: Number(tx.amount) || 0,
      description: tx.description,
      date: tx.date || new Date().toISOString().slice(0, 10),
      bandId: activeBandId,
    } as MemberTransaction));

    setTransactions(prev => [...prev, ...newTransactions]);
    if (setMemberTransactions) {
      setMemberTransactions(prev => [...prev, ...newMemberTransactions]);
    }

    if (parsed.cashOnHand > 0 || cashOnHand !== parsed.cashOnHand) {
      setCashOnHand(parsed.cashOnHand);
    }

    setParsed(null);
    setImportText('');
    setMerchDraft([]);
    setTransactionsDraft([]);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 mb-8 shadow-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">AI merch + finance import</h2>
          <p className="text-sm text-gray-400">Paste notes, sales, costs, and starting cash. We extract the logic and ask for confirmation before updating the system.</p>
        </div>
        <span className="text-xs uppercase tracking-[0.2em] text-purple-300">Low-token flow</span>
      </div>

      <div className="space-y-4">
        {merchCatalogNames.length === 0 && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-100">
            Add the band’s actual merch items first so the extraction can match the real names, prices, and stock more accurately.
          </div>
        )}

        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Ex.: Cash on hand $4200. T-shirt: price $28, cost $9, stock 40. Sold 3 tees for $84. Bought 20 vinyls for $320."
          rows={6}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white resize-none"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={parseCurrentText}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg"
          >
            Extract logic
          </button>
          <button
            type="button"
            onClick={() => {
              setParsed(null);
              setImportText('');
              setMerchDraft([]);
              setTransactionsDraft([]);
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Clear
          </button>
        </div>
      </div>

      {parsed && (
        <div className="mt-6 space-y-6">
          <div className="rounded-lg border border-green-500/40 bg-green-500/5 p-4">
            <p className="text-sm text-green-200">Detected:</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-200">
              <span>{parsed.merch.length} item(s)</span>
              <span>{parsed.transactions.length} transaction(s)</span>
              <span>Cash on hand: {formatMoney(parsed.cashOnHand)}</span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs text-gray-300">
            <span className="font-semibold text-white">Edit fields before saving:</span> Item name, Type, Cost, Price, Stock; transaction description, Type, Amount, Date.
          </div>

          {merchDraft.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3">Review merch items</h3>
              <div className="space-y-3">
                {merchDraft.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-gray-900 rounded-lg p-3">
                    <label className="text-xs text-gray-400 uppercase tracking-[0.2em]">
                      Name
                      <input
                        value={item.name}
                        onChange={(e) => updateMerchDraft(index, 'name', e.target.value)}
                        className="mt-1 bg-gray-800 rounded px-3 py-2 w-full"
                        placeholder="Name"
                      />
                    </label>
                    <label className="text-xs text-gray-400 uppercase tracking-[0.2em]">
                      Type
                      <input
                        value={item.type}
                        onChange={(e) => updateMerchDraft(index, 'type', e.target.value)}
                        className="mt-1 bg-gray-800 rounded px-3 py-2 w-full"
                        placeholder="Type"
                      />
                    </label>
                    <label className="text-xs text-gray-400 uppercase tracking-[0.2em]">
                      Cost
                      <input
                        type="number"
                        value={item.cost}
                        onChange={(e) => updateMerchDraft(index, 'cost', Number(e.target.value || 0))}
                        className="mt-1 bg-gray-800 rounded px-3 py-2 w-full"
                        placeholder="Cost"
                      />
                    </label>
                    <label className="text-xs text-gray-400 uppercase tracking-[0.2em]">
                      Price
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateMerchDraft(index, 'price', Number(e.target.value || 0))}
                        className="mt-1 bg-gray-800 rounded px-3 py-2 w-full"
                        placeholder="Price"
                      />
                    </label>
                    <label className="text-xs text-gray-400 uppercase tracking-[0.2em]">
                      Stock
                      <input
                        type="number"
                        value={item.stock}
                        onChange={(e) => updateMerchDraft(index, 'stock', Number(e.target.value || 0))}
                        className="mt-1 bg-gray-800 rounded px-3 py-2 w-full"
                        placeholder="Stock"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {transactionsDraft.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3">Review transactions</h3>
              <div className="space-y-3">
                {transactionsDraft.map((tx, index) => (
                  <div key={`${tx.description}-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-900 rounded-lg p-3">
                    <label className="text-xs text-gray-400 uppercase tracking-[0.2em]">
                      Description
                      <input
                        value={tx.description}
                        onChange={(e) => updateTransactionDraft(index, 'description', e.target.value)}
                        className="mt-1 bg-gray-800 rounded px-3 py-2 w-full"
                      />
                    </label>
                    <label className="text-xs text-gray-400 uppercase tracking-[0.2em]">
                      Type
                      <select
                        value={tx.type}
                        onChange={(e) => updateTransactionDraft(index, 'type', e.target.value as TransactionType)}
                        className="mt-1 bg-gray-800 rounded px-3 py-2 w-full"
                      >
                        <option value={TransactionType.Income}>Income</option>
                        <option value={TransactionType.Expense}>Expense</option>
                      </select>
                    </label>
                    <label className="text-xs text-gray-400 uppercase tracking-[0.2em]">
                      Amount
                      <input
                        type="number"
                        value={tx.amount}
                        onChange={(e) => updateTransactionDraft(index, 'amount', Number(e.target.value || 0))}
                        className="mt-1 bg-gray-800 rounded px-3 py-2 w-full"
                      />
                    </label>
                    <label className="text-xs text-gray-400 uppercase tracking-[0.2em]">
                      Date
                      <input
                        type="date"
                        value={tx.date}
                        onChange={(e) => updateTransactionDraft(index, 'date', e.target.value)}
                        className="mt-1 bg-gray-800 rounded px-3 py-2 w-full"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={applyImport}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg"
            >
              Confirm and update
            </button>
          </div>
        </div>
      )}

      {!parsed && parsedCount === 0 && (
        <p className="mt-4 text-sm text-gray-500">Paste a short note with merch, sales, purchases, and starting cash.</p>
      )}
    </div>
  );
};

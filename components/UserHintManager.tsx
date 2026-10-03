import React, { useMemo, useState } from 'react';
import type { BandProfile, User } from '../types';
import { getUserScopedItem, setUserScopedItem } from '../state/userStorageScope';

export type UserHintContext = {
  page: string;
  bands: BandProfile[];
  isEmptyBand: boolean;
  merchCount: number;
  cashOnHand: number;
  hasTransactions: boolean;
  user: User | null;
};

const storageKeyForUser = (userId: string) => `bandmate_user_hints_${userId}`;

type HintPreference = { hidden: boolean };

const hintDefinitions = [
  {
    id: 'first-band',
    title: 'Start with the band',
    body: 'Create the band and fill in the key details before moving into releases, shows, and merch.',
    show: ({ bands, user }: UserHintContext) => !!user && bands.length === 0,
  },
  {
    id: 'cash-on-hand',
    title: 'Starting cash',
    body: 'In Financials, enter the cash available at the start so the system keeps an accurate running balance.',
    show: ({ page, cashOnHand, user }: UserHintContext) => !!user && page === 'financials' && cashOnHand === 0,
  },
  {
    id: 'merch-import',
    title: 'Merch and finance work together',
    body: 'You can paste sales, costs, stock, and cash notes into one text block and the system will organize it for you.',
    show: ({ page, merchCount, user }: UserHintContext) => !!user && page === 'merch' && merchCount === 0,
  },
  {
    id: 'transaction-flow',
    title: 'Log expenses without friction',
    body: 'If someone paid for something or invested in the band, describe it in a sentence and the system will help sort the amount and member.',
    show: ({ page, hasTransactions, user }: UserHintContext) => !!user && page === 'financials' && !hasTransactions,
  },
  {
    id: 'member-balance',
    title: 'Member balances',
    body: 'The system also tracks who invested, who received funds, and who owes the band so things stay balanced at the end.',
    show: ({ page, user }: UserHintContext) => !!user && page === 'financials',
  },
];

export const UserHintManager: React.FC<{
  user: User | null;
  page: string;
  bands: BandProfile[];
  merchCount: number;
  cashOnHand: number;
  hasTransactions: boolean;
}> = ({ user, page, bands, merchCount, cashOnHand, hasTransactions }) => {
  const [hiddenHints, setHiddenHints] = useState<Record<string, HintPreference>>(() => {
    if (!user) return {};
    try {
      const raw = getUserScopedItem(storageKeyForUser(user.id));
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const activeHint = useMemo(() => {
    if (!user) return null;
    return hintDefinitions.find(hint => {
      const isHidden = hiddenHints[hint.id]?.hidden;
      return !isHidden && hint.show({ page, bands, isEmptyBand: bands.length === 0, merchCount, cashOnHand, hasTransactions, user });
    }) || null;
  }, [user, page, bands, merchCount, cashOnHand, hasTransactions, hiddenHints]);

  const markHidden = (id: string) => {
    if (!user) return;
    const next = { ...hiddenHints, [id]: { hidden: true } };
    setHiddenHints(next);
    setUserScopedItem(storageKeyForUser(user.id), JSON.stringify(next));
  };

  if (!activeHint) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-[90vw]">
      <div className="bg-brand-bg-card border border-brand-border rounded-xl shadow-2xl p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-brand-accent">Hint</p>
            <h3 className="text-lg font-bold mt-1">{activeHint.title}</h3>
          </div>
          <button
            onClick={() => markHidden(activeHint.id)}
            className="text-gray-400 hover:text-white text-sm"
            aria-label="Close hint"
          >
            ×
          </button>
        </div>

        <p className="mt-3 text-sm text-gray-300 leading-relaxed">{activeHint.body}</p>

        <div className="mt-4 flex justify-between items-center gap-3">
          <button
            type="button"
            onClick={() => markHidden(activeHint.id)}
            className="text-xs text-gray-400 hover:text-white"
          >
            Don’t show again
          </button>
          <button
            type="button"
            onClick={() => markHidden(activeHint.id)}
            className="bg-brand-accent hover:bg-brand-accent-dark text-white font-semibold px-3 py-2 rounded-lg text-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

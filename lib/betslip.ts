'use client';

export interface BetSelection {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  leagueName: string;
  selection: 'home' | 'draw' | 'away'; // 1, X, 2
  odd: number;
  timestamp: number;
}

const STORAGE_KEY = 'tipico_betslip';

export const getBetslip = (): BetSelection[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveBetslip = (bets: BetSelection[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
  window.dispatchEvent(new CustomEvent('betslip-updated', { detail: bets }));
};

export const toggleBet = (bet: BetSelection) => {
  const current = getBetslip();
  const existingIndex = current.findIndex(b => b.matchId === bet.matchId);

  let isAdding = false;

  if (existingIndex > -1) {
    const existing = current[existingIndex];
    // If clicking same selection, remove it. If clicking different selection, update it.
    if (existing.selection === bet.selection) {
      current.splice(existingIndex, 1);
    } else {
      current[existingIndex] = bet;
      isAdding = true;
    }
  } else {
    current.push(bet);
    isAdding = true;
  }

  saveBetslip(current);

  if (isAdding && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-betslip'));
  }
};

export const removeBet = (matchId: number) => {
  const current = getBetslip();
  const filtered = current.filter(b => b.matchId !== matchId);
  saveBetslip(filtered);
};

export const clearBetslip = () => {
  saveBetslip([]);
};

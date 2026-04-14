import { useCallback } from 'react';
import type { BattleResult } from '@/lib/battleEngine';
import type { LeaderboardEntry } from '@/components/Leaderboard';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const DEFAULT_ELO = 1200;
const K_FACTOR = 32;

function calculateEloChange(winnerElo: number, loserElo: number): { winnerDelta: number; loserDelta: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 - expectedWinner;
  return {
    winnerDelta: Math.round(K_FACTOR * (1 - expectedWinner)),
    loserDelta: Math.round(K_FACTOR * (0 - expectedLoser)),
  };
}

export function useLeaderboard() {
  const [entries, setEntries] = useLocalStorage<Record<string, LeaderboardEntry>>('relay-arena-leaderboard', {});

  const recordBattle = useCallback((result: BattleResult) => {
    setEntries((prev) => {
      const next = { ...prev };

      // Ensure both fighters exist
      for (const fighter of result.fighters) {
        if (!next[fighter.url]) {
          next[fighter.url] = {
            url: fighter.url,
            name: fighter.name,
            wins: 0,
            losses: 0,
            draws: 0,
            elo: DEFAULT_ELO,
            streak: 0,
          };
        }
      }

      if (result.winner) {
        const loserUrl = result.fighters.find(f => f.url !== result.winner)?.url;
        if (!loserUrl) return next;

        const winner = next[result.winner];
        const loser = next[loserUrl];

        const { winnerDelta, loserDelta } = calculateEloChange(winner.elo, loser.elo);

        winner.wins += 1;
        winner.elo += winnerDelta;
        winner.streak = winner.streak > 0 ? winner.streak + 1 : 1;

        loser.losses += 1;
        loser.elo = Math.max(800, loser.elo + loserDelta);
        loser.streak = loser.streak < 0 ? loser.streak - 1 : -1;
      } else {
        // Draw
        for (const fighter of result.fighters) {
          next[fighter.url].draws += 1;
          next[fighter.url].streak = 0;
        }
      }

      return next;
    });
  }, [setEntries]);

  const leaderboard = Object.values(entries).sort((a, b) => b.elo - a.elo);

  const resetLeaderboard = useCallback(() => {
    setEntries({});
  }, [setEntries]);

  return {
    leaderboard,
    recordBattle,
    resetLeaderboard,
  };
}

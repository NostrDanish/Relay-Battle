import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { BattleResult } from '@/lib/battleEngine';

/**
 * Hook for publishing battle results as signed Nostr events (kind 3633).
 * Results are verifiable on-chain and can be audited by anyone.
 */
export function useBattlePublish() {
  const { user } = useCurrentUser();
  const { mutateAsync: createEvent, isPending } = useNostrPublish();

  const publishBattle = async (result: BattleResult) => {
    if (!user) {
      throw new Error('Must be logged in to publish battle results');
    }

    const fighterA = result.fighters[0];
    const fighterB = result.fighters[1];
    const winnerName = result.winner
      ? result.fighters.find(f => f.url === result.winner)?.name || 'Unknown'
      : 'Draw';
    const loserName = result.winner
      ? result.fighters.find(f => f.url !== result.winner)?.name || 'Unknown'
      : 'Draw';

    const tags = [
      ['d', result.battleId],
      ['alt', `Relay Arena battle result: ${fighterA?.name} vs ${fighterB?.name} — Winner: ${winnerName}`],
      ['t', 'relay-arena'],
      ['t', 'battle'],
    ];

    if (fighterA) tags.push(['r', fighterA.url]);
    if (fighterB) tags.push(['r', fighterB.url]);
    if (result.winner) tags.push(['winner', result.winner]);
    tags.push(['format', result.format]);
    tags.push(['ticks', String(result.totalTicks)]);

    const content = JSON.stringify({
      battleId: result.battleId,
      format: result.format,
      startedAt: result.startedAt,
      endedAt: result.endedAt,
      fighters: result.fighters,
      winner: result.winner,
      totalTicks: result.totalTicks,
      // Omit full log for space, include summary
      summary: {
        fighterA: fighterA?.name,
        fighterB: fighterB?.name,
        winnerName,
        loserName,
        logEntries: result.log.length,
      },
    });

    return createEvent({
      kind: 3633,
      content,
      tags,
      created_at: Math.floor(Date.now() / 1000),
    });
  };

  return {
    publishBattle,
    isPending,
    canPublish: !!user,
  };
}

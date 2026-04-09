import { cn } from '@/lib/utils';
import type { BattleResult } from '@/lib/battleEngine';
import { generatePortrait } from '@/lib/relayPortrait';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Swords, RotateCcw, Clock, Trophy, Skull } from 'lucide-react';

interface BattleHistoryProps {
  battles: BattleResult[];
  onRewatch: (battle: BattleResult) => void;
}

export function BattleHistory({ battles, onRewatch }: BattleHistoryProps) {
  if (battles.length === 0) {
    return (
      <Card className="border-dashed bg-card/40">
        <CardContent className="py-12 px-8 text-center">
          <div className="max-w-sm mx-auto space-y-4">
            <Swords className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">
              No battles fought yet. Head to the Arena and start a fight!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Recent battles ({battles.length} total). Results stored locally.
      </p>
      {battles.map((battle, i) => {
        const fighterA = battle.fighters[0];
        const fighterB = battle.fighters[1];
        if (!fighterA || !fighterB) return null;

        const portraitA = generatePortrait(fighterA.url);
        const portraitB = generatePortrait(fighterB.url);
        const winnerIsA = battle.winner === fighterA.url;
        const winnerIsB = battle.winner === fighterB.url;
        const isDraw = !battle.winner;

        const date = new Date(battle.startedAt * 1000);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

        return (
          <Card key={`${battle.battleId}-${i}`} className="bg-card/60 hover:bg-card/80 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Fighter A */}
                <div className={cn('flex items-center gap-2 flex-1 min-w-0', winnerIsA && 'opacity-100', !winnerIsA && !isDraw && 'opacity-60')}>
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-sm shrink-0"
                    style={{ background: portraitA.gradient }}
                  >
                    {portraitA.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      {winnerIsA && <Trophy className="w-3 h-3 text-arena-gold shrink-0" />}
                      {!winnerIsA && !isDraw && <Skull className="w-3 h-3 text-muted-foreground shrink-0" />}
                      <span className="text-sm font-semibold truncate">{fighterA.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {fighterA.finalHp}/{fighterA.stats.maxHp} HP
                    </span>
                  </div>
                </div>

                {/* VS / Result */}
                <div className="flex flex-col items-center shrink-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-pixel',
                      isDraw ? 'border-muted-foreground/40 text-muted-foreground' : 'border-arena-gold/40 text-arena-gold'
                    )}
                  >
                    {isDraw ? 'DRAW' : 'VS'}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{battle.totalTicks}T</span>
                </div>

                {/* Fighter B */}
                <div className={cn('flex items-center gap-2 flex-1 min-w-0 justify-end', winnerIsB && 'opacity-100', !winnerIsB && !isDraw && 'opacity-60')}>
                  <div className="min-w-0 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-sm font-semibold truncate">{fighterB.name}</span>
                      {winnerIsB && <Trophy className="w-3 h-3 text-arena-gold shrink-0" />}
                      {!winnerIsB && !isDraw && <Skull className="w-3 h-3 text-muted-foreground shrink-0" />}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {fighterB.finalHp}/{fighterB.stats.maxHp} HP
                    </span>
                  </div>
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-sm shrink-0"
                    style={{ background: portraitB.gradient }}
                  >
                    {portraitB.emoji}
                  </div>
                </div>

                {/* Time & Replay */}
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {timeStr}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRewatch(battle)}
                    className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Rematch
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

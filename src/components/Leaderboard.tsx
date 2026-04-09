import { cn } from '@/lib/utils';
import { generatePortrait, getCountryFlag } from '@/lib/relayPortrait';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface LeaderboardEntry {
  url: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  elo: number;
  countryCode?: string;
  streak: number; // positive = win streak, negative = loss streak
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  className?: string;
}

export function Leaderboard({ entries, className }: LeaderboardProps) {
  const sorted = [...entries].sort((a, b) => b.elo - a.elo);

  return (
    <div className={cn('rounded-xl border bg-card/60 backdrop-blur-sm overflow-hidden', className)}>
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-arena-gold" />
        <h3 className="font-pixel text-xs text-arena-gold">LEADERBOARD</h3>
        <Badge variant="outline" className="ml-auto text-[10px] border-muted-foreground/30">
          {entries.length} fighters
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-muted-foreground/10">
              <TableHead className="w-12 text-center text-xs">#</TableHead>
              <TableHead className="text-xs">Relay</TableHead>
              <TableHead className="text-xs text-center">W</TableHead>
              <TableHead className="text-xs text-center">L</TableHead>
              <TableHead className="text-xs text-center">D</TableHead>
              <TableHead className="text-xs text-center">ELO</TableHead>
              <TableHead className="text-xs text-center">Streak</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((entry, i) => {
              const portrait = generatePortrait(entry.url);
              const rank = i + 1;
              const total = entry.wins + entry.losses + entry.draws;
              const winRate = total > 0 ? Math.round((entry.wins / total) * 100) : 0;

              return (
                <TableRow
                  key={entry.url}
                  className={cn(
                    'border-muted-foreground/5 hover:bg-muted/20 transition-colors',
                    rank <= 3 && 'bg-arena-gold/5',
                  )}
                >
                  <TableCell className="text-center">
                    {rank === 1 ? (
                      <Trophy className="w-5 h-5 text-yellow-400 mx-auto" />
                    ) : rank === 2 ? (
                      <Medal className="w-5 h-5 text-gray-400 mx-auto" />
                    ) : rank === 3 ? (
                      <Award className="w-5 h-5 text-amber-600 mx-auto" />
                    ) : (
                      <span className="text-xs text-muted-foreground font-mono">{rank}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center text-sm shrink-0"
                        style={{ background: portrait.gradient }}
                      >
                        {portrait.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate max-w-[150px]">{entry.name}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">{winRate}% WR</span>
                          <span className="text-xs">{getCountryFlag(entry.countryCode)}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm text-arena-green font-bold">
                    {entry.wins}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm text-arena-red font-bold">
                    {entry.losses}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm text-muted-foreground">
                    {entry.draws}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-sm font-bold text-arena-gold">{entry.elo}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <StreakBadge streak={entry.streak} />
                  </TableCell>
                </TableRow>
              );
            })}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                  No battles fought yet. Start a fight to see rankings!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak > 0) {
    return (
      <Badge variant="outline" className="border-arena-green/40 text-arena-green text-[10px] gap-0.5">
        <TrendingUp className="w-3 h-3" />
        {streak}W
      </Badge>
    );
  }
  if (streak < 0) {
    return (
      <Badge variant="outline" className="border-arena-red/40 text-arena-red text-[10px] gap-0.5">
        <TrendingDown className="w-3 h-3" />
        {Math.abs(streak)}L
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-[10px] gap-0.5">
      <Minus className="w-3 h-3" />
    </Badge>
  );
}

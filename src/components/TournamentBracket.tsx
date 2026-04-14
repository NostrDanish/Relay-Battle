import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { RelayStats, BattleResult } from '@/lib/battleEngine';
import { simulateBattle } from '@/lib/battleEngine';
import { generatePortrait } from '@/lib/relayPortrait';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Play, RotateCcw, Zap } from 'lucide-react';

interface TournamentBracketProps {
  relays: RelayStats[];
  onBattleComplete?: (result: BattleResult) => void;
  onWatchBattle?: (a: RelayStats, b: RelayStats) => void;
}

interface TournamentMatch {
  round: number;
  matchIndex: number;
  fighterA: RelayStats | null;
  fighterB: RelayStats | null;
  winner: RelayStats | null;
  result: BattleResult | null;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function TournamentBracket({ relays, onBattleComplete, onWatchBattle }: TournamentBracketProps) {
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(-1);
  const [champion, setChampion] = useState<RelayStats | null>(null);
  const [size, setSize] = useState(8);

  const initTournament = useCallback(() => {
    // Pick N relays
    const n = Math.min(size, relays.length);
    const shuffled = shuffleArray(relays).slice(0, n);
    
    // Pad to power of 2
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
    
    const initialMatches: TournamentMatch[] = [];
    for (let i = 0; i < bracketSize / 2; i++) {
      initialMatches.push({
        round: 0,
        matchIndex: i,
        fighterA: shuffled[i * 2] || null,
        fighterB: shuffled[i * 2 + 1] || null,
        winner: shuffled[i * 2 + 1] ? null : shuffled[i * 2],  // Bye
        result: null,
      });
    }
    
    setMatches(initialMatches);
    setCurrentMatch(-1);
    setChampion(null);
    setIsRunning(false);
  }, [relays, size]);

  const runTournament = useCallback(async () => {
    if (matches.length === 0) return;
    setIsRunning(true);
    
    // Work with a mutable copy of all matches
    const allMatches: TournamentMatch[] = matches.map(m => ({ ...m }));
    let round = 0;
    
    // Process all rounds
    while (true) {
      const roundMatches = allMatches.filter(m => m.round === round);
      if (roundMatches.length === 0) break;
      
      // Simulate each match in the round
      for (const match of roundMatches) {
        if (match.winner) continue; // Bye
        if (!match.fighterA || !match.fighterB) continue;
        
        setCurrentMatch(allMatches.indexOf(match));
        
        // Wait a bit for drama
        await new Promise(r => setTimeout(r, 400));
        
        const battleResult = simulateBattle(match.fighterA, match.fighterB);
        const winner = battleResult.winner === match.fighterA.url ? match.fighterA : match.fighterB;
        
        match.winner = winner;
        match.result = battleResult;
        onBattleComplete?.(battleResult);
        
        // Update state with fresh array
        setMatches([...allMatches]);
        
        await new Promise(r => setTimeout(r, 300));
      }
      
      // Get winners from this round
      const winners = roundMatches.map(m => m.winner).filter(Boolean) as RelayStats[];
      
      if (winners.length <= 1) {
        // Tournament over!
        setChampion(winners[0] || null);
        break;
      }
      
      // Create next round matches
      round++;
      for (let i = 0; i < Math.floor(winners.length / 2); i++) {
        allMatches.push({
          round,
          matchIndex: i,
          fighterA: winners[i * 2] || null,
          fighterB: winners[i * 2 + 1] || null,
          winner: winners[i * 2 + 1] ? null : winners[i * 2],
          result: null,
        });
      }
      
      // Handle odd number of winners — last one gets a bye
      if (winners.length % 2 === 1) {
        allMatches.push({
          round,
          matchIndex: Math.floor(winners.length / 2),
          fighterA: winners[winners.length - 1],
          fighterB: null,
          winner: winners[winners.length - 1],
          result: null,
        });
      }
      
      setMatches([...allMatches]);
    }
    
    setIsRunning(false);
    setCurrentMatch(-1);
  }, [matches, onBattleComplete]);

  const rounds = [...new Set(matches.map(m => m.round))].sort();

  return (
    <Card className="bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4 text-arena-gold" />
            <span className="font-pixel text-xs text-arena-gold">TOURNAMENT</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="text-xs bg-muted/30 border border-muted-foreground/20 rounded px-2 py-1"
              disabled={isRunning}
            >
              <option value={4}>4 Relays</option>
              <option value={8}>8 Relays</option>
              <option value={16}>16 Relays</option>
            </select>
            {matches.length === 0 ? (
              <Button size="sm" onClick={initTournament} className="text-xs">
                Generate Bracket
              </Button>
            ) : !isRunning && !champion ? (
              <Button
                size="sm"
                onClick={runTournament}
                className="text-xs bg-gradient-to-r from-arena-gold/80 to-arena-gold text-background"
              >
                <Play className="w-3 h-3 mr-1" />
                Run Tournament
              </Button>
            ) : champion ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setMatches([]); setChampion(null); }}
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                New Tournament
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Generate a bracket to start the tournament!</p>
            <p className="text-xs mt-1">{relays.length} relays available</p>
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="flex gap-8 pb-4 min-w-max">
              {rounds.map((round) => {
                const roundMatches = matches.filter(m => m.round === round);
                const roundNames = ['Round 1', 'Quarter Finals', 'Semi Finals', 'Finals', 'Grand Finals'];
                return (
                  <div key={round} className="flex flex-col gap-4 min-w-[180px]">
                    <h4 className="font-pixel text-[10px] text-muted-foreground text-center">
                      {roundNames[round] || `Round ${round + 1}`}
                    </h4>
                    {roundMatches.map((match, i) => (
                      <MatchCard
                        key={`${round}-${i}`}
                        match={match}
                        isActive={matches.indexOf(match) === currentMatch}
                        onWatch={() => {
                          if (match.fighterA && match.fighterB && onWatchBattle) {
                            onWatchBattle(match.fighterA, match.fighterB);
                          }
                        }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Champion announcement */}
            {champion && (
              <div className="text-center py-6 animate-bounce-in">
                <div className="inline-flex flex-col items-center gap-2">
                  <Trophy className="w-10 h-10 text-arena-gold animate-float" />
                  <span className="font-pixel text-sm text-arena-gold animate-text-glow">CHAMPION</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center"
                      style={{ background: generatePortrait(champion.url).gradient }}
                    >
                      {generatePortrait(champion.url).emoji}
                    </div>
                    <span className="text-lg font-bold">{champion.name}</span>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function MatchCard({
  match,
  isActive,
  onWatch,
}: {
  match: TournamentMatch;
  isActive: boolean;
  onWatch: () => void;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-2.5 space-y-1.5 transition-all',
        isActive && 'border-arena-gold/60 bg-arena-gold/5 animate-pulse-glow',
        match.winner && 'bg-muted/20',
        !match.fighterA && !match.fighterB && 'opacity-40',
      )}
    >
      <FighterSlot
        relay={match.fighterA}
        isWinner={match.winner?.url === match.fighterA?.url}
        isLoser={!!match.winner && match.winner?.url !== match.fighterA?.url}
      />
      <div className="flex items-center gap-1 px-1">
        <div className="h-px flex-1 bg-muted-foreground/20" />
        <span className="text-[9px] font-pixel text-muted-foreground">VS</span>
        <div className="h-px flex-1 bg-muted-foreground/20" />
      </div>
      <FighterSlot
        relay={match.fighterB}
        isWinner={match.winner?.url === match.fighterB?.url}
        isLoser={!!match.winner && match.winner?.url !== match.fighterB?.url}
      />
      {match.result && (
        <button
          onClick={onWatch}
          className="w-full text-[9px] text-center text-muted-foreground hover:text-foreground transition-colors"
        >
          Watch replay
        </button>
      )}
    </div>
  );
}

function FighterSlot({
  relay,
  isWinner,
  isLoser,
}: {
  relay: RelayStats | null;
  isWinner: boolean;
  isLoser: boolean;
}) {
  if (!relay) {
    return (
      <div className="flex items-center gap-2 px-1 py-0.5 opacity-30">
        <div className="w-5 h-5 rounded bg-muted" />
        <span className="text-xs text-muted-foreground">BYE</span>
      </div>
    );
  }

  const portrait = generatePortrait(relay.url);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-1 py-0.5 rounded transition-all',
        isWinner && 'bg-arena-gold/10',
        isLoser && 'opacity-40 line-through',
      )}
    >
      <div
        className="w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0"
        style={{ background: portrait.gradient }}
      >
        {portrait.emoji}
      </div>
      <span className={cn('text-xs truncate flex-1', isWinner && 'font-bold text-arena-gold')}>
        {relay.name}
      </span>
      {isWinner && <Trophy className="w-3 h-3 text-arena-gold shrink-0" />}
    </div>
  );
}

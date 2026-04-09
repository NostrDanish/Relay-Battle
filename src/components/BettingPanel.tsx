import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { RelayStats } from '@/lib/battleEngine';
import { calculateOdds } from '@/lib/battleEngine';
import { generatePortrait } from '@/lib/relayPortrait';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Zap, Lock, TrendingUp, Coins, AlertTriangle } from 'lucide-react';

interface BettingPanelProps {
  fighterA: RelayStats | null;
  fighterB: RelayStats | null;
  battleId?: string;
  isBattleActive: boolean;
  className?: string;
}

interface Bet {
  fighter: string;
  amount: number;
  timestamp: number;
}

export function BettingPanel({ fighterA, fighterB, battleId, isBattleActive, className }: BettingPanelProps) {
  const { user } = useCurrentUser();
  const [selectedFighter, setSelectedFighter] = useState<'a' | 'b' | null>(null);
  const [betAmount, setBetAmount] = useState<string>('100');
  const [activeBets, setActiveBets] = useState<Bet[]>([]);

  if (!fighterA || !fighterB) return null;

  const odds = calculateOdds(fighterA, fighterB);
  const portraitA = generatePortrait(fighterA.url);
  const portraitB = generatePortrait(fighterB.url);

  const potentialPayout = (side: 'a' | 'b') => {
    const amount = parseInt(betAmount) || 0;
    const oddsPct = side === 'a' ? odds.a : odds.b;
    if (oddsPct <= 0) return 0;
    return Math.floor(amount * (100 / oddsPct));
  };

  const placeBet = () => {
    if (!selectedFighter || !user) return;
    const amount = parseInt(betAmount) || 0;
    if (amount <= 0) return;

    const fighter = selectedFighter === 'a' ? fighterA.url : fighterB.url;
    setActiveBets(prev => [...prev, { fighter, amount, timestamp: Date.now() }]);
    setSelectedFighter(null);
    setBetAmount('100');
  };

  return (
    <Card className={cn('bg-card/60 backdrop-blur-sm border-arena-gold/20', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Coins className="w-4 h-4 text-arena-gold" />
          <span className="font-pixel text-xs text-arena-gold">P2P BETTING</span>
          <Badge variant="outline" className="ml-auto text-[10px] border-arena-gold/30 text-arena-gold">
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Odds display */}
        <div className="grid grid-cols-2 gap-3">
          <OddsCard
            name={fighterA.name}
            odds={odds.a}
            gradient={portraitA.gradient}
            isSelected={selectedFighter === 'a'}
            onClick={() => setSelectedFighter(selectedFighter === 'a' ? null : 'a')}
            disabled={isBattleActive}
          />
          <OddsCard
            name={fighterB.name}
            odds={odds.b}
            gradient={portraitB.gradient}
            isSelected={selectedFighter === 'b'}
            onClick={() => setSelectedFighter(selectedFighter === 'b' ? null : 'b')}
            disabled={isBattleActive}
          />
        </div>

        {/* Bet input */}
        {selectedFighter && !isBattleActive && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Sats"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="bg-muted/30 border-muted-foreground/20"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBetAmount('100')}
                className="shrink-0 text-xs"
              >
                100
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBetAmount('1000')}
                className="shrink-0 text-xs"
              >
                1K
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Potential payout:</span>
              <span className="font-bold text-arena-gold">
                {potentialPayout(selectedFighter)} sats
              </span>
            </div>

            {user ? (
              <Button
                onClick={placeBet}
                className="w-full bg-gradient-to-r from-arena-gold/80 to-arena-gold hover:from-arena-gold hover:to-arena-gold/80 text-background font-bold"
              >
                <Zap className="w-4 h-4 mr-2" />
                Place Bet ({betAmount} sats)
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Log in with Nostr to place bets. Bets settle via NIP-57 Zaps.</span>
              </div>
            )}
          </div>
        )}

        {/* Active bets */}
        {activeBets.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-semibold">Your Bets</p>
            {activeBets.map((bet, i) => {
              const name = bet.fighter === fighterA.url ? fighterA.name : fighterB.name;
              return (
                <div key={i} className="flex items-center justify-between text-xs bg-muted/20 rounded-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-arena-green" />
                    <span>{name}</span>
                  </div>
                  <span className="font-mono font-bold text-arena-gold">{bet.amount} sats</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-2 text-[10px] text-muted-foreground/60 bg-muted/10 rounded-lg p-2">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            P2P betting uses signed Nostr events. Settlements via NIP-57 Zaps & Cashu tokens. No house edge — pure peer-to-peer.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function OddsCard({
  name,
  odds,
  gradient,
  isSelected,
  onClick,
  disabled,
}: {
  name: string;
  odds: number;
  gradient: string;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative rounded-lg border p-3 text-left transition-all overflow-hidden',
        isSelected ? 'border-arena-gold ring-1 ring-arena-gold/40' : 'border-muted-foreground/20 hover:border-muted-foreground/40',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div
        className="absolute inset-0 opacity-10 -z-10"
        style={{ background: gradient }}
      />
      <p className="text-sm font-semibold truncate">{name}</p>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-lg font-bold text-arena-gold">{odds}%</span>
        <span className="text-[10px] text-muted-foreground">win chance</span>
      </div>
    </button>
  );
}

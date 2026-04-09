import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { RelayStats, BattleResult } from '@/lib/battleEngine';
import { simulateBattle, calculateOdds } from '@/lib/battleEngine';
import { getBattleGradient } from '@/lib/relayPortrait';
import { FighterCard } from './FighterCard';
import { BattleLog } from './BattleLog';
import { BettingPanel } from './BettingPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBattlePublish } from '@/hooks/useBattlePublish';
import { useToast } from '@/hooks/useToast';
import { Swords, RotateCcw, FastForward, Pause, Play, Upload } from 'lucide-react';

interface ArenaProps {
  fighterA: RelayStats | null;
  fighterB: RelayStats | null;
  onBattleComplete?: (result: BattleResult) => void;
}

type BattleState = 'idle' | 'countdown' | 'fighting' | 'finished';

export function Arena({ fighterA, fighterB, onBattleComplete }: ArenaProps) {
  const { publishBattle, isPending: isPublishing, canPublish } = useBattlePublish();
  const { toast } = useToast();
  const [battleState, setBattleState] = useState<BattleState>('idle');
  const [result, setResult] = useState<BattleResult | null>(null);
  const [currentLogIndex, setCurrentLogIndex] = useState(-1);
  const [hpA, setHpA] = useState<number | undefined>();
  const [hpB, setHpB] = useState<number | undefined>();
  const [maxHpA, setMaxHpA] = useState<number | undefined>();
  const [maxHpB, setMaxHpB] = useState<number | undefined>();
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [countdown, setCountdown] = useState(3);
  const [activeHit, setActiveHit] = useState<'a' | 'b' | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const odds = fighterA && fighterB ? calculateOdds(fighterA, fighterB) : null;

  const clearInterval_ = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startBattle = useCallback(() => {
    if (!fighterA || !fighterB) return;

    setBattleState('countdown');
    setCountdown(3);
    setResult(null);
    setCurrentLogIndex(-1);
    setHpA(undefined);
    setHpB(undefined);
    setMaxHpA(undefined);
    setMaxHpB(undefined);
    setIsPaused(false);
    setActiveHit(null);

    // Countdown
    let count = 3;
    const countInterval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countInterval);
        // Run simulation
        const battleResult = simulateBattle(fighterA, fighterB);
        setResult(battleResult);
        setMaxHpA(battleResult.fighters[0].stats.maxHp);
        setMaxHpB(battleResult.fighters[1].stats.maxHp);
        setHpA(battleResult.fighters[0].stats.maxHp);
        setHpB(battleResult.fighters[1].stats.maxHp);
        setBattleState('fighting');
      }
    }, 800);
  }, [fighterA, fighterB]);

  // Animated playback of log entries
  useEffect(() => {
    if (battleState !== 'fighting' || !result || isPaused) {
      clearInterval_();
      return;
    }

    const baseDelay = 400;
    const delay = baseDelay / playbackSpeed;

    intervalRef.current = setInterval(() => {
      setCurrentLogIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= result.log.length) {
          clearInterval_();
          setBattleState('finished');
          onBattleComplete?.(result);
          return prev;
        }

        // Update HP from snapshots
        const entry = result.log[nextIndex];
        if (entry.hpSnapshot) {
          if (fighterA) {
            const hp = entry.hpSnapshot[fighterA.url];
            if (hp !== undefined) setHpA(hp);
          }
          if (fighterB) {
            const hp = entry.hpSnapshot[fighterB.url];
            if (hp !== undefined) setHpB(hp);
          }
        }

        // Flash hit effects
        if (entry.damage && entry.damage > 0) {
          const hitTarget = entry.actorUrl === fighterA?.url ? 'b' : 'a';
          setActiveHit(hitTarget);
          setTimeout(() => setActiveHit(null), 300);
        }

        return nextIndex;
      });
    }, delay);

    return clearInterval_;
  }, [battleState, result, isPaused, playbackSpeed, fighterA, fighterB, clearInterval_, onBattleComplete]);

  const skipToEnd = useCallback(() => {
    if (!result) return;
    clearInterval_();
    setCurrentLogIndex(result.log.length - 1);
    // Set final HP
    setHpA(result.fighters[0].finalHp);
    setHpB(result.fighters[1].finalHp);
    setBattleState('finished');
    onBattleComplete?.(result);
  }, [result, clearInterval_, onBattleComplete]);

  const resetBattle = useCallback(() => {
    clearInterval_();
    setBattleState('idle');
    setResult(null);
    setCurrentLogIndex(-1);
    setHpA(undefined);
    setHpB(undefined);
    setMaxHpA(undefined);
    setMaxHpB(undefined);
    setActiveHit(null);
  }, [clearInterval_]);

  if (!fighterA || !fighterB) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Swords className="w-16 h-16 text-muted-foreground/30 animate-float" />
        <p className="text-muted-foreground text-center font-pixel text-xs">SELECT TWO RELAYS TO BATTLE</p>
      </div>
    );
  }

  const battleGradient = getBattleGradient(fighterA.url, fighterB.url);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Arena header with VS */}
      <div
        className="relative isolate rounded-2xl border overflow-hidden p-4 md:p-6"
        style={{ background: battleGradient }}
      >
        {/* Scanline overlay */}
        <div className="scanline-overlay absolute inset-0 rounded-2xl" />

        {/* Fighters */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-start">
          <FighterCard
            stats={fighterA}
            hp={hpA}
            maxHp={maxHpA}
            side="left"
            isActive={battleState === 'fighting' && result?.log[currentLogIndex]?.actorUrl === fighterA.url}
            isHit={activeHit === 'a'}
          />

          {/* VS Badge */}
          <div className="hidden md:flex flex-col items-center justify-center gap-3 py-4">
            {battleState === 'countdown' ? (
              <div className="animate-bounce-in">
                <span className="font-pixel text-4xl text-arena-gold animate-text-glow">{countdown}</span>
              </div>
            ) : battleState === 'finished' && result?.winner ? (
              <div className="animate-bounce-in text-center">
                <span className="font-pixel text-lg text-arena-gold animate-text-glow block">WINNER</span>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {result.winner === fighterA.url ? fighterA.name : fighterB.name}
                </span>
              </div>
            ) : (
              <div className="animate-versus-pop">
                <span className="font-pixel text-2xl md:text-3xl text-arena-red animate-text-glow">VS</span>
              </div>
            )}

            {odds && battleState === 'idle' && (
              <div className="flex gap-2 text-xs">
                <Badge variant="outline" className="border-arena-red/40 text-arena-red">{odds.a}%</Badge>
                <Badge variant="outline" className="border-arena-blue/40 text-arena-blue">{odds.b}%</Badge>
              </div>
            )}
          </div>

          {/* Mobile VS */}
          <div className="flex md:hidden items-center justify-center">
            {battleState === 'countdown' ? (
              <span className="font-pixel text-3xl text-arena-gold animate-text-glow">{countdown}</span>
            ) : (
              <span className="font-pixel text-2xl text-arena-red">VS</span>
            )}
          </div>

          <FighterCard
            stats={fighterB}
            hp={hpB}
            maxHp={maxHpB}
            side="right"
            isActive={battleState === 'fighting' && result?.log[currentLogIndex]?.actorUrl === fighterB.url}
            isHit={activeHit === 'b'}
          />
        </div>

        {/* Battle controls */}
        <div className="relative z-10 flex items-center justify-center gap-3 mt-6">
          {battleState === 'idle' && (
            <Button
              onClick={startBattle}
              size="lg"
              className="font-pixel text-sm bg-gradient-to-r from-arena-red to-arena-purple hover:from-arena-red/90 hover:to-arena-purple/90 text-white shadow-lg shadow-arena-red/20 px-8"
            >
              <Swords className="w-5 h-5 mr-2" />
              FIGHT!
            </Button>
          )}

          {battleState === 'fighting' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="border-muted-foreground/30"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPlaybackSpeed(s => s >= 4 ? 1 : s * 2)}
                className="border-muted-foreground/30 font-mono"
              >
                {playbackSpeed}x
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={skipToEnd}
                className="border-muted-foreground/30"
              >
                <FastForward className="w-4 h-4 mr-1" />
                Skip
              </Button>
            </>
          )}

          {battleState === 'finished' && (
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={startBattle}
                className="font-pixel text-xs bg-gradient-to-r from-arena-red to-arena-purple hover:from-arena-red/90 hover:to-arena-purple/90"
              >
                <Swords className="w-4 h-4 mr-2" />
                REMATCH
              </Button>
              <Button
                variant="outline"
                onClick={resetBattle}
                className="border-muted-foreground/30"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                New Fight
              </Button>
              {canPublish && result && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await publishBattle(result);
                      toast({ title: 'Battle published!', description: 'Battle result signed and published to Nostr relays.' });
                    } catch (err) {
                      toast({ title: 'Publish failed', description: (err as Error).message, variant: 'destructive' });
                    }
                  }}
                  disabled={isPublishing}
                  className="border-arena-gold/40 text-arena-gold hover:bg-arena-gold/10"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {isPublishing ? 'Publishing...' : 'Publish to Nostr'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Betting + Battle Log */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 md:gap-6">
        {/* Battle Log */}
        {result && result.log.length > 0 && (
          <BattleLog
            entries={result.log}
            currentIndex={currentLogIndex}
          />
        )}

        {/* Betting Panel */}
        <BettingPanel
          fighterA={fighterA}
          fighterB={fighterB}
          battleId={result?.battleId}
          isBattleActive={battleState === 'fighting' || battleState === 'countdown'}
        />
      </div>
    </div>
  );
}

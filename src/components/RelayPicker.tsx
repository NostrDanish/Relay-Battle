import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { RelayStats } from '@/lib/battleEngine';
import { generatePortrait, getCountryFlag } from '@/lib/relayPortrait';
import { getStatGrade, getRelayTitle } from '@/lib/relayStats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Swords, Shuffle, Zap, Shield, Sword, Flame } from 'lucide-react';

interface RelayPickerProps {
  relays: RelayStats[];
  isLoading: boolean;
  selectedA: RelayStats | null;
  selectedB: RelayStats | null;
  onSelectA: (relay: RelayStats) => void;
  onSelectB: (relay: RelayStats) => void;
  onRandomMatch: () => void;
}

export function RelayPicker({
  relays,
  isLoading,
  selectedA,
  selectedB,
  onSelectA,
  onSelectB,
  onRandomMatch,
}: RelayPickerProps) {
  const [search, setSearch] = useState('');
  const [selectingFor, setSelectingFor] = useState<'a' | 'b'>('a');

  const filtered = useMemo(() => {
    if (!search.trim()) return relays;
    const term = search.toLowerCase();
    return relays.filter(r =>
      r.name.toLowerCase().includes(term) ||
      r.url.toLowerCase().includes(term)
    );
  }, [relays, search]);

  const handleSelect = (relay: RelayStats) => {
    if (selectingFor === 'a') {
      onSelectA(relay);
      if (!selectedB) setSelectingFor('b');
    } else {
      onSelectB(relay);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selection status */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <SelectionSlot
          label="FIGHTER 1"
          relay={selectedA}
          isSelecting={selectingFor === 'a'}
          onClick={() => setSelectingFor('a')}
          side="a"
        />
        <div className="hidden md:flex items-center justify-center">
          <span className="font-pixel text-sm text-muted-foreground">VS</span>
        </div>
        <SelectionSlot
          label="FIGHTER 2"
          relay={selectedB}
          isSelecting={selectingFor === 'b'}
          onClick={() => setSelectingFor('b')}
          side="b"
        />
      </div>

      {/* Controls */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search relays..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/30 border-muted-foreground/20"
          />
        </div>
        <Button
          variant="outline"
          onClick={onRandomMatch}
          className="border-arena-gold/40 text-arena-gold hover:bg-arena-gold/10 shrink-0"
        >
          <Shuffle className="w-4 h-4 mr-2" />
          Random
        </Button>
      </div>

      {/* Relay grid */}
      <ScrollArea className="h-[400px] md:h-[450px]">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-card/60">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="h-6" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((relay) => {
              const isSelectedA = selectedA?.url === relay.url;
              const isSelectedB = selectedB?.url === relay.url;
              const portrait = generatePortrait(relay.url);

              return (
                <Card
                  key={relay.url}
                  className={cn(
                    'group cursor-pointer bg-card/60 hover:bg-card/90 transition-all duration-200 overflow-hidden',
                    isSelectedA && 'ring-2 ring-arena-red',
                    isSelectedB && 'ring-2 ring-arena-blue',
                  )}
                  onClick={() => handleSelect(relay)}
                >
                  <CardContent className="p-3 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                        style={{ background: portrait.gradient }}
                      >
                        {relay.favicon ? (
                          <img src={relay.favicon} alt="" className="w-6 h-6 rounded" />
                        ) : (
                          <span className="text-sm">{portrait.emoji}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{relay.name}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">{getRelayTitle(relay)}</span>
                          <span className="text-xs">{getCountryFlag(relay.countryCode)}</span>
                        </div>
                      </div>
                      {isSelectedA && <Badge className="bg-arena-red text-white text-[10px] px-1.5">P1</Badge>}
                      {isSelectedB && <Badge className="bg-arena-blue text-white text-[10px] px-1.5">P2</Badge>}
                    </div>

                    {/* Compact stats */}
                    <div className="grid grid-cols-4 gap-1">
                      <CompactStat icon={<Sword className="w-3 h-3" />} value={relay.speed} />
                      <CompactStat icon={<Shield className="w-3 h-3" />} value={relay.defense} />
                      <CompactStat icon={<Flame className="w-3 h-3" />} value={relay.power} />
                      <CompactStat icon={<Zap className="w-3 h-3" />} value={Math.floor(relay.toughness)} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Picking hint */}
      <p className="text-center text-xs text-muted-foreground">
        Selecting for: <span className={cn('font-bold', selectingFor === 'a' ? 'text-arena-red' : 'text-arena-blue')}>
          Fighter {selectingFor === 'a' ? '1' : '2'}
        </span>
        {' '} — Click a relay to select. Click the slot above to switch.
      </p>
    </div>
  );
}

function SelectionSlot({
  label,
  relay,
  isSelecting,
  onClick,
  side,
}: {
  label: string;
  relay: RelayStats | null;
  isSelecting: boolean;
  onClick: () => void;
  side: 'a' | 'b';
}) {
  const portrait = relay ? generatePortrait(relay.url) : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all text-left w-full',
        isSelecting && side === 'a' && 'border-arena-red/60 bg-arena-red/5',
        isSelecting && side === 'b' && 'border-arena-blue/60 bg-arena-blue/5',
        !isSelecting && 'border-muted-foreground/20 hover:border-muted-foreground/40',
        relay && 'border-solid',
      )}
      style={relay ? { borderColor: portrait?.primaryColor + '80' } : undefined}
    >
      {relay ? (
        <>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
            style={{ background: portrait?.gradient }}
          >
            {relay.favicon ? (
              <img src={relay.favicon} alt="" className="w-6 h-6 rounded" />
            ) : (
              <span className="text-sm">{portrait?.emoji}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{relay.name}</p>
            <p className="text-[10px] text-muted-foreground">{getRelayTitle(relay)}</p>
          </div>
        </>
      ) : (
        <>
          <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
            <Swords className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-sm font-pixel text-muted-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground">Click to select</p>
          </div>
        </>
      )}
    </button>
  );
}

function CompactStat({ icon, value }: { icon: React.ReactNode; value: number }) {
  const grade = getStatGrade(value);
  return (
    <div className="flex items-center justify-center gap-1 rounded bg-muted/30 px-1.5 py-1">
      <span className="text-muted-foreground">{icon}</span>
      <span className={cn('text-[10px] font-bold', grade.color)}>{value}</span>
    </div>
  );
}

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { BattleLogEntry } from '@/lib/battleEngine';

interface BattleLogProps {
  entries: BattleLogEntry[];
  currentIndex: number;
  className?: string;
}

export function BattleLog({ entries, currentIndex, className }: BattleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }, [currentIndex]);

  const visibleEntries = entries.slice(0, currentIndex + 1);

  return (
    <div className={cn('rounded-xl border bg-card/60 backdrop-blur-sm overflow-hidden', className)}>
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
        <h3 className="font-pixel text-xs text-arena-gold">BATTLE LOG</h3>
        <span className="text-[10px] text-muted-foreground font-mono">
          {visibleEntries.length}/{entries.length} entries
        </span>
      </div>
      <div
        ref={scrollRef}
        className="h-[300px] md:h-[400px] overflow-y-auto p-3 space-y-1 battle-log-scroll"
      >
        {visibleEntries.map((entry, i) => (
          <LogEntry key={i} entry={entry} isNew={i === currentIndex} />
        ))}
      </div>
    </div>
  );
}

function LogEntry({ entry, isNew }: { entry: BattleLogEntry; isNew: boolean }) {
  const actionColors: Record<string, string> = {
    attack: 'text-arena-red',
    special: 'text-arena-gold',
    heal: 'text-arena-green',
    effect: 'text-arena-cyan',
    dodge: 'text-arena-purple',
    reflect: 'text-orange-400',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-2 px-2 py-1.5 rounded-md text-xs md:text-sm transition-all',
        isNew && 'bg-muted/40 animate-flash-gold',
      )}
    >
      <span className="font-pixel text-[10px] text-muted-foreground shrink-0 mt-0.5 w-8 text-right">
        {entry.tick > 0 ? `T${entry.tick}` : ''}
      </span>
      <span className="text-base shrink-0">{entry.emoji}</span>
      <div className="min-w-0">
        <span className={cn('font-semibold', actionColors[entry.action] || 'text-foreground')}>
          {entry.actor}
        </span>
        <span className="text-muted-foreground ml-1">
          {entry.message}
        </span>
        {entry.damage !== undefined && entry.damage > 0 && (
          <span className="ml-1 font-bold text-arena-red">-{entry.damage}</span>
        )}
        {entry.heal !== undefined && entry.heal > 0 && (
          <span className="ml-1 font-bold text-arena-green">+{entry.heal}</span>
        )}
      </div>
    </div>
  );
}

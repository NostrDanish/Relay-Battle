import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { BattleLogEntry } from '@/lib/battleEngine';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BattleLogProps {
  entries: BattleLogEntry[];
  currentIndex: number;
  className?: string;
}

export function BattleLog({ entries, currentIndex, className }: BattleLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentIndex]);

  const visibleEntries = entries.slice(0, currentIndex + 1);

  return (
    <div className={cn('rounded-xl border bg-card/60 backdrop-blur-sm overflow-hidden', className)}>
      <div className="px-4 py-3 border-b bg-muted/30">
        <h3 className="font-pixel text-xs text-arena-gold">BATTLE LOG</h3>
      </div>
      <ScrollArea className="h-[300px] md:h-[400px]">
        <div className="p-3 space-y-1 battle-log-scroll">
          {visibleEntries.map((entry, i) => (
            <LogEntry key={i} entry={entry} isNew={i === currentIndex} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
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

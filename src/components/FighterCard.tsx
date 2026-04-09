import { cn } from '@/lib/utils';
import type { RelayStats } from '@/lib/battleEngine';
import { generatePortrait, getCountryFlag } from '@/lib/relayPortrait';
import { getStatGrade, getRelayTitle } from '@/lib/relayStats';
import { Badge } from '@/components/ui/badge';
import { Zap, Shield, Sword, Heart, Flame } from 'lucide-react';

interface FighterCardProps {
  stats: RelayStats;
  hp?: number;
  maxHp?: number;
  side: 'left' | 'right';
  isActive?: boolean;
  isHit?: boolean;
  className?: string;
}

export function FighterCard({ stats, hp, maxHp, side, isActive, isHit, className }: FighterCardProps) {
  const portrait = generatePortrait(stats.url);
  const computedMaxHp = maxHp ?? Math.floor(80 + (stats.uptime * 0.8) + (stats.defense * 0.4));
  const currentHp = hp ?? computedMaxHp;
  const hpPercent = Math.max(0, Math.min(100, (currentHp / computedMaxHp) * 100));
  const title = getRelayTitle(stats);

  const hpColor = hpPercent > 60 ? 'bg-arena-green' : hpPercent > 30 ? 'bg-yellow-500' : 'bg-arena-red';
  const hpGlow = hpPercent > 60 ? 'shadow-green-500/30' : hpPercent > 30 ? 'shadow-yellow-500/30' : 'shadow-red-500/30';

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 p-4 md:p-5 rounded-xl border bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300',
        side === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right',
        isActive && 'ring-2 ring-arena-gold/60 animate-pulse-glow',
        isHit && 'animate-shake',
        className,
      )}
      style={{ borderColor: portrait.primaryColor + '40' }}
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0 opacity-10 -z-10"
        style={{ background: portrait.gradient }}
      />

      {/* Fighter identity */}
      <div className="flex items-center gap-3">
        <div
          className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center text-2xl font-bold shrink-0"
          style={{ background: portrait.gradient }}
        >
          {stats.favicon ? (
            <img src={stats.favicon} alt="" className="w-8 h-8 rounded" />
          ) : (
            <span>{portrait.emoji}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm md:text-base truncate">{stats.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{title}</span>
            <span className="text-xs">{getCountryFlag(stats.countryCode)}</span>
          </div>
        </div>
      </div>

      {/* HP Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="flex items-center gap-1 font-pixel text-[10px]">
            <Heart className="w-3 h-3 text-arena-red" />
            HP
          </span>
          <span className="font-mono font-bold">
            {Math.floor(currentHp)} / {computedMaxHp}
          </span>
        </div>
        <div className={cn('h-4 md:h-5 rounded-full bg-muted/50 overflow-hidden shadow-lg', hpGlow)}>
          <div
            className={cn('h-full rounded-full hp-bar-transition', hpColor)}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatBlock icon={<Sword className="w-3.5 h-3.5" />} label="SPD" value={stats.speed} color="text-arena-cyan" />
        <StatBlock icon={<Shield className="w-3.5 h-3.5" />} label="DEF" value={stats.defense} color="text-arena-blue" />
        <StatBlock icon={<Flame className="w-3.5 h-3.5" />} label="PWR" value={stats.power} color="text-arena-purple" />
        <StatBlock icon={<Zap className="w-3.5 h-3.5" />} label="TGH" value={Math.floor(stats.toughness)} color="text-arena-gold" />
      </div>

      {/* NIP badges */}
      <div className="flex flex-wrap gap-1">
        {stats.hasAuth && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-arena-gold/40 text-arena-gold">NIP-42</Badge>}
        {stats.supportedNips.includes(57) && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500/40 text-yellow-400">NIP-57</Badge>}
        {stats.supportedNips.includes(47) && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500/40 text-green-400">NIP-47</Badge>}
        {stats.supportedNips.includes(60) && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-500/40 text-purple-400">NIP-60</Badge>}
        {stats.supportedNips.includes(59) && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/40 text-blue-400">NIP-59</Badge>}
        {stats.hasPowReq && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-500/40 text-orange-400">PoW</Badge>}
        {stats.hasPaymentReq && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/40 text-emerald-400">Paid</Badge>}
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-muted-foreground/30 text-muted-foreground">
          {stats.supportedNips.length} NIPs
        </Badge>
      </div>
    </div>
  );
}

function StatBlock({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const grade = getStatGrade(value);
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-1.5">
      <span className={color}>{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-pixel text-muted-foreground">{label}</span>
      </div>
      <span className="font-mono text-sm font-bold">{value}</span>
      <span className={cn('text-xs font-bold', grade.color)}>{grade.label}</span>
    </div>
  );
}

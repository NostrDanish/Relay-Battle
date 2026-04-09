import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sparkles } from 'lucide-react';

interface SpecialMove {
  name: string;
  emoji: string;
  category: string;
  categoryColor: string;
  trigger: string;
  effect: string;
  nipRef?: string;
}

const SPECIAL_MOVES: SpecialMove[] = [
  // Speed Demons
  { name: 'Lightning Strike', emoji: '⚡', category: 'Speed Demon', categoryColor: 'text-arena-cyan', trigger: 'SPEED >= 90', effect: '25% chance double attack', nipRef: undefined },
  { name: 'Hyper-Thread', emoji: '🧵', category: 'Speed Demon', categoryColor: 'text-arena-cyan', trigger: 'SPEED >= 85 + NIP-50', effect: '20% extra immediate action', nipRef: 'NIP-50' },
  { name: 'Blitzkrieg', emoji: '💥', category: 'Speed Demon', categoryColor: 'text-arena-cyan', trigger: 'SPEED >= 95', effect: 'First 3 ticks +30% damage' },

  // Tank Brigade
  { name: 'Iron Wall', emoji: '🛡️', category: 'Tank Brigade', categoryColor: 'text-arena-blue', trigger: 'TOUGHNESS >= 110', effect: '+15 HP regen every 3 ticks' },
  { name: 'Premium Paywall', emoji: '💰', category: 'Tank Brigade', categoryColor: 'text-arena-blue', trigger: 'Payment req + DEF >= 70', effect: 'Once, absorb 50 damage' },
  { name: 'Auth Fortress', emoji: '🔐', category: 'Tank Brigade', categoryColor: 'text-arena-blue', trigger: 'NIP-42 auth required', effect: 'First 5 ticks +35 Defense. Uses kind:22242 challenge-response.', nipRef: 'NIP-42' },

  // NIP Wizards
  { name: 'Versatile Arsenal', emoji: '🎲', category: 'NIP Wizard', categoryColor: 'text-arena-purple', trigger: '12+ supported NIPs', effect: 'Random +5-15 buff each tick (30% chance)' },
  { name: 'Gift-Wrap Ambush', emoji: '🎁', category: 'NIP Wizard', categoryColor: 'text-arena-purple', trigger: 'NIP-59 + HP < 60%', effect: 'Once, untargetable for 2 ticks', nipRef: 'NIP-59' },
  { name: 'Zap Counter', emoji: '⚡', category: 'NIP Wizard', categoryColor: 'text-arena-purple', trigger: 'NIP-57 Zap-enabled', effect: '30% reflect 20% damage + 10 HP heal. kind:9734 -> kind:9735 flow.', nipRef: 'NIP-57' },
  { name: 'Blossom Bloom', emoji: '🌸', category: 'NIP Wizard', categoryColor: 'text-arena-purple', trigger: 'Blossom/NIP-96 + HP < 70%', effect: 'Once, heal 40 HP', nipRef: 'NIP-B7' },
  { name: 'Ephemeral Evade', emoji: '👻', category: 'NIP Wizard', categoryColor: 'text-arena-purple', trigger: 'NIP-37 (Draft)', effect: 'Passive 20% dodge chance', nipRef: 'NIP-37' },

  // Restriction Renegades
  { name: 'PoW Fortress', emoji: '⛏️', category: 'Restriction Renegade', categoryColor: 'text-orange-400', trigger: 'PoW required', effect: '40% chance reflect 15% damage', nipRef: 'NIP-13' },
  { name: 'Censorship Rebel', emoji: '🔥', category: 'Restriction Renegade', categoryColor: 'text-orange-400', trigger: 'No restrictions + reliability < 50', effect: '20% ignore Defense for massive hit' },
  { name: 'Write Lockdown', emoji: '🔒', category: 'Restriction Renegade', categoryColor: 'text-orange-400', trigger: 'Restricted writes', effect: 'Once, silence opponent 1 tick (35% chance)' },
  { name: 'Moderated Menace', emoji: '👮', category: 'Restriction Renegade', categoryColor: 'text-orange-400', trigger: 'Write restriction + Auth', effect: '+25 Defense, but 15% self-skip' },

  // Payment & Wallet Masters
  { name: 'NWC Surge', emoji: '💸', category: 'Wallet Master', categoryColor: 'text-arena-green', trigger: 'NIP-47 + HP < 65%', effect: 'Once, +60 HP heal. 10% chance +15 Attack for 2 ticks. Uses NIP-44 v2 encryption.', nipRef: 'NIP-47' },
  { name: 'Cashu Shield', emoji: '🟡', category: 'Wallet Master', categoryColor: 'text-arena-green', trigger: 'NIP-60 Cashu Wallet', effect: '25% negate next damage tick', nipRef: 'NIP-60' },

  // Geo & Epic
  { name: 'Home-Field Surge', emoji: '🏠', category: 'Geo & Epic', categoryColor: 'text-arena-gold', trigger: 'Geo region match', effect: '+15 all stats' },
  { name: 'Global Ping', emoji: '🌐', category: 'Geo & Epic', categoryColor: 'text-arena-gold', trigger: '15% chance after tick 3', effect: 'Steal initiative once' },
  { name: 'Last Stand', emoji: '🔥', category: 'Geo & Epic', categoryColor: 'text-arena-gold', trigger: 'HP < 25% + reliability >= 80', effect: 'Once: +80 HP and +40 damage for 3 ticks' },
  { name: 'Web-of-Trust Aura', emoji: '🤝', category: 'Geo & Epic', categoryColor: 'text-arena-gold', trigger: 'Reliability >= 70', effect: 'Passive +10 Defense (20% chance)', nipRef: 'NIP-85' },
  { name: 'Nostr Groups Rally', emoji: '📢', category: 'Geo & Epic', categoryColor: 'text-arena-gold', trigger: 'NIP-29', effect: 'Team buff +20 Attack (25% chance)', nipRef: 'NIP-29' },
];

const categories = [...new Set(SPECIAL_MOVES.map(m => m.category))];

export function SpecialMovesReference() {
  return (
    <Card className="bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-arena-purple" />
          <span className="font-pixel text-xs text-arena-purple">SPECIAL MOVES</span>
          <Badge variant="outline" className="ml-auto text-[10px] border-muted-foreground/30">
            22 moves
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Accordion type="multiple" defaultValue={categories} className="space-y-1">
            {categories.map((cat) => {
              const moves = SPECIAL_MOVES.filter(m => m.category === cat);
              const catColor = moves[0]?.categoryColor || 'text-foreground';
              return (
                <AccordionItem key={cat} value={cat} className="border-muted-foreground/10">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className={`font-pixel text-[10px] ${catColor}`}>{cat.toUpperCase()}</span>
                      <Badge variant="outline" className="text-[10px]">{moves.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-2">
                      {moves.map((move) => (
                        <div key={move.name} className="flex items-start gap-2 rounded-md bg-muted/20 p-2.5">
                          <span className="text-lg shrink-0">{move.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-bold">{move.name}</span>
                              {move.nipRef && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0">{move.nipRef}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              <span className="text-arena-cyan font-mono">Trigger:</span> {move.trigger}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              <span className="text-arena-gold font-mono">Effect:</span> {move.effect}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

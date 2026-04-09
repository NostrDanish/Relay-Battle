import { useState, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Swords, Trophy, Scroll, Zap, Crown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LoginArea } from '@/components/auth/LoginArea';
import { Arena } from '@/components/Arena';
import { RelayPicker } from '@/components/RelayPicker';
import { Leaderboard } from '@/components/Leaderboard';
import { BattleHistory } from '@/components/BattleHistory';
import { TournamentBracket } from '@/components/TournamentBracket';
import { SpecialMovesReference } from '@/components/SpecialMoves';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useRelayFighters } from '@/hooks/useRelayFighters';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import type { RelayStats, BattleResult } from '@/lib/battleEngine';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const Index = () => {
  useSeoMeta({
    title: 'Relay Arena — Nostr Relay Gladiators',
    description: 'Watch real Nostr relays battle using their live performance stats! All 22 special moves, leaderboards, and pure chaos. Built with Nostr.',
  });

  const { data: relays = [], isLoading } = useRelayFighters();
  const { leaderboard, recordBattle, resetLeaderboard } = useLeaderboard();
  const [battleHistory, setBattleHistory] = useLocalStorage<BattleResult[]>('relay-arena-history', []);

  const [selectedA, setSelectedA] = useState<RelayStats | null>(null);
  const [selectedB, setSelectedB] = useState<RelayStats | null>(null);
  const [activeTab, setActiveTab] = useState('arena');

  const handleRandomMatch = useCallback(() => {
    if (relays.length < 2) return;
    const shuffled = [...relays].sort(() => Math.random() - 0.5);
    setSelectedA(shuffled[0]);
    setSelectedB(shuffled[1]);
    setActiveTab('arena');
  }, [relays]);

  const handleBattleComplete = useCallback((result: BattleResult) => {
    recordBattle(result);
    setBattleHistory((prev) => [result, ...prev].slice(0, 50));
  }, [recordBattle, setBattleHistory]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="relative isolate border-b bg-gradient-to-b from-arena-red/5 via-background to-background overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-arena-red/10 rounded-full blur-[120px]" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-arena-purple/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-arena-gold/5 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 py-6 md:py-10">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-arena-red to-arena-purple flex items-center justify-center shadow-lg shadow-arena-red/20">
                <Swords className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="font-pixel text-sm md:text-lg text-foreground tracking-wider">RELAY ARENA</h1>
                <p className="text-[10px] md:text-xs text-muted-foreground">Nostr Relay Gladiators</p>
              </div>
            </div>
            <LoginArea className="max-w-48" />
          </div>

          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-arena-red via-arena-gold to-arena-purple bg-clip-text text-transparent">
              Real Relays. Real Stats. Real Carnage.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-6">
              Watch Nostr relays fight to the death using their actual performance metrics.
              Speed, defense, NIPs — everything matters. Pure decentralized chaos.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={handleRandomMatch}
                size="lg"
                className="font-pixel text-xs bg-gradient-to-r from-arena-red to-arena-purple hover:from-arena-red/90 hover:to-arena-purple/90 text-white shadow-lg shadow-arena-red/20"
              >
                <Swords className="w-4 h-4 mr-2" />
                RANDOM BATTLE
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setActiveTab('roster')}
                className="border-muted-foreground/30 text-sm"
              >
                Browse Fighters
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/30 border border-muted-foreground/10">
            <TabsTrigger value="arena" className="gap-1.5 data-[state=active]:bg-arena-red/20 data-[state=active]:text-arena-red">
              <Swords className="w-4 h-4" />
              <span className="hidden sm:inline">Arena</span>
            </TabsTrigger>
            <TabsTrigger value="roster" className="gap-1.5 data-[state=active]:bg-arena-purple/20 data-[state=active]:text-arena-purple">
              <Scroll className="w-4 h-4" />
              <span className="hidden sm:inline">Roster</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1.5 data-[state=active]:bg-arena-gold/20 data-[state=active]:text-arena-gold">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Rankings</span>
            </TabsTrigger>
            <TabsTrigger value="tournament" className="gap-1.5 data-[state=active]:bg-arena-green/20 data-[state=active]:text-arena-green">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Tournament</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 data-[state=active]:bg-arena-cyan/20 data-[state=active]:text-arena-cyan">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          {/* Arena Tab */}
          <TabsContent value="arena">
            <Arena
              fighterA={selectedA}
              fighterB={selectedB}
              onBattleComplete={handleBattleComplete}
            />
            {!selectedA && !selectedB && (
              <div className="mt-8">
                <h3 className="font-pixel text-xs text-muted-foreground mb-4 text-center">QUICK PICK</h3>
                <RelayPicker
                  relays={relays}
                  isLoading={isLoading}
                  selectedA={selectedA}
                  selectedB={selectedB}
                  onSelectA={setSelectedA}
                  onSelectB={setSelectedB}
                  onRandomMatch={handleRandomMatch}
                />
              </div>
            )}
          </TabsContent>

          {/* Roster Tab */}
          <TabsContent value="roster">
            <RelayPicker
              relays={relays}
              isLoading={isLoading}
              selectedA={selectedA}
              selectedB={selectedB}
              onSelectA={(relay) => {
                setSelectedA(relay);
                if (selectedB) setActiveTab('arena');
              }}
              onSelectB={(relay) => {
                setSelectedB(relay);
                if (selectedA) setActiveTab('arena');
              }}
              onRandomMatch={handleRandomMatch}
            />
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Rankings based on ELO from your local battle history.
                </p>
                {leaderboard.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={resetLeaderboard} className="text-xs text-muted-foreground">
                    Reset
                  </Button>
                )}
              </div>
              <Leaderboard entries={leaderboard} />
            </div>
          </TabsContent>

          {/* Tournament Tab */}
          <TabsContent value="tournament">
            <TournamentBracket
              relays={relays}
              onBattleComplete={handleBattleComplete}
              onWatchBattle={(a, b) => {
                setSelectedA(a);
                setSelectedB(b);
                setActiveTab('arena');
              }}
            />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <BattleHistory
              battles={battleHistory}
              onRewatch={(battle) => {
                const a = relays.find(r => r.url === battle.fighters[0]?.url);
                const b = relays.find(r => r.url === battle.fighters[1]?.url);
                if (a && b) {
                  setSelectedA(a);
                  setSelectedB(b);
                  setActiveTab('arena');
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Special Moves Reference */}
      <section className="container mx-auto px-4 py-6 md:py-8">
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group w-full justify-center">
            <span className="font-pixel text-xs">ALL 22 SPECIAL MOVES</span>
            <span className="text-xs group-data-[state=open]:rotate-180 transition-transform">▼</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <SpecialMovesReference />
          </CollapsibleContent>
        </Collapsible>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/10 py-6 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-arena-red" />
              <span className="font-pixel text-[10px]">RELAY ARENA</span>
              <span>— Nostr relays fighting with real stats</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Relay data from NIP-66 & NIP-11</span>
              <span>|</span>
              <span>All battles are verifiable Nostr events</span>
              <span>|</span>
              <a
                href="https://shakespeare.diy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Vibed with Shakespeare
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

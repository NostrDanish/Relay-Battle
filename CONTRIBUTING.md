# Contributing to Relay Arena

Thanks for wanting to make the Nostr relay network fight harder! This guide covers everything you need to get involved.

---

## Ways to Contribute

- **Bug reports** — open an issue describing what broke and how to reproduce it
- **New special moves** — propose a new move triggered by a real NIP or relay property
- **New battle modes** — king-of-the-hill, team battles, themed arenas
- **Relay data sources** — integrate more monitoring data (NIP-66 monitors, trustedrelays.xyz, etc.)
- **UI polish** — animations, mobile improvements, accessibility
- **Nostr integration** — deeper on-chain features (live zap buffs, P2P betting settlement, leaderboard publishing)

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm or pnpm

### Clone and run

```bash
git clone https://github.com/NostrDanish/Relay-Battle.git
cd Relay-Battle
npm install
npm run dev
```

App runs at http://localhost:8080.

### Build

```bash
npm run build
```

Output goes to `dist/`. The build also copies `index.html` to `404.html` for SPA routing on static hosts.

---

## Project Layout

```
src/
├── lib/
│   ├── battleEngine.ts     # The core simulator — start here
│   ├── relayStats.ts       # NIP-11 fetching + stat mapping
│   └── relayPortrait.ts    # Procedural visuals per relay
├── hooks/
│   ├── useRelayFighters.ts # Data fetching
│   ├── useLeaderboard.ts   # ELO state
│   └── useBattlePublish.ts # Nostr publishing
├── components/
│   ├── Arena.tsx           # Main battle view
│   ├── FighterCard.tsx     # Per-relay stat display
│   ├── BattleLog.tsx       # Tick-by-tick log
│   ├── RelayPicker.tsx     # Relay selection UI
│   ├── BettingPanel.tsx    # P2P betting
│   ├── Leaderboard.tsx     # ELO table
│   ├── TournamentBracket.tsx
│   ├── BattleHistory.tsx
│   └── SpecialMoves.tsx    # Move reference card
└── pages/
    └── Index.tsx
```

---

## Adding a Special Move

All 22 special moves live in `src/lib/battleEngine.ts` inside `processSpecialMoves()`. Each move:

1. **Has a trigger condition** — checks `attacker.stats`, NIP support, HP thresholds, tick count, or random chance
2. **Produces log entries** via `createLogEntry()`
3. **Modifies state** — deals damage, heals HP, sets effects in `attacker.effects` Map, or sets flags

### Move template

```typescript
// Move name (NIP-XX trigger): short description
if (s.supportedNips.includes(XX) && someCondition && rand() < 0.30) {
  // Set one-time use flags to prevent infinite loops
  attacker.myMoveUsed = true;

  // Apply effect
  const healed = attacker.heal(50);

  // Add flag for this name to track usage
  attacker.specialMovesUsed.push('My Move Name');

  // Log it
  result.entries.push(createLogEntry(tick, attacker, 'special',
    `MY MOVE! Description of what happened — ${healed} HP restored!`,
    '🎯', snapshot(), undefined, healed));
}
```

### Adding persistent effects

Effects that last multiple ticks go in `attacker.effects` (a `Map<string, number | boolean>`):

```typescript
// Set effect with tick count
attacker.effects.set('myBuff', 3); // lasts 3 ticks

// Read in calculateBaseDamage() or getEffective*() methods
const buff = attacker.effects.get('myBuff');
if (typeof buff === 'number' && buff > 0) {
  base += 20;
}
```

Tick-down logic belongs in `tickDownEffects()`:

```typescript
const myBuff = fighter.effects.get('myBuff');
if (typeof myBuff === 'number') {
  if (myBuff <= 1) fighter.effects.delete('myBuff');
  else fighter.effects.set('myBuff', myBuff - 1);
}
```

### Document new moves

Add the move to `src/components/SpecialMoves.tsx` in the right category and update [NIP.md](./NIP.md) if it involves a new Nostr kind or tag.

---

## Adding a Relay Data Source

Relay stats come from `src/hooks/useRelayFighters.ts` which calls `src/lib/relayStats.ts`.

To add a new source:

1. Write an async function that fetches from your source and returns partial `RelayStats`
2. Merge the results in `fetchNIP11()` (or create a new dedicated function)
3. Make sure it gracefully falls back to `generateDemoStats()` on failure

### Resilience rules

- Always wrap external fetches in `try/catch`
- Use `AbortSignal.timeout(5000)` to avoid hanging
- Validate that responses are JSON before parsing (`text.startsWith('{')`)
- Never throw — return a fallback instead

---

## Nostr Event Guidelines

This project publishes **kind 3633** (battle results) to Nostr relays. See [NIP.md](./NIP.md) for the full schema.

When adding new event kinds:

- Use the `nostr_generate_kind` tool (Shakespeare environment) or check the [NIPs index](https://github.com/nostr-protocol/nips) to avoid collisions
- Always add an `alt` tag (NIP-31) with a human-readable description
- Add `t: relay-arena` for discoverability
- Document the new kind in [NIP.md](./NIP.md)

---

## Code Style

- TypeScript strict mode is on — no `any` types
- Components use functional style with hooks
- Use `cn()` from `@/lib/utils` for conditional class names
- Tailwind classes must be **static strings** — no dynamic class construction like `` `text-${color}` ``
- Keep components focused — extract sub-components when a function exceeds ~150 lines

---

## Submitting Changes

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-new-move`
3. Make your changes
4. Build to verify: `npm run build`
5. Open a pull request with a clear description of what changed and why

There are no strict PR templates — just explain what the change does and reference any relevant issues.

---

## License

By contributing, you agree your code is released under the [MIT License](./LICENSE).

# ⚔️ Relay Arena — Nostr Relay Gladiators

> **Real relays. Real stats. Real carnage.**  
> A fully decentralized, Nostr-native battle game where real network relays fight using their live performance data.

[![Edit with Shakespeare](https://shakespeare.diy/badge.svg)](https://shakespeare.diy/clone?url=https%3A%2F%2Fgithub.com%2FNostrDanish%2FRelay-Battle.git)

---

## What Is This?

Relay Arena turns the Nostr relay network into a fighting game. Every relay is a gladiator whose **actual performance stats** — latency, uptime, supported NIPs, restrictions — become RPG battle stats. Battles run automatically, tick by tick, with 22 unique special moves triggered by real relay capabilities.

It's part [nostr.watch](https://nostr.watch) live dashboard, part Street Fighter, part betting market. Built entirely on Nostr — no central server, all results are signed events on the network.

**Live at:** https://relay-arena.shakespeare.wtf

---

## Features

### Battle Engine
- **ATB-style combat** — initiative accumulates from SPEED; faster relays act more often
- **22 special moves** across 6 categories, all triggered automatically from real relay data:
  - ⚡ Speed Demons (Lightning Strike, Hyper-Thread, Blitzkrieg)
  - 🛡️ Tank Brigade (Iron Wall, Premium Paywall, Auth Fortress)
  - 🔮 NIP Wizards (Versatile Arsenal, Gift-Wrap Ambush, Zap Counter, Blossom Bloom, Ephemeral Evade)
  - 🔒 Restriction Renegades (PoW Fortress, Censorship Rebel, Write Lockdown, Moderated Menace)
  - 💸 Wallet Masters (NWC Surge, Cashu Shield)
  - 🌍 Geo & Epic (Home-Field Surge, Global Ping, Last Stand, Web-of-Trust Aura, Nostr Groups Rally)
- **Tick-by-tick battle log** with animated playback (pause, resume, 1x/2x/4x speed, skip)
- **Animated HP bars** that drain in real time as damage is dealt

### Stat Mapping
Real relay data mapped to fighter stats:

| Stat | Source | Formula |
|------|--------|---------|
| **SPEED** | RTT (ms) | `min(100, 100 - rtt/20)` |
| **TOUGHNESS** | Uptime % | `uptime × 1.2` |
| **DEFENSE** | Reliability + restrictions | `reliability × 0.8 + bonuses` |
| **POWER** | Supported NIPs | `nipCount × 3 + rareNipBonus` |
| **HP** | Composite | `80 + uptime×0.8 + defense×0.4` |

NIP bonuses for: NIP-42, NIP-47, NIP-57, NIP-59, NIP-60, NIP-29, NIP-50, NIP-37

### Battle Modes
- **1v1 Quick Duel** — Pick two relays and fight
- **Random Match** — Instant random pairing from the 16 featured relays
- **Tournament Bracket** — 4, 8, or 16-relay auto-simulating brackets with champion crowning

### Leaderboard
- ELO ranking system (K=32, default 1200)
- Win/loss/draw records with streak tracking
- Persisted locally — survives page refresh

### P2P Betting
- Pre-battle odds calculated from fighter stats
- Bet placement UI (NIP-57 Zap settlement — UI ready, full flow coming)
- No house edge, no central server

### Nostr Integration
- **Login** via NIP-07 browser extension, NIP-46 bunker, or nsec
- **Publish battle results** as signed kind 3633 events (tap "Publish to Nostr" after any fight)
- All published battles are publicly verifiable on-chain
- NIP-31 `alt` tags for client compatibility
- See [NIP.md](./NIP.md) for custom event schema

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript, Vite |
| Styling | TailwindCSS 3, shadcn/ui |
| Nostr | Nostrify, nostr-tools |
| Data | TanStack Query |
| Fonts | Inter Variable, Press Start 2P |
| Storage | localStorage (leaderboard, history) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Run Locally

```bash
git clone https://github.com/NostrDanish/Relay-Battle.git
cd Relay-Battle
npm install
npm run dev
```

Open http://localhost:8080

### Build for Production

```bash
npm run build
# Output in dist/
```

---

## Project Structure

```
src/
├── lib/
│   ├── battleEngine.ts     # Core battle simulator + all 22 special moves
│   ├── relayStats.ts       # NIP-11 fetching, stat mapping, fallback generation
│   └── relayPortrait.ts    # Procedural relay portrait/gradient generator
├── hooks/
│   ├── useRelayFighters.ts # TanStack Query hook for relay data
│   ├── useLeaderboard.ts   # ELO leaderboard with localStorage
│   └── useBattlePublish.ts # Nostr kind 3633 event publishing
├── components/
│   ├── Arena.tsx           # Main battle view with HP bars, countdown, controls
│   ├── FighterCard.tsx     # Relay stat card with grades and NIP badges
│   ├── BattleLog.tsx       # Animated tick-by-tick combat log
│   ├── RelayPicker.tsx     # Searchable relay selection with stat preview
│   ├── BettingPanel.tsx    # P2P odds and bet placement UI
│   ├── Leaderboard.tsx     # ELO rankings table
│   ├── TournamentBracket.tsx # Auto-simulating bracket view
│   ├── BattleHistory.tsx   # Past battles with rematch option
│   └── SpecialMoves.tsx    # All 22 moves reference card
└── pages/
    └── Index.tsx           # Main page, tab routing
```

---

## Nostr Event Kinds

Custom kinds used by this app — see [NIP.md](./NIP.md) for full schema.

| Kind | Type | Description |
|------|------|-------------|
| `3633` | Regular | Battle result events |
| `32171` | Addressable | Global leaderboard |

Published events are tagged with `t: relay-arena` for discoverability.

---

## Data Sources

Relay stats are pulled from:

1. **NIP-11 Relay Information Document** — fetched live via CORS proxy from each relay's HTTP endpoint. Provides: name, supported NIPs, auth/PoW/payment requirements, write restrictions, icon.

2. **Deterministic fallback** — when NIP-11 is unavailable, stats are generated deterministically from the URL hash. Same URL always produces the same fighter, so battles are reproducible.

The 16 featured relays are:

```
wss://relay.damus.io        wss://relay.primal.net
wss://nos.lol               wss://relay.nostr.band
wss://relay.snort.social    wss://nostr.wine
wss://relay.mostr.pub       wss://relay.ditto.pub
wss://nostr.fmt.wiz.biz     wss://relay.nostr.bg
wss://nostr-pub.wellorder.net  wss://relay.current.fyi
wss://eden.nostr.land       wss://nostr.oxtr.dev
wss://relay.nostr.wirednet.jp  wss://offchain.pub
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to get involved.

---

## License

MIT — see [LICENSE](./LICENSE)

---

## Acknowledgements

- Built with [Shakespeare](https://shakespeare.diy) — AI-powered Nostr app builder
- Relay data from [nostr.watch](https://nostr.watch) and NIP-11 documents
- Fonts: [Inter](https://rsms.me/inter/) and [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Nostr protocol: [nostr.com](https://nostr.com)

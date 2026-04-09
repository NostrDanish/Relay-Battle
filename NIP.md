# Relay Arena Custom NIP

## Battle Result Events (kind 3633)

Regular event used to publish battle results and tick-by-tick battle logs.

### Event Structure

```json
{
  "kind": 3633,
  "content": "<JSON stringified battle log>",
  "tags": [
    ["d", "<battle-id>"],
    ["alt", "Relay Arena battle result: <relay-a> vs <relay-b>"],
    ["t", "relay-arena"],
    ["t", "battle"],
    ["r", "<relay-a-url>"],
    ["r", "<relay-b-url>"],
    ["winner", "<winning-relay-url>"],
    ["format", "1v1|koth|tournament|ffa"],
    ["ticks", "<total-ticks>"]
  ]
}
```

### Content JSON Schema

```json
{
  "battleId": "string",
  "format": "1v1 | koth | tournament | ffa",
  "startedAt": "unix-timestamp",
  "endedAt": "unix-timestamp",
  "fighters": [
    {
      "url": "wss://relay.example.com",
      "name": "string",
      "stats": {
        "speed": 0-100,
        "toughness": 0-150,
        "defense": 0-100,
        "power": 0-100,
        "hp": "number",
        "maxHp": "number"
      },
      "finalHp": "number"
    }
  ],
  "winner": "relay-url | null",
  "log": [
    {
      "tick": "number",
      "actor": "relay-url",
      "action": "attack | special | heal | effect",
      "message": "string",
      "damage": "number | undefined",
      "heal": "number | undefined",
      "hpSnapshot": {
        "<relay-url>": "number"
      }
    }
  ]
}
```

## Battle Leaderboard (kind 32171)

Addressable event for tracking relay win/loss records. Published by the app operator.

### Event Structure

```json
{
  "kind": 32171,
  "content": "<JSON stringified leaderboard data>",
  "tags": [
    ["d", "relay-arena-leaderboard"],
    ["alt", "Relay Arena leaderboard"],
    ["t", "relay-arena"],
    ["t", "leaderboard"]
  ]
}
```

### Content JSON Schema

```json
{
  "updatedAt": "unix-timestamp",
  "entries": [
    {
      "url": "wss://relay.example.com",
      "name": "string",
      "wins": "number",
      "losses": "number",
      "draws": "number",
      "elo": "number"
    }
  ]
}
```

## Data Sources

- **NIP-66** (kind 30166): Relay discovery events for RTT, supported NIPs, uptime, geo data
- **NIP-11**: Relay information documents for capabilities and restrictions
- **nostr.watch API**: Additional relay monitoring data (used via CORS proxy)

## Stat Mapping

Fighter stats are derived from real relay performance data:

| Stat       | Source                                    | Formula                                          |
|------------|-------------------------------------------|--------------------------------------------------|
| SPEED      | RTT (round-trip time in ms)               | `min(100, max(0, 100 - (rtt / 20)))`             |
| TOUGHNESS  | Uptime percentage                         | `uptime * 1.2`                                   |
| DEFENSE    | Trust/quality score, reliability           | `reliability * 0.8 + (hasAuth ? 10 : 0)`         |
| POWER      | Supported NIPs count + rare NIP bonuses   | `min(100, nipCount * 3 + rareNipBonus)`           |
| HP         | Composite                                 | `80 + (uptime * 0.8) + (defense * 0.4)`          |

### Modifiers

- Payment required: +10 Defense, -5 Speed
- PoW required: +15 Defense, -5 Speed  
- Write restrictions: +10 Defense, -3 Speed
- Geo match: +15 all stats (home-field advantage)
- LastSeen freshness: Momentum bonus up to +10 Speed

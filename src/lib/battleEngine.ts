/**
 * Relay Arena Battle Engine
 * 
 * Core simulation engine where Nostr relays fight using their real performance stats.
 * All 22 special moves are implemented as automatic triggers based on stats/NIPs.
 */

// --- Types ---

export interface RelayStats {
  url: string;
  name: string;
  speed: number;       // 0-100 (from RTT)
  toughness: number;   // HP modifier (from uptime)
  defense: number;     // 0-100 (from reliability/trust)
  power: number;       // 0-100 (from supported NIPs)
  supportedNips: number[];
  uptime: number;      // 0-100
  reliability: number; // 0-100
  hasPaymentReq: boolean;
  hasPowReq: boolean;
  hasWriteRestriction: boolean;
  hasAuth: boolean;
  geoRegion?: string;
  lastSeen: number;
  favicon?: string;
  countryCode?: string;
}

export interface BattleLogEntry {
  tick: number;
  actor: string;
  actorUrl: string;
  action: 'attack' | 'special' | 'heal' | 'effect' | 'dodge' | 'reflect';
  message: string;
  emoji: string;
  damage?: number;
  heal?: number;
  hpSnapshot: Record<string, number>;
}

export interface BattleResult {
  battleId: string;
  format: 'quickduel' | 'koth' | 'tournament' | 'ffa';
  startedAt: number;
  endedAt: number;
  fighters: FighterSnapshot[];
  winner: string | null; // relay URL
  log: BattleLogEntry[];
  totalTicks: number;
}

export interface FighterSnapshot {
  url: string;
  name: string;
  stats: {
    speed: number;
    toughness: number;
    defense: number;
    power: number;
    hp: number;
    maxHp: number;
  };
  finalHp: number;
}

// --- Fighter Class ---

export class RelayFighter {
  stats: RelayStats;
  hp: number;
  maxHp: number;
  initiative: number;  // ATB-style: accumulates speed each tick
  effects: Map<string, number | boolean>;  // active buffs/debuffs
  
  // One-time use trackers
  lastStandUsed: boolean;
  premiumPaywallUsed: boolean;
  giftWrapUsed: boolean;
  nwcSurgeUsed: boolean;
  writeLockdownUsed: boolean;
  blossomUsed: boolean;
  globalPingUsed: boolean;
  
  // Tracking
  totalDamageDealt: number;
  totalDamageReceived: number;
  specialMovesUsed: string[];

  constructor(stats: RelayStats) {
    this.stats = stats;
    this.maxHp = Math.floor(80 + (stats.uptime * 0.8) + (stats.defense * 0.4));
    this.hp = this.maxHp;
    this.initiative = 0;
    this.effects = new Map();
    this.lastStandUsed = false;
    this.premiumPaywallUsed = false;
    this.giftWrapUsed = false;
    this.nwcSurgeUsed = false;
    this.writeLockdownUsed = false;
    this.blossomUsed = false;
    this.globalPingUsed = false;
    this.totalDamageDealt = 0;
    this.totalDamageReceived = 0;
    this.specialMovesUsed = [];
  }

  getEffectiveSpeed(): number {
    let speed = this.stats.speed;
    if (this.effects.has('homeField')) speed += 15;
    if (this.effects.has('nwcAttackBuff')) speed += 15;
    return Math.min(100, speed);
  }

  getEffectiveDefense(): number {
    let defense = this.stats.defense;
    if (this.effects.has('homeField')) defense += 15;
    if (this.effects.has('authFortress')) defense += 35;
    if (this.effects.has('webOfTrustAura')) defense += 10;
    if (this.effects.has('moderatedMenace')) defense += 25;
    return Math.min(150, defense);
  }

  getEffectivePower(): number {
    let power = this.stats.power;
    if (this.effects.has('homeField')) power += 15;
    if (this.effects.has('nostrGroupsRally')) power += 20;
    return Math.min(120, power);
  }

  isAlive(): boolean {
    return this.hp > 0;
  }

  takeDamage(amount: number): number {
    const actual = Math.min(this.hp, Math.max(0, Math.floor(amount)));
    this.hp -= actual;
    this.totalDamageReceived += actual;
    return actual;
  }

  heal(amount: number): number {
    const actual = Math.min(this.maxHp - this.hp, Math.max(0, Math.floor(amount)));
    this.hp += actual;
    return actual;
  }
}

// --- Random utility with seeded support ---

function rand(): number {
  return Math.random();
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

// --- Damage Calculation ---

export function calculateBaseDamage(attacker: RelayFighter, defender: RelayFighter): number {
  const attackPower = attacker.getEffectiveSpeed() * 0.6;
  const defenseReduction = defender.getEffectiveDefense() * 0.3;
  let base = attackPower - defenseReduction;
  
  // Blitzkrieg bonus
  if (attacker.effects.has('blitzkrieg')) {
    base *= 1.3;
  }
  
  // Last Stand damage buff
  const lastStandBuff = attacker.effects.get('lastStandBuff');
  if (typeof lastStandBuff === 'number' && lastStandBuff > 0) {
    base += 40;
  }
  
  // NWC Attack buff
  if (attacker.effects.has('nwcAttackBuff')) {
    base += 15;
  }
  
  // Versatile Arsenal random buff
  const versatileBuff = attacker.effects.get('versatileArsenal');
  if (typeof versatileBuff === 'number') {
    base += versatileBuff;
  }
  
  // Nostr Groups Rally attack buff
  if (attacker.effects.has('nostrGroupsRally')) {
    base += 20;
  }
  
  base = Math.max(1, base);
  
  // 5% chaos roll
  const chaos = 0.95 + (rand() * 0.1);
  return Math.max(1, Math.floor(base * chaos));
}

// --- Special Moves ---
// All 22 special moves, triggered automatically based on stats

interface SpecialMoveResult {
  extraAttack: boolean;
  extraTurn: boolean;
  skipDefenderTurn: boolean;
  damageDealt: number;
  entries: BattleLogEntry[];
}

function createLogEntry(
  tick: number,
  fighter: RelayFighter,
  action: BattleLogEntry['action'],
  message: string,
  emoji: string,
  hpSnapshot: Record<string, number>,
  damage?: number,
  heal?: number,
): BattleLogEntry {
  return {
    tick,
    actor: fighter.stats.name,
    actorUrl: fighter.stats.url,
    action,
    message,
    emoji,
    damage,
    heal,
    hpSnapshot: { ...hpSnapshot },
  };
}

function getHpSnapshot(fighters: RelayFighter[]): Record<string, number> {
  const snapshot: Record<string, number> = {};
  for (const f of fighters) {
    snapshot[f.stats.url] = f.hp;
  }
  return snapshot;
}

export function processSpecialMoves(
  attacker: RelayFighter,
  defender: RelayFighter,
  allFighters: RelayFighter[],
  tick: number,
): SpecialMoveResult {
  const result: SpecialMoveResult = {
    extraAttack: false,
    extraTurn: false,
    skipDefenderTurn: false,
    damageDealt: 0,
    entries: [],
  };
  
  const s = attacker.stats;
  const snapshot = () => getHpSnapshot(allFighters);

  // =====================
  // SPEED DEMONS
  // =====================
  
  // 1. Lightning Strike (SPEED >= 90): 25% chance double attack
  if (s.speed >= 90 && rand() < 0.25) {
    result.extraAttack = true;
    attacker.specialMovesUsed.push('Lightning Strike');
    result.entries.push(createLogEntry(tick, attacker, 'special',
      `Lightning Strike! Double attack incoming!`, '⚡', snapshot()));
  }

  // 2. Hyper-Thread (SPEED >= 85 + NIP-50): 20% extra immediate action
  if (s.speed >= 85 && s.supportedNips.includes(50) && rand() < 0.20) {
    result.extraTurn = true;
    attacker.specialMovesUsed.push('Hyper-Thread');
    result.entries.push(createLogEntry(tick, attacker, 'special',
      `Hyper-Thread activated! NIP-50 search-powered extra action!`, '🧵', snapshot()));
  }

  // 3. Blitzkrieg (SPEED >= 95): First 3 ticks +30% damage
  if (s.speed >= 95 && tick <= 3 && !attacker.effects.has('blitzkrieg')) {
    attacker.effects.set('blitzkrieg', true);
    attacker.specialMovesUsed.push('Blitzkrieg');
    result.entries.push(createLogEntry(tick, attacker, 'effect',
      `BLITZKRIEG! First 3 ticks +30% damage!`, '💥', snapshot()));
  }
  if (tick > 3 && attacker.effects.has('blitzkrieg')) {
    attacker.effects.delete('blitzkrieg');
  }

  // =====================
  // TANK BRIGADE
  // =====================
  
  // 4. Iron Wall (TOUGHNESS >= 110): +15 HP regen every 3 ticks
  if (s.toughness >= 110 && tick % 3 === 0) {
    const healed = attacker.heal(15);
    if (healed > 0) {
      attacker.specialMovesUsed.push('Iron Wall');
      result.entries.push(createLogEntry(tick, attacker, 'heal',
        `Iron Wall! Regenerated ${healed} HP!`, '🛡️', snapshot(), undefined, healed));
    }
  }

  // 5. Premium Paywall (Payment req + Defense >= 70): Once, absorb 50 damage
  if (s.hasPaymentReq && s.defense >= 70 && !attacker.premiumPaywallUsed) {
    attacker.premiumPaywallUsed = true;
    attacker.effects.set('premiumPaywall', 50);
    attacker.specialMovesUsed.push('Premium Paywall');
    result.entries.push(createLogEntry(tick, attacker, 'effect',
      `Premium Paywall activated! Next 50 damage absorbed!`, '💰', snapshot()));
  }

  // 6. Auth Fortress (NIP-42): First 5 ticks +35 Defense
  if (s.hasAuth && tick <= 5 && !attacker.effects.has('authFortress')) {
    attacker.effects.set('authFortress', true);
    attacker.specialMovesUsed.push('Auth Fortress');
    result.entries.push(createLogEntry(tick, attacker, 'effect',
      `AUTH FORTRESS! kind:22242 challenge-response activated! +35 Defense for 5 ticks!`, '🔐', snapshot()));
  }
  if (tick > 5 && attacker.effects.has('authFortress')) {
    attacker.effects.delete('authFortress');
  }

  // =====================
  // NIP WIZARDS
  // =====================
  
  // 7. Versatile Arsenal (12+ NIPs): Random minor buff each tick
  if (s.supportedNips.length >= 12 && rand() < 0.30) {
    const buff = randInt(5, 15);
    attacker.effects.set('versatileArsenal', buff);
    attacker.specialMovesUsed.push('Versatile Arsenal');
    result.entries.push(createLogEntry(tick, attacker, 'effect',
      `Versatile Arsenal! ${s.supportedNips.length} NIPs power +${buff} random buff!`, '🎲', snapshot()));
  } else {
    attacker.effects.delete('versatileArsenal');
  }

  // 8. Gift-Wrap Ambush (NIP-59): Once, untargetable 2 ticks
  if (s.supportedNips.includes(59) && !attacker.giftWrapUsed && attacker.hp < attacker.maxHp * 0.6 && rand() < 0.4) {
    attacker.giftWrapUsed = true;
    attacker.effects.set('untargetable', 2);
    attacker.specialMovesUsed.push('Gift-Wrap Ambush');
    result.entries.push(createLogEntry(tick, attacker, 'special',
      `Gift-Wrap Ambush! NIP-59 sealed wrapper — untargetable for 2 ticks!`, '🎁', snapshot()));
  }

  // 9. Zap Counter (NIP-57): 30% chance reflect 20% damage + 10 HP heal
  if (s.supportedNips.includes(57) && rand() < 0.30) {
    const baseDmg = calculateBaseDamage(attacker, defender);
    const reflectDmg = Math.floor(baseDmg * 0.2);
    const actualReflect = defender.takeDamage(reflectDmg);
    result.damageDealt += actualReflect;
    const healed = attacker.heal(10);
    attacker.specialMovesUsed.push('Zap Counter');
    result.entries.push(createLogEntry(tick, attacker, 'reflect',
      `ZAP COUNTER! ⚡ kind:9734 → kind:9735 — reflected ${actualReflect} damage + healed ${healed} HP!`,
      '⚡', snapshot(), actualReflect, healed));
  }

  // 10. Blossom Bloom (Blossom / search relays list): Once, heal 40 HP
  if ((s.supportedNips.includes(96) || s.supportedNips.includes(10007)) && !attacker.blossomUsed && attacker.hp < attacker.maxHp * 0.7) {
    attacker.blossomUsed = true;
    const healed = attacker.heal(40);
    attacker.specialMovesUsed.push('Blossom Bloom');
    result.entries.push(createLogEntry(tick, attacker, 'heal',
      `BLOSSOM BLOOM! 🌸 Media server healing aura restores ${healed} HP!`,
      '🌸', snapshot(), undefined, healed));
  }

  // 11. Ephemeral Evade (NIP-37 Draft): 20% dodge one attack (passive, set as effect)
  if (s.supportedNips.includes(37)) {
    attacker.effects.set('ephemeralEvade', true);
  }

  // =====================
  // RESTRICTION RENEGADES
  // =====================
  
  // 12. PoW Fortress (PoW req): Passive 15% damage reflection
  if (s.hasPowReq && rand() < 0.40) {
    const reflectDmg = Math.floor(calculateBaseDamage(defender, attacker) * 0.15);
    if (reflectDmg > 0) {
      const actualReflect = defender.takeDamage(reflectDmg);
      result.damageDealt += actualReflect;
      attacker.specialMovesUsed.push('PoW Fortress');
      result.entries.push(createLogEntry(tick, attacker, 'reflect',
        `PoW Fortress! NIP-13 mining shield reflects ${actualReflect} damage!`,
        '⛏️', snapshot(), actualReflect));
    }
  }

  // 13. Censorship Rebel (no restrictions + low trust < 50): 20% ignore Defense
  if (!s.hasPaymentReq && !s.hasPowReq && !s.hasWriteRestriction && !s.hasAuth &&
      s.reliability < 50 && rand() < 0.20) {
    const rawDmg = Math.floor(attacker.getEffectiveSpeed() * 1.2);
    const actualDmg = defender.takeDamage(rawDmg);
    result.damageDealt += actualDmg;
    attacker.specialMovesUsed.push('Censorship Rebel');
    result.entries.push(createLogEntry(tick, attacker, 'special',
      `CENSORSHIP REBEL! Open relay chaos — ignores defense for ${actualDmg} damage!`,
      '🔥', snapshot(), actualDmg));
  }

  // 14. Write Lockdown (restricted writes): Once, silence opponent 1 tick
  if (s.hasWriteRestriction && !attacker.writeLockdownUsed && rand() < 0.35) {
    attacker.writeLockdownUsed = true;
    result.skipDefenderTurn = true;
    attacker.specialMovesUsed.push('Write Lockdown');
    result.entries.push(createLogEntry(tick, attacker, 'effect',
      `WRITE LOCKDOWN! Restricted write policy silences opponent for 1 tick!`,
      '🔒', snapshot()));
  }

  // 15. Moderated Menace: +25 Defense but occasional self-skip
  if (s.hasWriteRestriction && s.hasAuth) {
    if (!attacker.effects.has('moderatedMenace')) {
      attacker.effects.set('moderatedMenace', true);
      attacker.specialMovesUsed.push('Moderated Menace');
      result.entries.push(createLogEntry(tick, attacker, 'effect',
        `Moderated Menace aura! +25 Defense but may self-skip...`,
        '👮', snapshot()));
    }
    // 15% chance to self-skip
    if (rand() < 0.15) {
      result.entries.push(createLogEntry(tick, attacker, 'effect',
        `Moderation overhead! Self-skip this tick.`,
        '⏳', snapshot()));
      return result; // Return early, effectively skipping this fighter's attack
    }
  }

  // =====================
  // PAYMENT & WALLET MASTERS
  // =====================
  
  // 16. NWC Surge (NIP-47): Once, +60 HP heal (10% chance +15 Attack for 2 ticks)
  if (s.supportedNips.includes(47) && !attacker.nwcSurgeUsed && attacker.hp < attacker.maxHp * 0.65) {
    attacker.nwcSurgeUsed = true;
    const healed = attacker.heal(60);
    attacker.specialMovesUsed.push('NWC Surge');
    result.entries.push(createLogEntry(tick, attacker, 'heal',
      `NWC SURGE! 💸 kind:13194 info → kind:23194/23195 encrypted flow (NIP-44 v2: ECDH + HKDF + ChaCha20-Poly1305) — healed ${healed} HP!`,
      '💸', snapshot(), undefined, healed));
    
    if (rand() < 0.10) {
      attacker.effects.set('nwcAttackBuff', 2);
      result.entries.push(createLogEntry(tick, attacker, 'effect',
        `NWC BONUS! Wallet power surge: +15 Attack for 2 ticks!`,
        '🔋', snapshot()));
    }
  }

  // 17. Cashu Shield (NIP-60): 25% chance negate next damage
  if (s.supportedNips.includes(60) && rand() < 0.25) {
    attacker.effects.set('cashuShield', true);
    attacker.specialMovesUsed.push('Cashu Shield');
    result.entries.push(createLogEntry(tick, attacker, 'effect',
      `CASHU SHIELD! NIP-60 ecash token absorbs next hit!`,
      '🟡', snapshot()));
  }

  // =====================
  // GEO & EPIC
  // =====================
  
  // 18. Home-Field Surge: Geo match = +15 all stats (applied via effects)
  if (s.geoRegion && !attacker.effects.has('homeField')) {
    // Home field is checked by the battle orchestrator setting geoRegion
    // For now, this is always applied if geoRegion is set
    attacker.effects.set('homeField', true);
    attacker.specialMovesUsed.push('Home-Field Surge');
    result.entries.push(createLogEntry(tick, attacker, 'effect',
      `HOME-FIELD SURGE! ${s.geoRegion} advantage — +15 all stats!`,
      '🏠', snapshot()));
  }

  // 19. Global Ping: Steal initiative once
  if (!attacker.globalPingUsed && rand() < 0.15 && tick > 3) {
    attacker.globalPingUsed = true;
    attacker.initiative += 50; // Big initiative boost
    attacker.specialMovesUsed.push('Global Ping');
    result.entries.push(createLogEntry(tick, attacker, 'special',
      `GLOBAL PING! 🌐 Initiative stolen — attacking first next round!`,
      '🌐', snapshot()));
  }

  // 20. Last Stand (HP < 25% + reliability >= 80): One-time +80 HP and +40 damage for 3 ticks
  if (attacker.hp < attacker.maxHp * 0.25 && s.reliability >= 80 && !attacker.lastStandUsed) {
    attacker.lastStandUsed = true;
    const healed = attacker.heal(80);
    attacker.effects.set('lastStandBuff', 3);
    attacker.specialMovesUsed.push('Last Stand');
    result.entries.push(createLogEntry(tick, attacker, 'special',
      `LAST STAND! 🔥 High reliability = iron will! +${healed} HP and +40 damage for 3 ticks!`,
      '🔥', snapshot(), undefined, healed));
  }

  // 21. Web-of-Trust Aura: Passive ally +10 Defense (in team battles, applied to self too)
  if (s.reliability >= 70 && rand() < 0.20 && !attacker.effects.has('webOfTrustAura')) {
    attacker.effects.set('webOfTrustAura', true);
    attacker.specialMovesUsed.push('Web-of-Trust Aura');
    result.entries.push(createLogEntry(tick, attacker, 'effect',
      `Web-of-Trust Aura! Trusted reputation grants +10 Defense!`,
      '🤝', snapshot()));
  }

  // 22. Nostr Groups Rally (NIP-29): Team buff +20 Attack
  if (s.supportedNips.includes(29) && rand() < 0.25 && !attacker.effects.has('nostrGroupsRally')) {
    attacker.effects.set('nostrGroupsRally', true);
    attacker.specialMovesUsed.push('Nostr Groups Rally');
    result.entries.push(createLogEntry(tick, attacker, 'effect',
      `NOSTR GROUPS RALLY! 📢 NIP-29 group coordination — +20 Attack!`,
      '📢', snapshot()));
  }

  return result;
}

// --- Apply defensive effects when taking damage ---

export function applyDefensiveEffects(
  defender: RelayFighter,
  incomingDamage: number,
  allFighters: RelayFighter[],
  tick: number,
): { finalDamage: number; entries: BattleLogEntry[] } {
  let damage = incomingDamage;
  const entries: BattleLogEntry[] = [];
  const snapshot = () => getHpSnapshot(allFighters);

  // Premium Paywall absorption
  const paywallAbsorb = defender.effects.get('premiumPaywall');
  if (typeof paywallAbsorb === 'number' && paywallAbsorb > 0) {
    const absorbed = Math.min(damage, paywallAbsorb);
    damage -= absorbed;
    const remaining = paywallAbsorb - absorbed;
    if (remaining <= 0) {
      defender.effects.delete('premiumPaywall');
    } else {
      defender.effects.set('premiumPaywall', remaining);
    }
    entries.push(createLogEntry(tick, defender, 'effect',
      `Premium Paywall absorbs ${absorbed} damage! (${remaining} shield remaining)`,
      '💰', snapshot()));
  }

  // Cashu Shield
  if (defender.effects.get('cashuShield') === true) {
    defender.effects.delete('cashuShield');
    entries.push(createLogEntry(tick, defender, 'dodge',
      `CASHU SHIELD negates the attack!`,
      '🟡', snapshot()));
    return { finalDamage: 0, entries };
  }

  // Ephemeral Evade (20% dodge)
  if (defender.effects.has('ephemeralEvade') && rand() < 0.20) {
    entries.push(createLogEntry(tick, defender, 'dodge',
      `Ephemeral Evade! 👻 NIP-37 draft status — dodged the attack!`,
      '👻', snapshot()));
    return { finalDamage: 0, entries };
  }

  // Untargetable from Gift-Wrap
  const untargetable = defender.effects.get('untargetable');
  if (typeof untargetable === 'number' && untargetable > 0) {
    defender.effects.set('untargetable', untargetable - 1);
    if (untargetable - 1 <= 0) defender.effects.delete('untargetable');
    entries.push(createLogEntry(tick, defender, 'dodge',
      `Gift-Wrap shield! Untargetable! (${untargetable - 1} ticks remaining)`,
      '🎁', snapshot()));
    return { finalDamage: 0, entries };
  }

  return { finalDamage: Math.max(0, Math.floor(damage)), entries };
}

// --- Tick down temporary effects ---

function tickDownEffects(fighter: RelayFighter): void {
  // Last Stand buff countdown
  const lastStandBuff = fighter.effects.get('lastStandBuff');
  if (typeof lastStandBuff === 'number') {
    if (lastStandBuff <= 1) {
      fighter.effects.delete('lastStandBuff');
    } else {
      fighter.effects.set('lastStandBuff', lastStandBuff - 1);
    }
  }

  // NWC Attack buff countdown
  const nwcBuff = fighter.effects.get('nwcAttackBuff');
  if (typeof nwcBuff === 'number') {
    if (nwcBuff <= 1) {
      fighter.effects.delete('nwcAttackBuff');
    } else {
      fighter.effects.set('nwcAttackBuff', nwcBuff - 1);
    }
  }
}

// --- Main Battle Simulation ---

export function simulateBattle(
  relayA: RelayStats,
  relayB: RelayStats,
  options: { maxTicks?: number; format?: BattleResult['format'] } = {},
): BattleResult {
  const { maxTicks = 100, format = 'quickduel' } = options;
  const battleId = `battle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  const fighterA = new RelayFighter(relayA);
  const fighterB = new RelayFighter(relayB);
  const allFighters = [fighterA, fighterB];
  
  const log: BattleLogEntry[] = [];
  const startedAt = Math.floor(Date.now() / 1000);
  
  // Opening log
  log.push(createLogEntry(0, fighterA, 'effect',
    `${relayA.name} enters the arena! HP: ${fighterA.maxHp} | SPD: ${relayA.speed} | DEF: ${relayA.defense} | PWR: ${relayA.power}`,
    '⚔️', getHpSnapshot(allFighters)));
  log.push(createLogEntry(0, fighterB, 'effect',
    `${relayB.name} enters the arena! HP: ${fighterB.maxHp} | SPD: ${relayB.speed} | DEF: ${relayB.defense} | PWR: ${relayB.power}`,
    '⚔️', getHpSnapshot(allFighters)));

  let tick = 0;
  
  while (fighterA.isAlive() && fighterB.isAlive() && tick < maxTicks) {
    tick++;
    
    // ATB-style initiative: accumulate speed
    fighterA.initiative += fighterA.getEffectiveSpeed();
    fighterB.initiative += fighterB.getEffectiveSpeed();
    
    // Determine turn order
    const turnOrder: RelayFighter[] = fighterA.initiative >= fighterB.initiative
      ? [fighterA, fighterB]
      : [fighterB, fighterA];
    
    for (const attacker of turnOrder) {
      const defender = attacker === fighterA ? fighterB : fighterA;
      
      if (!attacker.isAlive() || !defender.isAlive()) continue;
      
      // Reset initiative for the one acting
      attacker.initiative = 0;
      
      // Process special moves (pre-attack phase)
      const specials = processSpecialMoves(attacker, defender, allFighters, tick);
      log.push(...specials.entries);
      
      if (!defender.isAlive()) break;
      
      // Main attack
      const baseDamage = calculateBaseDamage(attacker, defender);
      const { finalDamage, entries: defEntries } = applyDefensiveEffects(defender, baseDamage, allFighters, tick);
      log.push(...defEntries);
      
      if (finalDamage > 0) {
        const actualDmg = defender.takeDamage(finalDamage);
        attacker.totalDamageDealt += actualDmg;
        log.push(createLogEntry(tick, attacker, 'attack',
          `attacks for ${actualDmg} damage! (${defender.stats.name}: ${defender.hp}/${defender.maxHp} HP)`,
          '⚔️', getHpSnapshot(allFighters), actualDmg));
      }
      
      // Extra attack from Lightning Strike
      if (specials.extraAttack && defender.isAlive()) {
        const extraDmg = calculateBaseDamage(attacker, defender);
        const { finalDamage: extraFinal, entries: extraDefEntries } = applyDefensiveEffects(defender, extraDmg, allFighters, tick);
        log.push(...extraDefEntries);
        if (extraFinal > 0) {
          const actualExtra = defender.takeDamage(extraFinal);
          attacker.totalDamageDealt += actualExtra;
          log.push(createLogEntry(tick, attacker, 'attack',
            `Lightning Strike follow-up! ${actualExtra} more damage!`,
            '⚡', getHpSnapshot(allFighters), actualExtra));
        }
      }
      
      // Skip defender turn from Write Lockdown
      if (specials.skipDefenderTurn) {
        defender.initiative = -10; // Penalize initiative
      }
      
      // Tick down effects
      tickDownEffects(attacker);
      
      if (!defender.isAlive()) {
        log.push(createLogEntry(tick, defender, 'effect',
          `${defender.stats.name} has been DEFEATED!`,
          '💀', getHpSnapshot(allFighters)));
        break;
      }
    }
  }

  // Determine winner
  let winner: string | null = null;
  if (fighterA.isAlive() && !fighterB.isAlive()) {
    winner = relayA.url;
  } else if (fighterB.isAlive() && !fighterA.isAlive()) {
    winner = relayB.url;
  } else if (fighterA.hp > fighterB.hp) {
    winner = relayA.url;
  } else if (fighterB.hp > fighterA.hp) {
    winner = relayB.url;
  }

  const winnerName = winner === relayA.url ? relayA.name : winner === relayB.url ? relayB.name : 'Nobody';
  log.push(createLogEntry(tick, winner === relayA.url ? fighterA : fighterB, 'effect',
    winner ? `🏆 ${winnerName} WINS after ${tick} ticks!` : `Draw after ${tick} ticks!`,
    '🏆', getHpSnapshot(allFighters)));

  return {
    battleId,
    format,
    startedAt,
    endedAt: Math.floor(Date.now() / 1000),
    fighters: [
      {
        url: relayA.url,
        name: relayA.name,
        stats: {
          speed: relayA.speed,
          toughness: relayA.toughness,
          defense: relayA.defense,
          power: relayA.power,
          hp: fighterA.maxHp,
          maxHp: fighterA.maxHp,
        },
        finalHp: fighterA.hp,
      },
      {
        url: relayB.url,
        name: relayB.name,
        stats: {
          speed: relayB.speed,
          toughness: relayB.toughness,
          defense: relayB.defense,
          power: relayB.power,
          hp: fighterB.maxHp,
          maxHp: fighterB.maxHp,
        },
        finalHp: fighterB.hp,
      },
    ],
    winner,
    log,
    totalTicks: tick,
  };
}

// --- Calculate pre-battle odds ---

export function calculateOdds(relayA: RelayStats, relayB: RelayStats): { a: number; b: number } {
  const scoreA = relayA.speed * 0.3 + relayA.defense * 0.25 + relayA.power * 0.2 + relayA.toughness * 0.15 + relayA.reliability * 0.1;
  const scoreB = relayB.speed * 0.3 + relayB.defense * 0.25 + relayB.power * 0.2 + relayB.toughness * 0.15 + relayB.reliability * 0.1;
  const total = scoreA + scoreB;
  return {
    a: Math.round((scoreA / total) * 100),
    b: Math.round((scoreB / total) * 100),
  };
}

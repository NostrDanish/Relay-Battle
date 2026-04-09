/**
 * Procedural Relay Portrait Generator
 * 
 * Creates unique visual identities for relays based on their URL hash.
 */

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededColor(seed: number, index: number): string {
  const hue = ((seed * (index + 1) * 137) % 360);
  const sat = 60 + ((seed * (index + 2)) % 30);
  const light = 40 + ((seed * (index + 3)) % 25);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

export interface RelayPortrait {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradient: string;
  glowColor: string;
  emoji: string;
  pattern: 'circles' | 'diamonds' | 'waves' | 'grid' | 'hexagons';
}

const FIGHTER_EMOJIS = [
  '⚔️', '🗡️', '🛡️', '🏹', '🔱', '⚡', '🔥', '💀',
  '🐉', '🦁', '🐺', '🦅', '🎯', '💎', '👑', '🌟',
];

const PATTERNS: RelayPortrait['pattern'][] = ['circles', 'diamonds', 'waves', 'grid', 'hexagons'];

export function generatePortrait(url: string): RelayPortrait {
  const hash = hashCode(url);
  
  return {
    primaryColor: seededColor(hash, 0),
    secondaryColor: seededColor(hash, 1),
    accentColor: seededColor(hash, 2),
    gradient: `linear-gradient(135deg, ${seededColor(hash, 0)}, ${seededColor(hash, 1)}, ${seededColor(hash, 2)})`,
    glowColor: seededColor(hash, 0),
    emoji: FIGHTER_EMOJIS[hash % FIGHTER_EMOJIS.length],
    pattern: PATTERNS[hash % PATTERNS.length],
  };
}

export function getCountryFlag(countryCode?: string): string {
  if (!countryCode) return '🌐';
  const code = countryCode.toUpperCase();
  const offset = 127397;
  const flag = [...code].map(c => String.fromCodePoint(c.charCodeAt(0) + offset)).join('');
  return flag;
}

// Generate a CSS gradient for battle backgrounds
export function getBattleGradient(urlA: string, urlB: string): string {
  const portraitA = generatePortrait(urlA);
  const portraitB = generatePortrait(urlB);
  return `linear-gradient(90deg, ${portraitA.primaryColor}22 0%, transparent 30%, transparent 70%, ${portraitB.primaryColor}22 100%)`;
}

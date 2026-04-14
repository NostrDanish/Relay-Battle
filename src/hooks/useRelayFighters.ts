import { useQuery } from '@tanstack/react-query';
import { POPULAR_RELAYS, generateDemoStats } from '@/lib/relayStats';
import type { RelayStats } from '@/lib/battleEngine';

async function fetchNIP11(relayUrl: string): Promise<RelayStats> {
  const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';
  try {
    const httpUrl = relayUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    const url = `${CORS_PROXY}${encodeURIComponent(httpUrl)}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/nostr+json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error('NIP-11 fetch failed');
    const text = await res.text();
    // Guard against non-JSON responses (HTML error pages, etc.)
    if (!text.startsWith('{')) throw new Error('Non-JSON response');
    const info = JSON.parse(text);

    const nips = info?.supported_nips ?? [];
    const hasAuth = info?.limitation?.auth_required ?? false;
    const hasPow = (info?.limitation?.min_pow_difficulty ?? 0) > 0;
    const hasPayment = info?.limitation?.payment_required ?? false;
    const hasWriteRestriction = info?.limitation?.restricted_writes ?? false;

    // Use demo stats as base but enhance with real NIP-11 data
    const base = generateDemoStats(relayUrl);
    return {
      ...base,
      name: info?.name || base.name,
      supportedNips: nips.length > 0 ? nips : base.supportedNips,
      hasAuth: hasAuth || base.hasAuth,
      hasPowReq: hasPow || base.hasPowReq,
      hasPaymentReq: hasPayment || base.hasPaymentReq,
      hasWriteRestriction: hasWriteRestriction || base.hasWriteRestriction,
      favicon: info?.icon || base.favicon,
      // Recalculate power based on real NIPs
      power: Math.min(100, (nips.length > 0 ? nips.length : base.supportedNips.length) * 3 +
        nips.filter((n: number) => [42, 47, 57, 59, 60, 29, 50, 37, 96, 13].includes(n)).length * 5),
    };
  } catch {
    return generateDemoStats(relayUrl);
  }
}

export function useRelayFighters(relayUrls: string[] = POPULAR_RELAYS) {
  return useQuery<RelayStats[]>({
    queryKey: ['relay-fighters', relayUrls.join(',')],
    queryFn: async () => {
      // Fetch NIP-11 for all relays in parallel, falling back to demo stats
      const results = await Promise.allSettled(
        relayUrls.map((url) => fetchNIP11(url))
      );

      return results.map((result, i) => {
        if (result.status === 'fulfilled') return result.value;
        return generateDemoStats(relayUrls[i]);
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

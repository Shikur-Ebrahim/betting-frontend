export interface OddsValues {
  home: string | null;
  draw: string | null;
  away: string | null;
}

/**
 * Extracts the best possible 1x2 (Match Winner/Fulltime Result) odds from an API-Sports odds response.
 * It scans all bookmakers and markets to combine odds if necessary, prioritizing valid, non-suspended values.
 *
 * @param leagueData The odds object from the API response (e.g., data.response[0])
 * @returns OddsValues containing {home, draw, away} or null if no valid odds are found.
 */
export function extractBestOdds(leagueData: any): OddsValues | null {
  if (!leagueData) return null;

  const result: OddsValues = { home: null, draw: null, away: null };
  const targetNames = ['Match Winner', 'Fulltime Result', '1x2', '3-Way Result', '3way Result', 'Resultat final'];
  const targetIds = [1, 59, 12, 13, 14, 15]; // Including more common 1x2 market IDs

  // Helper to process a list of bets and update result
  const processBets = (bets: any[]) => {
    if (!Array.isArray(bets)) return;
    
    for (const bet of bets) {
      if (targetNames.includes(bet.name) || targetIds.includes(bet.id)) {
        if (!Array.isArray(bet.values)) continue;
        
        for (const v of bet.values) {
          if (v.suspended === true) continue;
          
          if (!result.home && (v.value === 'Home' || v.value === '1') && v.odd) {
            result.home = String(v.odd);
          }
          if (!result.draw && (v.value === 'Draw' || v.value === 'X' || v.value === 'Tie') && v.odd) {
            result.draw = String(v.odd);
          }
          if (!result.away && (v.value === 'Away' || v.value === '2') && v.odd) {
            result.away = String(v.odd);
          }
        }
      }

      // Fallback: accept any 3-way market with recognizable outcomes.
      if (Array.isArray(bet.values) && bet.values.length >= 3) {
        let homeVal: string | null = null;
        let drawVal: string | null = null;
        let awayVal: string | null = null;
        for (const v of bet.values) {
          const normalized = String(v.value || '').toLowerCase().trim();
          if (!homeVal && (normalized === 'home' || normalized === '1')) homeVal = v.odd ? String(v.odd) : null;
          if (!drawVal && (normalized === 'draw' || normalized === 'x' || normalized === 'tie')) drawVal = v.odd ? String(v.odd) : null;
          if (!awayVal && (normalized === 'away' || normalized === '2')) awayVal = v.odd ? String(v.odd) : null;
        }

        // If labels are not standard but market is 3-way, use positional fallback.
        if (!homeVal && !drawVal && !awayVal && bet.values[0]?.odd && bet.values[1]?.odd && bet.values[2]?.odd) {
          homeVal = String(bet.values[0].odd);
          drawVal = String(bet.values[1].odd);
          awayVal = String(bet.values[2].odd);
        }

        if (!result.home && homeVal) result.home = homeVal;
        if (!result.draw && drawVal) result.draw = drawVal;
        if (!result.away && awayVal) result.away = awayVal;
      }
      
      // Early exit if we found all three values
      if (result.home && result.draw && result.away) return;
    }
  };

  // Unified structure check: scan 'odds' and 'bookmakers' properties
  const bookmakers = leagueData.bookmakers || (Array.isArray(leagueData.odds) && typeof leagueData.odds[0]?.bets === 'undefined' ? null : null);
  // Actually, if leagueData.odds is an array of bets, use it. If it's an array of bookmakers, use it.
  
  if (Array.isArray(leagueData.odds)) {
    if (leagueData.odds.length > 0 && leagueData.odds[0].bets) {
      // It's a bookmaker array
      for (const bm of leagueData.odds) {
        processBets(bm.bets);
        if (result.home && result.draw && result.away) break;
      }
    } else {
      // It's a direct bets array (live odds)
      processBets(leagueData.odds);
    }
  }

  if (Array.isArray(leagueData.bookmakers) && !(result.home && result.draw && result.away)) {
    for (const bm of leagueData.bookmakers) {
      processBets(bm.bets);
      if (result.home && result.draw && result.away) break;
    }
  }

  // If we didn't find any valid odds at all, return null
  if (!result.home && !result.draw && !result.away) {
    console.warn(`[Odds Extractor] No valid 1x2 odds found. Target fixture odds data might be missing or suspended.`, {
      leagueData: JSON.stringify(leagueData).substring(0, 200) + '...' // Log snippet for debugging
    });
    return null;
  }

  return result;
}

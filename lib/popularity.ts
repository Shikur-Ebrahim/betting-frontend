/**
 * Match Popularity Utility v2
 * 
 * Determines which matches are "Trending" or "Popular" based on a scoring system.
 * Refined for robust live detection, team matching, and time-based ranking.
 */

// IDs for high-priority leagues (API-Sports IDs)
export const TOP_LEAGUES = [
  2,   // Champions League
  39,  // Premier League
  140, // La Liga
  135, // Serie A
  78,  // Bundesliga
  61,  // Ligue 1
  3,   // Europa League
  848, // Conference League
  1,   // World Cup
  4,   // Euro Cup
];

// Names of "Big Teams" to boost popularity
const BIG_TEAMS = [
  'Real Madrid', 'Barcelona', 'Manchester City', 'Man City', 'Liverpool', 'Arsenal', 
  'Manchester United', 'Man Utd', 'Bayern Munich', 'Paris Saint Germain', 'PSG', 'Juventus',
  'Inter', 'AC Milan', 'Chelsea', 'Tottenham', 'Borussia Dortmund', 'Atletico Madrid',
  'Al Nassr', 'Al-Hilal', 'Inter Miami', 'Bayer Leverkusen', 'Sporting CP', 'Porto',
  'Benfica', 'Ajax', 'PSV'
];

// Normalized big teams for robust matching
const NORM_BIG_TEAMS = BIG_TEAMS.map(n => n.toLowerCase().replace(/[^a-z0-9]/g, ''));

export interface PopularityWeights {
  live: number;
  topLeague: number;
  bigTeam: number;
  startingSoonMax: number;
}

const DEFAULT_WEIGHTS: PopularityWeights = {
  live: 1000, // Absolute priority
  topLeague: 100,
  bigTeam: 80,
  startingSoonMax: 60,
};

/**
 * Normalizes team names for comparison
 */
function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace('manchester', 'man')
    .replace('saint germain', 'sg')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Robust live status detection
 */
function isActuallyLive(status: string): boolean {
  const nonLiveStatuses = ['NS', 'FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO', 'TBD'];
  return !nonLiveStatuses.includes(status);
}

/**
 * Calculates a popularity score for a given match.
 */
export function calculatePopularity(match: any, weights: PopularityWeights = DEFAULT_WEIGHTS): number {
  let score = 0;

  const status = match.fixture.status.short;
  
  // 1. Exclude Finished / Cancelled early
  if (['FT', 'AET', 'PEN', 'CANC', 'ABD'].includes(status)) {
    return -9999;
  }

  // 2. Status Check (Live Boost)
  const isLive = isActuallyLive(status);
  if (isLive) score += weights.live;

  // 3. League Check
  if (TOP_LEAGUES.includes(match.league.id)) {
    score += weights.topLeague;
    
    // EXTRA BOOST for Elite Leagues
    if (match.league.id === 2) {
      score += 200; // Champions League - Highest Priority
    } else if (match.league.id === 39) {
      score += 150; // Premier League - Second Priority
    }
  }

  // 4. Advanced Big Team Check
  const homeNorm = normalizeName(match.teams.home.name);
  const awayNorm = normalizeName(match.teams.away.name);
  const hasBigTeam = NORM_BIG_TEAMS.some(btn => homeNorm.includes(btn) || awayNorm.includes(btn));
  if (hasBigTeam) score += weights.bigTeam;

  // 5. Gradient Proximity Check (Matches starting soon)
  const matchTime = new Date(match.fixture.date).getTime();
  const now = Date.now();
  const diffHours = (matchTime - now) / (1000 * 60 * 60);
  
  if (diffHours > 0 && diffHours <= 12) {
    // Linear decay: 12h = 0 boost, 0h = full boost
    const timeFactor = (12 - diffHours) / 12;
    score += weights.startingSoonMax * timeFactor;
  }

  // 6. Multiplier for Live + Big League/Team (Real "Trending" effect)
  if (isLive && (TOP_LEAGUES.includes(match.league.id) || hasBigTeam)) {
    score *= 1.5;
  }

  return score;
}

/**
 * Sorts a list of matches by popularity and returns a diverse top N.
 * Ensures that we don't just show matches from a single league.
 */
export function getPopularMatches(matches: any[], limit: number = 10): any[] {
  // 1. Calculate scores for all matches
  const scoredMatches = matches
    .map(match => ({
      ...match,
      popularityScore: calculatePopularity(match)
    }))
    .filter(m => m.popularityScore > -5000);

  // 2. Sort by score first
  scoredMatches.sort((a, b) => b.popularityScore - a.popularityScore);

  // 3. Diversification: Limit matches per league to ensure variety
  const diverseResults: any[] = [];
  const leagueCounts: Record<number, number> = {};
  const MAX_PER_LEAGUE = 2; // At most 2 matches from the same league unless we need more to fill the list

  // First pass: add top 2 from each league in order of overall score
  for (const match of scoredMatches) {
    const leagueId = match.league.id;
    leagueCounts[leagueId] = (leagueCounts[leagueId] || 0) + 1;

    if (leagueCounts[leagueId] <= MAX_PER_LEAGUE) {
      diverseResults.push(match);
    }
    
    if (diverseResults.length >= limit) break;
  }

  // Second pass: if we still have room, fill with the remaining highest scoring matches
  if (diverseResults.length < limit) {
    const usedIds = new Set(diverseResults.map(m => m.fixture.id));
    for (const match of scoredMatches) {
      if (!usedIds.has(match.fixture.id)) {
        diverseResults.push(match);
        if (diverseResults.length >= limit) break;
      }
    }
  }

  // 4. Final stable sort of the diverse list
  return diverseResults.sort((a, b) => {
    // Primary: Score
    if (b.popularityScore !== a.popularityScore) {
      return b.popularityScore - a.popularityScore;
    }
    // Tie-breaker: Live first
    const aLive = isActuallyLive(a.fixture.status.short);
    const bLive = isActuallyLive(b.fixture.status.short);
    if (aLive !== bLive) return bLive ? 1 : -1;
    // Tie-breaker: Kickoff
    return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
  });
}

/**
 * Football UI reads only from your backend (`/api/football/*`), which serves PostgreSQL.
 * API-Football runs on the server worker and updates the database — never from the browser.
 */
const LIVE_POLL_MS = 20000;
const FIXTURES_POLL_MS = 15000;
const ODDS_POLL_MS = 15000;
const ODDS_SINGLE_POLL_MS = 12000;
const LEAGUES_POLL_MS = 60000;
const TEAMS_POLL_MS = 30000;
const MATCH_POLL_MS = 10000;
const BUNDLE_POLL_MS = 15000;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json() as Promise<T>;
}

export function subscribeToLiveMatches(callback: (matches: Record<string, unknown>[]) => void) {
  const tick = async () => {
    try {
      const data = await fetchJson<{ matches: Record<string, unknown>[] }>('/api/football/live-matches');
      callback(data.matches || []);
    } catch (e) {
      console.error('subscribeToLiveMatches:', e);
    }
  };
  tick();
  const id = window.setInterval(tick, LIVE_POLL_MS);
  return () => window.clearInterval(id);
}

export function subscribeToFixtures(callback: (fixtures: Record<string, unknown>[]) => void) {
  const tick = async () => {
    try {
      const data = await fetchJson<{ response: Record<string, unknown>[] }>('/api/football/fixtures');
      callback(data.response || []);
    } catch (e) {
      console.error('subscribeToFixtures:', e);
    }
  };
  tick();
  const id = window.setInterval(tick, FIXTURES_POLL_MS);
  return () => window.clearInterval(id);
}

export function subscribeToLeagues(callback: (leagues: Record<string, unknown>[]) => void) {
  const tick = async () => {
    try {
      const data = await fetchJson<{ leagues: Record<string, unknown>[] }>('/api/football/config-leagues');
      callback(data.leagues || []);
    } catch (e) {
      console.error('subscribeToLeagues:', e);
    }
  };
  tick();
  const id = window.setInterval(tick, LEAGUES_POLL_MS);
  return () => window.clearInterval(id);
}

export function subscribeToLeagueTeams(
  leagueId: string | number,
  callback: (teams: unknown[]) => void
) {
  if (!leagueId) return () => {};

  const tick = async () => {
    try {
      const res = await fetch(`/api/football/teams?league=${encodeURIComponent(String(leagueId))}`);
      const data = await res.json();
      callback(Array.isArray(data.response) ? data.response : []);
    } catch (e) {
      console.error('subscribeToLeagueTeams:', e);
    }
  };
  tick();
  const id = window.setInterval(tick, TEAMS_POLL_MS);
  return () => window.clearInterval(id);
}

export function subscribeToOdds(
  fixtureId: string | number,
  callback: (odds: Record<string, unknown> | null) => void
) {
  if (!fixtureId) return () => {};

  const tick = async () => {
    try {
      const res = await fetch(`/api/football/odds/${encodeURIComponent(String(fixtureId))}`);
      if (res.status === 404) {
        callback(null);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      callback(data as Record<string, unknown>);
    } catch (e) {
      console.error('subscribeToOdds:', e);
    }
  };
  tick();
  const id = window.setInterval(tick, ODDS_SINGLE_POLL_MS);
  return () => window.clearInterval(id);
}

/** Full odds collection map — use for fixtures / live list views */
export function subscribeToOddsMap(callback: (odds: Record<string, Record<string, unknown>>) => void) {
  const tick = async () => {
    try {
      const data = await fetchJson<{ odds: Record<string, Record<string, unknown>> }>('/api/football/odds-map');
      callback(data.odds || {});
    } catch (e) {
      console.error('subscribeToOddsMap:', e);
    }
  };
  tick();
  const id = window.setInterval(tick, ODDS_POLL_MS);
  return () => window.clearInterval(id);
}

export function subscribeToOddsFixtureIds(callback: (ids: Set<string>) => void) {
  const tick = async () => {
    try {
      const data = await fetchJson<{ ids: string[] }>('/api/football/odds-ids');
      callback(new Set(data.ids || []));
    } catch (e) {
      console.error('subscribeToOddsFixtureIds:', e);
    }
  };
  tick();
  const id = window.setInterval(tick, ODDS_POLL_MS);
  return () => window.clearInterval(id);
}

export type FootballDataBundle = {
  liveMatches: Record<string, unknown>[];
  fixtures: Record<string, unknown>[];
  odds: Record<string, Record<string, unknown>>;
  oddsIds: string[];
  leagues: Record<string, unknown>[];
};

export function subscribeToDataBundle(callback: (bundle: FootballDataBundle) => void) {
  const tick = async () => {
    try {
      const data = await fetchJson<FootballDataBundle>('/api/football/data-bundle');
      callback(data);
    } catch (e) {
      console.error('subscribeToDataBundle:', e);
    }
  };
  tick();
  const id = window.setInterval(tick, BUNDLE_POLL_MS);
  return () => window.clearInterval(id);
}

export type MatchBundle = {
  match: Record<string, unknown> | null;
  odds: Record<string, unknown> | null;
  stats: unknown[];
  lineups: unknown[];
  h2h: unknown[];
  standings: unknown[];
};

export function subscribeToMatchDetail(
  matchId: string,
  callback: (bundle: MatchBundle) => void
) {
  if (!matchId) return () => {};

  const tick = async () => {
    try {
      const data = await fetchJson<MatchBundle>(`/api/football/match/${encodeURIComponent(matchId)}`);
      callback(data);
    } catch (e) {
      console.error('subscribeToMatchDetail:', e);
    }
  };
  tick();
  const id = window.setInterval(tick, MATCH_POLL_MS);
  return () => window.clearInterval(id);
}

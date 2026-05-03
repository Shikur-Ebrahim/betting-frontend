'use client';
import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import MatchCard from '../MatchCard';
import { useSearchParams } from 'next/navigation';
import PopularEvents from '../PopularEvents';
import { extractBestOdds, OddsValues } from '@/lib/odds';
import { subscribeToFixtures, subscribeToOddsMap } from '@/services/sportsData';

// Leagues to prioritize on the landing page (in display order)
const PRIORITY_LEAGUES = [
  { id: 2, name: 'UEFA Champions League' },
  { id: 39, name: 'England. Premier League' },
  { id: 140, name: 'Spain. La Liga' },
  { id: 135, name: 'Italy. Serie A' },
  { id: 78, name: 'Germany. Bundesliga' },
  { id: 61, name: 'France. Ligue 1' },
  { id: 3, name: 'UEFA Europa League' },
  { id: 848, name: 'UEFA Europa Conference League' },
  { id: 94, name: 'Portugal. Primeira Liga' },
  { id: 88, name: 'Netherlands. Eredivisie' },
];

// Collapsible league group component
function LeagueGroup({ leagueId, leagueName, leagueLogo, country, matches, oddsMap }: {
  leagueId: number;
  leagueName: string;
  leagueLogo: string;
  country: string;
  matches: any[];
  oddsMap: Record<number, OddsValues>;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div style={{ marginBottom: 2 }}>
      {/* League header row */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--accent)',
          padding: '8px 14px',
          cursor: 'pointer',
          userSelect: 'none',
          borderRadius: isOpen ? '6px 6px 0 0' : '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={leagueLogo}
            alt={leagueName}
            style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'contain', background: 'rgba(0,0,0,0.2)', padding: 1 }}
          />
          <Link
            href={`/fixtures?league=${leagueId}`}
            onClick={e => e.stopPropagation()}
            style={{ color: 'white', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}
          >
            Football. {country}. {leagueName}
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600 }}>1</span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600 }}>X</span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600 }}>2</span>
          <svg
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s', opacity: 0.9 }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {/* Match rows */}
      {isOpen && (
        <div style={{ borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
          {matches.map(m => (
            <MatchCard
              key={m.fixture.id}
              match={m}
              odds={oddsMap[m.fixture.id] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Collapsible country group component for See All view
function CountryGroup({ country, matches, oddsMap }: {
  country: string;
  matches: any[];
  oddsMap: Record<number, OddsValues>;
}) {
  const [isOpen, setIsOpen] = useState(true);

  // Group matches by league within the country
  const groupedByLeague = React.useMemo(() => {
    const grouped: Record<number, any[]> = {};
    matches.forEach(m => {
      const lid = m.league?.id;
      if (!grouped[lid]) grouped[lid] = [];
      grouped[lid].push(m);
    });
    return grouped;
  }, [matches]);

  return (
    <div style={{ marginBottom: 2 }}>
      {/* Country header row */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--accent)',
          padding: '10px 14px',
          cursor: 'pointer',
          userSelect: 'none',
          borderRadius: isOpen ? '6px 6px 0 0' : '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 24, 
            height: 24, 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: 12
          }}>
            🏳️
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
            {country}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
            ({matches.length} games)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600 }}>1</span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600 }}>X</span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600 }}>2</span>
          <svg
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s', opacity: 0.9 }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {/* League and match rows */}
      {isOpen && (
        <div style={{ borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
          {Object.entries(groupedByLeague).map(([leagueId, leagueMatches]) => {
            const sample = leagueMatches[0];
            return (
              <div key={leagueId} style={{ marginBottom: 1 }}>
                {/* League sub-header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 14px',
                    background: 'rgba(0,0,0,0.3)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div
                    style={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.2)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: 8,
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  >
                    {sample.league?.name ? sample.league.name.charAt(0).toUpperCase() : 'L'}
                  </div>
                  <Link
                    href={`/fixtures?league=${leagueId}`}
                    style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: 12, textDecoration: 'none' }}
                  >
                    {sample.league?.name || `League ${leagueId}`}
                  </Link>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
                    ({leagueMatches.length})
                  </span>
                </div>
                {/* Match rows for this league */}
                {leagueMatches.map(m => (
                  <MatchCard
                    key={m.fixture.id}
                    match={m}
                    odds={oddsMap[m.fixture.id] ?? null}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// Simple global cache to preserve data on back navigation
let fixturesCache: any[] = [];
let fixturesOddsCache: Record<number, OddsValues> = {};

function FixturesContent() {
  const searchParams = useSearchParams();
  const leagueId = searchParams?.get('league');
  const daysFilter = searchParams?.get('days') || '0';
  const viewMode = searchParams?.get('view'); // 'country' for See All view

  const [allMatches, setAllMatches] = useState<any[]>(fixturesCache);
  const [oddsMap, setOddsMap] = useState<Record<number, OddsValues>>(fixturesOddsCache);
  const [loading, setLoading] = useState(fixturesCache.length === 0);
  const urlQuery = searchParams?.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [allLeagues, setAllLeagues] = useState<any[]>([]);

  // Sync with URL
  useEffect(() => {
    setSearchQuery(urlQuery);
    setLocalSearch(urlQuery);
  }, [urlQuery]);

  const [localSearch, setLocalSearch] = useState(urlQuery);

  // Debounce global search fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch.length >= 2 || localSearch.length === 0) {
        setSearchQuery(localSearch);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/football/config-leagues');
        const data = await res.json();
        if (cancelled || !data.leagues) return;
        const list = data.leagues.map((l: any) => ({
          id: l.id,
          name: l.name,
          logo: l.logo
        }));
        setAllLeagues(list);
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const unsubFixtures = subscribeToFixtures((fixtures: any[]) => {
      setAllMatches(fixtures);
      fixturesCache = fixtures;
      setLoading(false);
    });

    const unsubOdds = subscribeToOddsMap((rawOdds) => {
      const newMap: Record<number, OddsValues> = {};
      Object.entries(rawOdds).forEach(([fid, doc]) => {
        const extracted = extractBestOdds(doc as Record<string, unknown>);
        if (extracted) newMap[Number(fid)] = extracted;
      });
      setOddsMap(newMap);
      fixturesOddsCache = newMap;
    });

    return () => {
      unsubFixtures();
      unsubOdds();
    };
  }, [leagueId, daysFilter, searchQuery]);

  const filteredMatches = React.useMemo(() => {
    return allMatches.filter(m => {
      // 1. Search Query Filter
      const q = localSearch.toLowerCase();
      const matchesSearch = (m.teams?.home?.name?.toLowerCase().includes(q)) ||
        (m.teams?.away?.name?.toLowerCase().includes(q)) ||
        (m.league?.name?.toLowerCase().includes(q));
      if (!matchesSearch) return false;

      // 2. Odds Filter - Only show games with assigned odds (apply to all views)
      const hasOdds = oddsMap[m.fixture.id] && 
        (oddsMap[m.fixture.id].home || oddsMap[m.fixture.id].draw || oddsMap[m.fixture.id].away);
      if (!hasOdds) return false;

      // 3. Day Filter Logic
      const dFilter = parseInt(daysFilter);
      if (dFilter === 0) {
        // For country view "All", show games up to 7 days from today
        if (viewMode === 'country') {
          const matchDate = new Date(m.fixture.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const sevenDaysFromNow = new Date(today);
          sevenDaysFromNow.setDate(today.getDate() + 7);
          sevenDaysFromNow.setHours(23, 59, 59, 999);
          
          return matchDate >= today && matchDate <= sevenDaysFromNow;
        }
        return true; // Normal ALL (val 0)
      }

      const matchDate = new Date(m.fixture.date);
      const today = new Date();
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + (dFilter - 1));

      return matchDate.toDateString() === targetDate.toDateString();
    });
  }, [allMatches, localSearch, daysFilter, oddsMap, viewMode]);

  const filteredLeagues = searchQuery.length >= 2
    ? allLeagues.filter(l => l.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10)
    : [];

  // Group matches by league for the landing page view
  const isCountryView = viewMode === 'country';
  const isLandingPage = !leagueId && !searchQuery && !isCountryView;
  const groupedByLeague = React.useMemo(() => {
    const grouped: Record<number, any[]> = {};
    if (isLandingPage) {
      filteredMatches.forEach(m => {
        const lid = m.league?.id;
        if (!grouped[lid]) grouped[lid] = [];
        grouped[lid].push(m);
      });
    }
    return grouped;
  }, [filteredMatches, isLandingPage]);

  // Group matches by country for country view
  const groupedByCountry = React.useMemo(() => {
    const grouped: Record<string, any[]> = {};
    if (isCountryView) {
      filteredMatches.forEach(m => {
        const country = m.league?.country || 'Unknown';
        if (!grouped[country]) grouped[country] = [];
        grouped[country].push(m);
      });
    }
    return grouped;
  }, [filteredMatches, isCountryView]);

  // Order groups by PRIORITY_LEAGUES order, then others
  const priorityIds = PRIORITY_LEAGUES.map(l => l.id);
  const orderedLeagueIds = [
    ...priorityIds.filter(id => groupedByLeague[id]?.length > 0),
    ...Object.keys(groupedByLeague).map(Number).filter(id => !priorityIds.includes(id))
  ];

  // Order countries alphabetically
  const orderedCountries = Object.keys(groupedByCountry).sort();

  
  return (
    <div>
      {!leagueId && !searchQuery && daysFilter === '0' && !isCountryView && <PopularEvents />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10, flexWrap: 'nowrap' }}>
        <h1 className="page-title" style={{ margin: 0, fontSize: 18, whiteSpace: 'nowrap' }}>
          {isCountryView ? 'All Countries (Games with Odds - 7 Days)' : 'Pre-Match'}
        </h1>
        <div className="search-bar" style={{ flex: 1, maxWidth: 240, margin: 0, minWidth: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            type="text"
            placeholder="Search teams or leagues..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', flex: 1, outline: 'none', fontSize: 13 }}
          />
        </div>
      </div>

      {loading && allMatches.length === 0 ? (
        <div className="loader"></div>
      ) : allMatches.length === 0 && !loading && (
        <div className="error-msg">
          No upcoming matches found for{' '}
          {searchQuery ? `"${searchQuery}"` : (leagueId ? (allMatches[0]?.league?.name || `League ${leagueId}`) : 'this category')}.
        </div>
      )}

      {/* SEARCH RESULTS */}
      {searchQuery && (
        <div className="search-results-container" style={{ marginBottom: 24 }}>
          {filteredLeagues.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="league-bar" style={{ background: '#222', marginBottom: 8 }}>
                <span>🏆 Matching Leagues</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {filteredLeagues.map(l => (
                  <Link key={l.id} href={`/fixtures?league=${l.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-panel)', padding: '8px 12px', borderRadius: 6, textDecoration: 'none', color: 'white', fontSize: 13, border: '1px solid #333' }}>
                    <img src={l.logo} style={{ width: 18, height: 18, borderRadius: '50%' }} />
                    {l.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="league-bar" style={{ background: 'var(--bg-main)', borderBottom: '1px solid #333' }}>
            <span>⚽ {filteredMatches.length > 0 ? `Matching Matches for "${searchQuery}"` : `No matches found for "${searchQuery}"`}</span>
          </div>
        </div>
      )}

      {/* LANDING PAGE: Grouped by league */}
      {isLandingPage && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {orderedLeagueIds.length > 0 ? (
            orderedLeagueIds.map(lid => {
              const matches = groupedByLeague[lid];
              if (!matches?.length) return null;
              const sample = matches[0];
              return (
                <LeagueGroup
                  key={lid}
                  leagueId={lid}
                  leagueName={sample.league?.name || ''}
                  leagueLogo={sample.league?.logo || ''}
                  country={sample.league?.country || ''}
                  matches={matches}
                  oddsMap={oddsMap}
                />
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              <div>No games found with assigned odds</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>
                Total matches: {filteredMatches.length} | All matches: {allMatches.length}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SINGLE LEAGUE VIEW */}
      {!isLandingPage && !searchQuery && filteredMatches.length > 0 && (
        <>
          <div className="league-bar">
            <span>⚽ {leagueId ? (filteredMatches[0]?.league?.name || `League ${leagueId}`) : 'Upcoming Events'}</span>
            <div className="league-headers">
              <span className="header-lbl">1</span>
              <span className="header-lbl">X</span>
              <span className="header-lbl">2</span>
            </div>
          </div>
          <div style={{ borderRadius: 8, overflow: 'hidden' }}>
            {filteredMatches.map(m => (
              <MatchCard key={m.fixture.id} match={m} odds={oddsMap[m.fixture.id] ?? null} />
            ))}
          </div>
        </>
      )}

      {/* SEARCH RESULTS MATCHES */}
      {searchQuery && (
        <div style={{ borderRadius: 8, overflow: 'hidden' }}>
          {filteredMatches.map(m => (
            <MatchCard key={m.fixture.id} match={m} odds={oddsMap[m.fixture.id] ?? null} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FixturesPage() {
  return (
    <Suspense fallback={<div className="loader"></div>}>
      <FixturesContent />
    </Suspense>
  );
}

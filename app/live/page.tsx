'use client';
import { useEffect, useState, Suspense } from 'react';
import MatchCard from '../MatchCard';
import { useSearchParams } from 'next/navigation';
import { OddsValues } from '../../lib/odds';
import Link from 'next/link';
import { subscribeToLiveMatches, subscribeToLeagues } from '../../services/firestoreService';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Simple global cache to preserve live data on back navigation
let liveMatchesCache: any[] = [];
let liveOddsCache: Record<number, OddsValues> = {};
let liveOddsFixtureIdsCache: Set<string> = new Set();

function LiveContent() {
  const searchParams = useSearchParams();
  const leagueId = searchParams?.get('league');
  const urlQuery = searchParams?.get('q') || '';

  const [allMatches, setAllMatches] = useState<any[]>(liveMatchesCache);
  const [visibleMatches, setVisibleMatches] = useState<any[]>(liveMatchesCache);
  const [oddsMap, setOddsMap] = useState<Record<number, OddsValues>>(liveOddsCache);
  const [liveOddsFixtureIds, setLiveOddsFixtureIds] = useState<Set<string>>(liveOddsFixtureIdsCache);

  const [loading, setLoading] = useState(liveMatchesCache.length === 0);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [localSearch, setLocalSearch] = useState(urlQuery);
  const [allLeagues, setAllLeagues] = useState<any[]>([]);

  // Sync with URL
  useEffect(() => {
    setSearchQuery(urlQuery);
    setLocalSearch(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    setSearchQuery(localSearch);
  }, [localSearch]);

  // Subscribe to leagues list from Firebase for search discovery
  useEffect(() => {
    const unsubscribe = subscribeToLeagues((leagues: any[]) => {
      const list = leagues.map((l: any) => ({
        id: l.id,
        name: `${l.country}. ${l.name}`,
        logo: l.flag || l.logo
      }));
      setAllLeagues(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribeOdds = onSnapshot(collection(db, 'odds'), (snap) => {
      const ids = new Set<string>(snap.docs.map((d) => d.id));
      liveOddsFixtureIdsCache = ids;
      setLiveOddsFixtureIds(ids);
    });
    return () => unsubscribeOdds();
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToLiveMatches((matches: any[]) => {
      setAllMatches(matches);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [leagueId]);

  useEffect(() => {
    const onlyLive = allMatches.filter((m: any) => {
      const s = m.fixture?.status?.short;
      return s === '1H' || s === '2H' || s === 'HT';
    });

    const withOdds = onlyLive.filter((m: any) => liveOddsFixtureIds.has(String(m?.fixture?.id)));
    const filtered = withOdds.length > 0 ? withOdds : onlyLive;
    setVisibleMatches(filtered);
    liveMatchesCache = filtered;
  }, [allMatches, liveOddsFixtureIds]);

  const filteredMatches = visibleMatches.filter(m => {
    if (!m) return false;
    const q = (localSearch || '').toLowerCase();
    const homeName = m.teams?.home?.name || '';
    const awayName = m.teams?.away?.name || '';
    const leagueName = m.league?.name || '';
    
    return homeName.toLowerCase().includes(q) ||
      awayName.toLowerCase().includes(q) ||
      leagueName.toLowerCase().includes(q);
  });

  const filteredLeagues = searchQuery.length >= 2
    ? allLeagues.filter(l => l.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10)
    : [];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10, flexWrap: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <h1 className="page-title" style={{ margin: 0, fontSize: 18, whiteSpace: 'nowrap' }}>Live In-Play</h1>
        </div>
        <div className="search-bar" style={{ flex: 1, maxWidth: 220, margin: 0, minWidth: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            type="text"
            placeholder="Search live teams..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', flex: 1, outline: 'none', fontSize: 13 }}
          />
        </div>
      </div>

      {loading && visibleMatches.length === 0 ? (
        <div className="loader"></div>
      ) : visibleMatches.length === 0 && !loading && (
        <div className="error-msg">
          No live matches available at the moment {searchQuery ? `matching "${searchQuery}"` : (leagueId ? `for League ${leagueId}` : '')}.
        </div>
      )}

      {visibleMatches.length > 0 && !searchQuery && (
        <div className="league-bar">
          <span>⚽ {leagueId ? (visibleMatches[0]?.league?.name || 'Live Events') : 'Live Events'}</span>
          <div className="league-headers">
            <span className="header-lbl">1</span>
            <span className="header-lbl">X</span>
            <span className="header-lbl">2</span>
          </div>
        </div>
      )}

      {searchQuery && filteredLeagues.length > 0 && (
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

      <div style={{ borderRadius: 8, overflow: 'hidden' }}>
        {filteredMatches.map(m => (
          <MatchCard
            key={m.fixture.id}
            match={m}
            odds={oddsMap[m.fixture.id] ?? null}
          />
        ))}
      </div>
    </div>
  );
}

export default function LivePage() {
  return (
    <Suspense fallback={<div className="loader"></div>}>
      <LiveContent />
    </Suspense>
  )
}

'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getPopularMatches } from '@/lib/popularity';
import { toggleBet, getBetslip } from '@/lib/betslip';
import { extractBestOdds } from '@/lib/odds';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function PopularEvents() {
  const [matches, setMatches] = useState<any[]>([]);
  const [oddsMap, setOddsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeSelections, setActiveSelections] = useState<Record<number, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    
    // 1. Listen to Live & Fixtures to find trending events
    const qLive = collection(db, 'live_matches');
    const qFixtures = collection(db, 'fixtures');
    const qOdds = collection(db, 'odds');

    let livePool: any[] = [];
    let fixturesPool: any[] = [];

    const updateTrending = () => {
      const combined = [...livePool, ...fixturesPool];
      const rankedPool = getPopularMatches(combined, 40);
      
      const isLiveMatch = (m: any) => {
        const nonLive = ['NS', 'FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO', 'TBD'];
        return !nonLive.includes(m?.fixture?.status?.short);
      };

      const liveMatches = rankedPool.filter(isLiveMatch);
      const preMatchMatches = rankedPool.filter((m) => !isLiveMatch(m));
      const selectedLive = liveMatches.slice(0, 5);
      const selectedPreMatch = preMatchMatches.slice(0, Math.max(0, 10 - selectedLive.length));
      const merged = [...selectedLive, ...selectedPreMatch];
      const dedupedByFixture = new Map<number, any>();
      for (const match of merged) {
        const fixtureId = Number(match?.fixture?.id);
        if (!fixtureId) continue;
        // Prefer live record if the same fixture exists in both collections.
        if (!dedupedByFixture.has(fixtureId) || isLiveMatch(match)) {
          dedupedByFixture.set(fixtureId, match);
        }
      }

      setMatches(Array.from(dedupedByFixture.values()));
      setLoading(false);
    };

    const unsubscribeLive = onSnapshot(qLive, (snap) => {
      livePool = snap.docs.map(doc => doc.data());
      updateTrending();
    });

    const unsubscribeFixtures = onSnapshot(qFixtures, (snap) => {
      fixturesPool = snap.docs.map(doc => doc.data());
      updateTrending();
    });

    const unsubscribeOdds = onSnapshot(qOdds, (snap) => {
      const newMap: Record<number, any> = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.bookmakers?.[0]?.bets?.[0]) {
           const matchOdds = extractBestOdds(data);
           if (matchOdds) newMap[Number(doc.id)] = matchOdds;
        }
      });
      setOddsMap(newMap);
    });

    const updateSelections = () => {
      const current = getBetslip();
      const map: Record<number, string> = {};
      current.forEach(b => map[b.matchId] = b.selection);
      setActiveSelections(map);
    };
    updateSelections();
    window.addEventListener('betslip-updated', updateSelections);

    return () => {
      unsubscribeLive();
      unsubscribeFixtures();
      unsubscribeOdds();
      window.removeEventListener('betslip-updated', updateSelections);
    };
  }, []);

  const handleToggle = (e: React.MouseEvent, m: any, type: 'home' | 'draw' | 'away', val: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!val || typeof val !== 'number') return;
    
    toggleBet({
      matchId: m.fixture.id,
      homeTeam: m.teams.home.name,
      awayTeam: m.teams.away.name,
      leagueName: m.league.name,
      selection: type,
      odd: val,
      timestamp: Date.now()
    });
  };

  if (loading || matches.length === 0) return null;

  const uniqueMatches = matches.filter((m, idx, arr) => {
    const id = String(m?.fixture?.id ?? '');
    if (!id) return false;
    return arr.findIndex((x) => String(x?.fixture?.id ?? '') === id) === idx;
  });

  return (
    <div className="popular-slider-section">
      <div className="popular-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>Popular Events</span>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <button onClick={() => scrollRef.current?.scrollBy({ left: -340, behavior: 'smooth' })} className="slider-nav-btn prev">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button onClick={() => scrollRef.current?.scrollBy({ left: 340, behavior: 'smooth' })} className="slider-nav-btn next">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        <div className="popular-track" ref={scrollRef}>
        {uniqueMatches.map((m) => {
          const isLive = !['NS', 'FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO', 'TBD'].includes(m.fixture.status.short);
          const matchOdds = oddsMap[m.fixture.id];
          const matchDate = new Date(m.fixture.date);
          const isToday = matchDate.toDateString() === new Date().toDateString();
          const getVal = (key: 'home' | 'draw' | 'away') => matchOdds?.[key] || null;
          const activeSel = activeSelections[m.fixture.id];

          return (
            <Link key={`${m.fixture.id}-${m.fixture.status.short}`} href={`/match/${m.fixture.id}`} className="popular-event-card">
              <div className="popular-card-body">
                <div className="card-top-badges">
                  {isLive ? (
                    <div className="live-badge" style={{ background: '#ff3b5c', color: 'white' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: 4 }}>
                        <path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><circle cx="12" cy="13" r="2"></circle>
                      </svg>
                      LIVE
                    </div>
                  ) : (
                    <div className="time-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} {!isToday && matchDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                    </div>
                  )}
                  <div className="popular-star">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </div>
                </div>

                <div className="logo-vs-row">
                  <div className="team-logo-circle"><img src={m.teams.home.logo} alt="" /></div>
                  <div className="vs-score-box">
                    {isLive ? (<><span>{m.goals.home ?? 0}</span><span className="vs-text" style={{ margin: '0 6px', opacity: 0.5 }}>:</span><span>{m.goals.away ?? 0}</span></>) : (<span className="vs-text">VS</span>)}
                  </div>
                  <div className="team-logo-circle"><img src={m.teams.away.logo} alt="" /></div>
                </div>

                <div className="popular-info-area">
                  <div className="popular-league-text">
                    <img src={m.league.logo} style={{ width: 14, height: 14, borderRadius: '50%' }} alt="" />
                    <span>Football. {m.league.name}</span>
                  </div>
                  <div className="popular-teams-text">
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.teams.home.name}</div>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.teams.away.name}</div>
                  </div>
                </div>

                <div className="popular-odds-footer">
                  <div className="pop-odds-row">
                    <div className={`pop-tile ${activeSel === 'home' ? 'selected' : ''}`} onClick={(e) => handleToggle(e, m, 'home', getVal('home'))}>
                      <span>1</span><span>{getVal('home') || 'N/A'}</span>
                    </div>
                    <div className={`pop-tile ${activeSel === 'draw' ? 'selected' : ''}`} onClick={(e) => handleToggle(e, m, 'draw', getVal('draw'))}>
                      <span>X</span><span>{getVal('draw') || 'N/A'}</span>
                    </div>
                    <div className={`pop-tile ${activeSel === 'away' ? 'selected' : ''}`} onClick={(e) => handleToggle(e, m, 'away', getVal('away'))}>
                      <span>2</span><span>{getVal('away') || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-orange-footer">+{m.fixture.id % 2000 + 300}</div>
            </Link>
          );
        })}
        </div>
      </div>
    </div>
  );
}

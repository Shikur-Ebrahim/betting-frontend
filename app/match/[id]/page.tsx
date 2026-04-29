'use client';
import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { extractBestOdds } from '@/lib/odds';
import { getBetslip, toggleBet } from '@/lib/betslip';
import PrematchInfo from './PrematchInfo';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

/** Determine if a fixture status string means the game is currently live */
function isStatusLive(short: string | undefined): boolean {
  if (!short) return false;
  const notLive = ['NS', 'FT', 'TBD', 'PST', 'CANC', 'ABD', 'AWD', 'WO', 'AET', 'PEN'];
  return !notLive.includes(short);
}

/** Walk bookmakers and extract a normalized bets array */
function extractBets(leagueOdds: any): any[] | null {
  if (!leagueOdds) return null;

  // The 'odds' property in Firestore contains the array of bookmakers
  const bookmakers = leagueOdds.odds || leagueOdds.bookmakers;
  
  if (Array.isArray(bookmakers)) {
    for (const bm of bookmakers) {
      if (bm.bets && Array.isArray(bm.bets) && bm.bets.length > 0) {
        return bm.bets;
      }
    }
  }

  return null;
}

function MatchDetailsContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [match, setMatch] = useState<any>(null);
  const [odds, setOdds] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [lineups, setLineups] = useState<any[]>([]);
  const [h2h, setH2h] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [oddsLoading, setOddsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('odds');
  const [activeSelections, setActiveSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateSelections = () => {
      const current = getBetslip();
      const map: Record<string, string> = {};
      current.forEach(b => map[b.matchId.toString()] = b.selection);
      setActiveSelections(map);
    };
    updateSelections();
    window.addEventListener('betslip-updated', updateSelections);
    return () => window.removeEventListener('betslip-updated', updateSelections);
  }, []);

  const handleToggle = (e: React.MouseEvent, type: any, val: any) => {
    e.preventDefault();
    e.stopPropagation();
    const numVal = Number(val);
    if (!numVal || isNaN(numVal)) return;
    
    toggleBet({
      matchId: Number(id),
      homeTeam: match.teams.home.name,
      awayTeam: match.teams.away.name,
      leagueName: match.league.name,
      selection: type,
      odd: numVal,
      timestamp: Date.now()
    });
  };

  const currentSelection = activeSelections[id];

  // REAL-TIME FIRESTORE SYNC
  useEffect(() => {
    if (!id) return;
    window.scrollTo(0, 0);
    setLoading(true);

    // 1. Listen to Match Data (Check Live first, then Fixtures)
    let unsubFixtures: (() => void) | null = null;
    const unsubLive = onSnapshot(doc(db, 'live_matches', id), (docSnap) => {
      if (docSnap.exists()) {
        if (unsubFixtures) {
          unsubFixtures();
          unsubFixtures = null;
        }
        setMatch(docSnap.data());
        setLoading(false);
      } else {
        // If not in live, check fixtures
        if (!unsubFixtures) {
          unsubFixtures = onSnapshot(doc(db, 'fixtures', id), (fSnap) => {
            if (fSnap.exists()) {
              setMatch(fSnap.data());
            }
            setLoading(false);
          });
        }
      }
    });

    // 2. Listen to Odds
    const unsubOdds = onSnapshot(doc(db, 'odds', id), (docSnap) => {
      if (docSnap.exists()) {
        const leagueOdds = docSnap.data();
        const bets = extractBets(leagueOdds);
        if (bets && bets.length > 0) {
          setOdds({ bookmakers: [{ bets }] });
        } else {
          setOdds(null);
        }
      } else {
        setOdds(null);
      }
      setOddsLoading(false);
    });

    // 3. Listen to Stats
    const unsubStats = onSnapshot(doc(db, 'match_stats', id), (docSnap) => {
      if (docSnap.exists()) setStats(docSnap.data().response || []);
    });

    // 4. Listen to Lineups
    const unsubLineups = onSnapshot(doc(db, 'match_lineups', id), (docSnap) => {
      if (docSnap.exists()) setLineups(docSnap.data().response || []);
    });

    return () => {
      unsubLive();
      if (unsubFixtures) (unsubFixtures as () => void)();
      unsubOdds();
      unsubStats();
      unsubLineups();
    };
  }, [id]);

  if (loading) return <div className="loader"></div>;
  if (!match) return <div className="error-msg">Match not found.</div>;

  const isLive = isStatusLive(match?.fixture?.status?.short);

  return (
    <div className="match-detail-container">
      {/* Header / Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, fontSize: 14, color: 'var(--text-muted)' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>Sports</Link>
        <span>/</span>
        <span>{match.league.country}</span>
        <span>/</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{match.league.name}</span>
      </div>

      {/* Premium Scoreboard */}
      <div className="scoreboard-card premium-scoreboard">
        <div className="scoreboard-header-row">
          <div className="header-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
          </div>
          <div className="header-center">
            <img src={match.league.logo} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} />
            <span>Football. {match.league.country}. {match.league.name}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <div className="header-right">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
          </div>
        </div>

        <div className="scoreboard-main">
          <div className="score-team side-layout">
            <span className="team-name-lg">{match.teams.home.name}</span>
            <img src={match.teams.home.logo} alt={match.teams.home.name} className="team-logo-md" />
          </div>

          <div className="score-center">
            <div className="period-badge">
              {isLive ? `${match.fixture.status.short} ${match.fixture.status.elapsed}'` : match.fixture.status.short}
            </div>

            <div className="score-value-large">
              <span className="s-home">{match.goals.home ?? 0}</span>
              <span className="s-sep">:</span>
              <span className="s-away">{match.goals.away ?? 0}</span>
            </div>

            <div className="score-grid-container">
              <div className="grid-headers">
                <span style={{ width: 32 }}></span>
                <span>1 HALF</span>
                <span>2 HALF</span>
              </div>
              <div className="score-grid-3col">
                {(() => {
                  const homeGoals = match?.goals?.home ?? 0;
                  const awayGoals = match?.goals?.away ?? 0;
                  const halfHome = match?.score?.halftime?.home ?? 0;
                  const halfAway = match?.score?.halftime?.away ?? 0;
                  const isFulltimeSet = match?.score?.fulltime?.home !== null;

                  return (
                    <>
                      <div className="grid-cell"><img src={match.teams.home.logo} style={{ width: 14 }} alt="" /></div>
                      <div className="grid-cell val blue">{halfHome}</div>
                      <div className="grid-cell val blue">{isFulltimeSet ? (homeGoals - halfHome) : 0}</div>

                      <div className="grid-cell"><img src={match.teams.away.logo} style={{ width: 14 }} alt="" /></div>
                      <div className="grid-cell val green">{halfAway}</div>
                      <div className="grid-cell val green">{isFulltimeSet ? (awayGoals - halfAway) : 0}</div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="score-team side-layout">
            <img src={match.teams.away.logo} alt={match.teams.away.name} className="team-logo-md" />
            <span className="team-name-lg">{match.teams.away.name}</span>
          </div>
        </div>
      </div>

      {/* Tabs for Live Match */}
      {isLive && (
        <div className="match-tabs">
          <div className={`match-tab ${activeTab === 'odds' ? 'active' : ''}`} onClick={() => setActiveTab('odds')}>Odds</div>
          {stats.length > 0 && (
            <div className={`match-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>Statistics</div>
          )}
          {lineups.length > 0 && (
            <div className={`match-tab ${activeTab === 'lineups' ? 'active' : ''}`} onClick={() => setActiveTab('lineups')}>Lineups</div>
          )}
        </div>
      )}

      <div className="match-content-area">
        {!isLive && (
          <div style={{ marginBottom: 24 }}>
            <PrematchInfo match={match} h2h={h2h} standings={standings} lineups={lineups} />
          </div>
        )}
        {(!isLive || activeTab === 'odds') && (
          <div className="odds-grid">
            {oddsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <div className="loader" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: 12 }}>Loading odds…</p>
              </div>
            ) : odds?.bookmakers?.[0]?.bets?.length > 0 ? (
              <>
                {/* Prominent 1x2 summary strip — always shown first */}
                {(() => {
                  const bestOdds = extractBestOdds(odds);
                  if (!bestOdds || (!bestOdds.home && !bestOdds.draw && !bestOdds.away)) return null;

                  return (
                    <div className="market-box" style={{ marginBottom: 8 }}>
                      <div className="market-header">1 × 2 — Match Winner</div>
                      <div className="market-values" style={{ display: 'flex', gap: 8 }}>
                        <div 
                          className={`market-odd-tile ${currentSelection === 'home' ? 'selected' : ''}`}
                          style={{ flex: 1, textAlign: 'center' }}
                          onClick={(e) => handleToggle(e, 'home', bestOdds.home)}
                        >
                          <span className="m-odd-lbl">{match.teams.home.name}</span>
                          <span className="m-odd-val" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{bestOdds.home ?? '-'}</span>
                        </div>
                        <div 
                          className={`market-odd-tile ${currentSelection === 'draw' ? 'selected' : ''}`}
                          style={{ flex: 1, textAlign: 'center' }}
                          onClick={(e) => handleToggle(e, 'draw', bestOdds.draw)}
                        >
                          <span className="m-odd-lbl">Draw</span>
                          <span className="m-odd-val" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{bestOdds.draw ?? '-'}</span>
                        </div>
                        <div 
                          className={`market-odd-tile ${currentSelection === 'away' ? 'selected' : ''}`}
                          style={{ flex: 1, textAlign: 'center' }}
                          onClick={(e) => handleToggle(e, 'away', bestOdds.away)}
                        >
                          <span className="m-odd-lbl">{match.teams.away.name}</span>
                          <span className="m-odd-val" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{bestOdds.away ?? '-'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {/* All markets */}
                {odds.bookmakers[0].bets.map((bet: any, bIdx: number) => (
                  <div key={bIdx} className="market-box">
                    <div className="market-header">{bet.name}</div>
                    <div className="market-values">
                      {bet.values.map((v: any, vIdx: number) => {
                        let label = v.value;
                        if (label === 'Home') label = match.teams.home.name;
                        if (label === 'Away') label = match.teams.away.name;
                        
                        let selType = v.value;
                        if (selType === 'Home') selType = 'home';
                        if (selType === 'Draw' || selType === 'X') selType = 'draw';
                        if (selType === 'Away') selType = 'away';
                        
                        return (
                          <div 
                            key={vIdx} 
                            className={`market-odd-tile ${currentSelection === selType ? 'selected' : ''}`}
                            onClick={(e) => handleToggle(e, selType, v.odd)}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className="m-odd-lbl">{label}</span>
                            <span className="m-odd-val">{v.odd}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="markets-not-found">
                <div className="not-found-icon">🚫</div>
                <h3>Markets not found</h3>
                <p>There are no active betting markets for this match right now.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-container">
            {stats.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {stats[0].statistics.map((stat: any, i: number) => {
                  const homeVal = stat.value || 0;
                  const awayVal = stats[1]?.statistics?.[i]?.value || 0;
                  const homePercent = (typeof homeVal === 'string' && homeVal.includes('%')) ? parseInt(homeVal) :
                    (homeVal + (typeof awayVal === 'number' ? awayVal : 0) === 0 ? 50 : (homeVal / (homeVal + (typeof awayVal === 'number' ? awayVal : 0))) * 100);

                  return (
                    <div key={i} className="stat-row">
                      <div className="stat-labels">
                        <span>{homeVal}</span>
                        <span className="stat-name">{stat.type}</span>
                        <span>{awayVal}</span>
                      </div>
                      <div className="stat-bar-bg">
                        <div className="stat-bar-fill home" style={{ width: `${homePercent}%` }}></div>
                        <div className="stat-bar-fill away" style={{ width: `${100 - (typeof homePercent === 'number' ? homePercent : 0)}%` }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : <div className="no-data">Statistics not available.</div>}
          </div>
        )}

        {activeTab === 'lineups' && (
          <div className="lineups-grid">
            {lineups.length > 0 ? lineups.map((teamLineup: any, tIdx: number) => (
              <div key={tIdx} className="team-lineup">
                <div className="lineup-header">
                  <img src={teamLineup.team.logo} style={{ width: 24, height: 24 }} />
                  {teamLineup.team.name} ({teamLineup.formation})
                </div>
                <div className="player-list">
                  <div className="player-section-title">Starting XI</div>
                  {teamLineup.startXI.map((p: any, pIdx: number) => (
                    <div key={pIdx} className="player-row">
                      <span className="player-number">{p.player.number}</span>
                      <span className="player-name">{p.player.name}</span>
                      <span className="player-pos">{p.player.pos}</span>
                    </div>
                  ))}
                  <div className="player-section-title" style={{ marginTop: 16 }}>Substitutes</div>
                  {teamLineup.substitutes.map((p: any, pIdx: number) => (
                    <div key={pIdx} className="player-row">
                      <span className="player-number">{p.player.number}</span>
                      <span className="player-name">{p.player.name}</span>
                      <span className="player-pos">{p.player.pos}</span>
                    </div>
                  ))}
                </div>
              </div>
            )) : <div className="no-data">Lineups not announced yet.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={<div className="loader"></div>}>
      <MatchDetailsContent />
    </Suspense>
  )
}

'use client';
import Link from 'next/link';
import { OddsValues, extractBestOdds } from '@/lib/odds';
import { useEffect, useState } from 'react';
import { toggleBet, getBetslip } from '@/lib/betslip';
import { subscribeToOdds } from '@/services/firestoreService';

export default function MatchCard({
  match,
  odds: initialOdds,
}: {
  match: any;
  odds?: OddsValues | null;
}) {
  const isLive =
    match.fixture.status.short === '1H' ||
    match.fixture.status.short === '2H' ||
    match.fixture.status.short === 'HT';

  const statusShort = match.fixture.status.short;

  const [localOdds, setLocalOdds] = useState<OddsValues | null>(initialOdds || null);
  const [loading, setLoading] = useState(!initialOdds);
  const [activeSelection, setActiveSelection] = useState<string | null>(null);

  useEffect(() => {
    const updateSelection = () => {
      const current = getBetslip();
      const matchBet = current.find(b => b.matchId === match.fixture.id);
      setActiveSelection(matchBet ? matchBet.selection : null);
    };
    updateSelection();
    window.addEventListener('betslip-updated', updateSelection);
    return () => window.removeEventListener('betslip-updated', updateSelection);
  }, [match.fixture.id]);

  const handleToggle = (e: React.MouseEvent, type: 'home' | 'draw' | 'away', val: any) => {
    e.preventDefault();
    e.stopPropagation();
    const numVal = Number(val);
    if (!numVal || isNaN(numVal)) return;

    toggleBet({
      matchId: match.fixture.id,
      homeTeam: match.teams.home.name,
      awayTeam: match.teams.away.name,
      leagueName: match.league.name,
      selection: type,
      odd: numVal,
      timestamp: Date.now()
    });
  };

  useEffect(() => {
    if (initialOdds) {
      setLocalOdds(initialOdds);
      setLoading(false);
      return;
    }

    const fixtureId = match?.fixture?.id;
    if (!fixtureId) {
      setLoading(false);
      return;
    }

    // Subscribe to real-time odds from Firestore
    const unsubscribe = subscribeToOdds(fixtureId, (data) => {
      if (data && data.odds) {
        const bestOdds = extractBestOdds({ bookmakers: data.odds });
        setLocalOdds(bestOdds);
      }
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initialOdds, match?.fixture?.id]);

  const getStatusLabel = () => {
    if (statusShort === 'NS') return 'Scheduled';
    if (statusShort === 'HT') return 'Break';
    if (statusShort === '1H') return '1 Half';
    if (statusShort === '2H') return '2 Half';
    if (statusShort === 'FT') return 'Finished';
    return statusShort;
  };

  const lockIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ opacity: 0.6 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );

  const display = (key: keyof OddsValues) => {
    if (loading) return <span style={{ opacity: 0.5 }}>...</span>;
    if (!localOdds || !localOdds[key]) return isLive ? lockIcon : '-';
    return localOdds[key];
  };

  const displayVal = (key: keyof OddsValues) => {
    if (loading) return null;
    if (!localOdds || !localOdds[key]) return null;
    return localOdds[key];
  };

  const targetUrl = isLive
    ? `/match/${match.fixture.id}?live=true`
    : `/match/${match.fixture.id}`;

  return (
    <Link href={targetUrl} className="match-row">
      {/* Top Status Bar */}
      <div className="match-status-row">
        {isLive && <div className="status-dot"></div>}
        <span style={{ color: isLive ? '#28a745' : '#6c757d' }}>{getStatusLabel()}</span>
        {isLive && <span>{match.fixture.status.elapsed}'</span>}
        {!isLive && statusShort === 'NS' && (
          <span>
            {new Date(match.fixture.date).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>

      <div className="match-main-row">
        {/* Teams and Scores */}
        <div className="match-teams-scores">
          <div className="team-score-line">
            <img src={match.teams.home.logo} className="team-logo-small" alt="" />
            <span className="team-name-text">{match.teams.home.name}</span>
            <div className="score-display">
              <span className="main-score">{match.goals.home ?? '-'}</span>
              <span className="ht-score">{match.score.halftime.home ?? '-'}</span>
            </div>
          </div>
          <div className="team-score-line">
            <img src={match.teams.away.logo} className="team-logo-small" alt="" />
            <span className="team-name-text">{match.teams.away.name}</span>
            <div className="score-display">
              <span className="main-score">{match.goals.away ?? '-'}</span>
              <span className="ht-score">{match.score.halftime.away ?? '-'}</span>
            </div>
          </div>
        </div>

        {/* Extra Markets Count */}
        <div className="extra-markets-badge">
          +{Math.floor(Math.random() * 350) + 100}
        </div>

        {/* Odds Row */}
        <div className="odds-row">
          <div
            className={`odd-tile ${activeSelection === 'home' ? 'selected' : ''}`}
            onClick={(e) => handleToggle(e, 'home', displayVal('home'))}
          >
            <span className="odd-lbl">1</span>
            <span>{display('home')}</span>
          </div>
          <div
            className={`odd-tile ${activeSelection === 'draw' ? 'selected' : ''}`}
            onClick={(e) => handleToggle(e, 'draw', displayVal('draw'))}
          >
            <span className="odd-lbl">X</span>
            <span>{display('draw')}</span>
          </div>
          <div
            className={`odd-tile ${activeSelection === 'away' ? 'selected' : ''}`}
            onClick={(e) => handleToggle(e, 'away', displayVal('away'))}
          >
            <span className="odd-lbl">2</span>
            <span>{display('away')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

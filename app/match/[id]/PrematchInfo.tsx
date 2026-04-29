import React, { useState } from 'react';

export default function PrematchInfo({ match, h2h, standings, lineups }: any) {
  const [activeTab, setActiveTab] = useState('h2h');
  const [standingsView, setStandingsView] = useState<'overall' | 'home' | 'away'>('overall');
  const [pitchSlide, setPitchSlide] = useState(0);
  
  // calculations for H2H
  const homeId = match.teams.home.id;
  const awayId = match.teams.away.id;
  let wins = 0; let draws = 0; let losses = 0;
  
  if (h2h && h2h.length > 0) {
    h2h.forEach((m: any) => {
      const isHome = m.teams.home.id === homeId;
      const mHomeGoals = m.goals.home ?? 0;
      const mAwayGoals = m.goals.away ?? 0;
      
      if (mHomeGoals === mAwayGoals) draws++;
      else if ((isHome && mHomeGoals > mAwayGoals) || (!isHome && mAwayGoals > mHomeGoals)) wins++;
      else losses++;
    });
  }
  const totalH2h = wins + draws + losses;
  const homePct = totalH2h ? Math.round((wins / totalH2h) * 100) : 0;
  const awayPct = totalH2h ? Math.round((losses / totalH2h) * 100) : 0;

  const leagueName = match.league.name;
  const season = match.league.season;
  const homeRow = standings.find((row: any) => row.team.id === homeId);
  const awayRow = standings.find((row: any) => row.team.id === awayId);
  const homeRank = homeRow?.rank ?? '-';
  const awayRank = awayRow?.rank ?? '-';
  
  const homeGoals = homeRow?.all?.goals?.for ?? 0;
  const awayGoals = awayRow?.all?.goals?.for ?? 0;
  const totalGoals = homeGoals + awayGoals || 1;
  const homeGoalsPct = Math.round((homeGoals / totalGoals) * 100);

  const homeTopScorer = lineups?.[0]?.startXI?.find((p:any) => p.player.pos === 'F')?.player?.name || 'Vinicius, Carlos';
  const awayTopScorer = lineups?.[1]?.startXI?.find((p:any) => p.player.pos === 'F')?.player?.name || 'Breno';
  const homeScorerNum = lineups?.[0]?.startXI?.find((p:any) => p.player.pos === 'F')?.player?.number || '9';
  const awayScorerNum = lineups?.[1]?.startXI?.find((p:any) => p.player.pos === 'F')?.player?.number || '11';

  const lastResults = (teamId: number) =>
    (h2h || []).slice(0, 5).map((m: any) => {
      const isHomeTeam = m.teams.home.id === teamId;
      const gf = isHomeTeam ? (m.goals.home ?? 0) : (m.goals.away ?? 0);
      const ga = isHomeTeam ? (m.goals.away ?? 0) : (m.goals.home ?? 0);
      if (gf > ga) return 'W';
      if (gf < ga) return 'L';
      return 'D';
    });

  const homeForm = lastResults(homeId);
  const awayForm = lastResults(awayId);
  const standingsRows = [...(standings || [])]
    .map((row: any) => {
      if (standingsView === 'overall') return row;
      const viewData = standingsView === 'home' ? row.home : row.away;
      const pts = (viewData?.win || 0) * 3 + (viewData?.draw || 0) * 1;
      const diff = (viewData?.goals?.for || 0) - (viewData?.goals?.against || 0);
      return { ...row, points: pts, goalsDiff: diff, all: viewData };
    })
    .sort((a, b) => {
      if (standingsView === 'overall') return a.rank - b.rank;
      if (b.points !== a.points) return b.points - a.points;
      return b.goalsDiff - a.goalsDiff;
    })
    .map((row, index) => {
      if (standingsView === 'overall') return row;
      return { ...row, rank: index + 1 };
    });

  return (
    <div className="prematch-info-card">
      <div className="prematch-timeline-header">
        <div className="pt-teams">
          <div className="pt-team"><b>{match.teams.home.name.substring(0,3).toUpperCase()}</b></div>
          <div className="pt-team"><b>{match.teams.away.name.substring(0,3).toUpperCase()}</b></div>
        </div>
        <div className="pt-timeline">
           <span>0</span><span>15</span><span>30</span><span>45</span><span>60</span><span>75</span><span>90</span>
           <div className="pt-time-ticks">
             <div className="pt-tick"></div><div className="pt-tick"></div><div className="pt-tick"></div><div className="pt-tick"></div><div className="pt-tick"></div><div className="pt-tick"></div><div className="pt-tick"></div>
           </div>
        </div>
        <div className="pt-duration">2x45 min</div>
      </div>

      <div className="prematch-content-box">
        {activeTab === 'venue' && (
          <div className="venue-tab">
             <div className="pitch-bg">
                {pitchSlide === 0 && (
                  <div className="venue-info-box">
                     <div className="vi-title">Venue</div>
                     <div className="vi-stadium">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M4 14a8 8 0 0 0 16 0"/><path d="M2 14h20"/><path d="M12 2v6"/><path d="M8 4v4"/><path d="M16 4v4"/></svg>
                        <div className="vi-stadium-name">{match.fixture.venue.name}</div>
                        <div className="vi-city">{match.fixture.venue.city}</div>
                     </div>
                  </div>
                )}
                
                {pitchSlide === 1 && (
                   <div className="venue-info-box goals-scorer-box">
                     <div className="vi-title" style={{display: 'flex', justifyContent: 'space-between', marginBottom: 12}}>
                        <span style={{fontSize: 18, fontWeight: 700}}>{homeGoals}</span>
                        <span style={{fontSize: 12, color: 'var(--text-muted)'}}>Goals Scored / Season</span>
                        <span style={{fontSize: 18, fontWeight: 700}}>{awayGoals}</span>
                     </div>
                     <div style={{display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 20}}>
                        <div style={{width: `${homeGoalsPct}%`, background: '#3b82f6'}}></div>
                        <div style={{width: `${100 - homeGoalsPct}%`, background: '#ef4444'}}></div>
                     </div>
                     <div className="vi-title" style={{display: 'flex', justifyContent: 'space-between', marginBottom: 12}}>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                           <span style={{fontSize: 16, fontWeight: 700}}>{Math.max(1, Math.round(homeGoals / 3))}</span>
                           <span style={{fontSize: 14, fontWeight: 600, color: '#fff'}}>{homeTopScorer}</span>
                        </div>
                        <span style={{fontSize: 12, color: 'var(--text-muted)', paddingTop: 4}}>Top Scorers</span>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                           <span style={{fontSize: 16, fontWeight: 700}}>{Math.max(1, Math.round(awayGoals / 3))}</span>
                           <span style={{fontSize: 14, fontWeight: 600, color: '#fff'}}>{awayTopScorer}</span>
                        </div>
                     </div>
                     <div style={{display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 8}}>
                        <div style={{width: `50%`, background: '#3b82f6'}}></div>
                        <div style={{width: `50%`, background: '#ef4444'}}></div>
                     </div>
                     <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)'}}>
                        <span>#{homeScorerNum} | Forward</span>
                        <span>#{awayScorerNum} | Forward</span>
                     </div>
                   </div>
                )}

                {pitchSlide === 2 && (
                  <div className="venue-info-box league-position-box">
                    <div className="vi-title">League Position</div>
                    <div className="league-pos-row">
                      <div className="league-pos-side">
                        <div className="lp-meter blue">
                          <div className="lp-meter-fill"></div>
                        </div>
                        <div className="lp-main-stat">
                          <div className="lp-big">{homePct}%</div>
                          <div className="lp-sub">Form</div>
                        </div>
                      </div>
                      <div className="league-pos-center">
                        <div className="lp-rank-block blue">{homeRank}</div>
                        <div className="lp-rank-divider"></div>
                        <div className="lp-rank-block red">{awayRank}</div>
                      </div>
                      <div className="league-pos-side right">
                        <div className="lp-main-stat">
                          <div className="lp-big">{awayPct}%</div>
                          <div className="lp-sub">Form</div>
                        </div>
                        <div className="lp-meter red">
                          <div className="lp-meter-fill"></div>
                        </div>
                      </div>
                    </div>

                    <div className="lp-form-row">
                      <div className="lp-team-form">
                        {homeForm.map((r: string, i: number) => (
                          <span key={`h-${i}`} className={`lp-form-pill ${r.toLowerCase()}`}>{r}</span>
                        ))}
                      </div>
                      <div className="lp-team-form right">
                        {awayForm.map((r: string, i: number) => (
                          <span key={`a-${i}`} className={`lp-form-pill ${r.toLowerCase()}`}>{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="venue-carousel-controls" aria-hidden="true">
                  <button className="venue-nav-btn" type="button" tabIndex={-1} onClick={() => setPitchSlide(s => Math.max(0, s - 1))}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <div className="venue-carousel-dots">
                    {[0, 1, 2].map(i => (
                       <span key={i} className={`venue-dot ${pitchSlide === i ? 'active' : ''}`} onClick={() => setPitchSlide(i)}></span>
                    ))}
                  </div>
                  <button className="venue-nav-btn" type="button" tabIndex={-1} onClick={() => setPitchSlide(s => Math.min(2, s + 1))}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'h2h' && (
          <div className="h2h-tab" style={{padding: 16}}>
             <div className="tab-section-title">PREVIOUS MEETINGS</div>
             <div className="h2h-list" style={{marginTop: 12}}>
               {h2h && h2h.length > 0 ? h2h.slice(0, 5).map((m: any, i: number) => (
                  <div key={i} className="h2h-match-row" style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)', alignItems: 'center'}}>
                     <div style={{fontSize: 12, color: 'var(--text-muted)', width: 60}}>{new Date(m.fixture.date).toLocaleDateString()}</div>
                     <div style={{flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center'}}>
                        <span style={{fontWeight: m.teams.home.winner ? 700 : 400}}>{m.teams.home.name}</span>
                        <img src={m.teams.home.logo} width="16" height="16" />
                     </div>
                     <div style={{padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: 4, margin: '0 12px', fontWeight: 600, fontSize: 14}}>
                        {m.goals.home ?? '-'}:{m.goals.away ?? '-'}
                     </div>
                     <div style={{flex: 1, display: 'flex', justifyContent: 'flex-start', gap: 8, alignItems: 'center'}}>
                        <img src={m.teams.away.logo} width="16" height="16" />
                        <span style={{fontWeight: m.teams.away.winner ? 700 : 400}}>{m.teams.away.name}</span>
                     </div>
                  </div>
               )) : <div className="no-data" style={{marginTop: 16}}>No previous meetings found.</div>}
             </div>
          </div>
        )}

        {activeTab === 'standings' && (
          <div className="standings-tab">
            <div className="tab-section-title">STANDINGS</div>
            <div className="tab-section-subtitle" style={{textAlign: 'left', marginTop: 8, marginBottom: 8}}>
              {leagueName?.toUpperCase()} {season?.toString().slice(-2)}/{(parseInt(season)+1).toString().slice(-2)}
            </div>

            <div className="standings-top-switches">
              <div className="standings-filters">
                <span className={standingsView === 'overall' ? 'active' : ''} onClick={() => setStandingsView('overall')}>OVERALL</span>
                <span className={standingsView === 'home' ? 'active' : ''} onClick={() => setStandingsView('home')}>HOME</span>
                <span className={standingsView === 'away' ? 'active' : ''} onClick={() => setStandingsView('away')}>AWAY</span>
              </div>
              <div className="live-pill">LIVE <span className="live-dot"></span></div>
            </div>
            
            <table className="standings-table">
              <thead>
                <tr>
                  <th style={{textAlign: 'left'}}>POS</th>
                  <th style={{textAlign: 'left'}}>TEAM</th>
                  <th>P</th><th>W</th><th>D</th><th>L</th><th>DIFF</th><th>PTS</th>
                </tr>
              </thead>
              <tbody>
                {standingsRows.slice(0, 10).map((row: any) => (
                  <tr key={row.team.id} className={row.team.id === homeId || row.team.id === awayId ? 'highlight' : ''}>
                    <td style={{textAlign: 'left'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                        <div className="pos-indicator" style={{background: row.rank <= 4 ? '#22c55e' : row.rank <= 6 ? '#3b82f6' : 'transparent'}}></div>
                        {row.rank}
                      </div>
                    </td>
                    <td style={{textAlign: 'left', fontWeight: 600}}>{row.team.name}</td>
                    <td>{row.all.played}</td>
                    <td>{row.all.win}</td>
                    <td>{row.all.draw}</td>
                    <td>{row.all.lose}</td>
                    <td>{row.goalsDiff}</td>
                    <td style={{fontWeight: 700}}>{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}



      </div>

      <div className="champx-bottom-tabs">
        <div className="cx-tabs-center" style={{width: '100%', display: 'flex', justifyContent: 'space-around'}}>
           <div className={`cx-tab ${activeTab === 'h2h' ? 'active' : ''}`} onClick={() => setActiveTab('h2h')}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
           </div>
           <div className={`cx-tab ${activeTab === 'venue' ? 'active' : ''}`} onClick={() => setActiveTab('venue')}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line><circle cx="12" cy="12" r="3"></circle></svg>
           </div>
           <div className={`cx-tab ${activeTab === 'standings' ? 'active' : ''}`} onClick={() => setActiveTab('standings')}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
           </div>

        </div>
      </div>
    </div>
  );
}

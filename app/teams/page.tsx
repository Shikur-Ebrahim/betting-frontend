'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function TeamsContent() {
  const searchParams = useSearchParams();
  const leagueId = searchParams?.get('league');
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!leagueId) return;
    fetch(`/api/football/teams?league=${leagueId}`)
      .then(res => res.json())
      .then(data => {
        setTeams(data.response || []);
        setLoading(false);
      });
  }, [leagueId]);

  if (!leagueId) return <div>Select a league from sidebar</div>;
  if (loading) return <div className="loader"></div>;

  return (
    <div>
      <h1 className="page-title">League Teams</h1>
      <div className="league-bar" style={{ marginBottom: 0 }}>
        <span>⚽ Teams in League {leagueId}</span>
      </div>
      <div>
        {teams.map((t, idx) => (
          <div key={idx} className="match-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {t.team.logo && <img src={t.team.logo} alt="team" style={{ width: 48, height: 48 }} />}
              <div>
                <h3 style={{ marginBottom: 4 }}>{t.team.name}</h3>
                <span style={{ color: 'var(--text-muted)', fontSize: 13, marginRight: 16 }}>Founded: {t.team.founded}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Stadium: {t.venue.name}</span>
              </div>
            </div>
            <button className="btn-secondary" style={{ background: 'var(--bg-hover)', borderRadius: 6 }}>Follow</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TeamsPage() {
  return (
    <Suspense fallback={<div className="loader"></div>}>
      <TeamsContent />
    </Suspense>
  );
}

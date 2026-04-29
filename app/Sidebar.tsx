'use client';
import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

function SidebarSection({ item, isLiveOpen, currentLeague, pathname, daysFilter, searchQuery, onClose }: { item: any, isLiveOpen: boolean, currentLeague: string | null, pathname: string | null, daysFilter: number, searchQuery: string, onClose?: () => void }) {
  const [isOpen, setIsOpen] = useState(true);

  const getUrl = (leagueId: number) => {
    const params = new URLSearchParams();
    params.set('league', leagueId.toString());
    if (!isLiveOpen) params.set('days', daysFilter.toString());
    if (searchQuery) params.set('q', searchQuery);
    return `${isLiveOpen ? '/live' : '/fixtures'}?${params.toString()}`;
  };

  if (item.type === 'top_leagues') {
    return (
      <div className="tree-container" style={{ marginBottom: 24 }}>
        <div className="tree-header" onClick={() => setIsOpen(!isOpen)} style={{ userSelect: 'none', cursor: 'pointer' }}>
          <div className="tree-icon" style={{ background: 'var(--accent)', borderRadius: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--bg-main)" stroke="var(--bg-main)" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <span style={{ flex: 1 }}>{item.title}</span>
          <svg style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s', opacity: 0.8 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        {isOpen && (
          <div className="tree-body">
            {item.leagues.map((l: any) => {
              const targetUrl = getUrl(l.id);
              const isActive = (pathname === '/live' || pathname === '/fixtures') && currentLeague === String(l.id);
              return (
                <Link key={l.id} href={targetUrl} className={`tree-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <img src={l.logo} alt={l.name} style={{
                    width: l.id === 140 ? 24 : 22, height: l.id === 140 ? 24 : 22, objectFit: 'contain',
                    filter: (l.id === 2 || l.id === 233) ? 'brightness(0) invert(1)' : 'brightness(1.1) contrast(1.1)',
                    background: (l.id === 140 || l.id === 235) ? 'rgba(0,0,0,0.4)' : 'transparent',
                    borderRadius: '50%',
                    padding: (l.id === 140 || l.id === 235) ? '2px' : '0'
                  }} />
                  <span className="tree-text">{l.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (item.type === 'sports') {
    return (
      <div className="tree-container" style={{ paddingBottom: 60 }}>
        <div className="tree-header" onClick={() => setIsOpen(!isOpen)} style={{ userSelect: 'none', cursor: 'pointer' }}>
          <div className="tree-icon" style={{ background: 'var(--accent)', borderRadius: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2"><path d="M17 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zm-5 4v2m0 8v2"></path></svg>
          </div>
          <span style={{ flex: 1 }}>{item.title}</span>
          <svg style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s', opacity: 0.8 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>

        {isOpen && (
          <div style={{ position: 'relative', paddingLeft: 12, paddingTop: 4 }}>
            <div style={{ position: 'absolute', left: 0, top: -14, bottom: '50%', width: 14, borderLeft: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)', borderBottomLeftRadius: 8 }}></div>

            <div style={{ paddingLeft: 10 }}>
              {item.leagues.map((l: any) => {
                const targetUrl = getUrl(l.id);
                const isActive = (pathname === '/live' || pathname === '/fixtures') && currentLeague === String(l.id);
                return (
                  <Link key={l.id} href={targetUrl} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', textDecoration: 'none', color: 'var(--text-main)', fontSize: 13, fontWeight: 600, transition: '0.2s', borderRadius: 6 }} className={`sidebar-hover-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <img src={l.logo} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'contain', filter: 'brightness(1.2)' }} />
                    <span>{l.name}</span>
                  </Link>
                )
              })}
            </div>
            <Link href={isLiveOpen ? "/live" : "/leagues"} style={{ display: 'block', textAlign: 'center', background: '#222', color: 'white', padding: 12, borderRadius: 8, marginTop: 16, fontWeight: 600, fontSize: 14, textDecoration: 'none', transition: '0.2s' }} className="sidebar-hover-item" onClick={onClose}>
              Show all
            </Link>
          </div>
        )}
      </div>
    );
  }
  return null;
}

function SidebarContent() {
  const [items, setItems] = useState<any[]>([]);
  const [searchMatches, setSearchMatches] = useState<any[]>([]);
  const [isSearchingMatches, setIsSearchingMatches] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [oddsFormat, setOddsFormat] = useState('Decimal');
  const [timezone, setTimezone] = useState('UTC+00:00');
  const [dateFormat, setDateFormat] = useState('DD.MM');
  const [timeFormat, setTimeFormat] = useState('24h');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentLeague = searchParams?.get('league') || null;

  const [daysFilter, setDaysFilter] = useState(parseInt(searchParams?.get('days') || '0'));

  useEffect(() => {
    setDaysFilter(parseInt(searchParams?.get('days') || '0'));
  }, [searchParams]);
  const isLiveOpen = pathname === '/live' || searchParams?.get('live') === 'true';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');

  const updateSearchParam = (val: string) => {
    setSearchQuery(val);
    const params = new URLSearchParams(searchParams?.toString());
    if (val) {
      params.set('q', val);
    } else {
      params.delete('q');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const updateDaysParam = (val: number) => {
    setDaysFilter(val);
    const params = new URLSearchParams(searchParams?.toString());
    params.set('days', val.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'leagues_list'), (snap) => {
      if (!snap.exists()) {
        console.warn("[Sidebar] leagues_list config not found in Firestore");
        return;
      }

      const allLeagues = snap.data().leagues || [];
      const topIds = [2, 39, 140, 135, 78, 61, 3, 848]; // UCL, EPL, La Liga, etc.
      
      const topLeagues = allLeagues.filter((l: any) => topIds.includes(Number(l.id)));
      const otherLeagues = allLeagues.filter((l: any) => !topIds.includes(Number(l.id)));

      const categorizedItems = [
        {
          type: 'top_leagues',
          title: 'Top Leagues',
          leagues: topLeagues
        },
        {
          type: 'sports',
          title: 'All Sports',
          leagues: otherLeagues
        }
      ];

      setItems(categorizedItems);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const handleOpenDrawer = () => setMobileMenuOpen(true);
    window.addEventListener('open-mobile-drawer', handleOpenDrawer);
    return () => window.removeEventListener('open-mobile-drawer', handleOpenDrawer);
  }, []);

  // Global Sidebar Discovery Search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchMatches([]);
      return;
    }

    setIsSearchingMatches(true);

    // Discovery: Matches + All Leagues
    Promise.all([
      fetch(`/api/football/fixtures?days=7`).then(res => res.json()),
      fetch(`/api/football/leagues`).then(res => res.json())
    ])
      .then(([fixturesData, leaguesData]) => {
        const q = searchQuery.toLowerCase();

        // 1. Matching Matches
        const matches = (fixturesData.response || []).filter((m: any) =>
          m.teams.home.name.toLowerCase().includes(q) ||
          m.teams.away.name.toLowerCase().includes(q) ||
          m.league.name.toLowerCase().includes(q)
        ).slice(0, 12);

        // 2. Matching Leagues (from global list)
        const leagues = (leaguesData.response || [])
          .filter((l: any) =>
            l.league.name.toLowerCase().includes(q) ||
            l.country.name.toLowerCase().includes(q)
          )
          .map((l: any) => ({
            type: 'league',
            id: l.league.id,
            name: `${l.country.name}. ${l.league.name}`,
            country: l.country.name,
            logo: l.country.flag || l.league.logo
          }))
          .slice(0, 8);

        setSearchMatches([...leagues, ...matches.map((m: any) => ({ type: 'match', ...m }))]);
        setIsSearchingMatches(false);
      })
      .catch(() => setIsSearchingMatches(false));
  }, [searchQuery]);

  const filteredItems = items.map(item => ({
    ...item,
    leagues: item.leagues?.filter((l: any) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []
  })).filter(item => item.leagues.length > 0);

  return (
    <>
      {(
        <div className="mobile-only mobile-inline-nav" style={{ padding: '16px 12px 0 12px' }}>
          <div className="sub-nav-row" style={{ paddingBottom: 0, marginBottom: !isLiveOpen ? 16 : 0 }}>
            <button onClick={() => setMobileMenuOpen(true)} className="sub-btn dark" style={{ flex: 1, gap: 4, height: 40 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              All Sports
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(true);
                router.push(searchQuery ? `/live?q=${searchQuery}` : '/live');
              }}
              className="sub-btn orange"
              style={{ flex: 1.5, height: 40, border: 'none', cursor: 'pointer', color: 'white', fontWeight: 700, fontSize: 13 }}
            >
              Open Live
            </button>
            <button onClick={() => { setMobileMenuOpen(true); setTimeout(() => document.getElementById('sidebar-search-input')?.focus(), 100); }} className="sub-btn dark" style={{ flex: '0 0 40px', padding: 0, justifyContent: 'center', height: 40 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </div>
          {!isLiveOpen && (
            <div className="mobile-day-pills-row">
              {(() => {
                const today = new Date();
                const pills = [
                  { label: 'All', value: 0 },
                  { label: 'Today', value: 1 },
                  { label: 'Tomorrow', value: 2 },
                  ...Array.from({ length: 5 }, (_, i) => {
                    const d = new Date(today);
                    d.setDate(today.getDate() + i + 2);
                    const label = d.toLocaleDateString([], { day: '2-digit', weekday: 'short' });
                    return { label, value: i + 3 };
                  })
                ];
                return pills.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => updateDaysParam(value)}
                    className={`mobile-day-pill${daysFilter === value ? ' active' : ''}`}
                  >
                    {label}
                  </button>
                ));
              })()}
            </div>
          )}
        </div>
      )}

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-modal-open' : 'mobile-modal-closed'}`}>
        {!isCollapsed ? (
          <>
            <div className="sidebar-header">
              <div className="sidebar-top-nav">
                <Link onClick={() => setMobileMenuOpen(false)} href={searchQuery ? `/fixtures?q=${searchQuery}` : '/fixtures'} className={`nav-item ${!isLiveOpen ? 'active' : ''}`}>Prematch</Link>
                <Link onClick={() => setMobileMenuOpen(false)} href={searchQuery ? `/live?q=${searchQuery}` : '/live'} className={`nav-item ${isLiveOpen ? 'active' : ''}`}>Live</Link>

                <button className="nav-item icon-btn desktop-only" onClick={() => setIsCollapsed(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                </button>

                <button className="mobile-only" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: '0 0 40px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>

              <div className="sidebar-search-area">
                {!isLiveOpen && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 4 }}>
                    <div style={{ lineHeight: 1.1, fontWeight: 700, fontSize: 13, width: 44 }}>
                      {daysFilter === 7 ? 'All' : daysFilter === 1 ? '24h' : `${daysFilter}d`}<br />Events
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="7"
                      value={daysFilter}
                      onChange={(e) => setDaysFilter(parseInt(e.target.value))}
                      className="days-slider"
                      style={{
                        '--progress': `${((daysFilter - 1) / 6) * 100}%`,
                        '--gap-color': 'var(--bg-panel)'
                      } as React.CSSProperties}
                    />
                    <div className={`settings-btn ${showSettings ? 'active' : ''}`} onClick={() => setShowSettings(!showSettings)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    </div>
                  </div>
                )}

                {showSettings && (
                  <div className="settings-overlay">
                    <div className="settings-header">
                      <span>Site Settings</span>
                      <button onClick={() => setShowSettings(false)}>×</button>
                    </div>
                    <div className="settings-content">
                      <div className="setting-item">
                        <label>Odds Format</label>
                        <select value={oddsFormat} onChange={(e) => setOddsFormat(e.target.value)}>
                          <option>Decimal</option>
                          <option>Fractional</option>
                          <option>American</option>
                          <option>Hong Kong</option>
                          <option>Indonesian</option>
                          <option>Malaysian</option>
                        </select>
                      </div>
                      <div className="setting-item">
                        <label>Timezone</label>
                        <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                          <option>UTC-05:00 (EST)</option>
                          <option>UTC+00:00 (GMT)</option>
                          <option>UTC+01:00 (CET)</option>
                          <option>UTC+03:00 (EAT)</option>
                          <option>UTC+09:00 (JST)</option>
                        </select>
                      </div>
                      <div className="setting-item">
                        <label>Date Format</label>
                        <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                          <option>DD.MM</option>
                          <option>MM.DD</option>
                          <option>YYYY-MM-DD</option>
                        </select>
                      </div>
                      <div className="setting-item">
                        <label>Time Format</label>
                        <select value={timeFormat} onChange={(e) => setTimeFormat(e.target.value)}>
                          <option>24h</option>
                          <option>12h (AM/PM)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="search-bar" style={{ marginBottom: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input
                    id="sidebar-search-input"
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => updateSearchParam(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'white', flex: 1, outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div className="sidebar-body">
              {searchQuery.length >= 2 ? (
                <div className="sidebar-search-results">
                  {isSearchingMatches ? (
                    <div style={{ padding: 20, textAlign: 'center', opacity: 0.5 }}>Searching...</div>
                  ) : searchMatches.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {searchMatches.map((item: any, idx) => {
                        if (item.type === 'league') {
                          return (
                            <Link
                              key={`l-${item.id}`}
                              href={`/fixtures?league=${item.id}&q=${searchQuery}`}
                              style={{ padding: '8px 12px', background: 'var(--bg-panel)', borderRadius: 8, textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid transparent' }}
                              className="sidebar-search-item"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <div style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>🏆</div>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: 10, color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.country}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                              </div>
                            </Link>
                          );
                        }

                        const m = item;
                        return (
                          <Link
                            key={`m-${m.fixture.id}`}
                            href={`/fixtures?league=${m.league.id}&q=${searchQuery}`}
                            style={{ padding: '10px 12px', background: 'var(--bg-panel)', borderRadius: 8, textDecoration: 'none', color: 'var(--text-main)', border: '1px solid transparent', transition: '0.2s', display: 'block' }}
                            className="sidebar-search-item"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div style={{ fontSize: 10, color: '#999', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              Football. {m.league.country}. {m.league.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <img src={m.teams.home.logo} style={{ width: 14, height: 14 }} alt="" />
                                  <span style={{ fontSize: 12, fontWeight: 700 }}>{m.teams.home.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <img src={m.teams.away.logo} style={{ width: 14, height: 14 }} alt="" />
                                  <span style={{ fontSize: 12, fontWeight: 700 }}>{m.teams.away.name}</span>
                                </div>
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800 }}>
                                {new Date(m.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: 20, textAlign: 'center', opacity: 0.5 }}>No results found</div>
                  )}
                </div>
              ) : (
                <>
                  {filteredItems.map((item, idx) => (
                    <SidebarSection key={idx} item={item} isLiveOpen={isLiveOpen} currentLeague={currentLeague} pathname={pathname} daysFilter={daysFilter} searchQuery={searchQuery} onClose={() => setMobileMenuOpen(false)} />
                  ))}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="collapsed-sidebar-content">
            <div className="collapsed-toggle" onClick={() => setIsCollapsed(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><polyline points="13 15 16 12 13 9"></polyline><line x1="10" y1="3" x2="10" y2="21"></line></svg>
            </div>
            <div className="collapsed-search-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <div className="collapsed-icon-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
            </div>
            <div className="collapsed-icon-item active">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path><path d="M22 12a10 10 0 0 1-10 10"></path><path d="M12 22a10 10 0 0 1-10-10"></path><path d="M2 12a10 10 0 0 1 10-10"></path><path d="M12 12L8 8"></path><path d="M12 12l4 4"></path><path d="M12 12l4-4"></path><path d="M12 12l-4 4"></path></svg>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<aside className="sidebar"><div className="loader"></div></aside>}>
      <SidebarContent />
    </Suspense>
  )
}

'use client';
import { useState, useEffect } from 'react';
import { BetSelection, getBetslip, removeBet, clearBetslip } from '../lib/betslip';

export default function BetslipRightPanel() {
  const [bets, setBets] = useState<BetSelection[]>([]);
  const [stake, setStake] = useState<string>('100');
  const [isPlacing, setIsPlacing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successCode, setSuccessCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('Ordinary');
  const [loadCode, setLoadCode] = useState('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    setBets(getBetslip());
    const handleUpdate = (e: any) => setBets(e.detail);
    window.addEventListener('betslip-updated', handleUpdate);
    return () => window.removeEventListener('betslip-updated', handleUpdate);
  }, []);

  const totalOdds = bets.reduce((acc, b) => acc * b.odd, 1);
  const potentialWin = parseFloat(stake || '0') * totalOdds;

  const handlePlaceBet = async () => {
    const userId = localStorage.getItem('user_uid');
    
    if (!userId) {
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));
      return;
    }

    setErrorMsg('');
    setIsPlacing(true);

    try {
      const res = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          stake: parseFloat(stake || '0'),
          bets,
          totalOdds,
          potentialWin
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place bet');
      }

      setSuccessCode(data.betCode);
      clearBetslip();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsPlacing(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccessCode('');
    setErrorMsg('');
  };

  const loadTicket = async (code: string) => {
    if (!code.trim()) return;
    setLoadError('');
    setIsLoadingCode(true);
    try {
      const res = await fetch(`/api/tickets/load?code=${code.trim()}`);
      const data = await res.json();
      
      if (data.expired) {
        setLoadError(data.message || data.error || 'This ticket is expired — at least one game has already started.');
        return;
      }

      if (!res.ok) throw new Error(data.error || 'This ticket is expired — at least one game has already started.');
      localStorage.setItem('betslip', JSON.stringify(data.bets));
      window.dispatchEvent(new CustomEvent('betslip-updated', { detail: data.bets }));
      setLoadCode('');
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setIsLoadingCode(false);
    }
  };

  return (
    <>
      <div className="betslip-tabs">
        <div className={`betslip-tab ${activeTab === 'Ordinary' ? 'active' : ''}`} onClick={() => setActiveTab('Ordinary')}>Ordinary</div>
        <div className={`betslip-tab ${activeTab === 'Express' ? 'active' : ''}`} onClick={() => setActiveTab('Express')}>Express</div>
        <div className={`betslip-tab ${activeTab === 'System' ? 'active' : ''}`} onClick={() => setActiveTab('System')}>System</div>
      </div>
      
      {successCode ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', flex: 1 }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(255, 107, 0, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h3 style={{ margin: '0 0 8px', fontWeight: 900, color: 'white' }}>Bet Placed!</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '14px' }}>Your ticket has been registered successfully.</p>
          <div 
            onClick={() => {
              navigator.clipboard.writeText(successCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            style={{ background: 'var(--bg-main)', border: copied ? '2px dashed #15803d' : '2px dashed var(--border)', padding: '20px', borderRadius: '12px', display: 'inline-block', minWidth: '200px', cursor: 'pointer', transition: '0.2s' }}
            title="Click to copy"
          >
            <span style={{ fontSize: '12px', color: copied ? '#15803d' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: copied ? 800 : 400 }}>
              {copied ? 'Copied!' : 'Bet Code'}
            </span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '2px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {successCode}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </div>
          </div>
          <button 
            onClick={handleCloseSuccess}
            style={{ marginTop: '40px', width: '100%', padding: '16px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border)', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
          >
            Continue Betting
          </button>
        </div>
      ) : bets.length === 0 ? (
        <>
          <div className="betslip-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.5, marginBottom: 16 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <p>Your bet slip is empty</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>Please select odds to start viewing selections.</p>
            
            {/* Load by bet code */}
            <div style={{ marginTop: 20, width: '100%', position: 'relative' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700 }}>Or load a bet code</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="Paste code (e.g. TXA12BC)"
                  value={loadCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setLoadCode(val);
                    setLoadError('');
                    if (val.length === 20 || val.length === 8) loadTicket(val);
                  }}
                  style={{ flex: 1, background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'white', fontSize: 12, fontWeight: 700, outline: 'none', letterSpacing: '0.5px' }}
                />
                {isLoadingCode && <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }}></div>}
              </div>
              {loadError && <div style={{ marginTop: 8, color: '#92400e', fontSize: 11, fontWeight: 700, background: '#fff3cd', border: '1px solid #fcd34d', padding: '6px 10px', borderRadius: 6, lineHeight: 1.4 }}>{loadError}</div>}
            </div>
          </div>
          <div style={{ padding: 24, marginTop: 'auto' }}>
            <button disabled style={{ width: '100%', padding: '16px', background: 'var(--bg-card)', color: 'var(--text-muted)', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '16px' }}>
              Make bet
            </button>
          </div>
        </>
      ) : (
        <div className="betslip-active-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="betslip-list" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {bets.map(bet => (
              <div key={bet.matchId} style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 800 }}>{bet.leagueName}</span>
                  <button onClick={() => removeBet(bet.matchId)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px', color: 'white' }}>{bet.homeTeam} vs {bet.awayTeam}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Selection: <strong style={{ color: 'var(--text-main)' }}>{bet.selection === 'draw' ? 'X' : (bet.selection === 'home' ? '1' : (bet.selection === 'away' ? '2' : bet.selection))}</strong></span>
                  <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{bet.odd.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '20px', background: 'var(--bg-main)', borderTop: '1px solid var(--bg-hover)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
              <span>Total Odds</span>
              <span style={{ fontWeight: 800, color: 'white' }}>{totalOdds.toFixed(2)}</span>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Stake Amount (BIRR)</div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  value={stake} 
                  onChange={e => setStake(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--bg-hover)', color: 'white', borderRadius: '8px', fontSize: '16px', fontWeight: 700, outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Potential Payout</span>
              <span style={{ fontWeight: 800, color: 'white', fontSize: '18px' }}>{potentialWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Birr</span>
            </div>
            
            {errorMsg && (
              <div style={{ color: '#ff3b30', fontSize: '13px', fontWeight: 800, marginBottom: '16px', textAlign: 'center', background: 'rgba(255, 59, 48, 0.1)', padding: '10px', borderRadius: '8px' }}>
                {errorMsg}
              </div>
            )}

            <button 
              onClick={handlePlaceBet} 
              disabled={isPlacing || parseFloat(stake) <= 0}
              style={{ 
                width: '100%', 
                padding: '16px', 
                background: 'var(--accent)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: '800', 
                fontSize: '16px', 
                cursor: (isPlacing || parseFloat(stake) <= 0) ? 'not-allowed' : 'pointer', 
                transition: '0.2s',
                opacity: (isPlacing || parseFloat(stake) <= 0) ? 0.7 : 1
              }}
            >
              {isPlacing ? 'PROCESSING...' : 'PLACE BET NOW'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

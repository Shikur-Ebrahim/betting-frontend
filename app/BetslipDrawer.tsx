'use client';
import { useState, useEffect } from 'react';
import { BetSelection, getBetslip, removeBet, clearBetslip } from '../lib/betslip';

export default function BetslipDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [bets, setBets] = useState<BetSelection[]>([]);
  const [stake, setStake] = useState<string>('100');
  const [isPlacing, setIsPlacing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successCode, setSuccessCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadCode, setLoadCode] = useState('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    setBets(getBetslip());
    const handleUpdate = (e: any) => setBets(e.detail);
    window.addEventListener('betslip-updated', handleUpdate);
    
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-betslip', handleOpen);

    return () => {
      window.removeEventListener('betslip-updated', handleUpdate);
      window.removeEventListener('open-betslip', handleOpen);
    };
  }, []);

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessCode('');
      setIsPlacing(false);
      setLoadCode('');
      setLoadError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalOdds = bets.reduce((acc, b) => acc * b.odd, 1);
  const potentialWin = parseFloat(stake || '0') * totalOdds;

  const handlePlaceBet = async () => {
    const userId = localStorage.getItem('user_uid');
    
    if (!userId) {
      setIsOpen(false);
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
    <div className="betslip-overlay" onClick={() => setIsOpen(false)}>
      <div className="betslip-drawer" onClick={e => e.stopPropagation()}>
        <div className="betslip-header">
          <div className="betslip-title">
            Betslip <span>{bets.length}</span>
          </div>
          
          <div className="load-ticket-container">
            <input 
              type="text" 
              placeholder="Load Bet Code..." 
              value={loadCode}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setLoadCode(val);
                setLoadError('');
                // Firestore doc IDs are 20 chars; old TX codes are 8 chars
                if (val.length === 20 || val.length === 8) {
                  loadTicket(val);
                }
              }}
            />
            {isLoadingCode && <div className="spinner-small"></div>}
            {loadError && <div className="load-error-tooltip">{loadError}</div>}
          </div>

          <button className="betslip-close" onClick={() => setIsOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="betslip-body">
          {successCode ? (
            <div className="success-ticket">
              <div className="success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <h3 style={{ margin: '16px 0 8px', fontWeight: 900 }}>Bet Placed Successfully!</h3>
              <p style={{ color: '#666', marginBottom: '24px' }}>Your ticket has been registered.</p>
              <div 
                className="bet-code-box"
                onClick={() => {
                  navigator.clipboard.writeText(successCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{ cursor: 'pointer', transition: '0.2s' }}
                title="Click to copy"
              >
                <span style={{ fontSize: '12px', color: copied ? '#15803d' : '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: copied ? 800 : 400 }}>
                  {copied ? 'Copied to clipboard!' : 'Bet Code'}
                </span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#000', letterSpacing: '2px', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {successCode}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ marginTop: '24px', width: '100%', padding: '14px', background: '#f5f5f5', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          ) : bets.length === 0 ? (
            <div className="empty-betslip">
              <div className="empty-icon-circle">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="4"></line>
                  <line x1="8" y1="2" x2="8" y2="4"></line>
                </svg>
              </div>
              <p>Your betslip is empty</p>
              <span>Select matches to start betting.</span>
            </div>
          ) : (
            <div className="bets-list">
              {bets.map(bet => (
                <div key={bet.matchId} className="bet-item">
                  <div className="bet-item-main">
                    <div className="bet-item-info">
                      <div className="bet-league-tag">{bet.leagueName}</div>
                      <div className="bet-match-name">{bet.homeTeam} vs {bet.awayTeam}</div>
                      <div className="bet-selection-detail">
                        Result: <strong>{bet.selection === 'draw' ? 'X' : (bet.selection === 'home' ? '1' : (bet.selection === 'away' ? '2' : bet.selection))}</strong>
                      </div>
                    </div>
                    <div className="bet-item-odd">
                      <div className="odd-val">{bet.odd.toFixed(2)}</div>
                      <button className="remove-bet-btn" onClick={() => removeBet(bet.matchId)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {bets.length > 0 && (
          <div className="betslip-footer">
            <div className="stake-section">
              <div className="stake-header">
                <span>Stake Amount</span>
                <span className="total-odds-val">Total Odds: {totalOdds.toFixed(2)}</span>
              </div>

              <div className="custom-stake-wrapper">
                <input 
                  type="number" 
                  value={stake} 
                  onChange={e => setStake(e.target.value)}
                  placeholder="Enter stake..."
                />
                <span className="currency-label">BIRR</span>
              </div>
            </div>

            <div className="payout-section">
              <div className="payout-row">
                <span className="p-label">Potential Payout</span>
                <span className="p-val">{potentialWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Birr</span>
              </div>
              
              {errorMsg && (
                <div style={{ color: '#ff3b30', fontSize: '13px', fontWeight: 800, marginBottom: '12px', textAlign: 'center', background: 'rgba(255, 59, 48, 0.1)', padding: '8px', borderRadius: '8px' }}>
                  {errorMsg}
                </div>
              )}

              <button className="place-bet-confirm" onClick={handlePlaceBet} disabled={isPlacing || parseFloat(stake) <= 0}>
                {isPlacing ? 'PROCESSING...' : 'PLACE BET NOW'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .betslip-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: flex-end;
        }
        .betslip-drawer {
          width: 100%;
          background: #ffffff;
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
          display: flex;
          flex-direction: column;
          max-height: 92vh;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.2);
          animation: slideUp 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
          color: #1a1a1a;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .betslip-header {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f0f0f0;
          gap: 8px;
        }
        .load-ticket-container {
          display: flex;
          align-items: center;
          background: #f5f5f5;
          border-radius: 8px;
          padding: 4px 4px 4px 10px;
          flex: 1;
          position: relative;
          min-width: 0;
        }
        .load-ticket-container input {
          border: none;
          background: transparent;
          font-size: 12px;
          width: 100%;
          outline: none;
          color: #333;
          font-weight: 700;
          letter-spacing: 0.5px;
          min-width: 0;
        }
        .load-ticket-container input::placeholder {
          color: #aaa;
          font-weight: 500;
          letter-spacing: 0;
        }
        .load-ticket-container > button {
          background: #ff6b00;
          color: white;
          border: none;
          border-radius: 6px;
          width: 28px;
          height: 28px;
          min-width: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .load-ticket-container > button:disabled { opacity: 0.7; }
        .spinner-small {
          width: 13px;
          height: 13px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .load-error-tooltip {
          position: absolute;
          bottom: -40px;
          left: 0;
          right: 0;
          background: #fff3cd;
          color: #92400e;
          font-size: 11px;
          padding: 6px 10px;
          border-radius: 6px;
          text-align: center;
          font-weight: 700;
          z-index: 10;
          border: 1px solid #fcd34d;
          line-height: 1.4;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .betslip-title {
          font-weight: 900;
          font-size: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #000;
        }
        .betslip-title span {
          background: #ff6b00;
          color: white;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 800;
        }
        .betslip-close {
          background: #f5f5f5;
          border: none;
          color: #000;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .betslip-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
        }
        .empty-betslip {
          text-align: center;
          padding: 40px 20px;
        }
        .empty-icon-circle {
          width: 72px;
          height: 72px;
          background: #f9f9f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: #ccc;
        }
        .empty-betslip p {
          font-weight: 800;
          font-size: 18px;
          color: #333;
          margin-bottom: 6px;
        }
        .empty-betslip span {
          font-size: 14px;
          color: #999;
        }
        .success-ticket {
          text-align: center;
          padding: 40px 20px;
        }
        .success-icon {
          width: 80px;
          height: 80px;
          background: rgba(255, 107, 0, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        .bet-code-box {
          background: #fff;
          border: 2px dashed #e0e0e0;
          padding: 16px;
          border-radius: 16px;
          display: inline-block;
          min-width: 200px;
        }
        .bets-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .bet-item {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 12px;
          border: 1px solid #eee;
        }
        .bet-item-main {
          display: flex;
          justify-content: space-between;
        }
        .bet-league-tag {
          font-size: 10px;
          font-weight: 800;
          color: #ff6b00;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .bet-match-name {
          font-weight: 800;
          font-size: 15px;
          margin-bottom: 8px;
          color: #000;
        }
        .bet-selection-detail {
          font-size: 13px;
          color: #666;
        }
        .bet-selection-detail strong {
          color: #000;
          font-weight: 900;
        }
        .bet-item-odd {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-between;
        }
        .odd-val {
          font-weight: 900;
          font-size: 18px;
          color: #ff6b00;
        }
        .remove-bet-btn {
          background: #fff;
          border: 1px solid #eee;
          color: #ff3b30;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .betslip-footer {
          background: #fff;
          padding: 16px 20px;
          border-top: 1px solid #f0f0f0;
          box-shadow: 0 -10px 30px rgba(0,0,0,0.03);
        }
        .stake-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .stake-header span:first-child {
          font-weight: 800;
          font-size: 14px;
          color: #666;
        }
        .total-odds-val {
          background: #f0f0f0;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 800;
          color: #333;
        }

        .custom-stake-wrapper {
          position: relative;
          margin-bottom: 16px;
        }
        .custom-stake-wrapper input {
          width: 100%;
          background: #f8f9fa;
          border: 2px solid #eee;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 900;
          color: #000;
          outline: none;
          transition: 0.2s;
        }
        .custom-stake-wrapper input:focus {
          border-color: #ff6b00;
          background: #fff;
        }
        .currency-label {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-weight: 900;
          font-size: 12px;
          color: #999;
          letter-spacing: 1px;
        }
        .payout-section {
          background: #000;
          border-radius: 16px;
          padding: 16px;
        }
        .payout-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .p-label {
          color: #999;
          font-size: 13px;
          font-weight: 700;
        }
        .p-val {
          color: #fff;
          font-weight: 900;
          font-size: 20px;
        }
        .place-bet-confirm {
          width: 100%;
          background: linear-gradient(135deg, #ff8c00, #ff6b00);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 900;
          font-size: 15px;
          letter-spacing: 1px;
          box-shadow: 0 8px 25px rgba(255, 107, 0, 0.4);
          cursor: pointer;
        }
        .place-bet-confirm:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

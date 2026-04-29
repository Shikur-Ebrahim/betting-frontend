'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ResultCheckPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState('');

  const checkResult = async (inputCode: string) => {
    if (!inputCode.trim()) return;
    setError('');
    setTicket(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/check?code=${inputCode.trim()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ticket not found. Please check your bet code.');
        return;
      }

      setTicket(data.ticket);
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (val: string) => {
    const trimmed = val.toUpperCase();
    setCode(trimmed);
    setError('');
    setTicket(null);
    // Auto-trigger: 20 chars = new Firestore ID, 8 chars = old TX code
    if (trimmed.length === 20 || trimmed.length === 8) {
      checkResult(trimmed);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'won') return '#15803d';
    if (status === 'lost') return '#dc2626';
    return '#f59e0b';
  };

  const getStatusBg = (status: string) => {
    if (status === 'won') return '#dcfce7';
    if (status === 'lost') return '#fee2e2';
    return '#fef3c7';
  };

  const getPickLabel = (selection: string) =>
    selection === 'draw' ? 'X' : selection === 'home' ? '1' : selection === 'away' ? '2' : selection;

  const ticketStatus = ticket?.status || 'pending';

  return (
    <div className="rc-page">
      {/* Header */}
      <div className="rc-header">
        <Link href="/" className="rc-back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Back to Sports
        </Link>
        <div className="rc-header-center">
          <div className="rc-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          </div>
          <h1>Result Check</h1>
          <p>Enter your bet code to see the result</p>
        </div>
      </div>

      {/* Search */}
      <div className="rc-search-area">
        <div className="rc-search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            type="text"
            placeholder="Paste your bet code here..."
            value={code}
            onChange={(e) => handleInput(e.target.value)}
            maxLength={25}
            autoFocus
          />
          {loading && <div className="rc-spinner"></div>}
          {code && !loading && (
            <button className="rc-clear" onClick={() => { setCode(''); setTicket(null); setError(''); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}
        </div>

        {error && (
          <div className="rc-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}
      </div>

      {/* Result card - styled like Bet History */}
      {ticket && (
        <div className="rc-content">
          <div className="ticket-card">
            {/* Ticket header */}
            <div className="ticket-header">
              <div className="ticket-header-left">
                <span className="ticket-label">BET CODE</span>
                <span className="ticket-code">{ticket.betCode || ticket.id}</span>
              </div>
              <div className="ticket-status" style={{ color: getStatusColor(ticketStatus), background: getStatusBg(ticketStatus) }}>
                {ticketStatus.toUpperCase()}
              </div>
            </div>

            {/* Meta */}
            <div className="ticket-meta">
              <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</span>
              <span>{ticket.bets?.length || 0} Selections</span>
            </div>

            {/* Selections */}
            <div className="ticket-selections">
              {ticket.bets?.map((bet: any, idx: number) => {
                const isWon = bet.result === 'won';
                const isLost = bet.result === 'lost';
                const pickLabel = getPickLabel(bet.selection);

                return (
                  <div key={idx} className={`selection-item ${isWon ? 'result-won' : isLost ? 'result-lost' : ''}`}>
                    <div className="selection-match">
                      <div className="selection-league">{bet.leagueName}</div>
                      <div className="selection-teams">{bet.homeTeam} vs {bet.awayTeam}</div>
                    </div>
                    <div className="selection-odds">
                      <div className="selection-pick">
                        {isWon ? (
                          <span className="bet-result-badge win">✓ WIN</span>
                        ) : isLost ? (
                          <span className="bet-result-badge lose">✗ LOST</span>
                        ) : (
                          <>Pick: <strong>{pickLabel}</strong></>
                        )}
                      </div>
                      <div className="selection-odd-val" style={{ color: isWon ? '#15803d' : isLost ? '#dc2626' : '#ff6b00' }}>
                        {bet.odd?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="ticket-footer">
              <div className="footer-col">
                <span className="footer-label">Total Odds</span>
                <span className="footer-val">{ticket.totalOdds?.toFixed(2) || '—'}</span>
              </div>
              <div className="footer-col center">
                <span className="footer-label">Stake</span>
                <span className="footer-val">{ticket.stake?.toFixed(2)} Birr</span>
              </div>
              <div className="footer-col right">
                <span className="footer-label">Potential Payout</span>
                <span className="footer-val accent">{ticket.potentialWin?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Birr</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!ticket && !loading && !error && (
        <div className="rc-empty">
          <div className="rc-empty-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </div>
          <p className="rc-empty-title">Enter a Bet Code</p>
          <p className="rc-empty-sub">Type or paste the code from your ticket to instantly check the result.</p>
        </div>
      )}

      <style jsx>{`
        .rc-page {
          position: fixed;
          inset: 0;
          z-index: 999999;
          overflow-y: auto;
          background: #f8f9fa;
          font-family: 'Inter', system-ui, sans-serif;
          color: #111827;
        }

        /* ─── Header ─── */
        .rc-header {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: clamp(16px, 5vw, 28px) clamp(16px, 5vw, 28px) clamp(32px, 8vw, 48px);
        }

        .rc-back {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          font-size: clamp(13px, 3.5vw, 14px);
          font-weight: 600;
          margin-bottom: clamp(16px, 4vw, 24px);
          transition: 0.2s;
        }
        .rc-back:hover { color: white; }

        .rc-header-center { text-align: center; }

        .rc-icon {
          width: clamp(52px, 14vw, 68px);
          height: clamp(52px, 14vw, 68px);
          background: linear-gradient(135deg, #ff6b00, #ff8c00);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto clamp(10px, 3vw, 16px);
          box-shadow: 0 8px 24px rgba(255,107,0,0.4);
        }

        .rc-header-center h1 {
          margin: 0 0 6px;
          font-size: clamp(18px, 6vw, 32px);
          font-weight: 900;
          color: white;
          letter-spacing: -0.5px;
        }

        .rc-header-center p {
          margin: 0;
          color: rgba(255,255,255,0.55);
          font-size: clamp(11px, 3.2vw, 14px);
        }

        /* ─── Search ─── */
        .rc-search-area {
          max-width: 640px;
          margin: -22px auto 0;
          padding: 0 clamp(12px, 4vw, 24px);
          position: relative;
          z-index: 2;
        }

        .rc-search-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          border-radius: 14px;
          padding: clamp(14px, 4vw, 18px) clamp(14px, 4vw, 20px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          border: 2px solid transparent;
          transition: 0.2s;
        }
        .rc-search-box:focus-within {
          border-color: #ff6b00;
          box-shadow: 0 8px 30px rgba(255,107,0,0.15);
        }

        .rc-search-box input {
          flex: 1;
          border: none;
          outline: none;
          font-size: clamp(14px, 4vw, 17px);
          font-weight: 700;
          color: #111827;
          letter-spacing: 0.5px;
          background: transparent;
          min-width: 0;
        }
        .rc-search-box input::placeholder { color: #9ca3af; font-weight: 400; letter-spacing: 0; }

        .rc-spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid #e5e7eb;
          border-top-color: #ff6b00;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .rc-clear {
          background: #f3f4f6;
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6b7280;
          flex-shrink: 0;
        }

        .rc-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 12px;
          background: #fff3cd;
          border: 1px solid #fcd34d;
          color: #92400e;
          font-size: clamp(12px, 3.2vw, 13px);
          font-weight: 700;
          padding: 10px 14px;
          border-radius: 10px;
          line-height: 1.4;
        }

        /* ─── Content ─── */
        .rc-content {
          max-width: 640px;
          margin: clamp(16px, 4vw, 28px) auto 40px;
          padding: 0 clamp(12px, 4vw, 24px);
        }

        /* ─── Ticket card (matches BetHistory style) ─── */
        .ticket-card {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.07);
          border: 1px solid #f3f4f6;
          overflow: hidden;
        }

        .ticket-header {
          padding: clamp(16px, 4vw, 20px) clamp(16px, 4vw, 24px) clamp(12px, 3vw, 16px);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #f3f4f6;
        }

        .ticket-header-left { display: flex; flex-direction: column; gap: 4px; }

        .ticket-label {
          font-size: clamp(10px, 2.8vw, 11px);
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6b7280;
          font-weight: 700;
        }

        .ticket-code {
          font-size: clamp(14px, 4.5vw, 22px);
          font-weight: 900;
          letter-spacing: 0.5px;
          color: #111827;
          word-break: break-all;
        }

        .ticket-status {
          padding: 5px 12px;
          border-radius: 20px;
          font-size: clamp(10px, 3vw, 12px);
          font-weight: 800;
          letter-spacing: 0.5px;
          white-space: nowrap;
          margin-left: 8px;
        }

        .ticket-meta {
          padding: clamp(10px, 3vw, 12px) clamp(16px, 4vw, 24px);
          display: flex;
          justify-content: space-between;
          background: #f9fafb;
          border-bottom: 1px solid #f3f4f6;
          font-size: clamp(10px, 3.2vw, 13px);
          color: #4b5563;
          font-weight: 600;
        }

        .ticket-selections {
          padding: clamp(12px, 3.5vw, 16px) clamp(16px, 4vw, 24px);
          display: flex;
          flex-direction: column;
          gap: clamp(12px, 3vw, 16px);
        }

        .selection-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: clamp(12px, 3vw, 16px);
          border-bottom: 1px dashed #e5e7eb;
        }
        .selection-item:last-child { border-bottom: none; padding-bottom: 0; }

        .selection-item.result-won {
          background: #f0fdf4;
          border-radius: 8px;
          padding: 10px 12px;
          margin: -4px -12px;
          border-bottom: 1px dashed #bbf7d0 !important;
        }
        .selection-item.result-lost {
          background: #fff1f2;
          border-radius: 8px;
          padding: 10px 12px;
          margin: -4px -12px;
          border-bottom: 1px dashed #fecaca !important;
        }

        .selection-match { flex: 1; padding-right: 12px; min-width: 0; }

        .selection-league {
          font-size: clamp(9px, 2.5vw, 10px);
          text-transform: uppercase;
          color: #ff6b00;
          font-weight: 800;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .selection-teams {
          font-size: clamp(12px, 3.8vw, 15px);
          font-weight: 700;
          color: #1f2937;
          line-height: 1.3;
        }

        .selection-odds { text-align: right; flex-shrink: 0; }

        .selection-pick {
          font-size: clamp(10px, 3vw, 12px);
          color: #6b7280;
          margin-bottom: 4px;
        }
        .selection-pick strong { color: #111827; font-weight: 800; }

        .bet-result-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: clamp(10px, 2.8vw, 11px);
          font-weight: 800;
          letter-spacing: 0.4px;
          margin-bottom: 4px;
        }
        .bet-result-badge.win { background: #dcfce7; color: #15803d; }
        .bet-result-badge.lose { background: #fee2e2; color: #dc2626; }

        .selection-odd-val {
          font-size: clamp(14px, 4vw, 16px);
          font-weight: 900;
          transition: 0.2s;
        }

        .ticket-footer {
          background: #f9fafb;
          padding: clamp(14px, 4vw, 20px) clamp(16px, 4vw, 24px);
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #e5e7eb;
          flex-wrap: wrap;
          gap: 8px;
        }

        .footer-col { display: flex; flex-direction: column; gap: 4px; }
        .footer-col.center { align-items: center; }
        .footer-col.right { align-items: flex-end; }

        .footer-label {
          font-size: clamp(10px, 2.8vw, 12px);
          color: #6b7280;
          font-weight: 600;
        }

        .footer-val {
          font-size: clamp(13px, 3.8vw, 16px);
          font-weight: 800;
          color: #1f2937;
        }

        .footer-val.accent {
          font-size: clamp(13px, 4vw, 18px);
          color: #15803d;
          font-weight: 900;
        }

        /* ─── Empty state ─── */
        .rc-empty {
          text-align: center;
          padding: clamp(40px, 12vw, 80px) clamp(20px, 6vw, 40px);
          max-width: 360px;
          margin: 0 auto;
        }

        .rc-empty-icon {
          width: clamp(64px, 18vw, 88px);
          height: clamp(64px, 18vw, 88px);
          background: #f3f4f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto clamp(16px, 4vw, 24px);
        }

        .rc-empty-title {
          font-size: clamp(16px, 5vw, 20px);
          font-weight: 800;
          color: #111827;
          margin: 0 0 8px;
        }

        .rc-empty-sub {
          font-size: clamp(12px, 3.5vw, 14px);
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

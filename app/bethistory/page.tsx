'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BetHistory() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const userId = localStorage.getItem('user_uid');
      if (!userId) {
        setError('Please log in to view your bet history.');
        setLoading(false);
        return;
      }

      try {
        // Silently trigger settlement engine to resolve any finished tickets
        await fetch('/api/tickets/settle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        }).catch(e => console.error('Silent settlement failed:', e));

        const res = await fetch(`/api/tickets/history?userId=${userId}`);
        const data = await res.json();
        if (data.success) {
          setTickets(data.tickets);
        } else {
          setError(data.error || 'Failed to load bet history');
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred while fetching your history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'won': return '#15803d'; // Green
      case 'lost': return '#dc2626'; // Red
      default: return '#f59e0b'; // Orange/Pending
    }
  };

  const getStatusBg = (status: string) => {
    switch(status.toLowerCase()) {
      case 'won': return '#dcfce7';
      case 'lost': return '#fee2e2';
      default: return '#fef3c7';
    }
  };

  return (
    <div className="bet-history-page">
      <div className="history-header-container">
        <div className="history-header">
          <Link href="/" className="back-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            Back to Sports
          </Link>
          <h1>My Bet History</h1>
        </div>
      </div>

      <div className="history-content">
        {loading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading your tickets...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <p>{error}</p>
            <Link href="/" className="primary-btn">Go to Home</Link>
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="4"></line><line x1="8" y1="2" x2="8" y2="4"></line></svg>
            </div>
            <h2>No Bets Found</h2>
            <p>You haven't placed any bets yet. Head over to the sports section to get started.</p>
            <Link href="/" className="primary-btn">Start Betting</Link>
          </div>
        ) : (
          <div className="tickets-grid">
            {tickets.map(ticket => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <div className="ticket-header-left">
                    <span className="ticket-label">Bet Code</span>
                    <div 
                      className="ticket-code-container"
                      onClick={() => {
                        if (ticket.betCode) {
                          navigator.clipboard.writeText(ticket.betCode);
                          setCopiedId(ticket.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }
                      }}
                      title="Click to copy"
                    >
                      <span className="ticket-code" style={{ color: copiedId === ticket.id ? '#15803d' : '#111827' }}>
                        {copiedId === ticket.id ? 'COPIED!' : (ticket.betCode || 'N/A')}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={copiedId === ticket.id ? "#15803d" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: copiedId === ticket.id ? 1 : 0.6, transition: '0.2s' }}>
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </div>
                  </div>
                  <div 
                    className="ticket-status" 
                    style={{ 
                      color: getStatusColor(ticket.status || 'pending'), 
                      backgroundColor: getStatusBg(ticket.status || 'pending') 
                    }}
                  >
                    {(ticket.status || 'Pending').toUpperCase()}
                  </div>
                </div>

                <div className="ticket-meta">
                  <span>{new Date(ticket.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  <span>{ticket.bets?.length || 0} Selections</span>
                </div>

                <div className="ticket-selections">
                  {ticket.bets && ticket.bets.map((bet: any, idx: number) => {
                    const betResult = bet.result; // 'won', 'lost', 'pending', or undefined
                    const isWon = betResult === 'won';
                    const isLost = betResult === 'lost';
                    const pickLabel = bet.selection === 'draw' ? 'X' : (bet.selection === 'home' ? '1' : (bet.selection === 'away' ? '2' : bet.selection));

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
                          <div className="selection-odd-val" style={{ color: isWon ? '#15803d' : isLost ? '#dc2626' : '#ff6b00' }}>{bet.odd.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="ticket-footer">
                  <div className="footer-col">
                    <span className="footer-label">Total Odds</span>
                    <span className="footer-val">{ticket.totalOdds?.toFixed(2) || '-'}</span>
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
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .bet-history-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999999;
          overflow-y: auto;
          background-color: #f8f9fa; /* Clean light gray background */
          color: #1a1a1a;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .history-header-container {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .history-header {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #6b7280;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: 0.2s;
        }

        .back-link:hover {
          color: #111827;
        }

        .history-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
          color: #111827;
          letter-spacing: -0.5px;
        }

        .history-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
        }

        .loading-state, .error-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .loading-state p, .error-state p, .empty-state p {
          color: #6b7280;
          margin-top: 16px;
          font-size: 15px;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          background: #f3f4f6;
          color: #9ca3af;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .empty-state h2 {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
          color: #111827;
        }

        .primary-btn {
          display: inline-block;
          margin-top: 24px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #ff8c00, #ff6b00);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(255, 107, 0, 0.2);
          transition: 0.2s;
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255, 107, 0, 0.3);
        }

        .tickets-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .ticket-card {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
          border: 1px solid #f3f4f6;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .ticket-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        }

        .ticket-header {
          padding: 20px 24px 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #f3f4f6;
        }

        .ticket-header-left {
          display: flex;
          flex-direction: column;
        }

        .ticket-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6b7280;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .ticket-code-container {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .ticket-code-container:hover svg {
          opacity: 1 !important;
          stroke: #111827;
        }

        .ticket-code {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 1px;
          transition: 0.2s;
        }

        .ticket-status {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .ticket-meta {
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          background: #f9fafb;
          border-bottom: 1px solid #f3f4f6;
          font-size: 13px;
          color: #4b5563;
          font-weight: 600;
        }

        .ticket-selections {
          padding: 16px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .selection-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px dashed #e5e7eb;
        }

        .selection-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .selection-match {
          flex: 1;
          padding-right: 16px;
        }

        .selection-league {
          font-size: 10px;
          text-transform: uppercase;
          color: #ff6b00;
          font-weight: 800;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .selection-teams {
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.3;
        }

        .selection-odds {
          text-align: right;
          min-width: 80px;
        }

        .selection-pick {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .selection-pick strong {
          color: #111827;
          font-weight: 800;
        }

        .selection-odd-val {
          font-size: 16px;
          font-weight: 900;
          color: #ff6b00;
          transition: 0.2s;
        }

        .selection-item.result-won {
          background: #f0fdf4;
          border-radius: 8px;
          padding: 10px 12px;
          margin: -4px -12px;
          border-bottom: 1px dashed #bbf7d0 !important;
        }

        .selection-item.result-lost {
          background: #fff1f1;
          border-radius: 8px;
          padding: 10px 12px;
          margin: -4px -12px;
          border-bottom: 1px dashed #fecaca !important;
        }

        .bet-result-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .bet-result-badge.win {
          background: #dcfce7;
          color: #15803d;
        }

        .bet-result-badge.lose {
          background: #fee2e2;
          color: #dc2626;
        }

        .ticket-footer {
          background: #f9fafb;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #e5e7eb;
        }

        .footer-col {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .footer-col.center {
          align-items: center;
        }

        .footer-col.right {
          align-items: flex-end;
        }

        .footer-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
        }

        .footer-val {
          font-size: 16px;
          font-weight: 800;
          color: #1f2937;
        }

        .footer-val.accent {
          font-size: 18px;
          color: #15803d; /* Green for payout */
          font-weight: 900;
        }

        /* ── Fluid base sizes using clamp ── */
        .history-header h1 {
          font-size: clamp(20px, 6vw, 28px);
        }

        .ticket-code {
          font-size: clamp(14px, 4.5vw, 22px);
        }

        .ticket-status {
          font-size: clamp(10px, 3vw, 12px);
        }

        .ticket-meta {
          font-size: clamp(11px, 3.2vw, 13px);
        }

        .selection-league {
          font-size: clamp(9px, 2.5vw, 10px);
        }

        .selection-teams {
          font-size: clamp(12px, 3.8vw, 15px);
        }

        .selection-pick {
          font-size: clamp(10px, 3vw, 12px);
        }

        .selection-odd-val {
          font-size: clamp(13px, 4vw, 16px);
        }

        .footer-label {
          font-size: clamp(10px, 2.8vw, 12px);
        }

        .footer-val {
          font-size: clamp(12px, 3.5vw, 16px);
        }

        .footer-val.accent {
          font-size: clamp(13px, 3.8vw, 18px);
        }

        /* ── Small mobile ── */
        @media (max-width: 480px) {
          .history-header {
            padding: 12px 16px;
            gap: 8px;
          }
          .history-content {
            padding: 12px;
            gap: 14px;
          }
          .ticket-header {
            padding: 14px 16px 12px;
          }
          .ticket-meta {
            padding: 10px 16px;
          }
          .ticket-selections {
            padding: 12px 16px;
            gap: 12px;
          }
          .selection-item {
            padding-bottom: 12px;
          }
          .ticket-footer {
            padding: 14px 16px;
            gap: 4px;
          }
          .ticket-code-container {
            gap: 6px;
          }
          .back-link {
            font-size: 13px;
          }
          .ticket-card {
            border-radius: 12px;
          }
        }

        /* ── Very small phones (320px) ── */
        @media (max-width: 360px) {
          .ticket-footer {
            flex-wrap: wrap;
            gap: 8px;
          }
          .footer-col {
            min-width: 30%;
          }
          .selection-teams {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}

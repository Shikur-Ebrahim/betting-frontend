'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('won'); // Default is won as requested
  const [stats, setStats] = useState<any>({ won: 0, lost: 0, pending: 0, all: 0 });
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'admin') {
      router.push('/');
      return;
    }
    fetchStats();
    fetchTickets();
  }, [statusFilter]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/tickets/stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets/list?status=${statusFilter}`);
      const data = await res.json();
      if (data.success) setTickets(data.tickets);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'won') return { bg: '#dcfce7', color: '#15803d' };
    if (s === 'lost') return { bg: '#fee2e2', color: '#dc2626' };
    return { bg: '#fef3c7', color: '#d97706' };
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <Link href="/admin" className="back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </Link>
        <h1>Ticket Management</h1>
        <p>Review and track all user tickets</p>
      </div>

      <div className="admin-content">
        <div className="filter-tabs">
          {['won', 'lost', 'pending', 'all'].map(s => (
            <button 
              key={s} 
              className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              <span className="tab-label">{s.toUpperCase()}</span>
              <span className="tab-count">{stats[s] || 0}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="spinner"></div>
            <p>Fetching tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="admin-empty">
            <div className="empty-icon">🎫</div>
            <h3>No {statusFilter} tickets found</h3>
          </div>
        ) : (
          <div className="ticket-list">
            {tickets.map(ticket => {
              const style = getStatusStyle(ticket.status);
              return (
                <div key={ticket.id} className="ticket-card">
                  <div className="card-header">
                    <div className="ticket-id">#{ticket.betCode || ticket.id.slice(-8).toUpperCase()}</div>
                    <div className="status-badge" style={{ background: style.bg, color: style.color }}>
                      {ticket.status.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <div className="info-row">
                      <span>User:</span>
                      <strong>{ticket.phone || 'Unknown'}</strong>
                    </div>
                    <div className="info-row">
                      <span>Stake:</span>
                      <strong>{ticket.stake?.toLocaleString()} ETB</strong>
                    </div>
                    <div className="info-row">
                      <span>Est. Return:</span>
                      <strong className="return-text">{ticket.potentialWin?.toLocaleString()} ETB</strong>
                    </div>
                    <div className="info-row">
                      <span>Date:</span>
                      <strong>{new Date(ticket.createdAt).toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="selections-count">
                    {ticket.selections?.length || 0} Selections
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-page { min-height: 100vh; background: #f8fafc; font-family: 'Inter', sans-serif; color: #1e293b; padding-bottom: 40px; }
        .admin-header { background: white; padding: 40px 24px; text-align: center; border-bottom: 1px solid #f1f5f9; position: relative; }
        .back-btn { position: absolute; left: 20px; top: 40px; color: #64748b; }
        h1 { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
        .admin-header p { font-size: 14px; color: #64748b; font-weight: 500; }

        .admin-content { max-width: 600px; margin: 0 auto; padding: 20px 16px; }
        
        .filter-tabs { display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px; }
        .filter-tab { flex: 1; padding: 12px 8px; border-radius: 14px; background: white; border: 1px solid #f1f5f9; font-size: 12px; font-weight: 800; color: #64748b; cursor: pointer; transition: 0.2s; white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 80px; }
        .filter-tab.active { background: #0f172a; color: white; border-color: #0f172a; }
        .tab-label { opacity: 0.8; font-size: 10px; }
        .tab-count { font-size: 16px; font-weight: 900; }
        .filter-tab.active .tab-label { opacity: 0.6; }

        .ticket-list { display: flex; flex-direction: column; gap: 16px; }
        .ticket-card { background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
        
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px dashed #f1f5f9; padding-bottom: 12px; }
        .ticket-id { font-weight: 900; color: #0f172a; font-size: 15px; }
        .status-badge { padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 900; }

        .card-body { display: flex; flex-direction: column; gap: 10px; }
        .info-row { display: flex; justify-content: space-between; font-size: 14px; }
        .info-row span { color: #64748b; font-weight: 500; }
        .info-row strong { color: #334155; font-weight: 700; }
        .return-text { color: #15803d; }

        .selections-count { margin-top: 16px; text-align: center; font-size: 12px; font-weight: 700; color: #94a3b8; background: #f8fafc; padding: 6px; border-radius: 8px; }

        .admin-loading { text-align: center; padding: 60px 0; }
        .spinner { width: 32px; height: 32px; border: 4px solid #f1f5f9; border-top-color: #ff6b00; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .admin-empty { text-align: center; padding: 60px 0; color: #94a3b8; }
        .empty-icon { font-size: 48px; margin-bottom: 12px; }
      `}</style>
    </div>
  );
}

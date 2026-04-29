'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string; type: 'accept' | 'reject' }>({
    isOpen: false,
    id: '',
    type: 'accept'
  });
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'admin') router.push('/');
    fetchWithdrawals();
  }, [router]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/withdrawals/list');
      const data = await res.json();
      if (data.success) setWithdrawals(data.withdrawals);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openConfirm = (id: string, type: 'accept' | 'reject') => {
    setConfirmModal({ isOpen: true, id, type });
  };

  const handleConfirmAction = async () => {
    const { id, type } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });
    
    setActionLoading(id);
    try {
      const url = type === 'accept' ? '/api/admin/withdrawals/accept' : '/api/admin/withdrawals/reject';
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reason: 'Rejected by admin' })
      });

      if (res.ok) {
        fetchWithdrawals();
      } else {
        const data = await res.json();
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <Link href="/admin" className="back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </Link>
        <h1>Withdrawal Requests</h1>
        <div className="stats-badge">{withdrawals.filter(w => w.status === 'pending').length} Pending</div>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="loading-state">Loading withdrawals...</div>
        ) : withdrawals.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <p>No withdrawal requests found.</p>
          </div>
        ) : (
          <div className="withdrawals-list">
            {withdrawals.map((w) => (
              <div key={w.id} className="withdrawal-admin-card">
                <div className="card-top">
                  <div className="user-info">
                    <div className="phone">{w.phoneNumber || 'Unknown Phone'}</div>
                    <div className="method-tag">{w.methodName} ({w.methodType})</div>
                  </div>
                  <div className="amount-badge">{w.amount} ETB</div>
                </div>

                <div className="details-box">
                  <div className="detail-item">
                    <span className="label">Full Name:</span>
                    <span className="val">{w.details?.fullName}</span>
                  </div>
                  {w.methodType === 'bank' ? (
                    <div className="detail-item">
                      <span className="label">Account Number:</span>
                      <span className="val">{w.details?.accountNumber}</span>
                    </div>
                  ) : (
                    <div className="detail-item">
                      <span className="label">Phone Number:</span>
                      <span className="val">{w.details?.phoneNumber}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="label">Submitted:</span>
                    <span className="val">{new Date(w.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="card-actions">
                  {w.status === 'pending' ? (
                    <>
                      <button 
                        className="reject-btn" 
                        onClick={() => openConfirm(w.id, 'reject')}
                        disabled={actionLoading === w.id}
                      >
                        Reject & Refund
                      </button>
                      <button 
                        className="accept-btn" 
                        onClick={() => openConfirm(w.id, 'accept')}
                        disabled={actionLoading === w.id}
                      >
                        {actionLoading === w.id ? 'Processing...' : 'Confirm Paid'}
                      </button>
                    </>
                  ) : (
                    <div className={`status-tag ${w.status}`}>
                      {w.status.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-card">
            <div className={`confirm-icon ${confirmModal.type}`}>
              {confirmModal.type === 'accept' ? (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              )}
            </div>
            <h3>{confirmModal.type === 'accept' ? 'Confirm Withdrawal?' : 'Reject Withdrawal?'}</h3>
            <p>
              {confirmModal.type === 'accept' 
                ? 'Only confirm this if you have already transferred the funds to the user. This action cannot be undone.' 
                : 'This will reject the request and automatically REFUND the amount back to the user balance.'}
            </p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>Cancel</button>
              <button className={`ok-btn ${confirmModal.type}`} onClick={handleConfirmAction}>
                {confirmModal.type === 'accept' ? 'Yes, I Paid' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-page-container {
          padding: 20px; background: #fff; min-height: 100vh; position: fixed; inset: 0; z-index: 20002; overflow-y: auto; color: #333; font-family: 'Inter', sans-serif;
        }
        .admin-page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .back-btn { color: #333; padding: 8px; border-radius: 50%; background: #f5f7f9; display: flex; transition: 0.2s; }
        .back-btn:hover { background: #eef2f5; }
        h1 { font-size: 20px; font-weight: 900; flex: 1; letter-spacing: -0.5px; }
        .stats-badge { background: #ff6b0015; color: #ff6b00; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 12px; }
        
        .withdrawals-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .withdrawal-admin-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .phone { font-size: 16px; font-weight: 800; color: #111; margin-bottom: 4px; }
        .method-tag { font-size: 11px; color: #ff6b00; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .amount-badge { background: #111; color: white; padding: 6px 12px; border-radius: 10px; font-weight: 900; font-size: 14px; }
        
        .details-box { background: #f9fafb; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
        .detail-item { display: flex; justify-content: space-between; font-size: 13px; line-height: 1.4; }
        .detail-item .label { color: #6b7280; font-weight: 600; }
        .detail-item .val { color: #111827; font-weight: 800; text-align: right; }
        
        .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
        .card-actions button { padding: 14px; border: none; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; }
        .reject-btn { background: #fee2e2; color: #b91c1c; }
        .accept-btn { background: #111; color: white; }
        .card-actions button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .card-actions button:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .status-tag { grid-column: span 2; text-align: center; padding: 10px; border-radius: 12px; font-weight: 800; font-size: 12px; letter-spacing: 1px; }
        .status-tag.verified { background: #dcfce7; color: #15803d; }
        .status-tag.rejected { background: #fee2e2; color: #b91c1c; }
        
        /* Modal Styles */
        .confirm-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 30005; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .confirm-modal-card { background: white; width: 100%; max-width: 380px; border-radius: 28px; padding: 32px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.25); animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .confirm-icon { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .confirm-icon.accept { background: #f0fdf4; color: #15803d; }
        .confirm-icon.reject { background: #fef2f2; color: #b91c1c; }
        h3 { font-size: 20px; font-weight: 900; margin-bottom: 12px; color: #111; letter-spacing: -0.5px; }
        p { font-size: 14px; color: #6b7280; line-height: 1.6; margin-bottom: 28px; font-weight: 500; }
        .confirm-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .confirm-actions button { padding: 16px; border: none; border-radius: 14px; font-weight: 800; font-size: 15px; cursor: pointer; transition: 0.2s; }
        .cancel-btn { background: #f3f4f6; color: #4b5563; }
        .ok-btn.accept { background: #111; color: white; }
        .ok-btn.reject { background: #dc2626; color: white; }
        
        .loading-state, .empty-state { text-align: center; padding: 100px 20px; }
        .empty-state p { margin-top: 16px; font-weight: 700; color: #9ca3af; font-size: 17px; }
      `}</style>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string; type: 'accept' | 'reject' }>({
    isOpen: false,
    id: '',
    type: 'accept'
  });
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'admin') router.push('/');
    fetchDeposits();
  }, [router]);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      // Fetching all for now to ensure visibility as requested
      const res = await fetch('/api/admin/deposits/list');
      const data = await res.json();
      if (data.success) setDeposits(data.deposits);
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
      const url = type === 'accept' ? '/api/admin/deposits/accept' : `/api/admin/deposits/reject?id=${id}`;
      const method = type === 'accept' ? 'POST' : 'DELETE';
      const body = type === 'accept' ? JSON.stringify({ id }) : null;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (res.ok) {
        fetchDeposits();
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
        <h1>Deposit Verification</h1>
        <div className="stats-badge">{deposits.filter(d => d.status === 'pending').length} Pending</div>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="loading-state">Loading deposits...</div>
        ) : deposits.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <p>All deposits processed!</p>
          </div>
        ) : (
          <div className="deposits-list">
            {deposits.map((d) => (
              <div key={d.id} className="deposit-admin-card">
                <div className="card-top">
                  <div className="user-info">
                    <div className="phone">{d.phoneNumber || 'Unknown Phone'}</div>
                    <div className="status-label" style={{ fontSize: 10, color: d.status === 'pending' ? '#ff6b00' : '#15803d', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>Status: {d.status}</div>
                  </div>
                  <div className="amount-badge">{d.amount} ETB</div>
                </div>

                <div className="proof-preview-area" onClick={() => setSelectedImage(d.proofUrl)}>
                  {d.proofUrl ? (
                    <img src={d.proofUrl} alt="Proof" />
                  ) : (
                    <div className="no-proof">No screenshot uploaded</div>
                  )}
                  <div className="zoom-overlay">Click to view full image</div>
                </div>

                <div className="card-actions">
                  {d.status === 'pending' ? (
                    <>
                      <button 
                        className="reject-btn" 
                        onClick={() => openConfirm(d.id, 'reject')}
                        disabled={actionLoading === d.id}
                      >
                        Reject
                      </button>
                      <button 
                        className="accept-btn" 
                        onClick={() => openConfirm(d.id, 'accept')}
                        disabled={actionLoading === d.id}
                      >
                        {actionLoading === d.id ? 'Processing...' : 'Accept & Verify'}
                      </button>
                    </>
                  ) : (
                    <div className="processed-tag">Processed</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <img src={selectedImage} alt="Full Proof" />
            <button className="modal-close-btn" onClick={() => setSelectedImage(null)}>×</button>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
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
            <h3>{confirmModal.type === 'accept' ? 'Accept Deposit?' : 'Reject Deposit?'}</h3>
            <p>
              {confirmModal.type === 'accept' 
                ? 'This will verify the deposit and automatically add the balance to the user account.' 
                : 'This will permanently delete this deposit request. This action cannot be undone.'}
            </p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>Cancel</button>
              <button className={`ok-btn ${confirmModal.type}`} onClick={handleConfirmAction}>
                {confirmModal.type === 'accept' ? 'Yes, Accept' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .admin-page-container {
          padding: 16px; background: #fff; min-height: 100vh; position: fixed; inset: 0; z-index: 20002; overflow-y: auto; color: #333;
        }
        .admin-page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .back-btn { color: #333; padding: 6px; border-radius: 50%; background: #f0f0f0; display: flex; }
        h1 { font-size: 18px; font-weight: 800; flex: 1; }
        .stats-badge { background: #ff6b0015; color: #ff6b00; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 11px; }
        
        .deposits-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .deposit-admin-card { background: #f9f9f9; border: 1px solid #eee; border-radius: 20px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .phone { font-size: 15px; font-weight: 800; color: #111; }
        .amount-badge { background: #111; color: white; padding: 5px 10px; border-radius: 8px; font-weight: 800; font-size: 13px; }
        
        .proof-preview-area { position: relative; height: 160px; background: #eee; border-radius: 12px; overflow: hidden; cursor: zoom-in; }
        .proof-preview-area img { width: 100%; height: 100%; object-fit: cover; }
        .zoom-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.3); color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; opacity: 0; transition: 0.2s; }
        .proof-preview-area:hover .zoom-overlay { opacity: 1; }
        
        .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .card-actions button { padding: 12px; border: none; border-radius: 10px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; }
        .reject-btn { background: #fee2e2; color: #b91c1c; }
        .accept-btn { background: #111; color: white; }
        .card-actions button:disabled { opacity: 0.5; }
        .processed-tag { grid-column: span 2; text-align: center; padding: 8px; background: #eef2f8; color: #666; border-radius: 10px; font-weight: 700; font-size: 12px; }
        
        .image-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 30000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .image-modal-content { position: relative; max-width: 90%; max-height: 90%; }
        .image-modal-content img { max-width: 100%; max-height: 80vh; border-radius: 12px; }
        .modal-close-btn { position: absolute; top: -40px; right: 0; background: none; border: none; color: white; font-size: 40px; cursor: pointer; }
        
        /* Confirm Modal */
        .confirm-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 30005; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .confirm-modal-card { background: white; width: 100%; max-width: 360px; border-radius: 24px; padding: 24px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .confirm-icon { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .confirm-icon.accept { background: #f0fdf4; color: #15803d; }
        .confirm-icon.reject { background: #fef2f2; color: #b91c1c; }
        h3 { font-size: 18px; font-weight: 800; margin-bottom: 8px; color: #111; }
        p { font-size: 13px; color: #666; line-height: 1.5; margin-bottom: 24px; font-weight: 500; }
        .confirm-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .confirm-actions button { padding: 14px; border: none; border-radius: 12px; font-weight: 800; font-size: 14px; cursor: pointer; transition: 0.2s; }
        .cancel-btn { background: #f4f7fe; color: #333; }
        .ok-btn.accept { background: #111; color: white; }
        .ok-btn.reject { background: #b91c1c; color: white; }
        .confirm-actions button:hover { transform: translateY(-2px); }
 
        .loading-state, .empty-state { text-align: center; padding: 60px 20px; }
        .empty-state p { margin-top: 12px; font-weight: 700; color: #999; font-size: 16px; }
      `}</style>
    </div>
  );
}

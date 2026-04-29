'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const uid = localStorage.getItem('user_uid');
    if (!token || !uid) {
      router.push('/');
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));
    } else {
      fetchTransactions(uid);
    }
  }, [router]);

  const fetchTransactions = async (uid: string) => {
    try {
      const res = await fetch(`/api/user/transactions?userId=${uid}`);
      const data = await res.json();
      if (data.success) setTransactions(data.transactions);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'verified' || s === 'success' || s === 'accepted') return { bg: '#dcfce7', color: '#15803d', label: 'COMPLETED' };
    if (s === 'rejected') return { bg: '#fee2e2', color: '#dc2626', label: 'REJECTED' };
    return { bg: '#fef3c7', color: '#d97706', label: 'PENDING' };
  };

  return (
    <div className="tx-page">
      <div className="tx-header">
        <Link href="/" className="tx-back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </Link>
        <h1>Transaction History</h1>
        <p>Track your deposits and withdrawals</p>
      </div>

      <div className="tx-content">
        {loading ? (
          <div className="tx-loading">
            <div className="spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="tx-empty">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
            </div>
            <h3>No transactions found</h3>
            <p>Your deposit and withdrawal history will appear here.</p>
          </div>
        ) : (
          <div className="tx-list">
            {transactions.map((tx) => {
              const style = getStatusStyle(tx.status);
              const isDeposit = tx.type === 'deposit';
              return (
                <div key={tx.id} className={`tx-card ${isDeposit ? 'photo-card' : ''}`}>
                  {isDeposit && tx.proofUrl ? (
                    <div className="tx-full-photo" onClick={() => setSelectedImage(tx.proofUrl)}>
                      <img src={tx.proofUrl} alt="Deposit Receipt" />
                      <div className="photo-status-badge" style={{ background: style.bg, color: style.color }}>
                        {style.label}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="tx-card-top">
                        <div className="tx-type-icon" style={{ background: isDeposit ? '#f0fdf4' : '#fff1f2' }}>
                          {isDeposit ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                          )}
                        </div>
                        <div className="tx-info">
                          <div className="tx-title">{isDeposit ? 'Deposit' : 'Withdrawal'}</div>
                          <div className="tx-date">{new Date(tx.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
                        </div>
                        <div className={`tx-amount ${isDeposit ? 'plus' : 'minus'}`}>
                          {isDeposit ? '+' : '-'}{tx.amount?.toLocaleString()} ETB
                        </div>
                      </div>

                      <div className="tx-card-body">
                        <div className="tx-details">
                          <div className="detail-row">
                            <span>Method:</span>
                            <strong>{tx.methodName || 'Bank Transfer'}</strong>
                          </div>
                          {tx.type === 'withdrawal' && (
                            <div className="detail-row">
                              <span>Details:</span>
                              <strong>{tx.details?.accountNumber || tx.details?.phoneNumber || 'Processing'}</strong>
                            </div>
                          )}
                        </div>
                        <div className="tx-status-badge" style={{ background: style.bg, color: style.color }}>
                          {style.label}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <img src={selectedImage} alt="Receipt" />
            <button className="close-modal" onClick={() => setSelectedImage(null)}>×</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .tx-page {
          position: fixed; inset: 0; background: #f8fafc; z-index: 20006; overflow-y: auto; font-family: 'Inter', sans-serif; color: #1e293b;
        }
        .tx-header {
          background: white; padding: clamp(20px, 6vw, 32px) 24px clamp(24px, 7vw, 40px); text-align: center; border-bottom: 1px solid #f1f5f9; position: relative;
        }
        .tx-back {
          position: absolute; left: 16px; top: clamp(20px, 6vw, 32px); color: #64748b; padding: 4px;
        }
        h1 { font-size: clamp(20px, 6.5vw, 28px); font-weight: 900; color: #0f172a; margin-bottom: 6px; letter-spacing: -0.5px; }
        .tx-header p { font-size: clamp(12px, 3.5vw, 14px); color: #64748b; font-weight: 500; }

        .tx-content { max-width: 600px; margin: 0 auto; padding: 20px 16px 60px; }
        
        .tx-list { display: flex; flex-direction: column; gap: 16px; }
        .tx-card { background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; transition: 0.2s; }
        .tx-card.photo-card { padding: 0; overflow: hidden; border: none; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
        
        .tx-full-photo { position: relative; width: 100%; height: 280px; cursor: pointer; }
        .tx-full-photo img { width: 100%; height: 100%; object-fit: cover; }
        .photo-status-badge { position: absolute; top: 16px; right: 16px; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 900; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        
        .tx-card-top { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
        .tx-type-icon { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tx-info { flex: 1; }
        .tx-title { font-size: clamp(15px, 4.2vw, 17px); font-weight: 800; color: #0f172a; }
        .tx-date { font-size: clamp(11px, 3vw, 12px); color: #94a3b8; font-weight: 600; margin-top: 2px; }
        .tx-amount { font-size: clamp(16px, 4.8vw, 19px); font-weight: 900; }
        .tx-amount.plus { color: #15803d; }
        .tx-amount.minus { color: #dc2626; }

        .tx-card-body { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 14px; border-top: 1px dashed #f1f5f9; }
        .tx-details { display: flex; flex-direction: column; gap: 4px; }
        .detail-row { font-size: clamp(11px, 3.2vw, 13px); color: #64748b; }
        .detail-row span { margin-right: 6px; }
        .detail-row strong { color: #334155; font-weight: 700; }
        .tx-status-badge { padding: 5px 12px; border-radius: 8px; font-size: clamp(10px, 2.8vw, 11px); font-weight: 800; letter-spacing: 0.5px; }

        .tx-loading { text-align: center; padding: 60px 0; }
        .spinner { width: 32px; height: 32px; border: 4px solid #f1f5f9; border-top-color: #ff6b00; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .tx-empty { text-align: center; padding: 60px 20px; }
        .empty-icon { width: 80px; height: 80px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); }
        .tx-empty h3 { font-size: 18px; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
        .tx-empty p { font-size: 14px; color: #94a3b8; font-weight: 500; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 30000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-content { position: relative; max-width: 90%; }
        .modal-content img { max-width: 100%; max-height: 80vh; border-radius: 16px; }
        .close-modal { position: absolute; top: -45px; right: 0; background: none; border: none; color: white; font-size: 36px; cursor: pointer; }
      `}</style>
    </div>
  );
}

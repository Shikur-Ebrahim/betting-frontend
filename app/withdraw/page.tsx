'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WithdrawPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasPending, setHasPending] = useState(false);
  const [balance, setBalance] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/');
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));
    } else {
      initialize(token);
    }
  }, [router]);

  const initialize = async (token: string) => {
    setInitialLoading(true);
    const userData = await ensureUserData(token);
    if (userData?.uid) {
      await Promise.all([
        fetchMethods(),
        fetchBalance(userData.uid),
        checkPending(userData.uid)
      ]);
    }
    setInitialLoading(false);
  };

  const ensureUserData = async (token: string) => {
    let uid = localStorage.getItem('user_uid');
    if (!uid) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('user_uid', data.uid);
          uid = data.uid;
        }
      } catch (err) { console.error(err); }
    }
    return { uid };
  };

  const fetchBalance = async (uid: string) => {
    try {
      const res = await fetch(`/api/user/profile?userId=${uid}`);
      const data = await res.json();
      if (data.success) setBalance(data.balance);
    } catch (err) { console.error(err); }
  };

  const checkPending = async (uid: string) => {
    try {
      const res = await fetch(`/api/withdraw/check-pending?userId=${uid}`);
      const data = await res.json();
      setHasPending(data.hasPending);
    } catch (err) { console.error(err); }
  };

  const fetchMethods = async () => {
    try {
      const res = await fetch('/api/withdraw/methods');
      const data = await res.json();
      if (data.success) setMethods(data.methods);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);
    const minRequired = selectedMethod?.minWithdrawal || 1000;

    if (!amount || withdrawAmount < minRequired) {
      setMessage({ type: 'error', text: `Minimum withdrawal is ${minRequired} Birr` });
      return;
    }

    if (withdrawAmount > balance) {
      setMessage({ type: 'error', text: 'Insufficient balance' });
      return;
    }

    if (!fullName) {
      setMessage({ type: 'error', text: 'Please enter full name' });
      return;
    }

    if (selectedMethod.type === 'bank' && !accountNumber) {
      setMessage({ type: 'error', text: 'Please enter account number' });
      return;
    }

    if (selectedMethod.type === 'wallet' && !targetPhone) {
      setMessage({ type: 'error', text: 'Please enter phone number' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const uid = localStorage.getItem('user_uid');
      const details = selectedMethod.type === 'bank' 
        ? { fullName, accountNumber } 
        : { fullName, phoneNumber: targetPhone };

      const res = await fetch('/api/withdraw/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          amount: withdrawAmount,
          methodId: selectedMethod.id,
          details
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setMessage({ type: 'success', text: 'Withdrawal request submitted! Processing...' });
      setTimeout(() => router.push('/'), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="withdraw-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (hasPending) {
    return (
      <div className="withdraw-container">
        <div className="withdraw-card status-card">
          <div className="status-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <h2>Pending Withdrawal</h2>
          <p>You have a processing withdrawal. Please wait until it is verified before making another request.</p>
          <Link href="/" className="back-home-btn">Back to Home</Link>
        </div>
        <style jsx>{`
          .withdraw-container { position: fixed; inset: 0; background: #f8f9fa; z-index: 20005; display: flex; align-items: center; justify-content: center; padding: 16px; }
          .withdraw-card { background: white; width: 100%; max-width: 420px; border-radius: 24px; padding: 40px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
          h2 { font-size: 24px; font-weight: 800; color: #111; margin-bottom: 12px; }
          p { font-size: 15px; color: #666; line-height: 1.6; margin-bottom: 32px; font-weight: 500; }
          .back-home-btn { display: block; width: 100%; padding: 18px; background: #111; color: white; border-radius: 12px; font-weight: 800; text-decoration: none; transition: 0.2s; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="withdraw-container">
      <div className="withdraw-card">
        <div className="withdraw-header">
          <Link href="/" className="back-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </Link>
          <h2>Withdraw Funds</h2>
          <p>Available Balance: <span className="balance-val">{balance.toLocaleString()} Birr</span></p>
        </div>

        <div className="input-group">
          <label>AMOUNT TO WITHDRAW (BIRR)</label>
          <div className="amount-input">
            <input 
              type="number" 
              placeholder={`Min: ${selectedMethod?.minWithdrawal || 1000}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <span className="currency">ETB</span>
          </div>
        </div>

        <label className="section-label">SELECT WITHDRAWAL METHOD</label>
        <div className="methods-grid">
          {methods.map((m) => (
            <div 
              key={m.id} 
              className={`method-card ${selectedMethod?.id === m.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedMethod(m);
                setMessage(null);
              }}
            >
              <div className="method-logo">
                {m.logoUrl ? <img src={m.logoUrl} alt={m.name} /> : <div className="no-logo">{m.name.charAt(0)}</div>}
              </div>
              <span className="method-name">{m.name}</span>
            </div>
          ))}
        </div>

        {selectedMethod && (
          <form className="withdraw-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>FULL NAME</label>
              <input 
                type="text" 
                placeholder="Account holder name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {selectedMethod.type === 'bank' ? (
              <div className="input-group">
                <label>ACCOUNT NUMBER</label>
                <input 
                  type="text" 
                  placeholder="Enter CBE account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="input-group">
                <label>PHONE NUMBER</label>
                <input 
                  type="tel" 
                  placeholder="09..."
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  required
                />
              </div>
            )}

            {message && <div className={`msg ${message.type}`}>{message.text}</div>}

            <button className="submit-btn" disabled={loading}>
              {loading ? 'Processing...' : 'Confirm Withdrawal'}
            </button>
            <p className="process-note">Withdrawal will be processed within {selectedMethod.description || '30 mins'}.</p>
          </form>
        )}
      </div>

      <style jsx>{`
        .withdraw-container { position: fixed; inset: 0; background: #f8f9fa; z-index: 20005; display: flex; flex-direction: column; align-items: center; padding: 40px 16px; overflow-y: auto; }
        .withdraw-card { background: white; width: 100%; max-width: 460px; border-radius: 24px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); position: relative; }
        .withdraw-header { text-align: center; margin-bottom: 24px; position: relative; }
        .back-btn { position: absolute; left: 0; top: 0; color: #666; }
        h2 { font-size: 22px; font-weight: 900; color: #111; margin-bottom: 4px; }
        .withdraw-header p { font-size: 14px; color: #666; font-weight: 600; }
        .balance-val { color: #15803d; font-weight: 800; }

        .input-group { margin-bottom: 20px; text-align: left; }
        .input-group label { display: block; font-size: 10px; font-weight: 800; color: #999; letter-spacing: 0.5px; margin-bottom: 8px; }
        .amount-input { display: flex; align-items: center; background: #f4f7fe; border-radius: 12px; padding: 0 16px; }
        .amount-input input { flex: 1; border: none; background: transparent; padding: 14px 0; font-size: 18px; font-weight: 800; outline: none; }
        .currency { font-weight: 800; color: #333; font-size: 14px; }
        
        .input-group input[type="text"], .input-group input[type="tel"] {
          width: 100%; padding: 14px 16px; background: #f4f7fe; border: 1px solid #eef2f8; border-radius: 12px; font-size: 14px; font-weight: 700; outline: none;
        }
        .input-group input:focus { border-color: #ff6b00; background: #fff; }

        .section-label { display: block; text-align: left; font-size: 10px; font-weight: 800; color: #999; margin-bottom: 12px; }
        .methods-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
        .method-card { background: #fff; border: 2px solid #f0f0f0; border-radius: 16px; padding: 12px; cursor: pointer; transition: 0.2s; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .method-card.active { border-color: #ff6b00; background: #fff9f5; }
        .method-logo { width: 100%; height: 50px; display: flex; align-items: center; justify-content: center; }
        .method-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .method-name { font-size: 12px; font-weight: 800; color: #333; }

        .submit-btn { width: 100%; padding: 18px; background: #ff6b00; color: white; border: none; border-radius: 14px; font-weight: 800; font-size: 16px; cursor: pointer; transition: 0.2s; margin-top: 10px; }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255,107,0,0.3); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .msg { padding: 12px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; font-weight: 700; text-align: center; }
        .msg.success { background: #dcfce7; color: #15803d; }
        .msg.error { background: #fee2e2; color: #b91c1c; }

        .process-note { font-size: 11px; color: #999; font-weight: 600; margin-top: 12px; text-align: center; }
        .loading-spinner { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: #ff6b00; border-radius: 50%; animation: spin 1s linear infinite; margin-top: 20vh; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

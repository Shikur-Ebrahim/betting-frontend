'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DepositPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasPending, setHasPending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
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
    await fetchMethods();
    const userData = await ensureUserData(token);
    if (userData?.uid) {
      await checkPending(userData.uid);
    }
    setInitialLoading(false);
  };

  const ensureUserData = async (token: string) => {
    let uid = localStorage.getItem('user_uid');
    let phone = localStorage.getItem('user_phone');
    
    if (!uid || !phone) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('user_uid', data.uid);
          localStorage.setItem('user_phone', data.phoneNumber);
          uid = data.uid;
          phone = data.phoneNumber;
        }
      } catch (err) {
        console.error('Failed to sync user data:', err);
      }
    }
    return { uid, phone };
  };

  const checkPending = async (uid: string) => {
    try {
      const res = await fetch(`/api/deposit/check-pending?userId=${uid}`);
      const data = await res.json();
      setHasPending(data.hasPending);
    } catch (err) {
      console.error('Check pending error:', err);
    }
  };

  const fetchMethods = async () => {
    try {
      const res = await fetch('/api/deposit/methods');
      const data = await res.json();
      if (data.success) setMethods(data.methods);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minRequired = selectedMethod?.minDeposit || 500;
    if (!amount || Number(amount) < minRequired) {
      setMessage({ type: 'error', text: `Please enter at least ${minRequired} Birr before uploading screenshot` });
      e.target.value = ''; 
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProof(file);
      setProofPreview(URL.createObjectURL(file));
      setMessage(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(text);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dqzvvscvp'; 
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'tipico_presets'; 

    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (result.secure_url) return result.secure_url;
      throw new Error(result.error?.message || 'Upload failed');
    } catch (err) {
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const minRequired = selectedMethod?.minDeposit || 500;
    if (!amount || Number(amount) < minRequired) {
      setMessage({ type: 'error', text: `Minimum deposit is ${minRequired} Birr` });
      return;
    }
    if (!proof) {
      setMessage({ type: 'error', text: 'Please upload payment proof screenshot' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const proofUrl = await uploadToCloudinary(proof);
      const uid = localStorage.getItem('user_uid');
      const phone = localStorage.getItem('user_phone');

      const res = await fetch('/api/deposit/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          phoneNumber: phone,
          amount,
          methodId: selectedMethod.id,
          proofUrl
        })
      });

      if (!res.ok) throw new Error('Submission failed');

      setMessage({ type: 'success', text: 'Deposit request submitted successfully! Pending approval.' });
      setTimeout(() => router.push('/'), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="deposit-page-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (hasPending) {
    return (
      <div className="deposit-page-container">
        <div className="deposit-card pending-card">
          <div className="pending-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <h2>Pending Deposit</h2>
          <p>You already have a pending deposit request. Please wait until it is verified by our team before making another deposit.</p>
          <Link href="/" className="back-home-btn">Back to Home</Link>
        </div>
        <style jsx>{`
          .deposit-page-container {
            position: fixed; inset: 0; background: #000; z-index: 20005;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            padding: 16px; overflow-y: auto;
          }
          .deposit-card {
            background: white; width: 100%; max-width: 420px; border-radius: 24px; padding: 40px;
            text-align: center; color: #333; box-shadow: 0 20px 50px rgba(0,0,0,0.4);
          }
          .pending-icon { margin-bottom: 24px; }
          h2 { font-size: 24px; font-weight: 800; color: #111; margin-bottom: 12px; }
          p { font-size: 15px; color: #666; line-height: 1.6; margin-bottom: 32px; font-weight: 500; }
          .back-home-btn {
            display: block; width: 100%; padding: 18px; background: #111; color: white;
            border-radius: 12px; font-weight: 800; text-decoration: none; transition: 0.2s;
          }
          .back-home-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="deposit-page-container">
      <div className="deposit-card">
        <div className="deposit-header">
          <Link href="/" className="close-btn-round">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </Link>
          <h2>Deposit Funds</h2>
          <p>Choose your preferred payment method</p>
        </div>

        <div className="amount-section">
          <label>DEPOSIT AMOUNT (BIRR)</label>
          <div className="amount-input-wrapper">
            <span>ETB</span>
            <input 
              type="number" 
              placeholder={`Min: ${selectedMethod?.minDeposit || 500}`} 
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (message?.text.includes('Minimum deposit')) setMessage(null);
              }}
            />
          </div>
        </div>

        <div className="methods-grid">
          {methods.map((m) => (
            <div 
              key={m.id} 
              className={`method-logo-card ${selectedMethod?.id === m.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedMethod(m);
                setProof(null);
                setProofPreview(null);
              }}
            >
              {m.logoUrl ? <img src={m.logoUrl} alt="Logo" /> : <div className="no-logo-placeholder">{m.bankName || 'Wallet'}</div>}
            </div>
          ))}
        </div>

        {selectedMethod && (
          <div className="method-details-overlay">
            <div className="method-details-box">
              <h3>Transfer Details</h3>
              <div className="details-grid">
                {selectedMethod.type === 'bank' ? (
                  <>
                    <div className="detail-row">
                      <span className="label">Bank</span>
                      <span className="value">{selectedMethod.bankName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Account Name</span>
                      <span className="value">{selectedMethod.accountName}</span>
                    </div>
                    <div className="detail-row highlight" onClick={() => handleCopy(selectedMethod.accountNumber)}>
                      <span className="label">Account Number</span>
                      <span className="value-copy">
                        {selectedMethod.accountNumber}
                        <div className="copy-icon">
                          {copyStatus === selectedMethod.accountNumber ? 'Copied!' : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>}
                        </div>
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="detail-row">
                      <span className="label">Wallet</span>
                      <span className="value">Telebirr</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Name</span>
                      <span className="value">{selectedMethod.name}</span>
                    </div>
                    <div className="detail-row highlight" onClick={() => handleCopy(selectedMethod.phoneNumber)}>
                      <span className="label">Phone Number</span>
                      <span className="value-copy">
                        {selectedMethod.phoneNumber}
                        <div className="copy-icon">
                          {copyStatus === selectedMethod.phoneNumber ? 'Copied!' : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>}
                        </div>
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="proof-upload-section">
                <label>UPLOAD PAYMENT SCREENSHOT</label>
                <input type="file" id="proof-input" accept="image/*" onChange={handleProofChange} hidden />
                <label htmlFor="proof-input" className={`proof-upload-btn ${(!amount || Number(amount) < (selectedMethod?.minDeposit || 500)) ? 'disabled' : ''}`}>
                  {proofPreview ? (
                    <img src={proofPreview} alt="Proof preview" className="proof-preview" />
                  ) : (
                    <div className="proof-placeholder">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                      <span>Upload Screenshot</span>
                    </div>
                  )}
                </label>
              </div>

              {message && <div className={`form-message ${message.type}`}>{message.text}</div>}

              <button 
                className="final-deposit-btn" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Deposit'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .deposit-page-container {
          position: fixed; inset: 0; background: #000; z-index: 20005;
          display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
          padding: 40px 16px; overflow-y: auto;
        }
        .deposit-card {
          background: white; width: 100%; max-width: 440px; border-radius: 20px; padding: 24px;
          color: #333; box-shadow: 0 20px 50px rgba(0,0,0,0.4); position: relative;
        }
        .loading-spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #ff6b00; border-radius: 50%; animation: spin 1s linear infinite; margin-top: 20vh; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .deposit-header { text-align: left; margin-bottom: 20px; }
        .close-btn-round { position: absolute; top: 20px; right: 20px; background: #f4f7fe; color: #333; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        h2 { font-size: 20px; font-weight: 800; color: #111; margin-bottom: 2px; }
        .deposit-header p { font-size: 13px; color: #888; font-weight: 600; }
        .amount-section { margin-bottom: 20px; }
        .amount-section label { font-size: 10px; font-weight: 800; color: #999; letter-spacing: 0.5px; margin-bottom: 6px; display: block; }
        .amount-input-wrapper { display: flex; align-items: center; background: #f4f7fe; border-radius: 10px; padding: 0 14px; border: 1px solid #eef2f8; }
        .amount-input-wrapper span { font-weight: 800; color: #333; font-size: 13px; margin-right: 10px; }
        .amount-input-wrapper input { flex: 1; border: none; background: transparent; padding: 12px 0; font-size: 15px; font-weight: 700; outline: none; color: #111; }
        .methods-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
        .method-logo-card { background: #fff; border: 1px solid #eee; border-radius: 10px; height: 72px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; overflow: hidden; padding: 6px; }
        .method-logo-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .method-logo-card.active { border-color: #ff6b00; box-shadow: 0 0 0 2px #ff6b00; }
        .method-logo-card img { width: 100%; height: 100%; object-fit: contain; }
        .method-details-overlay { margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; animation: fadeIn 0.3s ease; }
        .method-details-box h3 { font-size: 15px; font-weight: 800; margin-bottom: 12px; }
        .details-grid { background: #f8f9fa; border-radius: 12px; padding: 6px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 1px; }
        .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: 8px; margin-bottom: 1px; }
        .detail-row.highlight { cursor: pointer; transition: 0.2s; }
        .detail-row.highlight:hover { background: #f0f4ff; }
        .detail-row .label { font-size: 11px; color: #777; font-weight: 600; }
        .detail-row .value { font-size: 13px; color: #111; font-weight: 700; }
        .value-copy { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 800; color: #111; }
        .copy-icon { background: #f4f7fe; color: #ff6b00; padding: 3px 6px; border-radius: 4px; font-size: 9px; min-width: 28px; display: flex; align-items: center; justify-content: center; }
        .proof-upload-btn { width: 100%; height: 120px; border: 2px dashed #ddd; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fcfcfc; }
        .proof-upload-btn.disabled { opacity: 0.5; cursor: not-allowed; }
        .proof-placeholder { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #aaa; font-weight: 600; font-size: 12px; }
        .proof-preview { width: 100%; height: 100%; object-fit: contain; }
        .final-deposit-btn { width: 100%; padding: 16px; background: #ff6b00; color: white; border: none; border-radius: 10px; font-weight: 800; font-size: 15px; cursor: pointer; margin-top: 20px; transition: 0.2s; }
        .form-message { padding: 10px; border-radius: 8px; margin-top: 14px; font-size: 13px; text-align: center; font-weight: 600; }
        .form-message.success { background: #dcfce7; color: #15803d; }
        .form-message.error { background: #fee2e2; color: #b91c1c; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

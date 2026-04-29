'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Register() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Transform phone number to email format: 251904174741@gmail.com
    // Remove leading zero if present
    const cleanPhone = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
    const formattedEmail = `251${cleanPhone}@gmail.com`;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formattedEmail, password })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'Register failed');
      setSuccess(true);
      localStorage.setItem('auth_token', data.idToken);
      // Redirect after success could be added here
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--bg-main)'
    }}>
      <div className="auth-modal-content" style={{ animation: 'none' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', color: '#000' }}>
          Registration
        </h2>

        {error && (
          <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '10px', fontSize: '14px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '12px', background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '10px', fontSize: '14px', marginBottom: '16px' }}>
            Registration successful! Welcome to TIPICO.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-input-label">Phone Number</label>
            <div className="auth-phone-input-wrapper">
              <div className="auth-phone-prefix">+251</div>
              <input 
                className="auth-phone-input"
                type="tel" 
                placeholder="978341267" 
                value={phoneNumber} 
                onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))} 
                required 
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-input-label">Password</label>
            <input 
              className="auth-input"
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <div className="auth-switch-text">
            Already have an account? <Link href="/login" className="auth-switch-link">Log In</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

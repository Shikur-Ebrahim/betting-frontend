import { useState, useEffect } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>(initialMode);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync mode with initialMode when the modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setSuccess(false);
      setPhoneNumber('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'register') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    
    const cleanPhone = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
    const formattedEmail = `251${cleanPhone}@gmail.com`;

    let endpoint = '';
    if (mode === 'register') endpoint = '/api/auth/register';
    else if (mode === 'login') endpoint = '/api/auth/login';
    else endpoint = '/api/auth/recovery'; // We'll need to create this or mock it

    try {
      if (mode === 'recovery') {
        // Mocking recovery for now as requested by "make just the forget passower buton like chapx"
        // In a real app, this would call Firebase sendPasswordResetEmail
        setSuccess(true);
        setTimeout(() => {
          setMode('login');
          setSuccess(false);
        }, 3000);
        return;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formattedEmail, 
          password
        })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'Action failed');
      
      setSuccess(true);
      localStorage.setItem('auth_token', data.idToken);
      localStorage.setItem('user_role', data.role || 'user');
      localStorage.setItem('user_uid', data.localId || '');
      localStorage.setItem('user_phone', `251${cleanPhone}`);
      window.dispatchEvent(new Event('auth-state-changed'));
      
      setTimeout(() => {
        onClose();
        const redirectToDeposit = localStorage.getItem('redirect_to_deposit');
        const redirectToResultCheck = localStorage.getItem('redirect_to_resultcheck');
        
        if (data.role === 'admin') {
          window.location.href = '/admin';
        } else if (redirectToDeposit === 'true') {
          localStorage.removeItem('redirect_to_deposit');
          window.location.href = '/deposit';
        } else if (redirectToResultCheck === 'true') {
          localStorage.removeItem('redirect_to_resultcheck');
          window.location.href = '/resultcheck';
        } else if (localStorage.getItem('open_settings_after_login') === 'true') {
          localStorage.removeItem('open_settings_after_login');
          window.location.reload();
          localStorage.setItem('auto_open_settings', 'true');
        } else if (localStorage.getItem('redirect_to_withdraw') === 'true') {
          localStorage.removeItem('redirect_to_withdraw');
          window.location.href = '/withdraw';
        } else if (localStorage.getItem('redirect_to_transactions') === 'true') {
          localStorage.removeItem('redirect_to_transactions');
          window.location.href = '/transactions';
        } else {
          window.location.reload();
        }
      }, 1500);
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  const EyeOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );

  return (
    <div className="auth-modal-overlay" onClick={onClose} style={{ background: '#000', opacity: 1 }}>
      <div className="auth-modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white' }}>
        <button className="auth-modal-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <h2>
          {mode === 'login' && 'Log In'}
          {mode === 'register' && 'Sign Up'}
          {mode === 'recovery' && 'Password recovery'}
        </h2>

        {error && <div className="auth-error-msg">{error}</div>}

        {success && (
          <div style={{ padding: '12px', background: '#dcfce7', color: '#15803d', borderRadius: '12px', fontSize: '14px', marginBottom: '24px', fontWeight: 700, textAlign: 'center' }}>
            {mode === 'recovery' ? 'Reset link sent to your phone!' : (mode === 'login' ? 'Login successful!' : 'Registration successful!')}
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

          {mode !== 'recovery' && (
            <div className="auth-input-group">
              <label className="auth-input-label">Password</label>
              <div className="auth-password-wrapper">
                <input 
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {mode === 'register' && <div className="auth-input-hint">Min 6 characters</div>}
            </div>
          )}

          {mode === 'register' && (
            <div className="auth-input-group">
              <label className="auth-input-label">Confirm Password</label>
              <div className="auth-password-wrapper">
                <input 
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="auth-link-secondary" style={{ cursor: 'pointer' }} onClick={() => setMode('recovery')}>
              Forgot your password?
            </div>
          )}

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? 'Processing...' : (
              mode === 'login' ? 'Log In' : 
              mode === 'register' ? 'Sign Up' : 'Restore password'
            )}
          </button>
        </form>

        <div className="auth-switch-text">
          {mode === 'login' && (
            <>Don't have an account? <span className="auth-switch-link" onClick={() => setMode('register')}>Sign Up</span></>
          )}
          {mode === 'register' && (
            <>Already have an account? <span className="auth-switch-link" onClick={() => setMode('login')}>Log In</span></>
          )}
          {mode === 'recovery' && (
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <span className="auth-switch-link" onClick={() => setMode('login')}>Log In</span>
              <span className="auth-switch-link" onClick={() => setMode('register')}>Sign Up</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setMessage(null);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      const idToken = localStorage.getItem('auth_token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, newPassword })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to change password');

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      // Update token in case it was refreshed
      if (data.idToken) localStorage.setItem('auth_token', data.idToken);
      
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white' }}>
        <button className="auth-modal-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <h2 style={{ marginBottom: 24 }}>Account Settings</h2>

        <div className="modal-body">
          <p style={{ color: '#666', fontSize: 13, marginBottom: 24, fontWeight: 600 }}>Update your account security by changing your password.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="auth-input-group" style={{ marginBottom: 20 }}>
              <label className="auth-input-label">Current Password</label>
              <input 
                className="auth-input"
                type="password" 
                value={oldPassword} 
                onChange={(e) => setOldPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                style={{ width: '100%', padding: '14px 16px', background: '#f4f7fe', border: '1px solid #eef2f8', borderRadius: 12, color: '#333', outline: 'none', fontWeight: 600 }}
              />
            </div>

            <div className="auth-input-group" style={{ marginBottom: 20 }}>
              <label className="auth-input-label">New Password</label>
              <input 
                className="auth-input"
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                style={{ width: '100%', padding: '14px 16px', background: '#f4f7fe', border: '1px solid #eef2f8', borderRadius: 12, color: '#333', outline: 'none', fontWeight: 600 }}
              />
            </div>

            <div className="auth-input-group" style={{ marginBottom: 24 }}>
              <label className="auth-input-label">Confirm New Password</label>
              <input 
                className="auth-input"
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                style={{ width: '100%', padding: '14px 16px', background: '#f4f7fe', border: '1px solid #eef2f8', borderRadius: 12, color: '#333', outline: 'none', fontWeight: 600 }}
              />
            </div>

            {message && (
              <div style={{ 
                padding: 12, 
                borderRadius: 8, 
                marginBottom: 20, 
                fontSize: 14, 
                textAlign: 'center',
                background: message.type === 'success' ? '#dcfce7' : '#fff5f5',
                color: message.type === 'success' ? '#15803d' : '#e53e3e',
                border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#feb2b2'}`,
                fontWeight: 700
              }}>
                {message.text}
              </div>
            )}

            <button type="submit" className="auth-btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Processing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

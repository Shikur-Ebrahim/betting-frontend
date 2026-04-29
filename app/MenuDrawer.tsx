'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MenuDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-menu-drawer', handleOpen);
    return () => window.removeEventListener('open-menu-drawer', handleOpen);
  }, []);

  // Close when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => setIsLoggedIn(!!localStorage.getItem('auth_token'));
    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('auth-state-changed', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-state-changed', checkAuth);
    };
  }, []);

  const menuItems = [
    { label: 'Home', href: '/', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg> },
    { label: 'Sports', href: '/fixtures', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v20M2 12h20"></path></svg> },
    { label: 'Live', href: '/live', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> },
    { label: 'Deposit', href: '/deposit', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V8H4v4m16 0v4H4v-4m16 0h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2m-16-5H2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h2m12-9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"></path></svg>, protected: true },
    { label: 'Withdraw', href: '/withdraw', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line><path d="M7 15h.01M11 15h.01M15 15h.01"></path></svg>, protected: true },
    { label: 'Bet History', href: '/bethistory', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3"></path><circle cx="12" cy="12" r="10"></circle></svg>, protected: true },
    { label: 'Result Check', href: '/resultcheck', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>, protected: true },
    { label: 'Transaction History', href: '/transactions', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>, protected: true },
    { label: 'Account Settings', href: '#', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>, protected: true },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="drawer-overlay" 
          onClick={() => setIsOpen(false)}
          style={{ zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Drawer Panel */}
      <div className={`menu-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="logo-text" style={{ fontSize: 20 }}>
            TIPICO <span className="logo-accent" style={{ width: 8, height: 8 }}></span>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="drawer-content">
          {menuItems.map((item: any, idx) => (
            <Link 
              key={idx} 
              href={item.protected && !isLoggedIn ? '#' : item.href} 
              className="menu-drawer-item"
              onClick={(e) => {
                if (item.protected && !isLoggedIn) {
                  setIsOpen(false);
                  if (item.label === 'Deposit') {
                    localStorage.setItem('redirect_to_deposit', 'true');
                  } else if (item.label === 'Result Check') {
                    localStorage.setItem('redirect_to_resultcheck', 'true');
                  } else if (item.label === 'Account Settings') {
                    localStorage.setItem('open_settings_after_login', 'true');
                  } else if (item.label === 'Withdraw') {
                    localStorage.setItem('redirect_to_withdraw', 'true');
                  } else if (item.label === 'Transaction History') {
                    localStorage.setItem('redirect_to_transactions', 'true');
                  }
                  window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));
                } else {
                  setIsOpen(false);
                }
              }}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="drawer-footer">
          <p style={{ fontSize: 11, color: '#666', textAlign: 'center' }}>© 2026 TIPICO. All rights reserved.</p>
        </div>
      </div>
    </>
  );
}

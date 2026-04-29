'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: 'Sports',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2v20M2 12h20"></path>
        </svg>
      ),
      href: '/'
    },
    {
      label: 'Live',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      ),
      href: '/live'
    },
    {
      label: 'Deposit',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
          <circle cx="17" cy="14" r="1"></circle>
        </svg>
      ),
      href: '/login',
      isAccent: true
    },
    {
      label: 'Betslip',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="4"></line>
          <line x1="8" y1="2" x2="8" y2="4"></line>
          <circle cx="12" cy="11" r="3"></circle>
          <path d="M7 16h10"></path>
        </svg>
      ),
      href: '#'
    },
    {
      label: 'Menu',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      ),
      href: '#'
    }
  ];

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [betsCount, setBetsCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsLoggedIn(!!token);
    
    const updateCount = () => {
      const stored = localStorage.getItem('tipico_betslip');
      if (stored) setBetsCount(JSON.parse(stored).length);
      else setBetsCount(0);
    };
    updateCount();

    window.addEventListener('storage', updateCount);
    window.addEventListener('auth-state-changed', () => setIsLoggedIn(!!localStorage.getItem('auth_token')));
    window.addEventListener('betslip-updated', (e: any) => setBetsCount(e.detail.length));

    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('betslip-updated', updateCount);
    };
  }, []);

  return (
    <nav className="bottom-nav">
      {navItems.map((item, idx) => {
        const isActive = pathname === item.href;

        if (item.label === 'Deposit') {
          return (
            <button
              key={idx}
              type="button"
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              style={item.isAccent ? { color: '#ff6b00' } : undefined}
              onClick={() => {
                if (!isLoggedIn) {
                  localStorage.setItem('redirect_to_deposit', 'true');
                  window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));
                } else {
                  router.push('/deposit');
                }
              }}
            >
              <div className="bottom-nav-icon">{item.icon}</div>
              <span className="bottom-nav-label" style={item.isAccent ? { fontWeight: 700 } : undefined}>{item.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={idx}
            href={item.href}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            style={item.isAccent ? { color: '#ff6b00' } : undefined}
            onClick={(e) => {
              if (item.label === 'Sports') {
                window.dispatchEvent(new CustomEvent('open-mobile-drawer'));
              }
              if (item.label === 'Menu') {
                window.dispatchEvent(new CustomEvent('open-menu-drawer'));
              }
              if (item.label === 'Betslip') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('open-betslip'));
              }
              if (item.href === '#') {
                e.preventDefault();
              }
            }}
          >
            <div className="bottom-nav-icon" style={{ position: 'relative' }}>
              {item.icon}
              {item.label === 'Betslip' && betsCount > 0 && (
                <div className="betslip-badge">{betsCount}</div>
              )}
            </div>
            <span className="bottom-nav-label" style={item.isAccent ? { fontWeight: 700 } : undefined}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

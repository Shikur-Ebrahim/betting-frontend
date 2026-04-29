'use client';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MenuDrawer from './MenuDrawer';
import BetslipDrawer from './BetslipDrawer';
import BetslipRightPanel from './BetslipRightPanel';
import Link from 'next/link';
import { Suspense } from 'react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  if (isAdminPage) {
    return (
      <>
        <main style={{ minHeight: '100vh', background: '#f8fafc' }}>
          {children}
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="app-wrapper">
        <nav className="slim-nav">
          <Link href="/" className="slim-icon active"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg></Link>
          <Link href="/live" className="slim-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></Link>
          <Link href="/fixtures" className="slim-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></Link>
          <Link href="/results" className="slim-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></Link>
        </nav>

        <Suspense fallback={<div className="sidebar-loader"></div>}>
          <Sidebar />
        </Suspense>

        <main className="main-content">
          {children}
        </main>

        <aside className="right-panel">
          <BetslipRightPanel />
        </aside>
      </div>

      <BottomNav />
      <MenuDrawer />
      <BetslipDrawer />
    </>
  );
}

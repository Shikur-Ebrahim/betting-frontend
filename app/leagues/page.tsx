'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function AllLeaguesPage() {
   const [leagues, setLeagues] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');

   useEffect(() => {
     const unsub = onSnapshot(doc(db, 'config', 'leagues_list'), (snap) => {
       if (snap.exists()) {
         const list = snap.data().leagues || [];
         // Sort alphabetically
         list.sort((a:any, b:any) => a.name.localeCompare(b.name));
         setLeagues(list);
       }
       setLoading(false);
     });
     return () => unsub();
   }, []);

   const filteredLeagues = leagues.filter(l => 
     l.name.toLowerCase().includes(searchQuery.toLowerCase())
   );

   if (loading) return <div className="loader"></div>;

   const grouped: Record<string, any[]> = {};
   filteredLeagues.forEach(l => {
      const letter = l.name.charAt(0).toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(l);
   });

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 24, padding: '16px 24px', background: 'var(--bg-panel)', borderRadius: 8 }}>
         <div style={{ display:'flex', alignItems:'center', gap: 12, fontWeight: 800, fontSize: 18 }}>
            ⚽ Football
         </div>
          <div className="search-bar" style={{ marginBottom: 0, padding: '8px 16px', background: 'var(--bg-main)' }}>
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
             <input 
               type="text" 
               placeholder="Search leagues or countries..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', marginLeft: 8 }} 
             />
          </div>
      </div>

      {Object.keys(grouped).sort().map(letter => (
        <div key={letter} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>{letter}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {grouped[letter].map(l => (
               <Link key={l.id} href={`/fixtures?league=${l.id}`} style={{ display:'flex', alignItems:'center', gap: 16, background: 'var(--bg-panel)', padding: '14px 16px', borderRadius: 8, textDecoration: 'none', color: 'var(--text-main)', transition: '0.2s' }} className="league-card-hover">
                 <img src={l.logo} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                 <span style={{ fontWeight: 600, fontSize: 14 }}>{l.name}</span>
               </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

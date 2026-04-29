'use client';
import Link from 'next/link';

const SPORTS = [
  { name: 'Football', icon: '⚽', href: '/fixtures' },
  { name: 'Hockey', icon: '🏒', href: '#' },
  { name: 'Tennis', icon: '🎾', href: '#' },
  { name: 'Basketball', icon: '🏀', href: '#' },
  { name: 'Baseball', icon: '⚾', href: '#' },
  { name: 'Volleyball', icon: '🏐', href: '#' },
  { name: 'Cricket', icon: '🏏', href: '#' },
  { name: 'Esports', icon: '🎮', href: '#' },
];

export default function SportsNav() {
  return (
    <div className="sports-nav-container">
      <div className="sports-nav-scroll">
        {SPORTS.map((sport, idx) => (
          <Link key={idx} href={sport.href} className={`sports-nav-item ${idx === 0 ? 'active' : ''}`}>
            <div className="sport-icon-circle">{sport.icon}</div>
            <span className="sport-name">{sport.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

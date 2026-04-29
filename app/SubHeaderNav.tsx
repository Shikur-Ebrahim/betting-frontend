'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function SubHeaderNav() {
  const [searchValue, setSearchValue] = useState(3);

  return (
    <div className="sub-header-nav">
      <div className="sub-nav-row">
        <Link href="/fixtures" className="sub-btn dark" style={{ textDecoration: 'none', gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          <span>All Sports</span>
        </Link>
        <Link href="/live" className="sub-btn orange" style={{ textDecoration: 'none' }}>
          <span>Open Live</span>
        </Link>
        <button className="sub-btn search-square">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </button>
      </div>

      <div className="events-filter-section-row">
        <div className="filter-text-col">
          <div className="filter-days-num">{searchValue} days</div>
          <div className="filter-days-lbl">Events</div>
        </div>
        <div className="filter-slider-col">
          <input
            type="range"
            min="1" max="7"
            value={searchValue}
            onChange={(e) => setSearchValue(parseInt(e.target.value))}
            className="filter-range-input"
          />
          <div className="slider-ticks">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

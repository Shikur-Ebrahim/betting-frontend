'use client';
import { useState, useEffect } from 'react';

const BANNERS = [

  '/banner3.png',
  '/banner4.png',
  '/banner5.png'
];

export default function BannerSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="banner-slider">
      <div className="banner-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {BANNERS.map((src, idx) => (
          <div key={idx} className="banner-slide">
            <img src={src} alt="Sport Betting Banner" />
          </div>
        ))}
      </div>
    </div>
  );
}

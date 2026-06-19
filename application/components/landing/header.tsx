import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const totalScroll = scrollHeight - clientHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blueberry via-blueberry-light to-blueberry-dark z-[110] transition-all duration-75 ease-out" style={{ width: `${scrollProgress}%` }} />
      <header className="sticky top-0 z-[100] bg-brand-bg/90 backdrop-blur-md border-b-3 border-border-dark transition-all">
        <div className="max-w-7xl mx-auto px-6 h-18 sm:h-20 flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-display font-black text-2xl sm:text-3xl tracking-tighter text-blueberry-dark uppercase">MORITA</span>
          </div>
          <nav className="flex items-center gap-3 sm:gap-6 md:gap-8 justify-end flex-grow">
            <a href="#how-it-works" className="text-[10px] sm:text-sm font-display font-black text-blueberry-dark hover:text-blueberry hover:underline decoration-blueberry-light decoration-2 transition-colors uppercase tracking-tight">How it works</a>
            <a href="#interactive-playground" className="text-[10px] sm:text-sm font-display font-black text-blueberry-dark hover:text-blueberry hover:underline decoration-blueberry-light decoration-2 transition-colors uppercase tracking-tight">Sandbox</a>
            <a href="#marketplace" className="text-[10px] sm:text-sm font-display font-black text-blueberry-dark hover:text-blueberry hover:underline decoration-blueberry-light decoration-2 transition-colors uppercase tracking-tight">Marketplace</a>
            <a href="#sui-tech" className="text-[10px] sm:text-sm font-display font-black text-blueberry-dark hover:text-blueberry hover:underline decoration-blueberry-light decoration-2 transition-colors uppercase tracking-tight">Architecture</a>
            <a href="#faq" className="text-[10px] sm:text-sm font-display font-black text-blueberry-dark hover:text-blueberry hover:underline decoration-blueberry-light decoration-2 transition-colors uppercase tracking-tight">FAQ</a>
            <Link href="/dashboard" className="px-4 py-2 bg-blueberry text-white border-2 border-border-dark font-display font-black text-xs uppercase rounded-xl shadow-[2px_2px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all">Developer</Link>
          </nav>
        </div>
      </header>
    </>
  );
}

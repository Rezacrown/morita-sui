'use client';

import React, { useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface HeroProps {
  onOpenLoginModal: () => void;
  isWalletConnected: boolean;
}

export default function Hero({ onOpenLoginModal, isWalletConnected }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const infoClusterRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const textLeftRef = useRef<HTMLDivElement>(null);
  const textRightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Create a master ScrollTrigger Timeline for the Hero Exit and Curtain Reveal
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80px", // Align perfectly below the sticky header (80px tall) to prevent jumps
          end: "+=160%",     // Keep pinned so user experiences the complete zoom out and curtain sweep
          scrub: 1.2,        // Ultra fluid scrub speed
          pin: true,
          pinSpacing: true,
          invalidateOnRefresh: true,
        }
      });

      // 1. Zoom out and fade clean content of the hero to 0 opacity
      tl.to(infoClusterRef.current, {
        scale: 0.72,
        opacity: 0,
        y: -60,
        duration: 0.8,
        ease: "power2.inOut"
      }, 0);

      // 2. Sweeps the beautiful blueberry curtain ("tirai") across from left to right (left: 0%)
      tl.fromTo(curtainRef.current, {
        left: "-100%",
      }, {
        left: "0%",
        duration: 1.2,
        ease: "power2.inOut",
      }, 0.1); 

      // 3. Slide in high-end stark white typographic payload from opposite sides
      tl.fromTo(textLeftRef.current, {
        x: -300,
        opacity: 0,
      }, {
        x: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power2.out"
      }, 0.5);

      tl.fromTo(textRightRef.current, {
        x: 300,
        opacity: 0,
      }, {
        x: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power2.out"
      }, 0.5);

      // 4. Solid hold frame to allow user to view the full curtain state before scroll release
      tl.to({}, { duration: 0.8 });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative overflow-hidden w-full bg-brand-bg md:border-b-3 md:border-border-dark"
      style={{ height: "calc(100vh - 80px)" }} // Perfect full-viewport frame subtracting header
    >
      {/* BACKGROUND GRAPH GRID */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(30,32,68,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,32,68,0.04)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* CORE HERO WRAPPER FOR ZOOMING OUT */}
      <div 
        ref={infoClusterRef}
        className="h-full w-full flex items-center justify-center py-8 lg:py-16 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* LEFT WIREFRAME CARD GRID (FLANK) */}
            <div className="hidden lg:grid col-span-2 grid-cols-2 gap-3 opacity-25 select-none">
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={`left-grid-${i}`} 
                  className="aspect-square border border-dashed border-border-dark rounded-lg flex flex-col items-center justify-center p-2 relative"
                >
                  <span className="absolute top-1 left-1 text-[8px] font-mono text-border-dark/60">0{i+1}</span>
                  <div className="w-6 h-6 rounded-md bg-border-dark/5 border border-border-dark/10 flex items-center justify-center">
                    <span className="text-[9px] font-mono">+</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CENTRAL HERO COLUMN */}
            <div className="col-span-12 lg:col-span-8 text-center flex flex-col items-center justify-center px-4">
              
              {/* Minimal Swiss stylized announcement pill */}
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white border border-border-dark rounded-full shadow-[2px_2px_0px_0px_var(--color-border-dark)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
                <span className="w-2 h-2 bg-blueberry rounded-full inline-block animate-pulse"></span>
                <span className="text-[10px] sm:text-[11px] font-mono font-black text-blueberry-dark tracking-tight uppercase">
                  ⚡ PLAYER-OWNED ITEMS. CROSS-GAME. ZERO GAS.
                </span>
                <span className="text-xs text-border-dark/40">→</span>
              </div>

              {/* Headline */}
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-7xl text-border-dark tracking-tighter leading-[0.95] uppercase max-w-3xl">
                YOUR GAME ITEMS <br />
                <span className="text-blueberry">SHOULD NOT BE TRAPPED</span> <br />
                IN ONE GAME.
              </h1>

              {/* Description */}
              <p className="mt-6 text-sm sm:text-base text-border-dark/85 leading-relaxed font-sans max-w-2xl text-center">
                Morita connects digital game worlds on Sui. <strong>For game developers</strong>, deploy tokenized items with a REST API — no smart contracts to write, no gas to manage. <strong>For players</strong>, your hard-earned items live in a secure passport you control. Trade, sell, or barter across any game on the protocol.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                {isWalletConnected ? (
                  <a 
                    href="#marketplace"
                    className="px-8 py-4 bg-blueberry-light text-blueberry-dark border-3 border-border-dark text-base font-display font-black rounded-xl shadow-[5px_5px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_var(--color-blueberry)] transition-all flex items-center justify-center gap-3 active:translate-y-0 cursor-pointer"
                  >
                    <span>Explore Marketplace</span>
                    <ArrowRight className="w-5 h-5 text-blueberry-dark" />
                  </a>
                ) : (
                  <button 
                    onClick={onOpenLoginModal}
                    className="px-8 py-4 bg-blueberry text-white border-3 border-border-dark text-base font-display font-black rounded-xl shadow-[5px_5px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_var(--color-blueberry-light)] hover:bg-blueberry-dark transition-all flex items-center justify-center gap-3 active:translate-y-0 cursor-pointer font-bold"
                  >
                    <span>Sign In with Google</span>
                    <ArrowRight className="w-5 h-5 text-white" />
                  </button>
                )}
                
                <a 
                  href="/dashboard"
                  className="px-8 py-4 bg-white text-border-dark border-2 border-border-dark text-sm font-mono font-extrabold rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:bg-blueberry-cream transition-all flex items-center justify-center gap-2"
                >
                  <span>Developer Dashboard</span>
                  <span className="text-[10px] bg-blueberry-cream text-blueberry-dark font-black px-1.5 py-0.5 rounded">BETA</span>
                </a>
              </div>

              {/* Sponsored by / storage specs handled simply */}
              <div className="mt-10 flex items-center gap-6 justify-center">
                <div className="text-left">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-border-dark/40 block">SPONSORED BY</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-display font-black text-xs text-border-dark">ENOKI GASLESS</span>
                  </div>
                </div>
                <div className="w-px h-6 bg-border-dark/10" />
                <div className="text-left">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-border-dark/40 block">STORAGE LAYER</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-display font-black text-xs text-border-dark">WALRUS RECOVERY</span>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT WIREFRAME CARD GRID (FLANK) */}
            <div className="hidden lg:grid col-span-2 grid-cols-2 gap-3 opacity-25 select-none">
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={`right-grid-${i}`} 
                  className="aspect-square border border-dashed border-border-dark rounded-lg flex flex-col items-center justify-center p-2 relative"
                >
                  <span className="absolute top-1 left-1 text-[8px] font-mono text-border-dark/60">0{i+9}</span>
                  <div className="w-6 h-6 rounded-md bg-border-dark/5 border border-border-dark/10 flex items-center justify-center">
                    <span className="text-[9px] font-mono">+</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* 
        PREMIUM CINEMATIC GSAP SLIDING CURTAIN ("TIRAI") 
        Sweeps in from the left to completely seal the hero view before transitioning.
        Colours: bg-blueberry background, with gorgeous stark white text.
      */}
      <div 
        ref={curtainRef}
        className="absolute top-0 bottom-0 z-50 bg-blueberry border-r-8 border-white/25 flex flex-col justify-center items-center px-6 isolate shadow-[-30px_0_60px_rgba(0,0,0,0.35)] pointer-events-none"
        style={{ left: "-100%", width: "100%" }}
      >
        {/* Curtains decorative line layout */}
        <div className="absolute inset-x-0 h-1/4 top-0 border-b border-dashed border-white/10 flex items-end px-12 pb-4 font-mono text-[10px] tracking-widest text-white/50 uppercase">
          Morita Unified Ledger Protocol V1.2 — Core Engine Activating
        </div>
        <div className="absolute inset-x-0 h-1/4 bottom-0 border-t border-dashed border-white/10 flex items-start px-12 pt-4 font-mono text-[10px] tracking-widest text-white/40 uppercase justify-between">
          <span>Decentralizing Virtual Assets</span>
          <span>Sui Overflow Hackathon</span>
        </div>

        {/* Central Giant Typographic Payload on the Curtain */}
        <div className="max-w-5xl text-center space-y-6 lg:space-y-8 select-none">
          <div className="overflow-hidden">
            <h2 
              ref={textLeftRef}
              className="font-display font-black text-4xl sm:text-6xl lg:text-8xl tracking-tighter leading-[0.9] text-white uppercase whitespace-pre-line"
            >
              UNIFYING <span className="text-white bg-white/10 px-2 rounded">DIGITAL</span><br />
              INVENTORIES
            </h2>
          </div>

          <div className="h-0.5 w-48 bg-white/35 mx-auto rounded" />

          <div className="overflow-hidden">
            <p 
              ref={textRightRef}
              className="font-mono text-xs sm:text-sm font-black tracking-widest text-white uppercase"
            >
              🚀 NATIVELY SECURED AT THE SUI KIOSK LAYER
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

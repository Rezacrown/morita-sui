'use client';

import React from 'react';

export default function MarketplacePreview() {
  return (
    <section id="marketplace" className="border-b-3 border-border-dark py-16 lg:py-24 bg-brand-bg">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-mono tracking-widest text-border-dark/60 uppercase font-extrabold">FEATURED CROSS-GAME COLLECTION</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl mt-2 uppercase text-border-dark">
              Featured cross-game loot
            </h2>
          </div>
          
          <p className="mt-3 md:mt-0 font-sans text-sm text-border-dark/70 max-w-sm">
            Discover verified rare items currently living securely in player inventories across fantasy, cyberpunk, and pixel gaming dimensions.
          </p>
        </div>

        {/* DYNAMIC GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* CARD 1: LARGE FEATURED HERO ITEM */}
          <div className="md:col-span-8 bg-white border-3 border-border-dark rounded-2xl p-6 flex flex-col sm:flex-row justify-between relative overflow-hidden group shadow-[6px_6px_0px_0px_var(--color-border-dark)]">
            
            <div className="absolute top-0 right-0 bg-blueberry-light border-b-2 border-l-2 border-border-dark px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider z-10 text-blueberry-dark">
              HOT OFFER 👑
            </div>

            {/* Graphic Side */}
            <div className="sm:w-1/2 flex flex-col justify-between z-10 pr-4">
              <div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-border-dark/60 uppercase font-extrabold mb-1">
                  <span>CyberForge RPG</span>
                  <span>•</span>
                  <span className="text-blueberry">Sui Kiosk Secured</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-display font-black uppercase tracking-tight text-border-dark group-hover:text-blueberry transition-colors">
                  Void-Forged katana
                </h3>
                <p className="mt-2 text-xs text-border-dark/70 leading-relaxed font-sans max-w-xs">
                  Forged in the cyber vaults under Neo Tokyo. This standard blade transitions perfectly into fantasy realms, adjusting stats dynamically.
                </p>
              </div>

              <div className="mt-6 border-t pt-4 border-border-dark/10">
                <span className="text-[10px] font-mono text-border-dark/40 block uppercase">GUARANTEED CREATOR ROYALTY</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-border-dark font-mono">5.0% Royalty Enforcement</span>
                  <span className="text-[9px] bg-blueberry-cream text-blueberry-dark px-1.5 py-0.5 rounded font-mono font-extrabold">SI CONTRACT PROTOCOL</span>
                </div>
              </div>
            </div>

            {/* Vector Graphic / Interactive preview side */}
            <div className="sm:w-1/2 flex flex-col items-center justify-center py-6 bg-border-dark/5 rounded-xl border border-border-dark/5 mt-4 sm:mt-0 relative">
              
              {/* Visual SVG katana render */}
              <div className="w-36 h-36 bg-white border-2 border-border-dark rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_var(--color-border-dark)] group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300">
                <svg viewBox="0 0 100 100" className="w-24 h-24">
                  <path d="M15 85 L85 15" stroke="#1E2044" strokeWidth="6" strokeLinecap="round" />
                  <line x1="12" y1="88" x2="18" y2="82" stroke="#1E2044" strokeWidth="8" strokeLinecap="round" />
                  <path d="M22 78 L25 75" stroke="#FFFFFF" strokeWidth="4" />
                  <circle cx="80" cy="20" r="4" fill="var(--color-blueberry-light)" stroke="#1E2044" strokeWidth="1.5" />
                  <path d="M35 55 L45 57" stroke="#000000" strokeWidth="2" />
                  <circle cx="50" cy="50" r="1" fill="#000" />
                </svg>
              </div>

              {/* Claim details overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-mono bg-brand-bg p-2 border-2 border-border-dark rounded-lg text-[10px]">
                <span className="text-border-dark">VALUED IN SUI :</span>
                <span className="font-extrabold text-blueberry-dark uppercase bg-blueberry-light px-1.5 rounded">48 SUI</span>
              </div>

            </div>

          </div>

          {/* CARD 2: PASTEL TILE CARD (FANTASY STAFF) */}
          <div className="md:col-span-4 bg-blueberry-light/10 border-3 border-border-dark rounded-2xl p-6 flex flex-col justify-between relative group hover:bg-blueberry-light/20 transition-all shadow-[6px_6px_0px_0px_var(--color-border-dark)]">
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-blueberry text-white px-2 py-0.5 rounded uppercase">EPIC INVENTORY</span>
              <span className="text-[10px] font-mono text-border-dark/50">ID: m_st_82</span>
            </div>

            <div className="my-6 flex justify-center">
              <div className="w-28 h-28 bg-white border-2 border-border-dark rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_var(--color-border-dark)] group-hover:-translate-y-2 transition-transform duration-300">
                <svg viewBox="0 0 100 100" className="w-16 h-16">
                  <line x1="20" y1="80" x2="80" y2="20" stroke="#1E2044" strokeWidth="5" strokeLinecap="round" />
                  <circle cx="80" cy="20" r="10" fill="var(--color-blueberry-light)" stroke="#1E2044" strokeWidth="3.5" />
                  <circle cx="80" cy="20" r="4" fill="#1E2044" />
                  <path d="M72 12 L68 15" stroke="#1E2044" strokeWidth="2" />
                </svg>
              </div>
            </div>

            <div>
              <span className="font-mono text-[9px] text-blueberry font-extrabold uppercase">AETHERIA QUEST RPG</span>
              <h4 className="text-xl font-display font-black uppercase text-border-dark">AETHERIAL STAFF</h4>
              
              <div className="flex items-center justify-between border-t border-border-dark/10 mt-4 pt-3 text-xs font-mono">
                <span className="text-border-dark">PRICE</span>
                <span className="font-black text-border-dark">28 SUI</span>
              </div>
            </div>

          </div>

          {/* CARD 3: COOL SAGE CHRONO RELIC CARD */}
          <div className="md:col-span-4 bg-blueberry-cream border-3 border-border-dark rounded-2xl p-6 flex flex-col justify-between relative group hover:bg-blueberry-light/10 transition-all shadow-[6px_6px_0px_0px_var(--color-border-dark)]">
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-blueberry-light text-blueberry-dark px-2 py-0.5 rounded uppercase font-black">LEGENDARY CUBE</span>
              <span className="text-[10px] font-mono text-border-dark/50">ID: m_cr_91</span>
            </div>

            <div className="my-6 flex justify-center">
              <div className="w-28 h-28 bg-white border-2 border-border-dark rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_var(--color-border-dark)] group-hover:-translate-y-2 transition-transform duration-300">
                <svg viewBox="0 0 100 100" className="w-16 h-16">
                  <polygon points="50,15 80,40 80,75 50,90 20,75 20,40" fill="var(--color-blueberry-light)" fillOpacity="0.5" stroke="#1E2044" strokeWidth="3" />
                  <line x1="50" y1="15" x2="50" y2="90" stroke="#1E2044" strokeWidth="1.5" />
                  <line x1="20" y1="40" x2="80" y2="40" stroke="#1E2044" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            <div>
              <span className="font-mono text-[9px] text-border-dark/60 font-black uppercase font-bold">PIXEL QUEST DIMENSION</span>
              <h4 className="text-xl font-display font-black uppercase text-border-dark">CHRONOS MIRROR</h4>
              
              <div className="flex items-center justify-between border-t border-border-dark/10 mt-4 pt-3 text-xs font-mono">
                <span className="text-border-dark">STATUS</span>
                <span className="font-black text-border-dark">LISTED IN KIOSK</span>
              </div>
            </div>

          </div>

          {/* CARD 4: STRETCHED DEVS MINT PORTAL ACCELERATOR */}
          <div className="md:col-span-8 bg-blueberry-cream border-3 border-border-dark rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden shadow-[6px_6px_0px_0px_var(--color-border-dark)] group">
            
            <div className="sm:w-1/2">
              <div className="bg-blueberry-light text-blueberry-dark font-mono text-[10px] font-black px-2 py-1 rounded inline-block uppercase mb-3">
                UNIFORM SPEC COMPLIANT 🎯
              </div>
              <h3 className="text-2xl font-display font-black uppercase text-border-dark leading-tight">
                ENFORCE DECENTRALIZED CREATOR ROYALTIES
              </h3>
              
              <p className="mt-2 text-xs text-border-dark/80 leading-relaxed font-sans text-border-dark">
                Unlike conventional NFT marketplaces where royalty cuts are easily bypassed, Morita relies on native <strong>Sui Kiosk Transfer Rules</strong>. Every sale on our custom secondary marketplace enforces creator royalties automatically.
              </p>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-mono bg-blueberry text-white px-2 py-0.5 rounded">SUI ASSET KIOSK</span>
                <span className="text-xs font-mono text-border-dark/60">NO BYPASS POSSIBLE</span>
              </div>
            </div>

            {/* Graphical illustration for royalty splits */}
            <div className="sm:w-1/2 w-full bg-white border-2 border-border-dark rounded-xl p-4 shadow-[4px_4px_0px_0px_var(--color-border-dark)] relative">
              <span className="text-[9px] font-mono text-border-dark/30 block tracking-widest uppercase">AUTOMATED SPLIT SCHEME</span>
              
              <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center text-xs font-mono bg-blueberry-cream/50 p-2 rounded border border-blueberry-light">
                  <span className="font-bold text-border-dark flex items-center gap-1">👤 Gamer (Seller Offer)</span>
                  <span className="font-extrabold text-blueberry-dark bg-white px-2 py-0.5 rounded">95.0%</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono bg-blueberry-light/20 p-2 rounded border border-blueberry">
                  <span className="font-bold text-border-dark flex items-center gap-1">👾 Game Dev (Royalty)</span>
                  <span className="font-extrabold text-blueberry-dark bg-blueberry-cream px-2 py-0.5 rounded">5.0% bps</span>
                </div>
              </div>

              <div className="mt-4 text-[10px] font-mono text-center text-border-dark/60 bg-yellow-50/50 p-1.5 rounded border border-yellow-200">
                ⚡ Enforced atomically in escrow block
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

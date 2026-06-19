"use client";

import React from "react";
import { Home, ShieldCheck, Database } from "lucide-react";

export default function TechBento() {
  return (
    <section
      id="sui-tech"
      className="border-b-3 border-border-dark py-16 lg:py-24 bg-brand-bg"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs font-mono tracking-widest text-border-dark/60 uppercase font-bold">
            THE CORE ARCHITECTURE
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl mt-4 uppercase text-border-dark">
            Built on Sui Powertrains
          </h2>
          <p className="font-sans text-sm text-border-dark/70 mt-2">
            Decentralized commerce that feels exactly like Web2. Our core engine
            operates natively using Sui&apos;s premium developer toolkits.
          </p>
        </div>

        {/* SUI CARDS WRAPPER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* SUI CARD 1: ENOKI */}
          <div className="bg-white border-2 border-border-dark rounded-xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-blueberry-light/20 border border-border-dark rounded-lg flex items-center justify-center mb-4">
              <Home className="w-6 h-6 text-blueberry-dark" />
            </div>

            <h3 className="text-lg font-display font-black uppercase text-border-dark">
              Google / Twitch Authenticated
            </h3>

            <p className="mt-2 text-xs text-border-dark/75 font-sans leading-relaxed">
              Using Mysten Labs&apos; <strong>Enoki Portal zkLogin</strong>,
              players authorize transfers, view inventory, and purchase items
              using simple Google/Twitch accounts. Zero wallet extensions
              required.
            </p>
          </div>

          {/* SUI CARD 2: KIOSK FOR ALL */}
          <div className="bg-white border-2 border-border-dark rounded-xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-blueberry-cream border border-border-dark rounded-lg flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-blueberry-dark" />
            </div>

            <h3 className="text-lg font-display font-black uppercase text-border-dark">
              Secure Sui Kiosk Rules
            </h3>

            <p className="mt-2 text-xs text-border-dark/75 font-sans leading-relaxed">
              Items listed for sale automatically live inside the player&apos;s
              personal <strong>Sui Kiosk object</strong>. This enforces optional
              developer royalties directly at the core smart ledger layer.
            </p>
          </div>

          {/* SUI CARD 3: WALRUS STORAGE */}
          <div className="bg-white border-2 border-border-dark rounded-xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
            <div className="w-12 h-12 bg-blueberry-light/40 border border-border-dark rounded-lg flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-blueberry-dark" />
            </div>

            <h3 className="text-lg font-display font-black uppercase text-border-dark">
              Walrus Decentralised Media
            </h3>

            <p className="mt-2 text-xs text-border-dark/75 font-sans leading-relaxed">
              Morita uploads item specifications and image layers server-side
              directly to <strong>Walrus (via Harbor HTTP)</strong>. All meta
              arrays are immutable, permanent, and indexable in milliseconds.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

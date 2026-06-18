'use client';

import React from 'react';
import { Code, Users, Shuffle, ShieldAlert } from 'lucide-react';

interface Step {
  id: string;
  num: string;
  title: string;
  description: string;
  badge: string;
  icon: React.ReactNode;
  bgClass: string;
  textColor: string;
  borderColor: string;
  codeSnippet?: string;
}

export default function HowItWorks() {
  const steps: Step[] = [
    {
      id: "step-1",
      num: "01",
      badge: "DEVELOPER SETUP",
      title: "Simple backend payload integration",
      description: "Developers load Morita's clean asset structures via custom REST endpoints or our straightforward SDK. There are no complicated smart contracts to write and compile manually — Morita handles all Kiosk definitions on Sui behind the scenes.",
      icon: <Code className="w-8 h-8 text-white" />,
      bgClass: "bg-blueberry text-white",
      textColor: "text-white",
      borderColor: "border-border-dark",
      codeSnippet: `// Register cross-game asset on Sui
const asset = await morita.assets.register({
  name: "Void Katana",
  supply: 100,
  royalties: 0.05, // 5% native Kiosk
  storage: "walrus" // Permanent meta
});`
    },
    {
      id: "step-2",
      num: "02",
      badge: "PLAYER ONBOARDING",
      title: "Google / Twitch Social Authenticated pass",
      description: "Players log in securely using their existing Google or Twitch credentials via Mysten Labs' Enoki zkLogin infrastructure. A customized virtual Sui account is instantly generated for them on the client. Zero tricky extensions, seed phrases, or gas calculations are exposed to the browser.",
      icon: <Users className="w-8 h-8 text-blueberry-dark" />,
      bgClass: "bg-blueberry-light text-blueberry-dark",
      textColor: "text-blueberry-dark",
      borderColor: "border-border-dark",
      codeSnippet: `// Initialize social login via Enoki
const wallet = await morita.player.zkLogin({
  provider: 'google',
  redirectUrl: 'https://morita.app/profile'
});`
    },
    {
      id: "step-3",
      num: "03",
      badge: "COMMERCE ESCROW",
      title: "Atomic barter swap execution",
      description: "Players trade, auction, or barter digital assets seamlessly across participating games. Every single swap runs inside a secure, on-chain Sui escrow mechanism. Either both properties shift ownership coordinates simultaneously, or the entire block is discarded instantly — guaranteeing zero counterparty trust issues.",
      icon: <Shuffle className="w-8 h-8 text-blueberry-dark" />,
      bgClass: "bg-blueberry-cream text-border-dark",
      textColor: "text-border-dark",
      borderColor: "border-border-dark",
      codeSnippet: `// Create escrow atomic transfer payload
const barterTx = await morita.swap.initiate({
  sellerItem: "kiosk_obj_99a8x",
  buyerItem: "kiosk_obj_1120p",
  escrowFee: "sponsored_gas"
});`
    },
    {
      id: "step-4",
      num: "04",
      badge: "ROYALTY RECOVERY",
      title: "Sui Kiosk core rule enforcement",
      description: "Every asset listed for sale on the marketplace utilizes our native Sui Kiosk architecture. Because transfer parameters live directly at the ledger's core consensus layer, other players and external traders cannot bypass the game developer's defined secondary marketplace royalties.",
      icon: <ShieldAlert className="w-8 h-8 text-white" />,
      bgClass: "bg-border-dark text-white",
      textColor: "text-white",
      borderColor: "border-[#31335a]"
    }
  ];

  return (
    <section 
      id="how-it-works" 
      className="border-b-3 border-border-dark bg-brand-bg relative overflow-hidden py-20 lg:py-28"
    >
      <div className="max-w-7xl mx-auto px-6 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <span className="text-xs font-mono font-black tracking-widest bg-blueberry text-white px-3 py-1.5 rounded uppercase">
            THE INTEGRATION ENGINE
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl mt-6 uppercase text-border-dark">
            HOW IT WORKS
          </h2>
          <p className="font-sans text-sm sm:text-base text-border-dark/80 mt-4 leading-relaxed">
            Morita bridges the gap between decentralized ledgers and premium gameplay. 
            A seamless bridge constructed of 4 core engines working hand-in-hand.
          </p>
        </div>

        {/* 2x2 Clean Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-6xl mx-auto">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`rounded-2xl border-3 ${step.borderColor} ${step.bgClass} p-6 sm:p-10 flex flex-col justify-between shadow-[6px_6px_0px_0px_var(--color-border-dark)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all relative group overflow-hidden`}
            >
              {/* Giant card watermark */}
              <span className="absolute right-6 top-4 font-display font-black text-6xl sm:text-8xl opacity-10 select-none tracking-tighter pointer-events-none">
                {step.num}
              </span>

              {/* Top Row content */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[9px] font-mono font-black tracking-widest border border-current px-2.5 py-1 rounded-full uppercase leading-none">
                    {step.badge}
                  </span>
                  <div className="p-2 sm:p-2.5 bg-white/10 border border-white/5 rounded-xl">
                    {step.icon}
                  </div>
                </div>

                <h3 className={`text-xl sm:text-2xl font-display font-black uppercase tracking-tight ${step.textColor} mb-3`}>
                  {step.title}
                </h3>
                
                <p className="text-xs sm:text-sm leading-relaxed opacity-90 font-sans">
                  {step.description}
                </p>
              </div>

              {/* Conditional render of custom interactive visual payload or code blocks */}
              <div className="mt-6 pt-6 border-t border-current/10">
                {step.codeSnippet ? (
                  <div className="rounded-xl bg-[#090B1B]/80 p-4 font-mono text-[10.5px] sm:text-xs overflow-x-auto text-blue-200 border border-white/5">
                    <pre><code>{step.codeSnippet}</code></pre>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-[10px] font-mono tracking-widest uppercase opacity-65">
                    <span>GUARANTEED SECONDARY MARKET COMMERCE</span>
                    <span className="text-base">🛡️</span>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

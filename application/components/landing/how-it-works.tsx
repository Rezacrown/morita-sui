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
      title: "Register your game in 2 minutes",
      description: "Create a publisher workspace, register your game, and define item templates through our dashboard. No smart contract to compile, no blockchain knowledge required. Morita handles all on-chain deployment — you just fill in the form.",
      icon: <Code className="w-8 h-8 text-white" />,
      bgClass: "bg-blueberry text-white",
      textColor: "text-white",
      borderColor: "border-border-dark",
      codeSnippet: `// Mint an item via REST API
curl -X POST /api/v1/game/42/item/mint \\
  -H "Authorization: Bearer morita_sk_live" \\
  -d '{ "item_template_id": 7 }'
// Returns: { claim_url: "morita.app/claim?code=AB12-CD34" }`
    },
    {
      id: "step-2",
      num: "02",
      badge: "PLAYER ONBOARDING",
      title: "Claim items with one click",
      description: "Game servers generate claim URLs via our API. Players open the link, sign in with Google (via Enoki zkLogin), and claim their item in one click. A Sui wallet is created on the fly — no extension, no seed phrase, no gas fees.",
      icon: <Users className="w-8 h-8 text-blueberry-dark" />,
      bgClass: "bg-blueberry-light text-blueberry-dark",
      textColor: "text-blueberry-dark",
      borderColor: "border-border-dark",
      codeSnippet: `// Player clicks claim URL
// 1. Google OAuth → zkLogin wallet created
// 2. Item minted on-chain, transferred to player
// 3. Appears in inventory instantly
// All gas sponsored by Morita`
    },
    {
      id: "step-3",
      num: "03",
      badge: "COMMERCE & BARTER",
      title: "Trade items across any game",
      description: "List items for sale with optional creator royalties enforced by Sui Kiosk. Or create a barter escrow — lock your item, set conditions, and swap atomically in a single transaction. Both parties get their items or the trade never happens. Zero counterparty risk.",
      icon: <Shuffle className="w-8 h-8 text-blueberry-dark" />,
      bgClass: "bg-blueberry-cream text-border-dark",
      textColor: "text-border-dark",
      borderColor: "border-border-dark",
      codeSnippet: `// Create barter escrow
const escrow = await morita.swap.lock({
  item: "0x...",       // Your GameItem
  want: { rarity: "Legendary" }
});
// Fulfiller matches conditions
// Both items swap in 1 transaction`
    },
    {
      id: "step-4",
      num: "04",
      badge: "ROYALTY ENFORCEMENT",
      title: "Automatic creator royalties",
      description: "Every item listed for sale uses native Sui Kiosk transfer rules. Developer royalties are enforced at the protocol level — not by contract logic that can be bypassed. When an item sells, royalties split atomically in the same transaction. No marketplaces can circumvent them.",
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
            HOW MORITA WORKS
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl mt-6 uppercase text-border-dark">
            FROM DEV TO PLAYER
          </h2>
          <p className="font-sans text-sm sm:text-base text-border-dark/80 mt-4 leading-relaxed">
            Four steps from developer onboarding to player trading. No blockchain experience required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-6xl mx-auto">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`rounded-2xl border-3 ${step.borderColor} ${step.bgClass} p-6 sm:p-10 flex flex-col justify-between shadow-[6px_6px_0px_0px_var(--color-border-dark)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all relative group overflow-hidden`}
            >
              <span className="absolute right-6 top-4 font-display font-black text-6xl sm:text-8xl opacity-10 select-none tracking-tighter pointer-events-none">
                {step.num}
              </span>

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

              <div className="mt-6 pt-6 border-t border-current/10">
                {step.codeSnippet ? (
                  <div className="rounded-xl bg-[#090B1B]/80 p-4 font-mono text-[10.5px] sm:text-xs overflow-x-auto text-blue-200 border border-white/5">
                    <pre><code>{step.codeSnippet}</code></pre>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-[10px] font-mono tracking-widest uppercase opacity-65">
                    <span>ATOMIC ROYALTY SPLIT AT PROTOCOL LEVEL</span>
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

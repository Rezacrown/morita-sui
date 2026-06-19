'use client';

import React, { useState } from 'react';
import { HelpCircle, Plus, Minus } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqItems: FAQItem[] = [
  {
    category: "zkLogin / zk-Auth",
    question: "How does Morita bypass conventional wallet extensions?",
    answer: "Morita integrates Mysten Labs' Enoki zkLogin framework. Instead of asking players to install browser extensions, sign complex hashes, or keep seed phrase notebooks, players authenticate securely via standard Google or Twitch credentials. On-chain accounts are generated client-side inside standard JSON-web-tokens, leaving gas sponsorship and transactions to the background."
  },
  {
    category: "Sui Kiosk Rules",
    question: "How are game designer royalties actually guaranteed?",
    answer: "Traditional marketplaces often bypass creator secondary royalties by moving transfers off-market or utilizing custom contracts. Morita avoids this completely by requiring listed items to live inside a native Sui Kiosk object. Under Sui's core consensus, the transfer rules are defined of permanent record on-chain — rendering royalty circumventions mathematically impossible."
  },
  {
    category: "SDK Node API",
    question: "Can I transition my custom assets across completely different game engines?",
    answer: "Yes! Morita separates core asset ownership arrays from game client rendering blueprints. Game engines like Unity, Unreal, or WebGL environments query our simple REST API using the player's secure wallet address. The engine learns the authenticated item parameters and loads the custom asset blueprint corresponding to that specific environment."
  },
  {
    category: "Walrus Epochs",
    question: "What exact purpose does Walrus Storage fill?",
    answer: "Walrus is a highly scalable, decentralized storage solution developed by Mysten Labs. Instead of storing large visual components, high-definition models, or animated SVGs on expensive smart contracts or fragile centralized host servers, Morita packs specifications into permanent Walrus epochs, accessible in milliseconds."
  },
  {
    category: "zkLogin / zk-Auth",
    question: "Does Morita require gas deposits from game developers or players?",
    answer: "No. Morita uses Enoki's native gas station mechanics. Developers can host gas sponsorships, letting players interact with digital assets completely free of gas. The platform or developer funds a single sponsor wallet, and Enoki transparently appends the sponsored signature directly to the transaction block."
  }
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggleItem = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="border-b-3 border-border-dark py-16 lg:py-28 bg-brand-bg relative">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Section Heading */}
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs font-mono tracking-widest text-[#3b4df9] bg-blueberry-cream/60 border border-blueberry-light px-3 py-1.5 rounded uppercase font-black inline-block">
            🤝 KNOWLEDGE BASE
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl uppercase text-border-dark mt-4">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <p className="font-sans text-sm text-border-dark/70 mt-3 leading-relaxed">
            Everything you need to know about the cross-game inventory framework.
          </p>
        </div>

        {/* ACCORDION FAQS */}
        <div className="space-y-4">
          {faqItems.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={`faq-${idx}`}
                className="bg-white border-2 border-border-dark rounded-xl overflow-hidden transition-all duration-300 shadow-[4px_4px_0px_0px_var(--color-border-dark)]"
              >
                {/* Accordion Trigger */}
                <button
                  type="button"
                  onClick={() => toggleItem(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer hover:bg-blueberry-cream/35 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <HelpCircle className="w-5 h-5 text-blueberry stroke-[2.5] flex-shrink-0" />
                    <span className="font-display font-black text-sm sm:text-base text-border-dark uppercase tracking-tight">
                      {item.question}
                    </span>
                  </div>
                  <div className="p-1 border-2 border-border-dark rounded-md bg-white text-border-dark flex-shrink-0 ml-4">
                    {isOpen ? (
                      <Minus className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>
                </button>

                {/* Accordion Content */}
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-96 border-t-2 border-border-dark/10' : 'max-h-0'
                  }`}
                >
                  <div className="p-6 text-xs sm:text-sm text-border-dark/80 bg-blueberry-cream/15 leading-relaxed font-sans flex flex-col sm:flex-row gap-4 justify-between items-start">
                    <p className="flex-grow">{item.answer}</p>
                    <span className="text-[9px] font-mono font-black border border-border-dark/30 px-2 py-0.5 rounded uppercase self-end sm:self-auto bg-white whitespace-nowrap text-border-dark/50">
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

         {/* Dynamic Swiss Info banner */}
        <div className="mt-16 bg-white border-3 border-border-dark rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_var(--color-border-dark)] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-black text-blueberry uppercase block">
              HAVE A TECHNICAL QUERY?
            </span>
            <p className="font-display font-black text-lg text-border-dark uppercase tracking-tight">
              Read our full Sui developer handbook
            </p>
          </div>
          <a
            href="https://x.com/suidevelopers"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 bg-blueberry text-white border-2 border-border-dark text-xs font-mono font-black rounded-xl hover:-translate-y-0.5 shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:shadow-none transition-all text-center uppercase"
          >
            Ask sui developers
          </a>
        </div>

      </div>
    </section>
  );
}

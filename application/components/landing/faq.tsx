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
    category: "GETTING STARTED",
    question: "Do I need blockchain experience to use Morita as a game developer?",
    answer: "No. Morita handles all on-chain deployment behind the scenes. You register your game through our developer dashboard, define item templates, and publish with one click. Your game server talks to our REST API using simple HTTP calls. We generate the Sui Move calls, manage the smart contract, and sponsor all gas fees."
  },
  {
    category: "PLAYER EXPERIENCE",
    question: "Do players need a crypto wallet to use Morita?",
    answer: "No wallet extension, no seed phrase, no gas fees. Players sign in with their Google account. Morita uses Enoki zkLogin to generate a Sui wallet on the fly, securely. Every transaction — claiming an item, listing for sale, swapping in a barter — is sponsored by the platform. Players never touch SUI tokens."
  },
  {
    category: "ROYALTIES",
    question: "How are game developer royalties enforced?",
    answer: "Traditional marketplaces routinely bypass creator royalties by using custom contracts or off-platform trades. Morita uses native Sui Kiosk transfer rules — the royalty policy lives at the Sui protocol level, not in contract code. When an item is purchased, the royalty split happens atomically in the same transaction. There is no way to circumvent it."
  },
  {
    category: "ITEM STORAGE",
    question: "What does Walrus storage do?",
    answer: "Item images, 3D model metadata, and JSON specifications are stored on Walrus — a decentralized blob storage network built by Mysten Labs. The Sui blockchain stores only a lightweight reference (blob ID). This keeps on-chain costs minimal while guaranteeing your asset metadata is immutable and permanently accessible."
  },
  {
    category: "DEVELOPER API",
    question: "Can players trade items between different games?",
    answer: "Yes — that is the core feature. Morita uses Sui Programmable Transaction Blocks to enable atomic cross-game barter. A player from Game A can lock their sword in escrow and request a shield from Game B. When a player from Game B fulfills the conditions, both items transfer in a single transaction. If anything fails, neither item moves."
  },
  {
    category: "GAS & FEES",
    question: "Who pays for transaction fees?",
    answer: "All transaction fees are sponsored by the platform via Enoki gas stations. Game developers never spend SUI on minting, and players never spend SUI on trading. The platform funds a single gas wallet, and Enoki transparently appends sponsored signatures to every transaction block. Zero gas, zero friction."
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
        
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs font-mono tracking-widest text-[#3b4df9] bg-blueberry-cream/60 border border-blueberry-light px-3 py-1.5 rounded uppercase font-black inline-block">
            🤔 COMMON QUESTIONS
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl uppercase text-border-dark mt-4">
            FREQUENTLY ASKED
          </h2>
          <p className="font-sans text-sm text-border-dark/70 mt-3 leading-relaxed">
            Everything you need to know about cross-game inventory, developer integration, and player trading.
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={`faq-${idx}`}
                className="bg-white border-2 border-border-dark rounded-xl overflow-hidden transition-all duration-300 shadow-[4px_4px_0px_0px_var(--color-border-dark)]"
              >
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

        <div className="mt-16 bg-white border-3 border-border-dark rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_var(--color-border-dark)] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-black text-blueberry uppercase block">
              HAVE A TECHNICAL QUESTION?
            </span>
            <p className="font-display font-black text-lg text-border-dark uppercase tracking-tight">
              Join our developer community
            </p>
          </div>
          <a
            href="https://x.com/suidevelopers"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 bg-blueberry text-white border-2 border-border-dark text-xs font-mono font-black rounded-xl hover:-translate-y-0.5 shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:shadow-none transition-all text-center uppercase"
          >
            Follow @suidevelopers
          </a>
        </div>

      </div>
    </section>
  );
}

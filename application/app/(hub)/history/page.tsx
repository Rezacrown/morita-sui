'use client';

import React from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { MOCK_TX_EVENTS } from '@/lib/mock-data';
import EmptyState from '@/components/shared/empty-state';
import { Sparkles, Tag, ArrowLeftRight, Package, CopyCheck, ExternalLink } from 'lucide-react';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  ItemMinted: <Sparkles className="w-4 h-4" />,
  ItemSold: <Tag className="w-4 h-4" />,
  EscrowFulfilled: <ArrowLeftRight className="w-4 h-4" />,
  EscrowCreated: <ArrowLeftRight className="w-4 h-4" />,
  ItemListed: <Tag className="w-4 h-4" />,
  ItemClaimed: <CopyCheck className="w-4 h-4" />,
  ItemBurned: <Package className="w-4 h-4" />,
};

function groupByDate(events: typeof MOCK_TX_EVENTS) {
  const groups: Record<string, typeof MOCK_TX_EVENTS> = {};
  events.forEach((e) => {
    const date = new Date(e.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(e);
  });
  return Object.entries(groups);
}

export default function HistoryPage() {
  const { isLoggedIn } = useAuthStore();

  if (!isLoggedIn) {
    return <EmptyState title="Connect Wallet" description="Connect your wallet to view your transaction history." action={{ label: 'Go to Landing', onClick: () => { window.location.href = '/'; } }} />;
  }

  const grouped = groupByDate(MOCK_TX_EVENTS);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">Transaction History</h1>
        <p className="font-sans text-sm text-[#1E2044]/60 mt-1">{MOCK_TX_EVENTS.length} total transactions</p>
      </div>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#1E2044]/10" />
        <div className="space-y-10">
          {grouped.map(([date, events]) => (
            <div key={date}>
              <h2 className="relative z-10 font-display font-black text-sm uppercase tracking-tight text-[#1E2044] mb-4 pl-12">{date}</h2>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="relative flex items-start gap-4 pl-12">
                    <div className="absolute left-0 w-10 h-10 rounded-full border-2 border-[#1E2044] bg-white flex items-center justify-center z-10 text-blueberry-dark">
                      {EVENT_ICONS[event.eventType] ?? <Package className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 bg-white border-3 border-[#1E2044] rounded-2xl p-4 shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-sans text-sm text-[#1E2044]">{event.description}</p>
                        <a href={`https://testnet.suivision.xyz/txblock/${event.txHash}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-blueberry hover:text-blueberry-dark transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 bg-blueberry-cream/50 px-2 py-0.5 rounded">{event.eventType}</span>
                        <span className="text-[10px] font-mono text-[#1E2044]/40">{new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

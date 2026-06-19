'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useMarketplaceStore } from '@/stores/marketplace-store';
import { MOCK_ESCROWS } from '@/lib/mock-data';
import ItemDetail from '@/components/shared/item-detail';
import StatusBadge from '@/components/shared/status-badge';
import ConfirmModal from '@/components/shared/confirm-modal';
import EmptyState from '@/components/shared/empty-state';

export default function BarterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn, suiAddress } = useAuthStore();
  const { escrows, setEscrows } = useMarketplaceStore();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'fulfill'>('cancel');

  useEffect(() => { if (escrows.length === 0) setEscrows(MOCK_ESCROWS); }, [escrows.length, setEscrows]);

  const escrowId = typeof params.id === 'string' ? params.id : '';
  const escrow = escrows.find((e) => e.id === escrowId);

  if (!escrow) {
    return <EmptyState title="Escrow Not Found" description="This barter escrow does not exist or may have been removed." action={{ label: 'Back to Marketplace', onClick: () => router.push('/marketplace') }} />;
  }

  const isOwner = isLoggedIn && suiAddress === escrow.initiator;
  const isActive = escrow.isActive;

  const handleCancel = () => { setConfirmAction('cancel'); setIsConfirmOpen(true); };
  const handleFulfill = () => { setConfirmAction('fulfill'); setIsConfirmOpen(true); };
  const confirmActionHandler = () => { console.log(`${confirmAction} escrow:`, escrow.id); setIsConfirmOpen(false); if (confirmAction === 'cancel') router.push('/marketplace'); };

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => router.push('/marketplace')} className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark mb-6 cursor-pointer">&larr; Back to Marketplace</button>
      <div className="flex items-center gap-3 mb-6">
        <StatusBadge status={isActive ? 'published' : 'paused'} />
        <span className="font-sans text-sm text-[#1E2044]/60">{isActive ? 'Active — Awaiting counterparty' : 'Completed or Cancelled'}</span>
      </div>
      <ItemDetail item={{ name: escrow.offeredItem.name, gameName: escrow.offeredItem.gameName, itemType: escrow.offeredItem.itemType, rarity: escrow.offeredItem.rarity, description: escrow.offeredItem.description, imageUrl: escrow.offeredItem.imageUrl, suiItemId: escrow.offeredItem.suiItemId, supply: escrow.offeredItem.supply, isNft: escrow.offeredItem.isNft, attributes: escrow.offeredItem.attributes }} className="mb-8" />
      <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] mb-8">
        <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">Barter Conditions</h2>
        <p className="font-sans text-sm text-[#1E2044]/60 mb-4"><span className="font-mono font-bold text-[#1E2044]">{escrow.initiatorName}</span> is looking for:</p>
        <div className="flex flex-wrap gap-3">
          {escrow.conditions.itemTypeAccept && <div className="px-4 py-2 bg-blueberry-cream border-2 border-blueberry/30 rounded-xl"><span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry-dark">Item Type: {escrow.conditions.itemTypeAccept}</span></div>}
          {escrow.conditions.rarityAccept && <div className="px-4 py-2 bg-blueberry-cream border-2 border-blueberry/30 rounded-xl"><span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry-dark">Rarity: {escrow.conditions.rarityAccept}</span></div>}
          {!escrow.conditions.itemTypeAccept && !escrow.conditions.rarityAccept && <span className="text-sm font-sans text-[#1E2044]/50">Open to any item</span>}
        </div>
      </div>
      {isActive && (
        <div className="flex gap-3">
          {isOwner ? (
            <button onClick={handleCancel} className="px-6 py-3 bg-white text-red-500 border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Cancel Escrow</button>
          ) : (
            isLoggedIn && <button onClick={handleFulfill} className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Fulfill Barter</button>
          )}
        </div>
      )}
      <ConfirmModal isOpen={isConfirmOpen} title={confirmAction === 'cancel' ? 'Cancel Escrow' : 'Fulfill Barter'} message={confirmAction === 'cancel' ? 'Are you sure you want to cancel this escrow? The offered item will be returned to your inventory.' : 'Confirm that you want to fulfill this barter with an item from your inventory.'} confirmLabel={confirmAction === 'cancel' ? 'Yes, Cancel' : 'Fulfill'} variant={confirmAction === 'cancel' ? 'danger' : 'default'} onConfirm={confirmActionHandler} onCancel={() => setIsConfirmOpen(false)} />
    </div>
  );
}

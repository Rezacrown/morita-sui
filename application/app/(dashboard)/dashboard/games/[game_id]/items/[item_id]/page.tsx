"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { detail as getItem, save, del as deleteItem } from "@/actions/item";
import ItemDetail from "@/components/shared/item-detail";
import StatusBadge from "@/components/shared/status-badge";
import EmptyState from "@/components/shared/empty-state";
import ConfirmModal from "@/components/shared/confirm-modal";
import { Plus, X } from "lucide-react";

import type { InferSelectModel } from "drizzle-orm";
import type { itemTemplates } from "@/lib/db/schema";
type ItemData = InferSelectModel<typeof itemTemplates>;

function ItemForm({
  existing,
  gameId,
  itemId,
}: {
  existing: ItemData;
  gameId: number;
  itemId?: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState(existing.name);
  const [itemType, setItemType] = useState(existing.itemType);
  const [rarity, setRarity] = useState(existing.rarity);
  const [description, setDescription] = useState(existing.description ?? "");
  const [isNft, setIsNft] = useState(existing.isNft);
  const [supply, setSupply] = useState(existing.supply);
  const [attrs, setAttrs] = useState<{ key: string; value: string }[]>(
    existing.attributes
      ? Object.entries(existing.attributes).map(([k, v]) => ({
          key: k,
          value: v,
        }))
      : [],
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () =>
      save(
        gameId,
        {
          name,
          itemType,
          rarity,
          description: description || undefined,
          isNft,
          supply,
          attributes: Object.fromEntries(
            attrs.filter((a) => a.key).map((a) => [a.key, a.value]),
          ),
        },
        itemId,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", gameId] });
      router.push(`/dashboard/games/${gameId}/items`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteItem(itemId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", gameId] });
      router.push(`/dashboard/games/${gameId}/items`);
    },
  });

  const isDraft = existing.status === "draft" || !itemId;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display font-black text-2xl uppercase tracking-tight text-[#1E2044]">
            {!itemId ? "Create Item" : existing.name}
          </h1>
          {itemId && <StatusBadge status={existing.status as 'draft' | 'published'} />}
        </div>
        <div className="flex gap-2">
          {!!itemId && isDraft && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-white text-red-500 border-2 border-red-300 font-display font-black rounded-lg text-xs uppercase hover:bg-red-50 transition-all cursor-pointer"
            >
              Delete Draft
            </button>
          )}
          <button
            onClick={() => router.push(`/dashboard/games/${gameId}/items`)}
            className="px-4 py-2 bg-white border-2 border-[#1E2044] font-display font-black rounded-lg text-xs uppercase hover:bg-blueberry-cream transition-all cursor-pointer"
          >
            Back
          </button>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">
                Item Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Legendary Sword"
                className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">
                Item Type
              </label>
              <input
                type="text"
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                placeholder="e.g. Weapon, Armor"
                className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">
              Rarity
            </label>
            <input
              type="text"
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
              placeholder="e.g. Legendary, Rare"
              className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none resize-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">
                Supply Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsNft(true);
                    setSupply(1);
                  }}
                  className={`px-4 py-2 border-2 rounded-lg text-xs font-display font-black uppercase transition-all cursor-pointer ${isNft ? "bg-blueberry text-white border-[#1E2044]" : "bg-white text-[#1E2044] border-[#1E2044]/30"}`}
                >
                  NFT
                </button>
                <button
                  onClick={() => setIsNft(false)}
                  className={`px-4 py-2 border-2 rounded-lg text-xs font-display font-black uppercase transition-all cursor-pointer ${!isNft ? "bg-blueberry text-white border-[#1E2044]" : "bg-white text-[#1E2044] border-[#1E2044]/30"}`}
                >
                  Fungible
                </button>
              </div>
            </div>
            {!isNft && (
              <div>
                <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">
                  Supply
                </label>
                <input
                  type="number"
                  value={supply}
                  onChange={(e) =>
                    setSupply(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  min={1}
                  className="w-24 bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-2">
              Attributes
            </label>
            {attrs.map((a, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={a.key}
                  onChange={(e) => {
                    const n = [...attrs];
                    n[i].key = e.target.value;
                    setAttrs(n);
                  }}
                  placeholder="Key"
                  className="flex-1 bg-blueberry-cream/10 text-sm px-3 py-2 border-2 border-[#1E2044] rounded-lg focus:outline-none"
                />
                <input
                  type="text"
                  value={a.value}
                  onChange={(e) => {
                    const n = [...attrs];
                    n[i].value = e.target.value;
                    setAttrs(n);
                  }}
                  placeholder="Value"
                  className="flex-1 bg-blueberry-cream/10 text-sm px-3 py-2 border-2 border-[#1E2044] rounded-lg focus:outline-none"
                />
                <button
                  onClick={() => setAttrs(attrs.filter((_, j) => j !== i))}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setAttrs([...attrs, { key: "", value: "" }])}
              className="flex items-center gap-1.5 text-xs font-mono font-extrabold uppercase text-blueberry hover:text-blueberry-dark transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Attribute
            </button>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => router.push(`/dashboard/games/${gameId}/items`)}
              className="px-5 py-2.5 bg-white text-[#1E2044] border-2 border-[#1E2044] font-mono font-black rounded-lg text-xs uppercase hover:bg-blueberry-cream transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={
                !name.trim() ||
                !itemType.trim() ||
                !rarity.trim() ||
                saveMutation.isPending
              }
              className="px-6 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-xs cursor-pointer disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={true}
          title="Delete Draft"
          message="This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

export default function ItemDetailOrEditPage() {
  const params = useParams();
  const router = useRouter();
  const gameId =
    typeof params.game_id === "string" ? parseInt(params.game_id, 10) : 0;
  const itemId =
    typeof params.item_id === "string" ? parseInt(params.item_id, 10) : 0;
  const isNew = params.item_id === "new";

  const { data: existing, isLoading } = useQuery({
    queryKey: ["item", itemId],
    queryFn: () => getItem(itemId),
    enabled: !isNew && !!itemId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blueberry border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!existing && !isNew) {
    return (
      <EmptyState
        title="Item Not Found"
        description="This item doesn't exist."
        action={{
          label: "Back to Items",
          onClick: () => router.push(`/dashboard/games/${gameId}/items`),
        }}
      />
    );
  }

  const displayItem = existing ?? {
    id: 0,
    gameId: 0,
    suiItemId: null,
    name: "",
    itemType: "",
    rarity: "",
    description: null,
    imageBlobId: null,
    metadataBlobId: null,
    supply: 1,
    isNft: true,
    attributes: null,
    status: "draft" as const,
    createdAt: new Date(),
  };

  if (!isNew && existing) {
    return (
      <ItemForm
        key={existing.id}
        existing={existing}
        gameId={gameId}
        itemId={itemId}
      />
    );
  }

  return <ItemForm key="new" existing={displayItem} gameId={gameId} />;
}

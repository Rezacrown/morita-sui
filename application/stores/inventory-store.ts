import { create } from "zustand";

type InventoryItem = {
  id: string;
  suiItemId: string;
  gameId: number;
  gameName: string;
  name: string;
  itemType: string;
  rarity: string;
  description: string;
  imageUrl: string | null;
  blobId: string;
  supply: number | null;
  isNft: boolean;
  attributes: Record<string, string>;
  status: "published";
  owner: string | null;
  createdAt: string;
};

interface InventoryState {
  items: InventoryItem[];
  setItems: (items: InventoryItem[]) => void;
  removeItem: (id: string) => void;
  getItemById: (id: string) => InventoryItem | undefined;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  setItems: (items) => set({ items }),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  getItemById: (id) => get().items.find((i) => i.id === id),
}));

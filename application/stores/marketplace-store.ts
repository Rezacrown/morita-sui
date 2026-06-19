import { create } from "zustand";

type Listing = {
  id: string;
  item: any;
  price: number;
  seller: string;
  sellerName: string;
  listingType: "sale";
  royaltyBps: number | null;
  createdAt: string;
};

type Escrow = {
  id: string;
  offeredItem: any;
  initiator: string;
  initiatorName: string;
  conditions: {
    itemTypeAccept: string | null;
    rarityAccept: string | null;
    gameIdAccept: number | null;
    itemIdTarget: string | null;
  };
  counterparty: string | null;
  isActive: boolean;
  createdAt: string;
};

interface MarketplaceState {
  listings: Listing[];
  escrows: Escrow[];
  setListings: (listings: Listing[]) => void;
  setEscrows: (escrows: Escrow[]) => void;
  filterType: "all" | "sale" | "barter";
  setFilterType: (t: "all" | "sale" | "barter") => void;
  filterGame: string | null;
  setFilterGame: (g: string | null) => void;
  filterRarity: string | null;
  setFilterRarity: (r: string | null) => void;
  sortBy: "newest" | "price_asc" | "price_desc";
  setSortBy: (s: "newest" | "price_asc" | "price_desc") => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  listings: [],
  escrows: [],
  setListings: (listings) => set({ listings }),
  setEscrows: (escrows) => set({ escrows }),
  filterType: "all",
  setFilterType: (filterType) => set({ filterType }),
  filterGame: null,
  setFilterGame: (filterGame) => set({ filterGame }),
  filterRarity: null,
  setFilterRarity: (filterRarity) => set({ filterRarity }),
  sortBy: "newest",
  setSortBy: (sortBy) => set({ sortBy }),
}));

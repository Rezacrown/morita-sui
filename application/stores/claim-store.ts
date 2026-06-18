import { create } from "zustand";

type ClaimState = "idle" | "loading" | "success" | "error";

interface ClaimStore {
  state: ClaimState;
  errorMessage: string | null;
  claimedItem: any | null;
  claim: () => void;
  reset: () => void;
}

export const useClaimStore = create<ClaimStore>((set) => ({
  state: "idle",
  errorMessage: null,
  claimedItem: null,
  claim: () => {
    set({ state: "loading" });
    setTimeout(() => {
      set({ state: "success", claimedItem: { name: "Legendary Void Sword", gameName: "Astral Quest RPG" } });
    }, 2000);
  },
  reset: () => set({ state: "idle", errorMessage: null, claimedItem: null }),
}));

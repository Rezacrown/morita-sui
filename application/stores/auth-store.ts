import { create } from "zustand";

type UserMode = "gamer" | "dev" | null;

interface AuthState {
  isLoggedIn: boolean;
  userMode: UserMode;
  suiAddress: string | null;
  displayName: string | null;
  activePublisherId: string | null;
  login: (mode: UserMode) => void;
  logout: () => void;
  setActivePublisher: (id: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  userMode: null,
  suiAddress: null,
  displayName: null,
  activePublisherId: null,
  login: (mode) =>
    set({
      isLoggedIn: true,
      userMode: mode,
      suiAddress: mode === "gamer" ? "0xabc123...def" : "0xdev001...aaa",
      displayName: mode === "gamer" ? "CryptoGamer99" : "IndieQuest Dev",
      activePublisherId: mode === "dev" ? "pub-001" : null,
    }),
  logout: () =>
    set({
      isLoggedIn: false,
      userMode: null,
      suiAddress: null,
      displayName: null,
      activePublisherId: null,
    }),
  setActivePublisher: (id) => set({ activePublisherId: id }),
}));

import { create } from "zustand";

interface AuthState {
  isLoggedIn: boolean;
  isDevMode: boolean;
  suiAddress: string | null;
  displayName: string | null;
  activePublisherId: string | null;
  login: (name: string) => void;
  logout: () => void;
  enterDevMode: () => void;
  exitDevMode: () => void;
  setActivePublisher: (id: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  isDevMode: false,
  suiAddress: null,
  displayName: null,
  activePublisherId: null,
  login: (name) =>
    set({
      isLoggedIn: true,
      isDevMode: false,
      suiAddress: "0xabc123...def",
      displayName: name || "CryptoGamer99",
      activePublisherId: "pub-001",
    }),
  logout: () =>
    set({
      isLoggedIn: false,
      isDevMode: false,
      suiAddress: null,
      displayName: null,
      activePublisherId: null,
    }),
  enterDevMode: () => set({ isDevMode: true }),
  exitDevMode: () => set({ isDevMode: false }),
  setActivePublisher: (id) => set({ activePublisherId: id }),
}));

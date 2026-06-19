import { create } from "zustand";

interface AuthState {
  isLoggedIn: boolean;
  hasSetWorkspace: boolean;
  workspaceName: string;
  suiAddress: string | null;
  displayName: string | null;
  login: (name: string) => void;
  logout: () => void;
  setWorkspace: (name: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  hasSetWorkspace: false,
  workspaceName: "My Workspace",
  suiAddress: null,
  displayName: null,
  login: (name) =>
    set({
      isLoggedIn: true,
      suiAddress: "0xabc123...def",
      displayName: name || "CryptoGamer99",
    }),
  logout: () =>
    set({
      isLoggedIn: false,
      hasSetWorkspace: false,
      suiAddress: null,
      displayName: null,
      workspaceName: "My Workspace",
    }),
  setWorkspace: (name) => set({ workspaceName: name, hasSetWorkspace: true }),
}));

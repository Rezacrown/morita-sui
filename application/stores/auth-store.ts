import { create } from "zustand";

interface AccountInfo {
  suiAddress: string;
  displayName: string;
}

interface AuthState {
  isLoggedIn: boolean;
  hasSetWorkspace: boolean;
  workspaceName: string;
  suiAddress: string | null;
  displayName: string | null;
  login: (name: string) => void;
  logout: () => void;
  setWorkspace: (name: string) => void;
  setAccount: (info: AccountInfo | null) => void;
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
      displayName: name || "Gamer",
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
  setAccount: (info) =>
    set({
      isLoggedIn: !!info,
      suiAddress: info?.suiAddress ?? null,
      displayName: info?.displayName ?? null,
    }),
}));

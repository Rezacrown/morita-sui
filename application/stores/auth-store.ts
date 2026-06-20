import { create } from "zustand";

export interface AccountInfo {
  suiAddress: string;
  displayName: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  suiAddress: string | null;
  displayName: string | null;
  logout: () => void;
  setAccount: (info: AccountInfo | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  suiAddress: null,
  displayName: null,
  logout: () =>
    set({
      isLoggedIn: false,
      suiAddress: null,
      displayName: null,
    }),
  setAccount: (info) =>
    set({
      isLoggedIn: !!info,
      suiAddress: info?.suiAddress ?? null,
      displayName: info?.displayName ?? null,
    }),
}));

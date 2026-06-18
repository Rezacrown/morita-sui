import { create } from "zustand";

interface PublisherState {
  isPublishing: boolean;
  publishProgress: { step: string; done: boolean }[];
  setPublishing: (v: boolean) => void;
  setProgress: (steps: { step: string; done: boolean }[]) => void;
}

export const usePublisherStore = create<PublisherState>((set) => ({
  isPublishing: false,
  publishProgress: [],
  setPublishing: (isPublishing) => set({ isPublishing }),
  setProgress: (publishProgress) => set({ publishProgress }),
}));

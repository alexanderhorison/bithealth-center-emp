import { create } from 'zustand';

type PresenceFilterStore = {
  date: string;
  setDate: (date: string) => void;
};

export const usePresenceFilterStore = create<PresenceFilterStore>((set) => ({
  date: '',
  setDate: (date) => set({ date })
}));

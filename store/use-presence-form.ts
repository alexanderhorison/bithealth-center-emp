import { create } from 'zustand';

import type { SubmitPresenceInput } from '@/lib/validations/presence';

type PresenceFormStore = {
  status: SubmitPresenceInput['status'];
  setStatus: (status: SubmitPresenceInput['status']) => void;
};

export const usePresenceFormStore = create<PresenceFormStore>((set) => ({
  status: 'PRESENT',
  setStatus: (status) => set({ status })
}));

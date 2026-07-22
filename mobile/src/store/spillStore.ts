import { create } from 'zustand';

// In-memory only, like guideChatStore — a Spill session doesn't need to
// survive an app restart, just the trip from the writing screen to the
// reveal screen (and, optionally, on into the guide chat).
interface SpillStore {
  text: string;
  setText: (text: string) => void;
  reset: () => void;
}

export const useSpillStore = create<SpillStore>((set) => ({
  text: '',
  setText: (text) => set({ text }),
  reset: () => set({ text: '' }),
}));

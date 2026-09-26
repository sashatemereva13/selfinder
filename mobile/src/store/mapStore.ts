import { create } from 'zustand';
import { makeMutable } from 'react-native-reanimated';

// Whether the expanded map (MapOverlay) is open — opened from the minimap
// (MapBar, inside the tabs), drawn from the root layout so it covers the
// whole screen, tab bar included. Its own store because those two live in
// different parts of the tree (RULES.md: cross-screen state gets its own
// store rather than threaded props). In-memory only: the map is never open
// on a cold start.
//
// `peeking` — the map is being dragged up from the minimap but not yet
// committed open: MapOverlay mounts its content so it can follow the
// finger, but doesn't take touches yet.
//
// `closing` — set in the same update that closes the map, so MapOverlay
// keeps its content mounted through the fade-out. It used to be set by
// MapOverlay in an effect after the fact, which left one render with the
// map neither open nor closing: it unmounted for a frame (a blink), then
// remounted fresh and faded — "closes, blinks, then closes".
interface MapStore {
  open: boolean;
  peeking: boolean;
  closing: boolean;
  openMap: () => void;
  closeMap: () => void;
  setPeeking: (peeking: boolean) => void;
  finishClosing: () => void;
}

export const useMapStore = create<MapStore>((set, get) => ({
  open: false,
  peeking: false,
  closing: false,
  openMap: () => set({ open: true, peeking: false, closing: false }),
  closeMap: () => {
    const { open, peeking } = get();
    set({ open: false, peeking: false, closing: open || peeking });
  },
  setPeeking: (peeking) => set({ peeking }),
  finishClosing: () => set({ closing: false }),
}));

// How far open the map is, 0 → 1 — one value on the UI thread shared by
// the minimap's drag (which moves it with the finger) and MapOverlay
// (which draws from it), so dragging up and tapping "the map" are the same
// motion, just driven differently.
export const mapProgress = makeMutable(0);

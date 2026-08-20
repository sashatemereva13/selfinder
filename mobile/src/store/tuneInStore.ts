import { create } from 'zustand';
import type { AudioPlayer } from 'expo-audio';

// Playback state lives here, separate from the three native AudioPlayer
// instances themselves (created once by TuneInAudioController, mounted in
// _layout.tsx, and registered into `players` below) — a screen-local
// useAudioPlayer used to mean navigating away from Tune In (e.g. tapping
// "Back" to Depths) unmounted the component, which released the native
// players and silently killed audio, even while the app stayed open/
// backgrounded. That contradicted the whole point of Sleep/Deep Rest as a
// sleep aid (see tunein/index.tsx's own comments on shouldPlayInBackground)
// — starting playback then checking another screen before locking the
// phone is normal behavior, not a reason to cut audio.
//
// `players` is a plain module-level array, not store state — AudioPlayer
// instances are native shared objects created by the useAudioPlayer hook,
// which can only run inside a mounted component (the controller), not
// inside a Zustand store. The controller registers them once on mount via
// registerPlayers(); actions below read from this array imperatively, the
// same way the screen used to call methods straight on its own local
// `players`.
export let players: AudioPlayer[] = [];
export function registerPlayers(p: AudioPlayer[]) {
  players = p;
}

export const VOLUME_STEPS = [0.1, 0.2, 0.3, 0.4, 0.5];
export const TIMER_OPTIONS = [5, 15, 30, 45, 60];
export const FADE_SECONDS = 15;

interface TuneInStore {
  selected: number;
  isPlaying: boolean;
  volume: number;
  timerMinutes: number | null;
  remainingSeconds: number | null;
  setSelected: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setTimerMinutes: (minutes: number | null) => void;
  setRemainingSeconds: (updater: number | null | ((s: number | null) => number | null)) => void;
}

export const useTuneInStore = create<TuneInStore>((set) => ({
  selected: 0,
  isPlaying: false,
  volume: 0.3,
  // Defaults to the first timer option (5m) rather than "no timer" — the
  // lock screen's Now Playing progress bar reflects the actual looped
  // audio sample's own ~1s length, not the sleep timer, since expo-audio
  // has no way to override that from JS; always having a real timer
  // selected at least means the in-app countdown always shows a concrete,
  // sensible duration instead of implying "plays forever" by default.
  timerMinutes: TIMER_OPTIONS[0],
  remainingSeconds: null,

  setSelected: (selected) => set({ selected }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setTimerMinutes: (timerMinutes) => set({ timerMinutes }),
  setRemainingSeconds: (updater) =>
    set((s) => ({
      remainingSeconds: typeof updater === 'function' ? updater(s.remainingSeconds) : updater,
    })),
}));

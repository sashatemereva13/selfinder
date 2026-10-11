import { useEffect, useRef } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { ShiftDoor } from '../../content/shiftContent';
import type { Stage } from '../../content/shiftSession';
import { players as tuneInPlayers, useTuneInStore } from '../../store/tuneInStore';

// The music under a Shift session (2026-10-09) — three looping layers per
// door, faded in and out as the session moves through its stages. Drafts,
// synthesised by scripts/make-shift-sounds.py, to be replaced by recorded
// music in the same shape later.
//
// Shift toward love — "Warm swell", D♭ major: a pad that swells with the
// breath (in time with the light: both start at 0 and turn every 5 s); a
// higher voice joins as warmth is found, a faint shimmer as it widens; at
// the end only the pad remains.
// Use it — "Ground", D, root and fifth only: no third, so the music is
// neither happy nor sad and never tells anyone how to feel. A slow pulse
// while the state is felt; a rising figure while it finds somewhere to go.

const SOURCES: Record<ShiftDoor, [number, number, number]> = {
  love: [
    require('../../../assets/audio/shift/love-base.m4a'),
    require('../../../assets/audio/shift/love-warmth.m4a'),
    require('../../../assets/audio/shift/love-widen.m4a'),
  ],
  use: [
    require('../../../assets/audio/shift/use-ground.m4a'),
    require('../../../assets/audio/shift/use-pulse.m4a'),
    require('../../../assets/audio/shift/use-rise.m4a'),
  ],
};

// Each layer's volume by stage, [base, second, third].
const MIX: Record<ShiftDoor, Partial<Record<Stage, [number, number, number]>>> = {
  love: {
    arrive: [1, 0, 0],
    meet: [1, 0, 0],
    warmth: [1, 0.9, 0],
    gratitude: [1, 0.9, 0],
    widen: [1, 0.9, 0.8],
    act: [1, 0.8, 0.7],
    return: [0.8, 0.3, 0],
    closing: [0.6, 0, 0],
  },
  use: {
    arrive: [1, 0, 0],
    meet: [1, 0.7, 0],
    whatFor: [1, 0.5, 0],
    where: [1, 0.4, 0.9],
    return: [0.8, 0, 0],
    closing: [0.6, 0, 0],
  },
};

const FADE_MS = 3000;
const TICK_MS = 100;

export function SessionSound({ door, stage }: { door: ShiftDoor; stage: Stage }) {
  const players = [
    useAudioPlayer(SOURCES[door][0]),
    useAudioPlayer(SOURCES[door][1]),
    useAudioPlayer(SOURCES[door][2]),
  ];
  const levels = useRef<[number, number, number]>([0, 0, 0]);

  // Start all three together, silent, so they stay in step with each other
  // (and the base with the light); the mix below brings them in.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' });
    // Tune In playing in the background would sit on top of the session.
    if (useTuneInStore.getState().isPlaying) {
      tuneInPlayers.forEach((p) => p.pause());
      useTuneInStore.getState().setIsPlaying(false);
    }
    players.forEach((p) => {
      p.loop = true;
      p.volume = 0;
      p.play();
    });
    // useAudioPlayer releases its own player on unmount, and its cleanup
    // runs before this one — so by now a player may already be gone, and
    // pausing it throws ("calling pause function has failed"). Releasing
    // stops the sound anyway; this only covers a player still alive.
    return () =>
      players.forEach((p) => {
        try {
          p.pause();
        } catch {
          // Already released.
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fade each layer toward this stage's level.
  useEffect(() => {
    const target = MIX[door][stage] ?? levels.current;
    const start = [...levels.current];
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += TICK_MS;
      const k = Math.min(1, elapsed / FADE_MS);
      const eased = k * k * (3 - 2 * k);
      players.forEach((p, i) => {
        const v = start[i] + (target[i] - start[i]) * eased;
        levels.current[i] = v;
        try {
          p.volume = v;
        } catch {
          // Released mid-fade (leaving the session).
        }
      });
      if (k >= 1) clearInterval(timer);
    }, TICK_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  return null;
}

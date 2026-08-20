import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { Asset } from 'expo-asset';
import { TUNE_IN_STATES } from '../content/tuneInStates';
import { track } from '../utils/analytics';
import { FADE_SECONDS, registerPlayers, useTuneInStore } from '../store/tuneInStore';

// Lock-screen Now Playing artwork — iOS-only; see tunein/index.tsx's
// original comment (this file inherited it verbatim) for why Android never
// attempts this (a native crash in expo-asset's Android asset resolution).
export const tuneInArtworkReady =
  Platform.OS === 'ios'
    ? Asset.fromModule(require('../../assets/tunein-artwork.png')).downloadAsync()
    : null;

// Owns the three native AudioPlayer instances at the app root, mounted once
// in _layout.tsx, so they survive in-app navigation. Previously these lived
// in useAudioPlayer calls inside TuneInScreen itself — expo-audio's
// useReleasingSharedObject releases (stops) a player the moment its owning
// component unmounts, so tapping "Back" to Depths silently killed Tune In
// audio even though the app was still open, contradicting the sleep-aid
// intent (Sleep/Deep Rest are meant to keep playing after the screen locks,
// let alone after an in-app back-tap). Mounting the players here instead
// means they only get released when the whole app unmounts.
export function TuneInAudioController() {
  const selected = useTuneInStore((s) => s.selected);
  const isPlaying = useTuneInStore((s) => s.isPlaying);
  const volume = useTuneInStore((s) => s.volume);
  const remainingSeconds = useTuneInStore((s) => s.remainingSeconds);
  const setIsPlaying = useTuneInStore((s) => s.setIsPlaying);
  const setRemainingSeconds = useTuneInStore((s) => s.setRemainingSeconds);

  const players = [
    useAudioPlayer(TUNE_IN_STATES[0].asset),
    useAudioPlayer(TUNE_IN_STATES[1].asset),
    useAudioPlayer(TUNE_IN_STATES[2].asset),
  ];

  const statuses = [
    useAudioPlayerStatus(players[0]),
    useAudioPlayerStatus(players[1]),
    useAudioPlayerStatus(players[2]),
  ];

  useEffect(() => {
    registerPlayers(players);
  });

  // Syncs isPlaying down from the selected player's real native state —
  // catches the case where playback was paused via the lock screen's own
  // remote controls (an entirely native path that never touches store
  // state directly) so the app shows "Play" instead of a stale "Stop" for
  // audio that has actually already paused.
  useEffect(() => {
    setIsPlaying(statuses[selected].playing);
  }, [statuses[selected].playing, selected]);

  // shouldPlayInBackground + doNotMix keep a tune sounding after the screen
  // locks — deliberately available to every user, not gated behind
  // Selfinder+: several states are explicitly built for falling asleep
  // (see Sleep/Deep Rest's intent copy), and a sleep aid that stops the
  // moment the screen locks doesn't do its job.
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  }, []);

  useEffect(() => {
    players.forEach((player) => {
      player.loop = true;
      player.volume = volume;
    });
  }, [volume]);

  // Counts down once a timer is set, fading the active player's volume over
  // the final FADE_SECONDS rather than cutting it off, then stops playback.
  // Runs here (not the screen) so the countdown keeps ticking and still
  // stops playback correctly even if the user has navigated away from Tune
  // In while a timer is running.
  useEffect(() => {
    if (remainingSeconds === null || !isPlaying) return;
    if (remainingSeconds <= 0) {
      players[selected].pause();
      players[selected].setActiveForLockScreen(false);
      setIsPlaying(false);
      players.forEach((player) => { player.volume = volume; });
      setRemainingSeconds(null);
      track('tune_in_stopped', { state: TUNE_IN_STATES[selected].name, reason: 'timer' });
      return;
    }
    if (remainingSeconds <= FADE_SECONDS) {
      players[selected].volume = volume * (remainingSeconds / FADE_SECONDS);
    }
    const id = setTimeout(() => setRemainingSeconds((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [remainingSeconds, isPlaying]);

  return null;
}

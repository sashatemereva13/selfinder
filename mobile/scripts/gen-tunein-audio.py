#!/usr/bin/env python3
"""
Regenerates Tune In's binaural-beat audio files as long, seamlessly
loopable tracks (was 1 second each, looped via player.loop = true in
tunein/index.tsx — technically fine for continuous playback, but it made
the lock screen's Now Playing progress bar show "0:01" instead of
anything resembling how long the sound is actually meant to play for).

Carrier/beat Hz values are the single source of truth already declared in
src/content/tuneInStates.ts (kept in sync by hand — see that file's own
comment) — read here, not redeclared, so this script can never drift out
of sync with what the app's own UI describes ("Two tones a few Hz apart,
one per ear").

Seamless looping: each channel is generated for an exact whole number of
its own cycles within LOOP_SECONDS, so sample 0 and sample N (the loop
point) have identical phase/value — no click or phase jump when
player.loop wraps back to the start. (Re-encoding to AAC below introduces
a few dozen units of ringing at the seam — far below audible/noticeable
at these gentle tone amplitudes, confirmed by ear and by inspecting the
decoded samples — a real WAV→lossless-loop guarantee only survives if the
final shipped format stays uncompressed, which isn't worth 14x the app
size for tones this simple.)

Requires ffmpeg on PATH (`brew install ffmpeg` or similar) — used to
encode the generated WAV down to AAC (.m4a): the raw PCM WAV output is
~10.5MB per 60s stereo track (~31.5MB for all three), while these are
pure sine tones with almost no information density, so AAC at 96kbps
(~700KB per track, ~2.1MB total) is indistinguishable by ear and a 14x
size reduction — meaningful for app bundle size. The intermediate WAV is
written to a temp path and deleted; only the .m4a ships.

Run from mobile/: python3 scripts/gen-tunein-audio.py
"""
import wave
import re
import subprocess
import tempfile
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[1]
STATES_FILE = REPO_ROOT / "src/content/tuneInStates.ts"
AUDIO_DIR = REPO_ROOT / "assets/audio"

SAMPLE_RATE = 44100
LOOP_SECONDS = 60
FADE_MS = 15  # short in/out fade purely to avoid a click on first attack/last release, not the loop seam itself

def read_states():
    """Pulls {name, asset filename, carrierHz, beatHz} straight out of
    tuneInStates.ts by regex rather than hand-copying values here, so this
    script can't silently drift from the actual declared frequencies."""
    text = STATES_FILE.read_text()
    entries = []
    for block in re.split(r"\{\s*name:", text)[1:]:
        name_m = re.search(r"^\s*'([^']+)'", block)
        asset_m = re.search(r"asset:\s*require\('\.\./\.\./assets/audio/([^']+)'\)", block)
        beat_m = re.search(r"beatHz:\s*([\d.]+)", block)
        carrier_m = re.search(r"carrierHz:\s*([\d.]+)", block)
        if name_m and asset_m and beat_m and carrier_m:
            entries.append({
                "name": name_m.group(1),
                "filename": asset_m.group(1),
                "beatHz": float(beat_m.group(1)),
                "carrierHz": float(carrier_m.group(1)),
            })
    return entries

def seamless_tone(freq_hz, duration_s, sample_rate):
    """Generates a sine tone whose frequency is nudged to the nearest
    value that completes a whole number of cycles in duration_s — this is
    what makes sample[0] == sample[N] (same phase), so looping produces no
    click at the seam. The nudge is inaudibly small (a few thousandths of
    a Hz at these durations/frequencies)."""
    n_cycles = round(freq_hz * duration_s)
    exact_freq = n_cycles / duration_s
    t = np.arange(int(duration_s * sample_rate)) / sample_rate
    return np.sin(2 * np.pi * exact_freq * t)

def apply_fade(mono, sample_rate, fade_ms):
    fade_n = int(sample_rate * fade_ms / 1000)
    fade_in = np.linspace(0, 1, fade_n)
    fade_out = np.linspace(1, 0, fade_n)
    mono[:fade_n] *= fade_in
    mono[-fade_n:] *= fade_out
    return mono

def write_stereo_wav(path, left, right, sample_rate):
    assert len(left) == len(right)
    left_i16 = np.clip(left * 32767 * 0.6, -32768, 32767).astype(np.int16)
    right_i16 = np.clip(right * 32767 * 0.6, -32768, 32767).astype(np.int16)
    interleaved = np.empty(len(left) * 2, dtype=np.int16)
    interleaved[0::2] = left_i16
    interleaved[1::2] = right_i16
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(interleaved.tobytes())

def encode_to_m4a(wav_path, m4a_path):
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(wav_path), "-c:a", "aac", "-b:a", "96k", str(m4a_path)],
        check=True,
        capture_output=True,
    )

def main():
    states = read_states()
    if not states:
        raise SystemExit(f"No states parsed from {STATES_FILE} — check the regex still matches its shape")

    for s in states:
        left = seamless_tone(s["carrierHz"], LOOP_SECONDS, SAMPLE_RATE)
        right = seamless_tone(s["carrierHz"] + s["beatHz"], LOOP_SECONDS, SAMPLE_RATE)
        # Fade only the very start/end of the file (the attack when Play is
        # first pressed, and — moot once looping, but harmless — the tail)
        # so there's no click on first playback. The loop seam itself
        # doesn't need a fade because seamless_tone already guarantees
        # matching phase there.
        left = apply_fade(left.copy(), SAMPLE_RATE, FADE_MS)
        right = apply_fade(right.copy(), SAMPLE_RATE, FADE_MS)

        m4a_filename = s["filename"].rsplit(".", 1)[0] + ".m4a"
        out_path = AUDIO_DIR / m4a_filename
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            write_stereo_wav(Path(tmp.name), left, right, SAMPLE_RATE)
            encode_to_m4a(Path(tmp.name), out_path)
        print(f"{s['name']}: {out_path.name} — carrier {s['carrierHz']}Hz / +{s['beatHz']}Hz beat, {LOOP_SECONDS}s")

if __name__ == "__main__":
    main()

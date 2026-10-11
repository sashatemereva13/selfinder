# Draft session sounds for Shift (docs/shift-concept.md). Additive synthesis
# in ffmpeg: every stem loops seamlessly at LOOP seconds (all frequencies
# complete whole cycles; envelopes repeat every 10 s = one breath).
import subprocess, math, os
LOOP = 40
OUT = '/Users/13xsasha/Desktop/selfinder-web/mobile/assets/audio/shift'
os.makedirs(OUT, exist_ok=True)

def q(f):  # whole cycles per loop
    return round(f * LOOP) / LOOP

PI2 = '2*PI'
def tone(f, detune=0.0, h2=0.3, h3=0.1):
    f = q(f + detune)
    return f"(sin({PI2}*{f}*t)+{h2}*sin({PI2}*{q(2*f)}*t)+{h3}*sin({PI2}*{q(3*f)}*t))"

# breath: 0 at t=0, 1 at 5 s, 0 at 10 s — same as the light
BREATH = f"(0.5-0.5*cos({PI2}*t/10))"

def stem(name, left, right, gain, post=''):
    expr_l = f"{gain}*({left})"
    expr_r = f"{gain}*({right})"
    tmp = f"{name}_raw.wav"
    # three loops, keep the middle one: the reverb tail is then periodic
    subprocess.run(['ffmpeg','-y','-loglevel','error','-f','lavfi','-i',
        f"aevalsrc=exprs='{expr_l}|{expr_r}':s=44100:d={LOOP*3}",
        '-af', f"lowpass=f=2600,aecho=0.8:0.82:70|130|270|530:0.35|0.28|0.2|0.14{post}",
        tmp], check=True)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',str(LOOP),'-t',str(LOOP),'-i',tmp,
        '-c:a','aac','-b:a','160k',f"{OUT}/{name}.m4a"], check=True)
    os.remove(tmp)

def chord(freqs, weights, detune):
    return '+'.join(f"{w}*{tone(f, detune)}" for f, w in zip(freqs, weights))

# --- Shift toward love: "Warm swell", D-flat major ----------------------
Db2, Db3, Ab3, F4, Ab4, Db5, F5, Ab5 = 69.30, 138.59, 207.65, 349.23, 415.30, 554.37, 698.46, 830.61
base = [Db2, Db3, Ab3, F4]; bw = [0.5, 0.6, 0.45, 0.3]
swell = f"(0.45+0.55*{BREATH})"
stem('love-base', f"{swell}*({chord(base,bw,0)})", f"{swell}*({chord(base,bw,0.1)})", 0.22)
# warmth: a higher voice, swelling with the breath
warm = [Ab4, Db5]; ww = [0.5, 0.35]
stem('love-warmth', f"{swell}*({chord(warm,ww,0)})", f"{swell}*({chord(warm,ww,0.125)})", 0.18)
# widen: a faint shimmer, slowly turning between the ears
sh = [F5, Ab5]; sw = [0.4, 0.3]
stem('love-widen', f"(0.6+0.4*sin({PI2}*t/20))*({chord(sh,sw,0)})",
     f"(0.6+0.4*cos({PI2}*t/20))*({chord(sh,sw,0.1)})", 0.16)

# --- Use it: "Ground", D, root and fifth only (no third) ----------------
D2, A2, D3, A3 = 73.42, 110.0, 146.83, 220.0
g = [D2, A2, D3, A3]; gw = [0.6, 0.45, 0.4, 0.25]
gswell = f"(0.75+0.25*{BREATH})"
stem('use-ground', f"{gswell}*({chord(g,gw,0)})", f"{gswell}*({chord(g,gw,0.1)})", 0.24)
# pulse: a soft low beat, a little under 60 a minute — felt more than heard
pulse = f"(exp(-mod(t,1.25)*7)*sin({PI2}*{q(55)}*t))"
stem('use-pulse', pulse, pulse, 0.5)
# rise: D4 then A4, once a breath — energy with somewhere to go
D4, A4 = 293.66, 440.0
env1 = "(gt(mod(t,10),0.5)*lt(mod(t,10),4.5)*sin(PI*(mod(t,10)-0.5)/4))"
env2 = "(gt(mod(t,10),4.5)*lt(mod(t,10),9.5)*sin(PI*(mod(t,10)-4.5)/5))"
rise = f"({env1}*{tone(D4)}+{env2}*{tone(A4)})"
stem('use-rise', rise, f"({env1}*{tone(D4,0.1)}+{env2}*{tone(A4,0.1)})", 0.14)
print('ok')

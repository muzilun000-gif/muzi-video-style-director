"""代码合成音效库 + 混音器。不下载任何素材，只依赖 numpy 和 ffmpeg。

来自《哑键》项目：雨、木头闷响、铃、快门、脚步、纸张、铅笔、风声、倒带……
音效整体压在歌声下面（约 -14 dB），混完做软限幅，防止削波。

用法:
  python sfx_synth.py --preview out/sfx_preview.wav            # 把每种音效依次排一遍试听
  python sfx_synth.py --song song.mp3 --cues cues.json --out build/mix.wav
cues.json 格式: [{"t": 2.7, "kind": "thud", "vol": 0.35, "args": {}}, {"t": 0, "kind": "rain", "vol": 0.1, "args": {"dur": 6.2}}]
"""
import argparse
import json
import subprocess
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(42)


def n_of(dur):
    return int(round(dur * SR))          # 统一用 round，避免两段长度差 1 个采样导致相加报错


def env(n, a=0.005, d=0.2):
    t = np.arange(int(n)) / SR
    return np.minimum(t / max(a, 1e-4), 1) * np.exp(-t / max(d, 1e-4))


def band(x, lo, hi):
    """FFT 带通：白噪声 → 不同质感的关键一步。"""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def noise(dur):
    return rng.standard_normal(n_of(dur))


def fade(s, a=0.8, b=0.8):
    n = len(s)
    i = np.arange(n)
    return s * np.minimum(1, np.minimum(i / (a * SR), (n - i) / (b * SR)))


# ---------- 音色 ----------
def bell(f=1318.5, dur=1.2, bright=1.0):
    """琴键/提示的“叮”：非整数倍泛音更像金属。"""
    t = np.arange(n_of(dur)) / SR
    s = sum(np.sin(2 * np.pi * f * r * t) * a * np.exp(-t * d)
            for r, a, d in ((1, 1, 2.5), (2.76, 0.5 * bright, 4), (5.4, 0.25 * bright, 7), (8.9, 0.12 * bright, 10)))
    return s * np.minimum(t / 0.002, 1)


def thud(dur=0.25):
    """没有音高的木头闷响（哑键、落地、冲击）。"""
    t = np.arange(n_of(dur)) / SR
    f = 90 * np.exp(-t * 6) + 50
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18)
    s[:200] += band(rng.standard_normal(200), 200, 2000) * 0.6
    return s


def click(dur=0.004, lo=2000, hi=8000):
    x = noise(dur)
    return band(x, lo, hi) * env(len(x), 0.0005, dur / 3)


def shutter():
    out = np.zeros(n_of(0.12))
    a, c = click(0.006), click(0.006)
    x = noise(0.05)
    b = band(x, 1500, 6000) * env(len(x), 0.002, 0.015) * 0.5
    out[:len(a)] += a
    out[300:300 + len(b)] += b
    k = n_of(0.08)
    out[k:k + len(c)] += c
    return out


def rustle(dur=0.6, lo=2000, hi=7000):
    """纸张/衣物/树叶的窸窣：很多短促带通噪声颗粒。"""
    out = np.zeros(n_of(dur))
    for _ in range(int(dur * 30)):
        n = int(rng.uniform(0.01, 0.05) * SR)
        p = int(rng.uniform(0, len(out) - n))
        out[p:p + n] += band(rng.standard_normal(n), lo, hi) * env(n, 0.002, n / SR / 3) * rng.uniform(0.3, 1)
    return out


def scribble(dur=1.0, rate=11):
    """铅笔写字：高频噪声 × 抖动的节律包络。rate 调慢就是橡皮擦。"""
    t = np.arange(n_of(dur)) / SR
    am = (0.5 + 0.5 * np.sin(2 * np.pi * rate * t + 2 * np.sin(2 * np.pi * 1.7 * t))) ** 2
    return band(noise(dur), 3000, 9000) * am * 0.6


def whoosh(dur=0.7):
    n = n_of(dur)
    t = np.arange(n) / SR
    k = t / dur
    return (band(noise(dur), 200, 900) * (1 - k) + band(noise(dur), 900, 4000) * k) * np.sin(np.pi * k) ** 2


def pop(dur=0.08):
    """气泡/字弹出。"""
    t = np.arange(n_of(dur)) / SR
    f = 900 * np.exp(-t * 30) + 280
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35)


def step(dur=0.08):
    t = np.arange(n_of(dur)) / SR
    return np.sin(2 * np.pi * 110 * t) * np.exp(-t * 60) + band(noise(dur), 300, 2500) * np.exp(-t * 90) * 0.4


def steps(dur=2.0, rate=2.2, vol_jitter=0.3):
    out = np.zeros(n_of(dur))
    for k in range(int(dur * rate)):
        s = step() * (1 - vol_jitter * rng.random())
        i = int(k / rate * SR)
        out[i:i + len(s)] += s[:len(out) - i]
    return out


def creak(dur=0.35):
    """秋千/门轴的吱呀。"""
    t = np.arange(n_of(dur)) / SR
    f = 260 + 140 * t / dur + 12 * np.sin(2 * np.pi * 30 * t)
    return band(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3, 200, 3000) * np.sin(np.pi * t / dur)


def tape_rewind(dur=1.0):
    t = np.arange(n_of(dur)) / SR
    f = 500 + 1500 * (t / dur) ** 1.5 + 60 * np.sin(2 * np.pi * 9 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 + band(noise(dur), 1000, 6000) * 0.35


def rain(dur=4.0, drips=True):
    """雨声铺底：中高频沙沙 + 低频 + 随机水滴。铺底时用 fade() 包一下。"""
    x = band(noise(dur), 300, 6000) * 0.5 + band(noise(dur), 80, 400) * 0.6
    if drips:
        for _ in range(int(dur * 6)):
            c = click(0.003, 3000, 9000)
            p = int(rng.uniform(0, len(x) - len(c)))
            x[p:p + len(c)] += c * rng.uniform(0.5, 1.5)
    return x


def plink(f=1400):
    """水滴、冰块碰杯、眼泪落下。"""
    return bell(f, 0.3, 0.3) * 0.6


def hum(dur=1.8):
    """低频嗡嗡（琴肚、旧灯管、压抑感）。"""
    t = np.arange(n_of(dur)) / SR
    return (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 110.5 * t)) * np.sin(np.pi * t / dur) * 0.6


def sparkle(n=5, base=2600):
    out = np.zeros(n_of(0.6))
    for k in range(n):
        s = bell(base * (1 + 0.12 * k), 0.25, 0.2) * 0.4
        i = n_of(k * 0.07)
        out[i:i + len(s)] += s[:len(out) - i]
    return out


KINDS = dict(bell=bell, thud=thud, click=click, shutter=shutter, rustle=rustle, scribble=scribble, whoosh=whoosh,
             pop=pop, step=step, steps=steps, creak=creak, tape_rewind=tape_rewind, rain=rain, plink=plink, hum=hum,
             sparkle=sparkle)
BEDS = {'rain', 'hum', 'steps', 'scribble', 'rustle'}     # 长段铺底，自动加淡入淡出


# 推荐音量（相对原曲；歌声段落按这个，纯器乐/无声段落可上调 1.5–2 倍）
SUGGESTED_VOL = dict(rain=0.07, thud=0.35, hum=0.12, tape_rewind=0.10, bell=0.10, pop=0.08, plink=0.10,
                     scribble=0.06, rustle=0.06, step=0.10, steps=0.08, creak=0.06, whoosh=0.08, shutter=0.15,
                     click=0.10, sparkle=0.06)


def build(cues, dur):
    track = np.zeros(n_of(dur) + SR)
    for c in cues:
        s = KINDS[c['kind']](**c.get('args', {}))
        if c['kind'] in BEDS:
            s = fade(s, min(0.8, len(s) / SR / 4), min(0.8, len(s) / SR / 4))
        i = int(c['t'] * SR)
        j = min(len(track), i + len(s))
        if j > i:
            track[i:j] += s[:j - i] * c.get('vol', SUGGESTED_VOL.get(c['kind'], 0.08))
    return track


def soft_limit(x, knee=0.8):
    a = np.abs(x)
    over = a > knee
    x[over] = np.sign(x[over]) * (knee + (0.98 - knee) * np.tanh((a[over] - knee) / (0.98 - knee)))
    return x


def write_wav(path, x):
    x = np.atleast_2d(x.T).T if x.ndim == 1 else x
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(x.shape[1])
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def mix(song_path, cues, out, tail_fade=2.5):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(song_path), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    song = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)
    fx = build(cues, len(song) / SR)[:len(song)]
    m = soft_limit(song + fx[:, None])
    if tail_fade:
        k = n_of(tail_fade)
        m[-k:] *= np.linspace(1, 0, k)[:, None]
    write_wav(out, m)
    write_wav(str(out).replace('.wav', '_sfx_only.wav'), np.clip(fx * 3, -1, 1))   # 单独试听音效
    print(out, 'peak', round(float(np.abs(m).max()), 3))


def preview(out):
    seq = [np.concatenate([KINDS[k]() * 0.6, np.zeros(n_of(0.4))]) for k in KINDS]
    write_wav(out, soft_limit(np.concatenate(seq)))
    print(out, '顺序:', ' → '.join(KINDS))


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--preview')
    ap.add_argument('--song')
    ap.add_argument('--cues')
    ap.add_argument('--out', default='build/mix.wav')
    a = ap.parse_args()
    if a.preview:
        preview(a.preview)
    else:
        mix(a.song, json.loads(open(a.cues, encoding='utf-8').read()), a.out)

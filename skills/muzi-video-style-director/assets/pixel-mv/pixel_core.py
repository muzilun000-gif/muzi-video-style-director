"""像素MV起步代码：低分辨率网格 + 最近邻放大 + 逐字花字 + 氛围层 + 转场 + 分块并行渲染。

来自《哑键》项目（480x270 → 1920x1080 / 60fps，整首 4:57）。只依赖 numpy、Pillow、ffmpeg。
画面只由时间 t 决定；随机数都用固定种子。

用法:
  python pixel_core.py --demo out/demo.mp4            # 4 秒演示：花字标题 + 氛围层 + 转场
  python pixel_core.py --demo out/demo.mp4 --jobs 4   # 分块并行渲染
在自己的项目里：import pixel_core as P，写 render(t) 返回 (GH, GW, 3) 的 float 数组，
再调用 P.render_video(render, dur, out, audio=..., jobs=...)。
"""
import argparse
import subprocess
import sys
import tempfile
from multiprocessing import Pool
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

GW, GH, UP, FPS = 480, 270, 4, 60
YY, XX = np.mgrid[0:GH, 0:GW]
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16

FONT_CANDIDATES = ['/System/Library/Fonts/Hiragino Sans GB.ttc', '/System/Library/Fonts/PingFang.ttc',
                   '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', 'C:/Windows/Fonts/msyh.ttc']
FONT_PATH = next((p for p in FONT_CANDIDATES if Path(p).exists()), None)


def font(size):
    """像素字只用 12/16/24/36 这类整数字号，fontmode='1' 关掉抗锯齿，边缘才是硬像素。"""
    if FONT_PATH is None:
        sys.exit('找不到中文字体，请在 FONT_CANDIDATES 里加上本机字体路径')
    return ImageFont.truetype(FONT_PATH, size)


def hx(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32)


# ---------- 基础绘制 ----------
def grad(top, bot):
    k = np.linspace(0, 1, GH)[:, None, None]
    return np.broadcast_to(hx(top) * (1 - k) + hx(bot) * k, (GH, GW, 3)).copy()


def blend(g, m, col, a):
    g[m] = g[m] * (1 - a) + np.asarray(col) * a


def disc(g, x, y, r, col, a=1.0):
    blend(g, (XX - x) ** 2 + (YY - y) ** 2 < r * r, col, a)


def text_mask(s, f):
    w, h = int(f.getlength(s)) + 2, f.size + 6
    m = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(m)
    d.fontmode = '1'
    d.text((0, 0), s, font=f, fill=255)
    return np.array(m) > 127


def text(g, x, y, s, col, f=None, outline=None):
    f = f or font(12)
    m = text_mask(s, f)
    h, w = m.shape
    x, y = int(x), int(y)
    ya, yb, xa, xb = max(y, 0), min(y + h, GH), max(x, 0), min(x + w, GW)
    if ya >= yb or xa >= xb:
        return
    sub = m[ya - y:yb - y, xa - x:xb - x]
    if outline is not None:
        ring = dilate(np.pad(sub, 1))[1:-1, 1:-1] & ~sub
        g[ya:yb, xa:xb][ring] = outline
    g[ya:yb, xa:xb][sub] = col


# ---------- 缓动 ----------
def clamp01(x):
    return min(max(x, 0.0), 1.0)


def ease_out(x):
    return 1 - (1 - clamp01(x)) ** 3


def back_out(x, s=2.2):
    x = clamp01(x) - 1
    return 1 + x * x * ((s + 1) * x + s)


def bounce_out(x):
    x, n, d = clamp01(x), 7.5625, 2.75
    if x < 1 / d:
        return n * x * x
    if x < 2 / d:
        x -= 1.5 / d
        return n * x * x + 0.75
    if x < 2.5 / d:
        x -= 2.25 / d
        return n * x * x + 0.9375
    x -= 2.625 / d
    return n * x * x + 0.984375


# ---------- 花字：每个字一块像素蒙版，可缩放/旋转/斜切，再上色 ----------
def glyph(ch, f, z=1):
    m = text_mask(ch, f)
    ys, xs = np.where(m)
    if len(ys) == 0:
        return np.zeros((f.size * z, f.size * z // 2), bool)
    m = m[:f.size + 2, xs.min():xs.max() + 1]
    return m.repeat(z, 0).repeat(z, 1)


def transform(m, cx, cy, sx=1.0, sy=1.0, rot=0.0, shear=0.0):
    """逆映射：画面每个像素反算回字形坐标，避免放大后出现空洞。返回 (蒙版, 字内纵向位置 0–1)。"""
    h, w = m.shape
    r = int(max(h, w) * max(abs(sx), abs(sy), 0.05) * 0.8) + 4
    x0, y0 = int(cx) - r, int(cy) - r
    gy, gx = np.mgrid[y0:y0 + 2 * r, x0:x0 + 2 * r].astype(np.float32)
    u, v = gx - cx + 0.5, gy - cy + 0.5
    c, s = np.cos(-rot), np.sin(-rot)
    u, v = c * u - s * v, s * u + c * v
    u = (u - shear * v) / (sx if abs(sx) > 1e-3 else 1e-3)
    v = v / (sy if abs(sy) > 1e-3 else 1e-3)
    su, sv = np.floor(u + w / 2).astype(int), np.floor(v + h / 2).astype(int)
    ok = (su >= 0) & (su < w) & (sv >= 0) & (sv < h)
    hit = np.zeros_like(ok)
    hit[ok] = m[sv[ok], su[ok]]
    out, rel = np.zeros((GH, GW), bool), np.zeros((GH, GW), np.float32)
    ya, yb, xa, xb = max(y0, 0), min(y0 + 2 * r, GH), max(x0, 0), min(x0 + 2 * r, GW)
    if ya < yb and xa < xb:
        out[ya:yb, xa:xb] = hit[ya - y0:yb - y0, xa - x0:xb - x0]
        rel[ya:yb, xa:xb] = (sv / max(h - 1, 1))[ya - y0:yb - y0, xa - x0:xb - x0]
    return out, rel


def dilate(m, r=1):
    """用平移做膨胀；注意先 pad 或清边，np.roll 会把底边绕到顶上（《哑键》踩过的坑）。"""
    p = np.pad(m, r)
    o = p.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx or dy:
                o |= np.roll(np.roll(p, dy, 0), dx, 1)
    return o[r:-r, r:-r]


def shift(m, dy, dx):
    o = np.zeros_like(m)
    ys, yd = (slice(0, GH - dy), slice(dy, GH)) if dy >= 0 else (slice(-dy, GH), slice(0, GH + dy))
    xs, xd = (slice(0, GW - dx), slice(dx, GW)) if dx >= 0 else (slice(-dx, GW), slice(0, GW + dx))
    o[yd, xd] = m[ys, xs]
    return o


def paint(g, M, rel, top, bot, outline, shadow=None, depth=0, depth_col=None, alpha=1.0, hi=None):
    """花字上色顺序：立体厚度 → 投影 → 描边 → 上下渐变 → 顶边高光。半透明用 Bayer 点阵，保持像素感。"""
    if alpha < 1:
        M = M & (alpha > BAYER[YY % 4, XX % 4])
    if not M.any():
        return
    ring = dilate(M)
    if depth and depth_col is not None:
        for k in range(depth, 0, -1):
            g[shift(ring, k, k // 2)] = depth_col
    if shadow is not None:
        g[shift(ring, 2, 2)] = shadow
    g[ring] = outline
    k = np.clip(rel[M], 0, 1)[:, None]
    g[M] = top * (1 - k) + bot * k
    if hi is not None:
        g[M & ~shift(M, 1, 0)] = hi


def anim(kind, p, dur=0.35):
    """单字进场。p 是这个字已进场的秒数。同一句里给相邻字不同 kind，标题就不会“整齐划一”。"""
    x = p / dur
    a = dict(dx=0.0, dy=0.0, sx=1.0, sy=1.0, rot=0.0, shear=0.0, alpha=1.0)
    if x >= 1:
        return a
    if x < 0:
        a['alpha'] = 0.0
        return a
    if kind == 'drop':        # 掉下来，落地压扁再弹回
        a['dy'] = -46 * (1 - bounce_out(x))
        land = max(0.0, 1 - abs(x - 0.38) / 0.12)
        a['sy'], a['sx'] = 1 - 0.28 * land, 1 + 0.22 * land
    elif kind == 'pop':       # 从零放大，冲过头再回
        a['sx'] = a['sy'] = max(back_out(x, 3.0), 0.01)
    elif kind == 'slide':     # 从左滑入带倾斜
        a['dx'], a['shear'], a['alpha'] = -70 * (1 - ease_out(x)), -0.5 * (1 - ease_out(x)), clamp01(x * 3)
    elif kind == 'flip':      # 卡片横向翻转
        a['sx'] = max(abs(np.cos(np.pi * (1 - ease_out(x)))), 0.02)
        a['sy'] = 1 + 0.15 * (1 - x)
    elif kind == 'spin':      # 旋转放大落位
        a['rot'] = -1.2 * (1 - ease_out(x))
        a['sx'] = a['sy'] = max(back_out(x, 1.6), 0.01)
    elif kind == 'rise':      # 点阵渐显 + 上浮（最安静，适合小字）
        a['dy'], a['alpha'] = 14 * (1 - ease_out(x)), ease_out(x)
    elif kind == 'press':     # 像琴键被按下：抬起、猛压、回弹
        a['dy'] = [-10, 4, -2, 0][min(int(x * 4), 3)] * (1 - x * 0.3)
        hit = 0.25 <= x < 0.5
        a['sy'], a['sx'] = (0.75, 1.15) if hit else (1.0, 1.0)
    elif kind == 'stretch':   # 竖向拉长弹出
        a['sy'] = max(back_out(x, 2.5), 0.01) * (1 + 0.5 * (1 - x))
        a['sx'] = max(0.6 + 0.4 * x, 0.01)
    return a


KINDS = ('drop', 'pop', 'rise', 'flip', 'slide', 'press', 'spin', 'stretch')


def fancy_line(g, t, s, x, y, t0, f, z=1, kinds=KINDS, gap=0.09, top='#fff3d8', bot='#f4b860',
               outline='#293761', shadow='#1a1f3a', depth=0, wobble=True):
    """一整行花字：逐字错开进场、每字不同动画、轻微高低错落和歪斜，进场后慢慢呼吸。"""
    cx = x
    for i, ch in enumerate(s):
        m = glyph(ch, f, z)
        w = m.shape[1]
        if ch.strip():
            rng = np.random.default_rng(i * 7 + 1)
            a = anim(kinds[i % len(kinds)], t - t0 - i * gap)
            jy = rng.integers(-3, 4) * z if wobble else 0
            jr = rng.uniform(-0.08, 0.08) if wobble else 0
            breathe = 0.6 * np.sin(t * 2.2 + i) if wobble and t - t0 - i * gap > 0.4 else 0
            M, rel = transform(m, cx + w / 2 + a['dx'], y + m.shape[0] / 2 + a['dy'] + jy + breathe,
                               a['sx'], a['sy'], a['rot'] + jr, a['shear'])
            paint(g, M, rel, hx(top), hx(bot), hx(outline), hx(shadow), depth, hx(outline) * 0.6, a['alpha'],
                  hi=np.minimum(hx(top) + 30, 255))
        cx += w + 2 * z


# ---------- 氛围层（人物特写/静物镜头“太素”时叠这些） ----------
def grade(g, tint, amt=0.5, sat=0.5, bright=1.0):
    """降饱和 + 乘色调。约定：现在 = 冷灰蓝，回忆 = 褪色暖黄。"""
    gray = g.mean(2, keepdims=True)
    o = gray + (g - gray) * sat
    o = o * (1 - amt) + o * (hx(tint) / 255) * amt * 1.25
    return np.clip(o * bright, 0, 255)


def vignette(g, k=0.6, start=0.7):
    v = np.hypot((XX - GW / 2) / (GW / 2), (YY - GH / 2) / (GH / 2))
    m = (v - start) * 2.2 > BAYER[YY % 4, XX % 4]
    g[m] = g[m] * k


def dapple(g, t, col='#fff2cc', amt=0.14, scale=1.0, dark=False):
    """树叶缝漏下的光斑或树影。amt 超过 0.2 会像迷彩，人物脸上保持很淡。"""
    n = (np.sin(XX * 0.06 / scale + t * 0.5 + 2.2 * np.sin(YY * 0.05 / scale + t * 0.3))
         * np.sin(YY * 0.07 / scale - t * 0.4 + 1.5 * np.sin(XX * 0.04 / scale)))
    m = (n > 0.25) & (0.6 > BAYER[YY % 4, XX % 4])
    if dark:
        g[m] = g[m] * (1 - amt)
    else:
        blend(g, m, hx(col), amt)


def flare(g, t, x0, y0, col='#fff2cc', n=5):
    for k in range(n):
        fx, fy = x0 + (GW / 2 - x0) * k * 0.45, y0 + (GH / 2 - y0) * k * 0.45
        r = (4, 9, 3, 14, 6)[k % 5] * (1 + 0.06 * np.sin(t * 2 + k))
        disc(g, fx, fy, r, hx(col), 0.3)
        disc(g, fx, fy, r * 0.4, hx('#ffffff'), 0.4)
    disc(g, x0, y0, 36, hx(col), 0.25)


def front_bokeh(g, t, cols, n=6, seed=0, alpha=0.28, keep=(200, GW, 30, GH)):
    """前景虚化光斑。keep 是人物保留区 (x0, x1, y0, y1)，光斑不进去，避免挡脸。"""
    for i in range(n):
        rng = np.random.default_rng(i + seed)
        x = (rng.uniform(0, GW) + t * rng.uniform(-6, 6)) % (GW + 60) - 30
        y = rng.uniform(0, GH) + 6 * np.sin(t * 0.5 + i)
        r = rng.uniform(14, 30)
        if keep[0] < x < keep[1] and keep[2] < y < keep[3]:
            continue
        c = hx(cols[i % len(cols)])
        disc(g, x, y, r, c, alpha)
        ring = np.abs(np.hypot(XX - x, YY - y) - r) < 1.0
        blend(g, ring & (0.5 > BAYER[YY % 4, XX % 4]), c, 0.5)


def motes(g, t, n=40, col='#fffbe8', seed=3, region=(0, GW, 0, GH)):
    for i in range(n):
        rng = np.random.default_rng(i + seed)
        x = int(rng.uniform(region[0], region[1]) + 10 * np.sin(t * 0.4 + i))
        y = int((rng.uniform(region[2], region[3]) - t * rng.uniform(2, 6)) % (region[3] - region[2]) + region[2])
        if int(t * 3 + i) % 4:
            g[min(max(y, 0), GH - 1), min(max(x, 0), GW - 1)] = hx(col)


def lens_drops(g, t, n=9, seed=4):
    for i in range(n):
        rng = np.random.default_rng(i + seed)
        x = rng.uniform(0, GW)
        y = (rng.uniform(0, GH) + t * rng.uniform(2, 8)) % (GH + 30) - 15
        r = rng.uniform(4, 9)
        m = ((XX - x) / r) ** 2 + ((YY - y) / (r * 1.2)) ** 2 < 1
        g[m] = g[m] * 0.85 + 30
        inner = ((XX - x + 1) / r) ** 2 + ((YY - y + 1) / (r * 1.2)) ** 2 < 0.7
        blend(g, m & ~inner, hx('#ffffff'), 0.45)


def rain(g, t, n=220, slant=0.25, speed=520, length=7, col='#c9d6e6', seed=1, alpha=0.8):
    rng = np.random.default_rng(seed)
    x0, y0, sp = rng.uniform(0, GW + 80, n), rng.uniform(0, GH, n), rng.uniform(0.8, 1.2, n)
    c = hx(col)
    for i in range(n):
        y = (y0[i] + t * speed * sp[i]) % (GH + 20) - 10
        x = x0[i] - y * slant
        for k in range(length):
            yy, xx = int(y - k), int(x + k * slant)
            if 0 <= yy < GH and 0 <= xx < GW:
                g[yy, xx] = g[yy, xx] * (1 - alpha) + c * alpha


def grain(g, t, amt=6):
    g += np.random.default_rng(int(t * FPS)).normal(0, amt, (GH, GW, 1))


# ---------- 转场（返回混合后的帧） ----------
def dither_dissolve(a, b, p):
    m = p > BAYER[YY % 4, XX % 4]
    o = a.copy()
    o[m] = b[m]
    return o


def curtain_wipe(a, b, p, col='#2a1e2e'):
    """两侧幕布合上再拉开：p<0.5 合上 a，p>=0.5 拉开露出 b。"""
    k = 1 - abs(p * 2 - 1)
    w = int(GW / 2 * ease_out(k))
    o = (a if p < 0.5 else b).copy()
    o[:, :w] = hx(col)
    o[:, GW - w:] = hx(col)
    return o


def flash(a, b, p):
    o = (a if p < 0.5 else b).copy()
    return o + (255 - o) * (1 - abs(p * 2 - 1))


def rewind(g, p, seed=0):
    """录像带倒带：横向撕裂、色偏、扫描亮带、噪点。现在 ↔ 回忆的切换用。"""
    rng = np.random.default_rng(int(p * 40) + seed)
    o = g.copy()
    for _ in range(14):
        y0, h = int(rng.uniform(0, GH)), int(rng.uniform(3, 20))
        o[y0:y0 + h] = np.roll(g[y0:y0 + h], int(rng.uniform(-40, 40)), axis=1)
    o[..., 0] = np.roll(o[..., 0], 2, axis=1)
    o[..., 2] = np.roll(o[..., 2], -2, axis=1)
    band = ((YY + int(p * 900)) % 60) < 6
    o[band] = o[band] * 0.6 + 255 * 0.4
    o[rng.random((GH, GW)) < 0.06] = 230
    return o


# ---------- 渲染：分块并行，每块一个 mp4，最后 concat + 混音 ----------
def _encode(args):
    render, a, b, path = args
    cmd = ['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{GW * UP}x{GH * UP}',
           '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p',
           str(path)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(a, b):
        g = np.clip(render(i / FPS), 0, 255).astype(np.uint8)
        p.stdin.write(g.repeat(UP, 0).repeat(UP, 1).tobytes())     # 最近邻放大，像素保持方块
    p.stdin.close()
    p.wait()
    return path


def render_video(render, dur, out, audio=None, jobs=4):
    """render 必须是模块顶层函数（multiprocessing 要能 pickle）。audio 给 wav/mp3 时一起封装为 AAC。"""
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    n = int(round(dur * FPS))
    tmp = Path(tempfile.mkdtemp(prefix='pixelmv_'))
    cuts = np.linspace(0, n, jobs + 1).astype(int)
    tasks = [(render, cuts[k], cuts[k + 1], tmp / f'c{k:02d}.mp4') for k in range(jobs) if cuts[k + 1] > cuts[k]]
    with Pool(len(tasks)) as pool:
        parts = pool.map(_encode, tasks)
    lst = tmp / 'list.txt'
    lst.write_text(''.join(f"file '{p}'\n" for p in parts))
    cmd = ['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(lst)]
    if audio:
        cmd += ['-i', str(audio), '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '256k',
                '-af', 'volume=-1.5dB', '-shortest']               # 预留余量，AAC 编码后峰值别贴 0 dB
    cmd += ['-c:v', 'copy', '-movflags', '+faststart', str(out)]
    subprocess.run(cmd, check=True)
    return out


# ---------- 演示 ----------
def demo_frame(t):
    g = grad('#f6b48a', '#5a4a8a')
    disc(g, 90, 170, 46, hx('#ffe7b0'), 0.9)
    g[200:] = g[200:] * 0.55 + hx('#2b2440') * 0.45
    dapple(g, t, amt=0.10)
    fancy_line(g, t, '像素花字', 120, 70, 0.3, font(36), z=1, depth=3)
    fancy_line(g, t, '每个字都不一样地进场', 140, 130, 1.4, font(16), kinds=('rise', 'pop', 'drop'), gap=0.06,
               top='#ffffff', bot='#ffe1a8', depth=0)
    motes(g, t)
    flare(g, t, 90, 170)
    vignette(g)
    grain(g, t, 4)
    if t > 3.2:
        g = dither_dissolve(g, grad('#20243f', '#0f1020'), (t - 3.2) / 0.6)
    return g


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--demo', required=True, help='输出 mp4 路径')
    ap.add_argument('--jobs', type=int, default=2)
    ap.add_argument('--still', help='只导出某一秒的 PNG，例如 --still 2.0')
    a = ap.parse_args()
    if a.still:
        img = np.clip(demo_frame(float(a.still)), 0, 255).astype(np.uint8).repeat(UP, 0).repeat(UP, 1)
        Image.fromarray(img).save(a.demo)
    else:
        print(render_video(demo_frame, 4.0, a.demo, jobs=a.jobs))

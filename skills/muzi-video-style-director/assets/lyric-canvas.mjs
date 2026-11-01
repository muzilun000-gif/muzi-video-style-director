// Deterministic Canvas lyric layer. Global audio seconds, normalized anchors.
// Caller supplies checked character timing; this module does not transcribe audio.
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => 1 - (1 - clamp(x)) ** 3;

export function characterState(glyph, t, cue) {
  const enter = ease((t - (glyph.start - 0.13)) / 0.16);
  const leave = clamp((cue.end - t) / 0.16);
  const progress = clamp((t - glyph.start) / Math.max(0.001, glyph.end - glyph.start));
  return {
    alpha: t < cue.start || t >= cue.end ? 0 : enter * leave,
    dy: (1 - enter) * 8,
    progress,
    // A single restrained accent, no looping spring or reflow.
    scale: glyph.emphasis ? 1 + 0.04 * Math.sin(Math.PI * progress) : 1,
  };
}

export function layoutLine(ctx, line, width, height, fontFamily) {
  const size = line.size * width / 1920;
  ctx.font = `600 ${size}px ${fontFamily}`;
  const spacing = (line.spacing ?? 3) * width / 1920;
  const measured = line.glyphs.map(g => ctx.measureText(g.char).width);
  const total = measured.reduce((a, b) => a + b, 0) + spacing * Math.max(0, measured.length - 1);
  let x = line.x * width - (line.align === 'center' ? total / 2 : line.align === 'right' ? total : 0);
  return line.glyphs.map((glyph, i) => {
    const out = { glyph, x, y: line.y * height, width: measured[i], size };
    x += measured[i] + spacing;
    return out;
  });
}

export function drawLyrics(ctx, cue, t, {
  width = ctx.canvas.width, height = ctx.canvas.height,
  fontFamily = '"Kaiti SC", "STKaiti", "Noto Serif CJK SC", serif',
  base = '#FFF3D8', active = '#F4D583', accent = '#EB877D',
  outline = '#293761', outlineWidth = 1.4,
} = {}) {
  if (!cue || t < cue.start || t >= cue.end) return [];
  const boxes = [];
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  for (const line of cue.lines) {
    const positions = layoutLine(ctx, line, width, height, fontFamily);
    for (const box of positions) {
      const state = characterState(box.glyph, t, cue);
      boxes.push({ ...box, ...state });
      if (state.alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = state.alpha;
      ctx.translate(box.x + box.width / 2, box.y + state.dy * width / 1920);
      ctx.scale(state.scale, state.scale);
      ctx.font = `600 ${box.size}px ${fontFamily}`;
      ctx.lineWidth = outlineWidth * width / 1920;
      ctx.strokeStyle = outline;
      ctx.fillStyle = base;
      if (outlineWidth > 0) ctx.strokeText(box.glyph.char, -box.width / 2, 0);
      ctx.fillText(box.glyph.char, -box.width / 2, 0);
      // Wipe inside a fixed glyph box: repeated rendering at t has identical output.
      ctx.beginPath();
      ctx.rect(-box.width / 2 - ctx.lineWidth, -box.size * 1.3,
        (box.width + ctx.lineWidth * 2) * state.progress, box.size * 1.6);
      ctx.clip();
      ctx.fillStyle = box.glyph.emphasis ? accent : active;
      ctx.fillText(box.glyph.char, -box.width / 2, 0);
      ctx.restore();
    }
  }
  ctx.restore();
  return boxes;
}

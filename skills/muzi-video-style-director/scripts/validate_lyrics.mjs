#!/usr/bin/env node
// Validate lyrics.json against the format in references/music-video.md.
// Usage: node validate_lyrics.mjs lyrics.json [--audio-duration 245.3]
// Exit code 1 when errors are found; warnings alone exit 0.
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const durIdx = args.indexOf('--audio-duration');
const audioDuration = durIdx >= 0 ? Number(args[durIdx + 1]) : null;
if (!file) {
  console.error('用法: node validate_lyrics.mjs lyrics.json [--audio-duration 秒数]');
  process.exit(2);
}

const errors = [], warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
const isNum = x => typeof x === 'number' && Number.isFinite(x);
const EPS = 1e-6;

let data;
try {
  data = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`无法读取或解析 ${file}: ${e.message}`);
  process.exit(1);
}

const timing = data.source?.timing;
if (!data.source) warn('source', '缺少来源信息（audio / lyrics / timing）');
else {
  if (!data.source.audio) warn('source.audio', '未写原曲文件');
  if (!data.source.lyrics) warn('source.lyrics', '未写歌词出处');
  if (!['manual', 'forced-align', 'uniform'].includes(timing))
    warn('source.timing', `应为 manual / forced-align / uniform，当前为 ${JSON.stringify(timing)}`);
}
if (!['已校对', '待校对'].includes(data.status))
  warn('status', `应为“已校对”或“待校对”，当前为 ${JSON.stringify(data.status)}`);
if (timing === 'uniform' && data.status === '已校对')
  err('status', '时间为均分（uniform）却标记为已校对');

if (!Array.isArray(data.cues) || data.cues.length === 0) {
  err('cues', '缺少歌词句列表');
} else {
  let prevEnd = -Infinity;
  const ids = new Set();
  let uniformCues = 0, multiGlyphCues = 0, glyphCount = 0;

  data.cues.forEach((cue, ci) => {
    const where = `cues[${ci}]${cue.id ? ` (${cue.id})` : ''}`;
    if (cue.id) {
      if (ids.has(cue.id)) err(where, `id 重复`);
      ids.add(cue.id);
    }
    if (!isNum(cue.start) || !isNum(cue.end)) { err(where, 'start/end 必须是数字秒'); return; }
    if (cue.start < 0) err(where, 'start 小于 0');
    if (cue.end <= cue.start) err(where, `end (${cue.end}) 不大于 start (${cue.start})`);
    if (cue.start < prevEnd - EPS) err(where, `与上一句重叠（上一句结束 ${prevEnd}，本句开始 ${cue.start}）`);
    if (audioDuration && cue.end > audioDuration + EPS) err(where, `结束时间 ${cue.end} 超出音频时长 ${audioDuration}`);
    prevEnd = Math.max(prevEnd, cue.end);

    if (!Array.isArray(cue.lines) || cue.lines.length === 0) { err(where, '缺少 lines'); return; }
    if (cue.lines.length > 2) warn(where, `有 ${cue.lines.length} 行，主版式建议不超过两行`);

    const durations = [];
    let prevGlyphStart = -Infinity, joined = '';
    let lastGlyphEnd = -Infinity;
    cue.lines.forEach((line, li) => {
      const lw = `${where}.lines[${li}]`;
      for (const k of ['x', 'y']) {
        if (!isNum(line[k]) || line[k] < 0 || line[k] > 1) err(lw, `${k} 应是 0–1 的画面比例坐标`);
      }
      if (!isNum(line.size) || line.size <= 0) err(lw, 'size 必须是正数（以 1920 宽为基准）');
      else if (line.size < 40) warn(lw, `字号 ${line.size} 偏小，手机上可能看不清`);
      if (line.align && !['left', 'center', 'right'].includes(line.align)) err(lw, `align 无效: ${line.align}`);
      if (!Array.isArray(line.glyphs) || line.glyphs.length === 0) { err(lw, '缺少 glyphs'); return; }

      line.glyphs.forEach((g, gi) => {
        const gw = `${lw}.glyphs[${gi}]`;
        glyphCount++;
        if (typeof g.char !== 'string' || Array.from(g.char).length !== 1)
          err(gw, `char 应是单个字符，当前为 ${JSON.stringify(g.char)}`);
        else joined += g.char;
        if (!isNum(g.start) || !isNum(g.end)) { err(gw, 'start/end 必须是数字秒'); return; }
        if (g.end <= g.start) err(gw, `end 不大于 start（${g.start}–${g.end}）`);
        if (g.start < cue.start - EPS || g.start > cue.end + EPS || g.end > cue.end + EPS)
          err(gw, `时间 ${g.start}–${g.end} 不在整句 ${cue.start}–${cue.end} 之内`);
        if (g.start < prevGlyphStart - EPS) err(gw, '开始时间早于前一个字（顺序乱了）');
        prevGlyphStart = g.start;
        lastGlyphEnd = Math.max(lastGlyphEnd, g.end);
        durations.push(g.end - g.start);
      });
    });

    if (typeof cue.text === 'string') {
      const norm = s => s.replace(/\s+/g, '');
      if (norm(cue.text) !== norm(joined)) err(where, `各行文字拼起来是“${joined}”，与 text “${cue.text}”不一致`);
    } else warn(where, '缺少 text（整句原文），无法核对逐字是否完整');

    if (isNum(lastGlyphEnd) && cue.end - lastGlyphEnd < 0.25 - EPS)
      warn(where, `最后一个字结束后只留 ${(cue.end - lastGlyphEnd).toFixed(2)}s，建议至少 0.25s`);

    if (durations.length >= 4) {
      multiGlyphCues++;
      const spread = Math.max(...durations) - Math.min(...durations);
      if (spread < 0.005) uniformCues++;
    }
  });

  if (multiGlyphCues > 0 && uniformCues / multiGlyphCues >= 0.6 && timing !== 'uniform')
    warn('cues', `${uniformCues}/${multiGlyphCues} 句的每字时长完全相同，像是均分时间；请把 source.timing 标为 uniform 或重新对齐`);

  console.log(`共 ${data.cues.length} 句、${glyphCount} 个字；时间范围 ${data.cues[0].start}s – ${prevEnd}s`);
}

for (const w of warnings) console.log(`⚠️  ${w}`);
for (const e of errors) console.log(`❌ ${e}`);
console.log(errors.length ? `结果：${errors.length} 个错误，${warnings.length} 个提醒` : `结果：通过（${warnings.length} 个提醒）`);
process.exit(errors.length ? 1 : 0);

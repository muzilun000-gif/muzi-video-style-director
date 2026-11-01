// 用本机 Chrome 无头模式逐帧调用页面里的 renderAt(t)，把画面送进 ffmpeg。不需要 npm 安装（Node ≥ 22 自带 WebSocket）。
// 页面约定：<canvas id="c" width="1920" height="1080">；window.renderAt(t)、window.DURATION；
//          URL 带 ?render 时不跑预览循环；字体就绪后设 window.__ready = true。
// 用法:
//   node render.mjs <index.html> frames out/frames 3 40 62     # 按秒数截图 PNG（验收用）
//   node render.mjs <index.html> video out/silent.mp4 [起始秒] [结束秒]
// 再混音: ffmpeg -i silent.mp4 -i sound.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest out.mp4
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333, FPS = 30;
const [page, mode, out, ...rest] = process.argv.slice(2);
const pageDir = dirname(resolve(page));

const profile = resolve(pageDir, '.chrome-profile');
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, '--window-size=1920,1080', 'about:blank'], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function pageWs() {
  for (let i = 0; i < 50; i++) {
    try { const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = list.find(x => x.type === 'page'); if (p) return p.webSocketDebuggerUrl; } catch {}
    await sleep(200);
  }
  throw new Error('Chrome 没有启动');
}
const ws = new WebSocket(await pageWs());
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async expr => { const m = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (m.result.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails)); return m.result.result.value; };

await send('Page.enable');
await send('Page.navigate', { url: pathToFileURL(resolve(page)).href + '?render' });
for (let i = 0; i < 100 && !(await evaluate('!!window.__ready').catch(() => false)); i++) await sleep(100);
const DURATION = await evaluate('window.DURATION');
const grab = (t, type) => evaluate(`renderAt(${t}); document.getElementById('c').toDataURL('${type}', 0.93)`);

if (mode === 'frames') {
  mkdirSync(out, { recursive: true });
  for (const s of rest) {
    const url = await grab(+s, 'image/png');
    writeFileSync(resolve(out, `t${String(s).padStart(6, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log('frames', rest.length);
} else {
  const t0 = +(rest[0] ?? 0), t1 = +(rest[1] ?? DURATION);
  mkdirSync(dirname(resolve(out)), { recursive: true });
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((t1 - t0) * FPS);
  const started = Date.now();
  for (let f = 0; f < n; f++) {
    const url = await grab(t0 + f / FPS, 'image/jpeg');
    if (!ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log(`frame ${f}/${n}  ${((Date.now() - started) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log('done', out, n, 'frames');
}
ws.close(); chrome.kill();

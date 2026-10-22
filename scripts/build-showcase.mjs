import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';
import {styles} from '../examples/scenes.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skill=resolve(root, 'skills/muzi-video-style-director');
const refs=JSON.parse(readFileSync(resolve(skill,'references/showcase.json'),'utf8'));
const expected=styles.map(s=>s[0]);
if(refs.length!==18 || new Set(refs.map(x=>x.id)).size!==18 || refs.some(x=>!expected.includes(x.id))) throw Error('Expected one reference for each of the 18 styles');
for(const x of refs) for(const key of ['title','author','source_url','image_url','alt','reason']) if(!x[key]) throw Error(`Missing ${key}: ${x.id}`);
for(const x of refs) for(const key of ['source_url','image_url']) if(!x[key].startsWith('https://')) throw Error(`Expected HTTPS: ${x.id}`);
const names=Object.fromEntries(styles.map(([id,name])=>[id,name]));
const ordered=expected.map(id=>refs.find(x=>x.id===id));
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=x=>`[![${x.alt}](${x.image_url})](${x.source_url})`;

let md='# 十八种风格 · 网上作品展示\n\n每种风格对应一张精选作品。图片均为带署名的第三方视觉参考，点击可访问原作者页面；不是本 skill 的生成结果或模型能力测评。图片通过外链加载，不打包再分发，原作许可独立于本仓库 MIT 许可。\n\n';
md+='选图日期：2026-10-22。已查看每张预览并检查风格对应关系；这里呈现的是静态视觉参考，不代表完整观看或复现原视频。\n\n';
for(const [i,x] of ordered.entries()) {
  md+=`<a id="${x.id}"></a>\n\n## ${String(i+1).padStart(2,'0')} · ${names[x.id]}\n\n${img(x)}\n\n**作者：** ${x.author} · [${x.title.replace(/[\[\]]/g,'')}](${x.source_url})\n\n**借鉴点：** ${x.reason}\n\n**来源核对：** ${x.source_verification}${x.image_provider_url ? ` [图片承载页面](${x.image_provider_url})。` : ''}\n\n**调用风格：** \`${x.id}\`。制作时读取 [风格规则](styles.md)，用自己的主题、文字和素材重新设计。\n\n`;
}
md+='## 使用方式\n\n先按主题选一至两张参考，记录构图、材质、配色和层次；实际制作仍需原创关键帧和动画验证。外链失效时使用原作者入口，不把不可访问的图说成已看过。引用作品不等于取得商用或重新分发许可；不要直接将原图包装成自己的视频或技能生成效果。\n';
writeFileSync(resolve(skill,'references/visual-inspiration.md'),md);

let section='## 十八种风格，一眼选图\n\n**18 张网上精选作品，一一对应 18 种风格。** 点击图片看原作；作者署名随图保留。这是视觉参考展示，不是本 skill 的生成效果。\n\n';
section+='| 01—06 | 07—12 | 13—18 |\n|---|---|---|\n';
for(let row=0;row<6;row++) {
  const cells=[row*3,row*3+1,row*3+2].map(i=>{const x=ordered[i];return `**${String(i+1).padStart(2,'0')} ${names[x.id]}**<br>${img(x)}<br>${x.author}`;});
  section+='| '+cells.join(' | ')+' |\n';
}
section+='\n[查看大图、来源和风格对应说明](skills/muzi-video-style-director/references/visual-inspiration.md) · [下载后打开完整画廊](examples/gallery.html)。外链图片需要联网。\n\n';
section=section.replace('| 01—06 | 07—12 | 13—18 |','| 风格展示 | 风格展示 | 风格展示 |');
const readmePath=resolve(root,'README.md');
let readme=readFileSync(readmePath,'utf8');
readme=readme.replace(/## (?:先选一个抓眼的视觉方向|十八种风格，一眼选图)[\s\S]*?(?=## 直接发给智能体安装)/,section);
writeFileSync(readmePath,readme);

const cards=ordered.map((x,i)=>`<article id="${x.id}"><a class="picture" href="${esc(x.source_url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(x.image_url)}" alt="${esc(x.alt)}" loading="lazy" decoding="async"></a><div class="caption"><div class="meta"><span>${String(i+1).padStart(2,'0')} / ${esc(x.id)}</span><span>作品参考</span></div><h2>${esc(names[x.id])}</h2><p>${esc(x.reason)}</p><a class="credit" href="${esc(x.source_url)}" target="_blank" rel="noopener noreferrer">${esc(x.author)} ↗</a></div></article>`).join('\n');
const html=link=>`<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>木子 · 18种视频风格参考</title><style>
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#0c0d10;color:#f4f2ec;font:16px/1.65 system-ui,'PingFang SC',sans-serif}main{max-width:1440px;margin:auto;padding:48px 28px 72px}header{padding:0 0 32px;border-bottom:1px solid #303139;margin-bottom:28px}.eyebrow{font-size:12px;letter-spacing:3px;color:#b9f67b}h1{font-size:clamp(30px,5vw,66px);font-weight:650;letter-spacing:-2px;line-height:1.15;margin:18px 0}header p{max-width:800px;color:#b1b2b9}a{color:inherit;text-decoration:none}nav{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}nav a{border:1px solid #363740;padding:6px 12px;font-size:12px;border-radius:30px}nav a:hover{background:#b9f67b;color:#111}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}article{border:1px solid #2b2c33;background:#17181d;border-radius:14px;overflow:hidden;scroll-margin-top:18px}.picture{display:block;background:#08090b;aspect-ratio:4/3}.picture img{width:100%;height:100%;display:block;object-fit:contain}.caption{padding:20px}.meta{display:flex;justify-content:space-between;gap:12px;color:#92939d;font-size:10px;letter-spacing:1px}h2{margin:8px 0 4px;font-size:24px;font-weight:600}.caption p{color:#afb0ba;font-size:13px;min-height:44px;margin:0 0 16px}.credit{font-size:12px;color:#c3f58e}footer{margin-top:36px;padding-top:24px;border-top:1px solid #303139;color:#a3a4af;font-size:13px}a:focus-visible{outline:3px solid #b9f67b;outline-offset:4px}@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:580px){main{padding:28px 16px}.grid{grid-template-columns:1fr}h1{letter-spacing:-1px}.caption p{min-height:0}}
</style></head><body><main><header><div class="eyebrow">MUZI / VIDEO STYLE DIRECTOR</div><h1>十八种风格。<br>从好画面开始。</h1><p>每张图对应一种视频视觉语言。精选网上作品，保留原作者署名与原帖入口；参考其构图、材质和配色，为自己的内容设计画面。</p><nav aria-label="风格导航">${ordered.map(x=>`<a href="#${x.id}">${esc(names[x.id])}</a>`).join('')}</nav></header><section class="grid" aria-label="18种风格作品参考">${cards}</section><footer>图片为第三方作品参考，需联网加载；不代表本 skill 已生成或复现的效果。作品权利归原作者，外链展示不授予再分发许可。<br><a href="${link}">安装与使用说明 ↗</a> · <a href="basic-demo.html">基础代码动作演示 ↗</a></footer></main></body></html>`;
writeFileSync(resolve(root,'examples/gallery.html'),html('../README.md'));
writeFileSync(resolve(skill,'assets/gallery.html'),html('../SKILL.md'));
console.log('Built 18-image README, source reference page and both static galleries.');

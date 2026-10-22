// Original procedural style studies. No remote assets, API keys or third-party code.
export const styles = [
  ['kinetic','网格字体','#111512','#F1F0E8','#CEFA69'],
  ['launch','极简产品','#ECEEF2','#171A22','#555DE8'],
  ['editorial','编辑解释','#F3EBDD','#292620','#CD5135'],
  ['data','证据图表','#101E2B','#EEF3F7','#53D6BE'],
  ['paper','纸张剪贴','#DED7C9','#30302A','#35644B'],
  ['ink','手绘墨线','#F6EDDA','#393732','#B8654C'],
  ['spatial','空间结构','#131522','#E8EBF9','#A9A2FF'],
  ['rhythm','节拍几何','#211D38','#FFF0D9','#FF9B62'],
  ['terminal','终端代码','#0B1511','#D3F7D6','#7EF2A5'],
  ['isometric','等距流程','#E9F0EE','#233C38','#197A71'],
  ['pixel','像素游戏','#1D2143','#FFF2C5','#FFCF55'],
  ['blueprint','蓝图工程','#173C70','#E1EDFF','#80CFFF'],
  ['risograph','复古印刷','#F2E3CC','#232D46','#E9533F'],
  ['monoline','黑白线稿','#FAFAF5','#1C2425','#1C2425'],
  ['comic','漫画分镜','#F8EFB9','#202022','#F05B43'],
  ['timeline','时间线纪录','#202526','#F3ECE0','#F8B968'],
  ['map','地图路径','#DBE4D4','#2C4837','#BB563D'],
  ['collage','编辑拼贴','#F2EBDD','#181919','#D74D33']
];
const clamp = x => Math.min(1,Math.max(0,x));
const ease = x => 1-(1-clamp(x))**3;
const esc = x => String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const n = x => Number(x.toFixed(3));
export function renderSVG(id='kinetic',time=3) {
  const style=styles.find(s=>s[0]===id);
  if(!style) throw new Error(`Unknown style: ${id}`);
  if(!Number.isFinite(time)) throw new Error('Time must be finite');
  const [key,label,bg,fg,accent]=style, t=Math.min(8,Math.max(0,time));
  const p=ease(t/1.4), q=ease((t-.8)/1.3), pulse=.5+.5*Math.cos(t*Math.PI*4);
  const rect=(x,y,w,h,fill,rx=0)=>`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${rx}" fill="${fill}"/>`;
  const text=(x,y,s,size=24,fill=fg,weight=500)=>`<text x="${n(x)}" y="${n(y)}" font-size="${size}" fill="${fill}" font-weight="${weight}">${esc(s)}</text>`;
  const line=(x1,y1,x2,y2,stroke=fg,width=2)=>`<path d="M${n(x1)} ${n(y1)} L${n(x2)} ${n(y2)}" stroke="${stroke}" stroke-width="${width}" fill="none"/>`;
  const circle=(x,y,r,fill,stroke='none',sw=2)=>`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  let s='';
  if(key==='kinetic') {
    for(let x=42;x<960;x+=146)s+=line(x,72,x,468,'#344033',1);
    s+=rect(42,100,876*p,108,accent)+text(62,180,'会写代码。',82,bg,800);
    s+=`<g transform="translate(${n((1-q)*100)},0)" opacity="${n(q)}">${text(42,305,'还要有章法。',82,fg,800)}${text(46,365,'RULES → FRAMES → REVIEW',25,accent,600)}</g>`;
    s+=line(42,415,42+876*q,415,fg,5);
  } else if(key==='launch') {
    s+=text(58,130,'让规则，成为作品。',51,fg,700)+text(60,172,'从一句需求，到清楚的视觉语言',23,'#626575');
    s+=`<g transform="translate(0,${n((1-p)*45)})">${rect(170,220,620,240,'#D7DBE5',20)}${rect(186,236,588,208,'#FFFFFF',14)}${rect(218,270,180,16,'#CDD0DA',8)}${rect(218,307,330*q,68,accent,12)}${text(238,353,'你的想法',34,'white',700)}${circle(700,395,23,accent)}${text(687,404,'✓',27,'white')}</g>`;
  } else if(key==='editorial') {
    s+=rect(55,95,6,310,accent)+text(82,145,'为什么还需要 Skill？',51,fg,700);
    s+=rect(82,185,800*p,52,accent)+text(98,221,'能力之外，还需要可重复的工作方法',30,bg,600);
    for(let i=0;i<3;i++){let x=82+i*270;s+=rect(x,280,245,112,'#E5DCCB',5)+text(x+18,326,['需求','分镜','验收'][i],33,fg,700)+text(x+18,361,['先说明目的','再组织画面','最后核对结果'][i],20,fg);if(i<2)s+=line(x+247,336,x+267,336,accent,3);}
    s+=text(82,440,'概念关系示意 · 不代表模型评测结果',18,'#706755');
  } else if(key==='data') {
    s+=text(60,130,'让证据说话',52,fg,700)+text(62,166,'示例数据 · 无真实业务含义',21,accent);
    const vals=[35,65,85];
    vals.forEach((v,i)=>{const x=120+i*265,h=v*2.5*p;s+=rect(x,430-h,150,h,i===2?accent:'#355067',5)+text(x,470,['方案 A','方案 B','方案 C'][i],25)+text(x,415-h,`${Math.round(v*p)}%`,30,fg,700)});
    s+=line(85,430,875,430,'#8EA2B1');
  } else if(key==='paper') {
    [-5,3,-2].forEach((a,i)=>{const x=55+i*293,y=180+(i%2)*25;s+=`<g transform="rotate(${n(a*p)} ${x+130} ${y+115})">${rect(x+5,y+7,265,210,'#BBB4A7')}${rect(x,y,265,210,'#FFF8E8')}${rect(x+80,y-10,100,24,'#B9C6A8')}${text(x+23,y+62,['先有问题','再找线索','形成判断'][i],31,fg,700)}${line(x+23,y+94,x+230*q,y+94,accent,5)}${text(x+23,y+145,['别急着选工具','保留真实来源','也写清楚边界'][i],23)}</g>`;});
    s+=text(65,108,'把想法，一张张拼清楚。',46,fg,700);
  } else if(key==='ink') {
    s+=text(60,118,'让一个想法，有表情。',48,fg,600);
    const wobble=Math.sin(Math.floor(t*6))*1.2, cy=300-8*Math.sin(t*2);
    s+=`<g transform="translate(${n(wobble)},0)">${circle(340,cy,91,'#DDAF83',fg,4)}${circle(312,cy-13,6,fg)}${circle(366,cy-13,6,fg)}<path d="M315 ${n(cy+26)} Q340 ${n(cy+52*p)} 370 ${n(cy+22)}" fill="none" stroke="${fg}" stroke-width="4"/>${line(310,cy+86,290,430,fg,4)}${line(370,cy+86,390,430,fg,4)}${line(430,cy,490,cy-60*p,fg,4)}</g>`;
    s+=circle(620,240,60,accent)+text(594,262,'!',66,bg,700)+text(510,365,'先想明白，再动起来',27,fg,500)+line(220,436,450,436,fg,3);
  } else if(key==='spatial') {
    s+=text(60,120,'把复杂关系，放进空间。',44,fg,700)+text(62,158,'二维投影 · 空间示意',20,accent);
    const nodes=Array.from({length:6},(_,i)=>{const a=i*Math.PI/3+t*.14;return [480+270*Math.cos(a),310+105*Math.sin(a)];});
    nodes.forEach(([x,y],i)=>{s+=line(480,310,x,y,'#6B698C',2);let [nx,ny]=nodes[(i+1)%6];s+=line(x,y,nx,ny,'#514E70',2);});
    nodes.forEach(([x,y],i)=>{s+=circle(x,y,29+p*7,i===2?accent:'#35354D')+text(x-12,y+8,String(i+1),24,i===2?bg:fg,600)});
    s+=circle(480,310,65,accent)+text(440,320,'核心',32,bg,700);
  } else if(key==='rhythm') {
    s+=text(60,112,'节奏，也有形状。',48,fg,700)+text(62,150,'120 BPM · 无声节拍示意',20,accent);
    for(let i=0;i<7;i++){const x=110+i*123,h=55+125*(.5+.5*Math.sin(t*Math.PI*4-i*.65));s+=rect(x,440-h,64,h,i%2?fg:accent,32);}
    s+=circle(810,114,18+10*pulse,accent)+line(62,468,895,468,fg,2);
  } else if(key==='terminal') {
    s+=text(60,112,'把操作，变成看得懂的过程。',43,fg,700);
    s+=rect(62,155,836,310,'#14231B',12)+circle(89,180,6,'#D47865')+circle(110,180,6,'#E6C36C')+circle(131,180,6,accent);
    const commands=['$ read BRIEF.md','> 目标：解释一个真实问题','> 加载视觉规则…','> 检查分镜与关键帧','✓ 预览已准备'];
    const count=Math.min(commands.length,Math.floor(t/.65)+1);
    for(let i=0;i<count;i++)s+=text(89,235+i*43,commands[i],27,i===4?accent:fg,i===4?700:400);
    if(count<5)s+=rect(91+Math.min(commands[count-1].length,25)*16,213+(count-1)*43,11,27,Math.floor(t*2)%2?accent:'#14231B');
  } else if(key==='isometric') {
    s+=text(58,117,'一个任务，经过三道工序。',46,fg,700);
    const poly=(pts,fill)=>`<polygon points="${pts}" fill="${fill}"/>`;
    for(let i=0;i<3;i++){const x=210+i*260,y=280+i*26-24*p;const h=55;
      if(i<2)s+=line(x+80,y+48,x+205,y+60,accent,5);
      s+=poly(`${x},${y} ${x+100},${y+48} ${x},${y+96} ${x-100},${y+48}`,i===1?accent:'#8BBDB1');
      s+=poly(`${x-100},${y+48} ${x},${y+96} ${x},${y+96+h} ${x-100},${y+48+h}`,'#4F8A7D');
      s+=poly(`${x},${y+96} ${x+100},${y+48} ${x+100},${y+48+h} ${x},${y+96+h}`,'#326557');
      s+=text(x-35,y+61,['需求','制作','复核'][i],27,'#FFFFFF',600);
    }
    s+=text(60,464,'等距投影示意 · 各工序有明确输入与输出',21,fg);
  } else if(key==='pixel') {
    s+=text(60,110,'把复杂任务，拆成关卡。',46,fg,700);
    for(let i=0;i<12;i++)s+=rect(56+i*72,410,58,28,i%2?accent:'#6B6FB1');
    const px=100+Math.floor(t*2)*32;
    s+=rect(px,292,32,32,accent)+rect(px-16,324,64,48,accent)+rect(px-16,372,16,28,fg)+rect(px+32,372,16,28,fg)+rect(px+18,302,8,8,bg);
    const labels=['理解需求','建立规则','检查画面'];
    for(let i=0;i<3;i++){const x=355+i*180;s+=rect(x,220,148,94,'#353B70')+text(x+14,257,`0${i+1}`,25,accent,700)+text(x+14,291,labels[i],24,fg);}
    s+=text(60,476,'像素场景示意 · 非真实游戏录屏',20,fg);
  } else if(key==='blueprint') {
    for(let x=0;x<960;x+=40)s+=line(x,72,x,480,'#315588',1);
    for(let y=80;y<480;y+=40)s+=line(40,y,920,y,'#315588',1);
    s+=text(60,122,'先定义结构，再搭建。',48,fg,700);
    s+=`<rect x="240" y="200" width="480" height="230" fill="none" stroke="${fg}" stroke-width="3"/>`;
    s+=line(400,200,400,430,fg)+line(560,200,560,430,fg)+line(240,315,720,315,fg);
    const dw=480*q;s+=line(240,462,240+dw,462,accent,2)+line(240,452,240,472,accent)+line(720,452,720,472,accent);
    s+=text(420,492,'6 列网格示意',22,accent)+text(270,270,'内容',32)+text(430,270,'层级',32)+text(590,270,'动作',32);
    s+=circle(480,370,30,'none',accent,3)+line(480,338,480,400,accent)+line(448,370,512,370,accent);
  } else if(key==='risograph') {
    s+=text(58,124,'让想法，留下印记。',51,fg,800);
    s+=circle(345,315,128,accent)+circle(365+Math.sin(t)*5,315,128,'none',fg,4);
    for(let y=205;y<440;y+=13)for(let x=220;x<475;x+=13)if((x-345)**2+(y-315)**2<128**2)s+=circle(x,y,1.7,'#F2E3CC');
    s+=text(555,260,'01 / 规则',38,fg,700)+text(555,321,'02 / 表达',38,fg,700)+text(555,382,'03 / 复核',38,fg,700);
    s+=line(555,412,555+300*q,412,accent,9);
    s+=text(60,479,'双色 · 网点 · 轻微套色错位',21,fg);
  } else if(key==='monoline') {
    s+=text(58,119,'只保留，解释所需的线。',46,fg,600);
    const xs=[175,480,785];
    xs.forEach((x,i)=>{s+=`<rect x="${x-80}" y="230" width="160" height="140" rx="16" fill="none" stroke="${fg}" stroke-width="3"/>`+text(x-49,310,['想法','方法','结果'][i],32,fg);if(i<2)s+=line(x+80,300,x+80+145*q,300,fg,3);});
    s+=circle(175,220,25,bg,fg,3)+text(168,228,'1',22,fg)+circle(480,220,25,bg,fg,3)+text(473,228,'2',22,fg)+circle(785,220,25,bg,fg,3)+text(778,228,'3',22,fg);
    s+=text(60,452,'无纹理、无阴影，让关系本身成为主角。',24,fg);
  } else if(key==='comic') {
    s+=text(58,111,'一个问题，三个反应。',46,fg,800);
    for(let i=0;i<3;i++){const x=58+i*303;s+=`<rect x="${x}" y="167" width="276" height="287" fill="${i===2?accent:'#FFFDF3'}" stroke="${fg}" stroke-width="5"/>`;
      s+=circle(x+138,335,52,i===2?bg:'#F1DCB0',fg,4)+circle(x+121,329,4,fg)+circle(x+154,329,4,fg);
      const mouth=i===0?'M-16 22 Q0 5 16 22':i===1?'M-12 18 L12 18':'M-16 16 Q0 40 16 16';
      s+=`<path d="${mouth}" transform="translate(${x+138},335)" stroke="${fg}" fill="none" stroke-width="3"/>`;
      s+=text(x+22,222,['只说高级？','还是太抽象。','说清规则！'][i],30,fg,700)+text(x+22,420,`0${i+1}`,24,fg,700);
    }
    s+=line(70,478,70+815*q,478,fg,4);
  } else if(key==='timeline') {
    s+=text(58,122,'把过程，按证据展开。',48,fg,700);
    s+=line(95,290,95+770*p,290,accent,4);
    const titles=['提出问题','补充来源','调整判断'];
    for(let i=0;i<3;i++){const x=115+i*350;s+=circle(x,290,12,accent)+text(x-18,250,`0${i+1}`,32,accent,700)+text(x-18,350,titles[i],32,fg,600)+text(x-18,393,['当时的假设','可核对的材料','仍保留的疑问'][i],21,fg);}
    s+=text(60,469,'叙述顺序示意 · 不虚构日期和历史事件',20,fg);
  } else if(key==='map') {
    s+=text(58,119,'用一条路线，解释变化。',47,fg,700);
    s+=`<path d="M130 220 L300 175 L435 225 L615 185 L800 245 L844 385 L680 424 L500 388 L340 439 L180 385 Z" fill="#BDCEB1" stroke="#99B18E" stroke-width="2"/>`;
    for(let i=0;i<5;i++)s+=line(190+i*135,200,230+i*120,415,'#D5E0CA',6);
    const routeLength=620*q;
    s+=`<path d="M210 353 Q340 190 475 320 T765 285" stroke="${accent}" stroke-width="7" fill="none" stroke-dasharray="${n(routeLength)} 1000"/>`;
    s+=circle(210,353,12,fg)+circle(765,285,12,accent)+text(170,396,'起点',28,fg,700)+text(730,251,'目标',28,fg,700)+text(60,476,'抽象路径示意 · 非真实地理边界或导航',20,fg);
  } else if(key==='collage') {
    s+=rect(55,113,525,91,fg)+text(74,179,'先给一个好问题。',55,bg,800);
    s+=`<g transform="rotate(-4 255 316)">${rect(72,245,365,150,'#D9D2BD')}${text(95,301,'CONTEXT',39,fg,800)}${line(95,325,395,325,fg,3)}${text(95,366,'把事实放回上下文',25,fg)}</g>`;
    s+=`<g transform="rotate(5 704 317)">${rect(505,240,370,178,accent)}${text(533,306,'再做视觉表达',43,bg,800)}${text(535,362,'别让形式抢走重点',25,bg)}</g>`;
    s+=circle(800,170,50,'none',accent,9)+line(402,427,692+40*p,443,fg,11)+text(60,491,'标题块 · 裁切 · 套叠的编辑节奏',20,fg);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="${esc(label)}风格示意"><rect width="960" height="540" fill="${bg}"/><g font-family="PingFang SC,Microsoft YaHei,Noto Sans CJK SC,sans-serif">${text(42,43,`MUZI / ${key.toUpperCase()} / STYLE STUDY`,17,accent,600)}${s}${text(42,518,`${label} · 原创风格示意 / 非模型实测`,16,fg)}</g></svg>`;
}

# 木子 · 视频风格导演

**让“高级一点”变成具体的画面、动作和验收标准。**

面向 Claude Code / Codex 等编码助手的中文视频制作 skill。围绕 Opus 5.5 代码视频生态做公开资料研究，独立编写 18 套风格规则与一条从简报到验收的工作流。

[下载单技能 ZIP](downloads/muzi-video-style-director.zip) · [发给智能体代装](publishing/agent-install.md) · [查看技能正文](skills/muzi-video-style-director/SKILL.md) · [公开来源](skills/muzi-video-style-director/references/sources.md)

## 十八种风格，一眼选图

**18 张网上精选作品，一一对应 18 种风格。** 点击图片看原作；作者署名随图保留。这是视觉参考展示，不是本 skill 的生成效果。

| 风格展示 | 风格展示 | 风格展示 |
|---|---|---|
| **01 网格字体**<br>[![黄底红字的动态字体海报](https://cdn.dribbble.com/userupload/43575040/file/original-3be8db8bbf87c13395d089e6a8b5fc4b.png?resize=752x&vertical=center)](https://dribbble.com/shots/26107754-Dynamic-Typography-Force-31-Poster)<br>Begrip | **02 极简产品**<br>[![浅米色背景上的悬浮耳机产品渲染](https://images.unsplash.com/photo-1737291937135-3a0fcb5e0c44?fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.0.3&q=60&w=3000)](https://unsplash.com/photos/a-pair-of-headphones-floating-in-the-air-TpDhqQCWY0s)<br>Kamran Abdullayev | **03 编辑解释**<br>[![黄色知识海报用细胞图标、短说明和彩色箭头解释免疫系统关系。](https://shop-eu.kurzgesagt.org/cdn/shop/products/01_ImmuneInfo_Front.jpg?v=1633941430)](https://shop-eu.kurzgesagt.org/products/immune-infographic-poster)<br>Kurzgesagt |
| **04 证据图表**<br>[![紫底票房信息图，以粉色放射条、青色节点和黄色标记组织电影数据。](https://images.squarespace-cdn.com/content/v1/52ff7466e4b0ee230b3475c4/1551266940399-XZB4MNQW3RANJRYCXTMM/The%2Bmany%2Bmoons%2Bof%2BJupiter5.jpg)](https://www.jamesrounddesign.com/the-billion-dollar-film-club)<br>James Round | **05 纸张剪贴**<br>[![粉紫蓝层叠纸雕构成的宇宙与宇航员](https://cdn.dribbble.com/userupload/23355313/file/original-ba918b9cce273bb670c888d84b3a16f6.jpg?resize=1200x900)](https://dribbble.com/shots/4925783-Vibrant-Paper-Cut-Art-Toolkit-Spaceman)<br>Diana Hlevnjak | **06 手绘墨线**<br>[![细密黑白墨线刻画大小悬殊的鲸鱼群与微小潜水者，竖向排列形成震撼尺度感](https://images.squarespace-cdn.com/content/v1/58dd3787e6f2e1215e39c923/67fd8eb6-6e8e-414d-b201-660314ac94f3/3_Nico%2BDelort%2B-%2BAn%2BInterlude.jpg?format=2500w)](https://www.rootliterary.com/nicolas-delort)<br>Nico Delort |
| **07 空间结构**<br>[![黑底紫蓝橙色的透明空间光球](https://cdn.dribbble.com/userupload/44953737/file/still-93334749065a32b98ef1b91d5f9695d3.png)](https://dribbble.com/shots/26539318-Sphere-AI-Assistant)<br>AmazingUI | **08 节拍几何**<br>[![粉紫青蓝几何体组成的三维动效画面](https://cdn.dribbble.com/userupload/15896482/file/still-e9e31cf5ec032c5854d0d3fa737031fd.png?resize=1600x1200)](https://dribbble.com/shots/24623816-Blender-3D-Motion-Graphics)<br>Mahadie Reza | **09 终端代码**<br>[![深紫色终端监控界面，以等宽字符、彩色小图表和细线分栏展示系统状态。](https://user-images.githubusercontent.com/121260905/243478977-4542e8d3-1b7c-4d72-bdb0-b6dfdc4ebbb2.png)](https://github.com/rose-pine/btop)<br>Rosé Pine / MrSandman |
| **10 等距流程**<br>[![蓝紫霓虹灯照亮的等距微缩城市](https://cdn.dribbble.com/userupload/41923470/file/original-7cc5c99c3b73086787046f5a7fa25e0d.png)](https://dribbble.com/shots/3760609-Isometric-Neon-City)<br>Fabricio Rosa Marques | **11 像素游戏**<br>[![星空、满月与高架列车构成的像素城市夜景](https://cdn.dribbble.com/userupload/28129492/file/original-b538b88b8950424e0f497ba4ad05207e.png?resize=1600x1200)](https://dribbble.com/shots/13918636-City-Skyline-Pixel-Art)<br>PixelChickken | **12 蓝图工程**<br>[![蓝色网格底上的白线汽车工程图，包含侧视、俯视和正视图及尺寸标注。](https://imgproxy.fourthwall.dev/KqDb1D5OYsac2Hrf8WXlHZFMWI8ZcnqpDUvuDbsdqU8/w%3A1200/sm%3A1/enc/CiHhfz7Iwf_r30oo/qgvdgDVUkHAYZfiE/Ew4mzs12-R-tmroL/g9vmSE4eDIrBBxgs/3X8Yqej0j0PBoUsa/j78qnBM7YVJMndCY/efGGitaZBBm-yXPt/1wOPg1OAMgeJBUAU/cXdmrI9LIF2scMeX/TO_aG0zs6041rzSK/JBAA0v1oBVycER5q/-DH-Q8HAG6Mn6Oww/EW7cMrYFK9zh2e0P/Mxx68yGz-QhyCFZ8/qfAinoBWQJ0.png)](https://shop.beamng.com/en-usd/products/civetta-scintilla-blueprint-poster)<br>BeamNG |
| **13 复古印刷**<br>[![荧光粉绿黄套色的拟人饺子城市插画](https://cdn.dribbble.com/userupload/25704763/file/original-f4e8c7567a3ab99b3d0abd5eff9deae7.jpg?resize=1200x900)](https://dribbble.com/shots/9238225-Dumplin-City-Risograph)<br>Meneer Heirman | **14 黑白线稿**<br>[![统一黑白单线描绘观察、植物、沟通与成长等人物场景](https://cdn.dribbble.com/userupload/5817811/file/original-08b6e66d0f497b96f923fc3d1d65f321.png?resize=1600x1200)](https://dribbble.com/shots/21042804-Dhaka-but-make-it-monoline)<br>Streamlinehq | **15 漫画分镜**<br>[![蓝色天空、粉色伞与紫色机械构成的五格漫画，以物件特写和人物切换景别](https://images.squarespace-cdn.com/content/v1/646996fd7ff181388c2a58c8/1696203189088-QTSC8YP1UVOJTBTT6F3N/Rareflavors_002_interior_001_Promo.jpg)](https://www.boom-studios.com/archives/rare-flavours-2-first-look/)<br>Filipe Andrade（绘画）／Ram V（编剧） |
| **16 时间线纪录**<br>[![深色历史海报用连续蓝色曲线串起各时期的彩色地标与发明插画。](https://shop-eu.kurzgesagt.org/cdn/shop/files/01_EE_Humanity_Timeline_Poster_Front_04e8b0f1-c21c-4b09-8439-2b694ce9de8e.jpg?v=1749644314&width=2048)](https://shop-eu.kurzgesagt.org/products/timeline-of-human-history-poster)<br>Kurzgesagt | **17 地图路径**<br>[![绿色上海旅行插画地图，白色路线连接粉色节点与立体地标。](https://cdn.dribbble.com/userupload/21285599/file/original-76a11c77757cefb5828525951e30dd86.png)](https://dribbble.com/shots/2933163-Shanghai-city-map)<br>Iris Yuan | **18 编辑拼贴**<br>[![人像侧脸与红色自行车、报纸、绿叶组合成超现实拼贴](https://cdn.prod.website-files.com/66990a0685ac3ef09b7b110b/685efcc0fac203bf88a203c8_Gabriel_Russo_Collage_ri06-03-2025.jpg)](https://www.gabrielrus.so/collages)<br>Gabriel Russo |

[查看大图、来源和风格对应说明](skills/muzi-video-style-director/references/visual-inspiration.md) · [下载后打开完整画廊](examples/gallery.html)。外链图片需要联网。

## 直接发给智能体安装

不用自己敲命令。复制下面这段，发给有联网和文件权限的 Claude Code / Codex：

```text
请安装 https://github.com/muzilun000-gif/muzi-video-style-director
技能位于 skills/muzi-video-style-director。
识别当前平台的技能目录，完整保留 SKILL.md、references、assets 和 LICENSE。
已有同名技能先比较，不直接覆盖。安装后报告实际路径和是否已被识别。
如果无法安装，就读取 SKILL.md 及相关 references，在当前任务临时使用，说明未持久安装。
```

也可以把单技能 ZIP 发给智能体处理。[完整代装、临时使用与 ZIP 指令](publishing/agent-install.md)。安装技能不会自动提供模型订阅、视频引擎或平台发布权限。

## 本次同步更新（2026-11-01）

已同步本地 Claude 技能：新增内容讨论、知识动画片研究与参考片拆解、像素 MV 管线、动态歌词、代码合成音效、Canvas 无头渲染及视频验收脚本。完整保留在技能目录和单技能 ZIP 中。

包结构检查通过；新增工具仍需在使用环境中验证依赖及成片效果。

## 包含什么

- **18 套风格配方**：字体动效、极简产品、编辑解释、证据图表、纸张剪贴、手绘墨线、空间结构、节拍几何、终端代码、等距流程、像素游戏、蓝图工程、复古印刷、黑白线稿、漫画分镜、时间线纪录、地图路径、编辑拼贴。
- **中文制作流程**：明确观众、核心信息、分镜、配色、字体、动作、声音及验收。
- **18 张精选作品展示**：一张对应一种风格，首页、来源对照页与画廊使用同一份选图清单。
- **来源与借鉴点**：每张图附作者、作品入口和构图说明，便于向智能体讲清视觉目标。
- **14 个公开来源入口**：区分案例合集、实际 skill、动画框架和渲染引擎，并说明读取范围。
- **成本与结果边界**：不暗中调用付费 API；概念图、预览、MP4 和发布分别交代。

原来的 SVG 和代码动效保存在 `assets/basic-studies/` 与 `assets/basic-demo.html`，作为内部基础示意；默认画廊已切换为网上作品展示。

## 安装到 Claude Code

下载仓库 ZIP 并解压，打开终端进入解压后的本仓库目录。也可直接下载仓库 `downloads/` 中的单技能 ZIP，解压后得到 `muzi-video-style-director/`，再把它放入技能目录。

以下命令针对完整仓库 ZIP：

```bash
mkdir -p ~/.claude/skills
test ! -e ~/.claude/skills/muzi-video-style-director && \
  cp -R skills/muzi-video-style-director ~/.claude/skills/
```

若已存在同名文件夹，先比较版本，勿直接覆盖。新建 Claude Code 会话，输入：

```text
使用 muzi-video-style-director，做一个15秒竖屏解释片：
“AI会写代码，为什么还需要skill？”
风格用 kinetic，先给分镜和三张关键帧，再做动画。
不调用付费API，指标不要编造，交付源码并说明是否已导出MP4。
```

## 安装到 Codex

从目标项目目录，将仓库里的 `skills/muzi-video-style-director` 复制到项目的 `.agents/skills/`，保留完整文件夹。新开会话后使用 `$muzi-video-style-director`。

不要只复制 SKILL.md：`references/` 和 `assets/` 也要保留。网页对话环境是否支持上传 skill、运行浏览器和视频编码，取决于宿主能力；本包不保证所有 Claude 界面都可直接执行。

## 看图选风格

GitHub 首页直接展示 18 张图；[完整对照页](skills/muzi-video-style-director/references/visual-inspiration.md) 提供大图、作者与风格对应说明。

下载后用浏览器打开 [examples/gallery.html](examples/gallery.html)，查看深色卡片画廊。页面无额外依赖，图片通过外链加载，需联网；GitHub 文件页不会执行 HTML。离线时仍能读取风格名和作者链接。

原有可播放、拖动和导出 PNG 的 [基础代码演示](examples/basic-demo.html) 单独保留。这些基础画面不是网上作品的复刻，也不是 MP4。

## 导出与依赖

本技能负责设计与工作流，**不内置完整 MP4 渲染引擎**。可沿用已有 Remotion / HyperFrames / Canvas 渲染项目，或让助手依据当前官方文档配置。模型订阅、引擎许可、字体、音乐、TTS 和编码时间分别核算。

没有额外付费 API 也能做代码图形，但不代表免费无限使用模型或一键稳定生成任意视频。

## 校验

```bash
python3 scripts/check_package.py
```

该检查覆盖包结构、相对引用与 SVG 格式；浏览器视觉检查、模型实测和 MP4 验收是独立步骤。

## 来源、许可与署名

[来源索引](skills/muzi-video-style-director/references/sources.md) · [完整技能](skills/muzi-video-style-director/SKILL.md) · [抖音脚本及回复话术](publishing/douyin-script.md)

本包新增文字、示例代码、SVG 配图采用 MIT 许可。仓库文件与安装 ZIP 未打包第三方媒体；README 和视觉参考页通过外链展示第三方预览，版权归原作者，外部作品与项目的许可不由本仓库授予。非 Anthropic 官方产品；Claude、Opus、Codex 等名称归各自权利人。

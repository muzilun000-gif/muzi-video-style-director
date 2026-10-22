# 把链接发给智能体，让它代装

可以。你不用自己敲安装命令：把下面这段发给有联网、文件读写权限的 Claude Code、Codex 等智能体即可。下载文件、读到技能、被工具识别为已安装，是不同状态。

## 通用代装指令

```text
请帮我安装 muzi-video-style-director：
https://github.com/muzilun000-gif/muzi-video-style-director

技能子目录：skills/muzi-video-style-director

先识别当前智能体和可用的技能安装方式，读取该目录的 SKILL.md。
优先安装到当前项目的技能目录；如果当前没有项目，则使用当前平台支持的个人技能目录。
完整保留 SKILL.md、references/、assets/ 和 LICENSE，不能只复制一份 SKILL.md。
如果已有同名技能，先比较版本、保留现有内容，不直接覆盖。
不需要运行仓库里的制作脚本，也不需要安装视频引擎或调用付费 API。

完成后告诉我实际安装路径、哪些文件已落盘，以及是否已被当前平台识别。
文件复制完成但还没识别时，说明需要怎样刷新，不能直接说已经能用了。
若当前没有安装权限，就读取 SKILL.md 和与本次任务相关的 references，在当前会话临时使用，并明确“未持久安装”。

然后按这个技能，为“AI 会写代码，为什么还需要 skill？”做一个 15 秒竖屏视频方案，先给两种风格选择和三张关键帧方案。
```

Codex 也可以直接发送更短的一句：

```text
请用 $skill-installer 安装这个技能，并检查是否已被识别：
https://github.com/muzilun000-gif/muzi-video-style-director/tree/main/skills/muzi-video-style-director
保留整个技能目录；已有同名版本时先比较，不直接覆盖。
```

## 只想试一次，可以不安装

```text
本次先不安装。请读取以下仓库里的 skills/muzi-video-style-director/SKILL.md，
再按其中链接读取本次任务需要的 references 文件：
https://github.com/muzilun000-gif/muzi-video-style-director

在当前会话按这些规则帮我制作视频。先说明你实际读到了哪些文件；无法访问的部分明确说出来。
我的主题是：【填写主题】；平台：【抖音/B站/YouTube】；时长：【填写时长】。
```

临时读取只能保证本次上下文中有这些规则，不等于以后每次新对话都会自动加载。普通聊天窗口如果无法访问链接、解压或执行代码，仍可用它讨论分镜和风格，视频制作能力要看实际工具。

## 发 ZIP 也可以

把 [单技能 ZIP](../downloads/muzi-video-style-director.zip) 发给智能体，附一句：

> 请解压并检查这个技能包，将完整的 muzi-video-style-director 文件夹安装到当前平台支持的技能目录；若没有安装能力，就读取其中 SKILL.md 和相关 references，临时用于当前任务。请报告实际完成到哪一步。

聊天中上传 ZIP 本身不代表已安装；需要智能体实际解压、放到可发现的位置，或由平台的技能管理入口导入。

## 安装位置与核实来源

核对日期：2026-10-22。

| 平台 | 当前项目 | 个人范围 |
|---|---|---|
| Claude Code 本地会话 | `.claude/skills/muzi-video-style-director/` | `~/.claude/skills/muzi-video-style-director/` |
| Codex 本地技能发现 | `.agents/skills/muzi-video-style-director/` | `~/.agents/skills/muzi-video-style-director/` |

Claude Code 支持 `/muzi-video-style-director` 调用；本地技能目录与 Claude 账号中的云端技能不是同一位置。Codex 官方文档支持通过 `$skill-installer` 从其他仓库下载技能，并要求在新增技能没有出现时重启检查。参见 [Claude Code 技能官方文档](https://code.claude.com/docs/en/skills) 与 [OpenAI 技能官方文档](https://learn.chatgpt.com/docs/build-skills)。

不同版本的 Codex 安装器可能使用 `$CODEX_HOME/skills`（默认 `~/.codex/skills`）。因此代装指令优先让智能体读取自己当前安装器的说明，并在安装后报告路径和发现结果，不能只靠一个固定路径宣称成功。

本页说明已核对目录结构与官方文档；没有在每一种目标客户端执行安装实测。安装技能也不会自动赋予联网、图像生成、视频编码或平台发布权限。

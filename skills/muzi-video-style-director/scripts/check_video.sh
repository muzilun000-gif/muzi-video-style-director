#!/usr/bin/env bash
# MP4 acceptance check: streams, duration, size, fps, audio, and a full decode pass.
# Usage: check_video.sh out/video.mp4 [期望宽x高] [期望fps]
#   e.g. check_video.sh out/video.mp4 1080x1920 30
set -u
file="${1:-}"
want_size="${2:-}"
want_fps="${3:-}"

if [ -z "$file" ]; then
  echo "用法: check_video.sh <视频文件> [期望宽x高] [期望fps]" >&2
  exit 2
fi
if [ ! -s "$file" ]; then
  echo "❌ 文件不存在或为空: $file"
  exit 1
fi
if ! command -v ffprobe >/dev/null 2>&1 || ! command -v ffmpeg >/dev/null 2>&1; then
  echo "⚠️  没有找到 ffprobe/ffmpeg，无法验收视频（macOS 可用: brew install ffmpeg）。"
  echo "结果：未验证"
  exit 3
fi

fail=0
probe() { ffprobe -v error "$@" -of default=noprint_wrappers=1:nokey=1 "$file"; }
# ffprobe prints fields in its own order, so read each one by name.
vfield() { ffprobe -v error -select_streams v:0 -show_entries "stream=$1" -of default=noprint_wrappers=1:nokey=1 "$file" | head -1; }

if ! probe_error=$(ffprobe -v error -show_entries format=format_name -of default=noprint_wrappers=1:nokey=1 "$file" 2>&1 >/dev/null) || [ -n "$probe_error" ]; then
  echo "❌ 无法读取，文件可能损坏或没导出完整：$file"
  echo "$probe_error" | head -3
  exit 1
fi

duration=$(probe -show_entries format=duration)
vcodec=$(vfield codec_name)
ainfo=$(ffprobe -v error -select_streams a -show_entries stream=codec_name,sample_rate,channels -of csv=p=0 "$file")
subs=$(ffprobe -v error -select_streams s -show_entries stream=codec_name -of csv=p=0 "$file")

echo "文件：$file（$(du -h "$file" | cut -f1)）"
echo "时长：${duration}s"

if [ -z "$vcodec" ]; then
  echo "❌ 没有视频流"
  fail=1
else
  width=$(vfield width); height=$(vfield height)
  fps_raw=$(vfield r_frame_rate); pix_fmt=$(vfield pix_fmt)
  fps=$(awk -F/ '{ if ($2 > 0) printf "%.3f", $1/$2; else print $1 }' <<<"$fps_raw")
  echo "视频：$vcodec ${width}x${height} @ ${fps}fps ($pix_fmt)"
  if [ -n "$want_size" ] && [ "${width}x${height}" != "$want_size" ]; then
    echo "❌ 画幅是 ${width}x${height}，期望 $want_size"; fail=1
  fi
  if [ -n "$want_fps" ] && ! awk -v a="$fps" -v b="$want_fps" 'BEGIN { exit !((a-b)^2 < 0.0001) }'; then
    echo "❌ 帧率是 ${fps}，期望 $want_fps"; fail=1
  fi
  if [ "$pix_fmt" != "yuv420p" ]; then
    echo "⚠️  像素格式为 $pix_fmt；部分手机/平台只稳定支持 yuv420p"
  fi
fi

if [ -z "$ainfo" ]; then
  echo "音频：无（如果应该有原曲或旁白，这是问题）"
else
  echo "音频：$ainfo"
  vdur=$(probe -select_streams v:0 -show_entries stream=duration)
  adur=$(probe -select_streams a:0 -show_entries stream=duration)
  if [ -n "$vdur" ] && [ -n "$adur" ] && [ "$vdur" != "N/A" ] && [ "$adur" != "N/A" ]; then
    awk -v v="$vdur" -v a="$adur" 'BEGIN { d=v-a; if (d<0) d=-d; if (d>0.1) printf "⚠️  音视频时长相差 %.2fs（视频 %.2fs，音频 %.2fs）\n", d, v, a }'
  fi
  mv=$(ffmpeg -hide_banner -nostats -v info -i "$file" -map 0:a:0 -af volumedetect -f null - 2>&1 | grep -E "max_volume" | sed 's/.*max_volume: //')
  [ -n "$mv" ] && echo "音频峰值：$mv（接近 0 dB 可能削波）"
fi

[ -n "$subs" ] && echo "字幕轨：$subs（注意：字幕轨不等于歌词已烧进画面）"

echo "正在完整解码……"
decode_errors=$(ffmpeg -v error -i "$file" -f null - 2>&1)
if [ -n "$decode_errors" ]; then
  echo "❌ 解码出错："
  echo "$decode_errors" | head -20
  fail=1
else
  echo "解码：通过"
fi

if [ "$fail" -eq 0 ]; then
  echo "结果：结构检查通过（还需要看关键帧和试听，才算成片验收）"
else
  echo "结果：有问题"
fi
exit "$fail"

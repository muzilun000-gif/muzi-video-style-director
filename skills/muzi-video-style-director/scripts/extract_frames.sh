#!/usr/bin/env bash
# Grab still frames at given timestamps for visual review.
# Usage: extract_frames.sh out/video.mp4 frames/ 0 7.5 14.9
#   No timestamps: first frame, middle, and 0.1s before the end.
set -u
file="${1:-}"
outdir="${2:-}"
if [ -z "$file" ] || [ -z "$outdir" ]; then
  echo "用法: extract_frames.sh <视频文件> <输出目录> [秒数...]" >&2
  exit 2
fi
shift 2
if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
  echo "⚠️  没有找到 ffmpeg/ffprobe（macOS 可用: brew install ffmpeg）。"
  exit 3
fi
if [ ! -s "$file" ]; then
  echo "❌ 文件不存在或为空: $file"
  exit 1
fi
if ! d=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file" 2>/dev/null) || [ -z "$d" ] || [ "$d" = "N/A" ]; then
  echo "❌ 无法读取，文件可能损坏或没导出完整：$file"
  exit 1
fi
mkdir -p "$outdir"

times=("$@")
if [ ${#times[@]} -eq 0 ]; then
  times=(0 "$(awk -v d="$d" 'BEGIN { printf "%.2f", d/2 }')" "$(awk -v d="$d" 'BEGIN { t=d-0.1; if (t<0) t=0; printf "%.2f", t }')")
fi

fail=0
for t in "${times[@]}"; do
  if ! [[ "$t" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
    echo "❌ “$t” 不是有效的秒数"
    fail=1
    continue
  fi
  if ! awk -v t="$t" -v d="$d" 'BEGIN { exit !(t < d) }'; then
    echo "❌ ${t}s 不在视频范围内（0 – ${d}s）"
    fail=1
    continue
  fi
  name=$(printf "frame_%08.3fs.png" "$t")
  if ffmpeg -v error -y -ss "$t" -i "$file" -frames:v 1 "$outdir/$name" && [ -s "$outdir/$name" ]; then
    echo "✓ $outdir/$name"
  else
    echo "❌ 无法截取 ${t}s"
    fail=1
  fi
done
exit "$fail"

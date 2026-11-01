#!/usr/bin/env bash
# 镜头表：从视频按时间点截帧，拼成带时间码的网格图，一眼检查重复场景、空镜和构图。
# 用法: scripts/contact_sheet.sh <video.mp4> <输出.png> <列数> <秒数...>
#   例: scripts/contact_sheet.sh out/mv.mp4 out/sheet.png 6 3 10 18 25 40 55
#   不给秒数时，按 每 10 秒一张 自动取。
set -euo pipefail
if [ $# -lt 3 ]; then echo "用法: $0 <video> <out.png> <cols> [秒数...]"; exit 1; fi
command -v ffmpeg >/dev/null || { echo "未验证：找不到 ffmpeg"; exit 2; }
VID="$1"; OUT="$2"; COLS="$3"; shift 3
TIMES=("$@")
if [ ${#TIMES[@]} -eq 0 ]; then
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VID")
  TIMES=($(awk -v d="$DUR" 'BEGIN{for(t=2;t<d;t+=10) printf "%s ", t}'))
fi
TMP=$(mktemp -d)
i=0
FONT=""
for f in "/System/Library/Fonts/Supplemental/Arial.ttf" "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"; do
  [ -f "$f" ] && FONT="fontfile=$f:" && break
done
for t in "${TIMES[@]}"; do
  ffmpeg -v error -y -ss "$t" -i "$VID" -frames:v 1 \
    -vf "scale=480:-2,drawtext=${FONT}text='${t}s':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6" \
    "$TMP/$(printf %04d $i).png"
  i=$((i+1))
done
ROWS=$(( (i + COLS - 1) / COLS ))
ffmpeg -v error -y -framerate 1 -i "$TMP/%04d.png" -vf "tile=${COLS}x${ROWS}:padding=4:color=white" -frames:v 1 "$OUT"
rm -rf "$TMP"
echo "已生成 $OUT（$i 张，${COLS}x${ROWS}）"

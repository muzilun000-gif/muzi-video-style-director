#!/usr/bin/env bash
# 音频电平检查：输出整体响度、峰值，峰值高于 -0.5 dB 时提示有削波风险。
# 用法: scripts/audio_peak.sh <video或音频文件>
set -euo pipefail
if [ $# -lt 1 ]; then echo "用法: $0 <file>"; exit 1; fi
command -v ffmpeg >/dev/null || { echo "未验证：找不到 ffmpeg"; exit 2; }
OUT=$(ffmpeg -v info -i "$1" -vn -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume" || true)
[ -z "$OUT" ] && { echo "没有音轨"; exit 3; }
echo "$OUT" | sed 's/.*\] //'
MAX=$(echo "$OUT" | grep max_volume | sed -E 's/.*max_volume: (-?[0-9.]+) dB/\1/')
if awk -v m="$MAX" 'BEGIN{exit !(m > -0.5)}'; then
  echo "警告：峰值 ${MAX} dB 高于 -0.5 dB，AAC 播放时可能削波；建议重新封装时加 -af volume=-1.5dB"
  exit 4
fi
echo "峰值正常（${MAX} dB）"

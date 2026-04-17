#!/usr/bin/env bash
# compress-hero-videos.sh
#
# Compresses all hero banner videos using FFmpeg.
# - Converts to H.264 MP4 (web-optimized faststart)
# - CRF 26: high quality with ~60-75% file size reduction
# - Strips audio (videos are muted on the site)
# - Converts .mov → .mp4 in place
#
# REQUIREMENTS: FFmpeg must be installed.
#   Windows: https://www.gyan.dev/ffmpeg/builds/  (add to PATH)
#   Mac:     brew install ffmpeg
#
# USAGE (from project root):
#   bash scripts/compress-hero-videos.sh
#
# Original files are kept as *.original backups. Delete them once you're happy.

set -e

PUBLIC="public"
OPTS="-c:v libx264 -crf 26 -preset slow -movflags +faststart -an"

compress() {
  local input="$1"
  local output="$2"
  local scale="$3"   # e.g. "scale=1920:-2" or "scale=1080:-2"

  echo ""
  echo "▶  $input → $output"

  if [ ! -f "$PUBLIC/$input" ]; then
    echo "   ⚠  File not found, skipping."
    return
  fi

  # Backup original (skip if backup already exists)
  if [ ! -f "$PUBLIC/$input.original" ]; then
    cp "$PUBLIC/$input" "$PUBLIC/$input.original"
    echo "   ✓  Backed up → $input.original"
  fi

  ffmpeg -y -i "$PUBLIC/$input" $OPTS -vf "${scale}:flags=lanczos" "$PUBLIC/$output.tmp.mp4"
  mv "$PUBLIC/$output.tmp.mp4" "$PUBLIC/$output"
  echo "   ✓  Done → $output"
}

echo "================================================"
echo "  Naya Lumière — Hero Video Compression"
echo "================================================"

# ── Desktop videos (max 1920px wide) ────────────────────────────────────────
compress "Body protocol.mp4"                 "Body protocol.mp4"                 "scale='min(1920,iw)':-2"
compress "Double-Up Oxygenating Facial.mp4"  "Double-Up Oxygenating Facial.mp4"  "scale='min(1920,iw)':-2"

# ── Mobile videos (max 1080px wide, portrait) ───────────────────────────────
compress "ROUTINE 4.mp4"   "ROUTINE 4.mp4"   "scale='min(1080,iw)':-2"
compress "18012026.mov"    "18012026.mp4"     "scale='min(1080,iw)':-2"
compress "ROUTINE 3.mov"   "ROUTINE 3.mp4"   "scale='min(1080,iw)':-2"

echo ""
echo "================================================"
echo "  All done! Review the compressed files, then"
echo "  delete the *.original backups when satisfied."
echo "================================================"

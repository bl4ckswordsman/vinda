#!/usr/bin/env bash
# download-hdri.sh
# Downloads a free studio HDRI from Poly Haven for environment reflections.
# The app works without it (just dimmer reflections), but it greatly
# enhances the lava-glass material look.

set -e
mkdir -p static/hdri

echo "Downloading studio HDRI from Poly Haven (1K)..."
curl -L \
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr" \
  -o static/hdri/studio.hdr \
  --progress-bar

echo "✓ HDRI saved to static/hdri/studio.hdr"

# Vinda — Fidget Music Box PWA

A 3D fidget music box that plays melodies as you spin it. Works offline and is installable as a PWA.

## Tech Stack

- **Svelte 5 & SvelteKit**
- **Threlte v8** (Three.js 3D rendering)
- **Tone.js** (Audio sequencing)
- **@use-gesture/vanilla** (Drag physics)
- **@vite-pwa/sveltekit** (Service worker & offline support)

## Development Setup

Requires [Bun](https://bun.sh/).

```bash
# Install dependencies
bun install

# Generate PWA assets from icon.svg
bun run icons

# Start development server
bun run dev

# Build for production
bun run build

# Run project-wide unit/sanity tests
bun test

# Package private audio assets into a ZIP file
bun run package-private
```

## Testing & Private Tunes
* **Sanity Checks**: Run `bun test` to validate your manifest JSON files, check asset paths, and ensure icon mappings match SVG definitions.
* **Syncing Tracks**: Run `bun run package-private` to bundle local `.mp3` files from your private manifest into `private-tunes.zip`. Upload the ZIP online and click the **Sync** icon in the app to load them.

<details>
<summary><b>Assets & Attributions</b></summary>

- **Icons**: Icon designs are sourced from [Hugeicons](https://hugeicons.com/).
- **3D Model**: [Carousel Music Box](https://sketchfab.com/3d-models/carousel-music-box-cde6e0fbaeb249bca7dd822210f3b0e0) by [nina094842](https://sketchfab.com/nina094842) on Sketchfab.
</details>


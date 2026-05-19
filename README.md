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
```

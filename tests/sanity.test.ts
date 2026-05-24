import { expect, test, describe } from "bun:test";
import fs from 'fs';
import path from 'path';
import { cleanDropboxUrl, resolveAudioUrl } from "../src/lib/customTunesDb";

describe("Dropbox URL Parser Sanity Checks", () => {
  test("Should bypass non-Dropbox links", () => {
    const url = "https://example.com/file.zip";
    expect(cleanDropboxUrl(url)).toBe(url);
  });

  test("Should convert standard Dropbox links to direct download", () => {
    const rawUrl = "https://www.dropbox.com/s/abcdefgh/tunes.zip?dl=0";
    const expected = "https://dl.dropboxusercontent.com/s/abcdefgh/tunes.zip?dl=1";
    expect(cleanDropboxUrl(rawUrl)).toBe(expected);
  });

  test("Should handle Dropbox links with parameter key (scl)", () => {
    const rawUrl = "https://www.dropbox.com/scl/fi/xyz/tunes.zip?rlkey=123&dl=0";
    const expected = "https://dl.dropboxusercontent.com/scl/fi/xyz/tunes.zip?rlkey=123&dl=1";
    expect(cleanDropboxUrl(rawUrl)).toBe(expected);
  });
});

describe("Audio URL Resolution Sanity Checks", () => {
  test("Should preserve Object/Blob URLs", () => {
    const blobUrl = "blob:http://localhost:5173/a123-b456";
    expect(resolveAudioUrl(blobUrl)).toBe(blobUrl);
  });

  test("Should preserve absolute HTTP/HTTPS URLs", () => {
    const httpUrl = "https://my-server.com/song.mp3";
    expect(resolveAudioUrl(httpUrl)).toBe(httpUrl);
  });

  test("Should prefix local filenames with static audio directory path", () => {
    const localFile = "my-song.mp3";
    expect(resolveAudioUrl(localFile)).toBe("/audio/my-song.mp3");
  });
});

describe("Audio Manifest Integrity Sanity Checks", () => {
  const manifestPath = path.resolve("static/audio/manifest.json");

  test("Public manifest.json should exist and be valid JSON", () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const json = JSON.parse(raw);
    expect(Array.isArray(json)).toBe(true);
  });

  test("Public manifest.json should NOT contain copyrighted file-based tunes", () => {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    for (const tune of manifest) {
      // Assert that public manifest only contains sequenced tunes,
      // not physical audio file paths.
      expect(tune).not.toHaveProperty("file");
    }
  });

  const privateManifestPath = path.resolve("static/audio/manifest-private.json");

  test("Private manifest-private.json (if present) should be valid and match local files", () => {
    if (fs.existsSync(privateManifestPath)) {
      const raw = fs.readFileSync(privateManifestPath, "utf-8");
      const manifest = JSON.parse(raw);
      expect(Array.isArray(manifest)).toBe(true);

      for (const tune of manifest) {
        expect(tune).toHaveProperty("id");
        expect(tune).toHaveProperty("label");

        if (tune.file) {
          // If it is a file-based tune, verify the file exists on disk
          const audioFilePath = path.join("static/audio", tune.file);
          expect(fs.existsSync(audioFilePath)).toBe(true);
        } else {
          // Otherwise, it must be a valid sequenced tune
          expect(tune).toHaveProperty("notes");
          expect(tune).toHaveProperty("durations");
          expect(tune).toHaveProperty("bpm");
        }
      }
    } else {
      console.log("ℹ️ manifest-private.json not present in static/audio/, skipping private verification");
    }
  });
});

describe("Models Manifest & Assets Sanity Checks", () => {
  const modelsManifestPath = path.resolve("static/models/manifest.json");

  test("Models manifest.json should exist and be valid JSON", () => {
    expect(fs.existsSync(modelsManifestPath)).toBe(true);
    const raw = fs.readFileSync(modelsManifestPath, "utf-8");
    const json = JSON.parse(raw);
    expect(Array.isArray(json)).toBe(true);
  });

  test("Every model entry should be valid and referenced GLB files must exist", () => {
    const raw = fs.readFileSync(modelsManifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    for (const model of manifest) {
      expect(model).toHaveProperty("id");
      expect(model).toHaveProperty("label");
      expect(model).toHaveProperty("color");
      expect(model).toHaveProperty("file");

      // Verify color format is a valid hex color code
      expect(model.color).toMatch(/^#[0-9A-Fa-f]{3,6}$/);

      // If file is specified, verify that the 3D model asset exists on disk
      if (model.file) {
        const glbPath = path.join("static/models", model.file);
        expect(fs.existsSync(glbPath)).toBe(true);
      }
    }
  });
});

describe("Icon Mapping Integrity Sanity Checks", () => {
  test("All Category & Group Icons in icons.ts must be supported by Icon.svelte", () => {
    const iconSveltePath = path.resolve("src/lib/Icon.svelte");
    expect(fs.existsSync(iconSveltePath)).toBe(true);
    const svelteContent = fs.readFileSync(iconSveltePath, "utf-8");

    // Extract all icon names matched in conditional blocks in Icon.svelte
    const regex = /(?:#if|:else\s+if)\s+name\s*===\s*["']([^"']+)["']/g;
    const supportedIcons = new Set<string>();
    let match;
    while ((match = regex.exec(svelteContent)) !== null) {
      supportedIcons.add(match[1]);
    }

    // Import the category and group mappings
    const { CATEGORY_ICONS, GROUP_ICONS } = require("../src/lib/icons.ts");

    // Validate category icon bindings
    for (const [category, iconName] of Object.entries(CATEGORY_ICONS)) {
      if (iconName === "Default") continue; // Default maps to fallback folder icon
      expect(supportedIcons).toContain(iconName);
    }

    // Validate group icon bindings
    for (const [group, iconName] of Object.entries(GROUP_ICONS)) {
      if (iconName === "Default") continue; // Default maps to fallback folder icon
      expect(supportedIcons).toContain(iconName);
    }
  });
});

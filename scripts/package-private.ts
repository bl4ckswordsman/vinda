import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const AUDIO_DIR = path.resolve('static/audio');
const PRIVATE_MANIFEST_PATH = path.join(AUDIO_DIR, 'manifest-private.json');
const PUBLIC_MANIFEST_PATH = path.join(AUDIO_DIR, 'manifest.json');
const OUTPUT_ZIP_PATH = path.resolve('private-tunes.zip');

async function run() {
  console.log('📦 Starting private tunes packaging...');

  let privateTunes: any[] = [];

  // 1. Try to load git-ignored manifest-private.json first (preferred local workflow)
  if (fs.existsSync(PRIVATE_MANIFEST_PATH)) {
    console.log(`📄 Using local private manifest: ${PRIVATE_MANIFEST_PATH}`);
    try {
      const manifestRaw = fs.readFileSync(PRIVATE_MANIFEST_PATH, 'utf-8');
      privateTunes = JSON.parse(manifestRaw);
    } catch (err) {
      console.error('❌ Error parsing manifest-private.json:', err);
      process.exit(1);
    }
  } 
  // 2. Fall back to scanning the public manifest.json for file-based entries
  else if (fs.existsSync(PUBLIC_MANIFEST_PATH)) {
    console.log(`📄 manifest-private.json not found. Scanning public manifest: ${PUBLIC_MANIFEST_PATH}`);
    try {
      const manifestRaw = fs.readFileSync(PUBLIC_MANIFEST_PATH, 'utf-8');
      const manifest = JSON.parse(manifestRaw);
      privateTunes = manifest.filter((tune: any) => 'file' in tune);
    } catch (err) {
      console.error('❌ Error parsing manifest.json:', err);
      process.exit(1);
    }
  } else {
    console.error('❌ Error: Neither manifest-private.json nor manifest.json was found in static/audio/');
    process.exit(1);
  }

  if (privateTunes.length === 0) {
    console.log('⚠️ No private tunes found to package.');
    return;
  }

  console.log(`🔍 Found ${privateTunes.length} private tunes:`);
  for (const tune of privateTunes) {
    console.log(`   - ${tune.label} (${tune.file})`);
  }

  const zip = new JSZip();

  // Create manifest-private.json content inside ZIP
  zip.file('manifest-private.json', JSON.stringify(privateTunes, null, 2));

  // Add each MP3 file to the ZIP
  for (const tune of privateTunes) {
    const filePath = path.join(AUDIO_DIR, tune.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Warning: Audio file not found: ${filePath}. Skipping this file.`);
      continue;
    }
    const fileData = fs.readFileSync(filePath);
    zip.file(tune.file, fileData);
    console.log(`   Added to ZIP: ${tune.file}`);
  }

  // Generate ZIP file
  console.log('Generating ZIP archive...');
  try {
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(OUTPUT_ZIP_PATH, zipBuffer);
    console.log(`✅ Success! Packaged private tunes into: ${OUTPUT_ZIP_PATH}`);
    console.log('   You can upload this ZIP file to your cloud storage (e.g., Dropbox, Google Drive) for syncing.');
  } catch (err) {
    console.error('❌ Error generating ZIP archive:', err);
    process.exit(1);
  }
}

run();

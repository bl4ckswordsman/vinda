import JSZip from 'jszip';

export interface CustomTune {
  id: string;
  label: string;
  category: string;
  group?: string;
  blob?: Blob;
  notes?: string[];
  durations?: string[];
  bpm?: number;
  soundType?: 'music-box' | 'normal';
}

const isBrowser = typeof window !== 'undefined';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser) {
      reject(new Error('IndexedDB is only available in the browser.'));
      return;
    }
    const request = indexedDB.open('vinda-custom-audio', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('tunes')) {
        db.createObjectStore('tunes', { keyPath: 'id' });
      }
    };
  });
}

/** Get all custom tunes stored in IndexedDB. */
export async function getCustomTunes(): Promise<CustomTune[]> {
  if (!isBrowser) return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('tunes', 'readonly');
    const store = transaction.objectStore('tunes');
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/** Clear all custom tunes from IndexedDB. */
export async function clearCustomTunes(): Promise<void> {
  if (!isBrowser) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('tunes', 'readwrite');
    const store = transaction.objectStore('tunes');
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/** 
 * Unzips an archive Blob/ArrayBuffer, parses `manifest-private.json`,
 * extracts the MP3 files, and saves them to IndexedDB.
 * Returns the number of imported tunes.
 */
export async function importZip(zipData: ArrayBuffer | Blob): Promise<number> {
  if (!isBrowser) return 0;

  // Load ZIP archive
  const zip = await JSZip.loadAsync(zipData);

  // Find manifest-private.json in the zip (case-insensitive, can be in a folder)
  let manifestFile: JSZip.JSZipObject | null = null;
  const paths = Object.keys(zip.files);
  for (const path of paths) {
    if (path.toLowerCase().endsWith('manifest-private.json')) {
      if (Object.prototype.hasOwnProperty.call(zip.files, path)) {
        manifestFile = zip.file(path);
        break;
      }
    }
  }

  if (!manifestFile) {
    throw new Error('Could not find manifest-private.json in the ZIP archive.');
  }

  const manifestText = await manifestFile.async('text');
  let manifest: any;
  try {
    manifest = JSON.parse(manifestText);
  } catch (err) {
    throw new Error('Failed to parse manifest-private.json. Verify it is valid JSON.');
  }

  if (!Array.isArray(manifest)) {
    throw new Error('manifest-private.json must be a JSON array of tunes.');
  }

  // Load and read all entries from the ZIP asynchronously first
  const recordsToInsert: CustomTune[] = [];

  for (const entry of manifest) {
    if (!entry.id || !entry.label) {
      continue; // Skip invalid entries
    }

    if (entry.file) {
      // Locate the matching audio file inside the ZIP (basename case-insensitive match)
      const fileBase = entry.file.split('/').pop()?.toLowerCase() || entry.file.toLowerCase();
      let audioFile: JSZip.JSZipObject | null = null;
      const audioPaths = Object.keys(zip.files);
      for (const path of audioPaths) {
        // Skip macOS/OS resource forks and hidden files
        const isResourceFork = path.includes('__MACOSX') || path.split('/').pop()?.startsWith('._') || path.split('/').pop()?.startsWith('.');
        if (isResourceFork) continue;

        const pathBase = path.split('/').pop()?.toLowerCase() || path.toLowerCase();
        if (pathBase === fileBase) {
          if (Object.prototype.hasOwnProperty.call(zip.files, path)) {
            audioFile = zip.file(path);
            break;
          }
        }
      }

      if (!audioFile) {
        console.warn(`Audio file ${entry.file} not found in the ZIP archive. Skipping.`);
        continue;
      }

      // Extract the blob asynchronously BEFORE starting the transaction
      const blob = await audioFile.async('blob');

      recordsToInsert.push({
        id: entry.id,
        label: entry.label,
        category: entry.category || 'Games',
        group: entry.group,
        soundType: entry.soundType,
        blob
      });
    } else if (entry.notes && entry.durations) {
      // Sequenced tune
      recordsToInsert.push({
        id: entry.id,
        label: entry.label,
        category: entry.category || 'Games',
        group: entry.group,
        soundType: entry.soundType || 'music-box',
        notes: entry.notes,
        durations: entry.durations,
        bpm: entry.bpm || 80
      });
    }
  }

  // Clear previous custom tunes before writing the new pack
  await clearCustomTunes();

  // Open the database and write all files synchronously in a single transaction
  const db = await openDb();
  const transaction = db.transaction('tunes', 'readwrite');
  const store = transaction.objectStore('tunes');

  for (const record of recordsToInsert) {
    store.put(record);
  }

  // Await the transaction completion to guarantee data is saved
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(new Error('Transaction aborted'));
  });

  return recordsToInsert.length;
}

/** Converts standard Dropbox sharing URLs into direct, CORS-friendly download URLs. */
export function cleanDropboxUrl(url: string): string {
  let cleaned = url.trim();
  if (cleaned.includes('dropbox.com')) {
    cleaned = cleaned.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    if (cleaned.includes('dl=0')) {
      cleaned = cleaned.replace('dl=0', 'dl=1');
    } else if (!cleaned.includes('dl=')) {
      cleaned += (cleaned.includes('?') ? '&' : '?') + 'dl=1';
    }
  }
  return cleaned;
}

/**
 * Resolves a URL to a Blob and its resolved ZIP URL. If the URL points to a JSON file, 
 * it fetches and parses the JSON, then resolves the zipUrl string within it.
 */
export async function fetchZipFromUrl(url: string): Promise<{ blob: Blob; resolvedUrl: string }> {
  const targetUrl = cleanDropboxUrl(url);
  const response = await fetch(targetUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch. HTTP status: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = targetUrl.toLowerCase().split('?')[0].endsWith('.json') || contentType.includes('application/json');

  if (isJson) {
    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (err: any) {
      throw new Error(`Failed to parse JSON manifest: ${err.message}`);
    }

    const zipUrl = data.url || data.zipUrl || data.latestZipUrl || data.zip;
    if (!zipUrl || typeof zipUrl !== 'string') {
      throw new Error('JSON manifest does not contain a valid "url" or "zipUrl" string field.');
    }

    const cleanZipUrl = cleanDropboxUrl(zipUrl);
    const zipResponse = await fetch(cleanZipUrl);
    if (!zipResponse.ok) {
      throw new Error(`Failed to fetch ZIP from manifest redirect. HTTP status: ${zipResponse.status}`);
    }
    const blob = await zipResponse.blob();
    return { blob, resolvedUrl: cleanZipUrl };
  }

  const blob = await response.blob();
  return { blob, resolvedUrl: targetUrl };
}

/**
 * Checks if there is a saved manifest/ZIP URL and, if so, fetches the latest 
 * manifest in the background. If the ZIP URL has changed, it silently downloads
 * and imports it. Returns true if an update was successfully synced.
 */
export async function runBackgroundSync(): Promise<boolean> {
  if (!isBrowser) return false;
  const savedManifestUrl = localStorage.getItem('vinda-custom-tunes-url');
  if (!savedManifestUrl) return false;

  try {
    const { blob, resolvedUrl } = await fetchZipFromUrl(savedManifestUrl);
    const lastSyncedZip = localStorage.getItem('vinda-custom-tunes-last-synced-zip');

    if (lastSyncedZip === resolvedUrl) {
      return false; // Already up to date!
    }

    // Import the new ZIP in the background
    await importZip(blob);
    localStorage.setItem('vinda-custom-tunes-last-synced-zip', resolvedUrl);
    return true;
  } catch (err) {
    // Fail silently in the background to not disrupt offline / normal play
    console.warn('Silent custom tunes background sync skipped:', err);
    return false;
  }
}

/** Resolves a tune filename or URL to the correct Tone.js source URL. */
export function resolveAudioUrl(tuneFile: string): string {
  return tuneFile.startsWith('blob:') || tuneFile.startsWith('http')
    ? tuneFile
    : `/audio/${tuneFile}`;
}


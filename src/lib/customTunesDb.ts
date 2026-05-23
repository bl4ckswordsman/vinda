import JSZip from 'jszip';

export interface CustomTune {
  id: string;
  label: string;
  category: string;
  group?: string;
  blob: Blob;
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
  for (const path in zip.files) {
    if (path.toLowerCase().endsWith('manifest-private.json')) {
      manifestFile = zip.files[path];
      break;
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
    if (!entry.id || !entry.label || !entry.file) {
      continue; // Skip invalid entries
    }

    // Locate the matching audio file inside the ZIP (basename case-insensitive match)
    const fileBase = entry.file.split('/').pop()?.toLowerCase() || entry.file.toLowerCase();
    let audioFile: JSZip.JSZipObject | null = null;
    for (const path in zip.files) {
      const pathBase = path.split('/').pop()?.toLowerCase() || path.toLowerCase();
      if (pathBase === fileBase) {
        audioFile = zip.files[path];
        break;
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
      blob
    });
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

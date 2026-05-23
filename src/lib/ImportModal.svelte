<script lang="ts">
  import { onMount } from 'svelte';
  import { importZip, getCustomTunes, clearCustomTunes, cleanDropboxUrl } from './customTunesDb';
  import Icon from './Icon.svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess: () => void;
  }

  let { isOpen, onClose, onImportSuccess }: Props = $props();

  let tunesCount = $state(0);
  let syncUrl = $state('');
  let dragOver = $state(false);
  let status = $state<{ type: 'success' | 'error' | 'loading' | 'idle'; message: string }>({
    type: 'idle',
    message: ''
  });

  onMount(async () => {
    syncUrl = localStorage.getItem('vinda-custom-tunes-url') || '';
    await refreshStatus();
  });

  async function refreshStatus() {
    try {
      const list = await getCustomTunes();
      tunesCount = list.length;
    } catch (err) {
      console.error(err);
    }
  }



  async function handleZipFile(file: File) {
    if (!file.name.endsWith('.zip')) {
      status = { type: 'error', message: 'Only ZIP files are supported.' };
      return;
    }

    status = { type: 'loading', message: 'Extracting and importing tunes...' };

    try {
      const count = await importZip(file);
      status = { 
        type: 'success', 
        message: `Successfully imported ${count} tune(s) into your browser!` 
      };
      await refreshStatus();
      onImportSuccess();
    } catch (err: any) {
      status = { 
        type: 'error', 
        message: err.message || 'Failed to extract and import private tunes.' 
      };
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    dragOver = true;
  }

  function onDragLeave() {
    dragOver = false;
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleZipFile(file);
    }
  }

  function onFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      handleZipFile(file);
    }
  }

  async function handleSyncFromUrl() {
    if (!syncUrl.trim()) return;

    status = { type: 'loading', message: 'Downloading tunes from URL...' };
    localStorage.setItem('vinda-custom-tunes-url', syncUrl.trim());

    try {
      const targetUrl = cleanDropboxUrl(syncUrl);
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch ZIP. HTTP status: ${response.status}`);
      }

      const blob = await response.blob();
      const count = await importZip(blob);

      status = { 
        type: 'success', 
        message: `Successfully synced ${count} tune(s) from URL!` 
      };
      await refreshStatus();
      onImportSuccess();
    } catch (err: any) {
      let msg = err.message || 'Failed to sync from URL.';
      // Check if it looks like a CORS error (fetch failed without status)
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        msg = 'CORS Error: The host blocks browser downloads. Try uploading the ZIP directly, or use a provider supporting CORS (like Dropbox direct links, GitHub Releases, or a personal server).';
      }
      status = { type: 'error', message: msg };
    }
  }

  async function handleClear() {
    if (!confirm('Are you sure you want to delete all imported tunes?')) return;
    status = { type: 'loading', message: 'Clearing database...' };
    try {
      await clearCustomTunes();
      status = { type: 'success', message: 'All custom tunes removed.' };
      await refreshStatus();
      onImportSuccess();
    } catch (err: any) {
      status = { type: 'error', message: err.message || 'Failed to clear custom tunes.' };
    }
  }

  // Handle keyboard ESC to close
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
  <!-- Backdrop -->
  <div 
    class="modal-backdrop" 
    onclick={(e) => e.target === e.currentTarget && onClose()} 
    onkeydown={(e) => e.key === 'Escape' && onClose()}
    role="button" 
    tabindex="-1"
    aria-label="Close dialog backdrop"
  >
    <!-- Modal container -->
    <div class="modal-container" role="dialog" aria-labelledby="modal-title" aria-modal="true">
      <header class="modal-header">
        <h2 id="modal-title">Private Tunes Sync</h2>
        <button class="close-btn" onclick={onClose} aria-label="Close dialog">&times;</button>
      </header>

      <div class="modal-body">
        <p class="description">
          Add copyrighted tracks (like Kirby or Mario themes) securely to your browser.
          Upload a ZIP containing a <code>manifest-private.json</code> and its MP3 files. Everything runs locally in your browser.
        </p>

        <!-- Library Status -->
        <div class="library-status">
          <div class="status-info">
            <span class="status-label">Local Custom Library</span>
            <span class="status-count">{tunesCount} tune(s) loaded</span>
          </div>
          {#if tunesCount > 0}
            <button class="danger-btn" onclick={handleClear}>Clear Library</button>
          {/if}
        </div>

        <!-- Section 1: Drag & Drop ZIP -->
        <div 
          class="dropzone" 
          class:dragover={dragOver}
          ondragover={onDragOver}
          ondragleave={onDragLeave}
          ondrop={onDrop}
          role="presentation"
        >
          <input type="file" id="zip-file-input" accept=".zip" onchange={onFileSelect} class="file-input" />
          <label for="zip-file-input" class="file-label">
            <Icon name="Classical" size={28} />
            <span>Drag & drop <code>private-tunes.zip</code> here or <strong>browse</strong></span>
          </label>
        </div>

        <!-- Section 2: Sync from URL -->
        <div class="url-sync-section">
          <h3>Sync from URL</h3>
          <div class="url-input-group">
            <input 
              type="url" 
              placeholder="https://example.com/private-tunes.zip" 
              bind:value={syncUrl} 
              aria-label="Private tunes ZIP URL" 
            />
            <button 
              class="primary-btn" 
              onclick={handleSyncFromUrl} 
              disabled={!syncUrl.trim() || status.type === 'loading'}
            >
              Sync
            </button>
          </div>
          <span class="hint">
            Supports Dropbox sharing links (auto-converts to CORS-friendly URL) and GitHub release assets.
          </span>
        </div>

        <!-- Status Alerts -->
        {#if status.type !== 'idle'}
          <div class="alert alert-{status.type}" role="alert">
            {#if status.type === 'loading'}
              <div class="spinner"></div>
            {/if}
            <p>{status.message}</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 16px;
  }

  .modal-container {
    width: 100%;
    max-width: 500px;
    background: var(--tray-bg);
    border: 1px solid var(--border);
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    color: var(--text);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    animation: scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes scaleUp {
    from {
      opacity: 0;
      transform: scale(0.92) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
  }

  .modal-header h2 {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 28px;
    line-height: 1;
    color: var(--text-muted);
    transition: color 0.15s;
  }

  .close-btn:hover {
    color: var(--text);
  }

  .modal-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
    max-height: 80dvh;
  }

  .description {
    font-size: 14px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .description code {
    background: var(--surface);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 13px;
    color: var(--text);
  }

  /* Library Status */
  .library-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
  }

  .status-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .status-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    font-weight: 600;
  }

  .status-count {
    font-size: 14px;
    font-weight: 500;
  }

  /* Buttons */
  .primary-btn {
    background: var(--accent);
    color: #0d0d0f;
    border: none;
    border-radius: 8px;
    padding: 0 16px;
    font-weight: 600;
    font-size: 14px;
    transition: background 0.15s;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .primary-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .primary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .danger-btn {
    background: var(--danger-bg);
    color: var(--danger-color);
    border: 1px solid var(--danger-border);
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.15s;
  }

  .danger-btn:hover {
    background: var(--danger-bg-hover);
    border-color: var(--danger-border-hover);
  }

  /* Dropzone */
  .dropzone {
    border: 2px dashed var(--border);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    transition: border-color 0.15s, background-color 0.15s;
    position: relative;
    background: rgba(255, 255, 255, 0.01);
  }

  .dropzone.dragover {
    border-color: var(--accent);
    background: rgba(181, 164, 245, 0.04);
  }

  .file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }

  .file-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    pointer-events: none;
    font-size: 14px;
    color: var(--text-muted);
  }

  .file-label code {
    background: var(--surface);
    padding: 1px 4px;
    border-radius: 4px;
  }

  .file-label strong {
    color: var(--accent);
  }

  /* URL Sync Section */
  .url-sync-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .url-sync-section h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
  }

  .url-input-group {
    display: flex;
    gap: 8px;
  }

  .url-input-group input {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0 12px;
    color: var(--text);
    font-size: 14px;
    height: 40px;
    outline: none;
    transition: border-color 0.15s;
  }

  .url-input-group input:focus {
    border-color: var(--border-active);
  }

  .hint {
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.4;
  }

  /* Alerts */
  .alert {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.45;
  }

  .alert-loading {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
  }

  .alert-success {
    background: rgba(72, 187, 120, 0.08);
    border: 1px solid rgba(72, 187, 120, 0.3);
    color: #48bb78;
  }

  .alert-error {
    background: var(--danger-bg);
    border: 1px solid var(--danger-border);
    color: var(--danger-color);
  }

  /* Loading Spinner */
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>

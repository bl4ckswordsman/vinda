<script lang="ts">
  import '../app.css';

  let { children } = $props();

  let updateReady = $state(false);

  $effect(() => {
    // @vite-pwa/sveltekit provides these virtual modules
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        onNeedRefresh() { updateReady = true; },
        onOfflineReady() { console.log('[vinda] App ready to work offline'); },
      });
    }).catch(() => {
      // Virtual module not available in dev without PWA devOptions.enabled
    });
  });
</script>

{@render children()}

{#if updateReady}
  <div class="update-banner" role="alert">
    <span>Update available</span>
    <button onclick={() => window.location.reload()}>Reload</button>
  </div>
{/if}

<style>
  .update-banner {
    position: fixed;
    bottom: 148px; /* above carousel tray */
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 10px 20px;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    z-index: 100;
    white-space: nowrap;
  }

  .update-banner button {
    background: rgba(255, 255, 255, 0.22);
    border: none;
    border-radius: 12px;
    color: #fff;
    padding: 6px 14px;
    cursor: pointer;
    min-height: 44px;
    font-size: 13px;
    font-weight: 600;
    transition: background 0.15s;
  }

  .update-banner button:hover {
    background: rgba(255, 255, 255, 0.35);
  }
</style>

<script lang="ts">
  // Must be rendered inside a <Canvas> to access useThrelte
  import { useThrelte } from '@threlte/core';
  import * as THREE from 'three';

  const { renderer } = useThrelte();

  $effect(() => {
    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = 2; // PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
    }
  });
</script>

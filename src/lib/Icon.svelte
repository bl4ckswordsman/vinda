<script lang="ts">
    import Play from "@lucide/svelte/icons/play";
    import Square from "@lucide/svelte/icons/square";
    import RotateCw from "@lucide/svelte/icons/rotate-cw";
    import Monitor from "@lucide/svelte/icons/monitor";
    import Moon from "@lucide/svelte/icons/moon";
    import Sun from "@lucide/svelte/icons/sun";
    import Music from "@lucide/svelte/icons/music";
    import Gamepad2 from "@lucide/svelte/icons/gamepad-2";
    import Folder from "@lucide/svelte/icons/folder";
    import Headphones from "@lucide/svelte/icons/headphones";
    import Layers from "@lucide/svelte/icons/layers";

    interface Props {
        name: string;
        size?: number;
    }

    let { name, size = 16 }: Props = $props();
</script>

{#if name === "Classical"}
    <Music {size} class="vinda-icon" />
{:else if name === "music"}
    <Music {size} class="vinda-icon" />
{:else if name === "headphones"}
    <Headphones {size} class="vinda-icon" />
{:else if name === "layers"}
    <Layers {size} class="vinda-icon" />
{:else if name === "Games"}
    <Gamepad2 {size} class="vinda-icon" />
{:else if name === "theme-system"}
    <Monitor {size} class="vinda-icon" />
{:else if name === "theme-dark"}
    <Moon {size} class="vinda-icon" />
{:else if name === "theme-light"}
    <Sun {size} class="vinda-icon" />
{:else if name === "play"}
    <Play {size} class="vinda-icon" fill="currentColor" />
{:else if name === "stop"}
    <Square {size} class="vinda-icon" fill="currentColor" />
{:else if name === "sync"}
    <RotateCw {size} class="vinda-icon" />
{:else if name === "Super Mario"}
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        class="vinda-icon"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2.0">
            <path stroke-linejoin="round" d="m4 12l-.858-1.928a1.8 1.8 0 0 1-.08-1.17C4.13 5.115 7.198 2 12 2s7.87 3.115 8.938 6.902c.109.387.07.797-.08 1.17L20 12" />
            <path stroke-linejoin="round" d="M18 10a9.96 9.96 0 0 0-6-2a9.96 9.96 0 0 0-6 2" />
            <path stroke-linejoin="round" d="M15 8c0-4-6-4-6 0m0 9c.5.433 2 .866 3 0c1 .866 2.5.433 3 0" />
            <path stroke-linejoin="round" d="m18.493 14.5l.5-1.5c.253-.577.819-1.001 1.498-1c1.117.002 1.577 1.04 1.5 2c-.173 2.175-1.115 4-3.498 4c-1.256 2.533-3.596 3.9-6.493 4c-2.897-.1-5.237-1.467-6.493-4c-2.383 0-3.325-1.825-3.499-4c-.076-.96.384-1.998 1.5-2c.68-.001 1.246.423 1.5 1l.499 1.5" />
            <path d="M9.125 13H9m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0Zm5.875 0H15m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0Z" />
        </g>
    </svg>
{:else if name === "Mario & Luigi"}
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        class="vinda-icon"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path
            d="M4 6c0 0 4 2 6 6 1-3 1-6 2-6s1 3 2 6c2-4 6-6 6-6 0 0-1 4-3 5 .5 1.5 1.5 3 3 4 .5 1.5.5 3 0 4.5C18 20 14 21 12 19c-2 2-6 1-8.5-.5-.5-1.5-.5-3 0-4.5 1.5-1 2.5-2.5 3-4C4.5 10 4.5 6 4 6Z"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        />
    </svg>
{:else if name === "Kirby"}
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        class="vinda-icon"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <g fill="none">
            <path fill="#fff" d="M15.747 4.727L12 2.71L8.253 4.726L.73 2.22v3.92l3.92 3.92v5.39L12 19.37l7.35-3.92v-5.39l3.92-3.92V2.22z" />
            <path fill="#bbd8ff" d="M6.784 16.565L4.16 18.86l.49 2.94l3.43-.49l.82-3.613zm10.43 0l2.626 2.295l-.49 2.94l-3.43-.49l-.82-3.613zM9.55 14.45V12h4.9v2.45L12 15.92z" />
            <path fill="#bbd8ff" d="m4.65 15.43l1.47-.98L12 17.39l5.88-2.94l1.47.98L12 19.35z" />
            <path stroke="#092f63" stroke-linecap="round" stroke-linejoin="round" d="M5.63 6.12L12 2.69l6.37 3.43" />
            <path stroke="#092f63" stroke-linecap="round" stroke-linejoin="round" d="M8.254 4.708L.73 2.2v3.92l3.92 3.92v5.39L12 19.35l7.35-3.92v-5.39l3.92-3.92V2.2l-7.524 2.508M9.55 8.08v1.96m4.9-1.96v1.96" />
            <path stroke="#092f63" stroke-linecap="round" stroke-linejoin="round" d="M9.55 14.45V12h4.9v2.45L12 15.92zM6.61 12h1.017m8.746 0h1.017M6.784 16.565L4.16 18.86l.49 2.94l3.43-.49l.82-3.613zm10.43 0l2.626 2.295l-.49 2.94l-3.43-.49l-.82-3.613z" />
        </g>
    </svg>
{:else}
    <Folder {size} class="vinda-icon" />
{/if}

<style>
    :global(.vinda-icon) {
        display: inline-block;
        vertical-align: middle;
        transition: transform 0.2s ease;
        flex-shrink: 0;
    }
</style>

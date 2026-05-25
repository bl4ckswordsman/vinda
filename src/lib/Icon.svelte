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
    import Palette from "@lucide/svelte/icons/palette";
    import Share2 from "@lucide/svelte/icons/share-2";

    interface Props {
        name: string;
        size?: number;
    }

    let { name, size = 16 }: Props = $props();
</script>

{#if name === "share"}
    <Share2 {size} class="vinda-icon" />
{:else if name === "Classical"}
    <Music {size} class="vinda-icon" />
{:else if name === "music"}
    <Music {size} class="vinda-icon" />
{:else if name === "headphones"}
    <Headphones {size} class="vinda-icon" />
{:else if name === "layers"}
    <Layers {size} class="vinda-icon" />
{:else if name === "palette"}
    <Palette {size} class="vinda-icon" />
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
        <g
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="2.0"
        >
            <path
                stroke-linejoin="round"
                d="m4 12l-.858-1.928a1.8 1.8 0 0 1-.08-1.17C4.13 5.115 7.198 2 12 2s7.87 3.115 8.938 6.902c.109.387.07.797-.08 1.17L20 12"
            />
            <path
                stroke-linejoin="round"
                d="M18 10a9.96 9.96 0 0 0-6-2a9.96 9.96 0 0 0-6 2"
            />
            <path
                stroke-linejoin="round"
                d="M15 8c0-4-6-4-6 0m0 9c.5.433 2 .866 3 0c1 .866 2.5.433 3 0"
            />
            <path
                stroke-linejoin="round"
                d="m18.493 14.5l.5-1.5c.253-.577.819-1.001 1.498-1c1.117.002 1.577 1.04 1.5 2c-.173 2.175-1.115 4-3.498 4c-1.256 2.533-3.596 3.9-6.493 4c-2.897-.1-5.237-1.467-6.493-4c-2.383 0-3.325-1.825-3.499-4c-.076-.96.384-1.998 1.5-2c.68-.001 1.246.423 1.5 1l.499 1.5"
            />
            <path
                d="M9.125 13H9m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0Zm5.875 0H15m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0Z"
            />
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
        width={size}
        height={size}
        viewBox="0 0 24 24"
    >
        <path d="M0 0h24v24H0z" fill="none" />
        <g fill="none">
            <path
                fill="#fff"
                d="M15.747 4.727L12 2.71L8.253 4.726L.73 2.22v3.92l3.92 3.92v5.39L12 19.37l7.35-3.92v-5.39l3.92-3.92V2.22z"
            />
            <path
                fill="#bbd8ff"
                d="M6.784 16.565L4.16 18.86l.49 2.94l3.43-.49l.82-3.613zm10.43 0l2.626 2.295l-.49 2.94l-3.43-.49l-.82-3.613zM9.55 14.45V12h4.9v2.45L12 15.92z"
            />
            <path
                fill="#bbd8ff"
                d="m4.65 15.43l1.47-.98L12 17.39l5.88-2.94l1.47.98L12 19.35z"
            />
            <path
                stroke="#092f63"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M5.63 6.12L12 2.69l6.37 3.43"
            />
            <path
                stroke="#092f63"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8.254 4.708L.73 2.2v3.92l3.92 3.92v5.39L12 19.35l7.35-3.92v-5.39l3.92-3.92V2.2l-7.524 2.508M9.55 8.08v1.96m4.9-1.96v1.96"
            />
            <path
                stroke="#092f63"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.55 14.45V12h4.9v2.45L12 15.92zM6.61 12h1.017m8.746 0h1.017M6.784 16.565L4.16 18.86l.49 2.94l3.43-.49l.82-3.613zm10.43 0l2.626 2.295l-.49 2.94l-3.43-.49l-.82-3.613z"
            />
        </g>
    </svg>
{:else if name === "carousel-sound"}
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 512 512"
        class="vinda-icon"
    >
        <path fill="currentColor" d="M285.4 45.61L340.5 119h59.1zm-58.8.01L112.4 119h59.1zm20.4 2.71L194 119h53zm18 0V119h53zM46.56 137l23 46h1.82c1.16-14.3 5.01-27.9 10.57-39c1.23-2.5 2.54-4.8 3.95-7zm65.44 0c-1 0-2.9.6-5.6 3.1s-5.7 6.6-8.35 11.9c-4.19 8.4-7.42 19.5-8.58 31h61.03c-1.2-11.3-4.7-22-10-30c-6.7-10.1-15.5-16-28.5-16m38.9 0c1.6 1.9 3.2 3.9 4.6 6c7.7 11.5 11.9 25.6 13.1 40h15.1c2.3-15.6 10.6-30.1 21.9-41.4c1.6-1.6 3.3-3.1 5-4.6zm105.1 0c-13 0-27.1 6.8-37.6 17.4c-8.2 8.1-14.1 18.4-16.4 28.6h108c-2.3-10.2-8.2-20.5-16.4-28.6C283.1 143.8 269 137 256 137m45.4 0c1.7 1.5 3.4 3 5 4.6c11.3 11.3 19.6 25.8 21.9 41.4h15.1c1.2-14.4 5.4-28.5 13.1-40c1.4-2.1 3-4.1 4.6-6zm98.6 0c-13 0-21.8 5.9-28.5 16c-5.3 8-8.8 18.7-10 30h61c-1.1-11.5-4.4-22.6-8.6-31c-2.6-5.3-5.6-9.4-8.3-11.9S401 137 400 137m26.1 0c1.4 2.2 2.8 4.5 4 7c5.5 11.1 9.4 24.7 10.5 39h1.8l23-46zM119 201v78.2c6.2-.2 12.2-.2 18-.2v-78zm256.4 0v78.2c6.2-.2 12.2-.2 18-.2v-78zm-167.1 37.1c-14.7 2.5-22.9 11.7-30.8 23.1c-4.4 6.5-8.4 13.5-12.9 19.8c-4.6 6.4-9.8 12.5-17.9 15.5l-1.5.5h-1.6c-15 0-32.8 0-47.3 1.3c-7.23.7-13.62 1.7-18.03 3s-6.2 3.3-5.76 2.5c-18.83 31.7-15.6 54.9-13.6 89.2c3.19.1 4.97.2 8.77.1c3.68 0 4.57-.1 7.01-.1c8.77-24.1 10.74-29.6 12.39-45.1l1.27-11.8l11.05 4.5c22.9 9.2 40.5 7.8 54.8-2.3l7.1-5.1l5.2 6.9c12 15.6 16.3 30.8 25.3 52.7h12.8c-2.2-20.7-4.5-47-19.1-65.4l-2.2-2.7l.2-3.5c.9-13.7 5.7-25.6 14.2-37l5.4-7.3l7.3 5.5c3.2 2.5 11.1 5.1 18.8 7.2l4.4-13c-12.9-12.9-19.1-25.4-25.3-38.5m256.4 0c-14.7 2.5-22.9 11.7-30.8 23.1c-4.4 6.5-8.4 13.5-12.9 19.8c-4.6 6.4-9.8 12.5-17.9 15.5l-1.5.5H400c-15 0-32.8 0-47.3 1.3c-7.2.7-13.6.1-18 3s-6.2 3.3-5.8 2.5c-18.8 31.7-15.6 54.9-13.6 89.2c3.2.1 5 .2 8.8.1c3.7 0 4.5-.1 7-.1c8.8-24.1 10.7-29.6 12.4-45.1l1.2-11.8l11.1 4.5c22.9 9.2 40.5 7.8 54.8-2.3l7.1-5.1l5.2 6.9c12 15.6 16.3 30.8 25.3 52.7H461c-2.2-20.7-4.5-47-19.1-65.4l-2.2-2.7l.2-3.5c.9-13.7 5.7-25.6 14.2-37l5.4-7.3l7.3 5.5c3.2 2.5 11.1 5.1 18.8 7.2l4.4-13c-12.9-12.9-19.1-25.4-25.3-38.5m-410.18 61c-12.98 4.4-21.64 12.7-26.02 22.5c-5.82 13.1-5.33 27.3-5.13 39.6l16.15-.4c0-20 2.88-39.6 15-61.7m256.48 0c-13.1 4.4-21.7 12.7-26.1 22.5c-5.8 13.1-5.3 27.3-5.1 39.6l16.1-.4c0-20 2.9-39.6 15.1-61.7m82.4 64.7c-5.8.8-11.8.9-18 .2v41h18zm-256.4 0c-5.8.8-11.8.9-18 .2v41h18zM73 423v16h366v-16zm-32 34v30h430v-30z" />
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

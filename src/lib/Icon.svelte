<script lang="ts">
    interface Props {
        name: string;
        size?: number;
    }

    let { name, size = 16 }: Props = $props();
</script>

<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    class="vinda-icon"
    stroke-linecap="round"
    stroke-linejoin="round"
>
    {#if name === "Classical"}
        <!-- Double Music Note -->
        <path
            d="M9 18V5l12-2v13"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        />
        <circle
            cx="6"
            cy="18"
            r="3"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        />
        <circle
            cx="18"
            cy="16"
            r="3"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        />
    {:else if name === "Games"}
        <svg xmlns="http://www.w3.org/2000/svg"
            ><!-- Icon from Huge Icons by Hugeicons - undefined --><g
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                ><path
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.008 15.81c.223-3.494.88-6.05 1.435-7.535c.281-.75.885-1.308 1.658-1.495c4.3-1.04 9.498-1.04 13.798 0c.773.187 1.377.745 1.658 1.495c.556 1.485 1.212 4.041 1.435 7.534c.133 2.09-1.377 3.241-3.05 4.083c-1.064.537-1.883-1.046-2.427-2.272a1.82 1.82 0 0 0-1.687-1.084H9.172c-.739 0-1.39.415-1.687 1.084c-.544 1.226-1.363 2.809-2.428 2.272c-1.655-.833-3.183-1.976-3.049-4.083M5 4.5L6.963 4M19 4.5L17 4"
                /><path
                    stroke-width="2"
                    d="m9 13l-1.5-1.5m0 0L6 10m1.5 1.5L6 13m1.5-1.5L9 10"
                /><path
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.988 10h.01m1.99 3h.01"
                /></g
            ></svg
        >
    {:else if name === "Super Mario"}
        <svg xmlns="http://www.w3.org/2000/svg"
            ><!-- Icon from Huge Icons by Hugeicons - undefined --><g
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="2.0"
                ><path
                    stroke-linejoin="round"
                    d="m4 12l-.858-1.928a1.8 1.8 0 0 1-.08-1.17C4.13 5.115 7.198 2 12 2s7.87 3.115 8.938 6.902c.109.387.07.797-.08 1.17L20 12"
                /><path
                    stroke-linejoin="round"
                    d="M18 10a9.96 9.96 0 0 0-6-2a9.96 9.96 0 0 0-6 2"
                /><path
                    stroke-linejoin="round"
                    d="M15 8c0-4-6-4-6 0m0 9c.5.433 2 .866 3 0c1 .866 2.5.433 3 0"
                /><path
                    stroke-linejoin="round"
                    d="m18.493 14.5l.5-1.5c.253-.577.819-1.001 1.498-1c1.117.002 1.577 1.04 1.5 2c-.173 2.175-1.115 4-3.498 4c-1.256 2.533-3.596 3.9-6.493 4c-2.897-.1-5.237-1.467-6.493-4c-2.383 0-3.325-1.825-3.499-4c-.076-.96.384-1.998 1.5-2c.68-.001 1.246.423 1.5 1l.499 1.5"
                /><path
                    d="M9.125 13H9m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0Zm5.875 0H15m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0Z"
                /></g
            ></svg
        >
    {:else if name === "Mario & Luigi"}
        <!-- Sleek minimalist Bat silhouette -->
        <path
            d="M4 6c0 0 4 2 6 6 1-3 1-6 2-6s1 3 2 6c2-4 6-6 6-6 0 0-1 4-3 5 .5 1.5 1.5 3 3 4 .5 1.5.5 3 0 4.5C18 20 14 21 12 19c-2 2-6 1-8.5-.5-.5-1.5-.5-3 0-4.5 1.5-1 2.5-2.5 3-4C4.5 10 4.5 6 4 6Z"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        />
    {:else if name === "Kirby"}
        <svg xmlns="http://www.w3.org/2000/svg"
            ><!-- Icon from Cyber color icons by Streamline - https://creativecommons.org/licenses/by/4.0/ --><g
                fill="none"
                ><path
                    fill="#fff"
                    d="M15.747 4.727L12 2.71L8.253 4.726L.73 2.22v3.92l3.92 3.92v5.39L12 19.37l7.35-3.92v-5.39l3.92-3.92V2.22z"
                /><path
                    fill="#bbd8ff"
                    d="M6.784 16.565L4.16 18.86l.49 2.94l3.43-.49l.82-3.613zm10.43 0l2.626 2.295l-.49 2.94l-3.43-.49l-.82-3.613zM9.55 14.45V12h4.9v2.45L12 15.92z"
                /><path
                    fill="#bbd8ff"
                    d="m4.65 15.43l1.47-.98L12 17.39l5.88-2.94l1.47.98L12 19.35z"
                /><path
                    stroke="#092f63"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5.63 6.12L12 2.69l6.37 3.43"
                /><path
                    stroke="#092f63"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8.254 4.708L.73 2.2v3.92l3.92 3.92v5.39L12 19.35l7.35-3.92v-5.39l3.92-3.92V2.2l-7.524 2.508M9.55 8.08v1.96m4.9-1.96v1.96"
                /><path
                    stroke="#092f63"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9.55 14.45V12h4.9v2.45L12 15.92zM6.61 12h1.017m8.746 0h1.017M6.784 16.565L4.16 18.86l.49 2.94l3.43-.49l.82-3.613zm10.43 0l2.626 2.295l-.49 2.94l-3.43-.49l-.82-3.613z"
                /></g
            ></svg
        >
    {:else if name === "theme-system"}
        <!-- Laptop/Monitor for System Theme -->
        <rect
            x="3"
            y="4"
            width="18"
            height="12"
            rx="2"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        />
        <path
            d="M7 20h10M12 16v4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        />
    {:else if name === "theme-dark"}
        <!-- Moon for Dark Theme -->
        <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        />
    {:else if name === "theme-light"}
        <!-- Sun for Light Theme -->
        <circle
            cx="12"
            cy="12"
            r="4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        />
        <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        />
    {:else if name === "play"}
        <!-- Play Icon -->
        <path
            d="M6 4l13 8-13 8V4z"
            fill="currentColor"
        />
    {:else if name === "stop"}
        <!-- Stop Icon -->
        <rect
            x="5"
            y="5"
            width="14"
            height="14"
            rx="2"
            fill="currentColor"
        />
    {:else}
        <!-- Fallback Folder -->
        <path
            d="M20 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4l2 3h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2Z"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        />
    {/if}
</svg>

<style>
    .vinda-icon {
        display: inline-block;
        vertical-align: middle;
        transition: transform 0.2s ease;
        flex-shrink: 0;
    }
</style>

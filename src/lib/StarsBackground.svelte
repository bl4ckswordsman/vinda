<script lang="ts">
    import { onMount } from "svelte";

    interface Star {
        id: number;
        x: number;
        y: number;
        size: number;
        color: string;
        delay: number;
        duration: number;
    }

    let stars = $state<Star[]>([]);

    onMount(() => {
        const colors = ["#ffffff", "#ffffff", "#ffffff", "#ffeef0", "#e3f0ff", "#fffbd5"];
        const list: Star[] = [];
        for (let i = 0; i < 75; i++) {
            list.push({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 1.5 + 0.6, // 0.6px to 2.1px
                color: colors[Math.floor(Math.random() * colors.length)],
                delay: Math.random() * 6,
                duration: Math.random() * 4 + 4, // 4s to 8s twinkle cycle
            });
        }
        stars = list;
    });
</script>

<div class="stars-bg" aria-hidden="true">
    {#each stars as star (star.id)}
        <div
            class="star"
            style="left: {star.x}%; top: {star.y}%; width: {star.size}px; height: {star.size}px; background-color: {star.color}; box-shadow: 0 0 {star.size * 2}px {star.color}; --delay: {star.delay}s; --duration: {star.duration}s;"
        ></div>
    {/each}

    <!-- Occasional shooting stars -->
    <svg class="shooting-star star-1" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad-star-1" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="rgba(255, 255, 255, 0)" />
                <stop offset="100%" stop-color="rgba(255, 255, 255, 1)" />
            </linearGradient>
        </defs>
        <path d="M 280 20 Q 150 60 20 130" class="star-path-1" />
    </svg>

    <svg class="shooting-star star-2" viewBox="0 0 250 120" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad-star-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="rgba(255, 255, 255, 0)" />
                <stop offset="100%" stop-color="rgba(255, 255, 255, 1)" />
            </linearGradient>
        </defs>
        <path d="M 20 20 Q 125 50 230 100" class="star-path-2" />
    </svg>

    <svg class="shooting-star star-3" viewBox="0 0 350 180" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad-star-3" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="rgba(255, 255, 255, 0)" />
                <stop offset="100%" stop-color="rgba(255, 255, 255, 1)" />
            </linearGradient>
        </defs>
        <path d="M 330 20 Q 180 80 20 160" class="star-path-3" />
    </svg>
</div>

<style>
    .stars-bg {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 0;
    }

    .star {
        position: absolute;
        border-radius: 50%;
        opacity: 0;
        animation: twinkle var(--duration) ease-in-out var(--delay) infinite;
    }

    @keyframes twinkle {
        0%,
        100% {
            opacity: 0.05;
            transform: scale(0.8);
        }
        50% {
            opacity: 0.55;
            transform: scale(1.2);
        }
    }

    /* ── Shooting Stars (GPU-Accelerated SVG Path Drawing) ── */
    .shooting-star {
        position: absolute;
        fill: none;
        pointer-events: none;
    }

    .star-1 {
        top: 5%;
        right: 10%;
        width: 300px;
        height: 150px;
    }
    .star-path-1 {
        stroke: url(#grad-star-1);
        stroke-width: 1.5px;
        stroke-linecap: round;
        filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
        stroke-dasharray: 300;
        stroke-dashoffset: 300;
        animation: shoot-star-1 16s ease-in-out 3s infinite;
    }

    .star-2 {
        top: 2%;
        left: 10%;
        width: 250px;
        height: 120px;
    }
    .star-path-2 {
        stroke: url(#grad-star-2);
        stroke-width: 1.5px;
        stroke-linecap: round;
        filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
        stroke-dasharray: 250;
        stroke-dashoffset: 250;
        animation: shoot-star-2 20s ease-in-out 8s infinite;
    }

    .star-3 {
        top: 15%;
        left: 30%;
        width: 350px;
        height: 180px;
    }
    .star-path-3 {
        stroke: url(#grad-star-3);
        stroke-width: 1.5px;
        stroke-linecap: round;
        filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
        stroke-dasharray: 350;
        stroke-dashoffset: 350;
        animation: shoot-star-3 24s ease-in-out 14s infinite;
    }

    /* Keyframes for Star 1 (length ~300) */
    @keyframes shoot-star-1 {
        0% {
            stroke-dasharray: 0 300;
            stroke-dashoffset: 0;
            opacity: 0;
        }
        1.5% {
            stroke-dasharray: 220 300;
            stroke-dashoffset: 0;
            opacity: 0.9;
        }
        4.5% {
            stroke-dasharray: 220 300;
            stroke-dashoffset: 0;
            opacity: 0;
        }
        100% {
            stroke-dasharray: 220 300;
            stroke-dashoffset: 0;
            opacity: 0;
        }
    }

    /* Keyframes for Star 2 (length ~250) */
    @keyframes shoot-star-2 {
        0% {
            stroke-dasharray: 0 250;
            stroke-dashoffset: 0;
            opacity: 0;
        }
        1.5% {
            stroke-dasharray: 180 250;
            stroke-dashoffset: 0;
            opacity: 0.95;
        }
        4.5% {
            stroke-dasharray: 180 250;
            stroke-dashoffset: 0;
            opacity: 0;
        }
        100% {
            stroke-dasharray: 180 250;
            stroke-dashoffset: 0;
            opacity: 0;
        }
    }

    /* Keyframes for Star 3 (length ~350) */
    @keyframes shoot-star-3 {
        0% {
            stroke-dasharray: 0 350;
            stroke-dashoffset: 0;
            opacity: 0;
        }
        1.5% {
            stroke-dasharray: 260 350;
            stroke-dashoffset: 0;
            opacity: 0.85;
        }
        4.5% {
            stroke-dasharray: 260 350;
            stroke-dashoffset: 0;
            opacity: 0;
        }
        100% {
            stroke-dasharray: 260 350;
            stroke-dashoffset: 0;
            opacity: 0;
        }
    }
</style>

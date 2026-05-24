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
</style>

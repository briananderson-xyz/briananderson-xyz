<script lang="ts">
	import { Keyboard } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	interface Props {
		onOpenHelp: () => void;
	}

	let { onOpenHelp }: Props = $props();

	let isHovered = $state(false);
	let hasBeenClicked = $state(false);

	const isMac = browser && typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
	const modKey = isMac ? '⌘' : 'Ctrl+';

	// Load clicked state from localStorage
	onMount(() => {
		if (browser) {
			const clicked = localStorage.getItem('keyboard_shortcuts_viewed');
			hasBeenClicked = clicked === 'true';
		}
	});

	function handleClick() {
		if (browser) {
			localStorage.setItem('keyboard_shortcuts_viewed', 'true');
			hasBeenClicked = true;
		}
		onOpenHelp();
	}
</script>

<button
	onclick={handleClick}
	onmouseenter={() => isHovered = true}
	onmouseleave={() => isHovered = false}
	class="relative p-2 rounded hover:bg-skin-accent/10 transition-colors cursor-pointer flex items-center justify-center"
	aria-label="View keyboard shortcuts"
	title="Keyboard shortcuts ({modKey}Shift+?)"
>
	<Keyboard size={16} class="text-skin-accent" />
	{#if !hasBeenClicked}
		<span class="absolute top-1 right-1 w-2 h-2 bg-skin-accent rounded-full" style="animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></span>
	{/if}

	{#if isHovered}
		<div class="absolute top-full right-0 mt-2 p-3 bg-terminal-black border-2 border-terminal-green rounded-lg shadow-2xl min-w-[200px] z-50 font-mono text-xs">
			<div class="flex items-center justify-between gap-3 py-1.5 text-terminal-text">
				<kbd class="px-2 py-1 bg-terminal-green/10 border border-terminal-green rounded text-terminal-green font-mono text-xs">{modKey}K</kbd>
				<span class="text-terminal-text/70">Quick Actions</span>
			</div>
			<div class="flex items-center justify-between gap-3 py-1.5 text-terminal-text">
				<kbd class="px-2 py-1 bg-terminal-green/10 border border-terminal-green rounded text-terminal-green font-mono text-xs">{modKey}I</kbd>
				<span class="text-terminal-text/70">AI Chat</span>
			</div>
			<div class="flex items-center justify-between gap-3 py-1.5 text-terminal-text">
				<kbd class="px-2 py-1 bg-terminal-green/10 border border-terminal-green rounded text-terminal-green font-mono text-xs">{modKey}F</kbd>
				<span class="text-terminal-text/70">Fit Finder</span>
			</div>
		</div>
	{/if}
</button>

<style>
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}
</style>

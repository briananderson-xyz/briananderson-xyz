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
	class="keyboard-indicator"
	aria-label="View keyboard shortcuts"
	title="Keyboard shortcuts ({modKey}Shift+?)"
>
	<Keyboard size={16} class="text-skin-accent" />
	{#if !hasBeenClicked}
		<span class="indicator-pulse"></span>
	{/if}
	
	{#if isHovered}
		<div class="shortcuts-preview">
			<div class="shortcut-item">
				<kbd>{modKey}K</kbd>
				<span>Quick Actions</span>
			</div>
			<div class="shortcut-item">
				<kbd>{modKey}I</kbd>
				<span>AI Chat</span>
			</div>
			<div class="shortcut-item">
				<kbd>{modKey}F</kbd>
				<span>Fit Finder</span>
			</div>
		</div>
	{/if}
</button>

<style>
	.keyboard-indicator {
		@apply relative p-2 rounded hover:bg-skin-accent/10 transition-colors cursor-pointer;
		@apply flex items-center justify-center;
	}

	.indicator-pulse {
		@apply absolute top-1 right-1 w-2 h-2 bg-skin-accent rounded-full;
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	.shortcuts-preview {
		@apply absolute top-full right-0 mt-2 p-3 bg-terminal-black border-2 border-terminal-green rounded-lg shadow-2xl;
		@apply min-w-[200px] z-50;
		@apply font-mono text-xs;
	}

	.shortcut-item {
		@apply flex items-center justify-between gap-3 py-1.5;
		@apply text-terminal-text;
	}

	.shortcut-item kbd {
		@apply px-2 py-1 bg-terminal-green/10 border border-terminal-green rounded;
		@apply text-terminal-green font-mono text-xs;
	}

	.shortcut-item span {
		@apply text-terminal-text/70;
	}
</style>

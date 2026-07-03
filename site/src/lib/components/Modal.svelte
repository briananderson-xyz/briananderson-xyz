<script lang="ts">
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Whether the modal is shown. */
		visible: boolean;
		/** Called when the user dismisses (backdrop click, Escape, or the × button). */
		onClose: () => void;
		/** Title shown in the header bar. */
		title: string;
		/** id used for aria-labelledby (must be unique per modal). */
		labelledby?: string;
		/** aria-label for the close button. */
		closeLabel?: string;
		/** data-testid on the backdrop, for e2e. */
		testid?: string;
		/**
		 * When true the card is a fixed-height panel on desktop (md:h-[80vh]) so a
		 * pinned footer like a chat input stays put. When false it sizes to its
		 * content up to md:max-h-[90vh]. On mobile it is always full-screen.
		 */
		fill?: boolean;
		/** Optional extra buttons rendered in the header, left of the × (e.g. "Clear"). */
		actions?: Snippet;
		/** Modal body. */
		children: Snippet;
	}

	let {
		visible,
		onClose,
		title,
		labelledby = 'modal-title',
		closeLabel = 'Close',
		testid,
		fill = false,
		actions,
		children
	}: Props = $props();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}

	// Escape closes, regardless of focus.
	$effect(() => {
		if (visible && browser) {
			const onKey = (e: KeyboardEvent) => {
				if (e.key === 'Escape') onClose();
			};
			window.addEventListener('keydown', onKey);
			return () => window.removeEventListener('keydown', onKey);
		}
	});
</script>

{#if visible}
	<!--
		Mobile: full-screen sheet anchored to the top, sized with 100dvh so the
		virtual keyboard shrinks it instead of shoving a centered card off-screen.
		Desktop (md+): a centered, bordered card.
	-->
	<div
		class="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-black/80 backdrop-blur-sm md:p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby={labelledby}
		tabindex="-1"
		data-testid={testid}
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
	>
		<div
			class="bg-terminal-black border-terminal-green shadow-2xl w-full h-[100dvh] flex flex-col border-0 md:border-2 md:max-w-4xl {fill
				? 'md:h-[80vh]'
				: 'md:h-auto md:max-h-[90vh]'}"
		>
			<div
				class="flex justify-between items-center px-3 py-2 md:px-4 bg-terminal-green/10 border-b-2 border-terminal-green font-mono text-terminal-green"
			>
				<span id={labelledby} class="truncate">{title}</span>
				<div class="flex items-center gap-1 md:gap-2 shrink-0">
					{#if actions}{@render actions()}{/if}
					<span class="hidden md:inline text-xs text-terminal-green/70">Esc</span>
					<button
						onclick={onClose}
						class="flex items-center justify-center w-11 h-11 -mr-1 text-2xl leading-none rounded hover:bg-terminal-green/10 active:bg-terminal-green/20 transition-colors cursor-pointer"
						aria-label={closeLabel}
					>
						×
					</button>
				</div>
			</div>

			<div class="flex-1 min-h-0 flex flex-col">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

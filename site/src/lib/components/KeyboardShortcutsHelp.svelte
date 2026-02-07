<script lang="ts">
	import { type KeyboardShortcut, getShortcutDisplay } from '$lib/hooks/useKeyboardShortcuts';

	interface Props {
		shortcuts: KeyboardShortcut[];
		visible: boolean;
		onClose: () => void;
	}

	let { shortcuts, visible, onClose }: Props = $props();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

{#if visible}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
		data-testid="keyboard-help"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-labelledby="shortcuts-title"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
	>
		<div class="bg-terminal-black border-2 border-terminal-green shadow-2xl max-w-2xl w-full mx-4">
			<div class="flex justify-between items-center px-4 py-2 bg-terminal-green/10 border-b-2 border-terminal-green font-mono text-terminal-green">
				<span id="shortcuts-title">Keyboard Shortcuts</span>
				<div class="flex items-center gap-2">
					<kbd class="px-2 py-0.5 bg-terminal-green/10 border border-terminal-green rounded text-terminal-green font-mono text-xs">Esc</kbd>
					<button
						onclick={onClose}
						class="text-2xl leading-none hover:text-terminal-green transition-colors cursor-pointer"
						aria-label="Close shortcuts help"
					>
						×
					</button>
				</div>
			</div>

			<div class="p-6 max-h-[70vh] overflow-y-auto font-mono text-sm">
				<div class="space-y-4">
					{#each shortcuts as shortcut}
						<div class="flex justify-between items-center py-2 border-b border-terminal-green/20">
							<span class="text-terminal-text">{shortcut.description}</span>
							<kbd class="px-3 py-1 bg-terminal-green/10 border border-terminal-green rounded text-terminal-green font-mono text-xs">
								{getShortcutDisplay(shortcut)}
							</kbd>
						</div>
					{/each}
				</div>

				<div class="mt-6 text-sm text-terminal-text/70">
					<p>Press <kbd class="px-2 py-0.5 bg-terminal-green/10 border border-terminal-green rounded text-terminal-green font-mono text-xs">Esc</kbd> or click outside to close this dialog</p>
				</div>
			</div>
		</div>
	</div>
{/if}

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
		aria-modal="true"
		aria-labelledby="shortcuts-title"
		onclick={handleBackdropClick}
	>
		<div class="terminal-window max-w-2xl w-full mx-4">
			<div class="terminal-header">
				<span id="shortcuts-title">Keyboard Shortcuts</span>
				<div class="flex items-center gap-2">
					<kbd class="terminal-kbd-sm">Esc</kbd>
					<button 
						onclick={onClose}
						class="terminal-close"
						aria-label="Close shortcuts help"
					>
						×
					</button>
				</div>
			</div>
			
			<div class="terminal-content p-6 max-h-[70vh] overflow-y-auto">
				<div class="space-y-4">
					{#each shortcuts as shortcut}
						<div class="flex justify-between items-center py-2 border-b border-terminal-green/20">
							<span class="text-terminal-text">{shortcut.description}</span>
							<kbd class="terminal-kbd">
								{getShortcutDisplay(shortcut)}
							</kbd>
						</div>
					{/each}
				</div>
				
				<div class="mt-6 text-sm text-terminal-text/70">
					<p>Press <kbd class="terminal-kbd-sm">Esc</kbd> or click outside to close this dialog</p>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.terminal-window {
		@apply bg-terminal-black border-2 border-terminal-green shadow-2xl;
	}

	.terminal-header {
		@apply flex justify-between items-center px-4 py-2 bg-terminal-green/10 border-b-2 border-terminal-green;
		@apply font-mono text-terminal-green;
	}

	.terminal-close {
		@apply text-2xl leading-none hover:text-terminal-green transition-colors cursor-pointer;
	}

	.terminal-content {
		@apply font-mono text-sm;
	}

	.terminal-kbd {
		@apply px-3 py-1 bg-terminal-green/10 border border-terminal-green rounded;
		@apply text-terminal-green font-mono text-xs;
	}

	.terminal-kbd-sm {
		@apply px-2 py-0.5 bg-terminal-green/10 border border-terminal-green rounded;
		@apply text-terminal-green font-mono text-xs;
	}
</style>

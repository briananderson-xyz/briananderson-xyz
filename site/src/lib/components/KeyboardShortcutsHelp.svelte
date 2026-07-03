<script lang="ts">
	import { type KeyboardShortcut, getShortcutDisplay } from '$lib/hooks/useKeyboardShortcuts';
	import Modal from './Modal.svelte';

	interface Props {
		shortcuts: KeyboardShortcut[];
		visible: boolean;
		onClose: () => void;
	}

	let { shortcuts, visible, onClose }: Props = $props();
</script>

<Modal
	{visible}
	{onClose}
	title="Keyboard Shortcuts"
	labelledby="shortcuts-title"
	closeLabel="Close shortcuts help"
	testid="keyboard-help"
>
	<div class="flex-1 min-h-0 overflow-y-auto p-6 font-mono text-sm">
		<div class="space-y-4">
			{#each shortcuts as shortcut}
				<div class="flex justify-between items-center py-2 border-b border-terminal-green/20">
					<span class="text-terminal-text">{shortcut.description}</span>
					<kbd
						class="px-3 py-1 bg-terminal-green/10 border border-terminal-green rounded text-terminal-green font-mono text-xs"
					>
						{getShortcutDisplay(shortcut)}
					</kbd>
				</div>
			{/each}
		</div>

		<div class="mt-6 text-sm text-terminal-text/70">
			<p>
				Press <kbd
					class="px-2 py-0.5 bg-terminal-green/10 border border-terminal-green rounded text-terminal-green font-mono text-xs"
					>Esc</kbd
				> or click outside to close this dialog
			</p>
		</div>
	</div>
</Modal>

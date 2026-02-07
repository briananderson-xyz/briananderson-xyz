<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		onSend: (message: string) => void;
		disabled?: boolean;
		autoFocus?: boolean;
		focusTrigger?: number;
	}

	let { onSend, disabled = false, autoFocus = false, focusTrigger = 0 }: Props = $props();

	let inputValue = $state('');
	let textareaElement: HTMLTextAreaElement;

	// Auto-focus when component mounts if autoFocus is true
	onMount(() => {
		if (autoFocus && textareaElement) {
			textareaElement.focus();
		}
	});

	// Refocus when focusTrigger changes (after receiving response)
	$effect(() => {
		if (focusTrigger > 0 && textareaElement) {
			textareaElement.focus();
		}
	});

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	function handleSend() {
		if (inputValue.trim() && !disabled) {
			onSend(inputValue);
			inputValue = '';

			// Reset textarea height
			if (textareaElement) {
				textareaElement.style.height = 'auto';
			}
		}
	}

	function handleInput() {
		// Auto-resize textarea
		if (textareaElement) {
			textareaElement.style.height = 'auto';
			textareaElement.style.height = textareaElement.scrollHeight + 'px';
		}
	}
</script>

<div class="flex items-end gap-2 p-4" data-testid="chat-input-container">
	<textarea
		bind:this={textareaElement}
		bind:value={inputValue}
		onkeydown={handleKeyDown}
		oninput={handleInput}
		placeholder="Ask about Brian's experience, skills, or paste a job description..."
		class="flex-1 bg-transparent border border-terminal-green/30 rounded px-3 py-2 text-terminal-text font-mono text-sm resize-none focus:outline-none focus:border-terminal-green placeholder:text-terminal-text/50 disabled:opacity-50 disabled:cursor-not-allowed"
		style="max-height: 200px; min-height: 40px;"
		data-testid="chat-input"
		rows="1"
		{disabled}
	></textarea>

	<button
		onclick={handleSend}
		disabled={disabled || !inputValue.trim()}
		class="bg-terminal-green/10 border border-terminal-green rounded p-2 text-terminal-green hover:bg-terminal-green/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
		style="min-width: 40px; height: 40px;"
		data-testid="send-button"
		aria-label="Send message"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<line x1="22" y1="2" x2="11" y2="13"></line>
			<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
		</svg>
	</button>
</div>

<div class="px-4 pb-3 text-center">
	<span class="text-xs text-terminal-text/50">
		<kbd class="px-1.5 py-0.5 bg-terminal-green/10 border border-terminal-green/30 rounded text-terminal-green font-mono text-xs">Enter</kbd> to send, <kbd class="px-1.5 py-0.5 bg-terminal-green/10 border border-terminal-green/30 rounded text-terminal-green font-mono text-xs">Shift+Enter</kbd> for new line
	</span>
</div>

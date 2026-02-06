<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		onSend: (message: string) => void;
		disabled?: boolean;
		autoFocus?: boolean;
	}

	let { onSend, disabled = false, autoFocus = false }: Props = $props();
	
	let inputValue = $state('');
	let textareaElement: HTMLTextAreaElement;

	// Auto-focus when component mounts if autoFocus is true
	onMount(() => {
		if (autoFocus && textareaElement) {
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

<div class="chat-input-container" data-testid="chat-input-container">
	<textarea
		bind:this={textareaElement}
		bind:value={inputValue}
		onkeydown={handleKeyDown}
		oninput={handleInput}
		placeholder="Ask about Brian's experience, skills, or paste a job description..."
		class="chat-textarea"
		data-testid="chat-input"
		rows="1"
		{disabled}
	></textarea>
	
	<button
		onclick={handleSend}
		disabled={disabled || !inputValue.trim()}
		class="send-button"
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

<div class="input-hint">
	<span class="text-xs text-terminal-text/50">
		<kbd class="hint-kbd">Enter</kbd> to send, <kbd class="hint-kbd">Shift+Enter</kbd> for new line
	</span>
</div>

<style>
	.chat-input-container {
		@apply flex items-end gap-2 p-4;
	}

	.chat-textarea {
		@apply flex-1 bg-transparent border border-terminal-green/30 rounded px-3 py-2;
		@apply text-terminal-text font-mono text-sm resize-none;
		@apply focus:outline-none focus:border-terminal-green;
		@apply placeholder:text-terminal-text/50;
		@apply disabled:opacity-50 disabled:cursor-not-allowed;
		max-height: 200px;
		min-height: 40px;
	}

	.send-button {
		@apply bg-terminal-green/10 border border-terminal-green rounded p-2;
		@apply text-terminal-green hover:bg-terminal-green/20 transition-colors;
		@apply disabled:opacity-50 disabled:cursor-not-allowed;
		@apply flex items-center justify-center;
		min-width: 40px;
		height: 40px;
	}

	.input-hint {
		@apply px-4 pb-3 text-center;
	}

	.hint-kbd {
		@apply px-1.5 py-0.5 bg-terminal-green/10 border border-terminal-green/30 rounded;
		@apply text-terminal-green font-mono text-xs;
	}
</style>

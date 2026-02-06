<script lang="ts">
	import type { ChatMessage } from '$lib/types';
	import { marked } from 'marked';

	interface Props {
		message: ChatMessage;
	}

	let { message }: Props = $props();

	// Configure marked for safe rendering
	marked.setOptions({
		breaks: true,
		gfm: true
	});

	const renderedContent = $derived(
		message.role === 'assistant' 
			? marked.parse(message.content) 
			: message.content
	);

	function formatTime(timestamp: number): string {
		return new Date(timestamp).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div 
	class="message"
	class:user={message.role === 'user'}
	class:assistant={message.role === 'assistant'}
	class:system={message.role === 'system'}
	data-testid="chat-message"
>
	<div class="message-header">
		<span class="message-role">
			{#if message.role === 'user'}
				You
			{:else if message.role === 'assistant'}
				Brian's AI
			{:else}
				System
			{/if}
		</span>
		<span class="message-time">{formatTime(message.timestamp)}</span>
	</div>
	
	<div class="message-content">
		{#if message.role === 'assistant'}
			{@html renderedContent}
		{:else}
			{message.content}
		{/if}
	</div>
</div>

<style>
	.message {
		@apply rounded-lg p-4 font-mono text-sm;
	}

	.message.user {
		@apply bg-terminal-green/10 border border-terminal-green/30 ml-12;
	}

	.message.assistant {
		@apply bg-terminal-black border border-terminal-green/20 mr-12;
	}

	.message.system {
		@apply bg-terminal-dark border border-terminal-text/20 text-center;
	}

	.message-header {
		@apply flex justify-between items-center mb-2 text-xs;
	}

	.message-role {
		@apply text-terminal-green font-semibold;
	}

	.message-time {
		@apply text-terminal-text/50;
	}

	.message-content {
		@apply text-terminal-text leading-relaxed;
	}

	/* Style markdown content */
	.message-content :global(p) {
		@apply mb-2 last:mb-0;
	}

	.message-content :global(ul),
	.message-content :global(ol) {
		@apply ml-4 mb-2;
	}

	.message-content :global(li) {
		@apply mb-1;
	}

	.message-content :global(code) {
		@apply bg-terminal-green/10 px-1 py-0.5 rounded text-terminal-green;
	}

	.message-content :global(pre) {
		@apply bg-terminal-dark p-3 rounded overflow-x-auto mb-2;
	}

	.message-content :global(pre code) {
		@apply bg-transparent p-0;
	}

	.message-content :global(a) {
		@apply text-terminal-green underline hover:text-terminal-green/80;
	}

	.message-content :global(strong) {
		@apply text-terminal-green font-bold;
	}
</style>

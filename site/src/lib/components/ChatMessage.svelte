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

	const roleClasses = $derived(
		message.role === 'user'
			? 'bg-terminal-green/10 border border-terminal-green/30 ml-12'
			: message.role === 'assistant'
				? 'bg-terminal-black border border-terminal-green/20 mr-12'
				: 'bg-terminal-dark border border-terminal-text/20 text-center'
	);
</script>

<div
	class="rounded-lg p-4 font-mono text-sm {roleClasses}"
	data-testid="chat-message"
>
	<div class="flex justify-between items-center mb-2 text-xs">
		<span class="text-terminal-green font-semibold">
			{#if message.role === 'user'}
				You
			{:else if message.role === 'assistant'}
				Brian's AI
			{:else}
				System
			{/if}
		</span>
		<span class="text-terminal-text/50">{formatTime(message.timestamp)}</span>
	</div>

	<div class="message-content text-terminal-text leading-relaxed">
		{#if message.role === 'assistant'}
			{@html renderedContent}
		{:else}
			{message.content}
		{/if}
	</div>
</div>

<style>
	/* Plain CSS for :global() selectors targeting {@html} rendered content */
	.message-content :global(p) {
		margin-bottom: 0.5rem;
	}

	.message-content :global(p:last-child) {
		margin-bottom: 0;
	}

	.message-content :global(ul),
	.message-content :global(ol) {
		margin-left: 1rem;
		margin-bottom: 0.5rem;
	}

	.message-content :global(li) {
		margin-bottom: 0.25rem;
	}

	.message-content :global(code) {
		background-color: rgba(var(--color-terminal-accent), 0.1);
		padding-left: 0.25rem;
		padding-right: 0.25rem;
		padding-top: 0.125rem;
		padding-bottom: 0.125rem;
		border-radius: 0.25rem;
		color: rgb(var(--color-terminal-accent));
	}

	.message-content :global(pre) {
		background-color: #1e1e1e;
		padding: 0.75rem;
		border-radius: 0.25rem;
		overflow-x: auto;
		margin-bottom: 0.5rem;
	}

	.message-content :global(pre code) {
		background-color: transparent;
		padding: 0;
	}

	.message-content :global(a) {
		color: rgb(var(--color-terminal-accent));
		text-decoration: underline;
	}

	.message-content :global(a:hover) {
		opacity: 0.8;
	}

	.message-content :global(strong) {
		color: rgb(var(--color-terminal-accent));
		font-weight: 700;
	}
</style>

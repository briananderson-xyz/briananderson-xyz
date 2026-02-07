<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { ChatMessage } from '$lib/types';
	import ChatMessageComponent from './ChatMessage.svelte';
	import ChatInput from './ChatInput.svelte';

	interface Props {
		visible: boolean;
		onClose: () => void;
	}

	let { visible, onClose }: Props = $props();

	let messages = $state<ChatMessage[]>([]);
	let isLoading = $state(false);
	let chatContainer = $state<HTMLDivElement | null>(null);
	let focusTrigger = $state(0);

	// Load chat history from localStorage
	onMount(() => {
		if (browser) {
			const saved = localStorage.getItem('chat_history');
			if (saved) {
				try {
					messages = JSON.parse(saved);
				} catch (e) {
					console.error('Failed to load chat history:', e);
				}
			}
		}
	});

	// Save chat history to localStorage
	$effect(() => {
		if (browser && messages.length > 0) {
			localStorage.setItem('chat_history', JSON.stringify(messages));
		}
	});

	// Auto-scroll to bottom when new messages arrive or when chat opens
	$effect(() => {
		if (chatContainer && messages.length > 0) {
			// Use requestAnimationFrame for smoother scrolling
			requestAnimationFrame(() => {
				chatContainer.scrollTo({
					top: chatContainer.scrollHeight,
					behavior: 'smooth'
				});
			});
		}
	});

	// Scroll to bottom when chat becomes visible (opening with history)
	$effect(() => {
		if (visible && chatContainer && messages.length > 0) {
			// Immediate scroll without animation when opening
			requestAnimationFrame(() => {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			});
		}
	});

	async function handleSendMessage(content: string) {
		if (!content.trim()) return;

		// Add user message
		const userMessage: ChatMessage = {
			id: Date.now().toString(),
			role: 'user',
			content: content.trim(),
			timestamp: Date.now()
		};
		messages = [...messages, userMessage];

		isLoading = true;

		try {
			// Call Firebase function
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: content,
					history: messages.slice(-5) // Last 5 messages for context
				})
			});

			if (!response.ok) {
				throw new Error('Failed to get response');
			}

			const data = await response.json();

			// Add assistant message
			const assistantMessage: ChatMessage = {
				id: (Date.now() + 1).toString(),
				role: 'assistant',
				content: data.response,
				timestamp: Date.now()
			};
			messages = [...messages, assistantMessage];

			// Trigger refocus after response
			focusTrigger++;

		} catch (error) {
			console.error('Chat error:', error);

			// Add error message
			const errorMessage: ChatMessage = {
				id: (Date.now() + 1).toString(),
				role: 'system',
				content: 'Sorry, I encountered an error. Please try again.',
				timestamp: Date.now()
			};
			messages = [...messages, errorMessage];
		} finally {
			isLoading = false;
		}
	}

	function clearHistory() {
		messages = [];
		if (browser) {
			localStorage.removeItem('chat_history');
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	$effect(() => {
		if (visible && browser) {
			window.addEventListener('keydown', handleKeyDown);
			return () => window.removeEventListener('keydown', handleKeyDown);
		}
	});
</script>

{#if visible}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
		data-testid="chatbot"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-labelledby="chatbot-title"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
	>
		<div class="bg-terminal-black border-2 border-terminal-green shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col">
			<div class="flex justify-between items-center px-4 py-2 bg-terminal-green/10 border-b-2 border-terminal-green font-mono text-terminal-green">
				<span id="chatbot-title">guest@briananderson:~$ chat</span>
				<div class="flex items-center gap-3">
					<button
						onclick={clearHistory}
						class="text-sm hover:text-terminal-green transition-colors"
						title="Clear chat history"
					>
						Clear
					</button>
					<div class="flex items-center gap-1">
						<span class="text-xs text-terminal-green/70">Esc</span>
						<button
							onclick={onClose}
							class="text-2xl leading-none hover:text-terminal-green transition-colors cursor-pointer"
							aria-label="Close chatbot"
						>
							×
						</button>
					</div>
				</div>
			</div>

			<div
				bind:this={chatContainer}
				class="flex-1 overflow-y-auto p-4 space-y-4"
			>
				{#if messages.length === 0}
					<div class="text-center text-terminal-text/70 py-12">
						<p class="text-lg mb-4">👋 Hi! I'm Brian's AI assistant.</p>
						<p class="text-sm">Ask me about Brian's experience, skills, projects, or paste a job description for a fit analysis.</p>
					</div>
				{/if}

				{#each messages as message (message.id)}
					<ChatMessageComponent {message} />
				{/each}

				{#if isLoading}
					<div class="flex items-center gap-2 text-terminal-green">
						<div class="animate-pulse">●</div>
						<span class="text-sm">Thinking...</span>
					</div>
				{/if}
			</div>

			<div class="border-t border-terminal-green/20">
				<ChatInput
					onSend={handleSendMessage}
					disabled={isLoading}
					autoFocus={visible}
					focusTrigger={focusTrigger}
				/>
			</div>
		</div>
	</div>
{/if}

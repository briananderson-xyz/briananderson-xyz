<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { ChatMessage } from '$lib/types';
	import ChatMessageComponent from './ChatMessage.svelte';
	import ChatInput from './ChatInput.svelte';
	import Modal from './Modal.svelte';
	import { getApiBase } from '$lib/utils/apiBase';
	import { fly } from 'svelte/transition';

	const API_BASE = getApiBase();

	interface Props {
		visible: boolean;
		onClose: () => void;
	}

	let { visible, onClose }: Props = $props();

	let messages = $state<ChatMessage[]>([]);
	let isLoading = $state(false);
	let chatContainer = $state<HTMLDivElement | null>(null);
	let focusTrigger = $state(0);
	// Contextual follow-up chips returned by the API for the latest answer. Kept
	// as structured data (never rendered into the message text), so they only ever
	// appear as buttons, not as a flash of text in the reply.
	let suggestions = $state<string[]>([]);

	// Starter prompts shown when the chat is empty, to signal what visitors can ask.
	const STARTER_QUESTIONS = [
		"What's Brian's experience with AI?",
		'Tell me about CampFit',
		"What's his leadership background?",
		"Is he a fit for a role I'm hiring for?"
	];

	// Load chat history from sessionStorage
	onMount(() => {
		if (browser) {
			const saved = sessionStorage.getItem('chat_history');
			if (saved) {
				try {
					messages = JSON.parse(saved);
				} catch (e) {
					console.error('Failed to load chat history:', e);
				}
			}
		}
	});

	// Save chat history to sessionStorage
	$effect(() => {
		if (browser && messages.length > 0) {
			sessionStorage.setItem('chat_history', JSON.stringify(messages));
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
		suggestions = [];

		isLoading = true;

		try {
			// Call Firebase function
			const response = await fetch(`${API_BASE}/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: content,
					// CR-2: only 'user'/'assistant' turns are genuine conversational
					// history; 'system' entries (local error/notice UI state, e.g.
					// below) are never sent — the server's validateHistory rejects
					// role 'system', so leaving one in would 400 every send until
					// it aged out of the last-5 window.
					history: messages
						.filter((m) => m.role === 'user' || m.role === 'assistant')
						.slice(-5) // Last 5 messages for context
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
			suggestions = Array.isArray(data.suggestions) ? data.suggestions.slice(0, 3) : [];

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
		suggestions = [];
		if (browser) {
			sessionStorage.removeItem('chat_history');
		}
	}

</script>

<Modal
	{visible}
	{onClose}
	title="guest@briananderson:~$ chat"
	labelledby="chatbot-title"
	closeLabel="Close chatbot"
	testid="chatbot"
	fill
>
	{#snippet actions()}
		<button
			onclick={clearHistory}
			class="rounded px-3 py-2 text-sm hover:bg-terminal-green/10 active:bg-terminal-green/20 transition-colors"
			title="Clear chat history"
		>
			Clear
		</button>
	{/snippet}

	<div
		bind:this={chatContainer}
		role="log"
		aria-live="polite"
		aria-relevant="additions"
		aria-label="Chat conversation"
		class="flex-1 min-h-0 overflow-y-auto p-4 space-y-4"
	>
		{#if messages.length === 0}
			<div class="text-center text-terminal-text/70 py-12">
				<p class="text-lg mb-4">👋 Hi! I'm Brian's AI assistant.</p>
				<p class="text-sm">Ask me about Brian's experience, skills, projects, or paste a job description for a fit analysis.</p>
				<div class="mt-6 flex flex-wrap justify-center gap-2">
					{#each STARTER_QUESTIONS as q (q)}
						<button
							onclick={() => handleSendMessage(q)}
							class="text-xs text-terminal-green/90 border border-terminal-green/40 rounded-full px-3 py-1.5 hover:bg-terminal-green/10 active:bg-terminal-green/20 transition-colors"
						>
							{q}
						</button>
					{/each}
				</div>
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

	<div class="border-t border-terminal-green/20 shrink-0">
		{#if suggestions.length > 0 && !isLoading}
			<div class="flex flex-wrap gap-2 px-4 pt-3">
				{#each suggestions as q (q)}
					<button
						onclick={() => handleSendMessage(q)}
						in:fly={{ y: 8, duration: 200 }}
						class="text-xs text-left text-terminal-green/90 border border-terminal-green/40 rounded-full px-3 py-1.5 hover:bg-terminal-green/10 active:bg-terminal-green/20 transition-colors"
					>
						{q}
					</button>
				{/each}
			</div>
		{/if}
		<ChatInput onSend={handleSendMessage} disabled={isLoading} autoFocus={visible} focusTrigger={focusTrigger} />
	</div>
</Modal>

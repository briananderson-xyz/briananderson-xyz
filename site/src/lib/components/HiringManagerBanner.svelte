<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import posthog from 'posthog-js';
	import { PUBLIC_POSTHOG_KEY } from '$env/static/public';

	interface Props {
		onOpenFitFinder: () => void;
	}

	let { onOpenFitFinder }: Props = $props();
	
	let visible = $state(false);
	let dismissed = $state(false);

	const DISMISS_KEY = 'hiring_manager_banner_dismissed';
	const DISMISS_DURATION_DAYS = 7;
	const SHOW_DELAY_MS = 30000; // 30 seconds

	onMount(() => {
		if (!browser) return;

		// Check if banner was recently dismissed
		const dismissedAt = localStorage.getItem(DISMISS_KEY);
		if (dismissedAt) {
			const daysSinceDismissal = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
			if (daysSinceDismissal < DISMISS_DURATION_DAYS) {
				dismissed = true;
				return;
			}
		}

		// Show banner after delay
		const timer = setTimeout(() => {
			if (!dismissed) {
				visible = true;
				
				if (PUBLIC_POSTHOG_KEY) {
					posthog.capture('hiring_banner_shown', {
						page: $page.url.pathname,
						timeOnPage: SHOW_DELAY_MS / 1000
					});
				}
			}
		}, SHOW_DELAY_MS);

		return () => clearTimeout(timer);
	});

	function handleDismiss(method: 'x_button' | 'maybe_later') {
		visible = false;
		dismissed = true;
		
		if (browser) {
			localStorage.setItem(DISMISS_KEY, Date.now().toString());
		}

		if (browser && PUBLIC_POSTHOG_KEY) {
			posthog.capture('hiring_banner_dismissed', {
				method,
				daysUntilShowAgain: DISMISS_DURATION_DAYS
			});
		}
	}

	function handleTryFitFinder() {
		visible = false;
		
		if (browser && PUBLIC_POSTHOG_KEY) {
			posthog.capture('hiring_banner_cta_clicked', {
				target: 'fit_finder'
			});
		}

		onOpenFitFinder();
	}
</script>

{#if visible && !dismissed}
	<div 
		class="banner-container"
		data-testid="hiring-banner"
		role="dialog"
		aria-labelledby="banner-title"
	>
		<div class="banner-content">
			<button 
				onclick={() => handleDismiss('x_button')}
				class="banner-close"
				data-testid="dismiss-banner"
				aria-label="Dismiss banner"
			>
				×
			</button>

			<div class="banner-icon">
				👋
			</div>

			<h3 id="banner-title" class="banner-title">
				Hiring Manager?
			</h3>

			<p class="banner-text">
				Paste a job description and I'll instantly tell you if I'm a good fit for your role.
			</p>

			<div class="banner-actions">
				<button
					onclick={handleTryFitFinder}
					class="banner-button-primary"
					data-testid="fit-finder-cta"
				>
					Try Fit Finder
				</button>
				<button
					onclick={() => handleDismiss('maybe_later')}
					class="banner-button-secondary"
				>
					Maybe Later
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.banner-container {
		@apply fixed bottom-6 right-6 z-40 max-w-sm;
		@apply animate-in slide-in-from-bottom-4 fade-in duration-500;
		@apply print:hidden;
	}

	.banner-content {
		@apply relative bg-terminal-black border-2 border-terminal-green rounded-lg p-6 shadow-2xl;
		@apply backdrop-blur-sm;
	}

	.banner-close {
		@apply absolute top-2 right-2 text-2xl leading-none;
		@apply text-terminal-text/50 hover:text-terminal-green transition-colors cursor-pointer;
	}

	.banner-icon {
		@apply text-4xl mb-3;
	}

	.banner-title {
		@apply text-xl font-mono text-terminal-green font-bold mb-2;
	}

	.banner-text {
		@apply text-sm text-terminal-text/80 mb-4 leading-relaxed;
	}

	.banner-actions {
		@apply flex flex-col gap-2;
	}

	.banner-button-primary {
		@apply w-full px-4 py-2 bg-terminal-green text-terminal-black font-mono font-semibold rounded;
		@apply hover:bg-terminal-green/90 transition-colors;
	}

	.banner-button-secondary {
		@apply w-full px-4 py-2 bg-transparent border border-terminal-green/30 text-terminal-green font-mono rounded;
		@apply hover:bg-terminal-green/10 transition-colors;
	}

	/* Animation utilities */
	@keyframes slide-in-from-bottom {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.animate-in {
		animation-fill-mode: both;
	}

	.slide-in-from-bottom-4 {
		animation-name: slide-in-from-bottom;
	}

	.fade-in {
		animation-name: fade-in;
	}

	.duration-500 {
		animation-duration: 500ms;
	}
</style>

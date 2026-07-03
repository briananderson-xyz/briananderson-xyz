<script lang="ts">
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Whether the modal is shown. */
		visible: boolean;
		/** Called when the user dismisses (backdrop click, Escape, or the × button). */
		onClose: () => void;
		/** Title shown in the header bar. */
		title: string;
		/** id used for aria-labelledby (must be unique per modal). */
		labelledby?: string;
		/** aria-label for the close button. */
		closeLabel?: string;
		/** data-testid on the backdrop, for e2e. */
		testid?: string;
		/**
		 * When true the card is a fixed-height panel on desktop (md:h-[80vh]) so a
		 * pinned footer like a chat input stays put. When false it sizes to its
		 * content up to md:max-h-[90vh]. On mobile it is always full-screen.
		 */
		fill?: boolean;
		/**
		 * Desktop placement. 'center' is the default dialog placement; 'top' anchors
		 * the card near the top (for command-palette style modals). Mobile is always
		 * a full-screen sheet regardless.
		 */
		align?: 'center' | 'top';
		/** Optional extra buttons rendered in the header, left of the × (e.g. "Clear"). */
		actions?: Snippet;
		/** Modal body. */
		children: Snippet;
	}

	let {
		visible,
		onClose,
		title,
		labelledby = 'modal-title',
		closeLabel = 'Close',
		testid,
		fill = false,
		align = 'center',
		actions,
		children
	}: Props = $props();

	// Elements that can receive keyboard focus, for the focus trap.
	const FOCUSABLE =
		'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

	let panel = $state<HTMLElement | null>(null);

	// Track the visual viewport so the mobile sheet hugs the space *above* the
	// on-screen keyboard. 100dvh shrinks for browser chrome but not for the
	// keyboard on iOS, so without this the header gets scrolled off the top when
	// an input is focused. visualViewport.height/offsetTop follow the keyboard.
	let isMobile = $state(false);
	let vvHeight = $state(0);
	let vvOffsetTop = $state(0);

	$effect(() => {
		if (!visible || !browser) return;

		const mq = window.matchMedia('(max-width: 767px)');
		const syncMobile = () => (isMobile = mq.matches);
		syncMobile();
		mq.addEventListener('change', syncMobile);

		const vv = window.visualViewport;
		const syncVv = () => {
			if (!vv) return;
			vvHeight = vv.height;
			vvOffsetTop = vv.offsetTop;
		};
		syncVv();
		vv?.addEventListener('resize', syncVv);
		vv?.addEventListener('scroll', syncVv);

		return () => {
			mq.removeEventListener('change', syncMobile);
			vv?.removeEventListener('resize', syncVv);
			vv?.removeEventListener('scroll', syncVv);
		};
	});

	// On mobile, pin the sheet to the visible viewport (falls back to the
	// h-[100dvh] class when visualViewport is unavailable). Desktop uses classes.
	const panelStyle = $derived(
		isMobile && vvHeight ? `height:${vvHeight}px;transform:translateY(${vvOffsetTop}px);` : ''
	);

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}

	// Escape closes, regardless of where focus currently sits.
	$effect(() => {
		if (visible && browser) {
			const onKey = (e: KeyboardEvent) => {
				if (e.key === 'Escape') onClose();
			};
			window.addEventListener('keydown', onKey);
			return () => window.removeEventListener('keydown', onKey);
		}
	});

	// While open: lock body scroll, move focus into the dialog, and restore focus
	// to the previously focused element on close. This makes every modal that uses
	// this shell a proper accessible dialog.
	$effect(() => {
		if (!visible || !browser) return;

		const restoreFocus = document.activeElement as HTMLElement | null;
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		const raf = requestAnimationFrame(() => {
			if (!panel) return;
			// Respect a child that focused its own control (e.g. a chat input or a
			// command-palette search box). Otherwise focus a [data-autofocus] target,
			// then the first focusable, then the panel itself.
			if (panel.contains(document.activeElement)) return;
			const target =
				panel.querySelector<HTMLElement>('[data-autofocus]') ??
				panel.querySelector<HTMLElement>(FOCUSABLE) ??
				panel;
			target?.focus();
		});

		return () => {
			cancelAnimationFrame(raf);
			document.body.style.overflow = prevOverflow;
			restoreFocus?.focus?.();
		};
	});

	// Trap Tab within the dialog so focus cannot escape to the page behind it.
	function trapTab(e: KeyboardEvent) {
		if (e.key !== 'Tab' || !panel) return;
		const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
			(el) => el.offsetParent !== null
		);
		if (nodes.length === 0) {
			e.preventDefault();
			panel.focus();
			return;
		}
		const first = nodes[0];
		const last = nodes[nodes.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}
</script>

{#if visible}
	<!--
		Mobile: full-screen sheet anchored to the top, sized with 100dvh so the
		virtual keyboard shrinks it instead of shoving a centered card off-screen.
		Desktop (md+): a bordered card, centered or top-anchored per `align`.
	-->
	<div
		class="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm md:p-4 {align === 'top'
			? 'md:items-start md:justify-center md:pt-20'
			: 'md:items-center md:justify-center'}"
		role="dialog"
		aria-modal="true"
		aria-labelledby={labelledby}
		tabindex="-1"
		data-testid={testid}
		onclick={handleBackdropClick}
		onkeydown={trapTab}
	>
		<div
			bind:this={panel}
			tabindex="-1"
			style={panelStyle}
			class="bg-terminal-black border-terminal-green shadow-2xl w-full h-[100dvh] flex flex-col border-0 md:border-2 md:max-w-4xl focus:outline-none {fill
				? 'md:h-[80vh]'
				: 'md:h-auto md:max-h-[90vh]'}"
		>
			<div
				class="flex justify-between items-center px-3 py-2 md:px-4 bg-terminal-green/10 border-b-2 border-terminal-green font-mono text-terminal-green"
			>
				<span id={labelledby} class="truncate">{title}</span>
				<div class="flex items-center gap-1 md:gap-2 shrink-0">
					{#if actions}{@render actions()}{/if}
					<span class="hidden md:inline text-xs text-terminal-green/70">Esc</span>
					<button
						onclick={onClose}
						class="flex items-center justify-center w-11 h-11 -mr-1 text-2xl leading-none rounded hover:bg-terminal-green/10 active:bg-terminal-green/20 transition-colors cursor-pointer"
						aria-label={closeLabel}
					>
						×
					</button>
				</div>
			</div>

			<div class="flex-1 min-h-0 flex flex-col">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

interface RevealOptions {
	/** Delay in ms before the element animates in (used to stagger groups). */
	delay?: number;
	/** Vertical offset in px the element rises from. */
	y?: number;
}

/**
 * Reveal-on-scroll: fades and rises an element into view the first time it
 * enters the viewport, then stops observing. Honors prefers-reduced-motion
 * (no-op) and is SSR-safe (only runs client-side as a Svelte action).
 *
 * Usage: `use:reveal` or `use:reveal={{ delay: 80, y: 16 }}`.
 */
export function reveal(node: HTMLElement, options: RevealOptions = {}) {
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (reduceMotion) return;

	const { delay = 0, y = 12 } = options;

	node.style.opacity = '0';
	node.style.transform = `translateY(${y}px)`;
	node.style.transition = `opacity 500ms ease-out ${delay}ms, transform 500ms ease-out ${delay}ms`;
	node.style.willChange = 'opacity, transform';

	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				node.style.opacity = '1';
				node.style.transform = 'none';
				io.unobserve(node);
			}
		},
		{ threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
	);

	io.observe(node);

	return {
		destroy() {
			io.disconnect();
		}
	};
}

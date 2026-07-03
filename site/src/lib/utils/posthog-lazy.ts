import type { PostHog, PostHogConfig } from 'posthog-js';

/**
 * Lazy PostHog loader. `posthog-js` is ~100 KB gzip and is not needed for first
 * paint, so it's kept out of the initial bundle and only fetched (via dynamic
 * import) once analytics actually starts. `import type` above is erased at
 * build time, so it adds nothing to the bundle.
 */

let phPromise: Promise<PostHog | null> | null = null;

/**
 * Dynamically import and initialize PostHog exactly once. Repeated calls return
 * the same in-flight/resolved promise. Resolves to null if the import fails.
 */
export function loadPostHog(
	key: string,
	options: Partial<PostHogConfig>
): Promise<PostHog | null> {
	if (phPromise) return phPromise;
	phPromise = import('posthog-js')
		.then(({ default: posthog }) => {
			posthog.init(key, options);
			return posthog;
		})
		.catch((err) => {
			console.error('Failed to load PostHog', err);
			return null;
		});
	return phPromise;
}

/**
 * Run `fn` with the initialized PostHog once it's ready. No-op if PostHog was
 * never loaded (e.g. no key configured), so callers don't need their own guard
 * beyond deciding whether analytics is enabled at all.
 */
export function withPostHog(fn: (ph: PostHog) => void): void {
	if (!phPromise) return;
	phPromise.then((ph) => ph && fn(ph)).catch(() => {});
}

import type { PostHog, PostHogConfig } from "posthog-js";

/**
 * Lazy PostHog loader. `posthog-js` is ~100 KB gzip and is not needed for first
 * paint, so it's kept out of the initial bundle and only fetched (via dynamic
 * import) once analytics actually starts. `import type` above is erased at
 * build time, so it adds nothing to the bundle.
 */

let phPromise: Promise<PostHog | null> | null = null;

/**
 * Local privacy controls take precedence over remote project settings. The site
 * uses explicit, content-free events, so DOM autocapture and replay are not
 * needed. The mask settings are defense in depth if recording is ever enabled
 * deliberately in a future code change.
 */
export const POSTHOG_PRIVACY_CONFIG = {
  autocapture: false,
  rageclick: false,
  disable_session_recording: true,
  capture_exceptions: false,
  mask_all_text: true,
  mask_all_element_attributes: true,
  session_recording: {
    maskAllInputs: true
  }
} satisfies Partial<PostHogConfig>;

/**
 * Dynamically import and initialize PostHog exactly once. Repeated calls return
 * the same in-flight/resolved promise. Resolves to null if the import fails.
 */
export function loadPostHog(key: string, options: Partial<PostHogConfig>): Promise<PostHog | null> {
  if (phPromise) return phPromise;
  phPromise = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(key, options);
      return posthog;
    })
    .catch((err) => {
      console.error("Failed to load PostHog", err);
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

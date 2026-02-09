<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import posthog from "posthog-js";
  import { PUBLIC_POSTHOG_KEY } from "$env/static/public";

  interface Props {
    onOpenFitFinder: () => void;
    onOpenChat: () => void;
  }

  let { onOpenFitFinder, onOpenChat }: Props = $props();

  let visible = $state(false);
  let expanded = $state(false);
  let dismissed = $state(false);

  const DISMISS_KEY = "connect_banner_dismissed";
  const DISMISS_DURATION_DAYS = 7;
  const SHOW_DELAY_MS = 30000; // 30 seconds

  onMount(() => {
    if (!browser) return;

    // Check if banner was recently dismissed
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const daysSinceDismissal =
        (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
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
          posthog.capture("connect_banner_shown", {
            page: $page.url.pathname,
            timeOnPage: SHOW_DELAY_MS / 1000
          });
        }
      }
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  });

  function handleDismiss() {
    visible = false;
    dismissed = true;
    expanded = false;

    if (browser) {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }

    if (browser && PUBLIC_POSTHOG_KEY) {
      posthog.capture("connect_banner_dismissed", {
        wasExpanded: expanded,
        daysUntilShowAgain: DISMISS_DURATION_DAYS
      });
    }
  }

  function toggleExpanded() {
    expanded = !expanded;

    if (browser && PUBLIC_POSTHOG_KEY) {
      posthog.capture(expanded ? "connect_banner_expanded" : "connect_banner_collapsed");
    }
  }

  function handleFitFinderClick() {
    if (browser && PUBLIC_POSTHOG_KEY) {
      posthog.capture("connect_banner_action", {
        action: "fit_finder"
      });
    }
    onOpenFitFinder();
  }

  function handleChatClick() {
    if (browser && PUBLIC_POSTHOG_KEY) {
      posthog.capture("connect_banner_action", {
        action: "chat"
      });
    }
    onOpenChat();
  }
</script>

{#if visible && !dismissed}
  <div
    class="fixed bottom-6 right-6 z-40 print:hidden"
    data-testid="connect-banner"
    role="complementary"
    aria-label="Connect with Brian"
    style="animation-fill-mode: both; animation-name: slide-in-from-bottom, fade-in; animation-duration: 500ms;"
  >
    {#if !expanded}
      <!-- Collapsed State: Subtle pill/button -->
      <button
        onclick={toggleExpanded}
        class="group relative bg-terminal-black border-2 border-terminal-green rounded-full px-6 py-3 shadow-2xl backdrop-blur-sm hover:bg-terminal-green/10 transition-all duration-300 cursor-pointer"
        data-testid="connect-banner-collapsed"
      >
        <div class="flex items-center gap-3">
          <span class="text-xl">▸</span>
          <span class="font-mono text-terminal-green font-semibold">$ connect</span>
        </div>

        <!-- Pulse indicator -->
        <div class="absolute -top-1 -right-1 flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-terminal-green opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-terminal-green"></span>
        </div>
      </button>
    {:else}
      <!-- Expanded State: Full engagement options -->
      <div
        class="relative bg-terminal-black border-2 border-terminal-green rounded-lg p-6 shadow-2xl backdrop-blur-sm max-w-sm"
        style="animation-fill-mode: both; animation-name: scale-up; animation-duration: 300ms;"
      >
        <button
          onclick={handleDismiss}
          class="absolute top-2 right-2 text-2xl leading-none text-terminal-text/50 hover:text-terminal-green transition-colors cursor-pointer"
          data-testid="dismiss-banner"
          aria-label="Dismiss banner"
        >
          ×
        </button>

        <div class="text-4xl mb-3">▸</div>

        <h3 class="text-xl font-mono text-terminal-green font-bold mb-2">
          $ collaborate --with brian
        </h3>

        <p class="text-sm text-terminal-text/80 mb-4 leading-relaxed">
          Have a project or opportunity? Let's see if we're a good match.
        </p>

        <div class="flex flex-col gap-3">
          <!-- Fit Finder Option -->
          <button
            onclick={handleFitFinderClick}
            class="w-full text-left px-4 py-3 bg-terminal-green/10 border border-terminal-green/30 rounded hover:bg-terminal-green/20 transition-colors group"
            data-testid="fit-finder-option"
          >
            <div class="flex items-start gap-3">
              <span class="text-xl">⚡</span>
              <div class="flex-1">
                <div class="font-mono font-semibold text-terminal-green mb-1">
                  $ check-fit
                </div>
                <div class="text-xs text-terminal-text/70">
                  Paste your job/project description → instant compatibility analysis
                </div>
              </div>
            </div>
          </button>

          <!-- Chat Option -->
          <button
            onclick={handleChatClick}
            class="w-full text-left px-4 py-3 bg-terminal-green/10 border border-terminal-green/30 rounded hover:bg-terminal-green/20 transition-colors group"
            data-testid="chat-option"
          >
            <div class="flex items-start gap-3">
              <span class="text-xl">›</span>
              <div class="flex-1">
                <div class="font-mono font-semibold text-terminal-green mb-1">
                  $ ask-brian
                </div>
                <div class="text-xs text-terminal-text/70">
                  Chat about experience, skills, projects, or anything else
                </div>
              </div>
            </div>
          </button>

          <!-- Direct Contact -->
          <a
            href="mailto:brian@briananderson.xyz"
            class="w-full text-left px-4 py-3 bg-terminal-green/10 border border-terminal-green/30 rounded hover:bg-terminal-green/20 transition-colors group block"
            data-testid="contact-option"
          >
            <div class="flex items-start gap-3">
              <span class="text-xl">@</span>
              <div class="flex-1">
                <div class="font-mono font-semibold text-terminal-green mb-1">
                  $ email
                </div>
                <div class="text-xs text-terminal-text/70">
                  Direct email → brian@briananderson.xyz
                </div>
              </div>
            </div>
          </a>
        </div>

        <!-- Collapse button -->
        <button
          onclick={toggleExpanded}
          class="w-full mt-4 text-center text-xs text-terminal-text/50 hover:text-terminal-green transition-colors font-mono"
        >
          Minimize ▼
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
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

  @keyframes scale-up {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>

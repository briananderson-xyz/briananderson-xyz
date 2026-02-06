<script lang="ts">
  import { onMount } from "svelte";
  import "$lib/styles/app.css";
  import Navbar from "$lib/components/Navbar.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import QuickActions from "$lib/components/QuickActions.svelte";
  import KeyboardShortcutsHelp from "$lib/components/KeyboardShortcutsHelp.svelte";
  import Chatbot from "$lib/components/Chatbot.svelte";
  import FitFinder from "$lib/components/FitFinder.svelte";
  import HiringManagerBanner from "$lib/components/HiringManagerBanner.svelte";
  import { useKeyboardShortcuts, type KeyboardShortcut } from "$lib/hooks/useKeyboardShortcuts";
  import { browser } from "$app/environment";
  import { beforeNavigate, afterNavigate } from "$app/navigation";
  import posthog from "posthog-js";
  import { PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_HOST } from "$env/static/public";

  let quickActionsVisible = $state(false);
  let shortcutsHelpVisible = $state(false);
  let chatbotVisible = $state(false);
  let fitFinderVisible = $state(false);

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      meta: true,
      description: 'Open Quick Actions',
      handler: () => {
        // Close other modals first
        chatbotVisible = false;
        fitFinderVisible = false;
        shortcutsHelpVisible = false;
        // Open Quick Actions
        quickActionsVisible = true;
        if (browser && PUBLIC_POSTHOG_KEY) {
          posthog.capture('keyboard_shortcut_used', { shortcut: 'cmd+k' });
        }
      }
    },
    {
      key: 'i',
      meta: true,
      description: 'Toggle AI Chatbot',
      handler: () => {
        // Close other modals first
        quickActionsVisible = false;
        fitFinderVisible = false;
        shortcutsHelpVisible = false;
        // Toggle chatbot
        chatbotVisible = !chatbotVisible;
        if (browser && PUBLIC_POSTHOG_KEY) {
          posthog.capture('keyboard_shortcut_used', { shortcut: 'cmd+i' });
          if (chatbotVisible) {
            posthog.capture('chat_opened', { source: 'shortcut' });
          }
        }
      }
    },
    {
      key: 'f',
      meta: true,
      description: 'Open Fit Finder',
      handler: () => {
        // Close other modals first
        quickActionsVisible = false;
        chatbotVisible = false;
        shortcutsHelpVisible = false;
        // Open Fit Finder
        fitFinderVisible = true;
        if (browser && PUBLIC_POSTHOG_KEY) {
          posthog.capture('keyboard_shortcut_used', { shortcut: 'cmd+f' });
          posthog.capture('fit_finder_opened', { source: 'shortcut' });
        }
      }
    },
    {
      key: '?',
      meta: true,
      shift: true,
      description: 'Show Keyboard Shortcuts',
      handler: () => {
        // Close other modals first
        quickActionsVisible = false;
        chatbotVisible = false;
        fitFinderVisible = false;
        // Open shortcuts help
        shortcutsHelpVisible = true;
        if (browser && PUBLIC_POSTHOG_KEY) {
          posthog.capture('keyboard_help_opened', { source: 'shortcut' });
        }
      }
    },
    {
      key: 'h',
      meta: true,
      description: 'Go Home',
      handler: () => {
        if (browser) {
          window.location.href = '/';
        }
      }
    },
    {
      key: 'Escape',
      description: 'Close All Overlays',
      handler: () => {
        quickActionsVisible = false;
        shortcutsHelpVisible = false;
        chatbotVisible = false;
        fitFinderVisible = false;
      }
    }
  ];

  if (browser) {
    useKeyboardShortcuts(shortcuts);

    onMount(() => {
      if (PUBLIC_POSTHOG_KEY) {
        console.log(
          "Initializing PostHog with key starting:",
          PUBLIC_POSTHOG_KEY.substring(0, 4),
        );
        posthog.init(PUBLIC_POSTHOG_KEY, {
          api_host: PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
          capture_pageview: false,
          capture_pageleave: false,
          capture_exceptions: true,
          loaded: (ph) => {
            const deploymentEnv =
              typeof window !== "undefined" &&
              window.location.hostname.includes("dev.")
                ? "dev"
                : "production";
            ph.register({
              deployment_environment: deploymentEnv,
            });
            console.log("PostHog loaded, env:", deploymentEnv);
          },
        });
        // Force capture initial pageview on mount to be sure
        posthog.capture("$pageview");
      } else {
        console.warn("PostHog key not found");
      }
    });

    beforeNavigate(() => posthog.capture("$pageleave"));

    // Track subsequent navigations
    let isInitial = true;
    afterNavigate(() => {
      if (isInitial) {
        isInitial = false;
        return; // Handled by onMount
      }
      posthog.capture("$pageview");
    });
  }
</script>

<svelte:head>
  <link rel="llms" href="/llms.txt" />
  <link rel="alternate" type="application/json" href="/resume.json" />
</svelte:head>

<div
  class="pointer-events-none fixed inset-0 z-30 overflow-hidden print:hidden"
>
  <div class="scanlines pointer-events-none"></div>
</div>

<div
  class="min-h-screen print:min-h-0 flex flex-col bg-skin-page text-skin-base font-sans transition-colors duration-300"
>
  <Navbar 
    onOpenShortcutsHelp={() => shortcutsHelpVisible = true}
    onOpenChat={() => {
      quickActionsVisible = false;
      fitFinderVisible = false;
      shortcutsHelpVisible = false;
      chatbotVisible = true;
    }}
    onOpenFitFinder={() => {
      quickActionsVisible = false;
      chatbotVisible = false;
      shortcutsHelpVisible = false;
      fitFinderVisible = true;
    }}
    onOpenQuickActions={() => {
      chatbotVisible = false;
      fitFinderVisible = false;
      shortcutsHelpVisible = false;
      quickActionsVisible = true;
    }}
  />
  <main
    class="flex-1 w-full max-w-6xl mx-auto p-4 md:p-6 print:p-0 print:max-w-none"
  >
    <slot />
  </main>
  <Footer />
</div>

<QuickActions 
  visible={quickActionsVisible} 
  onClose={() => quickActionsVisible = false} 
/>

<Chatbot
  visible={chatbotVisible}
  onClose={() => chatbotVisible = false}
/>

<FitFinder
  visible={fitFinderVisible}
  onClose={() => fitFinderVisible = false}
/>

<HiringManagerBanner
  onOpenFitFinder={() => fitFinderVisible = true}
/>

<KeyboardShortcutsHelp 
  {shortcuts}
  visible={shortcutsHelpVisible}
  onClose={() => shortcutsHelpVisible = false}
/>

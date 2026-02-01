<script lang="ts">
  import { onMount } from "svelte";
  import "$lib/styles/app.css";
  import Navbar from "$lib/components/Navbar.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { browser } from "$app/environment";
  import { beforeNavigate, afterNavigate } from "$app/navigation";
  import posthog from "posthog-js";
  import { PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_HOST } from "$env/static/public";

  if (browser) {
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
  <title>Brian Anderson</title>
  <link rel="llms" href="/llms.txt">
  <link rel="alternate" type="application/json" href="/resume.json">
</svelte:head>

<div
  class="pointer-events-none fixed inset-0 z-30 overflow-hidden print:hidden"
>
  <div class="scanlines pointer-events-none"></div>
</div>

<div
  class="min-h-screen print:min-h-0 flex flex-col bg-skin-page text-skin-base font-sans transition-colors duration-300"
>
  <Navbar />
  <main
    class="flex-1 w-full max-w-6xl mx-auto p-4 md:p-6 print:p-0 print:max-w-none"
  >
    <slot />
  </main>
  <Footer />
</div>

<script lang="ts">
  import { Menu, Terminal } from "lucide-svelte";
  import { slide } from "svelte/transition";
  import { onMount } from "svelte";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  import { page } from "$app/stores";
  import { addVariant } from "$lib/utils/variantLink";

  let open = false;
  let activeRoute = '/';
  let variant: string | null = null;

  $: if (typeof window !== 'undefined') {
    activeRoute = $page.url.pathname;
    variant = $page.url.searchParams.get('v');
  }

  onMount(() => {
    activeRoute = $page.url.pathname;
    variant = $page.url.searchParams.get('v');
  });
</script>

<header
  class="sticky top-0 z-40 bg-skin-page/90 backdrop-blur border-b border-skin-border font-mono transition-colors duration-300 print:hidden"
>
  <div
    class="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4"
  >
    <a
      href={addVariant('/', variant)}
      class="text-sm md:text-base font-bold tracking-tight text-skin-base flex items-center gap-2 group"
    >
      <span class="text-skin-accent group-hover:animate-pulse"
        >guest@briananderson:~$</span
      >
      <span class="w-2 h-4 bg-skin-accent animate-terminal-blink"></span>
    </a>

    <nav class="hidden md:flex gap-6 text-sm items-center">
      <a
        class="hover:text-skin-accent transition-colors text-skin-muted"
        href={addVariant('/#about', variant)}>./about</a
      >
      <a
        class="hover:text-skin-accent transition-colors {activeRoute ===
        '/resume' || activeRoute.endsWith('/resume/')
          ? 'text-skin-accent'
          : 'text-skin-muted'}"
        href={addVariant('/resume/', variant)}>./resume</a
      >
      <a
        class="hover:text-skin-accent transition-colors {activeRoute ===
        '/projects' || activeRoute === '/projects/'
          ? 'text-skin-accent'
          : 'text-skin-muted'}"
        href={addVariant('/projects/', variant)}>./projects</a
      >
      <a
        class="hover:text-skin-accent transition-colors {activeRoute.startsWith(
          '/blog',
        )
          ? 'text-skin-accent'
          : 'text-skin-muted'}"
        href={addVariant('/blog/', variant)}>./blog</a
      >
      <a
        class="hover:text-skin-accent transition-colors text-skin-muted"
        href={addVariant('/#contact', variant)}>./contact</a
      >
      <ThemeToggle />
    </nav>

    <button
      class="md:hidden p-2 text-skin-muted hover:text-skin-accent"
      aria-label="Menu"
      on:click={() => (open = !open)}
    >
      <Menu size={20} />
    </button>
  </div>

  {#if open}
    <div
      transition:slide
      class="md:hidden border-t border-skin-border bg-skin-page"
    >
      <div
        class="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3 font-mono text-sm"
      >
        <a
          class="text-skin-muted hover:text-skin-accent"
          on:click={() => (open = false)}
          href={addVariant('/#about', variant)}>./about</a
        >
        <a
          class="text-skin-muted hover:text-skin-accent"
          on:click={() => (open = false)}
          href={addVariant('/resume/', variant)}>./resume</a
        >
        <a
          class="text-skin-muted hover:text-skin-accent"
          on:click={() => (open = false)}
          href={addVariant('/projects/', variant)}>./projects</a
        >
        <a
          class="text-skin-muted hover:text-skin-accent"
          on:click={() => (open = false)}
          href={addVariant('/blog/', variant)}>./blog</a
        >
        <a
          class="text-skin-muted hover:text-skin-accent"
          on:click={() => (open = false)}
          href={addVariant('/#contact', variant)}>./contact</a
        >
        <div
          class="pt-2 border-t border-skin-border mt-2 flex justify-between items-center"
        >
          <span class="text-xs text-skin-muted">Theme:</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  {/if}
</header>

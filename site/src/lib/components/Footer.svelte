<script lang="ts">
  import { page } from "$app/stores";
  import VariantSwitcher from "$lib/components/VariantSwitcher.svelte";

  const isError = $derived($page.status >= 400);
</script>

<footer
  class="border-t border-skin-border bg-skin-page mt-auto font-mono text-xs transition-colors duration-300 print:hidden"
>
  <div
    class="mx-auto max-w-6xl px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-skin-muted"
  >
    <div class="flex items-center gap-2 uppercase">
      <span class={isError ? "text-skin-error animate-pulse" : "text-skin-success"}>●</span>
      <span>
        SYSTEM:
        {#if isError}
          <span class="text-skin-error">OFFLINE ({$page.status})</span>
        {:else}
          ONLINE
        {/if}
      </span>
      <span class="mx-2 opacity-50">|</span>
      <span class="opacity-70 text-[10px]">v1.0.0</span>
      <VariantSwitcher />
    </div>

    <nav
      aria-label="Evidence and contact links"
      class="flex flex-wrap items-center justify-center gap-4"
    >
      <a href="/proof/" class="hover:text-skin-accent transition-colors">[ proof ]</a>
      <a href="/ai-evals/" class="hover:text-skin-accent transition-colors">[ ai evals ]</a>
      <a href="/trace-one-answer/" class="hover:text-skin-accent transition-colors">[ ai trace ]</a>
      <a href="/now/" class="hover:text-skin-accent transition-colors">[ now ]</a>
      <a href="/uses/" class="hover:text-skin-accent transition-colors">[ uses ]</a>
      <a
        href="https://github.com/briananderson1222"
        target="_blank"
        rel="noreferrer"
        class="hover:text-skin-accent transition-colors">[ github ]</a
      >
      <a
        href="https://www.linkedin.com/in/brian--anderson/"
        target="_blank"
        rel="noreferrer"
        class="hover:text-skin-accent transition-colors">[ linkedin ]</a
      >
      <a href="mailto:brian@briananderson.xyz" class="hover:text-skin-accent transition-colors"
        >[ email ]</a
      >
    </nav>
  </div>
</footer>

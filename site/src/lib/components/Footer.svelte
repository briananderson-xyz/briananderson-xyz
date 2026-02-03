<script lang="ts">
  import { page } from "$app/stores";
  import VariantSwitcher from "$lib/components/VariantSwitcher.svelte";

  $: isError = $page.status >= 400;
</script>

<footer
  class="border-t border-skin-border bg-skin-page mt-auto font-mono text-xs transition-colors duration-300 print:hidden"
>
  <div
    class="mx-auto max-w-6xl px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-skin-muted"
  >
    <div class="flex items-center gap-2 uppercase">
      <span class={isError ? "text-red-500 animate-pulse" : "text-skin-accent"}
        >●</span
      >
      <span>
        SYSTEM:
        {#if isError}
          <span class="text-red-500">OFFLINE ({$page.status})</span>
        {:else}
          ONLINE
        {/if}
      </span>
      <span class="mx-2 opacity-50">|</span>
      <span class="opacity-50 text-[10px]">v1.0.0</span>
      <VariantSwitcher />
    </div>

    <div class="flex items-center gap-4">
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
      <a
        href="mailto:brian@briananderson.xyz"
        class="hover:text-skin-accent transition-colors">[ email ]</a
      >
    </div>
  </div>
</footer>

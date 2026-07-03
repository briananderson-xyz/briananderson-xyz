<script lang="ts">
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { getCanonicalVariantPath, getVariant } from '$lib/utils/variantLink';
  import { variants } from '$lib/data/variants';

  // Resolve the active variant/path on the client (SSR keeps the neutral
  // default, matching the prior onMount-driven behavior).
  const currentVariant = $derived(browser ? getVariant($page.url) || 'default' : 'default');
  const currentPath = $derived(browser ? $page.url.pathname : '/');
</script>

<div class="flex items-center gap-2 text-[10px] uppercase">
  {#each variants as variant}
    <a
      href={getCanonicalVariantPath(currentPath, variant.key)}
      class="hover:text-skin-accent transition-colors {currentVariant === variant.key
        ? 'text-skin-accent font-bold'
        : 'text-skin-muted'}"
    >
      [{variant.displayName}]
    </a>
  {/each}
</div>

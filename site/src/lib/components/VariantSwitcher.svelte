<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { getCanonicalVariantPath, getVariant } from '$lib/utils/variantLink';
  import { variants } from '$lib/data/variants';

  let currentVariant = 'default';
  let currentPath = '/';

  $: if (typeof window !== 'undefined' && $page) {
    currentVariant = getVariant($page.url) || 'default';
    currentPath = $page.url.pathname;
  }

  onMount(() => {
    if ($page) {
      currentVariant = getVariant($page.url) || 'default';
      currentPath = $page.url.pathname;
    }
  });
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

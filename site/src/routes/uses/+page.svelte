<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import { getCanonicalUrl } from "$lib/utils/variantLink";

  interface SetupItem {
    label: string;
    value: string;
  }
  interface SetupCategory {
    name: string;
    items: SetupItem[];
  }
  interface Props {
    data: {
      setup: { name: string; description?: string; categories: SetupCategory[] } | null;
    };
  }

  let { data }: Props = $props();
</script>

<SEO
  title="Uses | Brian Anderson"
  description="The hardware, software, and tools I use daily to build."
  canonical={getCanonicalUrl("/uses/")}
/>

<section class="mx-auto max-w-4xl px-4 py-16">
  <div class="flex items-center gap-2 mb-4 font-mono text-skin-accent">
    <span>></span>
    <h1 class="text-3xl font-bold tracking-tight">./uses</h1>
  </div>
  <p class="font-mono text-skin-muted mb-12 border-l-2 border-skin-border pl-4 leading-relaxed">
    The hardware, software, and tools I rely on daily. This is a
    <a href="https://uses.tech" target="_blank" rel="noreferrer" class="text-skin-accent hover:underline">/uses</a>
    page: the same setup that lives on my
    <a href="/interests/#setup" class="text-skin-accent hover:underline">interests</a> page.
  </p>

  {#if data.setup}
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each data.setup.categories as category}
        <div class="border border-skin-border rounded-lg p-5 bg-skin-base/5 hover:border-skin-accent/50 transition-colors">
          <h2 class="font-mono text-xs font-bold uppercase tracking-wider text-skin-muted mb-4">
            {category.name}
          </h2>
          <dl class="space-y-2">
            {#each category.items as item}
              <div class="flex flex-col gap-0.5">
                <dt class="font-mono text-xs text-skin-muted/60 uppercase tracking-wide">{item.label}</dt>
                <dd class="font-mono text-sm text-skin-base">{item.value}</dd>
              </div>
            {/each}
          </dl>
        </div>
      {/each}
    </div>
  {:else}
    <div class="font-mono text-skin-muted">Error: Could not load setup.</div>
  {/if}
</section>

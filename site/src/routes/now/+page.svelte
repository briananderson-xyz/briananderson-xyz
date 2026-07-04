<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import { getCanonicalUrl } from "$lib/utils/variantLink";

  interface FocusItem {
    heading: string;
    body: string;
  }
  interface Props {
    data: {
      now: {
        title: string;
        description: string;
        updated: string;
        intro: string;
        focus: FocusItem[];
      };
    };
  }

  let { data }: Props = $props();

  const updatedLabel = $derived(
    new Date(`${data.now.updated}T00:00:00Z`).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
  );
</script>

<SEO
  title="Now | Brian Anderson"
  description={data.now.description}
  canonical={getCanonicalUrl("/now/")}
/>

<section class="mx-auto max-w-3xl px-4 py-16">
  <div class="flex items-center gap-2 mb-4 font-mono text-skin-accent">
    <span>></span>
    <h1 class="text-3xl font-bold tracking-tight">./now</h1>
  </div>
  <p class="font-mono text-skin-muted mb-2 border-l-2 border-skin-border pl-4 leading-relaxed">
    {data.now.intro}
  </p>
  <p class="font-mono text-xs text-skin-muted/70 mb-12 pl-4">
    Last updated {updatedLabel}
  </p>

  <div class="space-y-10">
    {#each data.now.focus as item}
      <div class="border-l-2 border-skin-border pl-4 hover:border-skin-accent transition-colors group">
        <h2 class="font-mono font-bold text-skin-base mb-2 group-hover:text-skin-accent transition-colors">
          {item.heading}
        </h2>
        <p class="font-mono text-sm text-skin-muted leading-relaxed">{item.body}</p>
      </div>
    {/each}
  </div>

  <p class="font-mono text-xs text-skin-muted/70 mt-14 pt-6 border-t border-skin-border">
    Inspired by <a href="https://nownownow.com/about" target="_blank" rel="noreferrer" class="text-skin-accent hover:underline">nownownow.com</a>.
    See also <a href="/uses/" class="text-skin-accent hover:underline">/uses</a>.
  </p>
</section>

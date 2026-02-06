<script lang="ts">
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { addVariant } from "$lib/utils/variantLink";
  import SEO from "$lib/components/SEO.svelte";

  function getVariant(url: URL): string | null {
    return browser ? url.searchParams.get("v") || null : null;
  }

  export let data;
  $: projects = data.projects;
</script>

<SEO
  title="Projects | Brian Anderson"
  description="A collection of deployed systems, experiments, and open source projects."
  canonical="https://briananderson.xyz/projects"
/>

<section class="mx-auto max-w-6xl px-4 py-16">
  <div class="flex items-center gap-2 mb-6 font-mono text-skin-accent">
    <span>></span>
    <h1 class="text-3xl font-bold tracking-tight">./projects</h1>
  </div>
  <p class="font-mono text-skin-muted mb-8 border-l-2 border-skin-border pl-4">
    A collection of deployed systems and experiments.
  </p>

  <div class="grid md:grid-cols-2 gap-6">
    {#each projects as p}
      <a
        href={addVariant(p.route, getVariant($page.url))}
        class="group block border border-skin-border bg-skin-base/5 hover:border-skin-accent hover:shadow-[0_0_10px_rgba(var(--color-accent),0.1)] transition-all duration-300 rounded-lg overflow-hidden"
      >
        {#if p.metadata.featuredImage}
          <div class="w-full aspect-video overflow-hidden">
            <img
              src={p.metadata.featuredImage}
              alt={p.metadata.featuredImageAlt || p.metadata.title}
              class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        {/if}
        
        <div class="p-6">
          <div class="flex justify-between items-start mb-2">
            <h2
              class="font-bold text-lg font-mono text-skin-base group-hover:text-skin-accent transition-colors"
            >
              {p.metadata.title}
            </h2>
            <span
              class="text-xs font-mono text-skin-muted border border-skin-border px-2 py-1 rounded"
            >
              {new Date(p.metadata.date).getFullYear()}
            </span>
          </div>

          {#if p.metadata.summary}
            <p class="text-skin-muted text-sm mb-4 font-mono leading-relaxed">
              {p.metadata.summary}
            </p>
          {/if}

          {#if p.metadata.tags}
            <div class="flex flex-wrap gap-2">
              {#each p.metadata.tags as tag}
                <span
                  class="text-xs font-mono text-skin-accent/80 before:content-['#']"
                >
                  {tag}
                </span>
              {/each}
            </div>
          {/if}
        </div>
      </a>
    {/each}
  </div>
</section>

<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";

  interface Creator {
    name: string;
    handle: string;
    url: string;
    description: string;
  }

  interface FollowingCategory {
    name: string;
    creators: Creator[];
  }

  interface Following {
    title: string;
    description: string;
    categories: FollowingCategory[];
  }

  interface Props {
    data: { following: Following | null };
  }

  let { data }: Props = $props();
</script>

{#if data.following}
  <SEO
    title="Following | Brian Anderson"
    description="Creators, engineers, and thinkers worth your attention. Channels Brian Anderson actually watches."
    canonical="https://briananderson.xyz/following"
  />

  <section class="mx-auto max-w-4xl px-4 py-16">
    <div class="flex items-center gap-2 mb-6 font-mono text-skin-accent">
      <span>></span>
      <h1 class="text-3xl font-bold tracking-tight">./following</h1>
    </div>
    <p class="font-mono text-skin-muted mb-12 border-l-2 border-skin-border pl-4 leading-relaxed">
      {data.following.description}
    </p>

    {#each data.following.categories as category}
      <div class="mb-12">
        <div class="flex items-center gap-2 mb-6 text-skin-accent font-mono text-sm uppercase tracking-wider">
          <span>></span>
          <h2 class="font-bold">{category.name}</h2>
        </div>
        <div class="grid gap-3">
          {#each category.creators as creator}
            <a
              href={creator.url}
              target="_blank"
              rel="noreferrer"
              class="group block border border-skin-border bg-skin-base/5 hover:border-skin-accent hover:shadow-[0_0_10px_rgba(var(--color-accent),0.1)] transition-all duration-300 rounded-lg p-4"
            >
              <div class="flex items-baseline justify-between mb-2 gap-4">
                <h3 class="font-mono font-bold text-skin-base group-hover:text-skin-accent transition-colors">
                  {creator.name}
                </h3>
                <span class="text-xs font-mono text-skin-muted shrink-0 group-hover:text-skin-accent/70 transition-colors">
                  {creator.handle} ↗
                </span>
              </div>
              <p class="text-skin-muted text-sm font-mono leading-relaxed">{creator.description}</p>
            </a>
          {/each}
        </div>
      </div>
    {/each}
  </section>
{:else}
  <div class="max-w-3xl mx-auto px-4 py-16 font-mono text-skin-muted">
    Error: Could not load following list.
  </div>
{/if}

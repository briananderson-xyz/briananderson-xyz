<script lang="ts">
  import { page } from "$app/stores";
  import SEO from "$lib/components/SEO.svelte";
  import { addVariant, getVariant } from "$lib/utils/variantLink";
  import { onMount } from "svelte";

  export let data: { posts: { metadata: any; route: string }[] };
  $: posts = data.posts;

  let variant: string | null = null;
  onMount(() => {
    variant = getVariant($page.url);
  });
</script>

<SEO
  title="Blog | Brian Anderson"
  description="dumping_core_memory.log - Thoughts, tutorials, and technical articles."
  canonical="https://briananderson.xyz/blog"
/>

<section class="mx-auto max-w-6xl px-4 py-16">
  <div class="flex items-center gap-2 mb-6 font-mono text-skin-accent">
    <span>></span>
    <h1 class="text-3xl font-bold tracking-tight">./blog</h1>
  </div>
  <p class="font-mono text-skin-muted mb-8 border-l-2 border-skin-border pl-4">
    dumping_core_memory.log
  </p>

  <div class="flex flex-col gap-1 font-mono">
    <div
      class="grid grid-cols-12 text-xs text-skin-muted uppercase tracking-wider mb-2 px-4"
    >
      <div class="col-span-3 md:col-span-2">Date</div>
      <div class="col-span-9 md:col-span-10">Title / Description</div>
    </div>

    {#each posts as post}
      <a
        href={addVariant(post.route, variant)}
        class="group grid grid-cols-12 gap-4 items-baseline p-4 hover:bg-skin-base/5 border-l-2 border-transparent hover:border-skin-accent transition-all rounded-r-lg"
      >
        <div class="col-span-3 md:col-span-2 text-xs text-skin-muted pt-1">
          {new Date(post.metadata.date).toISOString().split("T")[0]}
        </div>
        <div class="col-span-9 md:col-span-10">
          <h2
            class="text-base text-skin-base group-hover:text-skin-accent font-bold transition-colors mb-1"
          >
            {post.metadata.title}
          </h2>
          {#if post.metadata.summary}
            <p class="text-sm text-skin-muted line-clamp-2">
              {post.metadata.summary}
            </p>
          {/if}
        </div>
      </a>
    {/each}
  </div>
</section>

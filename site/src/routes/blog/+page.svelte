<script lang="ts">
  import { page } from '$app/stores';
  import { addVariant } from '$lib/utils/variantLink';

  const modules = import.meta.glob('/content/blog/**/*.md', { eager: true });
  type Item = { metadata: any; route: string };
  let posts: Item[] = [];
  for (const [path, mod] of Object.entries(modules)) {
    // @ts-ignore
    posts.push({ metadata: mod.metadata, route: path.replace('/content','').replace('.md','') });
  }
  posts.sort((a, b) => (a.metadata.date > b.metadata.date ? -1 : 1));

  function getVariant(): string | null {
    return $page?.url?.searchParams.get('v') || null;
  }
</script>

<section class="mx-auto max-w-4xl px-4 py-16">
  <div class="flex items-center gap-2 mb-6 font-mono text-skin-accent">
    <span>></span>
    <h1 class="text-3xl font-bold tracking-tight">./blog</h1>
  </div>
  <p class="font-mono text-skin-muted mb-8 border-l-2 border-skin-border pl-4">dumping_core_memory.log</p>

  <div class="flex flex-col gap-1 font-mono">
    <div class="grid grid-cols-12 text-xs text-skin-muted uppercase tracking-wider mb-2 px-4">
      <div class="col-span-3 md:col-span-2">Date</div>
      <div class="col-span-9 md:col-span-10">Title / Description</div>
    </div>
    
    {#each posts as post}
      <a href={addVariant(post.route, getVariant())} class="group grid grid-cols-12 gap-4 items-baseline p-4 hover:bg-skin-base/5 border-l-2 border-transparent hover:border-skin-accent transition-all rounded-r-lg">
        <div class="col-span-3 md:col-span-2 text-xs text-skin-muted pt-1">
          {new Date(post.metadata.date).toISOString().split('T')[0]}
        </div>
        <div class="col-span-9 md:col-span-10">
          <h2 class="text-base text-skin-base group-hover:text-skin-accent font-bold transition-colors mb-1">
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

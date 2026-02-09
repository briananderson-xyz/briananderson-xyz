<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import ImageGallery from "$lib/components/ImageGallery.svelte";
  import type { ContentMetadata } from "$lib/utils/content-loader";

  export let data: { html: string | null; metadata: ContentMetadata };
</script>

{#if data?.html}
  <SEO
    title="{data.metadata.title} | Blog"
    description={data.metadata.summary || data.metadata.title}
    tags={data.metadata.tags}
    keywords={data.metadata.keywords}
    image={data.metadata.featuredImage}
  />

  <article class="mx-auto max-w-4xl px-4">
    <ImageGallery>
      <div class="prose prose-lg max-w-none prose-headings:font-mono">
        {@html data.html}
      </div>
    </ImageGallery>
  </article>
{:else}
  <div class="max-w-3xl mx-auto px-4 py-16 font-mono text-skin-muted">
    Error 404: Post not found.
  </div>
{/if}

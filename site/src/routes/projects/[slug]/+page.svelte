<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import ImageGallery from "$lib/components/ImageGallery.svelte";
  import VisualArchive from "$lib/components/VisualArchive.svelte";
  import type { ContentMetadata } from "$lib/utils/content-loader";

  interface Props {
    data: { html: string | null; metadata: ContentMetadata };
  }

  let { data }: Props = $props();
</script>

{#if data?.html}
  <SEO
    title="{data.metadata.title} | Projects"
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

    {#if data.metadata.visualArchive?.images?.length}
      <VisualArchive images={data.metadata.visualArchive.images} />
    {/if}
  </article>
{:else}
  <div class="max-w-3xl mx-auto px-4 py-16 font-mono text-skin-muted">
    Error 404: Project not found.
  </div>
{/if}

<script lang="ts">
  import { addVariant } from "$lib/utils/variantLink";
  import SEO from "$lib/components/SEO.svelte";

  export let data: { html: string | null; metadata: any };
</script>

{#if data?.html}
  <SEO
    title="{data.metadata.title} | Blog"
    description={data.metadata.summary || data.metadata.title}
  />

  <article class="mx-auto max-w-4xl px-4 py-8">
    <div class="prose prose-lg max-w-none prose-headings:font-mono">
      {@html data.html}
    </div>
  </article>
{:else}
  <div class="max-w-3xl mx-auto px-4 py-16 font-mono text-skin-muted">
    Error 404: Post not found.
  </div>
{/if}

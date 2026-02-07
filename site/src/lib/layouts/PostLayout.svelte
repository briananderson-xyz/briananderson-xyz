<script lang="ts">
  import Lightbox from "$lib/components/Lightbox.svelte";
  import type { ContentMetadata } from "$lib/utils/content-loader";
  import type { Snippet } from "svelte";

  interface Props {
    metadata: ContentMetadata;
    children: Snippet;
  }

  let { metadata, children }: Props = $props();
  
  let lightboxOpen = $state(false);
  
  function openLightbox() {
    if (metadata.featuredImage) {
      lightboxOpen = true;
    }
  }
  
  function closeLightbox() {
    lightboxOpen = false;
  }
</script>

<article class="prose prose-zinc max-w-3xl mx-auto px-4 py-16">
  <header class="mb-10 not-prose border-b border-skin-border pb-8">
    <div
      class="flex items-center gap-2 text-skin-accent font-mono text-xs mb-4"
    >
      <span>></span>
      <span>cat {metadata.title.toLowerCase().replace(/\s+/g, "_")}.md</span>
    </div>

    <h1
      class="text-3xl md:text-4xl font-bold font-mono tracking-tight text-skin-base mb-4"
    >
      {metadata.title}
    </h1>

    <div class="flex items-center gap-4 font-mono text-xs text-skin-muted">
      {#if metadata.date}
        <span class="flex items-center gap-1">
          <span class="text-skin-accent">[DATE]</span>
          {new Date(metadata.date).toISOString().split("T")[0]}
        </span>
      {/if}
      {#if metadata.readingTime}
        <span class="flex items-center gap-1">
          <span class="text-skin-accent">[TIME]</span>
          {metadata.readingTime}
        </span>
      {/if}
    </div>
  </header>

  {#if metadata.featuredImage}
    <div class="mb-10 not-prose">
      <button
        onclick={openLightbox}
        class="cursor-pointer group"
        aria-label="View full size image"
      >
        <img
          src={metadata.featuredImage}
          alt={metadata.featuredImageAlt || metadata.title}
          class="max-h-[30vh] rounded-lg border border-skin-border shadow-lg group-hover:border-skin-accent transition-colors"
        />
      </button>
      {#if metadata.featuredImageCaption}
        <p class="text-sm text-skin-muted font-mono mt-2">
          {metadata.featuredImageCaption}
        </p>
      {/if}
    </div>
  {/if}

  <div class="font-sans text-lg leading-relaxed text-skin-base">
    {@render children()}
  </div>
</article>

{#if lightboxOpen && metadata.featuredImage}
  <Lightbox images={[metadata.featuredImage]} currentIndex={0} onClose={closeLightbox} />
{/if}

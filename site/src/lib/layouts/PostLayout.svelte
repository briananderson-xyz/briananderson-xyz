<script lang="ts">
  import Lightbox from "$lib/components/Lightbox.svelte";
  import type { ContentMetadata } from "$lib/utils/content-loader";
  import type { Snippet } from "svelte";
  import { titleTransitionName } from "$lib/utils/transitionName";

  interface Props {
    metadata: ContentMetadata;
    children: Snippet;
  }

  let { metadata, children }: Props = $props();

  // Shared-element view transition: this title morphs from the matching card
  // title on the /projects or /blog list, which uses the same title-derived
  // name. (PostLayout is rendered by mdsvex without route context, so the
  // title is the only key both sides share.)
  const titleVt = $derived(titleTransitionName(metadata.title));

  let lightboxOpen = $state(false);

  function openLightbox() {
    if (metadata.featuredImage) {
      lightboxOpen = true;
    }
  }

  function closeLightbox() {
    lightboxOpen = false;
  }

  function displayDate(value: string): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    }).format(new Date(`${value}T00:00:00.000Z`));
  }
</script>

<article class="prose prose-zinc mx-auto w-full min-w-0 max-w-3xl px-4 py-16">
  <header class="mb-10 min-w-0 border-b border-skin-border pb-8 not-prose">
    <div class="flex min-w-0 items-start gap-2 font-mono text-xs text-skin-accent mb-4">
      <span class="shrink-0">></span>
      <span class="min-w-0 [overflow-wrap:anywhere]"
        >cat {metadata.title.toLowerCase().replace(/\s+/g, "_")}.md</span
      >
    </div>

    <h1
      class="text-3xl md:text-4xl font-bold font-mono tracking-tight text-skin-base mb-4 [overflow-wrap:anywhere]"
      style:view-transition-name={titleVt}
    >
      {metadata.title}
    </h1>

    <div
      class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-skin-muted"
    >
      {#if metadata.projectDate}
        <span class="flex items-center gap-1 text-skin-base" data-testid="article-work-date">
          <span class="text-skin-accent">[WORK DATE]</span>
          {displayDate(metadata.projectDate)}
        </span>
      {:else if metadata.eventPeriod}
        <span class="flex items-center gap-1 text-skin-base" data-testid="article-work-date">
          <span class="text-skin-accent">[WORK FROM]</span>
          {metadata.eventPeriod}
        </span>
      {/if}
      <span class="flex items-center gap-1 text-skin-muted/80" data-testid="article-published-date">
        <span>[PUBLISHED]</span>
        {displayDate(metadata.date)}
      </span>
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
        class="cursor-pointer group max-w-full"
        aria-label="View full size: {metadata.featuredImageAlt || metadata.title}"
      >
        <img
          src={metadata.featuredImage}
          alt={metadata.featuredImageAlt || metadata.title}
          class="max-h-[30vh] max-w-full rounded-lg border border-skin-border shadow-lg group-hover:border-skin-accent transition-colors"
        />
      </button>
      {#if metadata.featuredImageCaption}
        <p class="text-sm text-skin-muted font-mono mt-2">
          {metadata.featuredImageCaption}
        </p>
      {/if}
    </div>
  {/if}

  <div
    class="min-w-0 max-w-full font-sans text-lg leading-relaxed text-skin-base [overflow-wrap:anywhere] [&_a]:break-words [&_code]:break-words [&_img]:max-w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
  >
    {@render children()}
  </div>
</article>

{#if lightboxOpen && metadata.featuredImage}
  <Lightbox
    images={[metadata.featuredImage]}
    imageAlts={[metadata.featuredImageAlt || metadata.title]}
    currentIndex={0}
    onClose={closeLightbox}
  />
{/if}

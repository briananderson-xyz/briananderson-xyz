<script lang="ts">
  import Lightbox from './Lightbox.svelte';
  import type { VisualArchiveImage } from '$lib/types';

  interface Props {
    images: VisualArchiveImage[];
  }

  let { images }: Props = $props();

  let lightboxOpen = $state(false);
  let currentIndex = $state(0);

  const imagePaths = $derived(images.map((img) => img.path));

  function open(index: number) {
    currentIndex = index;
    lightboxOpen = true;
  }
</script>

{#if images.length > 0}
  <section class="not-prose mt-8">
    <div class="flex items-center gap-2 mb-4 font-mono text-skin-accent">
      <span>></span>
      <h3 class="text-lg font-bold">./visual-archive</h3>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      {#each images as img, i}
        <button
          onclick={() => open(i)}
          class="border border-skin-border bg-skin-page/50 p-2 rounded-lg cursor-pointer hover:border-skin-accent/50 transition-all group overflow-hidden flex items-center justify-center min-h-[150px]"
          aria-label="View {img.alt}"
        >
          <img
            src={img.path}
            alt={img.alt}
            class="max-w-full h-auto object-contain grayscale group-hover:grayscale-0 transition-all"
          />
        </button>
      {/each}
    </div>
  </section>

  {#if lightboxOpen}
    <Lightbox images={imagePaths} {currentIndex} onClose={() => (lightboxOpen = false)} />
  {/if}
{/if}

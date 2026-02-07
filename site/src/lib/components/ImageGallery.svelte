<script lang="ts">
  import Lightbox from "$lib/components/Lightbox.svelte";
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  let lightboxOpen = $state(false);
  let currentIndex = $state(0);
  let images: string[] = $state([]);
  let galleryElement: HTMLDivElement;

  onMount(() => {
    // Find all images in the gallery
    const imgElements = galleryElement.querySelectorAll("img");
    images = Array.from(imgElements).map((img) => img.src);

    // Add click handlers to each image
    imgElements.forEach((img, index) => {
      img.style.cursor = "pointer";
      img.addEventListener("click", () => {
        currentIndex = index;
        lightboxOpen = true;
      });
    });
  });

  function closeLightbox() {
    lightboxOpen = false;
  }
</script>

<div bind:this={galleryElement}>
  {@render children()}
</div>

{#if lightboxOpen}
  <Lightbox {images} {currentIndex} onClose={closeLightbox} />
{/if}

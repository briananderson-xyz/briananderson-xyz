<script lang="ts">
  import { X, ChevronLeft, ChevronRight } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import { focusTrap } from "$lib/actions/focusTrap";

  interface Props {
    images: string[];
    imageAlts?: string[];
    currentIndex: number;
    onClose: () => void;
  }

  let { images, imageAlts = [], currentIndex = 0, onClose }: Props = $props();
  let index = $derived(currentIndex);
  let touchStartX = $state(0);
  let touchEndX = $state(0);
  let dialogElement: HTMLDivElement;
  let currentAlt = $derived(imageAlts[index]?.trim() || describeImage(images[index], index));

  function describeImage(src: string | undefined, imageIndex: number) {
    if (!src) return `Expanded image ${imageIndex + 1}`;
    const filename =
      src
        .split("/")
        .pop()
        ?.split("?")[0]
        ?.replace(/\.[^.]+$/, "") ?? "";
    const description = decodeURIComponent(filename).replace(/[-_]+/g, " ").trim();
    return description ? `Expanded image: ${description}` : `Expanded image ${imageIndex + 1}`;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowLeft") {
      previous();
    } else if (e.key === "ArrowRight") {
      next();
    }
  }

  // The focus trap moves focus on the next animation frame. Keep Escape and
  // arrow keys responsive during that small opening window as well.
  function handleWindowKeydown(e: KeyboardEvent) {
    if (!dialogElement?.contains(document.activeElement)) handleKeydown(e);
  }

  function previous() {
    index = index === 0 ? images.length - 1 : index - 1;
  }

  function next() {
    index = (index + 1) % images.length;
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
  }

  function handleTouchMove(e: TouchEvent) {
    touchEndX = e.touches[0].clientX;
  }

  function handleTouchEnd() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        next();
      } else {
        previous();
      }
    }
  }

  function goToImage(imageIndex: number) {
    index = imageIndex;
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div
  bind:this={dialogElement}
  use:focusTrap
  class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-4"
  role="dialog"
  tabindex="-1"
  aria-modal="true"
  aria-label="Image lightbox"
  onclick={handleBackdropClick}
  onkeydown={handleKeydown}
  transition:fade={{ duration: 200 }}
>
  <button
    onclick={onClose}
    class="absolute top-4 right-4 p-2 text-skin-accent hover:text-skin-base transition-colors border border-skin-accent rounded hover:bg-skin-accent/10 z-10"
    aria-label="Close lightbox"
  >
    <X size={24} />
  </button>

  {#if images.length > 1}
    <button
      onclick={previous}
      class="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-skin-accent hover:text-skin-base transition-colors border border-skin-accent rounded hover:bg-skin-accent/10 z-10"
      aria-label="Previous image"
    >
      <ChevronLeft size={32} />
    </button>

    <button
      onclick={next}
      class="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-skin-accent hover:text-skin-base transition-colors border border-skin-accent rounded hover:bg-skin-accent/10 z-10"
      aria-label="Next image"
    >
      <ChevronRight size={32} />
    </button>
  {/if}

  <div
    class="flex-1 flex items-center justify-center max-w-7xl w-full"
    ontouchstart={handleTouchStart}
    ontouchmove={handleTouchMove}
    ontouchend={handleTouchEnd}
    role="group"
    aria-label="Image viewer, swipe left or right to change image"
  >
    <img
      src={images[index]}
      alt={currentAlt}
      class="max-w-full max-h-[calc(100vh-200px)] object-contain rounded border-2 border-skin-accent shadow-2xl"
    />
  </div>

  {#if images.length > 1}
    <div class="mt-4 flex flex-col items-center gap-4 w-full max-w-7xl">
      <div class="font-mono text-sm text-skin-accent">
        <span class="text-skin-base">[IMAGE]</span>
        {index + 1} / {images.length}
      </div>

      <div class="flex gap-2 overflow-x-auto pb-2 px-4 max-w-full">
        {#each images as image, i}
          <button
            onclick={() => goToImage(i)}
            class="flex-shrink-0 w-20 h-20 rounded border-2 transition-all {i === index
              ? 'border-skin-accent'
              : 'border-skin-border hover:border-skin-accent/50'}"
            aria-label="Show {imageAlts[i]?.trim() || describeImage(image, i)}"
          >
            <img src={image} alt="" class="w-full h-full object-cover rounded" />
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

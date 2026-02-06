<script lang="ts">
  import { X, ChevronLeft, ChevronRight } from "lucide-svelte";
  import { fade } from "svelte/transition";

  interface Props {
    images: string[];
    currentIndex: number;
    onClose: () => void;
  }

  let { images, currentIndex = 0, onClose }: Props = $props();
  let index = $state(currentIndex);
  let touchStartX = $state(0);
  let touchEndX = $state(0);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowLeft") {
      previous();
    } else if (e.key === "ArrowRight") {
      next();
    }
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

<svelte:window onkeydown={handleKeydown} />

<div
  class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-4"
  role="dialog"
  aria-modal="true"
  aria-label="Image lightbox"
  onclick={handleBackdropClick}
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
  >
    <img
      src={images[index]}
      alt="Lightbox view"
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
            class="flex-shrink-0 w-20 h-20 rounded border-2 transition-all {i === index ? 'border-skin-accent' : 'border-skin-border hover:border-skin-accent/50'}"
            aria-label="Go to image {i + 1}"
          >
            <img
              src={image}
              alt="Thumbnail {i + 1}"
              class="w-full h-full object-cover rounded"
            />
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

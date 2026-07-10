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
  let imageAlts: string[] = $state([]);
  let galleryElement: HTMLDivElement;

  onMount(() => {
    // Linked images retain navigation. Images inside server-rendered markdown
    // buttons use that button as their trigger; standalone prose images receive
    // button semantics directly.
    const imgElements = Array.from(galleryElement.querySelectorAll("img")).filter(
      (img) => !img.closest("a") && Boolean(img.alt.trim())
    );
    images = Array.from(imgElements).map((img) => img.src);
    imageAlts = Array.from(imgElements).map((img) => img.alt.trim());

    const cleanup: Array<() => void> = [];

    imgElements.forEach((img, index) => {
      const existingButton = img.closest<HTMLButtonElement>("button");
      const trigger: HTMLElement = existingButton ?? img;
      const previousCursor = trigger.style.cursor;
      const previousTabindex = trigger.getAttribute("tabindex");
      const previousRole = trigger.getAttribute("role");
      const previousLabel = trigger.getAttribute("aria-label");
      const previousTrigger = trigger.getAttribute("data-image-gallery-trigger");
      const open = () => {
        currentIndex = index;
        lightboxOpen = true;
      };
      const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      };

      trigger.style.cursor = "pointer";
      if (!existingButton) {
        trigger.setAttribute("tabindex", "0");
        trigger.setAttribute("role", "button");
        trigger.setAttribute("aria-label", `Open image: ${img.alt.trim()}`);
        trigger.addEventListener("keydown", handleKeydown);
      }
      trigger.setAttribute("data-image-gallery-trigger", "true");
      trigger.addEventListener("click", open);

      cleanup.push(() => {
        trigger.style.cursor = previousCursor;
        restoreAttribute(trigger, "tabindex", previousTabindex);
        restoreAttribute(trigger, "role", previousRole);
        restoreAttribute(trigger, "aria-label", previousLabel);
        restoreAttribute(trigger, "data-image-gallery-trigger", previousTrigger);
        trigger.removeEventListener("click", open);
        trigger.removeEventListener("keydown", handleKeydown);
      });
    });

    return () => cleanup.forEach((teardown) => teardown());
  });

  function restoreAttribute(element: HTMLElement, name: string, value: string | null) {
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
  }

  function closeLightbox() {
    lightboxOpen = false;
  }
</script>

<div bind:this={galleryElement}>
  {@render children()}
</div>

{#if lightboxOpen}
  <Lightbox {images} {imageAlts} {currentIndex} onClose={closeLightbox} />
{/if}

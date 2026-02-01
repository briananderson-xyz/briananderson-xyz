<script lang="ts">
  import type { Resume } from "$lib/types";
  import ResumeContent from "./ResumeContent.svelte";
  import { onMount, afterUpdate, tick } from "svelte";
  import { useSwipe } from "$lib/actions/useSwipe";
  import { goto } from "$app/navigation";

  export let resumes: { variant: string; resume: Resume }[] = [];
  export let currentIndex: number = 0;

  // Fixed button width in pixels (matches w-[105px] class)
  // Fixed button width in pixels
  const BUTTON_WIDTH = 140;

  let swiperContainer: HTMLElement;
  let swipeProgress = 0;
  let slideElements: HTMLElement[] = [];
  let wrapperHeight = "3800px";
  let resizeObserver: ResizeObserver;
  let mounted = false;
  let isAnimating = false;
  let animationProgress = 0;
  let animationFrom = 0;
  let animationTo = 0;
  let slideHeights: number[] = [];
  let initialUrl = "";

  let buttonElements: HTMLElement[] = [];
  let indicatorX = 0;
  let indicatorWidth = 0;
  let indicatorY = 0;
  let indicatorHeight = 0;

  $: if (mounted && (currentIndex >= 0 || swipeProgress !== 0 || isAnimating)) {
    updateIndicator();
  }

  function getDisplayName(variant: string) {
    return variant === "default"
      ? "leader"
      : variant === "platform"
        ? "ops"
        : variant;
  }

  $: if (mounted && (currentIndex >= 0 || swipeProgress !== 0 || isAnimating)) {
    updateIndicator();
  }

  function updateIndicator() {
    if (!mounted || buttonElements.length === 0) return;

    // Determine "From" and "To" states for interpolation
    let fromIndex = currentIndex;
    let toIndex = currentIndex;
    let progress = 0;

    if (isAnimating) {
      fromIndex = animationFrom;
      toIndex = animationTo;
      progress = animationProgress;
    } else if (swipeProgress !== 0) {
      fromIndex = currentIndex;
      // Determine target based on swipe direction
      if (swipeProgress < 0 && currentIndex < resumes.length - 1) {
        toIndex = currentIndex + 1;
        progress = Math.abs(swipeProgress);
      } else if (swipeProgress > 0 && currentIndex > 0) {
        toIndex = currentIndex - 1;
        progress = Math.abs(swipeProgress);
      }
    }

    const fromEl = buttonElements[fromIndex];
    const toEl = buttonElements[toIndex];

    if (fromEl && toEl) {
      const fromLeft = fromEl.offsetLeft;
      const fromWidth = fromEl.offsetWidth;
      const fromTop = fromEl.offsetTop;
      const fromHeight = fromEl.offsetHeight;

      const toLeft = toEl.offsetLeft;
      const toWidth = toEl.offsetWidth;
      const toTop = toEl.offsetTop;
      const toHeight = toEl.offsetHeight;

      indicatorX = fromLeft + (toLeft - fromLeft) * progress;
      indicatorWidth = fromWidth + (toWidth - fromWidth) * progress;
      indicatorY = fromTop + (toTop - fromTop) * progress;
      indicatorHeight = fromHeight + (toHeight - fromHeight) * progress;
    }
  }

  $: if (currentIndex >= 0 && typeof window !== "undefined") {
    updateWrapperHeight();
  }

  // Update URL when currentIndex changes
  $: if (mounted && resumes.length > 0 && initialUrl) {
    const variant = resumes[currentIndex]?.variant;
    const newUrl = variant === "default" ? "/resume/" : `/resume/${variant}/`;
    if (typeof window !== "undefined" && window.location.pathname !== newUrl) {
      goto(newUrl, { replaceState: true, noScroll: true });
    }
  }

  function handleSwipeMove(event: CustomEvent) {
    if (isAnimating) return;
    if (typeof window !== "undefined" && window.innerWidth >= 768) return;
    let progress = event.detail.progress;

    // Prevent swiping right when at first index
    if (currentIndex === 0 && progress > 0) {
      progress = 0;
    }
    // Prevent swiping left when at last index
    if (currentIndex === resumes.length - 1 && progress < 0) {
      progress = 0;
    }

    swipeProgress = progress;
  }

  function handleSwipeEnd(event: CustomEvent) {
    if (isAnimating) return;
    if (typeof window !== "undefined" && window.innerWidth >= 768) return;

    if (Math.abs(swipeProgress) < 0.001) {
      swipeProgress = 0;
      return;
    }

    const direction = event.detail.direction;
    const shouldNavigate = event.detail.shouldNavigate;

    let targetIndex = currentIndex;

    if (shouldNavigate) {
      if (direction === "left" && currentIndex < resumes.length - 1) {
        targetIndex = currentIndex + 1;
      } else if (direction === "right" && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      }
    }

    // Calculate where we are currently visually to start animation from
    // dragX is swipeProgress * 50%
    // each slide is 100% width
    // so visual offset in "slide units" is swipeProgress * 0.5
    // But check sign:
    // Left swipe (negative progress) moves content left (negative transform)
    // Formula: transform% = (index - currentIndex) * 100 + swipeProgress * 50
    // We want animationFrom such that at progress 0:
    // (index - animationFrom) * 100 = (index - currentIndex) * 100 + swipeProgress * 50
    // -animationFrom * 100 = -currentIndex * 100 + swipeProgress * 50
    // animationFrom = currentIndex - swipeProgress * 0.5

    const startFrom = currentIndex - swipeProgress * 0.5;

    // Reset swipe progress before starting animation so they don't compound
    swipeProgress = 0;

    animateToIndex(targetIndex, startFrom);
  }

  function animateToIndex(targetIndex: number, startFrom?: number) {
    if (targetIndex === currentIndex && !startFrom && isAnimating) return;

    // Capture start and target heights
    const startHeight =
      slideHeights[currentIndex] || parseFloat(wrapperHeight) || 0;
    const targetHeight = slideHeights[targetIndex] || startHeight;

    isAnimating = true;
    animationFrom = startFrom !== undefined ? startFrom : currentIndex;
    animationTo = targetIndex;
    animationProgress = 0;

    const duration = 300;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      animationProgress = 1 - Math.pow(1 - progress, 3);

      // Animate height
      updateIndicator();
      const currentHeight =
        startHeight + (targetHeight - startHeight) * animationProgress;
      wrapperHeight = `${currentHeight}px`;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        currentIndex = targetIndex;
        isAnimating = false;
        animationProgress = 0;
        // Ensure final height is exact
        wrapperHeight = `${targetHeight}px`;
      }
    }

    requestAnimationFrame(animate);
  }

  function updateWrapperHeight() {
    if (isAnimating) return;

    if (slideElements[currentIndex]) {
      const slide = slideElements[currentIndex];
      const height = slide.scrollHeight || slide.offsetHeight || 0;
      if (height > 0) {
        wrapperHeight = `${height}px`;
      }
    }
  }

  function setupResizeObserver() {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }

    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const index = slideElements.indexOf(entry.target as HTMLElement);
        if (index !== -1) {
          slideHeights[index] = entry.contentRect.height;
          if (index === currentIndex && !isAnimating) {
            wrapperHeight = `${slideHeights[index]}px`;
          }
        }
      }
    });

    slideElements.forEach((slide) => {
      if (slide) {
        resizeObserver.observe(slide);
      }
    });
  }

  onMount(() => {
    initialUrl = typeof window !== "undefined" ? window.location.pathname : "";
    mounted = true;

    if (swiperContainer) {
      swiperContainer.addEventListener("swipemove", handleSwipeMove);
      swiperContainer.addEventListener("swipeend", handleSwipeEnd);
    }

    tick().then(() => {
      // Force immediate height calculation
      slideElements.forEach((el, i) => {
        if (el) slideHeights[i] = el.scrollHeight || el.offsetHeight;
      });
      updateWrapperHeight();
      setupResizeObserver();
      // Force indicator update
      updateIndicator();
    });

    window.addEventListener("resize", updateIndicator);

    return () => {
      if (swiperContainer) {
        swiperContainer.removeEventListener("swipemove", handleSwipeMove);
        swiperContainer.removeEventListener("swipeend", handleSwipeEnd);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", updateIndicator);
    };
  });

  afterUpdate(() => {
    tick().then(() => {
      updateWrapperHeight();
      setupResizeObserver();
      updateIndicator();
    });
  });
</script>

<div
  class="max-w-4xl mx-auto pt-4 pb-12 md:pt-6 md:pb-16 font-mono print:font-serif print:p-0 print:m-0 print:max-w-none print:leading-tight relative"
>
  <!-- Actions (Print & Switcher) -->
  <!-- Actions (Print & Switcher) -->
  <div
    class="flex flex-wrap-reverse items-center justify-between w-full mb-8 print:hidden gap-4 pl-5"
  >
    <div
      class="flex flex-wrap items-center relative border border-skin-border/50 rounded-lg w-auto justify-start"
    >
      {#each resumes as item, index}
        {@const isCurrent = index === currentIndex && !isAnimating}
        {@const isAnimatingTo = isAnimating && index === animationTo}
        {@const displayName = getDisplayName(item.variant)}
        <button
          type="button"
          on:click={() => animateToIndex(index)}
          class="variant-button px-2 py-2 text-xs md:text-sm rounded-md transition-colors relative z-10 flex items-center justify-center {isCurrent ||
          isAnimatingTo
            ? 'text-skin-base'
            : 'text-skin-muted hover:text-skin-base'}"
          bind:this={buttonElements[index]}
          aria-current={isCurrent ? "page" : undefined}
          data-index={index}
        >
          <span class="opacity-50 font-normal mr-2">cat</span><span
            class="font-bold">{displayName}.md</span
          >
        </button>
      {/each}
      <div
        class="active-indicator active-indicator-custom absolute left-0 top-0 rounded-lg bg-skin-base/10 pointer-events-none"
        style:width="{indicatorWidth}px"
        style:height="{indicatorHeight}px"
        style:transform="translate({indicatorX}px, {indicatorY}px)"
      ></div>
    </div>

    <button
      class="px-4 py-2 bg-skin-accent text-skin-accent-contrast text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-opacity rounded-md ml-auto"
      on:click={() => window.print()}
    >
      Print
    </button>
  </div>

  <!-- Swipe Indicators -->
  {#if Math.abs(swipeProgress) > 0}
    <div class="swipe-indicators">
      {#if swipeProgress < 0 && currentIndex < resumes.length - 1}
        {@const nextResume = resumes[currentIndex + 1]}
        {@const displayName = getDisplayName(nextResume.variant)}
        <div
          class="swipe-indicator swipe-indicator-left"
          style="opacity: {Math.abs(swipeProgress)};"
        >
          <span class="text-xs font-bold mr-1 flex items-center"
            ><span class="opacity-50 font-normal mr-1">cat</span><span
              >{displayName}.md</span
            ></span
          >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="flex-shrink-0 min-w-[24px]"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      {:else if swipeProgress > 0 && currentIndex > 0}
        {@const prevResume = resumes[currentIndex - 1]}
        {@const displayName = getDisplayName(prevResume.variant)}
        <div
          class="swipe-indicator swipe-indicator-right"
          style="opacity: {swipeProgress};"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="flex-shrink-0 min-w-[24px]"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span class="text-xs font-bold ml-1 flex items-center"
            ><span class="opacity-50 font-normal mr-1">cat</span><span
              >{displayName}.md</span
            ></span
          >
        </div>
      {/if}
    </div>
  {/if}

  <div
    class="resume-wrapper"
    bind:this={swiperContainer}
    use:useSwipe={{
      threshold: 250,
      verticalThreshold: 120,
      velocityThreshold: 1.5,
    }}
    style="height: {wrapperHeight};"
  >
    {#each resumes as item, index}
      {@const isCurrentSlide = index === currentIndex}
      {@const isFromSlide = isAnimating && index === animationFrom}
      {@const isToSlide = isAnimating && index === animationTo}

      {@const baseX = isAnimating
        ? (index - animationFrom) * 100 +
          (animationFrom - animationTo) * 100 * animationProgress
        : (index - currentIndex) * 100}
      {@const dragX = swipeProgress * 50}
      {@const transformX = baseX + dragX}

      {@const swipeTargetIndex =
        swipeProgress < 0
          ? currentIndex + 1
          : swipeProgress > 0
            ? currentIndex - 1
            : currentIndex}
      {@const isSwipeTarget = index === swipeTargetIndex}

      {@const opacity = Math.max(0, 1 - Math.abs(transformX) / 50)}
      {@const isAriaHidden = !(isCurrentSlide && !isAnimating)}
      <div
        class="resume-slide pl-5 {isCurrentSlide && !isAnimating
          ? 'current'
          : ''}"
        bind:this={slideElements[index]}
        style="transform: translateX({transformX}%); transition: none; z-index: {resumes.length -
          index}; opacity: {opacity};"
        data-index={index}
        data-transform={transformX}
        aria-hidden={isAriaHidden ? "true" : "false"}
        tabindex={isAriaHidden ? "-1" : undefined}
      >
        <ResumeContent resume={item.resume} />
      </div>
    {/each}
  </div>

  <!-- Download/Action -->
  <div
    class="mt-16 pt-8 border-t-2 border-dashed border-skin-border text-center print:hidden print:m-0 print:p-0 print:border-0"
  >
    <button
      class="px-6 py-3 bg-skin-accent text-skin-accent-contrast font-bold uppercase tracking-wider hover:opacity-90 transition-opacity rounded-md"
      on:click={() => window.print()}
    >
      Print
    </button>
  </div>
</div>

<style>
  .resume-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
    transition: height 0.3s ease;
    min-height: 100vh;
  }

  .resume-slide {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    will-change: transform;
    box-sizing: border-box;
  }

  .resume-slide.current {
    pointer-events: auto;
  }

  .resume-slide:not(.current) {
    pointer-events: none;
  }

  .resume-slide.current {
    pointer-events: auto;
  }

  .swipe-indicators {
    position: fixed;
    bottom: 50%;
    left: 50%;
    transform: translate(-50%, 50%);
    display: flex;
    gap: 6rem;
    pointer-events: none;
    z-index: 50;
    width: 100%;
    justify-content: center;
    padding: 0 1rem;
    box-sizing: border-box;
  }

  .swipe-indicator {
    display: flex;
    align-items: center;
    transition: opacity 0.15s ease-out;
    color: rgb(var(--color-accent));
  }

  @media print {
    @page {
      margin: 0.5in;
    }

    .swipe-indicators {
      display: none;
    }

    .resume-wrapper {
      position: static !important;
      height: auto !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .resume-slide {
      position: static !important;
      transform: none !important;
      opacity: 1 !important;
      display: none !important;
      padding-left: 0 !important;
      margin: 0 !important;
    }

    .resume-slide.current {
      display: block !important;
    }

    :global(body),
    :global(html) {
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
    }
  }
</style>

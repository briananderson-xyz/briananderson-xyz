<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { getCanonicalUrl } from "$lib/utils/variantLink";

  const destination = "/trace-one-answer/#answer-checks-heading";

  onMount(() => {
    goto(destination, { replaceState: true });
  });
</script>

<SEO
  title="How This Site's AI Works | Brian Anderson"
  description="AI evaluation details now live in the site's plain-language AI architecture walkthrough."
  canonical={getCanonicalUrl("/trace-one-answer/")}
/>

<svelte:head>
  <meta http-equiv="refresh" content="0;url=/trace-one-answer/#answer-checks-heading" />
</svelte:head>

<section class="mx-auto max-w-3xl px-4 py-16">
  <h1 class="text-3xl font-bold tracking-tight text-skin-base">AI checks have moved</h1>
  <p class="mt-4 leading-relaxed text-skin-muted">
    Evaluation results are now explained alongside the architecture, privacy boundaries, and
    limitations they help check.
  </p>
  <a class="mt-6 inline-block font-mono text-skin-accent underline" href={destination}>
    Read how this site's AI works
  </a>
</section>

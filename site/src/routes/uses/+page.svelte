<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { getCanonicalUrl } from "$lib/utils/variantLink";

  const destination = "/interests/#setup";

  onMount(() => {
    goto(destination, { replaceState: true });
  });
</script>

<SEO
  title="Setup | Brian Anderson"
  description="The hardware, software, and tools Brian uses are part of the Interests page."
  canonical={getCanonicalUrl("/interests/")}
/>

<svelte:head>
  <meta http-equiv="refresh" content="0;url=/interests/#setup" />
</svelte:head>

<section class="mx-auto max-w-3xl px-4 py-16">
  <h1 class="text-3xl font-bold tracking-tight text-skin-base">Setup has moved</h1>
  <p class="mt-4 leading-relaxed text-skin-muted">
    Hardware, software, and everyday tools now have one home alongside Brian's interests.
  </p>
  <a class="mt-6 inline-block font-mono text-skin-accent underline" href={destination}>
    View setup
  </a>
</section>

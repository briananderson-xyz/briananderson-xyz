<script lang="ts">
  import { getCanonicalUrl } from "$lib/utils/variantLink";
  import ResumePage from "$lib/components/ResumePage.svelte";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const resume = $derived(data.resume);

  const variant = $derived(browser ? $page.url.searchParams.get("v") : null);
</script>

<ResumePage
  {resume}
  {variant}
  title="Resume | Brian Anderson - Builder"
  description="Builder Resume."
  canonical={getCanonicalUrl("/builder/resume/")}
/>

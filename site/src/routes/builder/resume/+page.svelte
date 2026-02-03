<script lang="ts">
  import { getCanonicalUrl } from "$lib/utils/variantLink";
  import ResumePage from "$lib/components/ResumePage.svelte";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";

  export let data;
  const resume = data.resume;

  $: variant = browser ? $page.url.searchParams.get("v") : null;
</script>

<ResumePage
  {resume}
  {variant}
  title="Resume | Brian Anderson - Builder"
  description="Builder Resume."
  canonical={getCanonicalUrl("/builder/resume/")}
/>

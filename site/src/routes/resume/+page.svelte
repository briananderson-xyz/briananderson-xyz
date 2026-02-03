<script lang="ts">
  import { getCanonicalUrl, getRedirectTarget } from "$lib/utils/variantLink";
  import ResumePage from "$lib/components/ResumePage.svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";

  export let data;
  const resume = data.resume;

  $: variant = browser ? $page.url.searchParams.get("v") : null;
  $: if (browser && variant) {
    const target = getRedirectTarget("/resume", variant);
    if (target) {
      goto(target, { replaceState: true });
    }
  }
</script>

<ResumePage
  {resume}
  {variant}
  title="Resume | Brian Anderson"
  description="Resume, Skills, and Experience of Brian Anderson."
  canonical={getCanonicalUrl("/resume/")}
/>

<script lang="ts">
  import { getCanonicalUrl, getRedirectTarget } from "$lib/utils/variantLink";
  import Homepage from "$lib/components/Homepage.svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  $: variant = browser ? $page.url.searchParams.get("v") : null;
  $: if (browser && variant) {
    const target = getRedirectTarget("/", variant);
    if (target) {
      goto(target, { replaceState: true });
    }
  }
</script>

<SEO
  title="Brian Anderson"
  description="Enterprise architect and hands-on builder focused on AI platforms, cloud modernization, and developer productivity."
  canonical={getCanonicalUrl("/")}
/>

<Homepage resume={data.resume} />

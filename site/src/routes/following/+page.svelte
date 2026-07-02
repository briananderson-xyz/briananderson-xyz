<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { getCanonicalUrl } from "$lib/utils/variantLink";

  if (browser) {
    goto("/interests/", { replaceState: true });
  }
</script>

<svelte:head>
  <meta http-equiv="refresh" content="0;url=/interests/" />
  <link rel="canonical" href={getCanonicalUrl("/interests/")} />
</svelte:head>

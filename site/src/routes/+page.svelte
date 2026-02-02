<script lang="ts">
  import { getCanonicalUrl } from '$lib/utils/variantLink';
  import Homepage from '$lib/components/Homepage.svelte';

  export let data;
</script>

<svelte:head>
  <link rel="canonical" href={getCanonicalUrl('/')} />
</svelte:head>

<Homepage resume={data.resume} />

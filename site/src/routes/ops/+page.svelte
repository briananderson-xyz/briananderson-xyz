<script lang="ts">
  import { getCanonicalUrl } from '$lib/utils/variantLink';
  import Homepage from '$lib/components/Homepage.svelte';

  export let data;
</script>

<svelte:head>
  <link rel="canonical" href={getCanonicalUrl('/ops/')} />
</svelte:head>

<Homepage
  resume={data.resume}
  variant="ops"
  links={{
    resume: '/ops/resume/',
    projects: '/projects/?v=ops',
    blog: '/blog/?v=ops'
  }}
 />


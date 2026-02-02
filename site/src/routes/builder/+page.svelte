<script lang="ts">
  import { getCanonicalUrl } from '$lib/utils/variantLink';
  import Homepage from '$lib/components/Homepage.svelte';

  export let data;
</script>

<svelte:head>
  <link rel="canonical" href={getCanonicalUrl('/builder/')} />
</svelte:head>

<Homepage
  resume={data.resume}
  variant="builder"
  links={{
    resume: '/builder/resume/',
    projects: '/projects/?v=builder',
    blog: '/blog/?v=builder'
  }}
 />


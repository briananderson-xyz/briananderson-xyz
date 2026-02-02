<script lang="ts">
  import { getCanonicalUrl } from "$lib/utils/variantLink";
  import Homepage from "$lib/components/Homepage.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
</script>

<SEO
  title="Brian Anderson - Builder"
  description="Systems Builder."
  canonical={getCanonicalUrl("/builder/")}
/>

<Homepage
  resume={data.resume}
  variant="builder"
  links={{
    resume: "/builder/resume/",
    projects: "/projects/?v=builder",
    blog: "/blog/?v=builder",
  }}
/>

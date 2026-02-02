<script lang="ts">
  import { getCanonicalUrl } from "$lib/utils/variantLink";
  import Homepage from "$lib/components/Homepage.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
</script>

<SEO
  title="Brian Anderson - Ops"
  description="Operations & SRE."
  canonical={getCanonicalUrl("/ops/")}
/>

<Homepage
  resume={data.resume}
  variant="ops"
  links={{
    resume: "/ops/resume/",
    projects: "/projects/?v=ops",
    blog: "/blog/?v=ops",
  }}
/>

<script lang="ts">
  import { getCanonicalUrl } from "$lib/utils/variantLink";
  import Homepage from "$lib/components/Homepage.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<SEO
  title="Brian Anderson - Ops"
  description="Platform and reliability architecture for cloud-native systems and AI workloads."
  canonical={getCanonicalUrl("/ops/")}
/>

<Homepage
  resume={data.resume}
  proofClaims={data.proofClaims}
  variant="ops"
  links={{
    resume: "/ops/resume/",
    projects: "/projects/?v=ops",
    blog: "/blog/?v=ops"
  }}
/>

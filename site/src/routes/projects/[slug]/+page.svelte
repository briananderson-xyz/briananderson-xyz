<script lang="ts">
  import { addVariant } from '$lib/utils/variantLink';

  export let data: { component: any, metadata: any, variant: string | null };
</script>

{#if data?.component}
  <svelte:component this={data.component} metadata={data.metadata} variant={data.variant} />
{:else}
  <div class="max-w-3xl mx-auto px-4 py-16">Not found.</div>
{/if}

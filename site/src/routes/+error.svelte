<script lang="ts">
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import Button from "$lib/components/ui/button.svelte";
  import { getCanonicalVariantPath } from "$lib/utils/variantLink";
  import SEO from "$lib/components/SEO.svelte";

  const rebootUrl = $derived(
    getCanonicalVariantPath("/", browser ? $page.url.searchParams.get("v") : null)
  );
</script>

<SEO title="Error | Brian Anderson" description="System error." />

<div
  class="max-w-3xl mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[60vh] text-center font-mono"
>
  <div
    class="border border-skin-error/50 bg-skin-error/5 p-8 rounded-lg max-w-lg w-full relative overflow-hidden"
  >
    <!-- Decorative scanline for error box -->
    <div class="status-error-scanlines absolute inset-0 z-0 pointer-events-none"></div>

    <div class="relative z-10">
      <div class="text-skin-error text-6xl font-bold mb-2 tracking-tighter">
        {$page.status}
      </div>
      <div
        class="text-skin-error text-sm uppercase tracking-widest mb-6 border-b border-skin-error/30 pb-4"
      >
        CRITICAL_PROCESS_DIED
      </div>

      <p class="text-skin-base text-lg mb-8">
        > {$page.error?.message ?? "Unknown Error"}
      </p>

      <div
        class="flex flex-col gap-2 text-xs text-skin-base text-left bg-skin-base/5 p-4 rounded mb-8 font-mono"
      >
        <div>Error: {$page.status}</div>
        <div>Path: {$page.url.pathname}</div>
        <div>Timestamp: {new Date().toISOString()}</div>
        <div class="animate-pulse mt-2">> _</div>
      </div>

      <Button
        href={rebootUrl}
        class="bg-skin-error text-skin-error-contrast border-none w-full sm:w-auto hover:opacity-90"
      >
        INITIATE_SYSTEM_REBOOT
      </Button>
    </div>
  </div>
</div>

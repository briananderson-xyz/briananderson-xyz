<script lang="ts">
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import Button from "$lib/components/ui/button.svelte";
  import { getCanonicalVariantPath } from "$lib/utils/variantLink";
  import SEO from "$lib/components/SEO.svelte";

  $: rebootUrl = getCanonicalVariantPath(
    "/",
    browser ? $page.url.searchParams.get("v") : null,
  );
</script>

<SEO title="Error | Brian Anderson" description="System error." />

<div
  class="max-w-3xl mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[60vh] text-center font-mono"
>
  <div
    class="border border-red-500/50 bg-red-500/5 p-8 rounded-lg max-w-lg w-full relative overflow-hidden"
  >
    <!-- Decorative scanline for error box -->
    <div
      class="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(255,0,0,0.02),rgba(255,0,0,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"
    ></div>

    <div class="relative z-10">
      <div class="text-red-500 text-6xl font-bold mb-2 tracking-tighter">
        {$page.status}
      </div>
      <div
        class="text-red-400/80 text-sm uppercase tracking-widest mb-6 border-b border-red-500/30 pb-4"
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
        class="bg-red-600 hover:bg-red-700 text-white border-none w-full sm:w-auto"
      >
        INITIATE_SYSTEM_REBOOT
      </Button>
    </div>
  </div>
</div>

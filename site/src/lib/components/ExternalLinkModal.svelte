<script lang="ts">
  interface Props {
    url: string;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { url, onConfirm, onCancel }: Props = $props();

  const displayHost = $derived(() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  });
</script>

{#if url}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    onclick={onCancel}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="bg-terminal-black border border-terminal-border rounded-lg shadow-2xl max-w-sm w-full font-mono"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="External link confirmation"
    >
      <!-- Terminal chrome -->
      <div class="bg-terminal-chrome px-4 py-2 flex items-center gap-2 border-b border-terminal-border rounded-t-lg">
        <div class="w-2.5 h-2.5 rounded-full bg-red-500"></div>
        <div class="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
        <div class="w-2.5 h-2.5 rounded-full bg-green-500"></div>
        <span class="ml-2 text-xs text-terminal-text/50">navigate --external</span>
      </div>

      <div class="p-5">
        <p class="text-terminal-green text-xs mb-1">$ leaving briananderson.xyz</p>
        <p class="text-terminal-text text-sm mb-1">You're navigating to an external site:</p>
        <p class="text-terminal-text/60 text-xs mb-5 border-l-2 border-terminal-border pl-3 break-all">
          → {displayHost()}
        </p>

        <div class="flex gap-3">
          <button
            onclick={onConfirm}
            class="flex-1 px-4 py-2 bg-terminal-green text-terminal-black text-xs font-bold uppercase tracking-wider hover:bg-terminal-green/90 transition-colors rounded"
            autofocus
          >
            Continue ↗
          </button>
          <button
            onclick={onCancel}
            class="flex-1 px-4 py-2 border border-terminal-border text-terminal-text text-xs font-bold uppercase tracking-wider hover:border-terminal-green hover:text-terminal-green transition-colors rounded"
          >
            Stay
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

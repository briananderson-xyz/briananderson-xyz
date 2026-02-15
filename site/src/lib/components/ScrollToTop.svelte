<script lang="ts">
  import { ArrowUp } from "lucide-svelte";
  import { browser } from "$app/environment";

  let visible = $state(false);

  function handleScroll() {
    if (!browser) return;
    visible = window.scrollY > 300;
  }

  function scrollToTop() {
    if (!browser) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (browser) {
    window.addEventListener("scroll", handleScroll);
  }
</script>

<button
  onclick={scrollToTop}
  class="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-skin-accent text-skin-accent-contrast shadow-lg hover:shadow-xl transition-all duration-300 print:hidden group"
  class:opacity-0={!visible}
  class:pointer-events-none={!visible}
  aria-label="Scroll to top"
  data-testid="scroll-to-top"
>
  <ArrowUp size={20} class="group-hover:animate-bounce" />
</button>

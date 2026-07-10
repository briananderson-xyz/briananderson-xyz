interface FocusTrapOptions {
  /** Called when Escape is pressed while focus is inside the trap. */
  onEscape?: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(node: HTMLElement) {
  return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.offsetParent !== null
  );
}

function focusFirst(node: HTMLElement) {
  const target =
    node.querySelector<HTMLElement>("[data-autofocus]") ?? getFocusable(node)[0] ?? node;
  target.focus();
}

/**
 * Makes an element behave like an accessible modal dialog: on mount it moves
 * focus inside (respecting an already-focused child or a [data-autofocus]
 * target), traps Tab / Shift+Tab so focus cannot reach the page behind it, and
 * on teardown restores focus to whatever was focused before it opened.
 *
 * This is the same trap the shared Modal component implements inline; extracted
 * so bespoke dialogs (Lightbox, ExternalLinkModal) get identical behavior. The
 * host element must be focusable (tabindex="-1") for the empty-dialog fallback.
 *
 * Escape is not handled here unless `onEscape` is passed, so dialogs that
 * already close on Escape (e.g. Lightbox via svelte:window) can opt out.
 */
export function focusTrap(node: HTMLElement, options: FocusTrapOptions = {}) {
  let opts = options;
  const restoreFocus = document.activeElement as HTMLElement | null;

  const raf = requestAnimationFrame(() => {
    // Respect focus a child already claimed (e.g. an autofocus button).
    if (node.contains(document.activeElement)) return;
    focusFirst(node);
  });

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      opts.onEscape?.();
      return;
    }
    if (e.key !== "Tab") return;

    const nodes = getFocusable(node);
    if (nodes.length === 0) {
      e.preventDefault();
      node.focus();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onFocusIn(e: FocusEvent) {
    if (e.target instanceof Node && !node.contains(e.target)) {
      focusFirst(node);
    }
  }

  node.addEventListener("keydown", onKeydown);
  document.addEventListener("focusin", onFocusIn);

  return {
    update(newOptions: FocusTrapOptions = {}) {
      opts = newOptions;
    },
    destroy() {
      cancelAnimationFrame(raf);
      node.removeEventListener("keydown", onKeydown);
      document.removeEventListener("focusin", onFocusIn);
      restoreFocus?.focus?.();
    }
  };
}

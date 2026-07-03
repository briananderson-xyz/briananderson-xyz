<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    type?: 'button' | 'submit' | 'reset';
    href?: string | null;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'md';
    class?: string;
    children: Snippet;
  }

  let {
    type = 'button',
    href = null,
    variant = 'default',
    size = 'md',
    class: className = '',
    children
  }: Props = $props();

  const base =
    'inline-flex items-center justify-center font-mono text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-skin-accent/50 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wider';
  const sizes = $derived(size === 'sm' ? 'px-3 py-1.5' : 'px-5 py-2.5');
  const styles = $derived(
    variant === 'outline'
      ? 'border border-skin-accent text-skin-accent hover:bg-skin-accent hover:text-skin-accent-contrast'
      : variant === 'ghost'
        ? 'hover:bg-skin-base/10 text-skin-muted hover:text-skin-base'
        : 'bg-skin-accent text-skin-accent-contrast hover:bg-skin-accent/90 shadow-[0_0_10px_rgba(var(--color-accent),0.3)] hover:shadow-[0_0_15px_rgba(var(--color-accent),0.5)]'
  );
</script>

{#if href}
  <a class={`${base} ${sizes} ${styles} ${className}`} {href}>{@render children()}</a>
{:else}
  <button {type} class={`${base} ${sizes} ${styles} ${className}`}>{@render children()}</button>
{/if}

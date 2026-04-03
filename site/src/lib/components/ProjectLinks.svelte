<script lang="ts">
  import { ExternalLink, Github, Globe } from 'lucide-svelte';
  import type { ProjectLink } from '$lib/types';

  interface Props {
    links: ProjectLink[];
  }

  let { links }: Props = $props();

  function iconFor(type: ProjectLink['type']) {
    switch (type) {
      case 'github': return Github;
      case 'live': return Globe;
      case 'case-study':
      case 'article':
      case 'docs':
      default: return ExternalLink;
    }
  }
</script>

{#if links.length > 0}
  <section class="not-prose mt-8">
    <div class="flex items-center gap-2 mb-4 font-mono text-skin-accent">
      <span>></span>
      <h3 class="text-lg font-bold">./links</h3>
    </div>
    <ul class="flex flex-wrap gap-3">
      {#each links as link}
        {@const Icon = iconFor(link.type)}
        <li>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 font-mono text-sm text-skin-accent hover:text-skin-base border border-skin-border hover:border-skin-accent px-3 py-2 rounded transition-all"
          >
            <Icon size={14} />
            {link.label}
          </a>
        </li>
      {/each}
    </ul>
  </section>
{/if}

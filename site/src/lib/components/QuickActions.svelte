<script lang="ts">
  import { goto } from "$app/navigation";
  import type { QuickAction } from "$lib/types";
  import Modal from "./Modal.svelte";

  interface Props {
    visible: boolean;
    onClose: () => void;
    contentActions: QuickAction[];
  }

  let { visible, onClose, contentActions }: Props = $props();

  let searchQuery = $state("");
  let selectedIndex = $state(0);
  let inputElement = $state<HTMLInputElement | null>(null);

  // Define static actions
  const staticActions: QuickAction[] = [
    // Pages
    { id: "home", title: "Home", category: "page", url: "/", keywords: ["home", "index"] },
    {
      id: "resume",
      title: "Resume",
      category: "page",
      url: "/resume/",
      keywords: ["resume", "cv", "experience"]
    },
    {
      id: "projects",
      title: "Projects",
      category: "page",
      url: "/projects/",
      keywords: ["projects", "work", "portfolio"]
    },
    {
      id: "blog",
      title: "Blog",
      category: "page",
      url: "/blog/",
      keywords: ["blog", "articles", "posts"]
    },
    {
      id: "interests",
      title: "Interests",
      description: "Who I follow, my setup, and what I do outside work",
      category: "page",
      url: "/interests/",
      keywords: ["interests", "following", "youtube", "creators", "setup", "outside work"]
    },
    {
      id: "proof",
      title: "Proof Ledger",
      description: "Trace selected portfolio claims to their published sources",
      category: "page",
      url: "/proof/",
      keywords: ["proof", "evidence", "claims", "sources", "ledger"]
    },
    {
      id: "ai-evals",
      title: "AI Evaluation Trends",
      description: "View sanitized aggregate checks for the public AI features",
      category: "page",
      url: "/ai-evals/",
      keywords: ["ai", "evals", "quality", "tests", "trends"]
    },
    {
      id: "trace-one-answer",
      title: "Trace One AI Answer",
      description: "Follow an AI request through the implemented architecture",
      category: "page",
      url: "/trace-one-answer/",
      keywords: ["ai", "trace", "architecture", "cloud run", "gemini"]
    },

    // Variant switches
    {
      id: "switch-leader",
      title: "Switch to Leader Resume",
      description: "Focus: Team leadership, architecture, strategy",
      category: "variant",
      url: "/resume/",
      keywords: ["leader", "leadership", "architect", "director"]
    },
    {
      id: "switch-ops",
      title: "Switch to Ops Resume",
      description: "Focus: DevOps, platform engineering, reliability",
      category: "variant",
      url: "/ops/resume/",
      keywords: ["ops", "devops", "sre", "platform"]
    },
    {
      id: "switch-builder",
      title: "Switch to Builder Resume",
      description: "Focus: Hands-on coding, technical depth",
      category: "variant",
      url: "/builder/resume/",
      keywords: ["builder", "engineer", "developer", "coding"]
    }
  ];

  // Combine static and dynamic actions
  const allActions = $derived([...staticActions, ...contentActions]);

  // Filter actions based on search query
  const filteredActions = $derived(() => {
    if (!searchQuery.trim()) return allActions;

    const query = searchQuery.toLowerCase();
    return allActions.filter((action) => {
      const titleMatch = action.title.toLowerCase().includes(query);
      const descMatch = action.description?.toLowerCase().includes(query);
      const keywordMatch = action.keywords?.some((k) => k.toLowerCase().includes(query));
      return titleMatch || descMatch || keywordMatch;
    });
  });

  // Reset selection when filtered results change
  $effect(() => {
    if (filteredActions().length > 0 && selectedIndex >= filteredActions().length) {
      selectedIndex = 0;
    }
  });

  // Focus input when visible. Modal defers to this (it won't steal focus back).
  $effect(() => {
    if (visible && inputElement) {
      inputElement.focus();
    }
  });

  // Arrow/Enter navigation. Escape is owned by the Modal shell.
  function handleKeyDown(e: KeyboardEvent) {
    const actions = filteredActions();

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % actions.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = selectedIndex === 0 ? actions.length - 1 : selectedIndex - 1;
    } else if (e.key === "Enter") {
      e.preventDefault();
      executeAction(actions[selectedIndex]);
    }
  }

  function executeAction(action: QuickAction) {
    if (action.handler) {
      action.handler();
    } else if (action.url) {
      goto(action.url);
    }
    onClose();
    searchQuery = "";
    selectedIndex = 0;
  }

  function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      page: "Page",
      blog: "Blog Post",
      project: "Project",
      variant: "Resume Variant",
      action: "Action"
    };
    return labels[category] || category;
  }
</script>

<Modal
  {visible}
  {onClose}
  title="Quick Actions"
  labelledby="quick-actions-title"
  closeLabel="Close quick actions"
  testid="quick-actions"
  align="top"
>
  <div class="font-mono text-sm flex flex-col flex-1 min-h-0">
    <div class="p-4 border-b border-terminal-green/20 shrink-0">
      <input
        bind:this={inputElement}
        bind:value={searchQuery}
        onkeydown={handleKeyDown}
        type="text"
        placeholder="Type to search..."
        class="bg-transparent border-none outline-none text-terminal-green placeholder:text-terminal-text/50 w-full"
        data-testid="quick-actions-input"
        aria-label="Search actions"
      />
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto">
      {#if filteredActions().length === 0}
        <div class="p-8 text-center text-terminal-text/70">
          No actions found for "{searchQuery}"
        </div>
      {:else}
        {#each filteredActions() as action, index (action.id)}
          <button
            onclick={() => executeAction(action)}
            onmouseenter={() => (selectedIndex = index)}
            class="w-full px-4 py-3 flex items-center gap-3 text-left border-b border-terminal-green/10 transition-colors cursor-pointer hover:bg-terminal-green/5 {index ===
            selectedIndex
              ? 'bg-terminal-green/10'
              : ''}"
            data-testid="action-{action.id}"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-terminal-green font-medium">{action.title}</span>
                <span
                  class="text-xs text-terminal-text/70 px-2 py-0.5 rounded border border-terminal-green/30"
                  >{getCategoryLabel(action.category)}</span
                >
              </div>
              {#if action.description}
                <div class="text-xs text-terminal-text/70 mt-1">{action.description}</div>
              {/if}
            </div>
            {#if index === selectedIndex}
              <span class="text-terminal-green text-xs">↵</span>
            {/if}
          </button>
        {/each}
      {/if}
    </div>

    <div
      class="p-3 border-t border-terminal-green/20 text-xs text-terminal-text/70 flex gap-4 shrink-0"
    >
      <span
        ><kbd
          class="px-1.5 py-0.5 bg-terminal-green/10 border border-terminal-green/30 rounded text-terminal-green font-mono"
          >↑↓</kbd
        > Navigate</span
      >
      <span
        ><kbd
          class="px-1.5 py-0.5 bg-terminal-green/10 border border-terminal-green/30 rounded text-terminal-green font-mono"
          >↵</kbd
        > Select</span
      >
      <span
        ><kbd
          class="px-1.5 py-0.5 bg-terminal-green/10 border border-terminal-green/30 rounded text-terminal-green font-mono"
          >Esc</kbd
        > Close</span
      >
    </div>
  </div>
</Modal>

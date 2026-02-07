<script lang="ts">
  import { Menu } from "lucide-svelte";
  import { slide } from "svelte/transition";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  import KeyboardIndicator from "$lib/components/KeyboardIndicator.svelte";
  import { page } from "$app/stores";
  import { addVariant, getVariant } from "$lib/utils/variantLink";

  interface Props {
    onOpenShortcutsHelp?: () => void;
    onOpenChat?: () => void;
    onOpenFitFinder?: () => void;
    onOpenQuickActions?: () => void;
  }

  let { onOpenShortcutsHelp, onOpenChat, onOpenFitFinder, onOpenQuickActions }: Props = $props();

  let open = $state(false);

  // Terminal input state
  let terminalInput = $state('');
  let showAutocomplete = $state(false);
  let selectedIndex = $state(0);
  let inputElement: HTMLInputElement | undefined;
  let isFocused = $state(false);

  const commands = [
    { id: 'chat', label: 'chat', description: 'Chat with my AI assistant', action: onOpenChat },
    { id: 'fit-finder', label: 'fit-finder', description: "Analyze role fit with AI", action: onOpenFitFinder },
    { id: 'quick-actions', label: 'quick-actions', description: 'Navigate quickly with keyboard shortcuts', action: onOpenQuickActions }
  ];

  const filteredCommands = $derived(() => {
    if (!terminalInput.trim()) return commands;
    const query = terminalInput.toLowerCase();
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query)
    );
  });

  const activeRoute = $derived($page.url.pathname);
  const variant = $derived(getVariant($page.url));

  function handleTerminalFocus() {
    isFocused = true;
    showAutocomplete = true;
    selectedIndex = 0;
  }

  function handleTerminalBlur() {
    // Delay to allow click on autocomplete
    setTimeout(() => {
      isFocused = false;
      showAutocomplete = false;
    }, 200);
  }

  function handleTerminalKeydown(e: KeyboardEvent) {
    const filtered = filteredCommands();

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % filtered.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = selectedIndex === 0 ? filtered.length - 1 : selectedIndex - 1;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        executeCommand(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      inputElement?.blur();
      terminalInput = '';
      showAutocomplete = false;
    }
  }

  function handleTerminalInput() {
    showAutocomplete = true;
    selectedIndex = 0;
  }

  function executeCommand(command: typeof commands[0]) {
    if (command.action) {
      command.action();
    }
    terminalInput = '';
    showAutocomplete = false;
    inputElement?.blur();
  }
</script>

<header
  class="sticky top-0 z-40 bg-skin-page/90 backdrop-blur border-b border-skin-border font-mono transition-colors duration-300 print:hidden"
>
  <div
    class="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4"
  >
    <div class="relative">
      <div class="text-sm md:text-base font-bold tracking-tight text-skin-base flex items-center gap-2 group">
        <a
          href={addVariant("/", variant)}
          class="text-skin-accent hover:animate-pulse"
          >guest@briananderson:~$</a
        >
        <button
          onclick={() => inputElement?.focus()}
          class="cursor-text flex items-center gap-0"
        >
          {#if !isFocused && !terminalInput}
            <span class="w-2 h-4 bg-skin-accent animate-terminal-blink"></span>
          {/if}
          <div class="relative inline-flex items-center" style="min-width: 8px; max-width: 300px;">
            <span class="invisible whitespace-pre font-mono text-skin-accent" aria-hidden="true" style="padding: 0 16px 0 0;">{terminalInput || ''}</span>
            <input
              bind:this={inputElement}
              bind:value={terminalInput}
              onfocus={handleTerminalFocus}
              onblur={handleTerminalBlur}
              onkeydown={handleTerminalKeydown}
              oninput={handleTerminalInput}
              type="text"
              class="absolute left-0 top-0 bg-transparent border-none outline-none text-skin-accent font-mono w-full h-full"
              class:focused={isFocused}
              placeholder=""
              maxlength="30"
              aria-label="Terminal command input"
              style="caret-color: transparent;"
            />
            {#if isFocused}
              <style>
                input.focused {
                  caret-color: rgb(var(--color-accent));
                }
              </style>
            {/if}
            {#if !isFocused && terminalInput}
              <span class="w-2 h-4 bg-skin-accent animate-terminal-blink" style="margin-left: -1rem;"></span>
            {/if}
          </div>
        </button>
      </div>

      {#if showAutocomplete && filteredCommands().length > 0}
        <div class="absolute top-full left-0 mt-2 min-w-[280px] z-50 bg-terminal-black border-2 border-terminal-green rounded-lg shadow-2xl font-mono text-sm">
          {#each filteredCommands() as command, index}
            <button
              onclick={() => executeCommand(command)}
              class="w-full px-4 py-3 text-left flex flex-col gap-1 border-b border-terminal-green/10 last:border-b-0 hover:bg-terminal-green/10 transition-colors cursor-pointer {index === selectedIndex ? 'bg-terminal-green/10' : ''}"
            >
              <span class="text-terminal-green font-semibold">{command.label}</span>
              <span class="text-terminal-text/70 text-xs">{command.description}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <nav class="hidden md:flex gap-6 text-sm items-center">
      <a
        class="hover:text-skin-accent transition-colors {activeRoute.includes(
          '/resume',
        )
          ? 'text-skin-accent'
          : 'text-skin-muted'}"
        href={addVariant("/resume/", variant)}>./resume</a
      >
      <a
        class="hover:text-skin-accent transition-colors {activeRoute.startsWith(
          '/projects',
        )
          ? 'text-skin-accent'
          : 'text-skin-muted'}"
        href={addVariant("/projects/", variant)}>./projects</a
      >
      <a
        class="hover:text-skin-accent transition-colors {activeRoute.startsWith(
          '/blog',
        )
          ? 'text-skin-accent'
          : 'text-skin-muted'}"
        href={addVariant("/blog/", variant)}>./blog</a
      >
      <a
        class="hover:text-skin-accent transition-colors text-skin-muted"
        href={addVariant("/#contact", variant)}>./contact</a
      >
      {#if onOpenShortcutsHelp}
        <KeyboardIndicator onOpenHelp={onOpenShortcutsHelp} />
      {/if}
      <ThemeToggle />
    </nav>

    <button
      class="md:hidden p-2 text-skin-muted hover:text-skin-accent"
      aria-label="Menu"
      onclick={() => (open = !open)}
    >
      <Menu size={20} />
    </button>
  </div>

  {#if open}
    <div
      transition:slide
      class="md:hidden border-t border-skin-border bg-skin-page"
    >
      <div
        class="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3 font-mono text-sm"
      >
        <a
          class="hover:text-skin-accent {activeRoute.includes('/resume')
            ? 'text-skin-accent'
            : 'text-skin-muted'}"
          onclick={() => (open = false)}
          href={addVariant("/resume/", variant)}>./resume</a
        >
        <a
          class="hover:text-skin-accent {activeRoute.startsWith('/projects')
            ? 'text-skin-accent'
            : 'text-skin-muted'}"
          onclick={() => (open = false)}
          href={addVariant("/projects/", variant)}>./projects</a
        >
        <a
          class="hover:text-skin-accent {activeRoute.startsWith('/blog')
            ? 'text-skin-accent'
            : 'text-skin-muted'}"
          onclick={() => (open = false)}
          href={addVariant("/blog/", variant)}>./blog</a
        >
        <a
          class="text-skin-muted hover:text-skin-accent"
          onclick={() => (open = false)}
          href={addVariant("/#contact", variant)}>./contact</a
        >
        <div
          class="pt-2 border-t border-skin-border mt-2 flex justify-between items-center"
        >
          <span class="text-xs text-skin-muted">Theme:</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  {/if}
</header>

<style>
  input::placeholder {
    color: rgba(var(--color-text-muted), 0.5);
  }
</style>

<script lang="ts">
  import { Menu, X } from "lucide-svelte";
  import { onDestroy } from "svelte";
  import { slide } from "svelte/transition";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  import KeyboardIndicator from "$lib/components/KeyboardIndicator.svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
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
  let terminalInput = $state("");
  let showAutocomplete = $state(false);
  let selectedIndex = $state(0);
  let inputElement: HTMLInputElement | undefined;
  let inputContainerElement = $state<HTMLLabelElement | undefined>(undefined);
  let isFocused = $state(false);
  let blurTimer: ReturnType<typeof setTimeout> | undefined;
  let mobileMenuButton: HTMLButtonElement | undefined;

  const commandListId = "terminal-command-listbox";
  const mobileMenuId = "mobile-navigation";

  const commands = $derived([
    {
      id: "chat",
      label: "chat --with brian",
      description: "Chat about experience, skills, projects, or anything else",
      icon: "›",
      aliases: ["ask", "talk"],
      action: onOpenChat
    },
    {
      id: "fit-finder",
      label: "check-fit",
      description: "Paste your job/project description → instant compatibility analysis",
      icon: "⚡",
      aliases: ["job", "match", "hire"],
      action: onOpenFitFinder
    },
    {
      id: "quick-actions",
      label: "quick-actions",
      description: "Navigate quickly with keyboard shortcuts",
      icon: "⌘",
      aliases: ["shortcuts", "keys"],
      action: onOpenQuickActions
    },
    {
      id: "resume",
      label: "cd resume",
      description: "View the full resume and work history",
      icon: "→",
      aliases: ["resume", "cv", "experience", "./resume"],
      action: () => goto(addVariant("/resume/", variant))
    },
    {
      id: "projects",
      label: "cd projects",
      description: "Browse projects and case studies",
      icon: "→",
      aliases: ["projects", "work", "portfolio", "./projects"],
      action: () => goto(addVariant("/projects/", variant))
    },
    {
      id: "blog",
      label: "cd blog",
      description: "Read the blog",
      icon: "→",
      aliases: ["blog", "posts", "writing", "./blog"],
      action: () => goto(addVariant("/blog/", variant))
    },
    {
      id: "interests",
      label: "cd interests",
      description: "What I follow, my setup, and life outside work",
      icon: "→",
      aliases: ["interests", "about", "./interests"],
      action: () => goto("/interests/")
    },
    {
      id: "proof",
      label: "claims & evidence",
      description: "See the sources and limitations behind selected portfolio claims",
      icon: "✓",
      aliases: ["proof", "evidence", "claims", "sources"],
      action: () => goto("/proof/")
    },
    {
      id: "trace-one-answer",
      label: "how this site's ai works",
      description: "Understand what leaves your browser and how answers are checked",
      icon: "→",
      aliases: ["ai", "trace", "architecture", "gemini"],
      action: () => goto("/trace-one-answer/")
    },
    {
      id: "contact",
      label: "contact",
      description: "Get in touch",
      icon: "→",
      aliases: ["contact", "email", "reach"],
      action: () => goto(addVariant("/#contact", variant))
    }
  ]);

  // "help" / "ls" list everything, like a real shell would.
  const listAllQueries = ["help", "ls", "ls -la", "ls -a", "?", "man", "commands"];

  const filteredCommands = $derived(() => {
    const query = terminalInput.trim().toLowerCase();
    if (!query) return commands;
    if (listAllQueries.includes(query)) return commands;
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query) ||
        (cmd.aliases ?? []).some((alias) => alias.includes(query) || query.includes(alias))
    );
  });

  const activeRoute = $derived($page.url.pathname);
  const variant = $derived(getVariant($page.url));
  const autocompleteOpen = $derived(showAutocomplete && filteredCommands().length > 0);
  const activeOptionId = $derived(
    autocompleteOpen && filteredCommands()[selectedIndex]
      ? `terminal-command-option-${filteredCommands()[selectedIndex].id}`
      : undefined
  );

  let previousRoute: string | undefined;

  $effect(() => {
    if (previousRoute === undefined) {
      previousRoute = activeRoute;
      return;
    }
    if (activeRoute !== previousRoute) {
      open = false;
      previousRoute = activeRoute;
    }
  });

  onDestroy(() => {
    if (blurTimer) clearTimeout(blurTimer);
  });

  function handleTerminalFocus() {
    if (blurTimer) clearTimeout(blurTimer);
    isFocused = true;
    showAutocomplete = true;
    selectedIndex = 0;
  }

  function handleTerminalBlur() {
    // Delay to allow click on autocomplete
    if (blurTimer) clearTimeout(blurTimer);
    blurTimer = setTimeout(() => {
      isFocused = false;
      showAutocomplete = false;
      blurTimer = undefined;
    }, 200);
  }

  function handleTerminalKeydown(e: KeyboardEvent) {
    const filtered = filteredCommands();

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filtered.length === 0) return;
      selectedIndex = (selectedIndex + 1) % filtered.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filtered.length === 0) return;
      selectedIndex = selectedIndex === 0 ? filtered.length - 1 : selectedIndex - 1;
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        executeCommand(filtered[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      inputElement?.blur();
      terminalInput = "";
      showAutocomplete = false;
    }
  }

  function handleTerminalInput() {
    showAutocomplete = true;
    selectedIndex = 0;
  }

  function executeCommand(command: (typeof commands)[0]) {
    if (blurTimer) {
      clearTimeout(blurTimer);
      blurTimer = undefined;
    }
    if (command.action) {
      command.action();
    }
    terminalInput = "";
    showAutocomplete = false;
    inputElement?.blur();
  }

  function closeMobileMenu(restoreFocus = false) {
    open = false;
    if (restoreFocus) {
      requestAnimationFrame(() => mobileMenuButton?.focus());
    }
  }

  function toggleMobileMenu() {
    if (open) {
      closeMobileMenu(true);
    } else {
      open = true;
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      closeMobileMenu(true);
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<header
  class="sticky top-0 z-40 bg-skin-page/90 backdrop-blur border-b border-skin-border font-mono transition-colors duration-300 print:hidden"
>
  <div class="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
    <div class="relative">
      <div
        class="text-sm md:text-base font-bold tracking-tight text-skin-base flex items-center gap-2 group"
      >
        <a href={addVariant("/", variant)} class="text-skin-accent hover:animate-pulse"
          >guest@briananderson:~$</a
        >
        <label bind:this={inputContainerElement} class="cursor-text flex items-center gap-0">
          {#if !isFocused && !terminalInput}
            <span class="w-2 h-4 bg-skin-accent animate-terminal-blink" aria-hidden="true"></span>
          {/if}
          <div
            class="relative inline-flex items-center h-5"
            style="min-width: 8px; max-width: 300px;"
          >
            <span
              class="invisible whitespace-pre font-mono text-skin-accent"
              aria-hidden="true"
              style="padding: 0 16px 0 0;">{terminalInput || ""}</span
            >
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
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={autocompleteOpen}
              aria-controls={commandListId}
              aria-activedescendant={activeOptionId}
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
              <span
                class="w-2 h-4 bg-skin-accent animate-terminal-blink"
                aria-hidden="true"
                style="margin-left: -1rem;"
              ></span>
            {/if}
          </div>
        </label>
      </div>

      {#if autocompleteOpen}
        <div
          id={commandListId}
          role="listbox"
          aria-label="Terminal commands"
          class="absolute top-full mt-2 min-w-[320px] z-50 bg-terminal-black border-2 border-terminal-green rounded-lg shadow-2xl font-mono text-sm"
          style="left: {inputContainerElement?.offsetLeft ?? 0}px;"
        >
          {#each filteredCommands() as command, index}
            <button
              id={`terminal-command-option-${command.id}`}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              tabindex="-1"
              onmousedown={(event) => event.preventDefault()}
              onclick={() => executeCommand(command)}
              class="w-full px-4 py-3 text-left flex items-start gap-3 border-b border-terminal-green/10 last:border-b-0 hover:bg-terminal-green/20 transition-colors cursor-pointer {index ===
              selectedIndex
                ? 'bg-terminal-green/10'
                : ''}"
            >
              <span class="text-xl">{command.icon}</span>
              <div class="flex-1">
                <div class="text-terminal-green font-semibold mb-1">$ {command.label}</div>
                <div class="text-terminal-text/70 text-xs">{command.description}</div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <nav aria-label="Primary navigation" class="hidden md:flex gap-6 text-sm items-center">
      <a
        class="hover:text-skin-accent transition-colors {activeRoute.includes('/resume')
          ? 'text-skin-accent'
          : 'text-skin-muted'}"
        href={addVariant("/resume/", variant)}>./resume</a
      >
      <a
        class="hover:text-skin-accent transition-colors {activeRoute.startsWith('/projects')
          ? 'text-skin-accent'
          : 'text-skin-muted'}"
        href={addVariant("/projects/", variant)}>./projects</a
      >
      <a
        class="hover:text-skin-accent transition-colors {activeRoute.startsWith('/blog')
          ? 'text-skin-accent'
          : 'text-skin-muted'}"
        href={addVariant("/blog/", variant)}>./blog</a
      >
      <a
        class="hover:text-skin-accent transition-colors {activeRoute.startsWith('/interests')
          ? 'text-skin-accent'
          : 'text-skin-muted'}"
        href="/interests/">./interests</a
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
      bind:this={mobileMenuButton}
      type="button"
      class="md:hidden p-2 text-skin-muted hover:text-skin-accent"
      aria-label={open ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={open}
      aria-controls={mobileMenuId}
      onclick={toggleMobileMenu}
    >
      {#if open}
        <X size={20} aria-hidden="true" />
      {:else}
        <Menu size={20} aria-hidden="true" />
      {/if}
    </button>
  </div>

  {#if open}
    <nav
      id={mobileMenuId}
      aria-label="Mobile navigation"
      transition:slide
      class="md:hidden border-t border-skin-border bg-skin-page"
    >
      <div class="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3 font-mono text-sm">
        <a
          class="hover:text-skin-accent {activeRoute.includes('/resume')
            ? 'text-skin-accent'
            : 'text-skin-muted'}"
          onclick={() => closeMobileMenu()}
          href={addVariant("/resume/", variant)}>./resume</a
        >
        <a
          class="hover:text-skin-accent {activeRoute.startsWith('/projects')
            ? 'text-skin-accent'
            : 'text-skin-muted'}"
          onclick={() => closeMobileMenu()}
          href={addVariant("/projects/", variant)}>./projects</a
        >
        <a
          class="hover:text-skin-accent {activeRoute.startsWith('/blog')
            ? 'text-skin-accent'
            : 'text-skin-muted'}"
          onclick={() => closeMobileMenu()}
          href={addVariant("/blog/", variant)}>./blog</a
        >
        <a
          class="hover:text-skin-accent {activeRoute.startsWith('/interests')
            ? 'text-skin-accent'
            : 'text-skin-muted'}"
          onclick={() => closeMobileMenu()}
          href="/interests/">./interests</a
        >
        <a
          class="text-skin-muted hover:text-skin-accent"
          onclick={() => closeMobileMenu()}
          href={addVariant("/#contact", variant)}>./contact</a
        >
        <div class="pt-2 border-t border-skin-border mt-2 flex justify-between items-center">
          <span class="text-xs text-skin-muted">Theme:</span>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  {/if}
</header>

<style>
  input::placeholder {
    color: rgba(var(--color-text-muted), 0.5);
  }
</style>

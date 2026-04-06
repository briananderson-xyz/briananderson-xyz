<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";

  interface Creator {
    name: string;
    handle: string;
    url: string;
    platform: string;
    thumbnail?: string;
    description: string;
  }

  interface CreatorCategory {
    id?: string;
    name: string;
    creators: Creator[];
  }

  interface SetupItem {
    label: string;
    value: string;
  }

  interface SetupCategory {
    name: string;
    items: SetupItem[];
  }

  interface TextItem {
    heading: string;
    body: string;
  }

  interface Section {
    id: string;
    name: string;
    description?: string;
    type: "creators" | "setup" | "text";
    categories?: CreatorCategory[] | SetupCategory[];
    items?: TextItem[];
  }

  interface Interests {
    title: string;
    description: string;
    sections: Section[];
  }

  interface Props {
    data: { interests: Interests | null };
  }

  let { data }: Props = $props();

  const platformMeta: Record<string, { label: string; color: string; icon: string }> = {
    youtube: {
      label: "YouTube",
      color: "bg-red-600/90 text-white",
      icon: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
    },
    twitter: {
      label: "X / Twitter",
      color: "bg-black text-white",
      icon: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
    },
    podcast: {
      label: "Podcast",
      color: "bg-purple-600/90 text-white",
      icon: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-1 14.93V20H9v2h6v-2h-2v-2.07A8.001 8.001 0 0 0 20 11h-2a6 6 0 0 1-12 0H4a8.001 8.001 0 0 0 7 7.93z"/></svg>`
    }
  };

  function getPlatform(key: string) {
    return platformMeta[key] ?? { label: key, color: "bg-skin-accent/20 text-skin-accent", icon: "" };
  }

  function asCreatorCategories(cats: unknown): CreatorCategory[] {
    return cats as CreatorCategory[];
  }

  function asSetupCategories(cats: unknown): SetupCategory[] {
    return cats as SetupCategory[];
  }
</script>

{#if data.interests}
  <SEO
    title="Interests | Brian Anderson"
    description="Who I follow, my setup, and what I'm into outside of work."
    canonical="https://briananderson.xyz/interests"
  />

  <section class="mx-auto max-w-4xl px-4 py-16">
    <!-- Page header -->
    <div class="flex items-center gap-2 mb-4 font-mono text-skin-accent">
      <span>></span>
      <h1 class="text-3xl font-bold tracking-tight">./interests</h1>
    </div>
    <p class="font-mono text-skin-muted mb-12 border-l-2 border-skin-border pl-4 leading-relaxed">
      {data.interests.description}
    </p>

    <!-- Section nav / anchor links -->
    <nav class="mb-14 flex flex-wrap gap-3 font-mono text-xs">
      {#each data.interests.sections as section}
        <a
          href="#{section.id}"
          class="px-3 py-1.5 border border-skin-border rounded text-skin-muted hover:border-skin-accent hover:text-skin-accent transition-colors"
        >
          → {section.name}
        </a>
      {/each}
    </nav>

    <!-- Sections -->
    {#each data.interests.sections as section}
      <div id={section.id} class="mb-20 scroll-mt-20">
        <!-- Section header -->
        <div class="flex items-center gap-2 mb-2 text-skin-accent font-mono text-sm uppercase tracking-wider">
          <span>></span>
          <h2 class="font-bold">{section.name}</h2>
        </div>
        {#if section.description}
          <p class="font-mono text-skin-muted text-sm mb-8 border-l-2 border-skin-border pl-4 leading-relaxed">
            {section.description}
          </p>
        {/if}

        <!-- Creators section -->
        {#if section.type === "creators" && section.categories}
          {#each asCreatorCategories(section.categories) as category}
            <div class="mb-10">
              {#if category.name}
                <div class="flex items-center gap-2 mb-4 text-skin-muted font-mono text-xs uppercase tracking-widest">
                  <span class="w-4 h-px bg-skin-border"></span>
                  <span>{category.name}</span>
                </div>
              {/if}
              <div class="grid gap-3">
                {#each category.creators as creator}
                  {@const platform = getPlatform(creator.platform)}
                  <a
                    href={creator.url}
                    target="_blank"
                    rel="noreferrer"
                    class="group flex items-start gap-4 border border-skin-border bg-skin-base/5 hover:border-skin-accent hover:shadow-[0_0_10px_rgba(var(--color-accent),0.1)] transition-all duration-300 rounded-lg p-4"
                  >
                    <!-- Thumbnail -->
                    <div class="flex-shrink-0">
                      {#if creator.thumbnail}
                        <img
                          src={creator.thumbnail}
                          alt={creator.name}
                          class="w-14 h-14 rounded-full object-cover border border-skin-border grayscale group-hover:grayscale-0 transition-all duration-500"
                          loading="lazy"
                        />
                      {:else}
                        <div class="w-14 h-14 rounded-full border border-skin-border bg-skin-page flex items-center justify-center text-skin-accent font-mono font-bold text-xl">
                          {creator.name[0]}
                        </div>
                      {/if}
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap mb-1">
                        <h3 class="font-mono font-bold text-skin-base group-hover:text-skin-accent transition-colors">
                          {creator.name}
                        </h3>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide {platform.color}">
                          {@html platform.icon}
                          {platform.label}
                        </span>
                      </div>
                      <div class="text-xs font-mono text-skin-muted mb-2 group-hover:text-skin-accent/70 transition-colors">
                        {creator.handle} ↗
                      </div>
                      <p class="text-skin-muted text-sm font-mono leading-relaxed">{creator.description}</p>
                    </div>
                  </a>
                {/each}
              </div>
            </div>
          {/each}

        <!-- Setup section -->
        {:else if section.type === "setup" && section.categories}
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {#each asSetupCategories(section.categories) as category}
              <div class="border border-skin-border rounded-lg p-5 bg-skin-base/5 hover:border-skin-accent/50 transition-colors">
                <h3 class="font-mono text-xs font-bold uppercase tracking-wider text-skin-muted mb-4">
                  {category.name}
                </h3>
                <dl class="space-y-2">
                  {#each category.items as item}
                    <div class="flex flex-col gap-0.5">
                      <dt class="font-mono text-xs text-skin-muted/60 uppercase tracking-wide">{item.label}</dt>
                      <dd class="font-mono text-sm text-skin-base">{item.value}</dd>
                    </div>
                  {/each}
                </dl>
              </div>
            {/each}
          </div>

        <!-- Text / outside work section -->
        {:else if section.type === "text" && section.items}
          <div class="grid gap-6 sm:grid-cols-2">
            {#each section.items as item}
              <div class="border-l-2 border-skin-border pl-4 hover:border-skin-accent transition-colors group">
                <h3 class="font-mono font-bold text-skin-base mb-2 group-hover:text-skin-accent transition-colors">
                  {item.heading}
                </h3>
                <p class="font-mono text-sm text-skin-muted leading-relaxed">{item.body}</p>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </section>
{:else}
  <div class="max-w-3xl mx-auto px-4 py-16 font-mono text-skin-muted">
    Error: Could not load interests.
  </div>
{/if}

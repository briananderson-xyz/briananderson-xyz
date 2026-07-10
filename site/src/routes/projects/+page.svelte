<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { reveal } from "$lib/actions/reveal";
  import { titleTransitionName } from "$lib/utils/transitionName";
  import { addVariant, getCanonicalUrl } from "$lib/utils/variantLink";
  import {
    EMPTY_PROJECT_FILTERS,
    MAX_COMPARED_PROJECTS,
    filterProjects,
    readProjectQuery,
    writeProjectQuery,
    type ProjectFilters
  } from "$lib/utils/projectCatalog";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const projects = $derived(data.projects);
  const skillOptions = $derived([...new Set(projects.flatMap((project) => project.skills))].sort());
  const outcomeOptions = $derived(
    [...new Set(projects.map((project) => project.metadata.outcome).filter(Boolean))].sort()
  );
  const typeOptions = $derived(
    [...new Set(projects.map((project) => project.metadata.projectType).filter(Boolean))].sort()
  );

  let filters = $state<ProjectFilters>({ ...EMPTY_PROJECT_FILTERS });
  let compared = $state<string[]>([]);
  let queryReady = $state(false);
  const visibleProjects = $derived(queryReady ? filterProjects(projects, filters) : projects);
  const comparedProjects = $derived(
    compared
      .map((slug) => projects.find((project) => project.slug === slug))
      .filter((project) => project !== undefined)
  );

  onMount(() => {
    restoreFromUrl($page.url);
    const restore = () => restoreFromUrl(new URL(window.location.href));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  });

  function restoreFromUrl(url: URL): void {
    const restored = readProjectQuery(url.searchParams);
    filters = restored.filters;
    compared = restored.compared.filter((slug) =>
      projects.some((project) => project.slug === slug)
    );
    queryReady = true;
  }

  async function syncUrl(): Promise<void> {
    if (!browser) return;
    const next = writeProjectQuery(new URL(window.location.href), filters, compared);
    await goto(`${next.pathname}${next.search}${next.hash}`, {
      replaceState: true,
      keepFocus: true,
      noScroll: true
    });
  }

  function updateFilter(key: keyof ProjectFilters, event: Event): void {
    filters = { ...filters, [key]: (event.currentTarget as HTMLSelectElement).value };
    void syncUrl();
  }

  function clearFilters(): void {
    filters = { ...EMPTY_PROJECT_FILTERS };
    void syncUrl();
  }

  function toggleComparison(slug: string, checked: boolean): void {
    if (checked && compared.length < MAX_COMPARED_PROJECTS) compared = [...compared, slug];
    if (!checked) compared = compared.filter((value) => value !== slug);
    void syncUrl();
  }

  function projectHref(route: string): string {
    return addVariant(route, filters.variant || null);
  }
</script>

<SEO
  title="Projects | Brian Anderson"
  description="A collection of deployed systems, experiments, and open source projects."
  canonical={getCanonicalUrl("/projects/")}
/>

<section class="mx-auto max-w-6xl px-4 py-16">
  <div class="flex items-center gap-2 mb-6 font-mono text-skin-accent">
    <span>></span>
    <h1 class="text-3xl font-bold tracking-tight">./projects</h1>
  </div>
  <p class="font-mono text-skin-muted mb-8 border-l-2 border-skin-border pl-4">
    A collection of deployed systems and experiments.
  </p>

  <form
    method="GET"
    action="/projects/"
    aria-labelledby="project-filter-heading"
    class="mb-8 rounded-lg border border-skin-border bg-skin-base/5 p-4"
    onsubmit={(event) => {
      if (browser) {
        event.preventDefault();
        void syncUrl();
      }
    }}
  >
    <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <h2 id="project-filter-heading" class="font-mono font-bold text-skin-base">
          ./filter_projects
        </h2>
        <p class="mt-1 text-sm text-skin-muted">
          Narrow the catalog by documented project metadata.
        </p>
      </div>
      <button
        type="button"
        class="font-mono text-sm text-skin-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skin-accent"
        onclick={clearFilters}>Clear filters</button
      >
    </div>

    <div class="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label class="grid min-w-0 gap-1 text-sm font-mono text-skin-muted">
        Variant
        <select
          name="v"
          value={filters.variant}
          onchange={(event) => updateFilter("variant", event)}
          class="w-full min-w-0 max-w-full rounded border border-skin-border bg-skin-page px-3 py-2 text-skin-base focus:border-skin-accent focus:outline-none"
        >
          <option value="">All variants</option>
          <option value="leader">Leader</option>
          <option value="ops">Ops</option>
          <option value="builder">Builder</option>
        </select>
      </label>
      <label class="grid min-w-0 gap-1 text-sm font-mono text-skin-muted">
        Skill / topic
        <select
          name="skill"
          value={filters.skill}
          onchange={(event) => updateFilter("skill", event)}
          class="w-full min-w-0 max-w-full rounded border border-skin-border bg-skin-page px-3 py-2 text-skin-base focus:border-skin-accent focus:outline-none"
        >
          <option value="">All skills / topics</option>
          {#each skillOptions as skill}
            <option value={skill}>{skill}</option>
          {/each}
        </select>
      </label>
      <label class="grid min-w-0 gap-1 text-sm font-mono text-skin-muted">
        Outcome
        <select
          name="outcome"
          value={filters.outcome}
          onchange={(event) => updateFilter("outcome", event)}
          class="w-full min-w-0 max-w-full rounded border border-skin-border bg-skin-page px-3 py-2 text-skin-base focus:border-skin-accent focus:outline-none"
        >
          <option value="">All outcomes</option>
          {#each outcomeOptions as outcome}
            <option value={outcome}>{outcome}</option>
          {/each}
        </select>
      </label>
      <label class="grid min-w-0 gap-1 text-sm font-mono text-skin-muted">
        Project type
        <select
          name="type"
          value={filters.type}
          onchange={(event) => updateFilter("type", event)}
          class="w-full min-w-0 max-w-full rounded border border-skin-border bg-skin-page px-3 py-2 text-skin-base focus:border-skin-accent focus:outline-none"
        >
          <option value="">All project types</option>
          {#each typeOptions as type}
            <option value={type}>{type}</option>
          {/each}
        </select>
      </label>
    </div>
    <button type="submit" class="sr-only">Apply project filters</button>
    <noscript>
      <p class="mt-4 text-sm text-skin-muted">
        Filtering and comparison require JavaScript. The complete project list remains available
        below.
      </p>
    </noscript>
  </form>

  <div class="mb-4 flex flex-wrap items-center justify-between gap-2 font-mono text-sm">
    <p class="text-skin-muted" aria-live="polite">
      Showing {visibleProjects.length} of {projects.length} projects
    </p>
    <p class="text-skin-muted" aria-live="polite">
      Compare {compared.length}/{MAX_COMPARED_PROJECTS} selected
    </p>
  </div>

  {#if comparedProjects.length > 0}
    <section
      aria-labelledby="comparison-heading"
      class="mb-8 overflow-x-auto rounded-lg border border-skin-border"
    >
      <h2 id="comparison-heading" class="p-4 font-mono font-bold text-skin-base">
        ./compare_projects
      </h2>
      <table class="w-full min-w-[44rem] border-collapse text-left text-sm">
        <caption class="sr-only">Comparison of selected projects</caption>
        <thead class="border-y border-skin-border bg-skin-base/5 font-mono text-skin-muted">
          <tr>
            <th scope="col" class="p-3">Project</th>
            <th scope="col" class="p-3">Variant</th>
            <th scope="col" class="p-3">Skills / topics</th>
            <th scope="col" class="p-3">Outcome</th>
            <th scope="col" class="p-3">Type</th>
            <th scope="col" class="p-3"><span class="sr-only">Comparison actions</span></th>
          </tr>
        </thead>
        <tbody>
          {#each comparedProjects as project}
            <tr class="border-b border-skin-border last:border-b-0">
              <th scope="row" class="p-3 font-mono font-bold text-skin-base">
                <a class="hover:text-skin-accent hover:underline" href={projectHref(project.route)}>
                  {project.metadata.title}
                </a>
              </th>
              <td class="p-3 text-skin-muted">{project.variants.join(", ") || "Not specified"}</td>
              <td class="p-3 text-skin-muted">{project.skills.join(", ")}</td>
              <td class="p-3 text-skin-muted">{project.metadata.outcome ?? "Not specified"}</td>
              <td class="p-3 text-skin-muted">{project.metadata.projectType ?? "Not specified"}</td>
              <td class="p-3 text-right">
                <button
                  type="button"
                  class="font-mono text-skin-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skin-accent"
                  onclick={() => toggleComparison(project.slug, false)}
                  aria-label={`Remove ${project.metadata.title} from comparison`}>Remove</button
                >
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/if}

  {#if visibleProjects.length === 0}
    <p class="rounded-lg border border-skin-border p-6 font-mono text-skin-muted">
      No projects match this filter combination. Clear a filter to broaden the catalog.
    </p>
  {:else}
    <div class="grid md:grid-cols-2 gap-6" data-testid="project-grid">
      {#each visibleProjects as p, i}
        <article use:reveal={{ delay: i * 60 }} data-project-slug={p.slug}>
          <a
            href={projectHref(p.route)}
            class="group block border border-skin-border bg-skin-base/5 hover:border-skin-accent hover:shadow-[0_0_10px_rgba(var(--color-accent),0.1)] transition-all duration-300 rounded-lg overflow-hidden"
          >
            {#if p.metadata.featuredImage}
              <div class="w-full">
                <img
                  src={p.metadata.featuredImage}
                  alt={p.metadata.featuredImageAlt || p.metadata.title}
                  loading="lazy"
                  decoding="async"
                  class="w-[65%] aspect-video my-2 mx-auto rounded border border-skin-border object-contain"
                />
              </div>
            {/if}

            <div class="p-4">
              <div class="flex justify-between items-start mb-2">
                <h2
                  class="font-bold text-lg font-mono text-skin-base group-hover:text-skin-accent transition-colors"
                  style:view-transition-name={titleTransitionName(p.metadata.title)}
                >
                  {p.metadata.title}
                </h2>
                <span
                  class="text-xs font-mono text-skin-muted border border-skin-border px-2 py-1 rounded"
                >
                  {p.metadata.period ?? new Date(p.metadata.date).getFullYear()}
                </span>
              </div>

              <p class="text-skin-muted text-sm mb-4 font-mono leading-relaxed">
                {p.metadata.summary}
              </p>

              <div class="flex flex-wrap gap-2">
                {#each p.metadata.tags as tag}
                  <span class="text-xs font-mono text-skin-accent before:content-['#']">{tag}</span>
                {/each}
              </div>
            </div>
          </a>
          <label
            class="mt-2 flex min-h-11 cursor-pointer items-center gap-2 rounded border border-skin-border px-3 py-2 font-mono text-sm text-skin-muted focus-within:border-skin-accent"
          >
            <input
              type="checkbox"
              name="compare"
              value={p.slug}
              checked={compared.includes(p.slug)}
              disabled={!compared.includes(p.slug) && compared.length >= MAX_COMPARED_PROJECTS}
              onchange={(event) =>
                toggleComparison(p.slug, (event.currentTarget as HTMLInputElement).checked)}
              class="h-4 w-4 accent-[rgb(var(--color-accent))]"
            />
            Compare {p.metadata.title}
          </label>
        </article>
      {/each}
    </div>
  {/if}
</section>

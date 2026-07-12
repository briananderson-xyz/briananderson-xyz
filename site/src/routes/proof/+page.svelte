<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import {
    evidenceStatePresentation,
    filterProofClaims,
    formatReviewDate,
    type EvidenceStateFilter
  } from "$lib/components/proofLedgerPresentation";
  import { getCanonicalUrl } from "$lib/utils/variantLink";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let activeState = $state<EvidenceStateFilter>("all");

  const filterOptions = [
    { value: "all", label: "All evidence" },
    { value: "documented", label: evidenceStatePresentation.documented.label },
    {
      value: "externally-corroborated",
      label: evidenceStatePresentation["externally-corroborated"].label
    },
    { value: "self-reported", label: evidenceStatePresentation["self-reported"].label }
  ] as const;

  const visibleClaims = $derived(filterProofClaims(data.claims, activeState));
</script>

<SEO
  title="Claims & Evidence | Brian Anderson"
  description="See which selected portfolio claims can be traced to Brian's project documentation, outside corroboration, or self-reported context."
  canonical={getCanonicalUrl("/proof/")}
/>

<div class="mx-auto max-w-5xl px-4 py-16">
  <header class="mb-10">
    <div class="mb-4 flex items-center gap-2 font-mono text-skin-accent">
      <span aria-hidden="true">></span>
      <h1 class="text-3xl font-bold tracking-tight">Claims &amp; evidence</h1>
    </div>
    <p
      class="max-w-3xl border-l-2 border-skin-border pl-4 font-mono leading-relaxed text-skin-muted"
    >
      Which claims on this portfolio can you trace, and what kind of support is available? This page
      links selected claims to their sources so recruiters, collaborators, and technical readers can
      inspect them. Most sources are Brian's own project documentation, not independent
      verification.
    </p>
  </header>

  <aside
    aria-labelledby="how-to-read-proof"
    class="mb-10 rounded-lg border border-skin-border bg-skin-base/5 p-5"
  >
    <h2 id="how-to-read-proof" class="mb-3 font-mono text-lg font-bold text-skin-base">
      What the labels mean
    </h2>
    <dl class="grid gap-4 md:grid-cols-3">
      {#each Object.values(evidenceStatePresentation) as presentation}
        <div>
          <dt class="font-mono text-sm font-bold text-skin-accent">{presentation.label}</dt>
          <dd class="mt-1 text-sm leading-relaxed text-skin-muted">{presentation.explanation}</dd>
        </div>
      {/each}
    </dl>
  </aside>

  <section aria-labelledby="ledger-claims">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id="ledger-claims" class="font-mono text-2xl font-bold text-skin-base">
          Selected claims
        </h2>
        <p class="mt-1 text-sm text-skin-muted" aria-live="polite">
          Showing {visibleClaims.length} of {data.claims.length} claims.
        </p>
      </div>

      <div aria-label="Filter claims by evidence state" class="flex flex-wrap gap-2" role="group">
        {#each filterOptions as option}
          <button
            type="button"
            aria-pressed={activeState === option.value}
            class="rounded border px-3 py-2 font-mono text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skin-accent"
            class:border-skin-accent={activeState === option.value}
            class:bg-skin-accent={activeState === option.value}
            class:text-skin-inverse={activeState === option.value}
            class:border-skin-border={activeState !== option.value}
            class:text-skin-muted={activeState !== option.value}
            onclick={() => (activeState = option.value)}
          >
            {option.label}
          </button>
        {/each}
      </div>
    </div>

    {#if visibleClaims.length > 0}
      <ol class="space-y-6">
        {#each visibleClaims as claim (claim.id)}
          <li class="rounded-lg border border-skin-border bg-skin-base/5 p-5 sm:p-6">
            <article aria-labelledby={`claim-${claim.id}`}>
              <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h3 id={`claim-${claim.id}`} class="text-xl font-bold leading-snug text-skin-base">
                  {claim.text}
                </h3>
                <span
                  class="w-fit shrink-0 rounded border border-skin-border px-2 py-1 font-mono text-xs text-skin-accent"
                >
                  {evidenceStatePresentation[claim.evidenceState].label}
                </span>
              </div>

              <div class="mb-5">
                <h4
                  class="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-skin-muted"
                >
                  Supporting excerpt from the source
                </h4>
                <blockquote
                  class="border-l-2 border-skin-accent pl-4 leading-relaxed text-skin-base"
                >
                  “{claim.source.excerpt}”
                </blockquote>
              </div>

              <dl class="grid gap-4 border-t border-skin-border pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt class="font-mono text-xs uppercase tracking-wide text-skin-muted">Source</dt>
                  <dd class="mt-1">
                    <a
                      href={claim.caseStudyRoute}
                      class="break-words font-mono text-skin-accent underline decoration-skin-border underline-offset-4 hover:decoration-skin-accent"
                    >
                      {claim.source.path}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt class="font-mono text-xs uppercase tracking-wide text-skin-muted">
                    Ledger reviewed
                  </dt>
                  <dd class="mt-1 text-skin-base">
                    <time datetime={claim.freshness.reviewedAt}>
                      {formatReviewDate(claim.freshness.reviewedAt)}
                    </time>
                  </dd>
                </div>
              </dl>

              <p class="mt-4 text-sm leading-relaxed text-skin-muted">
                {evidenceStatePresentation[claim.evidenceState].explanation}
              </p>
            </article>
          </li>
        {/each}
      </ol>
    {:else}
      <p class="rounded-lg border border-skin-border p-6 font-mono text-skin-muted">
        No claims currently use this evidence state.
      </p>
    {/if}
  </section>
</div>

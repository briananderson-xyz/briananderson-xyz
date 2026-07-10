<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import AiEvalTrend from "$lib/components/AiEvalTrend.svelte";
  import type { AiEvalHistory } from "$lib/schemas/aiEvalHistory";
  import { getCanonicalUrl } from "$lib/utils/variantLink";

  interface Props {
    data: { history: AiEvalHistory };
  }

  let { data }: Props = $props();
</script>

<SEO
  title="AI Evaluation Trends | Brian Anderson"
  description="Sanitized aggregate quality trends for the public AI features on briananderson.xyz."
  canonical={getCanonicalUrl("/ai-evals/")}
/>

<section class="mx-auto max-w-5xl px-4 py-16">
  <div class="mb-4 flex items-center gap-2 font-mono text-skin-accent">
    <span aria-hidden="true">&gt;</span>
    <h1 class="text-3xl font-bold tracking-tight">./ai-evals</h1>
  </div>
  <p
    class="mb-4 max-w-3xl border-l-2 border-skin-border pl-4 font-mono leading-relaxed text-skin-muted"
  >
    A public, aggregate view of regression checks for this site's AI features. It reports counts and
    stable scenario identifiers—not prompts, job descriptions, answers, judge commentary, or model
    response text.
  </p>
  <p class="mb-12 max-w-3xl pl-4 font-mono text-sm text-skin-muted">
    These evaluations are useful engineering signals, not proof that every answer is correct.
    Results can vary across models and environments, and aggregate passing checks do not replace
    security review, human review, or production monitoring.
  </p>

  {#if data.history.status === "baseline-pending"}
    <section
      aria-labelledby="baseline-pending-heading"
      class="rounded-lg border border-skin-border bg-skin-base/5 p-6"
    >
      <h2 id="baseline-pending-heading" class="mb-2 font-mono text-xl font-bold text-skin-base">
        Baseline pending
      </h2>
      <p class="font-mono text-sm leading-relaxed text-skin-muted">
        No trustworthy, sanitized historical run has been published yet. This page will show
        aggregate trends after an explicitly identified run is normalized and reviewed.
      </p>
    </section>
  {:else}
    <AiEvalTrend runs={data.history.runs} />
  {/if}

  <section
    aria-labelledby="published-fields-heading"
    class="mt-12 border-t border-skin-border pt-8"
  >
    <h2 id="published-fields-heading" class="mb-3 font-mono text-lg font-bold text-skin-base">
      What is published
    </h2>
    <p class="font-mono text-sm leading-relaxed text-skin-muted">
      Schema version, run ID and date, commit, environment, suite and scenario IDs, aggregate
      pass/fail/skip counts, and pass rate. The public writer uses a strict allowlist and rejects
      unknown fields before writing the versioned artifact.
    </p>
  </section>
</section>

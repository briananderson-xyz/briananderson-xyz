<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import AiEvalTrend from "$lib/components/AiEvalTrend.svelte";
  import type { PageData } from "./$types";
  import { getCanonicalUrl } from "$lib/utils/variantLink";
  import {
    architectureStages,
    verificationLabels,
    type VerificationScope
  } from "./architectureFlow";

  const badgeClasses: Record<VerificationScope, string> = {
    "repo-verified": "border-skin-success bg-skin-success text-skin-success-contrast",
    "external-contract": "border-skin-warning bg-skin-warning text-skin-warning-contrast",
    "runtime-dependent": "border-skin-border bg-skin-base/10 text-skin-muted"
  };

  let { data }: { data: PageData } = $props();
</script>

<SEO
  title="How This Site's AI Works | Brian Anderson"
  description="What leaves your browser, what the site's AI can access, how answers are checked, and what the repository cannot prove about the live service."
  canonical={getCanonicalUrl("/trace-one-answer/")}
/>

<article class="mx-auto max-w-5xl px-4 py-16">
  <header class="mb-10">
    <div class="mb-4 flex min-w-0 items-center gap-2 font-mono text-skin-accent">
      <span aria-hidden="true">&gt;</span>
      <h1 class="min-w-0 break-words text-3xl font-bold tracking-tight">
        How this site's AI works
      </h1>
    </div>
    <p
      class="max-w-3xl border-l-2 border-skin-border pl-4 font-mono leading-relaxed text-skin-muted"
    >
      Before using the chat or Fit Finder, you may want to know what text leaves your browser, what
      the model can access, and what checks stand between a request and an answer. This is an
      architecture and design walkthrough—not a recording of a real visitor request or proof of the
      live deployment.
    </p>
  </header>

  <section aria-labelledby="legend-heading" class="mb-12 rounded-lg border border-skin-border p-5">
    <h2 id="legend-heading" class="mb-4 font-mono text-lg font-bold text-skin-base">
      What is known from the code
    </h2>
    <dl class="grid gap-4 text-sm md:grid-cols-3">
      <div>
        <dt class="font-mono font-bold text-skin-success">Verified in this repository</dt>
        <dd class="mt-1 leading-relaxed text-skin-muted">
          Behavior directly represented in source and tests.
        </dd>
      </div>
      <div>
        <dt class="font-mono font-bold text-skin-warning">External contract</dt>
        <dd class="mt-1 leading-relaxed text-skin-muted">
          Required deployment behavior whose live state is outside this repository.
        </dd>
      </div>
      <div>
        <dt class="font-mono font-bold text-skin-base">Runtime-dependent</dt>
        <dd class="mt-1 leading-relaxed text-skin-muted">
          The path or result can vary by request, model, and service state.
        </dd>
      </div>
    </dl>
  </section>

  <section aria-labelledby="answer-checks-heading" class="mt-14">
    <h2 id="answer-checks-heading" class="font-mono text-2xl font-bold text-skin-base">
      How answers are checked
    </h2>
    <p class="mb-7 mt-2 max-w-3xl text-sm leading-relaxed text-skin-muted">
      Automated scenarios exercise expected behavior before deployment. The public history contains
      aggregate counts and opaque scenario IDs only—never prompts, job descriptions, answers, or
      judge commentary. These checks catch regressions; they do not prove every answer is correct.
    </p>
    {#if data.history.status === "baseline-pending"}
      <div class="rounded-lg border border-skin-border bg-skin-base/5 p-6">
        <h3 class="mb-2 font-mono text-xl font-bold text-skin-base">Baseline pending</h3>
        <p class="text-sm leading-relaxed text-skin-muted">
          No reviewed, sanitized historical run has been published yet. Aggregate results will
          appear here after an identified run is normalized and reviewed.
        </p>
      </div>
    {:else}
      <AiEvalTrend runs={data.history.runs} />
    {/if}
  </section>

  <section aria-labelledby="flow-heading">
    <div class="mb-7">
      <h2 id="flow-heading" class="font-mono text-2xl font-bold text-skin-base">
        Request and response flow
      </h2>
      <p class="mt-2 max-w-3xl text-sm leading-relaxed text-skin-muted">
        The ordered stages describe the production contract. Local development replaces the public
        edge with a same-origin SvelteKit proxy to the local Express service.
      </p>
    </div>

    <ol class="relative ml-3 border-l-2 border-skin-border sm:ml-5">
      {#each architectureStages as stage, index (stage.id)}
        <li class="relative pb-10 pl-8 last:pb-0 sm:pl-12">
          <span
            aria-hidden="true"
            class="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-skin-accent bg-skin-background font-mono text-sm font-bold text-skin-accent"
          >
            {index + 1}
          </span>
          <article
            aria-labelledby={`stage-${stage.id}`}
            class="rounded-lg border border-skin-border bg-skin-base/5 p-5 sm:p-6"
          >
            <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h3 id={`stage-${stage.id}`} class="text-xl font-bold leading-snug text-skin-base">
                {stage.title}
              </h3>
              <span
                class={`w-fit shrink-0 rounded border px-2 py-1 font-mono text-xs font-bold ${badgeClasses[stage.scope]}`}
              >
                {verificationLabels[stage.scope]}
              </span>
            </div>
            <p class="leading-relaxed text-skin-base">{stage.summary}</p>
            <p class="mt-3 font-mono text-xs text-skin-muted">
              <span class="font-bold text-skin-accent">Evidence:</span>
              {stage.evidence}
            </p>
            <ul class="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-skin-muted">
              {#each stage.details as detail}
                <li>{detail}</li>
              {/each}
            </ul>
          </article>
        </li>
      {/each}
    </ol>
  </section>

  <section aria-labelledby="privacy-heading" class="mt-14 grid gap-6 md:grid-cols-2">
    <div class="rounded-lg border border-skin-border p-5 sm:p-6">
      <h2 id="privacy-heading" class="mb-3 font-mono text-xl font-bold text-skin-base">
        Privacy boundary
      </h2>
      <p class="text-sm leading-relaxed text-skin-muted">
        A model-backed request sends the submitted message or job description to Cloud Run and
        Gemini. Chat history is browser-tab state and is supplied by the client; the server
        validates its shape and size but does not authenticate each historical turn. Do not submit
        secrets or confidential hiring material.
      </p>
    </div>

    <div class="rounded-lg border border-skin-border p-5 sm:p-6">
      <h2 class="mb-3 font-mono text-xl font-bold text-skin-base">What this trace cannot prove</h2>
      <p class="text-sm leading-relaxed text-skin-muted">
        A static repository review cannot confirm live Cloudflare routing, shared rate-limit rules,
        secret rotation, service health, analytics retention, or Gemini's runtime behavior. Those
        need deployment evidence and production checks; a successful response alone is not proof of
        every control.
      </p>
    </div>
  </section>

  <aside class="mt-10 border-t border-skin-border pt-8" aria-labelledby="next-heading">
    <h2 id="next-heading" class="font-mono text-lg font-bold text-skin-base">
      Inspect the evidence behind portfolio claims
    </h2>
    <p class="mt-2 max-w-3xl text-sm leading-relaxed text-skin-muted">
      The AI retrieves published portfolio content. Claims &amp; evidence shows how selected claims
      map back to their sources and distinguishes Brian's documentation from independent
      corroboration.
    </p>
    <a
      href="/proof/"
      class="mt-4 inline-flex rounded border border-skin-accent px-4 py-2 font-mono text-sm font-bold text-skin-accent transition-colors hover:bg-skin-accent hover:text-skin-inverse focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-skin-accent"
    >
      Open Claims &amp; evidence
    </a>
  </aside>
</article>

<script lang="ts">
  import { browser } from "$app/environment";
  import type { FitAnalysis } from "$lib/types";
  import { trackAiEvent } from "$lib/utils/analytics";
  import Modal from "./Modal.svelte";
  import { getApiBase } from "$lib/utils/apiBase";
  import { describeApiError } from "$lib/utils/apiError";

  const API_BASE = getApiBase();

  interface Props {
    visible: boolean;
    onClose: () => void;
  }

  let { visible, onClose }: Props = $props();

  let jobDescription = $state("");
  let analysis = $state<FitAnalysis | null>(null);
  let isAnalyzing = $state(false);
  let error = $state<string | null>(null);

  function getCurrentVariant(): "leader" | "ops" | "builder" {
    if (!browser) return "leader";

    if (window.location.pathname.startsWith("/ops")) return "ops";
    if (window.location.pathname.startsWith("/builder")) return "builder";

    return "leader";
  }

  async function handleAnalyze() {
    if (!jobDescription.trim()) return;

    isAnalyzing = true;
    error = null;

    trackAiEvent("fit_finder_analyzed", {});

    try {
      const response = await fetch(`${API_BASE}/fit-finder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          variant: getCurrentVariant()
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        error = describeApiError(response.status, data).message;
        return;
      }

      analysis = data.analysis;

      trackAiEvent("fit_finder_completed", {});
    } catch (err: unknown) {
      console.error("Fit finder error:", err);
      if (err instanceof Error) {
        error = err.message;
      } else {
        error = "Service temporarily unavailable. Please try again later.";
      }
    } finally {
      isAnalyzing = false;
    }
  }

  function handleClear() {
    jobDescription = "";
    analysis = null;
    error = null;
  }

  function handleCTAClick() {
    trackAiEvent("fit_finder_cta_clicked", {});
    // Close modal after click
    onClose();
  }

  function handleResumeClick() {
    trackAiEvent("fit_finder_resume_clicked", {});
    // Close modal after click
    onClose();
  }

  function getFitLevelConfig(fitLevel: string): {
    label: string;
    color: string;
    bgColor: string;
    panelColor: string;
    icon: string;
  } {
    const configs = {
      good: {
        label: "Good Fit",
        color: "text-skin-success",
        bgColor: "bg-skin-success",
        panelColor: "bg-skin-success/10 border-skin-success/30",
        icon: "✓"
      },
      maybe: {
        label: "May Be a Good Fit",
        color: "text-skin-warning",
        bgColor: "bg-skin-warning",
        panelColor: "bg-skin-warning/10 border-skin-warning/30",
        icon: "~"
      },
      not: {
        label: "Not a Strong Fit",
        color: "text-skin-error",
        bgColor: "bg-skin-error",
        panelColor: "bg-skin-error/10 border-skin-error/30",
        icon: "×"
      }
    };
    return configs[fitLevel as keyof typeof configs] || configs.maybe;
  }

  function getConfidenceBadge(confidence: string): { label: string; color: string } {
    const badges = {
      high: { label: "● High Confidence", color: "text-skin-success" },
      medium: { label: "● Medium Confidence", color: "text-skin-warning" },
      low: { label: "● Low Confidence", color: "text-skin-error" }
    };
    return (
      badges[confidence as keyof typeof badges] ?? {
        label: confidence,
        color: "text-terminal-text/70"
      }
    );
  }
</script>

<Modal
  {visible}
  {onClose}
  title="$ check-fit --analyze"
  labelledby="fit-finder-title"
  closeLabel="Close fit finder"
  testid="fit-finder"
  fill
>
  {#snippet actions()}
    {#if analysis}
      <button
        onclick={handleClear}
        class="rounded px-3 py-2 text-sm hover:bg-terminal-green/10 active:bg-terminal-green/20 transition-colors"
        title="Start over"
      >
        Clear
      </button>
    {/if}
  {/snippet}

  <div class="ph-no-capture ph-mask flex-1 min-h-0 flex flex-col" data-ai-private>
    {#if !analysis}
      <!-- Input: the textarea fills the sheet, Analyze stays pinned at the bottom -->
      <div class="flex-1 min-h-0 flex flex-col gap-4 p-6">
        <label for="job-description" class="shrink-0 block text-terminal-green text-sm font-mono">
          📄 Paste Job Description or Project Requirements
        </label>
        <textarea
          id="job-description"
          bind:value={jobDescription}
          placeholder="Paste the full job description here..."
          class="flex-1 min-h-0 w-full bg-terminal-dark border border-terminal-green/30 rounded px-3 py-2 text-terminal-text font-mono text-sm resize-none focus:outline-none focus:border-terminal-green placeholder:text-terminal-text/50"
          data-testid="jd-input"
        ></textarea>
        <div class="shrink-0 text-xs text-terminal-text/50">
          {jobDescription.length} characters
        </div>

        {#if error}
          <div
            class="shrink-0 p-3 bg-skin-error/10 border border-skin-error/30 rounded text-skin-error text-sm"
            role="alert"
          >
            ❌ {error}
          </div>
        {/if}

        <button
          onclick={handleAnalyze}
          disabled={isAnalyzing || !jobDescription.trim()}
          class="shrink-0 w-full bg-terminal-green/10 border-2 border-terminal-green rounded px-6 py-3 text-terminal-green font-mono font-semibold hover:bg-terminal-green/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="analyze-button"
        >
          {#if isAnalyzing}
            <span class="animate-pulse">Analyzing...</span>
          {:else}
            Analyze Fit
          {/if}
        </button>
      </div>
    {:else}
      <!-- Results: scrollable -->
      <div class="flex-1 min-h-0 overflow-y-auto space-y-6 p-6">
        <!-- Fit Level & Score -->
        <div class="p-4 border rounded {getFitLevelConfig(analysis.fitLevel).panelColor}">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="text-3xl {getFitLevelConfig(analysis.fitLevel).color}">
                {getFitLevelConfig(analysis.fitLevel).icon}
              </span>
              <h3 class="text-xl font-mono {getFitLevelConfig(analysis.fitLevel).color} font-bold">
                {getFitLevelConfig(analysis.fitLevel).label}
              </h3>
            </div>
            <span class="text-xs {getConfidenceBadge(analysis.confidence).color}"
              >{getConfidenceBadge(analysis.confidence).label}</span
            >
          </div>
          <div class="flex items-center gap-4">
            <div
              class="text-4xl font-bold {getFitLevelConfig(analysis.fitLevel).color}"
              data-testid="fit-score"
            >
              {analysis.fitScore}%
            </div>
            <div class="flex-1">
              <div class="h-3 bg-terminal-dark border border-skin-border rounded overflow-hidden">
                <div
                  class="h-full transition-all duration-500 {getFitLevelConfig(analysis.fitLevel)
                    .bgColor}"
                  style="width: {analysis.fitScore}%"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Matching Skills -->
        {#if analysis.matchingSkills.length > 0}
          <div
            class="p-4 bg-terminal-dark border border-terminal-green/20 rounded"
            data-testid="matching-skills"
          >
            <h3 class="text-lg font-mono text-skin-success mb-3">✓ Matching Skills</h3>
            <div class="space-y-2">
              {#each analysis.matchingSkills as skill}
                <div class="text-sm">
                  {#if skill.url}
                    <a href={skill.url} class="font-semibold text-skin-success hover:underline">
                      {skill.name} →
                    </a>
                  {:else}
                    <span class="font-semibold text-terminal-text">{skill.name}</span>
                  {/if}
                  {#if skill.context}
                    <div class="text-xs text-terminal-text/70 ml-4 mt-1">{skill.context}</div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Matching Experience -->
        {#if analysis.matchingExperience.length > 0}
          <div class="p-4 bg-terminal-dark border border-terminal-green/20 rounded">
            <h3 class="text-lg font-mono text-terminal-green mb-3">◆ Relevant Experience</h3>
            <div class="space-y-3">
              {#each analysis.matchingExperience as exp}
                <div class="p-3 bg-terminal-black border border-terminal-green/10 rounded">
                  <div class="font-semibold text-terminal-text">{exp.role}</div>
                  <div class="text-sm text-terminal-text/70">{exp.company} • {exp.dateRange}</div>
                  {#if exp.relevance}
                    <div class="text-sm text-terminal-text/80 mt-2">{exp.relevance}</div>
                  {/if}
                  {#if exp.url}
                    <div class="mt-2">
                      <a href={exp.url} class="text-sm text-terminal-green hover:underline">
                        View project details →
                      </a>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Analysis Narrative -->
        {#if analysis.analysis}
          <div class="p-4 bg-terminal-dark border border-terminal-green/20 rounded">
            <h3 class="text-lg font-mono text-terminal-green mb-3">◈ Analysis</h3>
            <div class="text-sm text-terminal-text/90 leading-relaxed space-y-3">
              {#each analysis.analysis.split("\n\n") as paragraph}
                <p>{paragraph}</p>
              {/each}
            </div>

            {#if analysis.resumeVariantRecommendation}
              <div class="mt-4 p-3 bg-terminal-green/10 border border-terminal-green/30 rounded">
                <p class="text-sm">
                  <strong class="text-terminal-green">→ Resume:</strong>
                  <a
                    href="/{analysis.resumeVariantRecommendation === 'leader'
                      ? ''
                      : analysis.resumeVariantRecommendation + '/'}resume/"
                    class="text-terminal-green hover:underline ml-1"
                    onclick={handleResumeClick}
                  >
                    Resume
                  </a>
                </p>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Gaps (if any) -->
        {#if analysis.gaps && analysis.gaps.length > 0}
          <div class="p-4 bg-terminal-dark border border-terminal-green/20 rounded">
            <h3 class="text-lg font-mono text-skin-warning mb-3">⚠ Areas Not Covered</h3>
            <ul class="space-y-1">
              {#each analysis.gaps as gap}
                <li class="text-sm text-terminal-text/80">• {gap}</li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- CTA - Adjusted by Fit Level -->
        {#if analysis.fitLevel === "good"}
          <div
            class="p-6 bg-skin-success/10 border-2 border-skin-success rounded text-center"
            data-testid="connect-cta"
          >
            <h3 class="text-xl font-mono text-skin-success mb-2">▸ Strong Match</h3>
            <p class="text-sm text-terminal-text/80 mb-4">
              Brian's experience aligns well with this opportunity. Let's connect to discuss how he
              can contribute.
            </p>
            <a
              href={analysis.cta.link}
              onclick={handleCTAClick}
              class="inline-block px-6 py-3 bg-skin-success text-skin-success-contrast font-mono font-bold rounded hover:opacity-90 transition-opacity"
            >
              {analysis.cta.text}
            </a>
          </div>
        {:else if analysis.fitLevel === "maybe"}
          <div
            class="p-6 bg-skin-warning/10 border border-skin-warning/30 rounded text-center"
            data-testid="connect-cta"
          >
            <h3 class="text-lg font-mono text-skin-warning mb-2">~ Worth Exploring</h3>
            <p class="text-sm text-terminal-text/70 mb-4">
              There's potential alignment here. A conversation could clarify if this is the right
              fit for both parties.
            </p>
            <a
              href={analysis.cta.link}
              onclick={handleCTAClick}
              class="inline-block px-5 py-2 border border-skin-warning text-skin-warning font-mono rounded hover:bg-skin-warning/10 transition-colors"
            >
              Discuss Opportunity
            </a>
          </div>
        {:else}
          <div class="p-4 bg-skin-error/5 border border-skin-error/30 rounded text-center">
            <p class="text-sm text-terminal-text/60 mb-3">
              Based on the requirements, this may not be the best match. If you'd still like to
              connect:
            </p>
            <a
              href={analysis.cta.link}
              onclick={handleCTAClick}
              class="text-sm text-skin-error hover:underline"
            >
              brian@briananderson.xyz
            </a>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</Modal>

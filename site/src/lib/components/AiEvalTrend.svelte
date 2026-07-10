<script lang="ts">
  import type { EvalRunSummary } from "$lib/schemas/aiEvalHistory";

  interface Props {
    runs: EvalRunSummary[];
  }

  let { runs }: Props = $props();

  const chronologicalRuns = $derived(
    [...runs].sort((a, b) => a.runDate.localeCompare(b.runDate) || a.runId.localeCompare(b.runId))
  );

  function percent(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`;
  }
</script>

<div class="space-y-8">
  <section aria-labelledby="eval-trend-heading">
    <h2 id="eval-trend-heading" class="font-mono text-xl font-bold text-skin-base mb-4">
      Aggregate pass-rate trend
    </h2>
    <ol class="space-y-3" aria-label="AI evaluation pass rates by run">
      {#each chronologicalRuns as run}
        <li class="grid gap-2 sm:grid-cols-[9rem_1fr_5rem] sm:items-center">
          <span class="font-mono text-sm text-skin-muted">{run.runDate}</span>
          <div class="h-3 overflow-hidden rounded-full bg-skin-border" aria-hidden="true">
            <div class="h-full bg-skin-accent" style:width={`${run.passRate * 100}%`}></div>
          </div>
          <span class="font-mono text-sm text-skin-base sm:text-right">{percent(run.passRate)}</span
          >
        </li>
      {/each}
    </ol>
  </section>

  <section aria-labelledby="eval-history-heading" class="overflow-x-auto">
    <h2 id="eval-history-heading" class="font-mono text-xl font-bold text-skin-base mb-4">
      Run history
    </h2>
    <table class="w-full min-w-[44rem] border-collapse text-left font-mono text-sm">
      <caption class="sr-only">
        Sanitized aggregate AI evaluation history with counts and pass rates
      </caption>
      <thead>
        <tr class="border-b border-skin-border text-skin-muted">
          <th class="p-3" scope="col">Date</th>
          <th class="p-3" scope="col">Environment</th>
          <th class="p-3" scope="col">Commit</th>
          <th class="p-3 text-right" scope="col">Passed</th>
          <th class="p-3 text-right" scope="col">Failed</th>
          <th class="p-3 text-right" scope="col">Skipped</th>
          <th class="p-3 text-right" scope="col">Pass rate</th>
        </tr>
      </thead>
      <tbody>
        {#each [...chronologicalRuns].reverse() as run}
          <tr class="border-b border-skin-border/60 text-skin-base">
            <td class="p-3">{run.runDate}</td>
            <td class="p-3">{run.environment}</td>
            <td class="p-3">{run.commit.slice(0, 7)}</td>
            <td class="p-3 text-right">{run.counts.passed}</td>
            <td class="p-3 text-right">{run.counts.failed}</td>
            <td class="p-3 text-right">{run.counts.skipped}</td>
            <td class="p-3 text-right">{percent(run.passRate)}</td>
          </tr>
          <tr class="border-b border-skin-border text-skin-muted">
            <td class="px-3 pb-3" colspan="7">
              <span class="sr-only">Suites and scenario identifiers: </span>
              {run.suites
                .map((suite) => `${suite.suiteId}: ${suite.scenarioIds.join(", ")}`)
                .join("; ")}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
</div>

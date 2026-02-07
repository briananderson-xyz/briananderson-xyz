<script lang="ts">
  import { getDuration } from '$lib/utils/date';
  import type { ResumeJob } from '$lib/types';
  import '$lib/components/ui/glowing-green.css';

  export let job: ResumeJob;
  export let compact = false;

  function isCurrentJob(job: ResumeJob): boolean {
    return !job.end_date;
  }
</script>

<div class="relative group experience-item-container {compact ? 'mb-3' : 'mb-6'}">
  <div class="absolute -left-[31px] top-1.5 w-3 h-3 bg-skin-page border border-skin-accent rounded-full {isCurrentJob(job) ? 'glowing-green' : ''}"></div>
  <div class="experience-item-content flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
    <div class="min-w-0 flex-1">
      <h3 class="experience-title text-base text-skin-base font-bold leading-snug">{job.role}</h3>
      <div class="text-skin-accent text-sm">@ {job.company}</div>
    </div>
    <div class="text-xs text-skin-muted whitespace-nowrap text-left sm:text-right shrink-0 mt-1 sm:mt-0.5">
      <div>{job.start_date} {job.end_date ? '- ' + job.end_date : ' - Present'} [{getDuration(job.start_date, job.end_date)}]</div>
    </div>
  </div>
  {#if job.description}
    <div class="mt-3 text-xs text-skin-muted font-mono">
      <p class="max-w-2xl leading-relaxed">
        {job.description}
      </p>
    </div>
  {/if}
</div>

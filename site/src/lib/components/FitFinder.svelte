<script lang="ts">
	import { browser } from '$app/environment';
	import type { FitAnalysis } from '$lib/types';
	import { trackEvent } from '$lib/utils/analytics';
	import Modal from './Modal.svelte';
	import { getApiBase } from '$lib/utils/apiBase';
	import { describeApiError } from '$lib/utils/apiError';

	const API_BASE = getApiBase();

	interface Props {
		visible: boolean;
		onClose: () => void;
	}

	let { visible, onClose }: Props = $props();

	let jobDescription = $state('');
	let analysis = $state<FitAnalysis | null>(null);
	let isAnalyzing = $state(false);
	let error = $state<string | null>(null);

	function getCurrentVariant(): 'leader' | 'ops' | 'builder' {
		if (!browser) return 'leader';

		if (window.location.pathname.startsWith('/ops')) return 'ops';
		if (window.location.pathname.startsWith('/builder')) return 'builder';

		return 'leader';
	}

	async function handleAnalyze() {
		if (!jobDescription.trim()) return;

		isAnalyzing = true;
		error = null;

		trackEvent('fit_finder_analyzed', {
			jdLength: jobDescription.length
		});

		try {
			const response = await fetch(`${API_BASE}/fit-finder`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
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

			trackEvent('fit_finder_completed', {
				fitScore: analysis?.fitScore,
				confidence: analysis?.confidence,
				recommendedVariant: analysis?.resumeVariantRecommendation
			});

		} catch (err: unknown) {
			console.error('Fit finder error:', err);
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'Service temporarily unavailable. Please try again later.';
			}
		} finally {
			isAnalyzing = false;
		}
	}

	function handleClear() {
		jobDescription = '';
		analysis = null;
		error = null;
	}

	function handleCTAClick() {
		if (analysis) {
			trackEvent('fit_finder_cta_clicked', {
				fitScore: analysis.fitScore,
				linkType: 'email'
			});
		}
		// Close modal after click
		onClose();
	}

	function handleResumeClick() {
		if (analysis) {
			trackEvent('fit_finder_resume_clicked', {
				fitScore: analysis.fitScore,
				variant: analysis.resumeVariantRecommendation
			});
		}
		// Close modal after click
		onClose();
	}

	function getFitLevelConfig(fitLevel: string): { label: string; color: string; bgColor: string; icon: string } {
		const configs = {
			good: {
				label: 'Good Fit',
				color: 'text-terminal-green',
				bgColor: 'bg-terminal-green',
				icon: '✓'
			},
			maybe: {
				label: 'May Be a Good Fit',
				color: 'text-yellow-500',
				bgColor: 'bg-yellow-500',
				icon: '~'
			},
			not: {
				label: 'Not a Strong Fit',
				color: 'text-red-500',
				bgColor: 'bg-red-500',
				icon: '×'
			}
		};
		return configs[fitLevel as keyof typeof configs] || configs.maybe;
	}

	function getConfidenceBadge(confidence: string): string {
		const badges = {
			high: '🟢 High Confidence',
			medium: '🟡 Medium Confidence',
			low: '🔴 Low Confidence'
		};
		return badges[confidence as keyof typeof badges] || confidence;
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
				<div class="shrink-0 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-500 text-sm">
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
						<div class="p-4 bg-terminal-dark border border-terminal-green/20 rounded">
							<div class="flex items-center justify-between mb-4">
								<div class="flex items-center gap-3">
									<span class="text-3xl {getFitLevelConfig(analysis.fitLevel).color}">
										{getFitLevelConfig(analysis.fitLevel).icon}
									</span>
									<h3 class="text-xl font-mono {getFitLevelConfig(analysis.fitLevel).color} font-bold">
										{getFitLevelConfig(analysis.fitLevel).label}
									</h3>
								</div>
								<span class="text-xs text-terminal-text/70">{getConfidenceBadge(analysis.confidence)}</span>
							</div>
							<div class="flex items-center gap-4">
								<div class="text-4xl font-bold {getFitLevelConfig(analysis.fitLevel).color}" data-testid="fit-score">
									{analysis.fitScore}%
								</div>
								<div class="flex-1">
									<div class="h-3 bg-terminal-dark border border-terminal-green/30 rounded overflow-hidden">
										<div
											class="h-full transition-all duration-500 {getFitLevelConfig(analysis.fitLevel).bgColor}"
											style="width: {analysis.fitScore}%"
										></div>
									</div>
								</div>
							</div>
						</div>

						<!-- Matching Skills -->
						{#if analysis.matchingSkills.length > 0}
							<div class="p-4 bg-terminal-dark border border-terminal-green/20 rounded" data-testid="matching-skills">
								<h3 class="text-lg font-mono text-terminal-green mb-3">✓ Matching Skills</h3>
								<div class="space-y-2">
									{#each analysis.matchingSkills as skill}
										<div class="text-sm">
											{#if skill.url}
												<a href={skill.url} class="font-semibold text-terminal-green hover:underline">
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
									{#each analysis.analysis.split('\n\n') as paragraph}
										<p>{paragraph}</p>
									{/each}
								</div>

								{#if analysis.resumeVariantRecommendation}
										<div class="mt-4 p-3 bg-terminal-green/10 border border-terminal-green/30 rounded">
											<p class="text-sm">
												<strong class="text-terminal-green">→ Resume:</strong>
												<a
													href="/{analysis.resumeVariantRecommendation === 'leader' ? '' : analysis.resumeVariantRecommendation + '/'}resume/"
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
								<h3 class="text-lg font-mono text-terminal-text/70 mb-3">⚠ Areas Not Covered</h3>
								<ul class="space-y-1">
									{#each analysis.gaps as gap}
										<li class="text-sm text-terminal-text/60">• {gap}</li>
									{/each}
								</ul>
							</div>
						{/if}

						<!-- CTA - Adjusted by Fit Level -->
						{#if analysis.fitLevel === 'good'}
							<div class="p-6 bg-terminal-green/10 border-2 border-terminal-green rounded text-center" data-testid="connect-cta">
								<h3 class="text-xl font-mono text-terminal-green mb-2">
									▸ Strong Match
								</h3>
								<p class="text-sm text-terminal-text/80 mb-4">
									Brian's experience aligns well with this opportunity. Let's connect to discuss how he can contribute.
								</p>
								<a
									href={analysis.cta.link}
									onclick={handleCTAClick}
									class="inline-block px-6 py-3 bg-terminal-green text-terminal-black font-mono font-bold rounded hover:bg-terminal-green/90 transition-colors"
								>
									{analysis.cta.text}
								</a>
							</div>
						{:else if analysis.fitLevel === 'maybe'}
							<div class="p-6 bg-terminal-dark border border-terminal-green/30 rounded text-center" data-testid="connect-cta">
								<h3 class="text-lg font-mono text-terminal-green/90 mb-2">
									~ Worth Exploring
								</h3>
								<p class="text-sm text-terminal-text/70 mb-4">
									There's potential alignment here. A conversation could clarify if this is the right fit for both parties.
								</p>
								<a
									href={analysis.cta.link}
									onclick={handleCTAClick}
									class="inline-block px-5 py-2 bg-terminal-dark border border-terminal-green text-terminal-green font-mono rounded hover:bg-terminal-green/10 transition-colors"
								>
									Discuss Opportunity
								</a>
							</div>
						{:else}
							<div class="p-4 bg-terminal-dark border border-terminal-green/20 rounded text-center">
								<p class="text-sm text-terminal-text/60 mb-3">
									Based on the requirements, this may not be the best match. If you'd still like to connect:
								</p>
								<a
									href={analysis.cta.link}
									onclick={handleCTAClick}
									class="text-sm text-terminal-green/70 hover:text-terminal-green hover:underline transition-colors"
								>
									brian@briananderson.xyz
								</a>
							</div>
						{/if}
					</div>
				{/if}
</Modal>

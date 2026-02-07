<script lang="ts">
	import { browser } from '$app/environment';
	import type { FitAnalysis } from '$lib/types';
	import posthog from 'posthog-js';
	import { PUBLIC_POSTHOG_KEY } from '$env/static/public';

	interface Props {
		visible: boolean;
		onClose: () => void;
	}

	let { visible, onClose }: Props = $props();

	let jobDescription = $state('');
	let analysis = $state<FitAnalysis | null>(null);
	let isAnalyzing = $state(false);
	let error = $state<string | null>(null);

	async function handleAnalyze() {
		if (!jobDescription.trim()) return;

		isAnalyzing = true;
		error = null;

		if (browser && PUBLIC_POSTHOG_KEY) {
			posthog.capture('fit_finder_analyzed', {
				jdLength: jobDescription.length
			});
		}

		try {
			const response = await fetch('/api/fit-finder', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jobDescription,
					variant: 'leader' // Could be dynamic based on current page
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.details || data.error || 'Failed to analyze job description');
			}

			analysis = data.analysis;

			if (browser && PUBLIC_POSTHOG_KEY) {
				posthog.capture('fit_finder_completed', {
					fitScore: analysis?.fitScore,
					confidence: analysis?.confidence,
					recommendedVariant: analysis?.resumeVariantRecommendation
				});
			}

		} catch (err) {
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
		if (browser && PUBLIC_POSTHOG_KEY && analysis) {
			posthog.capture('fit_finder_cta_clicked', {
				fitScore: analysis.fitScore,
				linkType: 'email'
			});
		}
		// Close modal after click
		onClose();
	}

	function handleResumeClick() {
		if (browser && PUBLIC_POSTHOG_KEY && analysis) {
			posthog.capture('fit_finder_resume_clicked', {
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

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	$effect(() => {
		if (visible && browser) {
			window.addEventListener('keydown', handleKeyDown);
			return () => window.removeEventListener('keydown', handleKeyDown);
		}
	});
</script>

{#if visible}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
		data-testid="fit-finder"
		role="dialog"
		aria-modal="true"
		aria-labelledby="fit-finder-title"
		tabindex="-1"
		onclick={handleBackdropClick}
		onkeydown={handleKeyDown}
	>
		<div class="bg-terminal-black border-2 border-terminal-green shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
			<div class="flex justify-between items-center px-4 py-2 bg-terminal-green/10 border-b-2 border-terminal-green font-mono text-terminal-green">
				<span id="fit-finder-title">$ check-fit --analyze</span>
				<div class="flex items-center gap-3">
					{#if analysis}
						<button
							onclick={handleClear}
							class="text-sm hover:text-terminal-green transition-colors"
							title="Start over"
						>
							Clear
						</button>
					{/if}
					<div class="flex items-center gap-1">
						<span class="text-xs text-terminal-green/70">Esc</span>
						<button
							onclick={onClose}
							class="text-2xl leading-none hover:text-terminal-green transition-colors cursor-pointer"
							aria-label="Close fit finder"
						>
							×
						</button>
					</div>
				</div>
			</div>

			<div class="flex-1 overflow-y-auto p-6 space-y-6">
				{#if !analysis}
					<!-- Input Section -->
					<div class="space-y-4">
						<div>
							<label for="job-description" class="block text-terminal-green text-sm font-mono mb-2">
								📄 Paste Job Description or Project Requirements
							</label>
							<textarea
								id="job-description"
								bind:value={jobDescription}
								placeholder="Paste the full job description here..."
								class="w-full bg-terminal-dark border border-terminal-green/30 rounded px-3 py-2 text-terminal-text font-mono text-sm resize-none focus:outline-none focus:border-terminal-green placeholder:text-terminal-text/50"
								rows="12"
								data-testid="jd-input"
							></textarea>
							<div class="text-xs text-terminal-text/50 mt-1">
								{jobDescription.length} characters
							</div>
						</div>

						{#if error}
							<div class="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-500 text-sm">
								❌ {error}
							</div>
						{/if}

						<button
							onclick={handleAnalyze}
							disabled={isAnalyzing || !jobDescription.trim()}
							class="w-full bg-terminal-green/10 border-2 border-terminal-green rounded px-6 py-3 text-terminal-green font-mono font-semibold hover:bg-terminal-green/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
					<!-- Results Section -->
					<div class="space-y-6">
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
											<strong class="text-terminal-green">→ View Full Resume:</strong>
											<a
												href="/{analysis.resumeVariantRecommendation === 'leader' ? '' : analysis.resumeVariantRecommendation + '/'}resume/"
												class="text-terminal-green hover:underline ml-1"
												onclick={handleResumeClick}
											>
												{analysis.resumeVariantRecommendation === 'leader' ? 'Leadership' : analysis.resumeVariantRecommendation === 'ops' ? 'Operations' : 'Builder'} Resume
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
			</div>
		</div>
	</div>
{/if}

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

			if (!response.ok) {
				throw new Error('Failed to analyze job description');
			}

			const data = await response.json();
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
			error = 'Failed to analyze job description. Please try again.';
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
	}

	function getScoreColor(score: number): string {
		if (score >= 80) return 'text-terminal-green';
		if (score >= 60) return 'text-yellow-500';
		return 'text-red-500';
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
		onclick={handleBackdropClick}
	>
		<div class="terminal-window max-w-4xl w-full max-h-[90vh] flex flex-col">
			<div class="terminal-header">
				<span id="fit-finder-title">FIT FINDER</span>
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
							class="terminal-close"
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
								class="job-input"
								rows="12"
								data-testid="jd-input"
							></textarea>
							<div class="text-xs text-terminal-text/50 mt-1">
								{jobDescription.length} characters
							</div>
						</div>

						{#if error}
							<div class="error-message">
								❌ {error}
							</div>
						{/if}

						<button
							onclick={handleAnalyze}
							disabled={isAnalyzing || !jobDescription.trim()}
							class="analyze-button"
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
						<!-- Fit Score -->
						<div class="result-card">
							<div class="flex items-center justify-between mb-4">
								<h3 class="text-lg font-mono text-terminal-green">📊 Fit Score</h3>
								<span class="text-xs text-terminal-text/70">{getConfidenceBadge(analysis.confidence)}</span>
							</div>
							<div class="flex items-center gap-4">
								<div class="text-5xl font-bold {getScoreColor(analysis.fitScore)}" data-testid="fit-score">
									{analysis.fitScore}%
								</div>
								<div class="flex-1">
									<div class="progress-bar">
										<div 
											class="progress-fill {getScoreColor(analysis.fitScore)}"
											style="width: {analysis.fitScore}%"
										></div>
									</div>
								</div>
							</div>
						</div>

						<!-- Matching Skills -->
						{#if analysis.matchingSkills.length > 0}
							<div class="result-card" data-testid="matching-skills">
								<h3 class="text-lg font-mono text-terminal-green mb-3">✅ Matching Skills</h3>
								<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
									{#each analysis.matchingSkills as skill}
										<div class="skill-item">
											<span class="font-semibold">{skill.name}</span>
											{#if skill.metadata}
												<span class="text-xs text-terminal-text/70 ml-2">• {skill.metadata}</span>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Matching Experience -->
						{#if analysis.matchingExperience.length > 0}
							<div class="result-card">
								<h3 class="text-lg font-mono text-terminal-green mb-3">💼 Relevant Experience</h3>
								<div class="space-y-3">
									{#each analysis.matchingExperience as exp}
										<div class="experience-item">
											<div class="font-semibold">{exp.role}</div>
											<div class="text-sm text-terminal-text/70">{exp.company} • {exp.dateRange}</div>
											{#if exp.relatedLinks && exp.relatedLinks.length > 0}
												<div class="mt-1">
													{#each exp.relatedLinks as link}
														<a href={link} class="text-xs text-terminal-green hover:underline">
															View project →
														</a>
													{/each}
												</div>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Gaps -->
						{#if analysis.gaps.length > 0}
							<div class="result-card">
								<h3 class="text-lg font-mono text-terminal-green mb-3">❌ Potential Gaps</h3>
								<ul class="space-y-1">
									{#each analysis.gaps as gap}
										<li class="text-sm text-terminal-text/70">• {gap}</li>
									{/each}
								</ul>
							</div>
						{/if}

						<!-- Recommendations -->
						{#if analysis.recommendations.length > 0}
							<div class="result-card">
								<h3 class="text-lg font-mono text-terminal-green mb-3">💡 Recommendations</h3>
								<div class="space-y-2">
									{#each analysis.recommendations as rec}
										<p class="text-sm text-terminal-text">{rec}</p>
									{/each}
								</div>
								
								{#if analysis.resumeVariantRecommendation}
									<div class="mt-4 p-3 bg-terminal-green/10 border border-terminal-green/30 rounded">
										<p class="text-sm">
											<strong>View Resume:</strong>
											<a 
												href="/{analysis.resumeVariantRecommendation === 'leader' ? '' : analysis.resumeVariantRecommendation + '/'}resume/"
												class="text-terminal-green hover:underline ml-1"
											>
												Check out my resume →
											</a>
										</p>
									</div>
								{/if}
							</div>
						{/if}

						<!-- CTA -->
						{#if analysis.fitScore >= 70 || analysis.confidence === 'high'}
							<div class="cta-card" data-testid="connect-cta">
								<h3 class="text-xl font-mono text-terminal-green mb-2">
									{analysis.fitScore >= 80 ? '🎯 Great Match!' : '👍 Good Fit'}
								</h3>
								<p class="text-sm text-terminal-text/70 mb-4">
									{analysis.fitScore >= 80 
										? "Brian's experience aligns strongly with this role. Let's connect!"
										: "There's solid alignment here. Let's discuss how Brian can contribute."}
								</p>
								<a
									href={analysis.cta.link}
									onclick={handleCTAClick}
									class="cta-button"
								>
									{analysis.cta.text}
								</a>
							</div>
						{:else}
							<div class="cta-card">
								<h3 class="text-lg font-mono text-terminal-text/70 mb-2">
									🤔 Not the Perfect Fit
								</h3>
								<p class="text-sm text-terminal-text/70 mb-4">
									While there are some gaps, Brian is always open to discussing opportunities. Feel free to reach out!
								</p>
								<a
									href={analysis.cta.link}
									onclick={handleCTAClick}
									class="cta-button-secondary"
								>
									{analysis.cta.text}
								</a>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.terminal-window {
		@apply bg-terminal-black border-2 border-terminal-green shadow-2xl;
	}

	.terminal-header {
		@apply flex justify-between items-center px-4 py-2 bg-terminal-green/10 border-b-2 border-terminal-green;
		@apply font-mono text-terminal-green;
	}

	.terminal-close {
		@apply text-2xl leading-none hover:text-terminal-green transition-colors cursor-pointer;
	}

	.job-input {
		@apply w-full bg-terminal-dark border border-terminal-green/30 rounded px-3 py-2;
		@apply text-terminal-text font-mono text-sm resize-none;
		@apply focus:outline-none focus:border-terminal-green;
		@apply placeholder:text-terminal-text/50;
	}

	.analyze-button {
		@apply w-full bg-terminal-green/10 border-2 border-terminal-green rounded px-6 py-3;
		@apply text-terminal-green font-mono font-semibold hover:bg-terminal-green/20 transition-colors;
		@apply disabled:opacity-50 disabled:cursor-not-allowed;
	}

	.error-message {
		@apply p-3 bg-red-500/10 border border-red-500/30 rounded text-red-500 text-sm;
	}

	.result-card {
		@apply p-4 bg-terminal-dark border border-terminal-green/20 rounded;
	}

	.progress-bar {
		@apply h-3 bg-terminal-dark border border-terminal-green/30 rounded overflow-hidden;
	}

	.progress-fill {
		@apply h-full transition-all duration-500;
	}

	.skill-item {
		@apply text-sm text-terminal-text;
	}

	.experience-item {
		@apply p-3 bg-terminal-black border border-terminal-green/10 rounded;
	}

	.cta-card {
		@apply p-6 bg-terminal-green/10 border-2 border-terminal-green rounded text-center;
	}

	.cta-button {
		@apply inline-block px-6 py-3 bg-terminal-green text-terminal-black font-mono font-bold rounded;
		@apply hover:bg-terminal-green/90 transition-colors;
	}

	.cta-button-secondary {
		@apply inline-block px-6 py-3 bg-terminal-dark border border-terminal-green text-terminal-green font-mono font-semibold rounded;
		@apply hover:bg-terminal-green/10 transition-colors;
	}
</style>

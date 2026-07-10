export type VerificationScope = "repo-verified" | "external-contract" | "runtime-dependent";

export interface ArchitectureStage {
  id: string;
  title: string;
  summary: string;
  scope: VerificationScope;
  evidence: string;
  details: readonly string[];
}

export const verificationLabels: Record<VerificationScope, string> = {
  "repo-verified": "Verified in this repository",
  "external-contract": "External contract",
  "runtime-dependent": "Runtime-dependent"
};

/**
 * A deliberately small, reviewable representation of the production AI path.
 * Keep this aligned with apiBase.ts, functions/src/app.ts, rateLimit.ts,
 * handlers.ts, security.ts, and ChatMessage.svelte.
 */
export const architectureStages: readonly ArchitectureStage[] = [
  {
    id: "browser",
    title: "Browser client prepares the request",
    summary:
      "Chat sends the current message once alongside bounded prior history. Fit Finder sends the selected resume variant and job description.",
    scope: "repo-verified",
    evidence: "Client request builders and API-base selection",
    details: [
      "Local development uses the SvelteKit /api proxy; deployed clients target the configured API hostname.",
      "Chat history is kept in sessionStorage for the current browser tab, not a server-side authenticated session."
    ]
  },
  {
    id: "edge",
    title: "Cloudflare Worker is the public edge contract",
    summary:
      "The production design expects the API hostname to route through Cloudflare before a request reaches Cloud Run.",
    scope: "external-contract",
    evidence: "Repository-owned origin and edge-policy contracts",
    details: [
      "The repository defines the headers and shared-rate-limit policy that should be activated at the edge.",
      "Cloudflare Worker code, live routing, deployed rules, and a global rate-limit result are not proven by this page or the static build."
    ]
  },
  {
    id: "origin",
    title: "Cloud Run verifies origin, then limits the instance",
    summary:
      "Express checks the Worker-to-origin token before trusting Cloudflare's client-IP header or applying the API limiter.",
    scope: "repo-verified",
    evidence: "functions/src/app.ts, security.ts, and rateLimit.ts",
    details: [
      "Production fails closed when the origin token is missing or invalid.",
      "The in-memory limiter is per Cloud Run instance. A shared edge limiter is required for service-wide enforcement."
    ]
  },
  {
    id: "retrieve",
    title: "Handlers validate input and retrieve evidence",
    summary:
      "The API enforces methods, byte limits, variants, history shape, and guardrails, then loads the versioned content index and exposes narrow content tools.",
    scope: "repo-verified",
    evidence: "functions/src/handlers.ts, security.ts, and tools.ts",
    details: [
      "The index is built from published portfolio, project, blog, skill, and resume content.",
      "Tool retrieval narrows the evidence available to the model; it does not independently prove that the underlying portfolio claims are true."
    ]
  },
  {
    id: "answer",
    title: "A deterministic path or Gemini produces the answer",
    summary:
      "Some supported chat questions are answered deterministically from indexed evidence. Other chat and Fit Finder requests use Gemini 2.5 Flash with function calling.",
    scope: "runtime-dependent",
    evidence: "Deterministic responders and Gemini tool loops in handlers.ts",
    details: [
      "The model can request content tools and receive their structured results before completing an answer.",
      "Model availability, chosen tool calls, output quality, and the exact production response vary at runtime."
    ]
  },
  {
    id: "return",
    title: "The response is constrained before display",
    summary:
      "The server normalizes answer data and allowlists Fit Finder CTA links. Chat markdown is converted to HTML and sanitized in the browser before rendering.",
    scope: "repo-verified",
    evidence: "security.ts, handlers.ts, sanitize.ts, and ChatMessage.svelte",
    details: [
      "Disallowed model-controlled CTA links fall back to a repository-owned CTA.",
      "Sanitization reduces HTML injection risk; it is not a guarantee that an answer is factually correct, complete, or free of bias."
    ]
  }
];

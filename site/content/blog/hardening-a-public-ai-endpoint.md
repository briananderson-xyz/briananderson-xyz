---
title: Hardening a public AI endpoint
date: 2026-07-09
updated: 2026-07-12
projectDate: 2026-07-01
summary: "A public AI feature is an untrusted-input API with a variable bill attached. Here is the defense-in-depth contract behind this site's Chat, Fit Finder, and MCP endpoints, including what remains external or imperfect."
tags: ["AgenticAI", "Security", "CloudRun", "Cloudflare", "GCP", "Builder"]
keywords:
  [
    "public-ai-security",
    "origin-verification",
    "rate-limiting",
    "kill-switch",
    "input-caps",
    "posthog-privacy"
  ]
showTableOfContents: true
links:
  - label: "Trace the request path"
    url: "/trace-one-answer/"
    type: "article"
  - label: "Inspect the public evidence"
    url: "/proof/"
    type: "docs"
  - label: "Ask through MCP"
    url: "https://api.briananderson.xyz/mcp"
    type: "live"
---

Putting an AI demo on the public internet changes the problem.

Locally, the interesting question is whether the model can answer. Publicly, every request is untrusted input, every model call has a variable cost, every generated link can reach a browser, and every analytics tool is a potential copy of text the user did not mean to publish.

Chat, Fit Finder, and the [MCP interface](/blog/portfolio-as-an-mcp-server/) share one Express implementation and container image. Chat and Fit Finder deploy as separate Cloud Run services. The code exposes `/mcp` in that shared image, but the live Worker's choice of service for that path is external configuration and is not proven by this repository. None of the controls is remarkable on its own. The useful part is the order in which they compose, and being honest about what they do not cover.

## Start at the edge, but do not confuse a contract with proof

The intended public request path is:

**browser or MCP client → Cloudflare → Cloud Run → content tools → Gemini → sanitized client rendering**

Cloudflare is the external contract for the public hostname. The repository contains the desired security-header policy and a shared rate-limit policy. It can generate the provider rule payloads and validate those artifacts locally.

That still does not prove the live Cloudflare account is configured. Provider activation, ruleset ordering, and the exact production response are external state. Until the deployed headers and rules are checked against the provider, the correct status is `NOT_VERIFIED`, not “secure because Terraform or JSON says so.”

This sounds pedantic until configuration drifts. Then it is the difference between evidence and intent.

## Authenticate the proxy before trusting proxy identity

The Cloud Run service is reachable as an unauthenticated HTTP service so the Cloudflare Worker can call it. The application therefore enforces its own Worker-to-origin token on every POST route.

In production, a missing token fails closed. A supplied token is compared with a timing-safe operation. The service marks the request as origin-verified only after that check succeeds.

That ordering protects the next layer. `cf-connecting-ip` is useful only if it came from the trusted proxy. Before origin verification, it is just another attacker-controlled header. After verification, it can be normalized into the limiter key. Otherwise the service falls back to Express's proxy-derived address with a deliberately narrow one-hop trust setting.

CORS is not authentication here. The allowlist keeps normal browsers on the intended origins, but a script can send HTTP without respecting CORS. The origin token is what separates the Worker path from a direct POST to Cloud Run.

## Rate limiting is two controls, with one important gap

The desired edge policy shares a counter across `/chat`, `/fit-finder`, and `/mcp`: 20 POST requests per 15 minutes for a Cloudflare colo/client-IP key, followed by a 15-minute block. That is the service-wide control because it sits before Cloud Run fans out.

Express adds defense in depth. Its window and request count are configurable with bounded integers and default to the same 20 requests per 15 minutes. IPv4 and IPv6 identities go through the rate-limit library's normalizer, including IPv6 subnet grouping.

But the Express store is process memory. Multiple instances hold independent counters, and a restart forgets them. It is not a global quota and should never be described as one. If the shared edge rule is absent or misconfigured, the per-instance limiter reduces abuse but does not close the gap.

For a larger service, I would move durable quota and abuse signals into a shared edge or store. For this one, I keep the limitation explicit and make live edge activation part of operational verification.

## Bound work before calling the model

The cheapest malicious request is the one rejected before inference.

The Express JSON parser caps the entire body at 64 KB. The handlers then apply tighter byte limits to the fields that matter:

- Chat message: 2,048 bytes.
- Fit Finder job description: 20,480 bytes.
- Chat history: at most 10 entries, each at most 2,048 bytes.
- Resume variant: exactly `leader`, `ops`, or `builder`.

The history validator checks shape and roles, and each message passes the same basic guardrail checks. But a client-provided `model` or `assistant` label is not proof of authorship. The API therefore converts no client history into Gemini `model` turns. It serializes prior entries as bounded, delimiter-neutralized, explicitly untrusted quotations inside the current user turn, with the actual request in a separate envelope.

That change removes a false trust boundary; it does not make prompt injection a solved problem. Pattern guardrails still catch only known phrases, quoted context can still influence a model, and grounded tools plus output checks remain necessary defense in depth.

The model tool loops are bounded too. Chat and Fit Finder cannot call tools forever. Limiting request bytes and iteration counts contains both accidental and adversarial work, even when the request passes semantic checks.

## Keep a kill switch close to the handler

When `AI_ENABLED=false`, Chat and Fit Finder return a structured `503` before making a Gemini call. That is intentionally simpler than redeploying code under pressure.

The switch defaults to enabled. That avoids silently hiding the feature because of a misspelled variable, but it also means operators have to set `false` deliberately when they need the brake. A kill switch is only useful if the people carrying the pager know the exact command, response, and recovery path.

The MCP tools that invoke Chat or Fit Finder reuse those handlers, so they inherit the same brake instead of creating a second, forgotten model path.

## Treat model-controlled links as hostile output

Fit Finder returns a call to action with text and a link. That link is model-controlled data heading toward an anchor tag, so the server validates it before returning the analysis.

Single-slash relative links must resolve back to this site's origin. Absolute links must use HTTPS or `mailto:`. Protocol-relative URLs, backslashes, control characters, surrounding whitespace, unparseable values, and dangerous schemes are rejected. An invalid model result is replaced with a known fallback CTA.

This is scheme and origin-shape validation, not an endorsement of every HTTPS destination a model might name. The client still renders assistant Markdown through DOMPurify before inserting HTML. Output safety needs both a structured boundary for known fields and sanitization at the rendering boundary.

## Do not send private AI text to analytics

A pasted job description may contain a company name, compensation, or details from a role that is not public. A chat prompt may contain whatever the visitor decides to type. Session replay and DOM autocapture are the wrong defaults for those surfaces.

The local PostHog configuration disables autocapture, rage-click capture, automatic exception capture, and session recording, and masks all text, attributes, and inputs as defense in depth. Chat and Fit Finder are also marked with no-capture and masking classes. Explicit AI analytics record event names only. Their privacy boundary drops every property, including request lengths, URLs, variants, fit scores, confidence, recommendations, prompts, responses, analysis, and job-description text.

That is what the repository enforces. PostHog project retention and any remote settings are provider state, so they still need separate review. Client-side privacy controls narrow what this app sends; they do not certify an external account.

## The defense is the composition

The path now reads like this:

1. Cloudflare applies the externally activated edge contract.
2. Cloud Run verifies the Worker token before trusting the client-IP header.
3. Edge and per-instance limits bound request frequency at different scopes.
4. Body, field, history, variant, and tool-loop caps bound the work per request.
5. Guardrails reject known off-topic and extraction patterns without pretending to solve injection generally.
6. A kill switch stops model calls at the handler.
7. CTA validation and HTML sanitization constrain generated output before browser use.
8. Analytics controls keep user/model text out of intentional telemetry.

There is no single “AI security” middleware in that list. There is a sequence of small controls, each protecting the assumptions of the next one.

That is the pattern I trust: make the public contract explicit, test the deterministic boundaries hard, label external state as external, and never let a fluent model response erase the fact that this is still an internet-facing API.

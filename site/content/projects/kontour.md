---
title: "Kontour AI: Show the work behind AI"
date: 2026-04-24
period: "2026 – Present"
summary: "The company I started to make AI-assisted work inspectable. A suite of small, open, local-first tools that capture what an agent claimed, what evidence backs it, which gates it passed, and what is still uncertain, so people and systems can decide what to trust before acting on it."
tags: ["AgenticAI", "DataProvenance", "DeveloperTooling", "Trust", "Builder", "OpenSource"]
keywords: ["kontour", "kontourai", "show-the-work", "trust", "provenance", "evals", "verification", "agent-tooling", "open-trust-format"]
showTableOfContents: true
links:
  - label: "kontourai.io"
    url: "https://kontourai.io"
    type: "website"
  - label: "GitHub (kontourai)"
    url: "https://github.com/kontourai"
    type: "github"
---

## The Problem

AI can make any output look finished. An agent writes the code, runs the process, produces the report, and it all reads as done. What it cannot do on its own is tell you what was actually verified, what is resting on a guess, and what quietly went stale an hour ago. The output arrives faster than any human can inspect it, and confidence gets manufactured whether or not the work earned it.

I kept running into this same wall on every project I built. So I started Kontour AI to fix it as a product instead of solving it over and over by hand.

## The Idea

Kontour AI makes AI-assisted work inspectable. The tagline is the whole thesis: **show the work behind AI.** Not certainty theater, evidence-backed confidence.

The core move is to capture, in plain local files, four things about any piece of work: what was **claimed**, what **evidence** supports it, which **gates** it passed, and what is still **uncertain** (stale, disputed, or missing). Once that trust state exists as portable data, a person, another agent, or a downstream system can decide what deserves trust before acting on it, instead of after something breaks.

Everything is built on one shared trust format, so the pieces interoperate through data rather than lock-in. It is local-first and file-backed, with open schemas and MCP servers so agents can read and write the same trust state a human sees.

## What I'm Building

Kontour is a suite of small, standalone, mostly open-source tools under the `@kontourai/*` npm scope. Each does one job, and they compose:

- **Surface** is the foundation: a portable trust-state format and kernel that turns claims, evidence, and policies into a derived status (verified, stale, disputed, missing). It is the shared transparency layer any product can build on.
- **Survey** is the producer side of provenance. It carries evidence from raw source through extraction, candidate, and review into a claim, and ships a review workbench for the human-in-the-loop step. It deliberately does not decide truth. It preserves the chain so something downstream can.
- **Flow** makes a process transparent: the required path, what evidence each gate expected, what was collected, and which exceptions a human accepted. Proof, not promises.
- **Veritas** brings the same idea to code, turning a repo's standards into an executable merge-readiness report so teams can earn autonomy for AI-authored changes.
- **Flow Agents** distributes that discipline into the tools where agents actually run, installing a consistent build-and-verify workflow and policy guardrails.
- **Console** is the local-first operating plane that reads across all of it: claim status, process state, proof, and next actions in one place.

Underneath the headline products sit a few foundational libraries: an extraction proposer that enforces verbatim provenance on everything it pulls, a freshness scheduler that re-checks trust when it goes stale, and a shared design-system layer for the console UIs.

## Why It Matters

This is the platform version of a conviction that shows up in everything else I build. [CampFit](/projects/campfit/) uses the same trust machinery to decide which crawled camp data is safe to show a parent. My [tax workspace](/blog/taxes-verify-every-number/) uses it to refuse to trust a number until it is verified. Those projects are not just adjacent to Kontour, they run on it, consuming `@kontourai/survey` and `@kontourai/surface` directly.

I wrote more about the thinking behind all of this in [don't trust your agents, make them prove it](/blog/make-agents-prove-their-facts/). Kontour is what happens when you take that idea seriously enough to turn it into infrastructure.

## Status

Kontour AI is early, and I am building it in public. The core packages are published and open source under Apache-2.0 on npm, the site is live, and I am having design-partner conversations rather than chasing a splashy launch. It is early infrastructure for a problem that is only going to get bigger as more of the work around us is done by agents nobody had time to check.

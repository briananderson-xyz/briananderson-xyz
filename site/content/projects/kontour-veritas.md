---
title: "Veritas: Evidence-Backed Merge Readiness"
date: 2026-04-19
updated: 2026-06-30
period: "2026 – Present"
summary: "A repo-local governance tool that turns engineering standards into executable requirements, just-in-time guidance, and inspectable merge-readiness reports."
tags:
  [
    "AgenticAI",
    "DeveloperTooling",
    "CodeGovernance",
    "SoftwareQuality",
    "TypeScript",
    "Builder",
    "Ops",
    "OpenSource"
  ]
keywords:
  [
    "kontour-veritas",
    "merge-readiness",
    "repo-standards",
    "code-governance",
    "ai-authored-code",
    "attestation",
    "surface"
  ]
outcome: "Software quality"
projectType: "Open-source tool"
showTableOfContents: true
links:
  - label: "GitHub Repository"
    url: "https://github.com/kontourai/veritas"
    type: "github"
  - label: "Published Documentation"
    url: "https://kontourai.github.io/veritas/"
    type: "docs"
  - label: "Kontour AI Suite"
    url: "/projects/kontour/"
    type: "case-study"
---

## The Problem

Repositories contain standards that are obvious to maintainers but invisible to an agent: which tests must accompany an API change, which areas need coordination, who may approve an exception, and when old evidence no longer applies. If those rules live only in review habits, every AI-authored change makes a human rediscover them from the diff.

## What I Built

Veritas turns repository expectations into executable, inspectable merge readiness.

- Repo Standards that express requirements for tests, documentation, protected files, security checks, shared contracts, and team-specific rules.
- A Repo Map for work areas, dependencies, ownership context, protected areas, and boundary crossings.
- Change guidance that gives developers and agents relevant rules while they work.
- Readiness reports that classify evidence as satisfied, missing, stale, failing, advisory, recheckable, or accepted by exception.
- Authority-backed attestations and exceptions for changes to protected standards or unmet requirements.
- Evidence-driven feedback and recommendations for improving standards that have become noisy or incomplete.

## Architecture and Decisions

`veritas readiness` evaluates a concrete change against repo-local standards. The output is more than a pass/fail total: it explains coverage, evidence freshness, boundary crossings, recheck options, and the authority behind exceptions. Bootstrap standards can be protected with an explicit human attestation rather than allowing the tool to approve its own governance.

Veritas is built with [Surface](/projects/kontour-surface/), projecting readiness evidence into a portable trust shape. That allows [Flow](/projects/kontour-flow/) gates and MCP-connected agents to inspect readiness without importing the Veritas runtime.

## Status and Outcomes

Veritas is an active Apache-2.0 package published as `@kontourai/veritas`. Its public repository includes the CLI, JSON schemas, example repo-standard templates, architecture documentation, and tests. It supports local governance today; it does not claim to eliminate human review for every change.

## What It Demonstrates

Veritas demonstrates how to earn more automation safely: encode the repository's actual standards, bind decisions to fresh evidence, and reserve protected governance changes for an identifiable authority.

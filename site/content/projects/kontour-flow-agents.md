---
title: "Flow Agents: Portable Discipline for Agentic Work"
date: 2026-06-08
updated: 2026-07-08
period: "2026 – Present"
summary: "A portable workflow and policy layer that brings durable state, evidence gates, verification, and feedback loops into multiple coding-agent runtimes."
tags:
  [
    "AgenticAI",
    "DeveloperProductivity",
    "WorkflowAutomation",
    "Evals",
    "Governance",
    "TypeScript",
    "Builder",
    "Ops",
    "OpenSource"
  ]
keywords:
  [
    "flow-agents",
    "coding-agents",
    "agent-hooks",
    "builder-kit",
    "evidence-gate",
    "claude-code",
    "codex",
    "kiro",
    "workflow-sidecar"
  ]
outcome: "Developer productivity"
projectType: "Developer platform"
showTableOfContents: true
links:
  - label: "GitHub Repository"
    url: "https://github.com/kontourai/flow-agents"
    type: "github"
  - label: "Published Documentation"
    url: "https://kontourai.github.io/flow-agents/"
    type: "docs"
  - label: "Kontour AI Suite"
    url: "/projects/kontour/"
    type: "case-study"
---

## The Problem

Coding agents can plan carefully and still drift as a task grows. They lose state after compaction, skip verification under time pressure, and report completion from their own confidence. The host tools expose different hook surfaces, so teams often rebuild the same guardrails for every runtime.

## What I Built

Flow Agents is a portable process-discipline layer that compiles shared workflow and policy ideas into the agent tools where work happens.

- One delivery path from idea and backlog through planning, implementation, review, verification, release readiness, and learning.
- Durable, schema-validated sidecars under `.kontourai/flow-agents/` so a session can resume from recorded artifacts.
- Canonical policy classes for workflow steering, post-edit quality checks, stop-goal-fit checks, and protection of lint or formatter configuration.
- Installers and adapters for Claude Code, Codex, Kiro, opencode, and pi, plus a documented preview adapter for AWS Strands.
- Builder and Knowledge Flow Kits that package workflows, output contracts, skills, adapters, and evaluation assets.
- Integration and static evaluation lanes that exercise the generated bundles and runtime contracts.

## Architecture and Decisions

[Flow](/projects/kontour-flow/) owns gate and transition semantics; Flow Agents owns distribution into agent runtimes. [Veritas](/projects/kontour-veritas/) remains an optional source of repository-governance evidence. That boundary keeps the package from becoming a new model, coding agent, or workflow engine.

The runtime-neutral hook vocabulary separates intent from host wiring. Runtimes with a complete hook surface can enforce all policy classes; partial adapters publish their gaps instead of claiming equivalent enforcement. Telemetry defaults to local files and can be directed to a local, hosted, or self-hosted [Console](/projects/kontour-console/).

## Status and Outcomes

Flow Agents is public under Apache-2.0 as `@kontourai/flow-agents`. Full and partial runtime support is documented separately, framework integration remains preview work, and future kit distribution ideas are described as direction rather than shipped product.

## What It Demonstrates

This project demonstrates the engineering behind reliable agent use: durable continuation, explicit policy boundaries, cross-runtime adapters, eval-driven packaging, and a feedback loop that treats “done” as an evidence question rather than a writing style.

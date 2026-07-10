---
title: "Flow: Evidence-Gated Process Transparency"
date: 2026-05-24
updated: 2026-06-28
period: "2026 – Present"
summary: "A local-first workflow engine that records required steps, gate expectations, collected evidence, route-backs, and human-accepted exceptions."
tags:
  [
    "AgenticAI",
    "WorkflowAutomation",
    "DeveloperTooling",
    "Governance",
    "TypeScript",
    "Builder",
    "Ops",
    "OpenSource"
  ]
keywords:
  [
    "kontour-flow",
    "evidence-gates",
    "workflow-engine",
    "route-back",
    "agent-workflows",
    "process-transparency",
    "local-first"
  ]
outcome: "Process reliability"
projectType: "Open-source tool"
showTableOfContents: true
links:
  - label: "GitHub Repository"
    url: "https://github.com/kontourai/flow"
    type: "github"
  - label: "Published Documentation"
    url: "https://kontourai.github.io/flow/"
    type: "docs"
  - label: "Kontour AI Suite"
    url: "/projects/kontour/"
    type: "case-study"
---

## The Problem

Agentic work can lose its process history between sessions. An agent may skip a required step, call partial verification complete, or forget why work was routed back after its context is compacted. CI can say whether a check passed, but it does not usually preserve the full decision record for why the work was allowed to advance.

## What I Built

Flow is the process-transparency layer in [Kontour AI](/projects/kontour/). It records the required path, what evidence each gate expected, what was collected, and which exceptions a human explicitly accepted.

- JSON Flow Definitions for steps, typed gate expectations, transitions, and route-back policy.
- File-backed runs with authoritative state, copied evidence, and both human- and machine-readable reports.
- Deterministic route-back behavior for implementation defects, plan gaps, and other classified failures, including attempt budgets.
- Explicit, attributable exceptions rather than silent bypasses.
- A CLI, TypeScript library, and local console for starting, evaluating, reporting, and resuming runs.

## Architecture and Decisions

Every run lives in plain local files under `.kontourai/flow/runs/`, so a new session or CI job can resume from recorded state rather than chat memory. Evidence is attached as an artifact; Flow does not synthesize proof. Evaluating a gate can advance, wait, block, or route work back, and every transition is represented in the regenerated report.

Flow stands alone and does not run the agent or replace CI. When composed with the rest of the suite, [Veritas](/projects/kontour-veritas/) can supply repository-readiness evidence and [Flow Agents](/projects/kontour-flow-agents/) can enforce the same gates inside agent runtimes.

## Status and Outcomes

Flow is published under Apache-2.0 as `@kontourai/flow`. The public package ships the CLI, typed library, local console, schemas, examples, and documentation for evidence, route-back, release readiness, and continuation.

## What It Demonstrates

Flow demonstrates process design for systems that move faster than a person can continuously supervise: persist state, make evidence expectations explicit, route failures deterministically, and record the authority behind exceptions.

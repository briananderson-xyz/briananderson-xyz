---
title: "Survey: The Producer Side of Trust"
date: 2026-05-31
updated: 2026-07-06
period: "2026 – Present"
summary: "Portable records and a human review workbench that preserve the chain from raw source through extraction and candidate review to a claim."
tags:
  [
    "AgenticAI",
    "DataProvenance",
    "HumanInTheLoop",
    "DeveloperTooling",
    "TypeScript",
    "Builder",
    "OpenSource"
  ]
keywords:
  [
    "kontour-survey",
    "source-provenance",
    "extraction",
    "candidate-review",
    "review-workbench",
    "human-in-the-loop",
    "surface"
  ]
outcome: "Data provenance"
projectType: "Open-source tool"
showTableOfContents: true
links:
  - label: "GitHub Repository"
    url: "https://github.com/kontourai/survey"
    type: "github"
  - label: "Published Documentation"
    url: "https://kontourai.github.io/survey/"
    type: "docs"
  - label: "Kontour AI Suite"
    url: "/projects/kontour/"
    type: "case-study"
---

## The Problem

A data product often keeps the approved value and discards the story behind it: where the value was observed, what an extractor read, which alternatives existed, who reviewed the change, and why they accepted or rejected it. Once that chain disappears, a later reviewer cannot reconstruct what “verified” meant.

## What I Built

Survey preserves the producer side of that story as portable records: **source → extraction → candidate → review → claim**.

- Typed contracts for raw sources, observations, extractions, candidates, review outcomes, repeated observations, resolutions, and review proof.
- A projection that turns Survey records into a [Surface](/projects/kontour-surface/) trust bundle without taking ownership of Surface's trust derivation.
- A framework-neutral Review Workbench for comparing current and proposed values alongside excerpts and source references.
- A loopback review console and MCP tools for reading the queue, inspecting an item, and recording a decision.
- A server-owned apply boundary that derives writes from persisted events and pre-decision snapshots instead of trusting browser-computed results.

## Architecture and Decisions

Survey deliberately does not decide whether a real-world value is true. The producer still owns acquisition, parsing, ranking, review policy, and operational queues. Survey owns the durable evidence-chain shape that makes those choices inspectable downstream.

The workbench can run as a web component or mount into an existing application. Review events are persisted before apply results are derived, with freshness and replay checks at the server boundary. High-stakes workflows can also retain adversarial review passes as evidence for [Flow](/projects/kontour-flow/) route-back decisions.

## Status and Outcomes

Survey is an active Apache-2.0 package published as `@kontourai/survey`. The public repository includes its record contracts, Surface projection, review workbench, review console, MCP server, examples, and integration guidance. [CampFit](/projects/campfit/) is the clearest product context for why this kind of field-level review chain matters.

## What It Demonstrates

Survey demonstrates a reusable human-in-the-loop boundary: keep AI extraction useful, keep human decisions authoritative, and preserve enough provenance for the next person or system to inspect the decision rather than inherit a bare value.

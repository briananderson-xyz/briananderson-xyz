---
title: "Surface: Portable Trust State"
date: 2026-04-24
updated: 2026-07-03
period: "2026 – Present"
summary: "An open, local-first foundation for connecting claims to evidence and deriving inspectable trust states such as verified, stale, disputed, and missing."
tags:
  [
    "AgenticAI",
    "DataProvenance",
    "DeveloperTooling",
    "Trust",
    "TypeScript",
    "Builder",
    "OpenSource"
  ]
keywords:
  [
    "kontour-surface",
    "trust-state",
    "claims",
    "evidence",
    "provenance",
    "freshness",
    "open-trust-format",
    "mcp"
  ]
outcome: "AI trust"
projectType: "Open-source tool"
showTableOfContents: true
links:
  - label: "GitHub Repository"
    url: "https://github.com/kontourai/surface"
    type: "github"
  - label: "Published Documentation"
    url: "https://kontourai.github.io/surface/"
    type: "docs"
  - label: "Kontour AI Suite"
    url: "/projects/kontour/"
    type: "case-study"
---

## The Problem

Most software can display a green badge. Far fewer systems can explain which claim the badge refers to, what evidence supports it, whether that evidence still matches the current thing, or where sources disagree. AI makes that gap more dangerous because polished output can arrive long before anyone has inspected how it was produced.

## What I Built

Surface is the shared transparency foundation for [Kontour AI](/projects/kontour/). It defines portable records for claims, evidence, policies, and events, then derives an inspectable status: verified, stale, disputed, missing, or another explicit gap rather than a vague confidence score.

- A TypeScript SDK and JSON schemas for producing and validating trust bundles.
- A derivation kernel that connects verification events and required evidence to the current integrity reference.
- Human-readable and JSON reports, plus commands for finding stale or unsupported claims.
- A local console, an embeddable trust panel, and an MCP server so people, products, and agents can inspect the same state.
- Merge support for multiple producers that reports collisions instead of silently dropping conflicting content.

## Architecture and Decisions

The important boundary is that Surface does not collect domain evidence or declare universal truth. A producer decides what it observed and how it reviewed that observation. Surface preserves the resulting chain, applies explicit policy, and makes gaps visible. Producers can adopt the format without a hosted account, and the dependency direction stays one-way: products depend on Surface; Surface does not depend on their runtimes.

That separation lets [Survey](/projects/kontour-survey/) project reviewed observations into Surface, [Veritas](/projects/kontour-veritas/) express repository readiness as claims, and [Flow](/projects/kontour-flow/) consume Surface-shaped evidence at process gates.

## Status and Outcomes

Surface is public under Apache-2.0 as `@kontourai/surface`, with published documentation, runnable examples, a CLI, schemas, and package APIs. It is active infrastructure, not a certification service: a weak or stale claim remains visibly weak or stale.

## What It Demonstrates

Surface demonstrates how I approach trust as a data and systems problem. The goal is not to make an AI output sound more certain. It is to make the basis for acting on that output portable, inspectable, and honest about what is missing.

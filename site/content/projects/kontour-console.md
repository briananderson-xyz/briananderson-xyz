---
title: "Console: A Local Operating Plane for Kontour"
date: 2026-05-31
updated: 2026-06-29
period: "2026 – Present"
summary: "A local-first operating plane that composes claim, process, review, proof, freshness, and next-action projections without replacing the products that own them."
tags:
  [
    "AgenticAI",
    "Observability",
    "DeveloperTooling",
    "React",
    "TypeScript",
    "Builder",
    "Ops",
    "OpenSource"
  ]
keywords:
  [
    "kontour-console",
    "operating-plane",
    "local-first",
    "projections",
    "event-streams",
    "sse",
    "workflow-observability",
    "flow-bridge"
  ]
outcome: "Operational visibility"
projectType: "Developer platform"
showTableOfContents: true
links:
  - label: "GitHub Repository"
    url: "https://github.com/kontourai/console"
    type: "github"
  - label: "Published Site"
    url: "https://kontourai.github.io/console/"
    type: "website"
  - label: "Kontour AI Suite"
    url: "/projects/kontour/"
    type: "case-study"
---

## The Problem

Portable trust and workflow records are useful on their own, but operating several products still creates a visibility problem. Claims may be stale in one place while a process waits on evidence in another and a human-review queue holds the decision that connects them. A useful suite view has to correlate that state without quietly becoming the new source of truth.

## What I Built

Console is the local-first operating plane for [Kontour AI](/projects/kontour/): one place to inspect claim status, process state, proof, review queues, freshness, exceptions, links, and next actions.

- Shared event and projection contracts for product-owned state.
- Local file sinks and deterministic replay of append-only event streams.
- A read-only inspector for records under `.kontourai/console/`, with compatibility for earlier local paths.
- A loopback hub with record ingestion, current-state APIs, server-sent events, and a bundled React interface.
- A deterministic bridge that derives Console events from local [Flow](/projects/kontour-flow/) run files without mutating those runs.
- Producer helpers for mapping caller-owned Surface, Flow, and Survey state into Console records.

## Architecture and Decisions

Console composes projections; it does not redefine their meaning. [Surface](/projects/kontour-surface/) still owns claim trust state, Flow owns gate transitions, [Survey](/projects/kontour-survey/) owns review records, and products retain authority over actions. The local hub treats action descriptors as inert data rather than a hidden remote-execution channel.

The package uses TypeScript workspaces: a core contract layer, a server and telemetry layer, and a React/Vite UI. Local files are the default persistence and the server binds to loopback by default. Non-loopback local access requires an explicitly configured token.

## Status and Outcomes

Console is an active Apache-2.0 foundation published as `@kontourai/console`. The repository ships a working local inspector, hub, event replay, Flow bridge, and UI. It is explicitly not a hosted production service yet; hosted collaboration and monitoring remain future management-plane concerns rather than current claims.

## What It Demonstrates

Console demonstrates how to design an operating plane without stealing authority from the systems it observes: portable identities, append-only events, deterministic projections, explicit action ownership, and honest product boundaries.

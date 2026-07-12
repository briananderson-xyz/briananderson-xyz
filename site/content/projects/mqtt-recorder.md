---
title: "mqtt-recorder: Record, Replay, and Mirror MQTT"
date: 2026-02-13
updated: 2026-07-12
projectDate: 2026-02-09
period: "2026"
summary: "A generic Rust MQTT recorder, passthrough, and replay tool with a CLI and basic TUI, first used to keep local ProveIT demo work moving when remote streams were unavailable."
tags: ["Rust", "SystemsEngineering", "IoT", "Builder", "SideProject", "OpenSource"]
keywords: ["mqtt", "mqtt-recorder", "rust", "iot", "message-broker", "record-replay", "tui"]
outcome: "Systems reliability"
projectType: "Open-source tool"
showTableOfContents: true
links:
  - label: "GitHub Repository"
    url: "https://github.com/briananderson1222/mqtt-recorder"
    type: "github"
  - label: "Releases"
    url: "https://github.com/briananderson1222/mqtt-recorder/releases"
    type: "website"
  - label: "ProveIT case study"
    url: "/projects/proveit-industrial-ai/"
    type: "case-study"
  - label: "EdgeMind dashboard"
    url: "https://github.com/briananderson1222/EdgeMind"
    type: "github"
---

## The Goal

The motivating use case came from the [ProveIT demonstration](/projects/proveit-industrial-ai/). We had
realistic Unified Namespace data for three simulated factory scenarios, but the remote streams went
offline. I needed to keep developing against my local
[EdgeMind](https://github.com/briananderson1222/EdgeMind) dashboard, so I built a way to record the
streams when available, pass them through, and replay them later. That was demonstration continuity,
not access to live production factories. I kept the tool generic: it accepts arbitrary MQTT inputs and
does not depend on ProveIT, EdgeMind, or a particular topic hierarchy.

## What I Built

- **Four operating modes:** record broker traffic to CSV, replay it with timing preserved (optionally looping), mirror an external broker into an embedded one in real time, and run a standalone embedded broker on its own.
- **An interactive TUI:** a real-time terminal dashboard to drive recording, mirroring, and playback, with a live audit log annotated by area and severity.
- **Correctness under messy inputs:** automatic binary detection with base64 encoding for safe CSV storage, plus CSV validation and repair for files that got corrupted.
- **Protocol and transport depth:** MQTT v3.1.1 and v5 support (v5 by default), TLS with certificate authentication, wildcard and file-driven topic filtering, periodic health-check monitoring, and a verify mode that independently compares source messages against the embedded broker's output.

## What It Demonstrates

This was my first foray into using AI to help build a Rust tool; I have never fully learned Rust. The
result was useful beyond its first setting: a CLI and basic TUI around generic recording, passthrough,
and replay, plus an embedded broker and checks around message handling. The original demo proved the
contract against a real need without implying production use or broader Rust expertise.

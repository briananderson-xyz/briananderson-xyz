---
title: "mqtt-recorder: Record, Replay, and Mirror MQTT"
date: 2026-02-13
period: "2026"
summary: "A Rust command-line tool for recording, replaying, and mirroring MQTT message streams, with an embedded broker, an interactive terminal dashboard, and independent verification of mirrored traffic."
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
---

## The Goal

Working with MQTT systems, I kept wanting the equivalent of a DVR for a message bus: capture what a broker is publishing, replay it later with the original timing, and mirror a live broker into a local one so I could develop against real traffic without touching production. The existing options were either language-specific libraries or scripts that fell apart on binary payloads and protocol differences. I wanted one fast, self-contained binary that did all of it.

## What I Built

- **Four operating modes:** record broker traffic to CSV, replay it with timing preserved (optionally looping), mirror an external broker into an embedded one in real time, and run a standalone embedded broker on its own.
- **An interactive TUI:** a real-time terminal dashboard to drive recording, mirroring, and playback, with a live audit log annotated by area and severity.
- **Correctness under messy inputs:** automatic binary detection with base64 encoding for safe CSV storage, plus CSV validation and repair for files that got corrupted.
- **Protocol and transport depth:** MQTT v3.1.1 and v5 support (v5 by default), TLS with certificate authentication, wildcard and file-driven topic filtering, periodic health-check monitoring, and a verify mode that independently compares source messages against the embedded broker's output.

## What It Demonstrates

This one is deliberately not an AI project. It is proof of the systems-engineering half of how I build: an embedded broker, real-time stream handling, protocol version negotiation, TLS, binary-safe serialization, and a terminal UI, packaged as a single cross-platform Rust binary with CI and prebuilt releases for Linux, macOS, and Windows. Good agentic systems rest on this kind of foundation, and mqtt-recorder is where I keep that muscle honest.

---
title: "Boo: A Scheduler Daemon for AI Agents"
date: 2026-03-09
updated: 2026-07-12
projectDate: 2026-02-19
period: "2026 – Present"
summary: "A Rust scheduler for personal AI tasks, inspired by OpenClaw's heartbeat pattern and adapted to handle laptop sleep, missed runs, and inspectable local history."
tags: ["AgenticAI", "Rust", "Automation", "Builder", "SideProject", "OpenSource"]
keywords: ["boo", "agent-scheduler", "cron", "rust", "kiro-cli", "ai-automation", "daemon"]
outcome: "Developer productivity"
projectType: "Open-source tool"
showTableOfContents: true
links:
  - label: "GitHub Repository"
    url: "https://github.com/briananderson1222/boo"
    type: "github"
  - label: "Releases"
    url: "https://github.com/briananderson1222/boo/releases"
    type: "website"
---

## The Goal

The initial idea was inspired by OpenClaw's heartbeat pattern: wake up periodically and check whether
there is work to do. I adapted that idea into a narrower Rust scheduler for personal AI tasks on a
laptop. Boo does not share OpenClaw code, and this is not a claim of feature equivalence. It adds the
job state, response capture, and missed-run behavior I wanted for a machine that regularly sleeps.

## What I Built

- **A Rust daemon with three schedule types:** recurring `cron` expressions, one-shot `at` times (including natural language like "tomorrow 9am", parsed via the agent CLI with confirmation), and fixed `every` intervals.
- **Agent-aware jobs:** each job can target a specific agent and model, run in its own working directory, and enforce a timeout that kills the process group cleanly if it overruns.
- **Heartbeat with missed-run recovery:** the daemon tracks a heartbeat so it can tell the difference between "nothing was scheduled" and "the machine was asleep", then catches up on runs it missed instead of silently dropping them.
- **A full operator surface:** desktop notifications, run history and statistics over 24h/7d/30d windows, live view of active runs with PID and elapsed time, resume of an interactive session to follow up on a scheduled run, and install/uninstall as an auto-start service.

## What It Demonstrates

Boo is systems programming in service of agentic workflows: process supervision, signal handling,
cron and interval math, persistence across reboots, and OS integration for notifications and
auto-start, all in Rust. I use it for a small set of my own scheduled tasks. It is an experiment in
making local automation easier to inspect and recover, not a claim of high availability or unattended
reliability for every workload.

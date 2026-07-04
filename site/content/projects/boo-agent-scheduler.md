---
title: "Boo: A Scheduler Daemon for AI Agents"
date: 2026-03-09
period: "2026 – Present"
summary: "A cross-platform scheduler daemon, written in Rust, that fires AI agent prompts on cron schedules. Heartbeat-based, it survives sleep/wake cycles and catches up on runs it missed while the machine was off."
tags: ["AgenticAI", "Rust", "Automation", "Builder", "SideProject", "OpenSource"]
keywords: ["boo", "agent-scheduler", "cron", "rust", "kiro-cli", "ai-automation", "daemon"]
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

I wanted my AI agents to do things while I was not sitting in front of them. A morning brief before the workday, an inbox triage every 30 minutes, a reminder that fires once and then deletes itself. Plain cron can run a command, but it has no idea an agent exists: no notion of which agent or model to use, no capture of the response, no recovery when the laptop was asleep at 9am. Boo is the missing layer between a schedule and an agent.

## What I Built

- **A Rust daemon with three schedule types:** recurring `cron` expressions, one-shot `at` times (including natural language like "tomorrow 9am", parsed via the agent CLI with confirmation), and fixed `every` intervals.
- **Agent-aware jobs:** each job can target a specific agent and model, run in its own working directory, and enforce a timeout that kills the process group cleanly if it overruns.
- **Heartbeat with missed-run recovery:** the daemon tracks a heartbeat so it can tell the difference between "nothing was scheduled" and "the machine was asleep", then catches up on runs it missed instead of silently dropping them.
- **A full operator surface:** desktop notifications, run history and statistics over 24h/7d/30d windows, live view of active runs with PID and elapsed time, resume of an interactive session to follow up on a scheduled run, and install/uninstall as an auto-start service.

## What It Demonstrates

Boo is systems programming in service of agentic workflows: process supervision, signal handling, cron and interval math, persistence across reboots, and OS integration for notifications and auto-start, all in Rust. It has shipped through five tagged releases (v0.5.1 at last count) and is the scheduler I actually use to run my own proactive AI tasks. It is the concrete answer to a question I care about: what does it take to make an agent reliable enough to trust unattended?

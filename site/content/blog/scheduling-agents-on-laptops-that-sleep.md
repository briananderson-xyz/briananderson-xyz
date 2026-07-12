---
title: "Scheduling agents on laptops that sleep"
date: 2026-07-09
updated: 2026-07-12
projectDate: 2026-02-19
summary: "Cron assumes the machine is awake. My laptop is not. Building Boo forced me to define what a scheduled agent should do after sleep, how missed runs should recover, and where local automation stops being reliable."
tags: ["AgenticAI", "Rust", "Automation", "Scheduling", "Builder"]
keywords: ["boo", "agent-scheduler", "sleep-wake", "missed-runs", "cron", "heartbeat", "kiro-cli"]
skills: ["kiro"]
showTableOfContents: true
links:
  - label: "Boo case study"
    url: "/projects/boo-agent-scheduler/"
    type: "case-study"
  - label: "Boo on GitHub"
    url: "https://github.com/briananderson1222/boo"
    type: "github"
---

Cron has a wonderfully simple model of the world: the clock reaches a time, the machine is awake,
and a command runs. My laptop does not share that model. It sleeps in my bag, loses network access,
changes locations, and wakes up long after a scheduled minute has passed.

That is mostly fine for ordinary automation. Missing a cache cleanup at 2am is not a crisis. It gets
more interesting when the scheduled command is an agent task: prepare a morning brief, check an
inbox, or assemble context before a meeting. The value of that work depends on time, but blindly
running every missed occurrence after wake can be worse than dropping it.

The initial idea for [Boo](/projects/boo-agent-scheduler/) came from OpenClaw's heartbeat pattern. I
liked the idea of a process waking up periodically to look for work, then adapted that prompt into a
much narrower Rust scheduler for my laptop. This is inspiration, not shared code or a claim that the
two tools have equivalent features. My version focuses on making sleep and missed-run behavior
explicit.

## The timer is not the durable part

Boo is a Rust daemon with a configurable heartbeat. On each tick it loads the persisted jobs, checks
which ones are overdue, and starts the work that is eligible to run. The timer loop is intentionally
boring. The important state lives on disk: the schedule, creation time, last run, run history, and the
metadata needed to explain what happened.

That distinction is what makes sleep recovery possible. A timer suspended with the laptop cannot
remember every tick it missed. A persisted schedule can compare its last known state with the current
time when the daemon resumes.

The scheduler supports three kinds of time:

- A cron expression asks whether the next occurrence after the last run is now in the past.
- A fixed interval asks whether the last run, or the job's creation time, plus the interval has passed.
- A one-shot time is overdue only when its timestamp has passed and it has never run.

The wake event itself does not need to be magical. The next heartbeat sees the gap.

## Catch up once, then tell me what was missed

Suppose an inbox job runs every 30 minutes and the laptop sleeps for eight hours. Replaying sixteen
agent sessions at once is not recovery. It is a small denial-of-service attack against my own machine,
my model budget, and probably my inbox.

Boo coalesces missed cron occurrences into one catch-up run. The run record includes a
`missed_count`, so the history still says how large the gap was without pretending every missed slot
deserves a separate execution. After that run, `last_run` advances to the current time and normal
scheduling resumes.

That is a policy choice, not a universally correct answer. A financial batch may need every interval.
A morning brief usually needs one fresh answer, not a stack of stale ones. Boo is designed for the
second category. If a job requires exactly-once delivery for every scheduled occurrence, a laptop
daemon is the wrong substrate.

## Unattended agents need process rules too

Once the clock problem was handled, the operating problems became more important.

Boo prevents the same job from overlapping by default. It can apply a timeout and terminate the
process group when work runs too long. Failed runs can retry with a configured delay. One-shot jobs
marked for deletion are removed only after success. Active runs and completed runs are tracked
separately, so I can see what is running, inspect its PID and elapsed time, wait for it, or kill it.

Every run also produces a full log and a clean response artifact. A scheduled agent is much easier to
trust when "did it run?" and "what did it say?" have durable answers.

The security boundary matters just as much. Prompts go to the agent CLI through standard input rather
than appearing as process arguments. Tool trust is an explicit job option. That does not make an
unattended prompt safe by itself, but it avoids turning broad permissions into an invisible scheduler
default.

## A local scheduler is still local

Boo survives sleep and wake; it does not turn a laptop into a highly available control plane.

If the machine stays off, no work happens. If the network is gone, a network-dependent job may fail.
The heartbeat detects overdue work only after the daemon is running again. Persistence on one machine
is not replication, and a retry is not exactly-once execution.

I like those limits because they keep the tool honest. Boo is for personal, proactive automation where
local control, inspectable history, and reasonable catch-up semantics matter more than distributed
durability. Work with stronger delivery guarantees belongs on infrastructure built for them.

The lesson was broader than scheduling. Agent reliability does not start with a better prompt. It
starts by defining what should happen when the ordinary world interrupts the happy path: the laptop
sleeps, a process hangs, a run fails, or six scheduled moments pass without anybody watching. Once
those semantics are explicit, the agent becomes the payload. The system around it is what makes the
automation usable.

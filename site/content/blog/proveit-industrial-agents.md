---
title: Agents on the factory floor (ProveIT)
date: 2026-05-20
summary: How we turned raw plant telemetry into an agent that flags anomalies, walks operators through fixes, and files the work order. Built for glass and pharma manufacturing, shown in a partner keynote, and then torn apart in a workshop the next day.
tags: ["AgenticAI", "AWS", "Bedrock", "Manufacturing", "IoT", "Builder"]
keywords: ["proveit", "industrial-ai", "agentcore", "bedrock", "unified-namespace", "mqtt", "uns", "concept-reply"]
showTableOfContents: true
---

Most "AI for manufacturing" demos stop at a dashboard. Someone shows you a chart of sensor data, points at a spike, and says the model noticed it. That is the easy 20%. The hard part, the part that actually changes a shift, is what happens after the spike: who gets told, what they should do about it, and whether the system can take the boring next step on its own.

ProveIT was my attempt to build the whole loop, end to end, for glass and pharma manufacturing.

## The setup

Factories already produce an enormous amount of telemetry. The problem is that it is fragmented across machines, protocols, and vendors, and most of it never reaches anyone who could act on it. So the foundation was not AI at all. It was plumbing.

I pulled plant telemetry over MQTT into a **Unified Namespace**, which is the pattern where every machine, line, and sensor publishes to one consistently structured hierarchy instead of a tangle of point-to-point integrations. From there the streams were categorized, standardized, and landed in a time-series store. Boring on purpose. If the data model is not honest, nothing you build on top of it will be either.

## The agent layer

Once the data was trustworthy, I put an agent layer on top of it using **Bedrock** and **AgentCore**. It did three things:

- **Watched for anomalies** in the live streams, per line and per piece of equipment.
- **Walked operators through the fix** in natural language, grounded in the actual SOPs, rather than dumping a stack trace and wishing them luck.
- **Took the next step** when it made sense: filing a work order, pulling up the maintenance procedure, routing the issue to the right persona.

On top of that were persona-specific dashboards, so an operator saw OEE and equipment state the way an operator thinks about them, and you could just ask the system, in plain language, what a production line was doing right now.

The thing I care about is that middle bullet. An anomaly detector that only detects is a smoke alarm. What makes it an agent is that it closes the distance between "something is wrong" and "here is the fix, and I have already started it."

## Keynote, then the workshop

Our partner, **Concept Reply**, featured the demo in a conference keynote and ran it at their booth. That was the flashy day, and it went well.

The day I actually enjoyed was the one after. I ran a workshop that pulled the whole thing apart. Not the polished demo, the build: how the UNS and MQTT ingestion was structured, why we standardized the streams the way we did, how the agent stayed grounded in SOPs instead of hallucinating a procedure, and where the honest limits were. We spent as much time on how we approached the problem as on the result.

That is usually the more valuable session. A keynote convinces people something is possible. A workshop shows them the seams, and the seams are where they learn whether they can build it themselves.

## What I took from it

A few things stuck with me:

- **The data model is the product.** The agent was only as good as the Unified Namespace under it. Almost all of the leverage came from getting the boring foundation right.
- **"Detect" is not "resolve."** The value was in the last mile, translating a signal into a grounded, SOP-backed action a real person could trust and a system could partly execute.
- **Grounding beats fluency.** On a factory floor, a confident wrong answer is worse than no answer. Tying the agent to real procedures mattered more than making it sound smart.

ProveIT was a prototype, not a product. But it was the clearest version I have built of the thing I keep coming back to: an agent earns its place not by being impressive, but by doing the next real step and being right about it.

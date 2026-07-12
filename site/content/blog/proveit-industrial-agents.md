---
title: Agents on the factory floor (ProveIT)
date: 2026-07-02
updated: 2026-07-12
eventPeriod: "Early 2026"
summary: "A retrospective on a one-time industrial AI prototype we built with Concept Reply using simulated glass and pharma scenarios, followed by a workshop on what worked and what remained a demo."
tags: ["AgenticAI", "AWS", "Bedrock", "Manufacturing", "IoT", "Builder"]
keywords:
  [
    "proveit",
    "industrial-ai",
    "agentcore",
    "bedrock",
    "unified-namespace",
    "mqtt",
    "uns",
    "concept-reply"
  ]
showTableOfContents: true
---

Many manufacturing AI demos stop at a dashboard: a chart shows a sensor spike and the model points it
out. For an early-2026 event, our team explored what a next step might look like after detection: who
gets told, what approved procedure applies, and which routine action the prototype can demonstrate.

ProveIT was a one-time prototype we built with Concept Reply around simulated glass and pharma
manufacturing scenarios. It was not a production deployment or an ongoing product.

## The setup

Factories already produce an enormous amount of telemetry. The problem is that it is fragmented across machines, protocols, and vendors, and most of it never reaches anyone who could act on it. So the foundation was not AI at all. It was plumbing.

We modeled plant telemetry over MQTT in a **Unified Namespace**, where machines, lines, and sensors
publish to a consistently structured hierarchy rather than a set of point-to-point integrations. The
demonstration streams were categorized, standardized, and landed in a time-series store. That data
plumbing made the rest of the prototype possible.

When the remote streams were unavailable, I built
[mqtt-recorder](/projects/mqtt-recorder/) to capture, pass through, and replay the three simulated UNS
scenarios into my local EdgeMind dashboard. It was continuity tooling for the demo, not a connection
to production factory data.

## The agent layer

We put an agent layer on top using **Bedrock** and **AgentCore**. In the demonstration it could:

- **Flag anomalies** in the simulated streams, per line and per piece of equipment.
- **Walk through a troubleshooting path** in natural language, grounded in the demonstration SOPs.
- **Demonstrate a next step** such as preparing a work order, pulling up a maintenance procedure, or routing an issue to the right persona.

Persona-specific dashboards presented OEE and equipment state, with natural-language questions over
the demonstration data. We did not test this against the operational conditions of a live plant.

The useful design question was the distance between "something looks wrong" and a grounded procedure
someone could inspect. The prototype let us explore that question without claiming it had resolved
the safety, integration, and approval work a production system would require.

## Keynote, then the workshop

Our partner, **Concept Reply**, featured the demo in a conference keynote and ran it at their booth.

I later ran a workshop that pulled apart the build: how the UNS and MQTT ingestion was structured, why
we standardized the streams, how we grounded responses in SOPs, and where the demo stopped. We spent
as much time on the approach as on the result.

The workshop gave us room to discuss the seams and the work a polished demonstration can hide.

## What I took from it

A few things stuck with me:

- **The data model comes first.** The agent was only as useful as the Unified Namespace under it.
- **"Detect" is not "resolve."** A signal still needs a grounded, SOP-backed handoff and human judgment.
- **Grounding beats fluency.** On a factory floor, a confident wrong answer is worse than no answer. Tying the agent to real procedures mattered more than making it sound smart.

ProveIT was a bounded event prototype, not a product or my continuing focus. Its useful lesson was
more modest: an impressive interface matters less than the quality of the data, procedures, and
handoffs underneath it.

The [ProveIT project case study](/projects/proveit-industrial-ai/) maps the architecture, trust model, constraints, and outcome in a more structured format.

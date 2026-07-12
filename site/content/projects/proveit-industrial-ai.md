---
title: "ProveIT: Industrial Agents from Signal to Action"
date: 2026-07-09
updated: 2026-07-12
eventPeriod: "Early 2026"
period: "Early 2026"
summary: "A one-time prototype built with Concept Reply around simulated glass and pharma scenarios, connecting MQTT data, a Unified Namespace, and grounded Bedrock agents for a conference demonstration."
tags: ["AgenticAI", "AWS", "AmazonBedrock", "AgentCore", "Manufacturing", "IoT", "Builder", "Ops"]
keywords:
  [
    "proveit",
    "industrial-ai",
    "mqtt",
    "unified-namespace",
    "uns",
    "time-series",
    "bedrock",
    "agentcore",
    "sop",
    "oee",
    "concept-reply"
  ]
skills: ["aws", "amazon-bedrock", "agentcore"]
outcome: "Operational decision support"
projectType: "Industrial prototype"
showTableOfContents: true
links:
  - label: "Read the original build story"
    url: "/blog/proveit-industrial-agents/"
    type: "article"
---

## The Problem

Many manufacturing AI demos end at detection: a chart shows an unusual signal and a model points it out. A useful operational loop still has to explain what happened, ground the next step in an approved procedure, reach the right person, and take a routine action when that is appropriate.

ProveIT explored that loop as a one-time prototype our team built with Concept Reply around simulated
glass and pharma scenarios. It connected demonstration signals to persona-specific views and
SOP-guided troubleshooting; it did not replace operational judgment or run in a production plant.

## Architecture

The foundation was industrial data plumbing rather than an AI prompt:

1. Simulated plant telemetry arrived over **MQTT**.
2. A **Unified Namespace (UNS)** organized machines, lines, and sensors into a consistent hierarchy.
3. The streams were categorized, standardized, and written to a time-series store.
4. An agent layer using **Amazon Bedrock** and **AgentCore** watched equipment and line state, supported natural-language questions, and grounded troubleshooting in the relevant SOPs.
5. Persona-specific dashboards presented OEE and equipment state in the context an operator needed.

When the remote demo streams were unavailable, I built
[mqtt-recorder](/projects/mqtt-recorder/) to record, pass through, and replay the three simulated UNS
scenarios into my local EdgeMind dashboard. That kept local development moving; it was not a live
factory-data integration.

The prototype could flag anomalies, walk through a grounded procedure, and demonstrate a proposed
next step, such as drafting a work order or showing how an issue might be routed to the appropriate
persona. The trust boundary was the underlying data model and the SOP grounding: fluent text was not
treated as evidence that a procedure was correct.

## Trust Model and Constraints

ProveIT was a prototype and conference demonstration, not a production product, customer deployment,
or ongoing focus. It demonstrated simulated glass and pharma scenarios rather than making a general
assertion that every plant or process was covered.

The design kept three constraints visible:

- The Unified Namespace and standardized streams had to be dependable before an agent could reason over them.
- Troubleshooting guidance had to stay grounded in actual procedures rather than generated from model confidence.
- Detecting an anomaly and resolving it were treated as different responsibilities, with a human operator still central to the workflow.

## Outcome

Partner **Concept Reply** featured the prototype in a conference keynote and at its booth. I later led
a workshop that unpacked the system's seams: MQTT and UNS structure, stream standardization, SOP
grounding, and the limits of the approach.

What the prototype demonstrates is a path from industrial telemetry to an actionable, inspectable workflow. Its most important lesson was that the agent layer only became useful after the underlying operational data and procedures were structured well enough to trust.

The original essay, [Agents on the factory floor (ProveIT)](/blog/proveit-industrial-agents/), tells the build story and the lessons from the keynote and workshop.

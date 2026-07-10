---
title: "ProveIT: Industrial Agents from Signal to Action"
date: 2026-05-20
updated: 2026-07-09
period: "2026"
summary: "A glass and pharma manufacturing prototype that connected MQTT plant telemetry, a Unified Namespace, time-series data, and grounded Bedrock agents to move from anomaly detection toward SOP-guided action."
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

ProveIT explored that full loop as a cross-industry prototype for glass and pharma manufacturing. It was designed to connect real-time plant signals to persona-specific insight and SOP-guided troubleshooting, not to present a language model as a replacement for operational judgment.

## Architecture

The foundation was industrial data plumbing rather than an AI prompt:

1. Plant telemetry arrived over **MQTT**.
2. A **Unified Namespace (UNS)** organized machines, lines, and sensors into a consistent hierarchy.
3. The streams were categorized, standardized, and written to a time-series store.
4. An agent layer using **Amazon Bedrock** and **AgentCore** watched equipment and line state, supported natural-language questions, and grounded troubleshooting in the relevant SOPs.
5. Persona-specific dashboards presented OEE and equipment state in the context an operator needed.

The prototype could flag anomalies, walk an operator through a grounded procedure, and support the next operational step, including filing a work order or routing an issue to the appropriate persona. The trust boundary was the underlying data model and the SOP grounding: fluent text was not treated as evidence that a procedure was correct.

## Trust Model and Constraints

ProveIT was a prototype and conference demonstration, not a production product or a claimed customer deployment. It demonstrated glass and pharma manufacturing scenarios rather than making a general assertion that every plant or process was covered.

The design kept three constraints visible:

- The Unified Namespace and standardized streams had to be dependable before an agent could reason over them.
- Troubleshooting guidance had to stay grounded in actual procedures rather than generated from model confidence.
- Detecting an anomaly and resolving it were treated as different responsibilities, with a human operator still central to the workflow.

## Outcome

Partner **Concept Reply** featured the prototype in a conference keynote and at its booth. I then led a workshop that unpacked the system's seams: MQTT and UNS structure, stream standardization, SOP grounding, and the limits of the approach.

What the prototype demonstrates is a path from industrial telemetry to an actionable, inspectable workflow. Its most important lesson was that the agent layer only became useful after the underlying operational data and procedures were structured well enough to trust.

The original essay, [Agents on the factory floor (ProveIT)](/blog/proveit-industrial-agents/), tells the build story and the lessons from the keynote and workshop.

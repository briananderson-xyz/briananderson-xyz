---
title: What CampFit taught me about reviewing AI facts
date: 2026-06-18
updated: 2026-07-12
projectDate: 2026-03-08
summary: "What a kids-camp directory taught me about reviewing AI-extracted facts before people rely on them, with a few parallels to larger systems."
tags: ["AgenticAI", "DataProvenance", "Trust", "Evals", "Builder"]
keywords: ["provenance", "agent-verification", "evals", "trust-review", "guardrails", "campfit"]
showTableOfContents: true
---

Here is the uncomfortable thing about agentic AI: you are dropping probabilistic behavior into systems that used to be deterministic. That is exactly what makes it powerful, and exactly what makes it easy to get wrong. A model that is right 95% of the time feels amazing in a demo and is a liability in production, because the 5% arrives without a warning label.

One question I have been asking more often is not just "is the agent smart enough?" but "how do I
know when it is wrong, before it costs me?"

For CampFit, the practical answer was to make every extracted fact reviewable before publishing it.

## A directory taught me this better than any platform

I build a lot of infrastructure. But the project that made this concrete was small and personal: [CampFit](/projects/campfit/), a directory that helps Denver parents find and compare kids' camps.

The fun story is that AI helped me assemble a working app in a weekend. Nobody should care about that. The story I actually care about is what sits underneath it.

Camp information lives in hundreds of inconsistent websites, PDFs, and registration portals. An agent can crawl and extract all of it in an afternoon. But a parent is about to plan their summer and spend real money around what my app tells them. If the agent got a registration date wrong, that is not a bug report, that is a kid who missed a camp.

So nothing a crawler finds is shown to a parent until it earns it. Every value flows through the same pipeline: **crawl, extract, propose, human review, approved claim.** Each fact carries a trust signal that explains *why* it should be believed, when it was checked, and where it came from. The review workbench, the part that decides which AI-gathered data is trustworthy enough to show, is the actual product. The pretty front end is just what is left over once you trust the data.

## The pattern travels, with caveats

The review pattern also informs some of my work on larger AI and cloud systems, although the risks,
controls, and people involved are different.

When a team wants to put an agent into a real workflow, one important failure mode is a confident
output whose quality is hard to judge. Some of the machinery that helps includes:

- **Evals**, so "it seems better" becomes a number you can regress against. On my own agent tooling I gate changes with promptfoo so a prompt tweak cannot quietly break three other things.
- **Provenance**, so every claim can be traced back to its source and its freshness, not just asserted.
- **Verification loops**, so the system checks its own work against something real before a human relies on it. On the factory floor that meant grounding an agent in actual SOPs instead of letting it improvise a repair procedure.

The domains are not interchangeable, but they share a useful question: what review layer belongs
between generated output and a consequential decision?

## Why I keep returning to reviewability

There is a version of AI adoption that emphasizes velocity while leaving review until later. I prefer
to make "was that right?" an ordinary question the system can help answer.

Two of my own values sit under all of this: *show the work, evidence over assertion*, and *be honest, especially when it costs something*. It turns out those are not just personality traits. They are a system design spec. An agent that can show its work is one you can actually deploy. One that just asks to be trusted is a demo.

I try to build systems that make outputs reviewable instead of relying on confidence or fluency. It is
one useful design lens among several, and CampFit made it concrete for me.

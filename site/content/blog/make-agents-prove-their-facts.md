---
title: Don't trust your agents. Make them prove it.
date: 2026-06-18
summary: "The through-line in everything I build right now: you do not trust an agent because it sounds right, you build the system that makes it show its work. What that looks like in practice, from a kids-camp directory to enterprise AI."
tags: ["AgenticAI", "DataProvenance", "Trust", "Evals", "Builder"]
keywords: ["provenance", "agent-verification", "evals", "trust-review", "guardrails", "campfit"]
showTableOfContents: true
---

Here is the uncomfortable thing about agentic AI: you are dropping probabilistic behavior into systems that used to be deterministic. That is exactly what makes it powerful, and exactly what makes it easy to get wrong. A model that is right 95% of the time feels amazing in a demo and is a liability in production, because the 5% arrives without a warning label.

So the question I keep asking, on every project, is not "is the agent smart enough?" It is "how do I know when it is wrong, before it costs me?"

The answer is almost never "trust it more." It is "make it prove its work."

## A directory taught me this better than any platform

I build a lot of infrastructure. But the project that made this concrete was small and personal: [CampFit](/projects/campfit/), a directory that helps Denver parents find and compare kids' camps.

The fun story is that AI helped me assemble a working app in a weekend. Nobody should care about that. The story I actually care about is what sits underneath it.

Camp information lives in hundreds of inconsistent websites, PDFs, and registration portals. An agent can crawl and extract all of it in an afternoon. But a parent is about to plan their summer and spend real money around what my app tells them. If the agent got a registration date wrong, that is not a bug report, that is a kid who missed a camp.

So nothing a crawler finds is shown to a parent until it earns it. Every value flows through the same pipeline: **crawl, extract, propose, human review, approved claim.** Each fact carries a trust signal that explains *why* it should be believed, when it was checked, and where it came from. The review workbench, the part that decides which AI-gathered data is trustworthy enough to show, is the actual product. The pretty front end is just what is left over once you trust the data.

## It is the same move at enterprise scale

This is not a hobby-project idea. It is the same move I make in my day job shaping AI and cloud strategy, just with more zeros attached.

When a team wants to put an agent into a real workflow, the failure mode is never "the model cannot do it." It is "the model does it, confidently, and nobody can tell the good runs from the bad ones." The fix is the same set of unglamorous machinery every time:

- **Evals**, so "it seems better" becomes a number you can regress against. On my own agent tooling I gate changes with promptfoo so a prompt tweak cannot quietly break three other things.
- **Provenance**, so every claim can be traced back to its source and its freshness, not just asserted.
- **Verification loops**, so the system checks its own work against something real before a human relies on it. On the factory floor that meant grounding an agent in actual SOPs instead of letting it improvise a repair procedure.

Different domains, identical shape. The interesting engineering is never the generation. It is the review layer around it.

## Why I think this is the whole game

There is a version of AI adoption that is all velocity and no brakes, and it feels great right up until it doesn't. The teams that win with this stuff are not the ones with the flashiest agents. They are the ones who made it cheap to answer "was that right?" and boring to catch it when it wasn't.

Two of my own values sit under all of this: *show the work, evidence over assertion*, and *be honest, especially when it costs something*. It turns out those are not just personality traits. They are a system design spec. An agent that can show its work is one you can actually deploy. One that just asks to be trusted is a demo.

So I do not build agents I trust. I build systems that make agents prove they were right, and I make that proof the cheapest thing in the stack. Everything good I have shipped lately, from a camp directory to enterprise AI, is some version of that one idea.

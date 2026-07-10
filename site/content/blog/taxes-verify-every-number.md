---
title: A tax workspace that won't trust a number until it's verified
date: 2026-06-30
summary: "I built a local-first tool that turns a household's pile of tax paperwork into a checked, source-attributed dataset. The interesting part is not the parsing. It is that nothing gets trusted until it earns it, and every derived number remembers where it came from."
tags: ["Builder", "DataProvenance", "TypeScript", "MCP", "AgenticAI"]
keywords: ["taxes", "provenance", "verification", "mcp", "trust", "local-first", "kontourai"]
showTableOfContents: true
---

Once a year, every household turns into a small, badly organized data pipeline. W-2s, a stack of 1099s, a 1098, paystubs, last year's return. Some of it arrives twice. Some of it gets corrected after the fact. Somewhere in that pile are the handful of numbers your taxes actually depend on, and the cost of getting one of them wrong is not a stack trace, it is a letter from the IRS.

So I built myself a tax workspace. And the same idea I keep [coming back to](/blog/make-agents-prove-their-facts/) shows up here too: the hard part was never reading the documents. It was deciding which numbers to trust.

## The problem with "just extract the fields"

The naive version of this app is easy. Point a parser at a W-2, pull out the boxes, add them up. I could have shipped that in an afternoon.

It would also be quietly wrong on exactly the cases that matter. You get a corrected W-2 and now two documents disagree. You have three brokerage 1099s and one is a composite that overlaps the others. A paystub says one thing and the official form says another. A tool that just extracts fields will confidently pick one and move on, and you will never know it made a choice.

I did not want a confident tool. I wanted a careful one.

## Facts have to earn their way to trusted

So every value moves through three explicit stages, and they are actually separate things in the system, not just a status flag:

- **Extracted:** the raw number a parser pulled off a document, with its source attached.
- **Resolved:** the best candidate, chosen by source precedence and confidence when several documents describe the same thing.
- **Verified:** confirmed, either promoted by the system when it is unambiguous or settled by me when it is not.

The important rule is what the system refuses to do. If a value still has competing candidates, or the winner is only medium-confidence, it is marked as needing verification and it will **not** be promoted to trusted. Ambiguous facts stay visible until someone settles them. The losing candidates do not get deleted either. They stay in the record, so "why did it pick that number?" always has an answer.

Withholding and the downstream analysis are then computed only from verified inputs. The app is allowed to import a mess. It is not allowed to quietly launder that mess into a number you would put on a form.

## Every derived number remembers where it came from

The part I am most happy with is the provenance graph. A derived tax position carries **derivation edges** back to the exact source facts it depends on. Change one of those source facts, say a corrected W-2 supersedes the original, and the system can emit a recompute signal for everything downstream, while keeping the superseded fact in the graph rather than pretending it never existed.

I gave the tax _rules_ the same treatment. Standard deductions, brackets, and thresholds are parsed from the official IRS and Colorado source documents, and each value carries citations, a verification status, and a changelog. When a new year's numbers conflict with what is on file, it flags the conflict for review instead of silently overwriting. The rules that decide your taxes should be as auditable as the documents you feed in.

None of this uses an LLM to read your forms, on purpose. Guessing is the one thing you do not want near a tax return. The parsing is deterministic. Where AI comes in is that the whole workspace is exposed as [MCP](https://modelcontextprotocol.io/) tools, so an agent can drive the workflow, and when it does, it operates inside the exact same verification gates a human does. An agent can move things forward. It cannot skip the part where a number has to be verified.

## Same idea, third time

This is a personal, local-first tool. It covers US federal and Colorado, it runs on my own machine against my own documents, and it is nobody's product. I am not going to pretend it saved me a quantified number of hours.

But it runs on the same trust-and-provenance machinery as [CampFit](/projects/campfit/), and it is built on the same conviction as the guardrails work I do at enterprise scale: you do not trust a system because it is confident, you build it so that every number can show its work. A camp directory, a factory floor, a tax return. Different stakes, identical spine.

The [Tax Workspace project case study](/projects/tax-workspace/) maps the architecture, trust boundary, and constraints in a more structured format.

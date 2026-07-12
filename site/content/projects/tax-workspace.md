---
title: "Tax Workspace: Verify Every Number"
date: 2026-06-30
updated: 2026-07-12
projectDate: 2026-04-20
period: "2026 – Present"
summary: "A personal, local-first workspace that turns tax documents into an auditable dataset, keeps conflicting candidates visible, and refuses to use a number downstream until it has been verified."
tags: ["TypeScript", "MCP", "DataProvenance", "AgenticAI", "Builder", "SideProject"]
keywords:
  [
    "tax-workspace",
    "taxes",
    "provenance",
    "verification",
    "local-first",
    "deterministic-parsing",
    "mcp",
    "irs",
    "colorado"
  ]
skills: ["typescript", "model-context-protocol"]
variant: builder
outcome: "Auditable personal finance"
projectType: "Personal tool"
showTableOfContents: true
links:
  - label: "Read the original build story"
    url: "/blog/taxes-verify-every-number/"
    type: "article"
---

## The Problem

Tax documents look like a field-extraction problem until two sources disagree. A corrected W-2 can conflict with the original. A composite 1099 can overlap other forms. A paystub and an official form can describe the same value differently. Choosing one candidate without preserving that disagreement would make the result look cleaner while making it harder to trust.

I built a personal, local-first workspace around a stricter rule: a number is not trusted just because software extracted it confidently. It has to retain its source, survive conflict resolution, and earn an explicit verified state before downstream analysis can use it.

## Architecture and Trust Model

The workspace separates a value's lifecycle into three distinct stages:

- **Extracted:** a parser captures a raw value and its source.
- **Resolved:** source precedence and confidence identify the strongest candidate when sources overlap.
- **Verified:** an unambiguous value can be promoted by the system; a disputed or medium-confidence value waits for human review.

Competing candidates stay in the record instead of being overwritten. Derived tax positions carry provenance edges back to the verified facts they depend on. If a corrected document supersedes a source fact, the workspace retains the old fact and can signal that downstream values need to be recomputed.

Tax rules follow the same pattern. Standard deductions, brackets, and thresholds come from official IRS and Colorado source documents, with citations, verification status, and a changelog. Conflicting rule updates are flagged for review rather than silently replacing what was already recorded.

Document parsing is deterministic; an LLM does not read the forms. MCP tools let an agent drive the workflow, but the agent works inside the same verification gates as a human and cannot promote an unresolved number to trusted.

## Constraints

This is a personal workspace, not tax software or a public product. It runs locally against my own documents and currently covers US federal and Colorado tax rules. I have not attached a time-saved metric to it, and its outputs still require the judgment appropriate for financial information.

## Outcome

The project demonstrates a practical trust boundary for agent-assisted work: automation can organize evidence, expose conflicts, and advance a workflow without being allowed to turn ambiguity into an authoritative answer. The useful result is not a more confident estimate. It is an inspectable chain from every derived number back to the sources and decisions that support it.

The original essay, [A tax workspace that won't trust a number until it's verified](/blog/taxes-verify-every-number/), goes deeper on why the verification model matters.

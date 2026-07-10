---
title: "When Boo became evidence for Java"
date: 2026-07-09
updated: 2026-07-09
summary: "A portfolio audit found that my content index treated Boo, a Rust scheduler, as evidence for Java because 'boo' appears inside 'Spring Boot.' The fix was to replace fuzzy inference with canonical IDs, explicit aliases, and a negative regression check."
tags: ["DataProvenance", "TypeScript", "Testing", "AgenticAI", "Builder"]
keywords:
  [
    "evidence-graph",
    "content-index",
    "canonical-ids",
    "aliases",
    "negative-tests",
    "substring-matching"
  ]
skills: ["typescript"]
showTableOfContents: true
links:
  - label: "Boo case study"
    url: "/projects/boo-agent-scheduler/"
    type: "case-study"
  - label: "Portfolio source"
    url: "https://github.com/briananderson-xyz/briananderson-xyz"
    type: "github"
---

During a whole-repository review of this site, I found a wonderfully small bug with a very specific
sense of humor: [Boo](/projects/boo-agent-scheduler/), my Rust agent scheduler, had become evidence that
I know Java.

The reasoning was not sophisticated. One of Boo's content terms was `boo`. One of the skills in my
resume was `Java (Spring Boot)`. The content index considered a relationship valid when either string
contained the other. Lowercase `boo` appears at the beginning of `boot`, so the graph connected them.

No model hallucinated that relationship. I wrote it into the retrieval layer.

The bug was caught in review and audit. I do not have evidence that it caused a downstream decision or
material harm, so I am not going to invent an incident around it. What it did expose was enough: a
system I use to present evidence about my own work was inferring provenance from typography.

## The fuzzy matcher looked reasonable in isolation

The site builds a content index from project and blog frontmatter. Skills come from the canonical
resume, while tags and keywords help connect a piece of content to the skills it demonstrates. The
index feeds the site's AI features, so a question about a skill can retrieve the projects and posts
that support it.

The old matching rule tried to be helpful. Normalize both terms, then accept a match when the content
term contains the skill name or the skill name contains the content term. That handles variations such
as a longer phrase around a short technology name without making every author memorize a taxonomy.

It also creates relationships nobody intended:

- `boo` matches `Spring Boot`.
- Short terms can match ordinary fragments inside unrelated names.
- Adding a new skill can silently change the meaning of old content.
- A relationship has no record of whether it came from an exact name, a deliberate synonym, or an
  accidental substring.

The graph was deterministic, but it was not trustworthy. The same inputs always produced the same
wrong edge.

## Evidence relationships need identity

The fix starts by giving every canonical resume skill a stable ID. `Java (Spring Boot)` is now
`java-spring-boot`; TypeScript is `typescript`; Model Context Protocol is `model-context-protocol`.
Display names can change without changing identity.

Each skill can also own explicit aliases. `Java` and `Spring Boot` are deliberate aliases for
`java-spring-boot`. `MCP` is a deliberate alias for `model-context-protocol`. Aliases are normalized
and registered in one map, and the build fails if the same alias points to two different IDs.

New content can go one step further and declare a `skills` list containing canonical IDs. When that
field is present, an unknown ID is an error rather than a guess. Older content can still use tags and
keywords, but the compatibility path accepts only exact names or exact, resume-owned aliases. There
is no substring matcher left.

That creates two legitimate ways to make an edge:

1. The content explicitly names the canonical skill ID.
2. A content term exactly matches an alias owned by that skill.

Both are inspectable. Neither depends on two unrelated words sharing letters.

## The most important test says what must never happen

Positive tests are natural here: a project tagged `Java` should connect to `java-spring-boot`, and a
post tagged `AWS` should connect to the AWS skill. Those prove the intended alias path still works.

The regression check that matters most is negative: the Java skill's project list must **not** contain
`boo-agent-scheduler`.

That test is more valuable than a generic assertion about relationship counts. It preserves the exact
correction. If somebody later decides fuzzy matching was convenient and brings it back under another
name, the test explains which false edge reappeared and why the build should fail.

I want more tests like that in evidence systems. A positive fixture proves the graph can connect two
things. A negative fixture proves it can refuse a plausible-looking lie.

## Retrieval bugs are provenance bugs

It would be easy to classify this as search relevance. Boo showing up for Java is certainly a bad
search result. But the index does more than rank pages. It tells an AI feature which work counts as
support for a claim about a skill. That makes the relationship part of the site's evidence model.

Once I looked at it that way, fuzzy matching was obviously the wrong abstraction. Search can be
approximate because its output is a set of candidates for a person to inspect. Provenance should be
explicit because its output answers a different question: "why does this claim point to this source?"

The correction is small: IDs, aliases, exact matching, and negative tests. The lesson is larger. If a
system presents a relationship as evidence, convenience is not enough reason to create the edge. Make
the identity stable, make the mapping intentional, and test at least one thing the graph must refuse
to claim.

---
title: I turned my portfolio into an MCP server
date: 2026-07-09
updated: 2026-07-09
summary: "A portfolio should not make an agent scrape a page and guess. Mine now publishes the same work as human pages, structured files, a content index, and a small MCP interface, with the limits stated plainly."
tags: ["MCP", "AgenticAI", "SvelteKit", "DataProvenance", "Builder"]
keywords:
  [
    "portfolio-mcp",
    "machine-readable-identity",
    "llms-txt",
    "json-resume",
    "content-index",
    "agent-discovery"
  ]
showTableOfContents: true
links:
  - label: "Try the MCP server"
    url: "https://api.briananderson.xyz/mcp"
    type: "live"
  - label: "Read the agent guide"
    url: "/llms.txt"
    type: "docs"
  - label: "Inspect the content index"
    url: "/content-index.json"
    type: "docs"
---

Most portfolios are built for one reader: a person with a browser. That is still the reader who matters most. But increasingly, the first pass is made by something else: an ATS, a search crawler, a recruiter using an AI assistant, or an agent trying to answer a specific question.

The usual response is to make the HTML easier to scrape. I wanted a cleaner contract. If a machine wants to know what I have built, it should not have to infer a career from CSS and navigation labels. It should be able to ask the portfolio directly.

So this site now has an MCP server.

## One source, several representations

The important design choice was not MCP. It was refusing to create a second, machine-only biography that could drift away from the public site.

The source material remains deliberately boring:

- Markdown for project case studies like [Kontour](/projects/kontour/) and essays like [Make agents prove their facts](/blog/make-agents-prove-their-facts/).
- YAML for the leader, ops, and builder resume variants.
- A small, structured [proof ledger](/proof/) for selected claims and their published sources.

The build validates that material, then turns it into several representations for different readers:

- Normal prerendered pages for people.
- Raw Markdown mirrors for agents that want the actual article or case study body.
- [`llms.txt`](/llms.txt) as a map of the useful machine-readable endpoints, plus [`llms-full.txt`](/llms-full.txt) as a whole-site text archive.
- [`resume.json`](/resume.json) for tools that understand JSON Resume, and [`resume.md`](/resume.md) for tools that want plain text.
- JSON-LD on the human pages for search engines.
- A versioned [`content-index.json`](/content-index.json) that connects skills, experience, projects, and posts.

That gives me one authored fact and several delivery formats, not several facts that happen to sound similar.

## The content index is the real interface

An agent does not need every word on the site for every question. If someone asks whether I have worked with a technology, sending the full resume and every case study to a model would be expensive and noisy.

At build time, the site turns the content into a compact index. Stable skill IDs and explicit aliases connect a skill to the projects or posts that evidence it. Project and blog slugs are validated. The output is content-addressed, so a changed index receives a new immutable filename while a small pointer identifies the current version.

The AI service uses that index through narrow tools: search skills, search projects, fetch a project, search experience, or get a resume summary. Retrieval happens before generation. The model is still probabilistic, but the material it can retrieve comes from the same content a person can inspect on this site.

That distinction matters. A generated answer is not the source. The project page is.

## MCP made the same tools portable

The shared Express implementation and container image expose the MCP endpoint alongside Chat and Fit Finder. Chat and Fit Finder deploy as separate Cloud Run services; the repository alone does not prove which live service the Cloudflare Worker routes `/mcp` to. That provider routing remains external verification, not an architectural fact I can infer from source.

The MCP implementation uses Streamable HTTP and is stateless, which fits an ephemeral, multi-instance runtime: each request gets a fresh MCP server and transport instead of depending on an in-memory session.

The tools are intentionally small:

- `get_resume` returns one of the three public resume variants.
- `search_projects` and `search_skills` query the same content index used by the site assistant.
- `ask_brian` uses the same grounded chat handler.
- `analyze_fit` uses the same Fit Finder path and its structured response.

That reuse is the point. MCP is another doorway into the portfolio, not another implementation of it. The [Trace One Answer](/trace-one-answer/) page maps the request from browser or MCP client through the edge, Cloud Run, content tools, and Gemini.

## What this does not prove

Machine-readable is not the same as trustworthy.

An MCP client can discover a project more reliably than it can by scraping a card, but it can still receive a generated answer that is incomplete. A content index can connect evidence to a skill, but it is only as current as the last successful content build and deployment. A public endpoint also creates a cost and abuse surface, so it sits behind origin verification, bounded input, rate controls, and a kill switch. The repository defines a shared Cloudflare edge contract, but live provider activation is external state and should not be inferred from code alone.

I also do not publish everything I know or everything I have done. This is a curated public dataset, not an identity oracle. Confidential work stays confidential. The MCP server makes the published boundary easier to query; it does not move that boundary.

## Why I think portfolios are heading here

The web page is not going away. It is where voice, judgment, and context live. But the page is becoming one representation among several.

A useful portfolio should let a person browse, let a recruiter parse, let a search engine understand, and let an agent ask a narrow question without inventing the answer from markup. More importantly, all four should land on the same source material.

That is what I mean by a machine-readable identity: not a synthetic version of me for bots, but a stable set of public facts that can be rendered, queried, and traced back to something a human can read.

The endpoint is the flashy part. The durable part is the content model underneath it.

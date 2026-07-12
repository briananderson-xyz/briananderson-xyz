---
title: "CampFit: Denver Kids Camp Discovery"
date: 2026-03-01
updated: 2026-07-12
projectDate: 2026-03-08
period: "2026 – Present"
summary: "A discovery platform that helps Denver parents find and compare kids' camps, built on an AI-driven crawl and extraction pipeline with a human-review layer that decides which data is trustworthy enough to show."
tags: ["FullStack", "AgenticAI", "DataProvenance", "Builder", "SideProject"]
keywords:
  [
    "campfit",
    "camp-discovery",
    "ai-crawl",
    "data-extraction",
    "nextjs",
    "supabase",
    "prisma",
    "data-provenance",
    "trust-review"
  ]
outcome: "Product discovery"
projectType: "Web product"
showTableOfContents: true
links:
  - label: "Live Site"
    url: "https://camp.fit"
    type: "website"
  - label: "GitHub Repository"
    url: "https://github.com/briananderson1222/campfit"
    type: "github"
---

## The Problem

Every Denver parent planning a summer ends up with the same thing: a sprawling spreadsheet of kids' camps, half of it stale, none of it comparable. Registration windows open and close before you have finished reading. I had that spreadsheet too, and I wanted to turn it into something other parents could actually use. The hard part was never the UI. It was trusting the data.

## What I Built

CampFit is a Next.js, Prisma, and Supabase progressive web app where parents can discover, compare, save, and get notified about kids' camps. The part I care about is underneath it.

- **AI-driven crawl and extraction:** camp information lives in hundreds of inconsistent websites, PDFs, and registration portals. I built an agentic pipeline that crawls those sources and extracts structured fields (sessions, ages, pricing, locations, registration dates) into a normalized model, instead of me maintaining a spreadsheet by hand.
- **A trust and review pipeline (the point of the whole thing):** nothing a crawler finds is shown to a parent until it earns it. Data flows through crawl, then extraction, then a proposed field claim, then human review, then an approved value with a public trust signal explaining why it should be believed. The review workbench is where AI-gathered data has to prove itself before another parent relies on it.
- **Domain-driven core:** the codebase is organized around bounded contexts (Camp Discovery, Data Stewardship, and Trust and Review Provenance) with a documented ubiquitous language, so the model stays honest as it grows.
- **A reusable provenance layer:** the review pattern is not camp-specific. It runs on a general provenance layer, which is proof that one trust-and-review approach generalizes across very different kinds of data.
- **Real delivery discipline:** Playwright production smoke tests in CI, architecture decision records, and a freemium model (premium alerts, unlimited saves, calendar export) sketched out on Stripe.

## Why It Matters

CampFit is the human-scale counterweight to my infrastructure work, a real product for real parents in my own city, but it is built on the same conviction I bring to enterprise AI: you do not trust agents, you build systems that make them prove their facts. The fun story is that AI helped assemble a working app in a weekend. The story I actually care about is the crawl-extract-review pipeline that decides which of that AI-gathered data is trustworthy enough to put in front of another parent.

## Takeaways

- A directory is only as good as the trust behind each fact in it, so the review layer is the product, not a nice-to-have.
- The same provenance pattern that vets crawled camp data also vets very different sources, so the approach is domain-agnostic.
- Building for your own community keeps the feedback loop honest.

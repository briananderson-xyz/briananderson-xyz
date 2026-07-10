---
title: Smoke tests are not AI evals
date: 2026-07-09
updated: 2026-07-09
summary: "An endpoint returning 200 proves that it is alive. It does not prove that an AI feature stayed grounded, resisted a prompt extraction attempt, or scored an unrelated role honestly. Those are different gates."
tags: ["AgenticAI", "Evals", "CICD", "DevOps", "Trust"]
keywords:
  ["ai-evals", "smoke-tests", "deployment-gates", "behavior-testing", "rollback", "rate-limits"]
showTableOfContents: true
links:
  - label: "View sanitized eval trends"
    url: "/ai-evals/"
    type: "live"
  - label: "Trace one AI answer"
    url: "/trace-one-answer/"
    type: "article"
  - label: "Read the trust argument"
    url: "/blog/make-agents-prove-their-facts/"
    type: "article"
---

I can deploy an AI endpoint, send it `ping`, get a `200`, and learn almost nothing about whether the feature works.

I learned that distinction while tightening the deployment path for Chat and Fit Finder on this site. The pipeline already had smoke tests. The services started. The routes responded. The browser opened. Those are useful facts, but none of them answer the questions that make an AI feature safe to promote:

- Did the answer stay grounded in my actual experience?
- Did a prompt-extraction attempt get refused without leaking instructions?
- Did a project query return concrete projects instead of polished filler?
- Did Fit Finder distinguish a strong platform role from an unrelated clinical role?

That is eval territory. A smoke test and an eval can call the same endpoint and still prove completely different things.

## A smoke test asks whether the system is there

The Cloud Run deployment jobs warm the Chat and Fit Finder endpoints with small requests. If either service cannot return a successful response after retries, that deployment fails and the workflow redeploys the previously tagged stable image.

The site deployment has its own checks. Playwright exercises the public pages. API smoke tests call the deployed service. Some post-deploy checks are deliberately report-only, while the frontend check controls whether an artifact is marked verified and can trigger a static-site rollback path.

These tests are fast and operational. They catch broken routing, a process that never started, a missing deployment, or a page that no longer renders. They should remain small because they run where quick feedback matters.

They do not inspect the meaning of a model response.

## An eval asks whether the behavior is acceptable

This repository keeps scenario-based Chat and Fit Finder evals. The runner sends real requests and applies explicit assertions to the result. Some checks are deterministic: required text, forbidden text, response shape, score range, or evidence in a tool-backed answer. The fuller suite can also use an optional model judge for qualities that are hard to reduce to one string match.

For production promotion, a small hard-assertion subset runs against the just-deployed development API. It covers five behaviors: a grounded AWS answer, refusal of prompt extraction, a concrete projects response, an evidence-backed strong-role assessment, and an unrelated-role assessment with honest gaps. That gate requires every selected scenario to pass before the production deployment job is eligible to run.

The larger suite remains manually runnable against development, production, or a custom base URL. That is intentional. A small promotion gate protects the critical contract without turning every deploy into an unbounded model experiment; the broader suite gives changes more room to be challenged.

## The gate has to match the claim

This is the rule I use now:

| Check                | What a pass means                                     | What it does not mean                         |
| -------------------- | ----------------------------------------------------- | --------------------------------------------- |
| Process/HTTP smoke   | The service started and a route returned successfully | The response was grounded or useful           |
| Browser smoke        | A key user path rendered and remained operable        | The model behavior was correct                |
| API contract test    | Status codes and response shapes stayed compatible    | A fluent answer was factually supported       |
| Behavior eval        | The selected scenario met its assertions              | Every possible prompt is safe                 |
| Optional model judge | A second model rated a quality against a rubric       | The judgment is deterministic or ground truth |

If the deployment gate only checks availability, I should say it checks availability. If an eval covers five scenarios, I should say five scenarios, not “the AI is verified.” The words around the gate are part of the engineering.

## Rate limits are part of eval design

Public evals are real traffic. This site's repository defines a shared Cloudflare contract of 20 POST requests per 15 minutes for a client/colo key across Chat, Fit Finder, and MCP. The Express service also has a configurable in-memory limit, defaulting to 20 requests per 15 minutes, but that second counter is per Cloud Run instance, not global.

The deployment gate does not use a secret bypass. That is good because it exercises the public path, but it also means the suite has to be deliberately small. A retry policy, tool loop, or several jobs sharing one public identity can consume the same allowance and turn an eval into a rate-limit test by accident.

There is also an evidence boundary here: the shared edge rule is a repository-owned contract whose live Cloudflare activation must be verified separately. Code that describes a provider rule is not proof that the provider is enforcing it.

## Keep the public evidence aggregate-only

Eval reports are useful, but their raw inputs and outputs can contain prompts, generated answers, job descriptions, and judge commentary. None of that belongs on a public portfolio by default.

The public [AI eval page](/ai-evals/) consumes a separate sanitized history format: commit and run identifiers, environment, scenario IDs, and aggregate pass/fail/skip counts. It does not publish prompt text, answer text, pasted job descriptions, or judge reasoning. When there is no trustworthy committed history, the page says the baseline is pending instead of manufacturing a trend line.

That empty state is a feature. A dashboard should not be more confident than its evidence.

## The practical stack

I now think of the checks as layers:

1. Unit and contract tests prove deterministic code around the model.
2. Smoke tests prove the deployed surfaces are reachable.
3. A small behavior suite blocks promotion on critical regressions.
4. A broader eval suite explores more scenarios and optional qualitative judgments.
5. Post-deploy checks prove the public route still works, with rollback where the workflow actually supports it.

No layer replaces the others. Evals do not tell me whether a container can start. A `200` does not tell me whether the answer is honest.

The useful question is never “do we have tests?” It is “what exact failure is each test capable of stopping?”

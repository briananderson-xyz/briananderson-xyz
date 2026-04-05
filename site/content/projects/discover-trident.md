---
title: "Trident Pipeline & Golden Paths"
date: 2023-11-20
summary: "Establishing enterprise platform engineering and CI/CD at financial services scale."
tags: ["DevOps", "PlatformEngineering", "CICD", "Kubernetes", "Governance", "Leader"]
keywords: ["discover", "trident", "golden-paths", "financial-services"]
showTableOfContents: true
---

## The Challenge

**Discover Financial Services** operates at a scale where developer friction has real cost. Thousands of engineers, thousands of microservices, and a regulatory environment where every deployment carries compliance implications. The challenge wasn't just speed. It was building a deployment framework that could move fast *and* satisfy the governance requirements that come with handling financial data at global scale.

I joined as a **Technical Director** leading the integration side of the Trident pipeline, the internal platform that would standardize how Discover's engineering teams shipped software. At peak, the engagement involved over **300 dedicated staff** working to transition **5,000+ applications** onto the new framework, with an estimated **$30M in savings** through reduced operational overhead and standardized tooling.

## What I Built

- **Golden Paths:** Established pre-approved, "best practice" deployment patterns that baked in security and compliance by default. Instead of every team reinventing their deployment process, Golden Paths gave them a proven route that was already cleared by security and compliance, reducing onboarding from weeks to days.
- **Integration Logic:** Built the modular automation and API layers that allowed diverse product teams to onboard onto the Trident framework. Each team had different tech stacks and different requirements, so the integration layer had to be flexible enough to accommodate variation while enforcing the standards that mattered.
- **Kubernetes Abstraction:** Created tooling to simplify the developer experience, moving the focus from "how to deploy" to "what to build." Engineers shouldn't need to be Kubernetes experts to ship reliably.

## Key Outcomes

- **Velocity:** Reduced deployment lead time by **90%** for teams adopting the new pipeline.
- **Scale:** Successfully standardized delivery for hundreds of internal engineering squads across the organization.
- **Reliability:** Improved the security posture by enforcing "compliance-as-code" within every build. In financial services, this isn't optional.

## Lessons Learned

Financial services taught me that governance isn't the enemy of velocity. It's a design constraint. The best platform engineering work doesn't fight compliance requirements, it encodes them. When security and compliance are built into the pipeline itself, teams actually move faster *because* they don't have to think about it.

**Official Case Study:**
- [Valtech: Discover Financial Services](https://www.valtech.com/en-us/work/discover/)

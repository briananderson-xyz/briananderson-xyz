---
title: "Enterprise Cloud Enablement & ICDS"
date: 2023-06-15
summary: "Standardizing GCP infrastructure and CI/CD pipelines at scale."
tags: ["Terraform", "IaC", "GCP", "DevOps", "PlatformEngineering", "Ops"]
keywords: ["gfs", "gordon-food-service", "icds", "cloud-enablement"]
showTableOfContents: true
---

## The Challenge

**Gordon Food Service** is one of the largest foodservice distributors in North America, serving roughly 100,000 customers across the US and Canada. As GFS moved to the cloud, the challenge wasn't just migration, it was standardization. Dozens of product teams needed to provision infrastructure, deploy services, and operate in GCP, but without guardrails the result would be sprawl: inconsistent configurations, security gaps, and duplicated effort across every team.

Off-the-shelf solutions didn't fit. GFS needed something tailored to their governance model, their security requirements, and their pace of growth. That's where **ICDS** came in.

I joined as a **Senior Technical Principal** leading the cloud enablement strategy, designing the platform that every other product team would build on top of.

## What I Built

- **ICDS (Internal Cloud Delivery Services):** This was the core of the engagement. An "internal cloud" framework that gave product teams self-service capabilities while enforcing organizational compliance. Teams could spin up what they needed without waiting on a central ops team, but every resource came pre-configured with security, networking, and monitoring baked in.
- **Infrastructure as Code (IaC):** Developed a comprehensive library of **Terraform** modules to standardize the deployment of GKE clusters, VPC networks, and Cloud SQL instances. These modules became the building blocks that every team used, ensuring consistency without limiting flexibility.
- **Standardized Pipelines:** Built reusable CI/CD templates that integrated security scanning and automated testing into every deployment. Teams didn't have to think about compliance. It was already in the pipeline.

## Key Outcomes

- Reduced environment provisioning time from **weeks to minutes**.
- Ensured **100% compliance** with corporate security standards through automated guardrails.
- Drove a **20% increase** in users ordering 90%+ of their volume online. The infrastructure directly enabled the digital experience.
- The platform became the foundation for the [GFS Ordering Platform](/projects/gfs-ordering-platform), the next phase of the engagement where we built the product that ran on top of this infrastructure.

## The Bigger Picture

ICDS is the kind of project that doesn't always get visibility. Platform engineering rarely does. But everything that followed at GFS, including the ordering platform modernization and its recognition as a Google Cloud Customer Story, was built on top of what we established here.

**Case Study:**
- [Valtech: Data Modernization & Infrastructure](https://www.valtech.com/work/gordon-food-service-data-modernization/)

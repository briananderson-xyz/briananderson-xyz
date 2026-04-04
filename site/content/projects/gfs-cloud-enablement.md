---
title: "Enterprise Cloud Enablement & ICDS"
date: 2023-06-15
summary: "Standardizing GCP infrastructure, CI/CD pipelines, and data consolidation at scale."
tags: ["Terraform", "IaC", "GCP", "DevOps", "PlatformEngineering", "Ops"]
keywords: ["gfs", "gordon-food-service", "icds", "cloud-enablement"]
showTableOfContents: true
links:
  - label: "Valtech Case Study"
    url: "https://www.valtech.com/work/gordon-food-service-data-modernization/"
    type: "case-study"
---

## The Challenge

**Gordon Food Service** is one of the largest foodservice distributors in North America, serving roughly 100,000 customers across the US and Canada. As GFS moved to the cloud, the challenge was twofold: standardizing how dozens of product teams provisioned and deployed infrastructure, and consolidating fragmented data sources that teams had been duplicating independently for core financial workflows.

I joined as a **Senior Technical Principal** leading both the cloud enablement strategy and the data modernization effort.

## What I Built

### Cloud Enablement

- **Infrastructure as Code:** Developed a comprehensive library of **Terraform** modules to standardize the deployment of GKE clusters, VPC networks, and Cloud SQL instances. These modules became the building blocks that every team used, ensuring consistency without limiting flexibility.
- **Standardized Pipelines:** Built reusable CI/CD templates that integrated security scanning and automated testing into every deployment. Teams didn't have to think about compliance. It was already in the pipeline.
- **Self-Service Provisioning:** Established repeatable patterns and infrastructure modules that gave product teams self-service capabilities while enforcing organizational compliance, security, and budgetary guardrails across GitLab, SonarCloud, NexusIQ, and Apigee.

### ICDS (Integrated Consumption Data Store)

- **Data Normalization:** Consolidated fragmented data sources into a centralized **BigQuery** repository using **Dataflow** batch pipelines, replacing multiple one-off data duplication patterns that teams had come to rely on for core financial workflows.
- **Domain Access API Layer:** Built a standardized API layer deployed on **GKE** to provide consistent, governed access to the consolidated data, eliminating the need for teams to maintain their own data copies and dependencies.

## Key Outcomes

- Reduced environment provisioning time from **weeks to minutes**.
- Ensured **100% compliance** with corporate security standards through automated guardrails.
- Drove a **20% increase** in users ordering 90%+ of their volume online. The infrastructure directly enabled the digital experience.
- The platform became the foundation for the [GFS Ordering Platform](/projects/gfs-ordering-platform), the next phase of the engagement where we built the product that ran on top of this infrastructure.

## The Bigger Picture

Platform engineering and data consolidation rarely get visibility. But everything that followed at GFS, including the ordering platform modernization and its recognition as a Google Cloud Customer Story, was built on top of what we established here.

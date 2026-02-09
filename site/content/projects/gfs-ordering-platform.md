---
title: "Global E-commerce Ordering Platform"
date: 2024-01-10
summary: "Modernizing the core ordering engine for a $1B+ food distributor."
tags: ["Architecture", "Ecommerce", "Microservices", "GKE", "Leader"]
keywords: ["gfs", "gordon-food-service", "ordering-platform", "modernization"]
showTableOfContents: true
---

## The Challenge

**Gordon Food Service** serves over 100,000 customers across North America: restaurants, healthcare facilities, schools, and more. Their legacy ordering system was a monolith tied to mainframe-era infrastructure. It worked, but it couldn't keep up. Deployments happened four times a year. Feature requests sat in queues for months. The platform that powered a billion-dollar distribution business was becoming the bottleneck.

I came into this engagement as a **Technical Principal**, leading the product architecture for the new ordering platform. This was the next chapter after spending years building the [cloud infrastructure (ICDS)](/projects/gfs-cloud-enablement) that made this modernization possible. I went from laying the foundation to building on top of it.

## What I Built

- **Microservices Migration:** Led the refactoring of legacy business logic into containerized services running on **Google Kubernetes Engine (GKE)**. Decomposed the monolith into domain-driven services that teams could own and deploy independently.
- **Data Integration:** Built high-performance ingestion layers to sync real-time product availability from mainframe systems to the digital storefront. The ordering system needed to reflect live inventory across distribution centers. Stale data meant lost orders.
- **Reliability:** Implemented advanced caching strategies and circuit breakers to ensure zero-downtime during peak ordering windows. For a food distributor, system outages don't just cost revenue, they disrupt supply chains.

## Key Outcomes

- **Deployment velocity:** From **4 releases per year to 2,920**. Multiple deployments per day became routine.
- **Speed to value:** Feature requests went from months-long backlogs to **production in under 24 hours**.
- **Reliability:** **Zero customer-facing downtime** through the entire migration and beyond.
- **Scale:** The platform supported 100,000+ B2B customers with a mobile-first ordering experience, driving record digital sales during global supply chain disruptions.
- **Canada expansion:** The platform's adoption metrics directly supported GFS's growth, going from a **25% to 96% adoption increase** in Canada.

## Recognition

This work was featured as an official **Google Cloud Customer Story**, highlighting the transformation as a reference architecture for enterprise modernization on GCP.

> "We went from four releases a year to multiple releases a day. That's not just a technology change, that's a culture change."

**Case Studies:**
- [Valtech: Digital Transformation](https://www.valtech.com/en-us/work/gordon-food-service/)
- [Google Cloud Customer Story](https://cloud.google.com/customers/gordon-food-service)

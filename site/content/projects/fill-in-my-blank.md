---
title: Fill In My Blank
date: 2014-01-01
summary: A mobile party game that allowed users to play with friends to create hilarious results using Blanks and Fillers.
tags: ["MobileGame", "iOS", "Android", "Java", "ObjectiveC", "Builder"]
keywords: ["fimb", "party-game", "mobile-app"]
featuredImage: "/projects/fimb/logo.png"
featuredImageAlt: "Fill In My Blank Logo"
---

## Origin

Fill In My Blank started in a classroom. I was a CS major at **UW-Madison** taking a course called "Starting a Software Company," which was half business fundamentals, half build-something-real. Five of us, all CS majors and friends, teamed up with a simple pitch: take the energy of party games like Cards Against Humanity and put it on your phone, playable with friends anywhere.

We built the first version that semester. A **Ruby on Rails** backend with an **Android** app. It worked well enough that we signed up for the class *again* to build the **iOS** version in Objective-C.

## What We Built

**Fill In My Blank** let users play with their friends to create hilarious and often inappropriate results through a combination of *Blanks* and *Fillers*. Real-time multiplayer sessions, cross-platform play between Android and iOS, and custom data synchronization that kept everything in sync.

### Timeline
**September 2012 - January 2014**

### Technical Specs
- **Native Development:** Built from the ground up using **Objective-C** (iOS) and **Java** (Android).
- **Backend:** Ruby on Rails API server handling multiplayer sessions and user data.
- **Architecture:** Real-time multiplayer sessions with custom data synchronization between platforms.

## The Ride

The game found traction fast. We hit **#1 in the Google Play Store** for the "Cards Against Humanity" search term, grew to **500 daily active users** at peak, and scaled to **over 8,000 registered users**. For five college students, that felt like the real thing.

We did real VC pitches as part of the class and secured **$20K in seed funding**. We created an LLC called **Get Weird Games**, hired a designer to give the brand a proper identity. For a brief stretch, we were running a company.

## What I Learned

After graduation, reality set in. The five of us scattered across the country for jobs. One by one, team members got too busy to contribute. Within a year, I was the sole remaining developer, maintaining two native apps and a backend on top of a full-time job.

I tried to simplify. I started rewriting the Ruby on Rails backend to **Facebook Parse** (and was eyeing Node.js) and got most of the way through the migration. Then Facebook announced Parse was shutting down. That was the signal.

Maintaining Android, iOS, and a backend solo while working full-time wasn't sustainable. I'd spent about $5-6K of the funding on design, hosting, and developer accounts. I returned the rest in good faith and dissolved the company.

The technical lessons were real: cross-platform architecture, API design, app store optimization. But the bigger lesson was about building with people. A startup needs sustained commitment, and "we'll work on it on weekends" doesn't survive five people in five cities with five new jobs. That experience shaped how I think about team dynamics, project sustainability, and knowing when to ship versus when to stop.

Fill In My Blank didn't become a company. But it's the reason I call myself a builder.

## Visual Archive
<div class="grid grid-cols-2 md:grid-cols-3 gap-4 not-prose mt-8">
  <div class="border border-skin-border bg-skin-page p-2 rounded-lg">
    <img src="/projects/fimb/home.png" alt="Home Screen" class="w-full h-auto grayscale hover:grayscale-0 transition-all"/>
  </div>
  <div class="border border-skin-border bg-skin-page p-2 rounded-lg">
    <img src="/projects/fimb/my%20game.png" alt="Gameplay" class="w-full h-auto grayscale hover:grayscale-0 transition-all"/>
  </div>
</div>

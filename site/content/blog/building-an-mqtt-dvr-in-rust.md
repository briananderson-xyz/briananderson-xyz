---
title: "Building an MQTT DVR in Rust"
date: 2026-07-09
updated: 2026-07-12
projectDate: 2026-02-09
summary: "A generic MQTT recorder, passthrough, and replay tool that began when I needed three ProveIT demo streams to keep working locally after their remote source went offline."
tags: ["Rust", "MQTT", "SystemsEngineering", "IoT", "Builder"]
keywords:
  [
    "mqtt-recorder",
    "record-replay",
    "embedded-broker",
    "binary-payloads",
    "message-verification",
    "tui"
  ]
showTableOfContents: true
links:
  - label: "mqtt-recorder case study"
    url: "/projects/mqtt-recorder/"
    type: "case-study"
  - label: "mqtt-recorder on GitHub"
    url: "https://github.com/briananderson1222/mqtt-recorder"
    type: "github"
---

The first use case came from the ProveIT demonstration, but the tool itself is a generic MQTT DVR.

We had realistic Unified Namespace data for three simulated factory scenarios, but the remote streams
were not always available when I needed to work locally. I wanted to record a useful slice while they
were online, pass it through during a connected session, and replay it later into my local
[EdgeMind](https://github.com/briananderson1222/EdgeMind) dashboard.

That became [mqtt-recorder](/projects/mqtt-recorder/), a Rust command-line tool with record,
passthrough/mirror, replay, and standalone-broker modes. A basic TUI made those controls easier to
operate during demo development. It was also my first experiment using AI to help build something in
Rust; I have never claimed to have fully learned the language.

## A message is more than its text

An MQTT publish has a topic and payload, but it also has a QoS level, a retain flag, and a position in
time relative to the messages around it. Throw away any of those and the replay can tell a different
story.

mqtt-recorder stores each message as an RFC 4180 CSV row with an ISO 8601 timestamp, topic, payload,
QoS, and retain state. During replay it republishes the original topic, QoS, and retain flag and delays
between messages according to their recorded timestamps. The result is still a simulation, not time
travel, but it preserves more of the protocol behavior than a loop that publishes a list as fast as
possible.

CSV was a pragmatic choice. It is easy to inspect, diff, repair, and feed into other tools. It is also
a text format sitting in front of a protocol that is perfectly happy to carry arbitrary bytes.

## Binary data makes "just use CSV" stop being simple

Treating every payload as UTF-8 would either corrupt binary messages or make the file invalid. Encoding
every payload as base64 would be safe, but it would make ordinary JSON and text traffic miserable to
read.

The recorder splits the difference. Valid UTF-8 without problematic control characters stays
readable. Non-UTF-8 data and payloads with binary control characters are base64-encoded with a `b64:`
marker. There is also an option to encode every payload when a fully uniform representation is more
useful. A byte-oriented reader can use that marker to restore the recorded bytes rather than guessing
whether some innocent text happens to look like base64.

There is an important current limitation behind that distinction. The command's main replay path
reads payloads through the string record type, which converts decoded bytes with a lossy UTF-8 step.
The storage and byte-reader APIs preserve arbitrary bytes, but I do not claim byte-for-byte replay of
every binary payload until the replay path publishes from the byte-oriented record too. Binary safety
has to describe the whole path, not just the file format.

The tool can validate recordings and repair damaged CSV into a separate output file. That matters
because a recording is only useful if failures are visible before a long replay, not halfway through
one.

## Mirroring creates a safer development seam

Replay is useful when I already have a file. Mirror mode is for the live case. It subscribes to the
selected topics on an external MQTT 3.1.1 or v5 broker, republishes them to an embedded v5 broker, and
can record the same stream at the same time. Topic filters can be a single MQTT wildcard or a list
loaded from a file. TLS and certificate authentication cover secured source brokers.

The embedded broker is the important boundary. Local consumers connect to a broker I control rather
than to the source system. I can pause mirroring, switch to playback, or work from a recording without
asking every application to understand the difference.

There is a terminal dashboard for operating that loop: connection state, counters, recording and
playback controls, and an audit log organized by area and severity. I like terminal interfaces for
systems tools because they can expose live state without turning the core into a desktop application.
The same modes still work without the TUI for scripts and automation.

## Verification has to observe the other side

A successful publish call does not prove a subscriber could receive the message from the embedded
broker. It only proves the client accepted the publish operation.

Verify mode adds an independent subscriber on the embedded-broker side. Before mirroring a source
message, the tool queues the expected topic and payload. The verifier then classifies what it observes
as matched, unexpected, or missing and reports a summary at shutdown. The repository includes
integration tests for mirrored traffic and playback through an actual embedded broker.

This is not a formal proof of end-to-end equivalence. Timing, broker configuration, subscriber
behavior, and protocol-version differences can still matter. But observing the output side is a much
stronger check than incrementing a counter beside the publish call.

## Why I tried Rust

The tool has several things happening at once: network event loops, an embedded broker, filesystem
writes, playback timing, terminal rendering, and graceful shutdown. Rust offered a single binary and
clear byte-versus-text boundaries. Building it with AI assistance let me test whether I could make a
useful systems tool in a language I had not fully learned, while the tests and actual demo workflow
kept that experiment grounded.

ProveIT and EdgeMind supplied the motivating use case, not the tool's boundary. mqtt-recorder accepts
arbitrary MQTT inputs and keeps recording, passthrough, and playback independent of any one dashboard
or topic hierarchy. The demo gave me a concrete way to test whether that reusable contract was useful.

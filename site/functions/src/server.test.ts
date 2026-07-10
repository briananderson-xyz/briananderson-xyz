import { test, describe } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createApp } from "./app.js";
import { clientRateLimitKey, markOriginVerified, readRateLimitConfig } from "./rateLimit.js";

interface ResponseResult {
  status: number;
  headers: Headers;
  body: string;
}

async function withServer(run: (baseUrl: string) => Promise<void>): Promise<void> {
  const server: Server = createApp({ windowMs: 60_000, limit: 1 }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address() as AddressInfo;
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function post(
  baseUrl: string,
  path: string,
  body: string,
  headers: Record<string, string> = {}
): Promise<ResponseResult> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body
  });
  return { status: response.status, headers: response.headers, body: await response.text() };
}

async function options(baseUrl: string, path: string, origin: string): Promise<ResponseResult> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "OPTIONS",
    headers: { origin, "access-control-request-method": "POST" }
  });
  return { status: response.status, headers: response.headers, body: await response.text() };
}

describe("CORS preflight", () => {
  test("returns the exact allowlisted origin for production, www, dev, and localhost", async () => {
    await withServer(async (baseUrl) => {
      for (const origin of [
        "https://briananderson.xyz",
        "https://www.briananderson.xyz",
        "https://dev.briananderson.xyz",
        "http://localhost:5173"
      ]) {
        const response = await options(baseUrl, "/chat", origin);
        assert.equal(response.status, 204);
        assert.equal(response.headers.get("access-control-allow-origin"), origin);
      }
    });
  });

  test("never reflects an arbitrary OPTIONS origin", async () => {
    await withServer(async (baseUrl) => {
      const response = await options(baseUrl, "/fit-finder", "https://attacker.example");
      assert.equal(response.status, 204);
      assert.equal(response.headers.get("access-control-allow-origin"), "https://briananderson.xyz");
      assert.notEqual(response.headers.get("access-control-allow-origin"), "https://attacker.example");
    });
  });
});

describe("rate-limit identity and bounds", () => {
  test("normalizes verified Cloudflare and fallback IPv4/IPv6 identities", () => {
    const verified = {
      headers: { "cf-connecting-ip": "2001:db8:abcd:1200::1" },
      ip: "192.0.2.10"
    };
    markOriginVerified(verified as never);
    assert.equal(clientRateLimitKey(verified), "2001:db8:abcd:1200::/56");

    const mappedIpv4 = { headers: {}, ip: "::ffff:192.0.2.10" };
    assert.equal(clientRateLimitKey(mappedIpv4), "192.0.2.10");

    const fallbackIpv6 = { headers: {}, ip: "2001:db8:abcd:12ff::2" };
    assert.equal(clientRateLimitKey(fallbackIpv6), "2001:db8:abcd:1200::/56");
  });

  test("ignores an unverified or malformed Cloudflare identity", () => {
    assert.equal(
      clientRateLimitKey({
        headers: { "cf-connecting-ip": "203.0.113.50" },
        ip: "192.0.2.10"
      }),
      "192.0.2.10"
    );

    const malformed = { headers: { "cf-connecting-ip": "not-an-ip" }, ip: "192.0.2.11" };
    markOriginVerified(malformed as never);
    assert.equal(clientRateLimitKey(malformed), "192.0.2.11");
  });

  test("reads configurable safe values and rejects out-of-bounds settings", () => {
    assert.deepEqual(readRateLimitConfig({ RATE_LIMIT_WINDOW_MS: "30000", RATE_LIMIT_MAX: "75" }), {
      windowMs: 30_000,
      limit: 75
    });
    assert.throws(
      () => readRateLimitConfig({ RATE_LIMIT_WINDOW_MS: "999", RATE_LIMIT_MAX: "20" }),
      /RATE_LIMIT_WINDOW_MS/
    );
    assert.throws(
      () => readRateLimitConfig({ RATE_LIMIT_WINDOW_MS: "1000", RATE_LIMIT_MAX: "1001" }),
      /RATE_LIMIT_MAX/
    );
    assert.throws(
      () => readRateLimitConfig({ RATE_LIMIT_WINDOW_MS: "wat", RATE_LIMIT_MAX: "20" }),
      /RATE_LIMIT_WINDOW_MS/
    );
  });
});

describe("API middleware ordering", () => {
  const originalToken = process.env.ORIGIN_VERIFY_TOKEN;
  const originalNodeEnv = process.env.NODE_ENV;

  test("rejects a spoofed origin before consuming a verified IPv6 rate-limit bucket", async () => {
    process.env.NODE_ENV = "test";
    process.env.ORIGIN_VERIFY_TOKEN = "shared-secret";

    try {
      await withServer(async (baseUrl) => {
        const common = { "cf-connecting-ip": "2001:db8:abcd:1200::1" };
        const spoofed = await post(baseUrl, "/chat", "{}", {
          ...common,
          "x-origin-verify": "wrong-secret"
        });
        assert.equal(spoofed.status, 403);

        const first = await post(baseUrl, "/chat", "{}", {
          ...common,
          "x-origin-verify": "shared-secret"
        });
        assert.equal(first.status, 400);

        const sameSubnet = await post(baseUrl, "/chat", "{}", {
          "cf-connecting-ip": "2001:db8:abcd:12ff::2",
          "x-origin-verify": "shared-secret"
        });
        assert.equal(sameSubnet.status, 429);
        assert.match(sameSubnet.headers.get("content-type") ?? "", /json|text/);
      });
    } finally {
      if (originalToken === undefined) delete process.env.ORIGIN_VERIFY_TOKEN;
      else process.env.ORIGIN_VERIFY_TOKEN = originalToken;
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
    }
  });

  test("preserves the JSON parser 413 response and CORS headers", async () => {
    process.env.NODE_ENV = "test";
    process.env.ORIGIN_VERIFY_TOKEN = "shared-secret";

    try {
      await withServer(async (baseUrl) => {
        const response = await post(
          baseUrl,
          "/fit-finder",
          JSON.stringify({ jobDescription: "x".repeat(70 * 1024) }),
          {
            origin: "https://briananderson.xyz",
            "x-origin-verify": "shared-secret"
          }
        );
        assert.equal(response.status, 413);
        assert.equal(
          response.headers.get("access-control-allow-origin"),
          "https://briananderson.xyz"
        );
      });
    } finally {
      if (originalToken === undefined) delete process.env.ORIGIN_VERIFY_TOKEN;
      else process.env.ORIGIN_VERIFY_TOKEN = originalToken;
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
    }
  });
});

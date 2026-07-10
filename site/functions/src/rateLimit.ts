import { isIP } from "node:net";
import type { Request } from "express";
import { ipKeyGenerator } from "express-rate-limit";

export const DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const DEFAULT_RATE_LIMIT_MAX = 20;

const MIN_WINDOW_MS = 1_000;
const MAX_WINDOW_MS = 60 * 60 * 1000;
const MIN_REQUESTS = 1;
const MAX_REQUESTS = 1_000;

const originVerified = Symbol("originVerified");

type RateLimitRequest = Pick<Request, "headers" | "ip"> & {
  [originVerified]?: true;
};

export interface RateLimitConfig {
  windowMs: number;
  limit: number;
}

function boundedInteger(
  value: string | undefined,
  fallback: number,
  name: string,
  minimum: number,
  maximum: number
): number {
  if (value === undefined || value === "") return fallback;
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return parsed;
}

/**
 * Read the per-instance limiter settings. Invalid or unsafe bounds fail startup
 * instead of silently disabling protection.
 *
 * This limiter uses process memory and therefore limits each Cloud Run instance
 * independently. It is deliberately not described as global enforcement; a
 * shared Cloudflare/edge limiter is required for a service-wide quota.
 */
export function readRateLimitConfig(env: NodeJS.ProcessEnv = process.env): RateLimitConfig {
  return {
    windowMs: boundedInteger(
      env.RATE_LIMIT_WINDOW_MS,
      DEFAULT_RATE_LIMIT_WINDOW_MS,
      "RATE_LIMIT_WINDOW_MS",
      MIN_WINDOW_MS,
      MAX_WINDOW_MS
    ),
    limit: boundedInteger(
      env.RATE_LIMIT_MAX,
      DEFAULT_RATE_LIMIT_MAX,
      "RATE_LIMIT_MAX",
      MIN_REQUESTS,
      MAX_REQUESTS
    )
  };
}

export function markOriginVerified(req: Request): void {
  (req as RateLimitRequest)[originVerified] = true;
}

/**
 * Produce one IPv4/IPv6-safe limiter key. `cf-connecting-ip` is considered
 * only after the origin token middleware marked the request as verified.
 * Malformed/multi-value Cloudflare headers are ignored in favor of Express's
 * proxy-derived IP. Both paths use express-rate-limit's canonical helper,
 * including its default IPv6 /56 grouping and IPv4-mapped normalization.
 */
export function clientRateLimitKey(req: RateLimitRequest): string {
  const cfHeader = req[originVerified] ? req.headers["cf-connecting-ip"] : undefined;
  const cfIp = typeof cfHeader === "string" && isIP(cfHeader) !== 0 ? cfHeader : undefined;
  return ipKeyGenerator(cfIp ?? req.ip ?? "");
}
